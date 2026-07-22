<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MeasurementUnit;
use App\Models\Tenant;
use App\Models\TenantMeasurementUnitSetting;
use Illuminate\Support\Str;

class MigrateMeasurementUnitsTenancyCommand extends Command
{
    protected $signature = 'measurement-units:migrate-tenancy {--dry-run : Report changes without mutating database}';

    protected $description = 'Classify existing measurement units into system standard units and seed default tenant settings.';

    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $this->info("=== Migrating Measurement Units Tenancy Architecture " . ($dryRun ? "[DRY RUN]" : "") . " ===");

        // Seed standard system units if missing
        $standards = [
            ['code' => 'SQFT', 'name' => 'Square Feet', 'display_name' => 'Square Feet', 'symbol' => 'sq.ft', 'short_code' => 'sqft', 'measurement_type' => 'Area', 'conversion_factor' => 1.0, 'precision' => 2, 'decimal_places' => 2, 'display_order' => 10, 'is_metric' => false],
            ['code' => 'SQM', 'name' => 'Square Meters', 'display_name' => 'Square Meters', 'symbol' => 'sq.m', 'short_code' => 'sqm', 'measurement_type' => 'Area', 'conversion_factor' => 10.76391042, 'precision' => 2, 'decimal_places' => 2, 'display_order' => 20, 'is_metric' => true],
            ['code' => 'ACR', 'name' => 'Acres', 'display_name' => 'Acres', 'symbol' => 'ac', 'short_code' => 'acr', 'measurement_type' => 'Area', 'conversion_factor' => 43560.0, 'precision' => 4, 'decimal_places' => 4, 'display_order' => 30, 'is_metric' => false],
            ['code' => 'GUN', 'name' => 'Guntas', 'display_name' => 'Guntas', 'symbol' => 'guntha', 'short_code' => 'gun', 'measurement_type' => 'Area', 'conversion_factor' => 1089.0, 'precision' => 2, 'decimal_places' => 2, 'display_order' => 40, 'is_metric' => false],
            ['code' => 'CEN', 'name' => 'Cents', 'display_name' => 'Cents', 'symbol' => 'ct', 'short_code' => 'cen', 'measurement_type' => 'Area', 'conversion_factor' => 435.6, 'precision' => 2, 'decimal_places' => 2, 'display_order' => 50, 'is_metric' => false],
            ['code' => 'HEC', 'name' => 'Hectares', 'display_name' => 'Hectares', 'symbol' => 'ha', 'short_code' => 'hec', 'measurement_type' => 'Area', 'conversion_factor' => 107639.104, 'precision' => 4, 'decimal_places' => 4, 'display_order' => 60, 'is_metric' => true],
            ['code' => 'M', 'name' => 'Meters', 'display_name' => 'Meters', 'symbol' => 'm', 'short_code' => 'm', 'measurement_type' => 'Length', 'conversion_factor' => 3.28084, 'precision' => 2, 'decimal_places' => 2, 'display_order' => 70, 'is_metric' => true],
            ['code' => 'FT', 'name' => 'Feet', 'display_name' => 'Feet', 'symbol' => 'ft', 'short_code' => 'ft', 'measurement_type' => 'Length', 'conversion_factor' => 1.0, 'precision' => 2, 'decimal_places' => 2, 'display_order' => 80, 'is_metric' => false],
        ];

        $updatedCount = 0;
        foreach ($standards as $std) {
            $unit = MeasurementUnit::where('code', $std['code'])->first();
            if ($unit) {
                if (!$dryRun) {
                    $unit->update(array_merge($std, [
                        'conversion_to_sqft' => $std['conversion_factor'],
                        'is_system' => true,
                        'is_active' => true,
                        'tenant_id' => null,
                    ]));
                }
                $updatedCount++;
            } else {
                if (!$dryRun) {
                    MeasurementUnit::create(array_merge($std, [
                        'id' => (string) Str::uuid(),
                        'uuid' => (string) Str::uuid(),
                        'conversion_to_sqft' => $std['conversion_factor'],
                        'is_system' => true,
                        'is_active' => true,
                        'tenant_id' => null,
                    ]));
                }
                $updatedCount++;
            }
        }

        $this->info("System standard units classified/seeded: {$updatedCount}");

        // Now run core modules sync
        if (!$dryRun) {
            $this->call('modules:sync-core');
        }

        return 0;
    }
}
