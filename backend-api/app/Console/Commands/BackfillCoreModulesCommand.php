<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class BackfillCoreModulesCommand extends Command
{
    protected $signature = 'tenants:backfill-core-modules {--dry-run : Execute backfill in dry-run mode}';

    protected $description = 'Backfill mandatory core module assignments and tenant measurement settings for existing tenants.';

    public function handle()
    {
        $this->info("Invoking core module synchronization backfill...");
        return $this->call('modules:sync-core', [
            '--dry-run' => $this->option('dry-run')
        ]);
    }
}
