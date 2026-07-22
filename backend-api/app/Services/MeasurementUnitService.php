<?php

namespace App\Services;

use App\Models\MeasurementUnit;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class MeasurementUnitService
{
    /**
     * Get paginated, searched, filtered and sorted measurement units.
     */
    public static function getPaginated(array $params)
    {
        $perPage = isset($params['per_page']) ? (int) $params['per_page'] : 50;
        $query = MeasurementUnit::query();

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
        } elseif (!empty($params['active_only']) && filter_var($params['active_only'], FILTER_VALIDATE_BOOLEAN)) {
            $query->where('is_active', true);
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
     * Get lookup of active permitted units.
     */
    public static function getLookup()
    {
        return MeasurementUnit::where('is_active', true)
            ->orderBy('display_order', 'asc')
            ->orderBy('code', 'asc')
            ->get();
    }

    /**
     * Retrieve a specific measurement unit.
     */
    public static function getById(string $id)
    {
        return MeasurementUnit::where('id', $id)->firstOrFail();
    }

    /**
     * Create a new measurement unit under transaction boundary.
     */
    public static function create(array $data, ?string $userId, ?array $context)
    {
        $id = (string) Str::uuid();
        
        $unit = DB::transaction(function() use ($id, $data) {
            $measurementType = $data['measurement_type'] ?? 'Area';
            $isDefault = !empty($data['is_default']);

            if ($isDefault) {
                MeasurementUnit::where('measurement_type', $measurementType)
                    ->update(['is_default' => false]);
            }

            // Normalization
            $data['code'] = strtoupper(trim($data['code']));
            $data['name'] = trim($data['name']);
            if (empty($data['display_name'])) {
                $data['display_name'] = $data['name'];
            }
            if (empty($data['short_code'])) {
                $data['short_code'] = $data['code'];
            }

            // Ensure conversion_to_sqft and conversion_factor match
            $factor = $data['conversion_factor'] ?? 1.0;
            $data['conversion_to_sqft'] = $factor;

            return MeasurementUnit::create(array_merge($data, [
                'id' => $id,
                'uuid' => $id,
            ]));
        });

        AuditLogService::log([
            'tenantId' => $context['tenantId'] ?? null,
            'userId' => $userId,
            'entityName' => 'measurement_units',
            'entityId' => $unit->id,
            'action' => 'PLOT_CREATE',
            'newValues' => $unit->toArray(),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return $unit;
    }

    /**
     * Update an existing measurement unit under transaction boundary.
     */
    public static function update(string $id, array $data, ?string $userId, ?array $context)
    {
        $unit = self::getById($id);
        $oldValues = $unit->toArray();

        $updatedUnit = DB::transaction(function() use ($unit, $data) {
            if (isset($data['is_default']) && $data['is_default'] && !$unit->is_default) {
                $measurementType = $data['measurement_type'] ?? $unit->measurement_type;
                MeasurementUnit::where('measurement_type', $measurementType)
                    ->update(['is_default' => false]);
            }

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
            'tenantId' => $context['tenantId'] ?? null,
            'userId' => $userId,
            'entityName' => 'measurement_units',
            'entityId' => $id,
            'action' => 'PLOT_UPDATE',
            'oldValues' => $oldValues,
            'newValues' => $updatedUnit->toArray(),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return $updatedUnit;
    }

    /**
     * Soft delete an existing measurement unit.
     */
    public static function delete(string $id, ?string $userId, ?array $context)
    {
        $unit = self::getById($id);
        $oldValues = $unit->toArray();

        DB::transaction(function() use ($unit) {
            $unit->delete();
        });

        AuditLogService::log([
            'tenantId' => $context['tenantId'] ?? null,
            'userId' => $userId,
            'entityName' => 'measurement_units',
            'entityId' => $id,
            'action' => 'PLOT_DELETE',
            'oldValues' => $oldValues,
            'newValues' => array_merge($oldValues, ['deleted_at' => now()->toIso8601String()]),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return true;
    }
}
