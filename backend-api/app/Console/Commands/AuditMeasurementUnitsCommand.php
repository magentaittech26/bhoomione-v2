<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MeasurementUnit;
use App\Models\TenantMeasurementUnitSetting;
use App\Models\Tenant;

class AuditMeasurementUnitsCommand extends Command
{
    protected $signature = 'measurement-units:audit';

    protected $description = 'Audit measurement units records and tenant configuration settings for data integrity and duplicate checking.';

    public function handle()
    {
        $this->info("=== BhoomiOne V3 Measurement Units Audit ===");

        $systemUnitsCount = MeasurementUnit::where('is_system', true)->count();
        $tenantUnitsCount = MeasurementUnit::where('is_system', false)->whereNotNull('tenant_id')->count();
        $orphanUnitsCount = MeasurementUnit::where('is_system', false)->whereNull('tenant_id')->count();
        $tenantSettingsCount = TenantMeasurementUnitSetting::count();
        $totalTenants = Tenant::count();

        $this->line("Data Distribution:");
        $this->line("- System Standard Units: {$systemUnitsCount}");
        $this->line("- Tenant Custom Units: {$tenantUnitsCount}");
        $this->line("- Orphan Custom Units (No Tenant ID): {$orphanUnitsCount}");
        $this->line("- Total Tenants in System: {$totalTenants}");
        $this->line("- Total Tenant Unit Settings: {$tenantSettingsCount}");

        // Check for duplicates in code among system units
        $duplicateSystemCodes = MeasurementUnit::where('is_system', true)
            ->select('code', \DB::raw('count(*) as total'))
            ->groupBy('code')
            ->havingRaw('count(*) > 1')
            ->get();

        if ($duplicateSystemCodes->isNotEmpty()) {
            $this->error("ALERT: Duplicate system unit codes found:");
            foreach ($duplicateSystemCodes as $dup) {
                $this->error("  Code '{$dup->code}': {$dup->total} records");
            }
        } else {
            $this->info("✓ No duplicate system unit codes found.");
        }

        // Check tenant default integrity
        $tenantsWithoutAreaDefault = 0;
        foreach (Tenant::all() as $t) {
            $hasDefault = TenantMeasurementUnitSetting::where('tenant_id', $t->id)
                ->where('is_default', true)
                ->whereHas('measurementUnit', function($q) {
                    $q->where('measurement_type', 'Area');
                })
                ->exists();
            if (!$hasDefault) {
                $tenantsWithoutAreaDefault++;
            }
        }

        if ($tenantsWithoutAreaDefault > 0) {
            $this->warn("! {$tenantsWithoutAreaDefault} tenants do not have a default Area unit configured. Run 'php artisan modules:sync-core' to resolve.");
        } else {
            $this->info("✓ All tenants have default Area unit configured.");
        }

        return 0;
    }
}
