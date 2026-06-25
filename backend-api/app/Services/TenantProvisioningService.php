<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\TenantSubscription;
use App\Models\TenantAddon;
use App\Models\TenantProvisioningJob;
use App\Models\TenantLifecycleEvent;
use App\Models\WorkspaceTemplate;
use App\Models\TenantFeatureOverride;
use App\Models\TenantLimitOverride;
use App\Models\User;
use App\Models\Role;
use App\Models\SubscriptionPlan;
use App\Models\Project;
use App\Models\Layout;
use App\Models\Plot;
use App\Models\MeasurementUnit;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Services\AuditLogService;

class TenantProvisioningService
{
    /**
     * Set of allowed transitions.
     */
    public static function isValidTransition(string $oldStatus, string $newStatus): bool
    {
        $allowed = [
            'TRIAL' => ['ACTIVE'],
            'ACTIVE' => ['SUSPENDED', 'CANCELLED', 'EXPIRED'],
            'SUSPENDED' => ['ACTIVE'],
        ];

        if (!isset($allowed[$oldStatus])) {
            return false;
        }

        return in_array($newStatus, $allowed[$oldStatus]);
    }

    /**
     * Create a Tenant with Initial Subscription, Domain, Roles, Permissions, Features, Limits, and optional Demo Data.
     */
    public static function createTenant(array $data, array $context): Tenant
    {
        $jobId = (string) Str::uuid();
        $tenantId = (string) Str::uuid();

        // 1. Pending (Stage 1) - Initialize the Provisioning Job record immediately
        $job = TenantProvisioningJob::create([
            'id' => $jobId,
            'tenant_id' => $tenantId,
            'job_type' => 'CREATE',
            'status' => 'PENDING',
            'current_step' => 'Pending',
            'progress_percent' => 5,
            'started_at' => now(),
            'created_by' => $context['userId'] ?? null,
        ]);

        try {
            // Run all sequential database creation pipeline stages inside a transaction
            $tenant = DB::transaction(function () use ($data, $context, $jobId, $tenantId, $job) {
                
                // 2. Validating (Stage 2)
                $job->update([
                    'current_step' => 'Validating',
                    'progress_percent' => 10,
                ]);

                // Double check uniqueness of codes/domains (avoid overlaps)
                if (Tenant::where('tenant_code', strtolower($data['tenant_code']))->exists()) {
                    throw new \Exception("The workspace code '" . $data['tenant_code'] . "' is already registered.");
                }
                if (TenantDomain::where('domain', strtolower($data['domain']))->exists()) {
                    throw new \Exception("The workspace domain '" . $data['domain'] . "' is already in use.");
                }

                $plan = SubscriptionPlan::find($data['plan_id']);
                if (!$plan) {
                    throw new \Exception("The selected subscription plan does not exist in the catalog.");
                }

                // Resolve workspace template (from Database-driven Workspace Template Engine)
                $templateCode = $data['template_code'] ?? $plan->plan_code;
                $template = WorkspaceTemplate::where('code', strtoupper($templateCode))->first();
                if (!$template) {
                    // Fallback to plan code
                    $template = WorkspaceTemplate::where('code', strtoupper($plan->plan_code))->first();
                }
                if (!$template) {
                    // Ultimate fallback to STARTER template
                    $template = WorkspaceTemplate::where('code', 'STARTER')->first();
                }
                if (!$template) {
                    throw new \Exception("No valid workspace template could be loaded for this configuration.");
                }

                // Administrator parameters
                $adminEmail = $data['admin_email'] ?? ("admin@" . $data['domain']);
                $adminName = $data['admin_name'] ?? "Workspace Administrator";
                $adminPassword = $data['admin_password'] ?? "AdminPassword123!";

                // 3. Creating Workspace (Stage 3)
                $job->update([
                    'current_step' => 'Creating Workspace',
                    'progress_percent' => 20,
                ]);

                $tenantObj = Tenant::create([
                    'id' => $tenantId,
                    'tenant_code' => strtolower($data['tenant_code']),
                    'company_name' => $data['company_name'],
                    'status' => 'ACTIVE', // active parent so router resolves
                    'infrastructure_tier' => $data['infrastructure_tier'] ?? 'SHARED',
                ]);

                // Create primary domain mapping
                $domainObj = TenantDomain::create([
                    'id' => (string) Str::uuid(),
                    'tenant_id' => $tenantId,
                    'domain' => strtolower($data['domain']),
                    'domain_name' => strtolower($data['domain']),
                    'type' => $data['domain_type'] ?? 'SUBDOMAIN',
                    'is_primary' => true,
                    'ssl_status' => 'ACTIVE',
                    'dns_status' => 'ACTIVE',
                    'verified_at' => now(),
                ]);

                // 4. Creating Database Records (Stage 4)
                $job->update([
                    'current_step' => 'Creating Database Records',
                    'progress_percent' => 30,
                ]);

                // Initialize tenant settings and configurations (if template specifies default_settings)
                $defaultSettings = $template->default_settings ?? [];
                foreach ($defaultSettings as $key => $val) {
                    DB::table('saas_platform_settings')->insertOrIgnore([
                        'id' => (string) Str::uuid(),
                        'group_name' => 'GENERAL',
                        'config_key' => strtoupper($key),
                        'config_value' => is_array($val) ? json_encode($val) : strval($val),
                        'field_type' => 'text',
                        'is_public' => true,
                        'is_system' => false,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                // 5. Creating Default Roles (Stage 5)
                $job->update([
                    'current_step' => 'Creating Default Roles',
                    'progress_percent' => 40,
                ]);

                // Locate DEVELOPER_OWNER standard role
                $ownerRole = Role::where('code', 'DEVELOPER_OWNER')->first();
                if (!$ownerRole) {
                    $ownerRole = Role::create([
                        'id' => (string) Str::uuid(),
                        'code' => 'DEVELOPER_OWNER',
                        'name' => 'Developer Owner',
                        'scope' => 'TENANT'
                    ]);
                }

                // Create custom roles mapped in the template if they don't exist
                $templateRoles = $template->roles_permissions ?? [];
                foreach (array_keys($templateRoles) as $rCode) {
                    if (!Role::where('code', $rCode)->exists()) {
                        Role::create([
                            'id' => (string) Str::uuid(),
                            'code' => $rCode,
                            'name' => title_case(str_replace('_', ' ', $rCode)),
                            'scope' => 'TENANT'
                        ]);
                    }
                }

                // 6. Creating Permissions (Stage 6)
                $job->update([
                    'current_step' => 'Creating Permissions',
                    'progress_percent' => 50,
                ]);

                // Verify standard roles have core permissions synced from template roles mapping
                foreach ($templateRoles as $rCode => $permsArray) {
                    $roleObj = Role::where('code', $rCode)->first();
                    if ($roleObj) {
                        foreach ($permsArray as $pCode) {
                            $permObj = DB::table('permissions')->where('code', $pCode)->first();
                            if ($permObj) {
                                DB::table('role_permissions')->insertOrIgnore([
                                    'role_id' => $roleObj->id,
                                    'permission_id' => $permObj->id,
                                ]);
                            }
                        }
                    }
                }

                // 7. Creating Plan (Stage 7)
                $job->update([
                    'current_step' => 'Creating Plan',
                    'progress_percent' => 60,
                ]);

                $subId = (string) Str::uuid();
                $subscriptionObj = TenantSubscription::create([
                    'id' => $subId,
                    'tenant_id' => $tenantId,
                    'plan_id' => $plan->id,
                    'status' => $data['initial_status'] ?? 'TRIAL',
                    'subscription_start_date' => now(),
                    'subscription_expiry_date' => now()->addYear(),
                    'trial_expiry_date' => now()->addDays($plan->trial_days ?? 14),
                    'renewal_date' => now()->addDays($plan->trial_days ?? 14),
                ]);

                // 8. Applying Features (Stage 8)
                $job->update([
                    'current_step' => 'Applying Features',
                    'progress_percent' => 70,
                ]);

                $templateFeatures = $template->features ?? [];
                foreach ($templateFeatures as $fCode => $accessLvl) {
                    $feat = DB::table('saas_features')->where('code', $fCode)->first();
                    if ($feat) {
                        TenantFeatureOverride::create([
                            'id' => (string) Str::uuid(),
                            'tenant_subscription_id' => $subId,
                            'feature_id' => $feat->id,
                            'override_status' => $accessLvl,
                        ]);
                    }
                }

                // 9. Applying Limits (Stage 9)
                $job->update([
                    'current_step' => 'Applying Limits',
                    'progress_percent' => 80,
                ]);

                $templateLimits = $template->limits ?? [];
                foreach ($templateLimits as $limitKey => $limitValue) {
                    TenantLimitOverride::create([
                        'id' => (string) Str::uuid(),
                        'tenant_subscription_id' => $subId,
                        'limit_key' => $limitKey,
                        'override_value' => $limitValue,
                    ]);
                }

                // 10. Installing Default Modules (Stage 10)
                $job->update([
                    'current_step' => 'Installing Default Modules',
                    'progress_percent' => 90,
                ]);

                $templateModules = $template->modules ?? [];
                foreach ($templateModules as $modCode) {
                    TenantLifecycleEvent::create([
                        'id' => (string) Str::uuid(),
                        'tenant_id' => $tenantId,
                        'old_status' => null,
                        'new_status' => 'ACTIVE',
                        'reason' => "Provisioned default module: " . $modCode,
                        'changed_by' => $context['userId'] ?? null,
                        'created_at' => now(),
                    ]);
                }

                // 11. Creating Administrator (Stage 11)
                $job->update([
                    'current_step' => 'Creating Administrator',
                    'progress_percent' => 95,
                ]);

                $adminUser = User::where('email', strtolower($adminEmail))->first();
                if (!$adminUser) {
                    $adminUser = User::create([
                        'id' => (string) Str::uuid(),
                        'name' => $adminName,
                        'email' => strtolower($adminEmail),
                        'password_hash' => Hash::make($adminPassword),
                        'status' => 'ACTIVE',
                    ]);
                }

                // Map administrator to developer owner role
                DB::table('tenant_users')->insertOrIgnore([
                    'tenant_id' => $tenantId,
                    'user_id' => $adminUser->id,
                    'role_id' => $ownerRole->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // 12. Generating Demo Data (Stage 12 - optional)
                $enableDemo = false;
                if (isset($data['enable_demo_data']) && filter_var($data['enable_demo_data'], FILTER_VALIDATE_BOOLEAN)) {
                    $enableDemo = true;
                } elseif (isset($template->seed_data['generate_demo_data']) && $template->seed_data['generate_demo_data']) {
                    $enableDemo = true;
                }

                if ($enableDemo) {
                    $job->update([
                        'current_step' => 'Generating Demo Data',
                        'progress_percent' => 98,
                    ]);

                    // Fetch or generate a layout measurement unit
                    $mUnit = MeasurementUnit::first();
                    if (!$mUnit) {
                        $mUnit = MeasurementUnit::create([
                            'id' => (string) Str::uuid(),
                            'code' => 'SQFT',
                            'name' => 'Square Feet',
                            'symbol' => 'sqft',
                            'conversion_factor_to_sqm' => 0.092903
                        ]);
                    }

                    // Create project
                    $project = Project::create([
                        'id' => (string) Str::uuid(),
                        'tenant_id' => $tenantId,
                        'name' => 'Bhoomi Meadows Enclave',
                        'code' => 'BME-01',
                        'developer_name' => $data['company_name'],
                        'location' => 'Whitefield, Bangalore East',
                        'status' => 'CONSTRUCTION',
                        'rera_number' => 'PRM/KA/RERA/1251/310/PR/230625/005012',
                        'approval_status' => 'APPROVED',
                        'approval_authority' => 'BMRDA',
                        'launch_date' => now()->subMonths(3),
                        'possession_target_date' => now()->addYears(3),
                    ]);

                    // Create layout
                    $layout = Layout::create([
                        'id' => (string) Str::uuid(),
                        'project_id' => $project->id,
                        'name' => 'Phase 1 - Silicon Block',
                        'code' => 'P1-SB',
                        'layout_type' => 'RESIDENTIAL',
                        'approval_number' => 'BMRDA/LA-2026/711',
                        'approval_date' => now()->subMonths(2),
                        'total_area_value' => 180000.00,
                        'total_area_unit_id' => $mUnit->id,
                        'measurement_unit_id' => $mUnit->id,
                        'status' => 'COMPLETED',
                    ]);

                    // Create sample plots
                    $samplePlots = [
                        ['no' => 'Plot-101', 'area' => 1200.00, 'dim' => '30x40', 'status' => 'AVAILABLE', 'facing' => 'NORTH', 'corner' => false],
                        ['no' => 'Plot-102', 'area' => 1500.00, 'dim' => '30x50', 'status' => 'BOOKED', 'facing' => 'EAST', 'corner' => true],
                        ['no' => 'Plot-103', 'area' => 2400.00, 'dim' => '40x60', 'status' => 'AVAILABLE', 'facing' => 'WEST', 'corner' => false],
                    ];

                    foreach ($samplePlots as $p) {
                        Plot::create([
                            'id' => (string) Str::uuid(),
                            'layout_id' => $layout->id,
                            'plot_number' => $p['no'],
                            'area_value' => $p['area'],
                            'measurement_unit_id' => $mUnit->id,
                            'length' => floatval(explode('x', $p['dim'])[0]),
                            'width' => floatval(explode('x', $p['dim'])[1]),
                            'road_width' => 30.00,
                            'corner_plot' => $p['corner'],
                            'facing' => $p['facing'],
                            'dimensions' => $p['dim'],
                            'status' => $p['status'],
                        ]);
                    }

                    // Log demo database generation
                    TenantLifecycleEvent::create([
                        'id' => (string) Str::uuid(),
                        'tenant_id' => $tenantId,
                        'old_status' => null,
                        'new_status' => 'ACTIVE',
                        'reason' => 'Seeded default workspace layout, projects, and plots demo data.',
                        'changed_by' => $context['userId'] ?? null,
                        'created_at' => now(),
                    ]);
                }

                // 13. Completed (Stage 13)
                $job->update([
                    'current_step' => 'Completed',
                    'progress_percent' => 100,
                    'status' => 'SUCCESS',
                    'completed_at' => now(),
                    'duration_seconds' => max(1, now()->diffInSeconds($job->started_at)),
                ]);

                // Log final lifecycle event
                TenantLifecycleEvent::create([
                    'id' => (string) Str::uuid(),
                    'tenant_id' => $tenantId,
                    'old_status' => null,
                    'new_status' => $data['initial_status'] ?? 'TRIAL',
                    'reason' => "Workspace completely provisioned via zero-touch provisioning workflow under " . $plan->name,
                    'changed_by' => $context['userId'] ?? null,
                    'created_at' => now(),
                ]);

                // Audit log
                AuditLogService::log([
                    'tenantId' => $tenantId,
                    'userId' => $context['userId'] ?? null,
                    'entityName' => 'Tenant',
                    'entityId' => $tenantId,
                    'action' => 'TENANT_CREATED',
                    'newValues' => $tenantObj->toArray(),
                    'ipAddress' => $context['ip'] ?? null,
                    'userAgent' => $context['userAgent'] ?? null,
                ]);

                return $tenantObj;
            });

            return $tenant;

        } catch (\Exception $e) {
            // Safely rollback and update job record status to FAILED with traceback
            $job->update([
                'status' => 'FAILED',
                'error_message' => "Error in step '" . $job->current_step . "': " . $e->getMessage() . "\n" . $e->getTraceAsString(),
                'completed_at' => now(),
                'duration_seconds' => max(1, now()->diffInSeconds($job->started_at)),
            ]);

            // Save detailed audit log for the failed provisioning job (Part 9)
            AuditLogService::log([
                'tenantId' => $tenantId,
                'userId' => $context['userId'] ?? null,
                'entityName' => 'TenantProvisioningJob',
                'entityId' => $jobId,
                'action' => 'TENANT_PROVISION_FAILED',
                'newValues' => [
                    'error' => $e->getMessage(),
                    'step' => $job->current_step,
                ],
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            throw $e;
        }
    }

    /**
     * Activate Tenant Subscription.
     */
    public static function activateTenant(string $id, array $context): TenantSubscription
    {
        return DB::transaction(function () use ($id, $context) {
            $sub = TenantSubscription::where('tenant_id', $id)->firstOrFail();
            $oldStatus = $sub->status;

            if ($oldStatus === 'ACTIVE') {
                return $sub; // already active
            }

            if (!self::isValidTransition($oldStatus, 'ACTIVE')) {
                throw new \InvalidArgumentException("INVALID_STATUS_TRANSITION");
            }

            $sub->status = 'ACTIVE';
            $sub->subscription_expiry_date = now()->addYear();
            $sub->renewal_date = now()->addYear();
            $sub->save();

            // Make sure tenant parent is ACTIVE too
            $tenant = Tenant::findOrFail($id);
            $tenant->status = 'ACTIVE';
            $tenant->save();

            // Provisioning Job
            TenantProvisioningJob::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'job_type' => 'ACTIVATE',
                'status' => 'SUCCESS',
                'started_at' => now(),
                'completed_at' => now(),
                'created_by' => $context['userId'] ?? null,
            ]);

            // Lifecycle event
            TenantLifecycleEvent::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'old_status' => $oldStatus,
                'new_status' => 'ACTIVE',
                'reason' => 'Subscribed from trial state',
                'changed_by' => $context['userId'] ?? null,
                'created_at' => now(),
            ]);

            // Audit
            AuditLogService::log([
                'tenantId' => $id,
                'userId' => $context['userId'] ?? null,
                'entityName' => 'TenantSubscription',
                'entityId' => $sub->id,
                'action' => 'TENANT_ACTIVATED',
                'oldValues' => ['status' => $oldStatus],
                'newValues' => ['status' => 'ACTIVE'],
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $sub;
        });
    }

    /**
     * Suspend Tenant.
     */
    public static function suspendTenant(string $id, string $reason, array $context): TenantSubscription
    {
        return DB::transaction(function () use ($id, $reason, $context) {
            $sub = TenantSubscription::where('tenant_id', $id)->firstOrFail();
            $oldStatus = $sub->status;

            if ($oldStatus === 'SUSPENDED') {
                return $sub;
            }

            if (!self::isValidTransition($oldStatus, 'SUSPENDED')) {
                throw new \InvalidArgumentException("INVALID_STATUS_TRANSITION");
            }

            $sub->status = 'SUSPENDED';
            $sub->save();

            // Set parent tenant status to SUSPENDED to lock downstream resolution
            $tenant = Tenant::findOrFail($id);
            $tenant->status = 'SUSPENDED';
            $tenant->save();

            // Job
            TenantProvisioningJob::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'job_type' => 'SUSPEND',
                'status' => 'SUCCESS',
                'started_at' => now(),
                'completed_at' => now(),
                'created_by' => $context['userId'] ?? null,
            ]);

            // Lifecycle event
            TenantLifecycleEvent::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'old_status' => $oldStatus,
                'new_status' => 'SUSPENDED',
                'reason' => $reason ?: 'Standard administrative suspension',
                'changed_by' => $context['userId'] ?? null,
                'created_at' => now(),
            ]);

            // Audit
            AuditLogService::log([
                'tenantId' => $id,
                'userId' => $context['userId'] ?? null,
                'entityName' => 'TenantSubscription',
                'entityId' => $sub->id,
                'action' => 'TENANT_SUSPENDED',
                'oldValues' => ['status' => $oldStatus],
                'newValues' => ['status' => 'SUSPENDED'],
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $sub;
        });
    }

    /**
     * Resume Tenant.
     */
    public static function resumeTenant(string $id, array $context): TenantSubscription
    {
        return DB::transaction(function () use ($id, $context) {
            $sub = TenantSubscription::where('tenant_id', $id)->firstOrFail();
            $oldStatus = $sub->status;

            if ($oldStatus === 'ACTIVE') {
                return $sub;
            }

            if (!self::isValidTransition($oldStatus, 'ACTIVE')) {
                throw new \InvalidArgumentException("INVALID_STATUS_TRANSITION");
            }

            $sub->status = 'ACTIVE';
            $sub->save();

            // Restore parent tenant to ACTIVE
            $tenant = Tenant::findOrFail($id);
            $tenant->status = 'ACTIVE';
            $tenant->save();

            // Job
            TenantProvisioningJob::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'job_type' => 'RESUME',
                'status' => 'SUCCESS',
                'started_at' => now(),
                'completed_at' => now(),
                'created_by' => $context['userId'] ?? null,
            ]);

            // Lifecycle event
            TenantLifecycleEvent::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'old_status' => $oldStatus,
                'new_status' => 'ACTIVE',
                'reason' => 'Administrative subscription reactivation',
                'changed_by' => $context['userId'] ?? null,
                'created_at' => now(),
            ]);

            // Audit
            AuditLogService::log([
                'tenantId' => $id,
                'userId' => $context['userId'] ?? null,
                'entityName' => 'TenantSubscription',
                'entityId' => $sub->id,
                'action' => 'TENANT_RESUMED',
                'oldValues' => ['status' => $oldStatus],
                'newValues' => ['status' => 'ACTIVE'],
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $sub;
        });
    }

    /**
     * Cancel Tenant.
     */
    public static function cancelTenant(string $id, string $reason, array $context): TenantSubscription
    {
        return DB::transaction(function () use ($id, $reason, $context) {
            $sub = TenantSubscription::where('tenant_id', $id)->firstOrFail();
            $oldStatus = $sub->status;

            if ($oldStatus === 'CANCELLED') {
                return $sub;
            }

            if (!self::isValidTransition($oldStatus, 'CANCELLED')) {
                throw new \InvalidArgumentException("INVALID_STATUS_TRANSITION");
            }

            $sub->status = 'CANCELLED';
            $sub->save();

            // Deactivate resolver scope
            $tenant = Tenant::findOrFail($id);
            $tenant->status = 'SUSPENDED'; // block resolution completely
            $tenant->save();

            // Job
            TenantProvisioningJob::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'job_type' => 'CANCEL',
                'status' => 'SUCCESS',
                'started_at' => now(),
                'completed_at' => now(),
                'created_by' => $context['userId'] ?? null,
            ]);

            // Lifecycle event
            TenantLifecycleEvent::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'old_status' => $oldStatus,
                'new_status' => 'CANCELLED',
                'reason' => $reason ?: 'Standard tenant cancellation request',
                'changed_by' => $context['userId'] ?? null,
                'created_at' => now(),
            ]);

            // Audit
            AuditLogService::log([
                'tenantId' => $id,
                'userId' => $context['userId'] ?? null,
                'entityName' => 'TenantSubscription',
                'entityId' => $sub->id,
                'action' => 'TENANT_CANCELLED',
                'oldValues' => ['status' => $oldStatus],
                'newValues' => ['status' => 'CANCELLED'],
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $sub;
        });
    }

    /**
     * Change Plan.
     */
    public static function changePlan(string $id, string $planId, array $context): TenantSubscription
    {
        return DB::transaction(function () use ($id, $planId, $context) {
            $sub = TenantSubscription::where('tenant_id', $id)->firstOrFail();
            $oldPlanId = $sub->plan_id;

            if ($oldPlanId === $planId) {
                return $sub;
            }

            $sub->plan_id = $planId;
            $sub->save();

            // Job
            TenantProvisioningJob::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'job_type' => 'CHANGE_PLAN',
                'status' => 'SUCCESS',
                'started_at' => now(),
                'completed_at' => now(),
                'created_by' => $context['userId'] ?? null,
            ]);

            // Audit
            AuditLogService::log([
                'tenantId' => $id,
                'userId' => $context['userId'] ?? null,
                'entityName' => 'TenantSubscription',
                'entityId' => $sub->id,
                'action' => 'PLAN_CHANGED',
                'oldValues' => ['plan_id' => $oldPlanId],
                'newValues' => ['plan_id' => $planId],
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $sub;
        });
    }

    /**
     * Assign Addon.
     */
    public static function assignAddon(string $id, string $addonId, array $context): TenantAddon
    {
        return DB::transaction(function () use ($id, $addonId, $context) {
            $sub = TenantSubscription::where('tenant_id', $id)->firstOrFail();

            $addon = TenantAddon::updateOrCreate([
                'tenant_subscription_id' => $sub->id,
                'addon_id' => $addonId,
            ], [
                'id' => (string) Str::uuid(),
                'assigned_at' => now(),
            ]);

            // Job
            TenantProvisioningJob::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'job_type' => 'ASSIGN_ADDON',
                'status' => 'SUCCESS',
                'started_at' => now(),
                'completed_at' => now(),
                'created_by' => $context['userId'] ?? null,
            ]);

            // Audit
            AuditLogService::log([
                'tenantId' => $id,
                'userId' => $context['userId'] ?? null,
                'entityName' => 'TenantAddon',
                'entityId' => $addon->id,
                'action' => 'ADDON_ASSIGNED',
                'newValues' => ['addon_id' => $addonId],
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $addon;
        });
    }

    /**
     * Remove Addon.
     */
    public static function removeAddon(string $id, string $addonId, array $context): void
    {
        DB::transaction(function () use ($id, $addonId, $context) {
            $sub = TenantSubscription::where('tenant_id', $id)->firstOrFail();
            
            $addon = TenantAddon::where('tenant_subscription_id', $sub->id)
                ->where('addon_id', $addonId)
                ->first();

            if ($addon) {
                $addonIdSaved = $addon->id;
                $addon->delete();

                // Job
                TenantProvisioningJob::create([
                    'id' => (string) Str::uuid(),
                    'tenant_id' => $id,
                    'job_type' => 'REMOVE_ADDON',
                    'status' => 'SUCCESS',
                    'started_at' => now(),
                    'completed_at' => now(),
                    'created_by' => $context['userId'] ?? null,
                ]);

                // Audit
                AuditLogService::log([
                    'tenantId' => $id,
                    'userId' => $context['userId'] ?? null,
                    'entityName' => 'TenantAddon',
                    'entityId' => $addonIdSaved,
                    'action' => 'ADDON_REMOVED',
                    'oldValues' => ['addon_id' => $addonId],
                    'ipAddress' => $context['ip'] ?? null,
                    'userAgent' => $context['userAgent'] ?? null,
                ]);
            }
        });
    }

    /**
     * Attach Domain.
     */
    public static function attachDomain(string $id, string $domainName, string $type, array $context): TenantDomain
    {
        return DB::transaction(function () use ($id, $domainName, $type, $context) {
            // Check if subdomain / custom domain exists
            $exists = TenantDomain::where('domain_name', strtolower($domainName))
                ->orWhere('domain', strtolower($domainName))
                ->exists();

            if ($exists) {
                throw new \InvalidArgumentException("DOMAIN_ALREADY_EXISTS");
            }

            $domain = TenantDomain::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'domain' => strtolower($domainName),
                'domain_name' => strtolower($domainName),
                'type' => strtoupper($type),
                'is_primary' => false,
                'ssl_status' => 'PENDING',
                'dns_status' => 'PENDING',
                'verified_at' => null,
            ]);

            // Job
            TenantProvisioningJob::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'job_type' => 'ATTACH_DOMAIN',
                'status' => 'SUCCESS',
                'started_at' => now(),
                'completed_at' => now(),
                'created_by' => $context['userId'] ?? null,
            ]);

            // Audit
            AuditLogService::log([
                'tenantId' => $id,
                'userId' => $context['userId'] ?? null,
                'entityName' => 'TenantDomain',
                'entityId' => $domain->id,
                'action' => 'DOMAIN_ATTACHED',
                'newValues' => ['domain' => $domainName, 'type' => $type],
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $domain;
        });
    }
}
