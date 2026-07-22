<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMeasurementUnitRequest;
use App\Http\Requests\UpdateMeasurementUnitRequest;
use App\Services\MeasurementUnitService;
use Illuminate\Http\Request;

class MeasurementUnitController extends Controller
{
    /**
     * Extract user details and connection context parameters.
     */
    private function getContextAndUser(Request $request): array
    {
        $user = $request->attributes->get('authenticatedUser');
        $resolvedTenant = $request->attributes->get('resolvedTenant');
        return [
            'userId' => $user ? $user->id : null,
            'context' => [
                'tenantId' => $resolvedTenant ? $resolvedTenant->id : null,
                'ip' => $request->ip(),
                'userAgent' => $request->userAgent()
            ]
        ];
    }

    /**
     * Check if the authenticated user has platform level access.
     */
    private function isPlatformAdmin(Request $request): bool
    {
        $payload = $request->attributes->get('authenticatedUserPayload');
        $role = $payload['role'] ?? null;
        return in_array(strtoupper($role), ['DEVELOPER_OWNER', 'DEVELOPER_ADMIN', 'PLATFORM_ADMIN']);
    }

    /**
     * GET /api/v1/measurement-units
     */
    public function index(Request $request)
    {
        try {
            $units = MeasurementUnitService::getPaginated($request->all());
            return response()->json([
                'success' => true,
                'data' => $units->items(),
                'meta' => [
                    'total' => $units->total(),
                    'page' => $units->currentPage(),
                    'per_page' => $units->perPage(),
                    'last_page' => $units->lastPage()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch measurement units registry.'
            ], 500);
        }
    }

    /**
     * GET /api/v1/measurement-units/lookup
     */
    public function lookup(Request $request)
    {
        try {
            $units = MeasurementUnitService::getLookup();
            return response()->json([
                'success' => true,
                'data' => $units
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch measurement units lookup.'
            ], 500);
        }
    }

    /**
     * GET /api/v1/measurement-units/{id}
     */
    public function show(Request $request, $id)
    {
        try {
            $unit = MeasurementUnitService::getById($id);
            return response()->json([
                'success' => true,
                'data' => $unit
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Measurement unit not found.'
            ], 404);
        }
    }

    /**
     * POST /api/v1/measurement-units
     */
    public function store(StoreMeasurementUnitRequest $request)
    {
        $validated = $request->validated();
        $aux = $this->getContextAndUser($request);

        // Code duplicate check
        $codeUpper = strtoupper(trim($validated['code']));
        $duplicate = \App\Models\MeasurementUnit::where('code', $codeUpper)->first();
        if ($duplicate) {
            return response()->json([
                'success' => false,
                'message' => 'A measurement unit with this code already exists.'
            ], 409);
        }

        // Platform-wide protection for is_system / is_default fields
        $isPlatformAdmin = $this->isPlatformAdmin($request);
        if ((!empty($validated['is_system']) || !empty($validated['is_default'])) && !$isPlatformAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Tenant users are not authorized to create platform-wide system defaults.'
            ], 403);
        }

        try {
            $unit = MeasurementUnitService::create($validated, $aux['userId'], $aux['context']);
            return response()->json([
                'success' => true,
                'data' => $unit
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Could not create measurement unit.'
            ], 400);
        }
    }

    /**
     * PUT /api/v1/measurement-units/{id}
     */
    public function update(UpdateMeasurementUnitRequest $request, $id)
    {
        $validated = $request->validated();
        $aux = $this->getContextAndUser($request);

        try {
            $unit = MeasurementUnitService::getById($id);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Measurement unit not found.'
            ], 404);
        }

        // Code duplicate check on rename
        if (!empty($validated['code'])) {
            $codeUpper = strtoupper(trim($validated['code']));
            $duplicate = \App\Models\MeasurementUnit::where('code', $codeUpper)
                ->where('id', '!=', $id)
                ->first();
            if ($duplicate) {
                return response()->json([
                    'success' => false,
                    'message' => 'A measurement unit with this code already exists.'
                ], 409);
            }
        }

        // Platform-wide protection for system/default modifications
        $isPlatformAdmin = $this->isPlatformAdmin($request);
        $systemChange = isset($validated['is_system']) && $validated['is_system'] !== $unit->is_system;
        $defaultChange = isset($validated['is_default']) && $validated['is_default'] !== $unit->is_default;
        if (($systemChange || $defaultChange) && !$isPlatformAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Tenant users are not authorized to modify platform-wide system defaults.'
            ], 403);
        }

        try {
            $updatedUnit = MeasurementUnitService::update($id, $validated, $aux['userId'], $aux['context']);
            return response()->json([
                'success' => true,
                'data' => $updatedUnit
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Could not update measurement unit.'
            ], 400);
        }
    }

    /**
     * PATCH /api/v1/measurement-units/{id}/toggle
     */
    public function toggle(Request $request, $id)
    {
        $aux = $this->getContextAndUser($request);

        try {
            $unit = MeasurementUnitService::getById($id);
            $updatedUnit = MeasurementUnitService::update($id, ['is_active' => !$unit->is_active], $aux['userId'], $aux['context']);
            return response()->json([
                'success' => true,
                'data' => $updatedUnit
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Could not toggle measurement unit state.'
            ], 400);
        }
    }

    /**
     * DELETE /api/v1/measurement-units/{id}
     */
    public function destroy(Request $request, $id)
    {
        $aux = $this->getContextAndUser($request);

        try {
            $unit = MeasurementUnitService::getById($id);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Measurement unit not found.'
            ], 404);
        }

        try {
            MeasurementUnitService::delete($id, $aux['userId'], $aux['context']);
            return response()->json([
                'success' => true,
                'message' => 'Measurement unit deleted successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Could not delete measurement unit.'
            ], 400);
        }
    }
}
