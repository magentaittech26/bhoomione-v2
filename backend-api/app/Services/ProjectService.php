<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class ProjectService
{
    /**
     * List all projects within a given tenant ID.
     */
    public static function getAll(string $tenantId)
    {
        return Project::where('tenant_id', $tenantId)->get();
    }

    /**
     * Get paginated, searched, filtered and sorted projects.
     */
    public static function getPaginated(string $tenantId, array $params)
    {
        $perPage = isset($params['per_page']) ? (int) $params['per_page'] : 6;
        $query = Project::where('tenant_id', $tenantId)->withCount([
            'layouts',
            'plots',
            'availablePlots as available_plots_count',
            'reservedPlots as reserved_plots_count'
        ]);

        if (!empty($params['search'])) {
            $search = '%' . strtolower($params['search']) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', $search)
                  ->orWhere('code', 'ILIKE', $search)
                  ->orWhere('developer_name', 'ILIKE', $search)
                  ->orWhere('location', 'ILIKE', $search)
                  ->orWhere('rera_number', 'ILIKE', $search);
            });
        }

        if (!empty($params['location'])) {
            $query->where('location', $params['location']);
        }

        if (!empty($params['approval_status'])) {
            $query->where('approval_status', $params['approval_status']);
        }

        if (!empty($params['status'])) {
            $query->where('status', $params['status']);
        }

        $sortBy = !empty($params['sort_by']) ? $params['sort_by'] : 'created_at';
        $allowedSorts = ['name', 'code', 'location', 'approval_status', 'status', 'created_at'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }
        $sortDir = !empty($params['sort_direction']) && strtolower($params['sort_direction']) === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    /**
     * Find a specific project inside active tenant context.
     */
    public static function getById(string $id, string $tenantId)
    {
        return Project::where('tenant_id', $tenantId)->where('id', $id)->firstOrFail();
    }

    /**
     * Create a new project, commit transaction, and log system audit trails.
     */
    public static function create(array $data, string $tenantId, ?string $userId, ?array $context)
    {
        // Enforce plan limits on active tenant workspace
        \App\Services\SubscriptionEnforcementEngine::checkLimit($tenantId, 'projects');

        $uuid = (string) Str::uuid();
        
        $project = DB::transaction(function() use ($uuid, $tenantId, $data) {
            return Project::create(array_merge($data, [
                'id' => $uuid,
                'tenant_id' => $tenantId,
            ]));
        });

        AuditLogService::log([
            'tenantId' => $tenantId,
            'userId' => $userId,
            'entityName' => 'projects',
            'entityId' => $project->id,
            'action' => 'CREATE',
            'newValues' => $project->toArray(),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return $project;
    }

    /**
     * Update an existing project under tenant constraints, logging old and new parameter states.
     */
    public static function update(string $id, array $data, string $tenantId, ?string $userId, ?array $context)
    {
        $project = self::getById($id, $tenantId);
        $oldValues = $project->toArray();

        DB::transaction(function() use ($project, $data) {
            $project->update($data);
        });

        $newProject = $project->fresh();

        AuditLogService::log([
            'tenantId' => $tenantId,
            'userId' => $userId,
            'entityName' => 'projects',
            'entityId' => $project->id,
            'action' => 'UPDATE',
            'oldValues' => $oldValues,
            'newValues' => $newProject->toArray(),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return $newProject;
    }

    /**
     * Delete a project with cascade protection and write system log files.
     */
    public static function delete(string $id, string $tenantId, ?string $userId, ?array $context)
    {
        $project = self::getById($id, $tenantId);
        $oldValues = $project->toArray();

        DB::transaction(function() use ($project) {
            $project->delete();
        });

        AuditLogService::log([
            'tenantId' => $tenantId,
            'userId' => $userId,
            'entityName' => 'projects',
            'entityId' => $id,
            'action' => 'DELETE',
            'oldValues' => $oldValues,
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return true;
    }
}
