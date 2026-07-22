<?php

namespace App\Services;

use App\Models\MeasurementUnit;
use App\Models\TenantMeasurementUnitSetting;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class MeasurementUnitService
{
    /**
     * ==========================================
     * 1. PLATFORM MASTER REGISTRY METHODS
     * ==========================================
     */

    /**
     * Get paginated platform master units.
     */
    public static function getPlatformPaginated(array $params)
    {
        $perPage = isset($params['per_page']) ? (int) $params['per_page'] : 50;
        $query = MeasurementUnit::where('is_system', true)->whereNull('tenant_id');

        if (!empty($params['search'])) {
            $search = '%' . strtolower($params['search']) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', $search)
                  ->orWhere('code', 'ILIKE', $search)
                  ->orWhere('display_name', 'ILIKE', $search)
                  ->orWhere('symbol', 'ILIKE', $search);
            });
        }

        if (isset($params['is_active'])) {
            $query->where('is_active', filter_var($params['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        if (!empty($params['measurement_type'])) {
            $query->where('measurement_type', $params['measurement_type']);
        }

        $sortBy = !empty($params['sort_by']) ? $params['sort_by'] : 'display_order';
        $allowedSorts = ['name', 'code', 'display_name', 'symbol', 'measurement_type', 'display_order', 'conversion_factor', 'created_at'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'display_order';
        }
        $sortDir = !empty($params['sort_order']) && strtolower($params['sort_order']) === 'desc' ? 'desc' : 'asc';

        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    /**
     * Create a platform standard unit.
     */
    public static function createPlatformUnit(array $data, ?string $userId, ?array $context)
    {
        $id = (string) Str::uuid();

        $unit = DB::transaction(function() use ($id, $data) {
            $data['code'] = strtoupper(trim($data['code']));
            $data['name'] = trim($data['name']);
            if (empty($data['display_name'])) {
                $data['display_name'] = $data['name'];
            }
            if (empty($data['short_code'])) {
                $data['short_code'] = $data['code'];
            }

            $factor = $data['conversion_factor'] ?? 1.0;
            $data['conversion_to_sqft'] = $factor;
            $data['is_system'] = true;
            $data['tenant_id'] = null;

            return MeasurementUnit::create(array_merge($data, [
                'id' => $id,
                'uuid' => $id,
            ]));
        });

        AuditLogService::log([
            'tenantId' => null,
            'userId' => $userId,
            'entityName' => 'measurement_units',
            'entityId' => $unit->id,
            'action' => 'PLATFORM_UNIT_CREATE',
            'newValues' => $unit->toArray(),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return $unit;
    }

    /**
     * Update a platform standard unit.
     */
    public static function updatePlatformUnit(string $id, array $data, ?string $userId, ?array $context)
    {
        $unit = MeasurementUnit::where('id', $id)->firstOrFail();
        $oldValues = $unit->toArray();

        $updatedUnit = DB::transaction(function() use ($unit, $data) {
            if (isset($data['code'])) {
                $data['code'] = strtoupper(trim($data['code']));
            }
            if (isset($data['name'])) {
                $data['name'] = trim($data['name']);
            }
            if (isset($data['conversion_factor'])) {
                $data['conversion_to_sqft'] = $data['conversion_factor'];
            }

            $unit->update($data);
            return $unit->fresh();
        });

        AuditLogService::log([
            'tenantId' => null,
            'userId' => $userId,
            'entityName' => 'measurement_units',
            'entityId' => $id,
            'action' => 'PLATFORM_UNIT_UPDATE',
            'oldValues' => $oldValues,
            'newValues' => $updatedUnit->toArray(),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return $updatedUnit;
    }

    /**
     * Toggle platform unit active state.
     */
    public static function togglePlatformUnit(string $id, ?string $userId, ?array $context)
    {
        $unit = MeasurementUnit::where('id', $id)->firstOrFail();
        return self::updatePlatformUnit($id, ['is_active' => !$unit->is_active], $userId, $context);
    }

    /**
     * Soft delete a platform standard unit.
     */
    public static function deletePlatformUnit(string $id, ?string $userId, ?array $context)
    {
        $unit = MeasurementUnit::where('id', $id)->firstOrFail();
        $oldValues = $unit->toArray();

        DB::transaction(function() use ($unit) {
            $unit->delete();
        });

        AuditLogService::log([
            'tenantId' => null,
            'userId' => $userId,
            'entityName' => 'measurement_units',
            'entityId' => $id,
            'action' => 'PLATFORM_UNIT_DELETE',
            'oldValues' => $oldValues,
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return true;
    }


    /**
     * ==========================================
     * 2. TENANT UNIT CONFIGURATION METHODS
     * ==========================================
     */

    /**
     * Get measurement units formatted and merged with tenant settings.
     */
    public static function getTenantUnits(string $tenantId, array $params = [])
    {
        // System units plus tenant custom units
        $query = MeasurementUnit::where(function ($q) use ($tenantId) {
            $q->where('is_system', true)
              ->orWhere('tenant_id', $tenantId);
        })->where('is_active', true);

        if (!empty($params['search'])) {
            $search = '%' . strtolower($params['search']) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', $search)
                  ->orWhere('code', 'ILIKE', $search)
                  ->orWhere('display_name', 'ILIKE', $search)
                  ->orWhere('symbol', 'ILIKE', $search);
            });
        }

        if (!empty($params['measurement_type'])) {
            $query->where('measurement_type', $params['measurement_type']);
        }

        $units = $query->orderBy('display_order', 'asc')->orderBy('code', 'asc')->get();

        // Fetch tenant settings for this tenant
        $tenantSettings = TenantMeasurementUnitSetting::where('tenant_id', $tenantId)
            ->get()
            ->keyBy('measurement_unit_id');

        return $units->map(function ($unit) use ($tenantSettings) {
            $setting = $tenantSettings->get($unit->id);

            return [
                'id' => $unit->id,
                'uuid' => $unit->uuid ?? $unit->id,
                'code' => $unit->code,
                'name' => $unit->name,
                'display_name' => $setting->custom_label ?? $unit->display_name ?? $unit->name,
                'symbol' => $setting->custom_symbol ?? $unit->symbol,
                'short_code' => $unit->short_code,
                'measurement_type' => $unit->measurement_type,
                'conversion_factor' => (float) $unit->conversion_factor,
                'conversion_to_sqft' => (float) $unit->conversion_to_sqft,
                'precision' => $setting->display_precision ?? $unit->precision ?? 2,
                'decimal_places' => $setting->decimal_places_override ?? $unit->decimal_places ?? 2,
                'display_order' => $setting->display_order ?? $unit->display_order ?? 10,
                'is_metric' => (bool) $unit->is_metric,
                'is_system' => (bool) $unit->is_system,
                'is_active' => (bool) $unit->is_active,
                'is_enabled' => $setting ? (bool) $setting->is_enabled : true,
                'is_default' => $setting ? (bool) $setting->is_default : ($unit->code === 'SQFT'),
                'tenant_id' => $unit->tenant_id,
                'custom_label' => $setting ? $setting->custom_label : null,
                'custom_symbol' => $setting ? $setting->custom_symbol : null,
            ];
        });
    }

    /**
     * Get lookup of active & tenant-enabled units.
     */
    public static function getTenantLookup(string $tenantId)
    {
        $all = self::getTenantUnits($tenantId);
        return $all->filter(function ($u) {
            return $u['is_active'] && $u['is_enabled'];
        })->values();
    }

    /**
     * Update tenant setting for a specific unit.
     */
    public static function updateTenantUnitSetting(string $tenantId, string $unitId, array $settings, ?string $userId, ?array $context)
    {
        $unit = MeasurementUnit::where('id', $unitId)->firstOrFail();

        $updatedSetting = DB::transaction(function () use ($tenantId, $unit, $settings, $userId) {
            $existing = TenantMeasurementUnitSetting::firstOrNew([
                'tenant_id' => $tenantId,
                'measurement_unit_id' => $unit->id,
            ]);

            if (!$existing->exists) {
                $existing->id = (string) Str::uuid();
                $existing->uuid = (string) Str::uuid();
            }

            if (isset($settings['is_enabled'])) {
                $existing->is_enabled = filter_var($settings['is_enabled'], FILTER_VALIDATE_BOOLEAN);
            }
            if (isset($settings['display_precision'])) {
                $existing->display_precision = (int) $settings['display_precision'];
            }
            if (isset($settings['decimal_places_override'])) {
                $existing->decimal_places_override = (int) $settings['decimal_places_override'];
            }
            if (isset($settings['display_order'])) {
                $existing->display_order = (int) $settings['display_order'];
            }
            if (array_key_exists('custom_label', $settings)) {
                $existing->custom_label = $settings['custom_label'];
            }
            if (array_key_exists('custom_symbol', $settings)) {
                $existing->custom_symbol = $settings['custom_symbol'];
            }

            $existing->updated_by = $userId;
            $existing->save();

            return $existing;
        });

        AuditLogService::log([
            'tenantId' => $tenantId,
            'userId' => $userId,
            'entityName' => 'tenant_measurement_unit_settings',
            'entityId' => $updatedSetting->id,
            'action' => 'TENANT_UNIT_SETTINGS_UPDATE',
            'newValues' => $updatedSetting->toArray(),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return $updatedSetting;
    }

    /**
     * Set tenant default unit for a given measurement type.
     */
    public static function setTenantDefaultUnit(string $tenantId, string $unitId, ?string $userId, ?array $context)
    {
        $unit = MeasurementUnit::where('id', $unitId)->firstOrFail();
        $type = $unit->measurement_type ?? 'Area';

        DB::transaction(function () use ($tenantId, $unit, $type, $userId) {
            // Unset all previous tenant defaults for units of the SAME measurement_type in this tenant
            $unitIdsOfType = MeasurementUnit::where('measurement_type', $type)->pluck('id');

            TenantMeasurementUnitSetting::where('tenant_id', $tenantId)
                ->whereIn('measurement_unit_id', $unitIdsOfType)
                ->update(['is_default' => false]);

            // Set default on target unit
            $setting = TenantMeasurementUnitSetting::firstOrNew([
                'tenant_id' => $tenantId,
                'measurement_unit_id' => $unit->id,
            ]);

            if (!$setting->exists) {
                $setting->id = (string) Str::uuid();
                $setting->uuid = (string) Str::uuid();
                $setting->is_enabled = true;
            }

            $setting->is_default = true;
            $setting->updated_by = $userId;
            $setting->save();
        });

        AuditLogService::log([
            'tenantId' => $tenantId,
            'userId' => $userId,
            'entityName' => 'tenant_measurement_unit_settings',
            'entityId' => $unitId,
            'action' => 'TENANT_UNIT_DEFAULT_CHANGE',
            'newValues' => ['tenant_id' => $tenantId, 'unit_id' => $unitId, 'is_default' => true],
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return true;
    }

    /**
     * Create custom tenant unit.
     */
    public static function createTenantCustomUnit(string $tenantId, array $data, ?string $userId, ?array $context)
    {
        $id = (string) Str::uuid();

        $unit = DB::transaction(function () use ($id, $tenantId, $data) {
            $data['code'] = strtoupper(trim($data['code']));
            $data['name'] = trim($data['name']);
            if (empty($data['display_name'])) {
                $data['display_name'] = $data['name'];
            }

            $factor = $data['conversion_factor'] ?? 1.0;
            $data['conversion_to_sqft'] = $factor;
            $data['is_system'] = false;
            $data['tenant_id'] = $tenantId;
            $data['is_active'] = true;

            $newUnit = MeasurementUnit::create(array_merge($data, [
                'id' => $id,
                'uuid' => $id,
            ]));

            // Also create tenant setting
            TenantMeasurementUnitSetting::create([
                'id' => (string) Str::uuid(),
                'uuid' => (string) Str::uuid(),
                'tenant_id' => $tenantId,
                'measurement_unit_id' => $newUnit->id,
                'is_enabled' => true,
                'is_default' => false,
            ]);

            return $newUnit;
        });

        AuditLogService::log([
            'tenantId' => $tenantId,
            'userId' => $userId,
            'entityName' => 'measurement_units',
            'entityId' => $unit->id,
            'action' => 'TENANT_CUSTOM_UNIT_CREATE',
            'newValues' => $unit->toArray(),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return $unit;
    }

    /**
     * Resolve default unit according to hierarchy:
     * Project default -> Tenant default -> Regional platform default -> System fallback (SQFT)
     */
    public static function resolveDefaultUnit(?string $projectId, string $tenantId, string $measurementType = 'Area')
    {
        // 1. Check Project override if project ID supplied
        if ($projectId) {
            $project = \App\Models\Project::where('id', $projectId)->first();
            if ($project && !empty($project->measurement_unit_id)) {
                $pUnit = MeasurementUnit::find($project->measurement_unit_id);
                if ($pUnit) {
                    return $pUnit;
                }
            }
        }

        // 2. Tenant default
        $tenantDefaultSetting = TenantMeasurementUnitSetting::where('tenant_id', $tenantId)
            ->where('is_default', true)
            ->whereHas('measurementUnit', function ($q) use ($measurementType) {
                $q->where('measurement_type', $measurementType);
            })->first();

        if ($tenantDefaultSetting && $tenantDefaultSetting->measurementUnit) {
            return $tenantDefaultSetting->measurementUnit;
        }

        // 3. Platform default
        $platformDefault = MeasurementUnit::where('is_system', true)
            ->whereNull('tenant_id')
            ->where('measurement_type', $measurementType)
            ->where('is_default', true)
            ->first();

        if ($platformDefault) {
            return $platformDefault;
        }

        // 4. System fallback (SQFT)
        return MeasurementUnit::where('code', 'SQFT')->first() 
            ?? MeasurementUnit::where('is_system', true)->first();
    }

    // Generic getById helper
    public static function getById(string $id)
    {
        return MeasurementUnit::where('id', $id)->firstOrFail();
    }
}
