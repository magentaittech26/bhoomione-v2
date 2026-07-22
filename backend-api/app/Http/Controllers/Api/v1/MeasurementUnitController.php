<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMeasurementUnitRequest;
use App\Http\Requests\UpdateMeasurementUnitRequest;
use App\Services\MeasurementUnitService;
use Illuminate\Http\Request;

class MeasurementUnitController extends Controller
{
    private function getContextAndTenant(Request $request): array
    {
        $user = $request->attributes->get('authenticatedUser');
        $resolvedTenant = $request->attributes->get('resolvedTenant');
        $tenantId = $resolvedTenant ? $resolvedTenant->id : $request->header('X-Tenant-ID');

        return [
            'userId' => $user ? $user->id : null,
            'tenantId' => $tenantId,
            'context' => [
                'tenantId' => $tenantId,
                'ip' => $request->ip(),
                'userAgent' => $request->userAgent()
            ]
        ];
    }

    /**
     * Check if user has platform master admin access.
     */
    private function isPlatformAdmin(Request $request): bool
    {
        $payload = $request->attributes->get('authenticatedUserPayload');
        $role = $payload['role'] ?? null;
        return in_array(strtoupper($role), ['PLATFORM_ADMIN', 'PLATFORM_SUPER_ADMIN']);
    }

    /*
    |--------------------------------------------------------------------------
    | PLATFORM MASTER REGISTRY ENDPOINTS
    |--------------------------------------------------------------------------
    */

    public function platformIndex(Request $request)
    {
        try {
            $units = MeasurementUnitService::getPlatformPaginated($request->all());
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
                'message' => 'Failed to fetch platform measurement units registry.'
            ], 500);
        }
    }

    public function platformStore(StoreMeasurementUnitRequest $request)
    {
        $validated = $request->validated();
        $aux = $this->getContextAndTenant($request);

        $codeUpper = strtoupper(trim($validated['code']));
        $duplicate = \App\Models\MeasurementUnit::where('code', $codeUpper)
            ->where('is_system', true)
            ->first();

        if ($duplicate) {
            return response()->json([
                'success' => false,
                'message' => 'A platform measurement unit with this code already exists.'
            ], 409);
        }

        try {
            $unit = MeasurementUnitService::createPlatformUnit($validated, $aux['userId'], $aux['context']);
            return response()->json([
                'success' => true,
                'data' => $unit
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Could not create platform measurement unit.'
            ], 400);
        }
    }

    public function platformShow(Request $request, $id)
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

    public function platformUpdate(UpdateMeasurementUnitRequest $request, $id)
    {
        $validated = $request->validated();
        $aux = $this->getContextAndTenant($request);

        try {
            $updatedUnit = MeasurementUnitService::updatePlatformUnit($id, $validated, $aux['userId'], $aux['context']);
            return response()->json([
                'success' => true,
                'data' => $updatedUnit
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Could not update platform measurement unit.'
            ], 400);
        }
    }

    public function platformToggle(Request $request, $id)
    {
        $aux = $this->getContextAndTenant($request);

        try {
            $updatedUnit = MeasurementUnitService::togglePlatformUnit($id, $aux['userId'], $aux['context']);
            return response()->json([
                'success' => true,
                'data' => $updatedUnit
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Could not toggle platform measurement unit state.'
            ], 400);
        }
    }

    public function platformDestroy(Request $request, $id)
    {
        $aux = $this->getContextAndTenant($request);

        try {
            MeasurementUnitService::deletePlatformUnit($id, $aux['userId'], $aux['context']);
            return response()->json([
                'success' => true,
                'message' => 'Platform measurement unit deleted successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Could not delete platform measurement unit.'
            ], 400);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TENANT CONFIGURATION ENDPOINTS
    |--------------------------------------------------------------------------
    */

    public function tenantIndex(Request $request)
    {
        $aux = $this->getContextAndTenant($request);
        $tenantId = $aux['tenantId'];

        if (!$tenantId) {
            return response()->json(['success' => false, 'message' => 'Tenant context missing.'], 400);
        }

        try {
            $units = MeasurementUnitService::getTenantUnits($tenantId, $request->all());
            return response()->json([
                'success' => true,
                'data' => $units
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch tenant measurement units configuration.'
            ], 500);
        }
    }

    public function tenantLookup(Request $request)
    {
        $aux = $this->getContextAndTenant($request);
        $tenantId = $aux['tenantId'];

        if (!$tenantId) {
            // Fallback to platform system units if no tenant context
            return response()->json([
                'success' => true,
                'data' => \App\Models\MeasurementUnit::where('is_active', true)->where('is_system', true)->get()
            ]);
        }

        try {
            $units = MeasurementUnitService::getTenantLookup($tenantId);
            return response()->json([
                'success' => true,
                'data' => $units
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch tenant measurement units lookup.'
            ], 500);
        }
    }

    public function tenantUpdateSetting(Request $request, $id)
    {
        $aux = $this->getContextAndTenant($request);
        $tenantId = $aux['tenantId'];

        if (!$tenantId) {
            return response()->json(['success' => false, 'message' => 'Tenant context missing.'], 400);
        }

        try {
            $setting = MeasurementUnitService::updateTenantUnitSetting($tenantId, $id, $request->all(), $aux['userId'], $aux['context']);
            return response()->json([
                'success' => true,
                'data' => $setting
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Could not update tenant unit setting.'
            ], 400);
        }
    }

    public function tenantSetDefault(Request $request, $id)
    {
        $aux = $this->getContextAndTenant($request);
        $tenantId = $aux['tenantId'];

        if (!$tenantId) {
            return response()->json(['success' => false, 'message' => 'Tenant context missing.'], 400);
        }

        try {
            MeasurementUnitService::setTenantDefaultUnit($tenantId, $id, $aux['userId'], $aux['context']);
            return response()->json([
                'success' => true,
                'message' => 'Tenant default measurement unit updated successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Could not set tenant default measurement unit.'
            ], 400);
        }
    }

    public function tenantCreateCustom(StoreMeasurementUnitRequest $request)
    {
        $aux = $this->getContextAndTenant($request);
        $tenantId = $aux['tenantId'];

        if (!$tenantId) {
            return response()->json(['success' => false, 'message' => 'Tenant context missing.'], 400);
        }

        $validated = $request->validated();

        try {
            $unit = MeasurementUnitService::createTenantCustomUnit($tenantId, $validated, $aux['userId'], $aux['context']);
            return response()->json([
                'success' => true,
                'data' => $unit
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Could not create tenant custom unit.'
            ], 400);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | LEGACY COMPATIBILITY ENDPOINTS (/api/v1/measurement-units)
    |--------------------------------------------------------------------------
    */

    public function index(Request $request)
    {
        $aux = $this->getContextAndTenant($request);
        if ($aux['tenantId']) {
            return $this->tenantIndex($request);
        }
        return $this->platformIndex($request);
    }

    public function lookup(Request $request)
    {
        return $this->tenantLookup($request);
    }

    public function show(Request $request, $id)
    {
        return $this->platformShow($request, $id);
    }

    public function store(StoreMeasurementUnitRequest $request)
    {
        $aux = $this->getContextAndTenant($request);
        if ($this->isPlatformAdmin($request)) {
            return $this->platformStore($request);
        }

        if ($aux['tenantId']) {
            return $this->tenantCreateCustom($request);
        }

        return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
    }

    public function update(UpdateMeasurementUnitRequest $request, $id)
    {
        $aux = $this->getContextAndTenant($request);
        if ($this->isPlatformAdmin($request)) {
            return $this->platformUpdate($request, $id);
        }

        if ($aux['tenantId']) {
            return $this->tenantUpdateSetting($request, $id);
        }

        return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
    }

    public function toggle(Request $request, $id)
    {
        $aux = $this->getContextAndTenant($request);
        if ($this->isPlatformAdmin($request)) {
            return $this->platformToggle($request, $id);
        }

        if ($aux['tenantId']) {
            // Toggle visibility in tenant
            $isEnabled = $request->input('is_enabled', null);
            $setting = MeasurementUnitService::updateTenantUnitSetting($aux['tenantId'], $id, ['is_enabled' => $isEnabled], $aux['userId'], $aux['context']);
            return response()->json(['success' => true, 'data' => $setting]);
        }

        return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
    }

    public function destroy(Request $request, $id)
    {
        if ($this->isPlatformAdmin($request)) {
            return $this->platformDestroy($request, $id);
        }
        return response()->json(['success' => false, 'message' => 'Forbidden. System units cannot be deleted by tenants.'], 403);
    }
}
