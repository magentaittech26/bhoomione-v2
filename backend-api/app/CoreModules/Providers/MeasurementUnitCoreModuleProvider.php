<?php

namespace App\CoreModules\Providers;

use App\Contracts\CoreModuleProviderInterface;
use App\Models\Tenant;
use App\Models\MeasurementUnit;
use App\Models\TenantMeasurementUnitSetting;
use App\Services\MeasurementUnitService;
use Illuminate\Support\Str;

class MeasurementUnitCoreModuleProvider implements CoreModuleProviderInterface
{
    public function getModuleCode(): string
    {
        return 'core.mdm.measurement_units';
    }

    public function getModuleMetadata(): array
    {
        return [
            'code' => 'core.mdm.measurement_units',
            'name' => 'Measurement Units',
            'category' => 'Master Data Management',
            'group' => 'Master Data Management',
            'description' => 'Mandatory core MDM module for land measurement units and conversion standards',
            'is_core' => true,
            'is_required' => true,
            'default_enabled' => true,
            'billing_required' => false,
            'subscription_required' => false,
            'tenant_can_disable' => false,
            'version' => '3.0.0',
            'minimum_platform_version' => '3.0.0',
            'current_schema_version' => '2026.07.22.01',
            'is_active' => true,
            'display_order' => 5,
            'dependencies' => [],
            'rbac_permissions' => [
                'platform' => [
                    'view' => 'platform.masters.measurement_units.view',
                    'create' => 'platform.masters.measurement_units.create',
                    'edit' => 'platform.masters.measurement_units.edit',
                    'activate' => 'platform.masters.measurement_units.activate',
                    'delete' => 'platform.masters.measurement_units.delete',
                    'export' => 'platform.masters.measurement_units.export',
                    'import' => 'platform.masters.measurement_units.import',
                ],
                'tenant' => [
                    'view' => 'tenant.masters.measurement_units.view',
                    'configure' => 'tenant.masters.measurement_units.configure',
                    'set_default' => 'tenant.masters.measurement_units.set_default',
                    'export' => 'tenant.masters.measurement_units.export',
                    'create_custom' => 'tenant.masters.measurement_units.create_custom',
                    'edit_custom' => 'tenant.masters.measurement_units.edit_custom',
                    'delete_custom' => 'tenant.masters.measurement_units.delete_custom',
                ]
            ]
        ];
    }

    public function provisionTenant(Tenant $tenant, bool $dryRun = false): array
    {
        return $this->backfillTenant($tenant, $dryRun);
    }

    public function backfillTenant(Tenant $tenant, bool $dryRun = false): array
    {
        $created = 0;
        $verified = 0;

        $systemUnits = MeasurementUnit::where('is_system', true)
            ->whereNull('tenant_id')
            ->where('is_active', true)
            ->get();

        foreach ($systemUnits as $unit) {
            $existing = TenantMeasurementUnitSetting::where('tenant_id', $tenant->id)
                ->where('measurement_unit_id', $unit->id)
                ->first();

            if (!$existing) {
                $created++;
                if (!$dryRun) {
                    $isDefault = ($unit->code === 'SQFT' && $unit->measurement_type === 'Area') ||
                                 ($unit->code === 'M' && $unit->measurement_type === 'Length');

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
                $verified++;
            }
        }

        return [
            'tenant_id' => $tenant->id,
            'tenant_name' => $tenant->name ?? 'Tenant',
            'created' => $created,
            'verified' => $verified,
            'status' => 'SUCCESS'
        ];
    }

    public function syncDefaults(Tenant $tenant, bool $dryRun = false): array
    {
        // Ensure default Area and Length units are configured
        $hasAreaDefault = TenantMeasurementUnitSetting::where('tenant_id', $tenant->id)
            ->where('is_default', true)
            ->whereHas('measurementUnit', function ($q) {
                $q->where('measurement_type', 'Area');
            })->exists();

        if (!$hasAreaDefault) {
            $sqftUnit = MeasurementUnit::where('code', 'SQFT')->where('is_system', true)->first();
            if ($sqftUnit && !$dryRun) {
                MeasurementUnitService::setTenantDefaultUnit($tenant->id, $sqftUnit->id, null, []);
            }
        }

        return ['tenant_id' => $tenant->id, 'area_default_synced' => !$hasAreaDefault];
    }

    public function validate(bool $dryRun = true): array
    {
        $systemUnitsCount = MeasurementUnit::where('is_system', true)->count();
        return [
            'valid' => $systemUnitsCount > 0,
            'system_units_count' => $systemUnitsCount
        ];
    }

    public function audit(): array
    {
        return [
            'system_units' => MeasurementUnit::where('is_system', true)->count(),
            'tenant_custom_units' => MeasurementUnit::where('is_system', false)->whereNotNull('tenant_id')->count(),
            'tenant_settings_total' => TenantMeasurementUnitSetting::count(),
        ];
    }

    public function repair(bool $dryRun = false): array
    {
        return ['repaired' => 0];
    }
}
