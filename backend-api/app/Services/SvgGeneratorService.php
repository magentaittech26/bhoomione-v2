<?php

namespace App\Services;

use App\Models\GeometryEntity;
use App\Models\Plot;
use App\Models\SvgDocument;
use App\Models\SvgElement;
use App\Models\SvgStyleProfile;
use App\Models\SvgLabel;
use App\Models\GenerationBatch;
use App\Models\ImportJobLog;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Exception;

class SvgGeneratorService
{
    /**
     * Seeds default style profiles for a tenant if they don't exist yet.
     */
    public static function seedDefaultProfiles(string $tenantId): void
    {
        $defaults = [
            'PLOT_AVAILABLE' => [
                'fill_color' => '#F1F5F9',
                'stroke_color' => '#64748B',
                'stroke_width' => 1.50,
                'opacity' => 0.90,
            ],
            'PLOT_RESERVED' => [
                'fill_color' => '#FEF3C7',
                'stroke_color' => '#D97706',
                'stroke_width' => 1.50,
                'opacity' => 0.95,
            ],
            'PLOT_BOOKED' => [
                'fill_color' => '#DBEAFE',
                'stroke_color' => '#2563EB',
                'stroke_width' => 1.50,
                'opacity' => 0.95,
            ],
            'PLOT_SOLD' => [
                'fill_color' => '#D1FAE5',
                'stroke_color' => '#059669',
                'stroke_width' => 1.50,
                'opacity' => 0.95,
            ],
            'ROAD_MAIN' => [
                'fill_color' => '#E2E8F0',
                'stroke_color' => '#94A3B8',
                'stroke_width' => 2.00,
                'opacity' => 1.00,
            ],
            'ROAD_INTERNAL' => [
                'fill_color' => '#F8FAFC',
                'stroke_color' => '#CBD5E1',
                'stroke_width' => 1.00,
                'opacity' => 1.00,
            ],
            'PARK' => [
                'fill_color' => '#DCFCE7',
                'stroke_color' => '#16A34A',
                'stroke_width' => 1.50,
                'opacity' => 0.90,
            ],
            'AMENITY' => [
                'fill_color' => '#F3E8FF',
                'stroke_color' => '#7C3AED',
                'stroke_width' => 1.50,
                'opacity' => 0.90,
            ]
        ];

        foreach ($defaults as $key => $values) {
            $exists = SvgStyleProfile::where('tenant_id', $tenantId)
                ->where('profile_key', $key)
                ->exists();

            if (!$exists) {
                SvgStyleProfile::create([
                    'id' => (string) Str::uuid(),
                    'tenant_id' => $tenantId,
                    'profile_key' => $key,
                    'fill_color' => $values['fill_color'],
                    'stroke_color' => $values['stroke_color'],
                    'stroke_width' => $values['stroke_width'],
                    'opacity' => $values['opacity'],
                    'additional_styles' => [],
                ]);
            }
        }
    }

    /**
     * Compile geometry entities and plots of a layout batch into a clean, fully-scaled versioned SVG representation.
     */
    public static function compileSvg(string $tenantId, string $batchId, string $renderProfile = 'DESKTOP'): SvgDocument
    {
        $batch = GenerationBatch::where('id', $batchId)
            ->where('tenant_id', $tenantId)
            ->first();

        if (!$batch) {
            throw new Exception("Generation batch not found or tenant scope mismatch.");
        }

        $importJobId = $batch->import_job_id;

        // Fetch corresponding layout
        $plotSample = Plot::where('generation_batch_id', $batchId)->first();
        if (!$plotSample) {
            throw new Exception("Unable to compile SVG for empty layout setup. No plots mapped containing layout relations.");
        }
        $layoutId = $plotSample->layout_id;

        // Initialize logging
        ImportJobLog::create([
            'id' => (string) Str::uuid(),
            'import_job_id' => $importJobId,
            'log_level' => 'INFO',
            'step_name' => 'SVG_GENERATION_STARTED',
            'message' => "Initiating CAD vector to SVG compilation run for Layout {$layoutId} [Profile: {$renderProfile}].",
            'duration_ms' => 5,
        ]);

        try {
            DB::beginTransaction();

            // 1. Ensure Style Profiles Exist
            self::seedDefaultProfiles($tenantId);

            // 2. Determine Viewport Size based on Render Profile
            $dims = [
                'DESKTOP' => ['w' => 1200, 'h' => 800],
                'TABLET'  => ['w' => 800,  'h' => 600],
                'MOBILE'  => ['w' => 450,  'h' => 650],
            ];
            $selectedDim = $dims[$renderProfile] ?? $dims['DESKTOP'];
            $viewportW = $selectedDim['w'];
            $viewportH = $selectedDim['h'];

            // 3. Look up and calculate bounds of valid geometry entities
            $geometries = GeometryEntity::with('sourceLayerMapping')
                ->where('import_job_id', $importJobId)
                ->where('validation_status', 'VALID')
                ->get();

            if ($geometries->isEmpty()) {
                throw new Exception("No valid geometry entities found to project into SVG paths.");
            }

            $minX = null;
            $minY = null;
            $maxX = null;
            $maxY = null;

            foreach ($geometries as $geo) {
                $vArray = $geo->vertices_json; // array of [x, y]
                if (empty($vArray)) continue;

                foreach ($vArray as $pt) {
                    $x = (float)$pt[0];
                    $y = (float)$pt[1];

                    if ($minX === null || $x < $minX) $minX = $x;
                    if ($maxX === null || $x > $maxX) $maxX = $x;
                    if ($minY === null || $y < $minY) $minY = $y;
                    if ($maxY === null || $y > $maxY) $maxY = $y;
                }
            }

            if ($minX === null) {
                throw new Exception("Failed to compute spatial envelope bounds for layout geometries.");
            }

            // Delta Ranges
            $rawW = $maxX - $minX;
            $rawH = $maxY - $minY;
            if ($rawW <= 0.0) $rawW = 1.0;
            if ($rawH <= 0.0) $rawH = 1.0;

            // Compute scaling (S) & offset (Margin/Padding centering factor)
            $availableW = $viewportW * 0.95; // 5% border buffer
            $availableH = $viewportH * 0.95;

            $scaleX = $availableW / $rawW;
            $scaleY = $availableH / $rawH;
            $scale = min($scaleX, $scaleY);

            $offsetX = ($viewportW - ($rawW * $scale)) / 2.0;
            $offsetY = ($viewportH - ($rawH * $scale)) / 2.0;

            // 4. Resolve Version
            $latestDoc = SvgDocument::where('layout_id', $layoutId)
                ->where('render_profile', $renderProfile)
                ->orderBy('version', 'desc')
                ->first();
            $nextVersion = $latestDoc ? ($latestDoc->version + 1) : 1;

            // 5. Create SVG Document
            $docId = (string) Str::uuid();
            $svgDoc = SvgDocument::create([
                'id' => $docId,
                'tenant_id' => $tenantId,
                'layout_id' => $layoutId,
                'generation_batch_id' => $batchId,
                'width' => $viewportW,
                'height' => $viewportH,
                'viewbox' => "0 0 {$viewportW} {$viewportH}",
                'version' => $nextVersion,
                'render_profile' => $renderProfile,
            ]);

            // Cache profiles for faster layer assignment
            $profiles = SvgStyleProfile::where('tenant_id', $tenantId)->get()->keyBy('profile_key');

            $elementCount = 0;
            $labelCount = 0;

            // 6. Generate and store SVG Elements
            foreach ($geometries as $geo) {
                $vArray = $geo->vertices_json;
                if (empty($vArray)) continue;

                $mapping = $geo->sourceLayerMapping;
                $layerType = $mapping ? $mapping->layer_type : 'IGNORE';

                if ($layerType === 'IGNORE') {
                    continue;
                }

                // Determine styling profile key
                $profileKey = 'PLOT_AVAILABLE';
                if ($layerType === 'PLOT') {
                    $profileKey = 'PLOT_AVAILABLE';
                } elseif ($layerType === 'ROAD') {
                    $lowerLayer = strtolower($geo->layer_name);
                    $profileKey = str_contains($lowerLayer, 'main') ? 'ROAD_MAIN' : 'ROAD_INTERNAL';
                } elseif ($layerType === 'AMENITY' || $layerType === 'UTILITY') {
                    $lowerLayer = strtolower($geo->layer_name);
                    $profileKey = (str_contains($lowerLayer, 'green') || str_contains($lowerLayer, 'garden')) ? 'PARK' : 'AMENITY';
                }

                $profile = $profiles->get($profileKey);
                $fill = $profile ? $profile->fill_color : '#E2E8F0';
                $stroke = $profile ? $profile->stroke_color : '#475569';
                $sw = $profile ? $profile->stroke_width : 1.00;
                $op = $profile ? $profile->opacity : 1.00;

                // Project points to visual space
                $projectedPoints = [];
                $pointsStrArray = [];
                $svgPathArray = [];

                foreach ($vArray as $idx => $pt) {
                    $rawPX = (float)$pt[0];
                    $rawPY = (float)$pt[1];

                    // Standard reverse mapping projection
                    $projPX = ($rawPX - $minX) * $scale + $offsetX;
                    $projPY = ($maxY - $rawPY) * $scale + $offsetY;

                    $projectedPoints[] = [$projPX, $projPY];
                    $pointsStrArray[] = round($projPX, 3) . "," . round($projPY, 3);

                    if ($idx === 0) {
                        $svgPathArray[] = "M " . round($projPX, 3) . " " . round($projPY, 3);
                    } else {
                        $svgPathArray[] = "L " . round($projPX, 3) . " " . round($projPY, 3);
                    }
                }

                // Close layout path loop
                if (count($projectedPoints) >= 3) {
                    $svgPathArray[] = "Z";
                }

                $pathD = implode(" ", $svgPathArray);
                $polyPoints = implode(" ", $pointsStrArray);

                // Build complete SVG node markup XML
                $svgMarkup = "";
                $elType = 'PATH';

                if ($layerType === 'PLOT') {
                    $elType = 'POLYGON';
                    $svgMarkup = "<polygon points=\"{$polyPoints}\" fill=\"{$fill}\" stroke=\"{$stroke}\" stroke-width=\"{$sw}\" fill-opacity=\"{$op}\" />";
                } else {
                    $elType = 'PATH';
                    $svgMarkup = "<path d=\"{$pathD}\" fill=\"{$fill}\" stroke=\"{$stroke}\" stroke-width=\"{$sw}\" fill-opacity=\"{$op}\" />";
                }

                // Write SVG Element Model
                SvgElement::create([
                    'id' => (string) Str::uuid(),
                    'svg_document_id' => $docId,
                    'source_geometry_entity_id' => $geo->id,
                    'element_type' => $elType,
                    'svg_data' => $svgMarkup,
                    'metadata' => [
                        'layer_name' => $geo->layer_name,
                        'layer_type' => $layerType,
                        'style_profile' => $profileKey,
                        'bounds' => [
                            'minX' => $geo->bounding_box['minX'] ?? 0.0,
                            'minY' => $geo->bounding_box['minY'] ?? 0.0,
                            'maxX' => $geo->bounding_box['maxX'] ?? 0.0,
                            'maxY' => $geo->bounding_box['maxY'] ?? 0.0,
                        ],
                    ],
                ]);

                $elementCount++;

                // 7. Write Plot Labels (only for plots)
                if ($layerType === 'PLOT') {
                    $mappedPlot = Plot::where('source_geometry_entity_id', $geo->id)
                        ->where('generation_batch_id', $batchId)
                        ->first();

                    if ($mappedPlot) {
                        // Calculate centroid from projected points
                        $sumX = 0.0;
                        $sumY = 0.0;
                        foreach ($projectedPoints as $p) {
                            $sumX += $p[0];
                            $sumY += $p[1];
                        }
                        $centroidX = $sumX / count($projectedPoints);
                        $centroidY = $sumY / count($projectedPoints);

                        // Save Label Model
                        SvgLabel::create([
                            'id' => (string) Str::uuid(),
                            'svg_document_id' => $docId,
                            'source_plot_id' => $mappedPlot->id,
                            'text' => $mappedPlot->plot_number,
                            'x' => round($centroidX, 3),
                            'y' => round($centroidY, 3),
                            'rotation' => 0.00,
                        ]);

                        $labelCount++;
                    }
                }
            }

            // Create Group Elements or boundaries if any
            ImportJobLog::create([
                'id' => (string) Str::uuid(),
                'import_job_id' => $importJobId,
                'log_level' => 'INFO',
                'step_name' => 'SVG_GENERATION_LAYERS_COMPREHENSION',
                'message' => "Successfully defined SVG Document v{$nextVersion} for batch {$batchId}. Generated standard elements.",
                'duration_ms' => 15,
            ]);

            ImportJobLog::create([
                'id' => (string) Str::uuid(),
                'import_job_id' => $importJobId,
                'log_level' => 'INFO',
                'step_name' => 'SVG_GENERATION_PATHS_COMMITTED',
                'message' => "Successfully compiled and committed {$elementCount} geometric shapes and {$labelCount} plot label coordinates.",
                'duration_ms' => 40,
            ]);

            ImportJobLog::create([
                'id' => (string) Str::uuid(),
                'import_job_id' => $importJobId,
                'log_level' => 'INFO',
                'step_name' => 'SVG_GENERATION_COMPLETED',
                'message' => "SVG vector documentation compiled successfully. Mapped geometries stashed inside document ID {$docId}.",
                'duration_ms' => 10,
            ]);

            DB::commit();

            return $svgDoc;

        } catch (Exception $e) {
            DB::rollBack();

            ImportJobLog::create([
                'id' => (string) Str::uuid(),
                'import_job_id' => $importJobId,
                'log_level' => 'ERROR',
                'step_name' => 'SVG_GENERATION_FAILED',
                'message' => "SVG generation aborted. Error details: " . $e->getMessage(),
                'duration_ms' => 20,
            ]);

            throw $e;
        }
    }
}
