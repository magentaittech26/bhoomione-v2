<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\CoreModules\CoreModuleRegistry;

class SyncCoreModulesCommand extends Command
{
    protected $signature = 'modules:sync-core {--dry-run : Execute synchronization in dry-run mode without mutating records}';

    protected $description = 'Synchronize core SaaS modules and backfill mandatory core module assignments across all tenants.';

    public function handle()
    {
        $dryRun = (bool) $this->option('dry-run');

        $this->info("=== Synchronizing Core SaaS Modules " . ($dryRun ? "[DRY RUN]" : "") . " ===");

        $results = CoreModuleRegistry::backfillAllTenants($dryRun);

        $tenantsScanned = $results['tenants_scanned'] ?? 0;
        $modulesScanned = $results['modules_scanned'] ?? 0;

        $this->info("Synchronization Complete Summary:");
        $this->line("- Core Modules Registered & Scanned: {$modulesScanned}");
        $this->line("- Tenants Scanned: {$tenantsScanned}");
        $this->line("- Tenant Auto-Provisioning & Settings: COMPLETED");

        return 0;
    }
}

