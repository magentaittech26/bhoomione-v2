<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\SaasModule;
use App\Models\Tenant;
use App\Models\MeasurementUnit;
use App\Models\TenantMeasurementUnitSetting;

class SyncCoreModulesCommand extends Command
{
    protected $signature = 'modules:sync-core {--dry-run : Execute synchronization in dry-run mode without mutating records}';

    protected $description = 'Synchronize core SaaS modules and backfill mandatory core module assignments across all tenants.';

    public function handle()
    {
        $dryRun = $this->option('dry-run');

        $this->info("=== Synchronizing Core SaaS Modules " . ($dryRun ? "[DRY RUN]" : "") . " ===");

        // 1. Ensure core.mdm.measurement_units module exists
        $coreModuleCode = 'core.mdm.measurement_units';
        $module = SaasModule::where('code', $coreModuleCode)->first();

        if (!$module) {
            $this->info("Core module {$coreModuleCode} not found in database. Creating...");
            if (!$dryRun) {
                $module = SaasModule::create([
                    'id' => (string) Str::uuid(),
                    'code' => $coreModuleCode,
                    'name' => 'Measurement Units',
                    'group' => 'Master Data Management',
                    'description' => 'Mandatory core MDM module for land measurement units and conversion standards',
                    'status' => 'ACTIVE',
                    'is_core' => true,
                    'is_billable' => false,
                    'sort_order' => 5,
                ]);
            }
        } else {
            $this->info("Core module {$coreModuleCode} verified.");
        }

        // 2. Scan all tenants
        $tenants = Tenant::all();
        $tenantCount = $tenants->count();
        $settingsCreated = 0;
        $settingsVerified = 0;

        // Fetch standard active system units
        $systemUnits = MeasurementUnit::where('is_system', true)
            ->whereNull('tenant_id')
            ->where('is_active', true)
            ->get();

        if ($systemUnits->isEmpty()) {
            $this->warn("No system measurement units found. Seeding base platform measurement units...");
            if (!$dryRun) {
                $this->seedStandardUnits();
                $systemUnits = MeasurementUnit::where('is_system', true)->whereNull('tenant_id')->where('is_active', true)->get();
            }
        }

        $this->info("Scanned {$tenantCount} tenants and " . count($systemUnits) . " standard system units.");

        foreach ($tenants as $tenant) {
            foreach ($systemUnits as $unit) {
                $existing = TenantMeasurementUnitSetting::where('tenant_id', $tenant->id)
                    ->where('measurement_unit_id', $unit->id)
                    ->first();

                if (!$existing) {
                    $settingsCreated++;
                    if (!$dryRun) {
                        // Determine if default for measurement type
                        $isDefault = false;
                        if ($unit->code === 'SQFT' && $unit->measurement_type === 'Area') {
                            $isDefault = true;
                        } elseif (($unit->code === 'M' || $unit->code === 'FT') && $unit->measurement_type === 'Length') {
                            // First length unit becomes default length
                            $hasLengthDefault = TenantMeasurementUnitSetting::where('tenant_id', $tenant->id)
                                ->whereHas('measurementUnit', function($q) {
                                    $q->where('measurement_type', 'Length');
                                })
                                ->where('is_default', true)
                                ->exists();
                            if (!$hasLengthDefault) {
                                $isDefault = true;
                            }
                        }

                        TenantMeasurementUnitSetting::create([
                            'id' => (string) Str::uuid(),
                            'uuid' => (string) Str::uuid(),
                            'tenant_id' => $tenant->id,
                            'measurement_unit_id' => $unit->id,
                            'is_enabled' => true,
                            'is_default' => $isDefault,
                            'display_precision' => $unit->precision ?? 2,
                            'decimal_places_override' => $unit->decimal_places ?? 2,
                            'display_order' => $unit->display_order ?? 10,
                            'custom_label' => $unit->display_name ?? $unit->name,
                            'custom_symbol' => $unit->symbol,
                        ]);
                    }
                } else {
                    $settingsVerified++;
                }
            }
        }

        $this->info("Synchronization Complete Summary:");
        $this->line("- Core Modules Registered: 1 ({$coreModuleCode})");
        $this->line("- Tenants Scanned: {$tenantCount}");
        $this->line("- Tenant Unit Settings Created: {$settingsCreated}");
        $this->line("- Tenant Unit Settings Verified: {$settingsVerified}");

        return 0;
    }

    private function seedStandardUnits()
    {
        $standards = [
            ['code' => 'SQFT', 'name' => 'Square Feet', 'display_name' => 'Square Feet', 'symbol' => 'sq.ft', 'short_code' => 'sqft', 'measurement_type' => 'Area', 'conversion_factor' => 1.0, 'precision' => 2, 'decimal_places' => 2, 'display_order' => 10, 'is_metric' => false, 'is_default' => true],
            ['code' => 'SQM', 'name' => 'Square Meters', 'display_name' => 'Square Meters', 'symbol' => 'sq.m', 'short_code' => 'sqm', 'measurement_type' => 'Area', 'conversion_factor' => 10.76391042, 'precision' => 2, 'decimal_places' => 2, 'display_order' => 20, 'is_metric' => true, 'is_default' => false],
            ['code' => 'ACR', 'name' => 'Acres', 'display_name' => 'Acres', 'symbol' => 'ac', 'short_code' => 'acr', 'measurement_type' => 'Area', 'conversion_factor' => 43560.0, 'precision' => 4, 'decimal_places' => 4, 'display_order' => 30, 'is_metric' => false, 'is_default' => false],
            ['code' => 'GUN', 'name' => 'Guntas', 'display_name' => 'Guntas', 'symbol' => 'guntha', 'short_code' => 'gun', 'measurement_type' => 'Area', 'conversion_factor' => 1089.0, 'precision' => 2, 'decimal_places' => 2, 'display_order' => 40, 'is_metric' => false, 'is_default' => false],
            ['code' => 'CEN', 'name' => 'Cents', 'display_name' => 'Cents', 'symbol' => 'ct', 'short_code' => 'cen', 'measurement_type' => 'Area', 'conversion_factor' => 435.6, 'precision' => 2, 'decimal_places' => 2, 'display_order' => 50, 'is_metric' => false, 'is_default' => false],
            ['code' => 'HEC', 'name' => 'Hectares', 'display_name' => 'Hectares', 'symbol' => 'ha', 'short_code' => 'hec', 'measurement_type' => 'Area', 'conversion_factor' => 107639.104, 'precision' => 4, 'decimal_places' => 4, 'display_order' => 60, 'is_metric' => true, 'is_default' => false],
            ['code' => 'M', 'name' => 'Meters', 'display_name' => 'Meters', 'symbol' => 'm', 'short_code' => 'm', 'measurement_type' => 'Length', 'conversion_factor' => 3.28084, 'precision' => 2, 'decimal_places' => 2, 'display_order' => 70, 'is_metric' => true, 'is_default' => true],
            ['code' => 'FT', 'name' => 'Feet', 'display_name' => 'Feet', 'symbol' => 'ft', 'short_code' => 'ft', 'measurement_type' => 'Length', 'conversion_factor' => 1.0, 'precision' => 2, 'decimal_places' => 2, 'display_order' => 80, 'is_metric' => false, 'is_default' => false],
        ];

        foreach ($standards as $std) {
            MeasurementUnit::updateOrCreate(
                ['code' => $std['code'], 'is_system' => true],
                array_merge($std, [
                    'id' => (string) Str::uuid(),
                    'uuid' => (string) Str::uuid(),
                    'conversion_to_sqft' => $std['conversion_factor'],
                    'is_system' => true,
                    'is_active' => true,
                    'tenant_id' => null,
                ])
            );
        }
    }
}
