<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Layout;
use App\Models\LayoutGeoReference;
use App\Services\GeoReferenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LayoutGeoController extends Controller
{
    /**
     * Resolve active tenant context dynamically.
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
     * GET /api/v1/layouts/{id}/geo-status
     */
    public function geoStatus(Request $request, $id)
    {
        $tenantId = $this->getTenantId($request);

        $layout = Layout::join('projects', 'layouts.project_id', '=', 'projects.id')
            ->where('layouts.id', $id)
            ->where('projects.tenant_id', $tenantId)
            ->select('layouts.*')
            ->first();

        if (!$layout) {
            return response()->json(['error' => 'Layout not found or mismatching tenant context.'], 404);
        }

        $geoRef = LayoutGeoReference::where('layout_id', $id)->first();

        if (!$geoRef) {
            return response()->json([
                'is_georeferenced' => false,
                'layout_id' => $id,
                'anchor_1_dxf_x' => null,
                'anchor_1_dxf_y' => null,
                'anchor_1_lat' => null,
                'anchor_1_lng' => null,
                'anchor_2_dxf_x' => null,
                'anchor_2_dxf_y' => null,
                'anchor_2_lat' => null,
                'anchor_2_lng' => null,
                'transform_matrix' => null
            ]);
        }

        return response()->json([
            'is_georeferenced' => true,
            'layout_id' => $id,
            'anchor_1_dxf_x' => (float)$geoRef->anchor_1_dxf_x,
            'anchor_1_dxf_y' => (float)$geoRef->anchor_1_dxf_y,
            'anchor_1_lat' => (float)$geoRef->anchor_1_lat,
            'anchor_1_lng' => (float)$geoRef->anchor_1_lng,
            'anchor_2_dxf_x' => (float)$geoRef->anchor_2_dxf_x,
            'anchor_2_dxf_y' => (float)$geoRef->anchor_2_dxf_y,
            'anchor_2_lat' => (float)$geoRef->anchor_2_lat,
            'anchor_2_lng' => (float)$geoRef->anchor_2_lng,
            'transform_matrix' => $geoRef->transform_matrix
        ]);
    }

    /**
     * POST /api/v1/layouts/{id}/geo-reference
     */
    public function geoReference(Request $request, $id)
    {
        $tenantId = $this->getTenantId($request);

        $layout = Layout::join('projects', 'layouts.project_id', '=', 'projects.id')
            ->where('layouts.id', $id)
            ->where('projects.tenant_id', $tenantId)
            ->select('layouts.*')
            ->first();

        if (!$layout) {
            return response()->json(['error' => 'Layout not found or mismatching tenant context.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'anchor_1_dxf_x' => 'required|numeric',
            'anchor_1_dxf_y' => 'required|numeric',
            'anchor_1_lat' => 'required|numeric|between:-90,90',
            'anchor_1_lng' => 'required|numeric|between:-180,180',
            'anchor_2_dxf_x' => 'required|numeric',
            'anchor_2_dxf_y' => 'required|numeric',
            'anchor_2_lat' => 'required|numeric|between:-90,90',
            'anchor_2_lng' => 'required|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'BAD_REQUEST',
                'message' => 'Coordinates must be valid numeric expressions and within normal lat/lng bounds.',
                'errors' => $validator->errors()
            ], 400);
        }

        $validated = $validator->validated();

        try {
            $matrix = GeoReferenceService::calculateTransform($validated);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'error' => 'BAD_REQUEST',
                'message' => $e->getMessage()
            ], 400);
        }

        $geoRef = LayoutGeoReference::updateOrCreate(
            ['layout_id' => $id],
            array_merge($validated, [
                'tenant_id' => $tenantId,
                'transform_matrix' => $matrix
            ])
        );

        return response()->json([
            'success' => true,
            'message' => 'Matrix computed and saved.',
            'is_georeferenced' => true,
            'layout_id' => $id,
            'transform_matrix' => $matrix
        ]);
    }

    /**
     * GET /api/v1/layouts/{id}/geojson
     */
    public function geoJson(Request $request, $id)
    {
        $tenantId = $this->getTenantId($request);

        try {
            $geojson = GeoReferenceService::compileLayoutGeoJson($id, $tenantId);
            return response()->json($geojson);
        } catch (\Exception $e) {
            if ($e->getMessage() === 'Layout not found or access denied.') {
                return response()->json(['error' => 'Layout not found or mismatching tenant context.'], 404);
            }
            return response()->json([
                'error' => 'GEOREFERENCE_ERROR',
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
