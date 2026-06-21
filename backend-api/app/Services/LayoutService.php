<?php

namespace App\Services;

use App\Models\Layout;
use App\Models\Project;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class LayoutService
{
    /**
     * List all layouts nested under active tenant projects.
     */
    public static function getAll(string $tenantId)
    {
        return Layout::whereIn('project_id', function ($query) use ($tenantId) {
            $query->select('id')->from('projects')->where('tenant_id', $tenantId);
        })->with(['project', 'measurementUnit', 'totalAreaUnit'])->get();
    }

    /**
     * Get paginated, searched, filtered and sorted layouts.
     */
    public static function getPaginated(string $tenantId, array $params)
    {
        $perPage = isset($params['per_page']) ? (int) $params['per_page'] : 6;
        
        $query = Layout::whereIn('project_id', function ($q) use ($tenantId) {
            $q->select('id')->from('projects')->where('tenant_id', $tenantId);
        })->withCount('plots');

        $query->with(['project', 'measurementUnit', 'totalAreaUnit']);

        if (!empty($params['search'])) {
            $search = '%' . strtolower($params['search']) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', $search)
                  ->orWhere('code', 'ILIKE', $search)
                  ->orWhere('approval_number', 'ILIKE', $search)
                  ->orWhereHas('project', function ($sub) use ($search) {
                      $sub->where('name', 'ILIKE', $search)
                         ->orWhere('code', 'ILIKE', $search);
                  });
            });
        }

        if (!empty($params['project_id'])) {
            $query->where('project_id', $params['project_id']);
        }

        if (!empty($params['layout_type'])) {
            $query->where('layout_type', $params['layout_type']);
        }

        if (!empty($params['status'])) {
            $query->where('status', $params['status']);
        }

        $sortBy = !empty($params['sort_by']) ? $params['sort_by'] : 'created_at';
        $allowedSorts = ['name', 'code', 'layout_type', 'status', 'total_area_value', 'created_at', 'project_id'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }
        $sortDir = !empty($params['sort_direction']) && strtolower($params['sort_direction']) === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    /**
     * Locate layout ensuring parent project belongs to active tenant framework.
     */
    public static function getById(string $id, string $tenantId)
    {
        return Layout::whereIn('project_id', function ($query) use ($tenantId) {
            $query->select('id')->from('projects')->where('tenant_id', $tenantId);
        })->where('id', $id)->with(['project', 'measurementUnit', 'totalAreaUnit'])->firstOrFail();
    }

    /**
     * Create layout under verified tenant project.
     */
    public static function create(array $data, string $tenantId, ?string $userId, ?array $context)
    {
        // Assert project belongs to current tenant
        Project::where('tenant_id', $tenantId)->where('id', $data['project_id'])->firstOrFail();

        $uuid = (string) Str::uuid();
        
        $layout = DB::transaction(function() use ($uuid, $data) {
            return Layout::create(array_merge($data, [
                'id' => $uuid,
            ]));
        });

        AuditLogService::log([
            'tenantId' => $tenantId,
            'userId' => $userId,
            'entityName' => 'layouts',
            'entityId' => $layout->id,
            'action' => 'CREATE',
            'newValues' => $layout->toArray(),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return self::getById($layout->id, $tenantId);
    }

    /**
     * Update layout ensuring full tenant ownership boundary enforcement.
     */
    public static function update(string $id, array $data, string $tenantId, ?string $userId, ?array $context)
    {
        $layout = self::getById($id, $tenantId);
        
        if (isset($data['project_id'])) {
            Project::where('tenant_id', $tenantId)->where('id', $data['project_id'])->firstOrFail();
        }

        $oldValues = $layout->toArray();

        DB::transaction(function() use ($layout, $data) {
            $layout->update($data);
        });

        $newLayout = $layout->fresh();

        AuditLogService::log([
            'tenantId' => $tenantId,
            'userId' => $userId,
            'entityName' => 'layouts',
            'entityId' => $layout->id,
            'action' => 'UPDATE',
            'oldValues' => $oldValues,
            'newValues' => $newLayout->toArray(),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return self::getById($layout->id, $tenantId);
    }

    /**
     * Delete layout cleanly triggering structural deletion cascades.
     */
    public static function delete(string $id, string $tenantId, ?string $userId, ?array $context)
    {
        $layout = self::getById($id, $tenantId);
        $oldValues = $layout->toArray();

        DB::transaction(function() use ($layout) {
            $layout->delete();
        });

        AuditLogService::log([
            'tenantId' => $tenantId,
            'userId' => $userId,
            'entityName' => 'layouts',
            'entityId' => $id,
            'action' => 'DELETE',
            'oldValues' => $oldValues,
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return true;
    }
}
