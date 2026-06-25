<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Services\ProjectService;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    /**
     * Resolve active tenant context dynamically from headers or user allocations.
     */
    private function getTenantId(Request $request): string
    {
        $resolvedTenant = $request->attributes->get('resolvedTenant');
        $tenantId = $resolvedTenant ? $resolvedTenant->id : ($request->attributes->get('authenticatedUserPayload')['tenantId'] ?? null);
        
        if (!$tenantId) {
            abort(response()->json([
                'error' => 'Tenant context could not be resolved. Please specify X-Tenant-ID header.'
            ], 400));
        }

        return $tenantId;
    }

    /**
     * Extract user details and connection context parameters.
     */
    private function getContextAndUser(Request $request): array
    {
        $user = $request->attributes->get('authenticatedUser');
        return [
            'userId' => $user ? $user->id : null,
            'context' => [
                'ip' => $request->ip(),
                'userAgent' => $request->userAgent()
            ]
        ];
    }

    /**
     * GET /api/v1/projects
     */
    public function index(Request $request)
    {
        $tenantId = $this->getTenantId($request);
        $projects = ProjectService::getPaginated($tenantId, $request->all());
        return response()->json($projects);
    }

    /**
     * GET /api/v1/projects/{id}
     */
    public function show(Request $request, $id)
    {
        $tenantId = $this->getTenantId($request);
        try {
            $project = ProjectService::getById($id, $tenantId);
            return response()->json($project);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Project not found or mismatching tenant context.'], 404);
        }
    }

    /**
     * POST /api/v1/projects
     */
    public function store(CreateProjectRequest $request)
    {
        $tenantId = $this->getTenantId($request);
        $aux = $this->getContextAndUser($request);
        
        try {
            $project = ProjectService::create($request->validated(), $tenantId, $aux['userId'], $aux['context']);
            return response()->json($project, 201);
        } catch (\Exception $e) {
            if ($e->getMessage() === 'LIMIT_EXCEEDED') {
                $limits = \App\Services\SubscriptionEnforcementEngine::getEffectiveLimits($tenantId);
                $usage = \App\Services\SubscriptionEnforcementEngine::getUsage($tenantId);
                return response()->json([
                    'error' => 'LIMIT_EXCEEDED',
                    'message' => 'Your subscription project limit has been exceeded. Please upgrade your plan.',
                    'limit' => $limits['projectsLimit'] ?? 0,
                    'current_usage' => $usage['projects_count'] ?? 0
                ], 403);
            }
            return response()->json(['error' => $e->getMessage() ?: 'Could not create project.'], 400);
        }
    }

    /**
     * PUT /api/v1/projects/{id}
     */
    public function update(UpdateProjectRequest $request, $id)
    {
        $tenantId = $this->getTenantId($request);
        $aux = $this->getContextAndUser($request);
        
        try {
            $project = ProjectService::update($id, $request->validated(), $tenantId, $aux['userId'], $aux['context']);
            return response()->json($project);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage() ?: 'Could not update project.'], 400);
        }
    }

    /**
     * DELETE /api/v1/projects/{id}
     */
    public function destroy(Request $request, $id)
    {
        $tenantId = $this->getTenantId($request);
        $aux = $this->getContextAndUser($request);
        
        try {
            ProjectService::delete($id, $tenantId, $aux['userId'], $aux['context']);
            return response()->json(['success' => true, 'message' => 'Project deleted successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage() ?: 'Could not delete project.'], 400);
        }
    }
}
