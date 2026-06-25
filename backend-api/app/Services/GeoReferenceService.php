<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use App\Models\Layout;
use App\Models\LayoutGeoReference;

class GeoReferenceService
{
    /**
     * Computes 2D Conformal/Similarity transformation parameters (A, B, Cx, Cy)
     * mapping DXF Cartesian (x, y) coordinates to Geographical (lng, lat) coordinates.
     * 
     * lng = A * x - B * y + Cx
     * lat = B * x + A * y + Cy
     */
    public static function calculateTransform(array $anchors): array
    {
        $anchor1DxfX = isset($anchors['anchor_1_dxf_x']) ? (float)$anchors['anchor_1_dxf_x'] : null;
        $anchor1DxfY = isset($anchors['anchor_1_dxf_y']) ? (float)$anchors['anchor_1_dxf_y'] : null;
        $anchor1Lat  = isset($anchors['anchor_1_lat']) ? (float)$anchors['anchor_1_lat'] : null;
        $anchor1Lng  = isset($anchors['anchor_1_lng']) ? (float)$anchors['anchor_1_lng'] : null;

        $anchor2DxfX = isset($anchors['anchor_2_dxf_x']) ? (float)$anchors['anchor_2_dxf_x'] : null;
        $anchor2DxfY = isset($anchors['anchor_2_dxf_y']) ? (float)$anchors['anchor_2_dxf_y'] : null;
        $anchor2Lat  = isset($anchors['anchor_2_lat']) ? (float)$anchors['anchor_2_lat'] : null;
        $anchor2Lng  = isset($anchors['anchor_2_lng']) ? (float)$anchors['anchor_2_lng'] : null;

        if (
            is_null($anchor1DxfX) || is_null($anchor1DxfY) || is_null($anchor1Lat) || is_null($anchor1Lng) ||
            is_null($anchor2DxfX) || is_null($anchor2DxfY) || is_null($anchor2Lat) || is_null($anchor2Lng)
        ) {
            throw new \InvalidArgumentException("Invalid parameters. All 8 anchor coordinates are required.");
        }

        // Validate range of lat/lng
        if ($anchor1Lat < -90 || $anchor1Lat > 90 || $anchor2Lat < -90 || $anchor2Lat > 90) {
            throw new \InvalidArgumentException("Invalid coordinates. Latitude values must be between -90 and 90.");
        }
        if ($anchor1Lng < -180 || $anchor1Lng > 180 || $anchor2Lng < -180 || $anchor2Lng > 180) {
            throw new \InvalidArgumentException("Invalid coordinates. Longitude values must be between -180 and 180.");
        }

        $dx = $anchor2DxfX - $anchor1DxfX;
        $dy = $anchor2DxfY - $anchor1DxfY;
        $dGeoLng = $anchor2Lng - $anchor1Lng;
        $dGeoLat = $anchor2Lat - $anchor1Lat;

        $denominator = $dx * $dx + $dy * $dy;

        if (abs($denominator) < 1e-12) {
            throw new \InvalidArgumentException("Invalid anchor points. Anchors must have distinct DXF coordinates to resolve scale and rotation.");
        }

        // Solve for similarity coefficients
        $A = ($dGeoLng * $dx + $dGeoLat * $dy) / $denominator;
        $B = ($dGeoLat * $dx - $dGeoLng * $dy) / $denominator;

        // Resolve translations using Anchor 1
        $Cx = $anchor1Lng - ($A * $anchor1DxfX - $B * $anchor1DxfY);
        $Cy = $anchor1Lat - ($B * $anchor1DxfX + $A * $anchor1DxfY);

        return [
            'A' => $A,
            'B' => $B,
            'Cx' => $Cx,
            'Cy' => $Cy
        ];
    }

    /**
     * Transforms DXF Cartesian coordinate point (x, y) to Real World Geographical coordinates (lat, lng).
     */
    public static function dxfToGeo(float $x, float $y, array $matrix): array
    {
        $lng = $matrix['A'] * $x - $matrix['B'] * $y + $matrix['Cx'];
        $lat = $matrix['B'] * $x + $matrix['A'] * $y + $matrix['Cy'];
        return ['lat' => $lat, 'lng' => $lng];
    }

    /**
     * Performs inverse transformation from Geographical (lat, lng) to local DXF Cartesian coordinates (x, y).
     */
    public static function geoToDxf(float $lat, float $lng, array $matrix): array
    {
        $M = $matrix['A'] * $matrix['A'] + $matrix['B'] * $matrix['B'];
        if (abs($M) < 1e-24) {
            throw new \InvalidArgumentException("Invalid transform matrix. Scale factor is zero.");
        }

        $dLng = $lng - $matrix['Cx'];
        $dLat = $lat - $matrix['Cy'];

        $x = ($matrix['A'] * $dLng + $matrix['B'] * $dLat) / $M;
        $y = (-$matrix['B'] * $dLng + $matrix['A'] * $dLat) / $M;

        return ['x' => $x, 'y' => $y];
    }

    /**
     * Compiles standard WGS84 GeoJSON from geometry entities.
     */
    public static function compileLayoutGeoJson(string $layoutId, string $tenantId): array
    {
        // 1. Verify layout exists and belongs to the active tenant
        $layout = Layout::join('projects', 'layouts.project_id', '=', 'projects.id')
            ->where('layouts.id', $layoutId)
            ->where('projects.tenant_id', $tenantId)
            ->select('layouts.*')
            ->first();

        if (!$layout) {
            throw new \Exception("Layout not found or access denied.");
        }

        // 2. Fetch georeference matrix
        $geoRef = LayoutGeoReference::where('layout_id', $layoutId)->first();
        if (!$geoRef) {
            throw new \Exception("Layout has not been geo-referenced yet. Please configure geo-referencing anchor points first.");
        }

        $matrix = $geoRef->transform_matrix;
        if (!$matrix || !isset($matrix['A'])) {
            throw new \Exception("Layout georeferencing matrix is corrupted or invalid.");
        }

        // 3. Fetch geometry entities linked to the layout via DXF files
        $geomEntities = DB::table('geometry_entities as ge')
            ->join('import_jobs as j', 'ge.import_job_id', '=', 'j.id')
            ->join('dxf_files as f', 'j.dxf_file_id', '=', 'f.id')
            ->leftJoin('dxf_layer_mappings as m', 'ge.source_layer_mapping_id', '=', 'm.id')
            ->where('f.layout_id', $layoutId)
            ->where('f.tenant_id', $tenantId)
            ->select('ge.id', 'ge.vertices_json', 'ge.geometry_type', 'ge.is_closed', 'm.layer_type', 'ge.layer_name')
            ->get();

        $features = [];

        foreach ($geomEntities as $row) {
            $vertices = $row->vertices_json;
            if (is_string($vertices)) {
                $vertices = json_decode($vertices, true);
            }

            if (!is_array($vertices) || empty($vertices)) {
                continue;
            }

            // Project each vertex from local DXF Cartesian into WGS84 Geo Coordinates [lng, lat]
            $projectedCoords = [];
            foreach ($vertices as $vertex) {
                if (!isset($vertex[0]) || !isset($vertex[1])) {
                    continue;
                }
                $x = (float)$vertex[0];
                $y = (float)$vertex[1];
                $geoPt = self::dxfToGeo($x, $y, $matrix);
                $projectedCoords[] = [$geoPt['lng'], $geoPt['lat']];
            }

            if (empty($projectedCoords)) {
                continue;
            }

            $isClosed = (bool)$row->is_closed;
            $geometryType = strtoupper($row->geometry_type);

            $geojsonGeometry = null;

            if ($isClosed || $geometryType === "LWPOLYLINE" || $geometryType === "POLYLINE") {
                // Polygons must form a closed linear ring
                $first = $projectedCoords[0];
                $last = $projectedCoords[count($projectedCoords) - 1];
                if ($first[0] !== $last[0] || $first[1] !== $last[1]) {
                    $projectedCoords[] = $first;
                }
                $geojsonGeometry = [
                    'type' => 'Polygon',
                    'coordinates' => [$projectedCoords]
                ];
            } else {
                $geojsonGeometry = [
                    'type' => 'LineString',
                    'coordinates' => $projectedCoords
                ];
            }

            $features[] = [
                'type' => 'Feature',
                'id' => $row->id,
                'geometry' => $geojsonGeometry,
                'properties' => [
                    'id' => $row->id,
                    'layer_name' => $row->layer_name,
                    'layer_type' => $row->layer_type,
                    'geometry_type' => $row->geometry_type
                ]
            ];
        }

        if (empty($features)) {
            return [
                'type' => 'FeatureCollection',
                'features' => [],
                'message' => 'No geospatial geometry compiled for this layout.'
            ];
        }

        return [
            'type' => 'FeatureCollection',
            'features' => $features
        ];
    }
}
