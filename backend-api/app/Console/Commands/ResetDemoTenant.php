<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Tenant;
use App\Models\User;

class ResetDemoTenant extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenant:reset-demo 
                            {tenant_code : The unique code/subdomain of the tenant to reset}
                            {--force-demo : Force execution on non-demo named tenants}
                            {--dry-run : Print records to be deleted without modifying the database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Safely resets and deletes a demo or stale tenant and all its associated metadata, configurations, and records in FK-safe order.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tenantCode = strtolower($this->argument('tenant_code'));
        $dryRun = $this->option('dry-run');
        $forceDemo = $this->option('force-demo');

        // Locate Tenant
        $tenant = Tenant::where('tenant_code', $tenantCode)->first();

        if (!$tenant) {
            $this->error("Error: Tenant with code '{$tenantCode}' not found.");
            return 1;
        }

        // Safety check for production/active real tenants
        $isDemo = (
            str_contains($tenantCode, 'demo') || 
            str_contains($tenantCode, 'test') || 
            str_contains($tenantCode, 'alpha') ||
            str_contains($tenantCode, 'beta') ||
            str_contains($tenantCode, 'preview') ||
            in_array($tenant->infrastructure_tier, ['DEMO', 'DEVELOPER', 'TRIAL'])
        );

        if (!$isDemo && !$forceDemo) {
            $this->error("Error: Refusing to reset an active/production real tenant ({$tenantCode}).");
            $this->line("Infrastructure Tier: {$tenant->infrastructure_tier}");
            $this->line("Status: {$tenant->status}");
            $this->line("If you are absolutely certain you want to proceed with this reset, re-run with --force-demo option.");
            return 1;
        }

        // Gather all related counts
        $domains = DB::table('tenant_domains')->where('tenant_id', $tenant->id)->get();
        $tenantUsers = DB::table('tenant_users')->where('tenant_id', $tenant->id)->get();

        // Trace orphaned users
        $orphanedUsers = [];
        foreach ($tenantUsers as $tu) {
            $otherTenantsCount = DB::table('tenant_users')
                ->where('user_id', $tu->user_id)
                ->where('tenant_id', '!=', $tenant->id)
                ->count();
            $globalRolesCount = DB::table('user_roles')
                ->where('user_id', $tu->user_id)
                ->count();

            if ($otherTenantsCount === 0 && $globalRolesCount === 0) {
                $userObj = DB::table('users')->where('id', $tu->user_id)->first();
                if ($userObj) {
                    $orphanedUsers[] = $userObj;
                }
            }
        }

        $projects = DB::table('projects')->where('tenant_id', $tenant->id)->get();
        $projectIds = $projects->pluck('id')->toArray();

        $layouts = DB::table('layouts')->whereIn('project_id', $projectIds)->get();
        $layoutIds = $layouts->pluck('id')->toArray();

        $plotsCount = DB::table('plots')->whereIn('layout_id', $layoutIds)->count();
        $roadsCount = DB::table('roads')->whereIn('layout_id', $layoutIds)->count();
        $amenitiesCount = DB::table('amenities')->whereIn('layout_id', $layoutIds)->count();

        $dxfFilesCount = DB::table('dxf_files')->where('tenant_id', $tenant->id)->count();
        $importJobsCount = DB::table('import_jobs')->where('tenant_id', $tenant->id)->count();
        $importJobLogsCount = DB::table('import_job_logs')->whereIn('import_job_id', DB::table('import_jobs')->where('tenant_id', $tenant->id)->pluck('id')->toArray())->count();
        $dxfLayerMappingsCount = DB::table('dxf_layer_mappings')->where('tenant_id', $tenant->id)->count();
        $importTemplatesCount = DB::table('import_templates')->where('tenant_id', $tenant->id)->count();

        $generationBatchesCount = DB::table('generation_batches')->where('tenant_id', $tenant->id)->count();
        $svgDocumentsCount = DB::table('svg_documents')->where('tenant_id', $tenant->id)->count();
        $svgStyleProfilesCount = DB::table('svg_style_profiles')->where('tenant_id', $tenant->id)->count();

        $subscription = DB::table('tenant_subscriptions')->where('tenant_id', $tenant->id)->first();
        $subscriptionId = $subscription ? $subscription->id : null;

        $limitOverridesCount = $subscriptionId ? DB::table('tenant_limit_overrides')->where('tenant_subscription_id', $subscriptionId)->count() : 0;
        $featureOverridesCount = $subscriptionId ? DB::table('tenant_feature_overrides')->where('tenant_subscription_id', $subscriptionId)->count() : 0;
        $billingOverridesCount = $subscriptionId ? DB::table('tenant_billing_overrides')->where('tenant_subscription_id', $subscriptionId)->count() : 0;
        $moduleOverridesCount = $subscriptionId ? DB::table('tenant_module_overrides')->where('tenant_subscription_id', $subscriptionId)->count() : 0;
        $addonsCount = $subscriptionId ? DB::table('tenant_addons')->where('tenant_subscription_id', $subscriptionId)->count() : 0;

        $provisioningJobsCount = DB::table('tenant_provisioning_jobs')->where('tenant_id', $tenant->id)->count();
        $lifecycleEventsCount = DB::table('tenant_lifecycle_events')->where('tenant_id', $tenant->id)->count();
        $developerProfilesCount = DB::table('developer_profiles')->where('tenant_id', $tenant->id)->count();
        $marketplaceLeadsCount = DB::table('marketplace_leads')->where('tenant_id', $tenant->id)->count();
        $auditLogsCount = DB::table('audit_logs')->where('tenant_id', $tenant->id)->count();

        // Print details
        $this->info("==========================================");
        $this->info($dryRun ? "DRY RUN MODE: Records marked for deletion" : "PROCEEDING TO RESET TENANT AND CLEAN UP FOOTPRINT");
        $this->info("==========================================");
        $this->line("Tenant: {$tenant->company_name} [{$tenantCode}]");
        $this->line("Tenant UUID: {$tenant->id}");
        $this->line("Infrastructure Tier: {$tenant->infrastructure_tier}");
        $this->line("Status: {$tenant->status}");
        $this->line("------------------------------------------");

        $this->line("- Tenant Domains: " . $domains->count() . " (" . implode(', ', $domains->pluck('domain')->toArray()) . ")");
        $this->line("- Tenant User Mappings: " . $tenantUsers->count());
        $this->line("- Orphaned Tenant Users to delete: " . count($orphanedUsers) . " (" . implode(', ', array_map(fn($u) => $u->email, $orphanedUsers)) . ")");
        $this->line("- Projects: " . $projects->count() . " (" . implode(', ', $projects->pluck('name')->toArray()) . ")");
        $this->line("- Layout Plans: " . $layouts->count());
        $this->line("- Plots: " . $plotsCount);
        $this->line("- Roads: " . $roadsCount);
        $this->line("- Amenities: " . $amenitiesCount);
        $this->line("- DXF Files: " . $dxfFilesCount);
        $this->line("- Import Jobs: " . $importJobsCount);
        $this->line("- Import Job Logs: " . $importJobLogsCount);
        $this->line("- DXF Layer Mappings: " . $dxfLayerMappingsCount);
        $this->line("- Import Templates: " . $importTemplatesCount);
        $this->line("- Generation Batches: " . $generationBatchesCount);
        $this->line("- SVG Documents: " . $svgDocumentsCount);
        $this->line("- SVG Style Profiles: " . $svgStyleProfilesCount);
        $this->line("- Subscription Plan ID: " . ($subscription ? $subscription->plan_id : 'None'));
        $this->line("- Limit Overrides: " . $limitOverridesCount);
        $this->line("- Feature Overrides: " . $featureOverridesCount);
        $this->line("- Billing Overrides: " . $billingOverridesCount);
        $this->line("- Module Overrides: " . $moduleOverridesCount);
        $this->line("- Tenant Addons: " . $addonsCount);
        $this->line("- Provisioning Jobs Logs: " . $provisioningJobsCount);
        $this->line("- Lifecycle Status Events: " . $lifecycleEventsCount);
        $this->line("- Developer Profile: " . $developerProfilesCount);
        $this->line("- Marketplace Leads: " . $marketplaceLeadsCount);
        $this->line("- Audit Logs: " . $auditLogsCount);
        $this->info("==========================================");

        if ($dryRun) {
            $this->info("Dry-run complete. No changes were made to the database.");
            return 0;
        }

        // Confirm execution
        if (!$this->confirm("Are you absolutely sure you want to completely purge and delete all these records? This cannot be undone!", false)) {
            $this->warn("Aborted by user.");
            return 0;
        }

        // Execute DB transactions for safe cascade deletion
        DB::transaction(function () use ($tenant, $orphanedUsers, $projectIds, $layoutIds, $subscriptionId) {
            // Delete child overrides first (explicit order)
            if ($subscriptionId) {
                DB::table('tenant_limit_overrides')->where('tenant_subscription_id', $subscriptionId)->delete();
                DB::table('tenant_feature_overrides')->where('tenant_subscription_id', $subscriptionId)->delete();
                DB::table('tenant_billing_overrides')->where('tenant_subscription_id', $subscriptionId)->delete();
                DB::table('tenant_module_overrides')->where('tenant_subscription_id', $subscriptionId)->delete();
                DB::table('tenant_addons')->where('tenant_subscription_id', $subscriptionId)->delete();
                DB::table('tenant_subscriptions')->where('id', $subscriptionId)->delete();
            }

            // Clean up Layout-specific records explicitly
            if (count($layoutIds) > 0) {
                DB::table('plots')->whereIn('layout_id', $layoutIds)->delete();
                DB::table('roads')->whereIn('layout_id', $layoutIds)->delete();
                DB::table('amenities')->whereIn('layout_id', $layoutIds)->delete();
                DB::table('layouts')->whereIn('id', $layoutIds)->delete();
            }

            // Clean up Projects
            if (count($projectIds) > 0) {
                DB::table('projects')->whereIn('id', $projectIds)->delete();
            }

            // Clean up DXF parsing
            DB::table('import_templates')->where('tenant_id', $tenant->id)->delete();
            DB::table('dxf_layer_mappings')->where('tenant_id', $tenant->id)->delete();
            $importJobIds = DB::table('import_jobs')->where('tenant_id', $tenant->id)->pluck('id')->toArray();
            if (count($importJobIds) > 0) {
                DB::table('import_job_logs')->whereIn('import_job_id', $importJobIds)->delete();
                DB::table('geometry_entities')->whereIn('import_job_id', $importJobIds)->delete();
                DB::table('import_jobs')->whereIn('id', $importJobIds)->delete();
            }
            DB::table('dxf_files')->where('tenant_id', $tenant->id)->delete();

            // Clean up Generation and SVGs
            DB::table('generation_batches')->where('tenant_id', $tenant->id)->delete();
            DB::table('svg_documents')->where('tenant_id', $tenant->id)->delete();
            DB::table('svg_style_profiles')->where('tenant_id', $tenant->id)->delete();

            // Marketplace and Developer info
            DB::table('developer_profiles')->where('tenant_id', $tenant->id)->delete();
            DB::table('marketplace_leads')->where('tenant_id', $tenant->id)->delete();

            // Tenant domains & user mappings
            DB::table('tenant_domains')->where('tenant_id', $tenant->id)->delete();
            DB::table('tenant_users')->where('tenant_id', $tenant->id)->delete();

            // Delete orphaned users from users table
            foreach ($orphanedUsers as $ou) {
                DB::table('users')->where('id', $ou->id)->delete();
            }

            // Logs & history
            DB::table('tenant_provisioning_jobs')->where('tenant_id', $tenant->id)->delete();
            DB::table('tenant_lifecycle_events')->where('tenant_id', $tenant->id)->delete();
            DB::table('audit_logs')->where('tenant_id', $tenant->id)->delete();

            // Finally delete the parent tenant record
            DB::table('tenants')->where('id', $tenant->id)->delete();
        });

        $this->info("Tenant '{$tenantCode}' reset successfully. All footprints deleted.");
        return 0;
    }
}
