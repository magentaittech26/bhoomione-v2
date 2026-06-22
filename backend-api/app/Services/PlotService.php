<?php

namespace App\Services;

use App\Models\Plot;
use App\Models\Layout;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class PlotService
{
    /**
     * Query plots nested under the resolved tenant projects.
     */
    public static function getAll(string $tenantId)
    {
        return Plot::whereIn('layout_id', function ($query) use ($tenantId) {
            $query->select('id')->from('layouts')->whereIn('project_id', function ($subQuery) use ($tenantId) {
                $subQuery->select('id')->from('projects')->where('tenant_id', $tenantId);
            });
        })->with(['layout', 'layout.project', 'measurementUnit'])->get();
    }

    /**
     * Get paginated, searched, filtered and sorted plots.
     */
    public static function getPaginated(string $tenantId, array $params)
    {
        $perPage = isset($params['per_page']) ? (int) $params['per_page'] : 6;

        $query = Plot::whereIn('layout_id', function ($q) use ($tenantId) {
            $q->select('id')->from('layouts')->whereIn('project_id', function ($subQuery) use ($tenantId) {
                $subQuery->select('id')->from('projects')->where('tenant_id', $tenantId);
            });
        });

        $query->with(['layout', 'layout.project', 'measurementUnit']);

        if (!empty($params['search'])) {
            $search = '%' . strtolower($params['search']) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('plot_number', 'ILIKE', $search)
                  ->orWhereHas('layout', function ($sub) use ($search) {
                      $sub->where('name', 'ILIKE', $search)
                         ->orWhere('code', 'ILIKE', $search)
                         ->orWhereHas('project', function ($sub2) use ($search) {
                             $sub2->where('name', 'ILIKE', $search)
                                  ->orWhere('code', 'ILIKE', $search);
                         });
                  });
            });
        }

        if (!empty($params['layout_id'])) {
            $query->where('layout_id', $params['layout_id']);
        }

        if (!empty($params['status'])) {
            $query->where('status', $params['status']);
        }

        if (!empty($params['facing'])) {
            $query->where('facing', $params['facing']);
        }

        if (isset($params['corner_plot']) && $params['corner_plot'] !== '') {
            $val = filter_var($params['corner_plot'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($val !== null) {
                $query->where('corner_plot', $val);
            }
        }

        if (isset($params['road_width_min']) && $params['road_width_min'] !== '') {
            $query->where('road_width', '>=', (float) $params['road_width_min']);
        }

        if (isset($params['road_width_max']) && $params['road_width_max'] !== '') {
            $query->where('road_width', '<=', (float) $params['road_width_max']);
        }

        if (isset($params['area_min']) && $params['area_min'] !== '') {
            $query->where('area_value', '>=', (float) $params['area_min']);
        }

        if (isset($params['area_max']) && $params['area_max'] !== '') {
            $query->where('area_value', '<=', (float) $params['area_max']);
        }

        $sortBy = !empty($params['sort_by']) ? $params['sort_by'] : 'created_at';
        $allowedSorts = ['plot_number', 'area_value', 'length', 'width', 'road_width', 'corner_plot', 'facing', 'status', 'created_at'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }
        $sortDir = !empty($params['sort_direction']) && strtolower($params['sort_direction']) === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    /**
     * Resolve plot under verified tenant constraint boundaries.
     */
    public static function getById(string $id, string $tenantId)
    {
        return Plot::whereIn('layout_id', function ($query) use ($tenantId) {
            $query->select('id')->from('layouts')->whereIn('project_id', function ($subQuery) use ($tenantId) {
                $subQuery->select('id')->from('projects')->where('tenant_id', $tenantId);
            });
        })->where('id', $id)->with(['layout', 'layout.project', 'measurementUnit'])->firstOrFail();
    }

    /**
     * Create individual plot item after verifying owner layouts and projects.
     */
    public static function create(array $data, string $tenantId, ?string $userId, ?array $context)
    {
        // Enforce plan limits on active tenant workspace
        \App\Services\SubscriptionEnforcementEngine::checkLimit($tenantId, 'plots');

        // Assert layout nested under tenant
        Layout::whereIn('project_id', function ($query) use ($tenantId) {
            $query->select('id')->from('projects')->where('tenant_id', $tenantId);
        })->where('id', $data['layout_id'])->firstOrFail();

        $uuid = (string) Str::uuid();
        
        $plot = DB::transaction(function() use ($uuid, $data) {
            return Plot::create(array_merge($data, [
                'id' => $uuid,
            ]));
        });

        AuditLogService::log([
            'tenantId' => $tenantId,
            'userId' => $userId,
            'entityName' => 'plots',
            'entityId' => $plot->id,
            'action' => 'CREATE',
            'newValues' => $plot->toArray(),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return self::getById($plot->id, $tenantId);
    }

    /**
     * Update plot properties after checking parent constraints.
     */
    public static function update(string $id, array $data, string $tenantId, ?string $userId, ?array $context)
    {
        $plot = self::getById($id, $tenantId);

        if (isset($data['layout_id'])) {
            Layout::whereIn('project_id', function ($query) use ($tenantId) {
                $query->select('id')->from('projects')->where('tenant_id', $tenantId);
            })->where('id', $data['layout_id'])->firstOrFail();
        }

        $oldValues = $plot->toArray();

        DB::transaction(function() use ($plot, $data) {
            $plot->update($data);
        });

        $newPlot = $plot->fresh();

        AuditLogService::log([
            'tenantId' => $tenantId,
            'userId' => $userId,
            'entityName' => 'plots',
            'entityId' => $plot->id,
            'action' => 'UPDATE',
            'oldValues' => $oldValues,
            'newValues' => $newPlot->toArray(),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return self::getById($plot->id, $tenantId);
    }

    /**
     * Delete plot with full transaction lock and write log.
     */
    public static function delete(string $id, string $tenantId, ?string $userId, ?array $context)
    {
        $plot = self::getById($id, $tenantId);
        $oldValues = $plot->toArray();

        DB::transaction(function() use ($plot) {
            $plot->delete();
        });

        AuditLogService::log([
            'tenantId' => $tenantId,
            'userId' => $userId,
            'entityName' => 'plots',
            'entityId' => $id,
            'action' => 'DELETE',
            'oldValues' => $oldValues,
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return true;
    }
}
