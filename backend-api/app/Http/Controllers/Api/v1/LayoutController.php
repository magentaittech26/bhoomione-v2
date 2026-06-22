<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateLayoutRequest;
use App\Http\Requests\UpdateLayoutRequest;
use App\Services\LayoutService;
use Illuminate\Http\Request;

class LayoutController extends Controller
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
     * GET /api/v1/layouts
     */
    public function index(Request $request)
    {
        $tenantId = $this->getTenantId($request);
        $layouts = LayoutService::getPaginated($tenantId, $request->all());
        return response()->json($layouts);
    }

    /**
     * GET /api/v1/layouts/{id}
     */
    public function show(Request $request, $id)
    {
        $tenantId = $this->getTenantId($request);
        try {
            $layout = LayoutService::getById($id, $tenantId);
            return response()->json($layout);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Layout not found or mismatching tenant context.'], 404);
        }
    }

    /**
     * POST /api/v1/layouts
     */
    public function store(CreateLayoutRequest $request)
    {
        $tenantId = $this->getTenantId($request);
        $aux = $this->getContextAndUser($request);
        
        try {
            $layout = LayoutService::create($request->validated(), $tenantId, $aux['userId'], $aux['context']);
            return response()->json($layout, 201);
        } catch (\Exception $e) {
            if ($e->getMessage() === 'LIMIT_EXCEEDED') {
                return response()->json([
                    'error' => 'LIMIT_EXCEEDED',
                    'message' => 'Your subscription layout limit has been exceeded. Please upgrade your plan.'
                ], 403);
            }
            return response()->json(['error' => $e->getMessage() ?: 'Could not create layout.'], 400);
        }
    }

    /**
     * PUT /api/v1/layouts/{id}
     */
    public function update(UpdateLayoutRequest $request, $id)
    {
        $tenantId = $this->getTenantId($request);
        $aux = $this->getContextAndUser($request);
        
        try {
            $layout = LayoutService::update($id, $request->validated(), $tenantId, $aux['userId'], $aux['context']);
            return response()->json($layout);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage() ?: 'Could not update layout.'], 400);
        }
    }

    /**
     * DELETE /api/v1/layouts/{id}
     */
    public function destroy(Request $request, $id)
    {
        $tenantId = $this->getTenantId($request);
        $aux = $this->getContextAndUser($request);
        
        try {
            LayoutService::delete($id, $tenantId, $aux['userId'], $aux['context']);
            return response()->json(['success' => true, 'message' => 'Layout deleted successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage() ?: 'Could not delete layout.'], 400);
        }
    }
}
