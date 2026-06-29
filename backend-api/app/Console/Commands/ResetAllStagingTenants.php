<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ResetAllStagingTenants extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenant:reset-all-staging-tenants 
                            {--confirm= : Exact confirmation text required to proceed with reset: "RESET-STAGING-TENANTS"}
                            {--dry-run : Print table-wise counts of records to be deleted without modifying the database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Safely and completely purges all staging/test tenant data, subdomains, spatial structures, and associated tenant users inside DB transaction, preparing database for a fresh clean state.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // 1. ENVIRONMENT GATE: Refuse to run unless environment is staging, local, or testing
        $currentEnv = app()->environment();
        if (!in_array($currentEnv, ['staging', 'local', 'testing'])) {
            $this->error("=================================================================================");
            $this->error("CRITICAL SECURITY EXCEPTION: STAGING RESET COMMAND BLOCKED.");
            $this->error("Reason: This command is restricted to 'staging', 'local', or 'testing' APP_ENV.");
            $this->error("Current Environment: '{$currentEnv}'");
            $this->error("=================================================================================");
            return 1;
        }

        $dryRun = $this->option('dry-run');
        $confirmText = $this->option('confirm');

        // 2. CONFIRMATION GATE: Refuse destructive action without correct confirmation text unless running dry-run
        if (!$dryRun && $confirmText !== 'RESET-STAGING-TENANTS') {
            $this->error("=================================================================================");
            $this->error("CRITICAL SECURITY EXCEPTION: DESTRUCTIVE ACTION BLOCK.");
            $this->error("Reason: Please supply the exact confirmation text via option --confirm=RESET-STAGING-TENANTS");
            $this->line("Example command usage:");
            $this->info("  php artisan tenant:reset-all-staging-tenants --confirm=RESET-STAGING-TENANTS");
            $this->line("To run a safe dry-run count simulation, run:");
            $this->info("  php artisan tenant:reset-all-staging-tenants --dry-run");
            $this->error("=================================================================================");
            return 1;
        }

        $this->info("========================================================");
        $this->info(" BHOOMIONE V2: MULTI-TENANT DATABASE RESET SERVICE ");
        $this->info("========================================================");
        $this->line("Target Environment: " . strtoupper($currentEnv));
        $this->line("Execution Mode: " . ($dryRun ? "DRY RUN (READ-ONLY SIMULATION)" : "DESTRUCTIVE DB RESET"));
        $this->line("--------------------------------------------------------");

        // 3. RETRIEVE ALL TENANTS
        $tenantIds = DB::table('tenants')->pluck('id')->toArray();
        $totalTenants = count($tenantIds);

        if ($totalTenants === 0) {
            $this->warn("No tenant records found. Database is already in a clean, pristine state.");
            return 0;
        }

        $this->info("Analyzing workspace database tables and gathering cascade footprints...");

        // Gather parent tenant mapping info
        $tenantsInfo = DB::table('tenants')->select('tenant_code', 'company_name')->get();

        // Trace subscription-related tables
        $subscriptionIds = DB::table('tenant_subscriptions')->whereIn('tenant_id', $tenantIds)->pluck('id')->toArray();
        
        $limitOverridesCount = DB::table('tenant_limit_overrides')->whereIn('tenant_subscription_id', $subscriptionIds)->count();
        $featureOverridesCount = DB::table('tenant_feature_overrides')->whereIn('tenant_subscription_id', $subscriptionIds)->count();
        $billingOverridesCount = DB::table('tenant_billing_overrides')->whereIn('tenant_subscription_id', $subscriptionIds)->count();
        $moduleOverridesCount = DB::table('tenant_module_overrides')->whereIn('tenant_subscription_id', $subscriptionIds)->count();
        $addonsCount = DB::table('tenant_addons')->whereIn('tenant_subscription_id', $subscriptionIds)->count();
        $subscriptionsCount = count($subscriptionIds);

        // Trace project & GIS structural mappings
        $projectIds = DB::table('projects')->whereIn('tenant_id', $tenantIds)->pluck('id')->toArray();
        $layoutIds = DB::table('layouts')->whereIn('project_id', $projectIds)->pluck('id')->toArray();

        $projectsCount = count($projectIds);
        $layoutsCount = count($layoutIds);
        $plotsCount = DB::table('plots')->whereIn('layout_id', $layoutIds)->count();
        $roadsCount = DB::table('roads')->whereIn('layout_id', $layoutIds)->count();
        $amenitiesCount = DB::table('amenities')->whereIn('layout_id', $layoutIds)->count();

        // Trace CAD/DXF data
        $dxfFilesCount = DB::table('dxf_files')->whereIn('tenant_id', $tenantIds)->count();
        $importJobsCount = DB::table('import_jobs')->whereIn('tenant_id', $tenantIds)->count();
        
        $importJobIds = DB::table('import_jobs')->whereIn('tenant_id', $tenantIds)->pluck('id')->toArray();
        $importJobLogsCount = DB::table('import_job_logs')->whereIn('import_job_id', $importJobIds)->count();
        $dxfLayerMappingsCount = DB::table('dxf_layer_mappings')->whereIn('tenant_id', $tenantIds)->count();
        $importTemplatesCount = DB::table('import_templates')->whereIn('tenant_id', $tenantIds)->count();
        $geometryEntitiesCount = DB::table('geometry_entities')->whereIn('import_job_id', $importJobIds)->count();

        // Trace svg-generation
        $generationBatchesCount = DB::table('generation_batches')->whereIn('tenant_id', $tenantIds)->count();
        $svgDocIds = DB::table('svg_documents')->whereIn('tenant_id', $tenantIds)->pluck('id')->toArray();
        $svgDocumentsCount = count($svgDocIds);
        $svgStyleProfilesCount = DB::table('svg_style_profiles')->whereIn('tenant_id', $tenantIds)->count();
        $svgElementsCount = DB::table('svg_elements')->whereIn('svg_document_id', $svgDocIds)->count();
        $svgLabelsCount = DB::table('svg_labels')->whereIn('svg_document_id', $svgDocIds)->count();

        // Trace marketplace-leads and developer metadata
        $developerProfilesCount = DB::table('developer_profiles')->whereIn('tenant_id', $tenantIds)->count();
        $marketplaceLeadsCount = DB::table('marketplace_leads')->whereIn('tenant_id', $tenantIds)->count();
        $marketplaceAnalyticsCount = DB::table('marketplace_analytics_cache')->whereIn('tenant_id', $tenantIds)->count();
        $marketplaceModerationHistoryCount = DB::table('marketplace_moderation_history')->whereIn('project_id', $projectIds)->count();
        $marketplaceViewTrackingCount = DB::table('marketplace_view_tracking')->whereIn('project_id', $projectIds)->count();

        // Trace domains & log files
        $domainsCount = DB::table('tenant_domains')->whereIn('tenant_id', $tenantIds)->count();
        $provisioningJobsCount = DB::table('tenant_provisioning_jobs')->whereIn('tenant_id', $tenantIds)->count();
        $lifecycleEventsCount = DB::table('tenant_lifecycle_events')->whereIn('tenant_id', $tenantIds)->count();
        $tenantAuditLogsCount = DB::table('audit_logs')->whereIn('tenant_id', $tenantIds)->count();

        // Trace users and refresh tokens
        $tenantUsersCount = DB::table('tenant_users')->whereIn('tenant_id', $tenantIds)->count();
        
        $tenantUsersList = DB::table('tenant_users')->whereIn('tenant_id', $tenantIds)->get();
        $orphanedUserIds = [];
        foreach ($tenantUsersList as $tu) {
            $hasGlobalRoles = DB::table('user_roles')->where('user_id', $tu->user_id)->exists();
            $otherTenantsCount = DB::table('tenant_users')
                ->where('user_id', $tu->user_id)
                ->whereNotIn('tenant_id', $tenantIds)
                ->count();

            if (!$hasGlobalRoles && $otherTenantsCount === 0) {
                $orphanedUserIds[] = $tu->user_id;
            }
        }
        $orphanedUserIds = array_unique($orphanedUserIds);
        $orphanedUsersCount = count($orphanedUserIds);
        $refreshTokensCount = DB::table('refresh_tokens')->whereIn('user_id', $orphanedUserIds)->count();

        // Print counts
        $this->info("==========================================");
        $this->info("TABLE-WISE RECORD FOOTPRINT TO BE RESET:");
        $this->info("==========================================");
        $this->line("Target Tenants Count       : " . $totalTenants);
        foreach ($tenantsInfo as $tInfo) {
            $this->line(" -> [Code: {$tInfo->tenant_code}] {$tInfo->company_name}");
        }
        $this->line("------------------------------------------");
        $this->line("Domains                    : " . $domainsCount);
        $this->line("Subscriptions              : " . $subscriptionsCount);
        $this->line("Limit Overrides            : " . $limitOverridesCount);
        $this->line("Feature Overrides          : " . $featureOverridesCount);
        $this->line("Billing Overrides          : " . $billingOverridesCount);
        $this->line("Module Overrides           : " . $moduleOverridesCount);
        $this->line("Addons                     : " . $addonsCount);
        $this->line("------------------------------------------");
        $this->line("Projects                   : " . $projectsCount);
        $this->line("Layout Plans               : " . $layoutsCount);
        $this->line("Plots                      : " . $plotsCount);
        $this->line("Roads                      : " . $roadsCount);
        $this->line("Amenities                  : " . $amenitiesCount);
        $this->line("------------------------------------------");
        $this->line("DXF Files                  : " . $dxfFilesCount);
        $this->line("Import Jobs                : " . $importJobsCount);
        $this->line("Import Job Logs            : " . $importJobLogsCount);
        $this->line("DXF Layer Mappings         : " . $dxfLayerMappingsCount);
        $this->line("Import Templates           : " . $importTemplatesCount);
        $this->line("Geometry Entities          : " . $geometryEntitiesCount);
        $this->line("------------------------------------------");
        $this->line("Generation Batches         : " . $generationBatchesCount);
        $this->line("SVG Documents              : " . $svgDocumentsCount);
        $this->line("SVG Style Profiles         : " . $svgStyleProfilesCount);
        $this->line("SVG Elements               : " . $svgElementsCount);
        $this->line("SVG Labels                 : " . $svgLabelsCount);
        $this->line("------------------------------------------");
        $this->line("Developer Profiles         : " . $developerProfilesCount);
        $this->line("Marketplace Leads          : " . $marketplaceLeadsCount);
        $this->line("Marketplace Analytics      : " . $marketplaceAnalyticsCount);
        $this->line("Marketplace Moderation Hist: " . $marketplaceModerationHistoryCount);
        $this->line("Marketplace Views Track    : " . $marketplaceViewTrackingCount);
        $this->line("------------------------------------------");
        $this->line("Provisioning Jobs Logs     : " . $provisioningJobsCount);
        $this->line("Lifecycle Events           : " . $lifecycleEventsCount);
        $this->line("Tenant Scoped Audit Logs   : " . $tenantAuditLogsCount);
        $this->line("------------------------------------------");
        $this->line("Tenant Users Mappings      : " . $tenantUsersCount);
        $this->line("Orphaned Users to Purge    : " . $orphanedUsersCount);
        $this->line("Refresh Session Tokens     : " . $refreshTokensCount);
        $this->info("==========================================");

        // Safeguard Checks: Confirm global configurations are preserved
        $saasPlansCount = DB::table('subscription_plans')->count();
        $saasModulesCount = DB::table('saas_modules')->count();
        $saasFeaturesCount = DB::table('saas_features')->count();
        $globalSettingsCount = DB::table('saas_platform_settings')->count();
        $nonTenantAuditLogs = DB::table('audit_logs')->whereNull('tenant_id')->count();

        $this->info("SAFEGUARD VERIFICATION FOR CORE SaaS SYSTEM STRUCTURES:");
        $this->line(" -> Core SaaS Plans (PRESERVED)      : " . $saasPlansCount);
        $this->line(" -> Core SaaS Modules (PRESERVED)    : " . $saasModulesCount);
        $this->line(" -> Core SaaS Features (PRESERVED)   : " . $saasFeaturesCount);
        $this->line(" -> Global Platform Settings (KEEP)  : " . $globalSettingsCount);
        $this->line(" -> Non-Tenant Platform Audit Logs   : " . $nonTenantAuditLogs);
        $this->info("==========================================");

        if ($dryRun) {
            $this->info("[DRY-RUN COMPLETE] Read-only verification successful. No DB changes were written.");
            return 0;
        }

        $this->warn("Executing high-security staging tenant reset sequence inside DB transaction...");

        try {
            DB::beginTransaction();

            // 1. Delete subscription overrides and child entities
            if ($subscriptionsCount > 0) {
                DB::table('tenant_limit_overrides')->whereIn('tenant_subscription_id', $subscriptionIds)->delete();
                DB::table('tenant_feature_overrides')->whereIn('tenant_subscription_id', $subscriptionIds)->delete();
                DB::table('tenant_billing_overrides')->whereIn('tenant_subscription_id', $subscriptionIds)->delete();
                DB::table('tenant_module_overrides')->whereIn('tenant_subscription_id', $subscriptionIds)->delete();
                DB::table('tenant_addons')->whereIn('tenant_subscription_id', $subscriptionIds)->delete();
                DB::table('tenant_subscriptions')->whereIn('tenant_id', $tenantIds)->delete();
            }

            // 2. Delete spatial GIS plans & layers (plot, road, amenity, layout, projects)
            if ($projectsCount > 0) {
                // Delete children of layouts
                if ($layoutsCount > 0) {
                    DB::table('plots')->whereIn('layout_id', $layoutIds)->delete();
                    DB::table('roads')->whereIn('layout_id', $layoutIds)->delete();
                    DB::table('amenities')->whereIn('layout_id', $layoutIds)->delete();
                    DB::table('layouts')->whereIn('id', $layoutIds)->delete();
                }

                // Delete marketplace logs and moderation notes that depend on project UUID
                DB::table('marketplace_view_tracking')->whereIn('project_id', $projectIds)->delete();
                DB::table('marketplace_moderation_history')->whereIn('project_id', $projectIds)->delete();

                // Delete projects
                DB::table('projects')->whereIn('id', $projectIds)->delete();
            }

            // 3. Delete DXF layer drawings, import logs, job caches
            DB::table('import_templates')->whereIn('tenant_id', $tenantIds)->delete();
            DB::table('dxf_layer_mappings')->whereIn('tenant_id', $tenantIds)->delete();
            
            if (count($importJobIds) > 0) {
                DB::table('import_job_logs')->whereIn('import_job_id', $importJobIds)->delete();
                DB::table('geometry_entities')->whereIn('import_job_id', $importJobIds)->delete();
            }
            DB::table('import_jobs')->whereIn('tenant_id', $tenantIds)->delete();
            DB::table('dxf_files')->whereIn('tenant_id', $tenantIds)->delete();

            // 4. Delete generation batches and SVG files
            DB::table('generation_batches')->whereIn('tenant_id', $tenantIds)->delete();
            if ($svgDocumentsCount > 0) {
                DB::table('svg_elements')->whereIn('svg_document_id', $svgDocIds)->delete();
                DB::table('svg_labels')->whereIn('svg_document_id', $svgDocIds)->delete();
                DB::table('svg_documents')->whereIn('tenant_id', $tenantIds)->delete();
            }
            DB::table('svg_style_profiles')->whereIn('tenant_id', $tenantIds)->delete();

            // 5. Delete developer profiles and leads
            DB::table('developer_profiles')->whereIn('tenant_id', $tenantIds)->delete();
            DB::table('marketplace_leads')->whereIn('tenant_id', $tenantIds)->delete();
            DB::table('marketplace_analytics_cache')->whereIn('tenant_id', $tenantIds)->delete();

            // 6. Delete domains
            DB::table('tenant_domains')->whereIn('tenant_id', $tenantIds)->delete();

            // 7. Delete sessions, active tokens of orphaned users
            if ($orphanedUsersCount > 0) {
                DB::table('refresh_tokens')->whereIn('user_id', $orphanedUserIds)->delete();
            }

            // 8. Delete user-to-tenant mappings
            DB::table('tenant_users')->whereIn('tenant_id', $tenantIds)->delete();

            // 9. Delete orphaned, tenant-only user profiles (protects Global Super Admins)
            if ($orphanedUsersCount > 0) {
                DB::table('users')->whereIn('id', $orphanedUserIds)->delete();
            }

            // 10. Delete logs, jobs queue history, and tenant-scoped audit logs
            DB::table('tenant_provisioning_jobs')->whereIn('tenant_id', $tenantIds)->delete();
            DB::table('tenant_lifecycle_events')->whereIn('tenant_id', $tenantIds)->delete();
            DB::table('audit_logs')->whereIn('tenant_id', $tenantIds)->delete();

            // 11. Finally delete the parent tenants records last
            DB::table('tenants')->whereIn('id', $tenantIds)->delete();

            DB::commit();

            $this->info("=================================================================================");
            $this->info("✓ SUCCESS: Database tenant space completely purged and reset for Staging.");
            $this->info("All staging tenant footprints have been wiped in clean database transaction.");
            $this->info("All platform plans, super admin profiles, and global parameters remain intact.");
            $this->info("=================================================================================");
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("=================================================================================");
            $this->error("🚨 TRANSACTION FAILURE: Database reset has been fully aborted & rolled back.");
            $this->error("Exception details: " . $e->getMessage());
            $this->error("Line reference   : " . $e->getLine());
            $this->error("=================================================================================");
            return 1;
        }

        return 0;
    }
}
