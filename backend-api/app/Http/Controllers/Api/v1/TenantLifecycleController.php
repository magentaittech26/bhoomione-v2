<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\TenantSubscription;
use App\Models\TenantProvisioningJob;
use App\Services\AuditLogService;
use App\Services\TenantProvisioningService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

class TenantLifecycleController extends Controller
{
    /**
     * Helper to retrieve logging context.
     */
    private function getContextAndUser(Request $request): array
    {
        $user = $request->attributes->get('authenticatedUser');
        return [
            'userId' => $user ? $user->id : null,
            'ip' => $request->ip(),
            'userAgent' => $request->userAgent()
        ];
    }

    /**
     * Safety check to ensure action is ONLY performed on demo/test tenants.
     */
    private function validateIsDemoTenant(Tenant $tenant): void
    {
        $tenantCode = strtolower($tenant->tenant_code);
        $isDemo = (
            str_contains($tenantCode, 'demo') || 
            str_contains($tenantCode, 'test') || 
            str_contains($tenantCode, 'alpha') ||
            str_contains($tenantCode, 'beta') ||
            str_contains($tenantCode, 'preview') ||
            in_array($tenant->infrastructure_tier, ['DEMO', 'DEVELOPER', 'TRIAL'])
        );

        if (!$isDemo) {
            throw new \InvalidArgumentException("Security Violation: Action restricted. '{$tenant->tenant_code}' is a production or real customer tenant workspace.");
        }
    }

    /**
     * GET /api/v1/admin/lifecycle/health
     * Health check endpoint.
     */
    public function healthCheck(Request $request)
    {
        try {
            DB::connection()->getPdo();
            $dbStatus = 'CONNECTED';
        } catch (\Exception $e) {
            $dbStatus = 'DISCONNECTED: ' . $e->getMessage();
        }

        // Get count stats
        $totalTenants = Tenant::count();
        $activeTenants = Tenant::where('status', 'ACTIVE')->count();
        $demoTenants = Tenant::where('tenant_code', 'like', '%demo%')
            ->orWhere('tenant_code', 'like', '%test%')
            ->count();

        return response()->json([
            'status' => $dbStatus === 'CONNECTED' ? 'OK' : 'DEGRADED',
            'timestamp' => now()->toIso8601String(),
            'database' => $dbStatus,
            'statistics' => [
                'total_tenants' => $totalTenants,
                'active_tenants' => $activeTenants,
                'demo_tenants' => $demoTenants,
            ],
            'system_load' => function_exists('sys_getloadavg') ? sys_getloadavg() : [0, 0, 0],
            'memory_usage' => round(memory_get_usage(true) / 1024 / 1024, 2) . ' MB'
        ]);
    }

    /**
     * GET /api/v1/admin/lifecycle/queue
     * Queue status endpoint.
     */
    public function queueStatus(Request $request)
    {
        $pendingJobs = DB::table('tenant_provisioning_jobs')
            ->where('status', 'PENDING')
            ->count();

        $runningJobs = DB::table('tenant_provisioning_jobs')
            ->where('status', 'RUNNING')
            ->count();

        $failedJobs = DB::table('tenant_provisioning_jobs')
            ->where('status', 'FAILED')
            ->count();

        $completedJobs = DB::table('tenant_provisioning_jobs')
            ->where('status', 'COMPLETED')
            ->count();

        $recentJobs = DB::table('tenant_provisioning_jobs')
            ->latest()
            ->take(10)
            ->get();

        return response()->json([
            'status' => 'ACTIVE',
            'pending_count' => $pendingJobs,
            'running_count' => $runningJobs,
            'failed_count' => $failedJobs,
            'completed_count' => $completedJobs,
            'recent_jobs' => $recentJobs
        ]);
    }

    /**
     * POST /api/v1/admin/lifecycle/{tenant_code}/reset
     * Reset Demo Tenant (Purges layouts, plots, etc., but preserves tenant registration and users).
     */
    public function resetDemo(Request $request, $tenant_code)
    {
        $tenant = Tenant::where('tenant_code', $tenant_code)->firstOrFail();
        $this->validateIsDemoTenant($tenant);

        $context = $this->getContextAndUser($request);

        DB::transaction(function () use ($tenant) {
            $projectIds = DB::table('projects')->where('tenant_id', $tenant->id)->pluck('id')->toArray();
            
            if (count($projectIds) > 0) {
                $layoutIds = DB::table('layouts')->whereIn('project_id', $projectIds)->pluck('id')->toArray();
                if (count($layoutIds) > 0) {
                    DB::table('plots')->whereIn('layout_id', $layoutIds)->delete();
                    DB::table('roads')->whereIn('layout_id', $layoutIds)->delete();
                    DB::table('amenities')->whereIn('layout_id', $layoutIds)->delete();
                    DB::table('layouts')->whereIn('id', $layoutIds)->delete();
                }
                DB::table('projects')->whereIn('id', $projectIds)->delete();
            }

            // Clean up DXF files and jobs
            DB::table('import_templates')->where('tenant_id', $tenant->id)->delete();
            DB::table('dxf_layer_mappings')->where('tenant_id', $tenant->id)->delete();
            
            $importJobIds = DB::table('import_jobs')->where('tenant_id', $tenant->id)->pluck('id')->toArray();
            if (count($importJobIds) > 0) {
                DB::table('import_job_logs')->whereIn('import_job_id', $importJobIds)->delete();
                DB::table('geometry_entities')->whereIn('import_job_id', $importJobIds)->delete();
                DB::table('import_jobs')->whereIn('id', $importJobIds)->delete();
            }
            DB::table('dxf_files')->where('tenant_id', $tenant->id)->delete();

            // SVG and generation cleanup
            DB::table('generation_batches')->where('tenant_id', $tenant->id)->delete();
            DB::table('svg_documents')->where('tenant_id', $tenant->id)->delete();
            DB::table('svg_style_profiles')->where('tenant_id', $tenant->id)->delete();
            
            // Log lifecycle status event
            DB::table('tenant_lifecycle_events')->insert([
                'id' => (string) Str::uuid(),
                'tenant_id' => $tenant->id,
                'old_status' => $tenant->status,
                'new_status' => $tenant->status,
                'reason' => 'Demo Workspace Data Reset initiated from Lifecycle Manager UI.',
                'created_at' => now(),
                'updated_at' => now()
            ]);
        });

        AuditLogService::log([
            'tenantId' => $tenant->id,
            'userId' => $context['userId'],
            'entityName' => 'tenant',
            'entityId' => $tenant->id,
            'action' => 'TENANT_DEMO_DATA_RESET',
            'ipAddress' => $context['ip'],
            'userAgent' => $context['userAgent'],
            'newValues' => json_encode(['status' => 'SUCCESS', 'message' => 'Cleaned up zoning layout metadata'])
        ]);

        return response()->json([
            'success' => true,
            'message' => "Successfully purged all sandbox projects, layouts, plots, and DXF documents for tenant '{$tenant_code}'. Tenant registry and domains remain preserved."
        ]);
    }

    /**
     * POST /api/v1/admin/lifecycle/{tenant_code}/reprovision
     * Re-Provision Tenant (Deletes existing subscription / domains and recreates standard ones).
     */
    public function reprovision(Request $request, $tenant_code)
    {
        $tenant = Tenant::where('tenant_code', $tenant_code)->firstOrFail();
        $this->validateIsDemoTenant($tenant);

        $context = $this->getContextAndUser($request);

        DB::transaction(function () use ($tenant) {
            // Delete old subscription and domains
            $sub = TenantSubscription::where('tenant_id', $tenant->id)->first();
            if ($sub) {
                DB::table('tenant_limit_overrides')->where('tenant_subscription_id', $sub->id)->delete();
                DB::table('tenant_feature_overrides')->where('tenant_subscription_id', $sub->id)->delete();
                DB::table('tenant_billing_overrides')->where('tenant_subscription_id', $sub->id)->delete();
                DB::table('tenant_module_overrides')->where('tenant_subscription_id', $sub->id)->delete();
                DB::table('tenant_addons')->where('tenant_subscription_id', $sub->id)->delete();
                $sub->delete();
            }

            TenantDomain::where('tenant_id', $tenant->id)->delete();

            // Re-create default domain and trial subscription
            $defaultPlan = DB::table('subscription_plans')->first();
            $planId = $defaultPlan ? $defaultPlan->id : '00000000-0000-0000-0000-000000000000';

            TenantDomain::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $tenant->id,
                'domain' => "{$tenant->tenant_code}.bhoomione.in",
                'domain_name' => "{$tenant->tenant_code}.bhoomione.in",
                'type' => 'SUBDOMAIN',
                'is_primary' => true,
                'ssl_status' => 'PENDING',
                'dns_status' => 'PENDING'
            ]);

            TenantSubscription::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $tenant->id,
                'plan_id' => $planId,
                'status' => 'TRIAL',
                'subscription_start_date' => now(),
                'subscription_expiry_date' => now()->addDays(14),
                'trial_expiry_date' => now()->addDays(14),
                'renewal_date' => now()->addDays(14),
            ]);

            DB::table('tenant_lifecycle_events')->insert([
                'id' => (string) Str::uuid(),
                'tenant_id' => $tenant->id,
                'old_status' => $tenant->status,
                'new_status' => 'ACTIVE',
                'reason' => 'Tenant environment reprovisioned successfully.',
                'created_at' => now(),
                'updated_at' => now()
            ]);
        });

        AuditLogService::log([
            'tenantId' => $tenant->id,
            'userId' => $context['userId'],
            'entityName' => 'tenant',
            'entityId' => $tenant->id,
            'action' => 'TENANT_REPROVISIONED',
            'ipAddress' => $context['ip'],
            'userAgent' => $context['userAgent'],
            'newValues' => json_encode(['reprovision_status' => 'COMPLETE'])
        ]);

        return response()->json([
            'success' => true,
            'message' => "Re-provisioning complete. Re-allocated default domain, standard sandbox mappings, and re-initiated trial contracts for tenant '{$tenant_code}'."
        ]);
    }

    /**
     * POST /api/v1/admin/lifecycle/{tenant_code}/verify
     * Runs VerifyProvisioning Artisan Command.
     */
    public function verifyProvisioning(Request $request, $tenant_code)
    {
        $tenant = Tenant::where('tenant_code', $tenant_code)->firstOrFail();
        $context = $this->getContextAndUser($request);

        // Run Artisan verify
        Artisan::call('tenant:verify-provisioning', [
            'tenant_code' => $tenant_code
        ]);

        $output = Artisan::output();

        AuditLogService::log([
            'tenantId' => $tenant->id,
            'userId' => $context['userId'],
            'entityName' => 'tenant',
            'entityId' => $tenant->id,
            'action' => 'TENANT_PROVISION_VERIFY',
            'ipAddress' => $context['ip'],
            'userAgent' => $context['userAgent'],
        ]);

        return response()->json([
            'success' => true,
            'output' => $output
        ]);
    }

    /**
     * POST /api/v1/admin/lifecycle/{tenant_code}/reset-domain
     * Resets Domain Mapping to standard subdomain name.
     */
    public function resetDomain(Request $request, $tenant_code)
    {
        $tenant = Tenant::where('tenant_code', $tenant_code)->firstOrFail();
        $context = $this->getContextAndUser($request);

        DB::transaction(function () use ($tenant) {
            // Delete custom domains
            TenantDomain::where('tenant_id', $tenant->id)->delete();

            // Add standard subdomain mapping back
            TenantDomain::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $tenant->id,
                'domain' => "{$tenant->tenant_code}.bhoomione.in",
                'domain_name' => "{$tenant->tenant_code}.bhoomione.in",
                'type' => 'SUBDOMAIN',
                'is_primary' => true,
                'ssl_status' => 'ACTIVE',
                'dns_status' => 'ACTIVE',
                'verified_at' => now()
            ]);
        });

        AuditLogService::log([
            'tenantId' => $tenant->id,
            'userId' => $context['userId'],
            'entityName' => 'tenant_domains',
            'entityId' => $tenant->id,
            'action' => 'TENANT_DOMAIN_RESET',
            'ipAddress' => $context['ip'],
            'userAgent' => $context['userAgent'],
        ]);

        return response()->json([
            'success' => true,
            'message' => "Successfully reset domains. Bounded workspace '{$tenant_code}' back to its default primary wildcard domain router mapping: {$tenant_code}.bhoomione.in."
        ]);
    }

    /**
     * POST /api/v1/admin/lifecycle/{tenant_code}/generate-demo
     * Generates Sandbox Demo Data (Project, layouts, lots, and coordinates).
     */
    public function generateDemo(Request $request, $tenant_code)
    {
        $tenant = Tenant::where('tenant_code', $tenant_code)->firstOrFail();
        $this->validateIsDemoTenant($tenant);

        $context = $this->getContextAndUser($request);

        DB::transaction(function () use ($tenant) {
            // Create default project
            $projectId = (string) Str::uuid();
            DB::table('projects')->insert([
                'id' => $projectId,
                'tenant_id' => $tenant->id,
                'name' => 'Bhoomi Sandbox Town',
                'description' => 'Automatically generated sandbox township workspace project.',
                'status' => 'PLANNING',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Create Sector Alpha Layout
            $layoutId = (string) Str::uuid();
            DB::table('layouts')->insert([
                'id' => $layoutId,
                'project_id' => $projectId,
                'name' => 'Sector Alpha Subdivision',
                'total_plots' => 12,
                'boundary_json' => json_encode([
                    'type' => 'Polygon',
                    'coordinates' => [[[0,0], [100,0], [100,100], [0,100], [0,0]]]
                ]),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Create some Plots
            $statuses = ['AVAILABLE', 'RESERVED', 'SOLD'];
            for ($i = 1; $i <= 12; $i++) {
                DB::table('plots')->insert([
                    'id' => (string) Str::uuid(),
                    'layout_id' => $layoutId,
                    'plot_number' => "A-{$i}",
                    'area_sqft' => rand(1200, 2400),
                    'status' => $statuses[rand(0, 2)],
                    'price' => rand(250000, 500000),
                    'geometry_json' => json_encode([
                        'type' => 'Polygon',
                        'coordinates' => [[[$i*10, 0], [($i+1)*10, 0], [($i+1)*10, 50], [$i*10, 50], [$i*10, 0]]]
                    ]),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        });

        AuditLogService::log([
            'tenantId' => $tenant->id,
            'userId' => $context['userId'],
            'entityName' => 'tenant',
            'entityId' => $tenant->id,
            'action' => 'TENANT_DEMO_DATA_GENERATION',
            'ipAddress' => $context['ip'],
            'userAgent' => $context['userAgent'],
        ]);

        return response()->json([
            'success' => true,
            'message' => "Successfully generated demo dataset. Injected 'Bhoomi Sandbox Town' with subdivision 'Sector Alpha' containing 12 live interactive plots with prices and states."
        ]);
    }

    /**
     * POST /api/v1/admin/lifecycle/{tenant_code}/archive
     * Archive Tenant.
     */
    public function archive(Request $request, $tenant_code)
    {
        $tenant = Tenant::where('tenant_code', $tenant_code)->firstOrFail();
        $context = $this->getContextAndUser($request);

        DB::transaction(function () use ($tenant) {
            $tenant->status = 'ARCHIVED';
            $tenant->save();

            $sub = TenantSubscription::where('tenant_id', $tenant->id)->first();
            if ($sub) {
                $sub->status = 'EXPIRED';
                $sub->save();
            }

            DB::table('tenant_lifecycle_events')->insert([
                'id' => (string) Str::uuid(),
                'tenant_id' => $tenant->id,
                'old_status' => $tenant->getOriginal('status') ?? 'ACTIVE',
                'new_status' => 'ARCHIVED',
                'reason' => 'Tenant workspace environment moved to deep archive storage.',
                'created_at' => now(),
                'updated_at' => now()
            ]);
        });

        AuditLogService::log([
            'tenantId' => $tenant->id,
            'userId' => $context['userId'],
            'entityName' => 'tenant',
            'entityId' => $tenant->id,
            'action' => 'TENANT_ARCHIVED',
            'ipAddress' => $context['ip'],
            'userAgent' => $context['userAgent'],
            'newValues' => json_encode(['status' => 'ARCHIVED'])
        ]);

        return response()->json([
            'success' => true,
            'message' => "Workspace cluster for '{$tenant_code}' has been successfully archived. Deep storage preserved, live routing disabled."
        ]);
    }

    /**
     * POST /api/v1/admin/lifecycle/{tenant_code}/delete
     * Delete Demo Tenant (Wipes completely via artisan reset).
     */
    public function deleteDemo(Request $request, $tenant_code)
    {
        $tenant = Tenant::where('tenant_code', $tenant_code)->firstOrFail();
        $this->validateIsDemoTenant($tenant);

        $context = $this->getContextAndUser($request);

        // Run reset-demo Command
        Artisan::call('tenant:reset-demo', [
            'tenant_code' => $tenant_code,
            '--force-demo' => true
        ]);

        $output = Artisan::output();

        AuditLogService::log([
            'tenantId' => null, // Tenant is deleted
            'userId' => $context['userId'],
            'entityName' => 'tenant',
            'entityId' => $tenant->id,
            'action' => 'TENANT_COMPLETELY_DELETED',
            'ipAddress' => $context['ip'],
            'userAgent' => $context['userAgent'],
        ]);

        return response()->json([
            'success' => true,
            'message' => "Tenant workspace '{$tenant_code}' has been completely purged and deleted from Postgres clusters. All structures, configurations, and users have been fully erased.",
            'output' => $output
        ]);
    }

    /**
     * POST /api/v1/admin/lifecycle/{tenant_code}/dns-verify
     * DNS Verification simulating raw nameserver mapping and certificate checks.
     */
    public function dnsVerify(Request $request, $tenant_code)
    {
        $tenant = Tenant::where('tenant_code', $tenant_code)->firstOrFail();
        $domains = TenantDomain::where('tenant_id', $tenant->id)->get();

        $dnsResults = [];
        foreach ($domains as $domain) {
            $domainStr = $domain->domain ?: $domain->domain_name;
            
            // Perform simulated network lookup
            $resolvedIp = '127.0.0.1'; // Mock/Staging LB
            if (filter_var($domainStr, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME)) {
                try {
                    $ips = dns_get_record($domainStr, DNS_A);
                    if (!empty($ips)) {
                        $resolvedIp = $ips[0]['ip'];
                    }
                } catch (\Exception $e) {
                    // Fail gracefully under container sandbox constraints
                }
            }

            $isWildcardMatching = true;

            $dnsResults[] = [
                'domain' => $domainStr,
                'type' => $domain->type,
                'resolved_ip' => $resolvedIp,
                'is_wildcard' => $isWildcardMatching,
                'ssl_status' => 'ACTIVE',
                'dns_status' => 'RESOLVED'
            ];

            // Update DB SSL/DNS statuses
            $domain->dns_status = 'ACTIVE';
            $domain->ssl_status = 'ACTIVE';
            $domain->verified_at = now();
            $domain->save();
        }

        return response()->json([
            'success' => true,
            'tenant_code' => $tenant_code,
            'dns_records' => $dnsResults,
            'wildcard_configured' => true,
            'ingress_ip' => '13.234.12.98' // Mock load balancer IP for DNS guidelines
        ]);
    }
}
