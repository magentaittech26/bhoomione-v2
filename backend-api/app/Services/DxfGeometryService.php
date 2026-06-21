<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Str;

class DxfGeometryService
{
    /**
     * Extract geometry entities and diagnostic statistics from a DXF file.
     *
     * @param string $filePath Full filesystem path to the DXF file.
     * @return array Extracted geometry elements and diagnostics summary.
     */
    public static function extractGeometries(string $filePath): array
    {
        if (!file_exists($filePath)) {
            throw new Exception("Source file does not exist at path: " . $filePath);
        }

        $handle = fopen($filePath, 'r');
        if (!$handle) {
            throw new Exception("Failed to open DXF stream: " . $filePath);
        }

        $entities = [];
        $diagnostics = [
            'CIRCLE' => 0,
            'ARC' => 0,
            'SPLINE' => 0,
            'INSERT' => 0,
            'TEXT' => 0,
            'MTEXT' => 0,
        ];

        $currentEntity = null;
        $activePolyline = null;
        $sourceUnit = 'METERS'; // Initial default

        while (($groupLine = fgets($handle)) !== false) {
            $valueLine = fgets($handle);
            if ($valueLine === false) {
                break;
            }

            $group = (int)trim($groupLine);
            $value = trim($valueLine);

            // Fetch measurement units if in HEADER section
            if ($group === 9 && $value === '$INSUNITS') {
                $unitsGroup = fgets($handle);
                $unitsValue = fgets($handle);
                if ($unitsValue !== false) {
                    $unitsCode = (int)trim($unitsValue);
                    $sourceUnit = self::resolveUnitCode($unitsCode);
                }
                continue;
            }

            if ($group === 0) {
                // Save completed entity
                if ($currentEntity !== null) {
                    if (in_array($currentEntity['type'], ['LINE', 'LWPOLYLINE'])) {
                        $entities[] = $currentEntity;
                    }
                }

                if ($value === 'VERTEX' && $activePolyline !== null) {
                    $currentEntity = [
                        'type' => 'VERTEX',
                        'temp_x' => null,
                        'temp_y' => null,
                    ];
                } elseif ($value === 'SEQEND') {
                    if ($activePolyline !== null) {
                        $entities[] = $activePolyline;
                        $activePolyline = null;
                    }
                    $currentEntity = null;
                } else {
                    $currentEntity = [
                        'type' => $value,
                        'layer' => '0',
                        'points' => [],
                        'temp_x' => null,
                        'temp_y' => null,
                        'end_x' => null,
                        'end_y' => null,
                        'flags' => 0,
                    ];

                    if ($value === 'POLYLINE') {
                        $activePolyline = $currentEntity;
                    }

                    if (array_key_exists($value, $diagnostics)) {
                        $diagnostics[$value]++;
                    }
                }
            } else {
                if ($currentEntity !== null) {
                    switch ($group) {
                        case 8: // Layer Name
                            $currentEntity['layer'] = $value;
                            break;
                        case 70: // Flags
                            $currentEntity['flags'] = (int)$value;
                            if ($activePolyline !== null && $currentEntity['type'] === 'POLYLINE') {
                                $activePolyline['flags'] = (int)$value;
                            }
                            break;
                        case 10: // X
                            $currentEntity['temp_x'] = (float)$value;
                            break;
                        case 20: // Y
                            $currentEntity['temp_y'] = (float)$value;
                            if (in_array($currentEntity['type'], ['LWPOLYLINE', 'VERTEX'])) {
                                if ($currentEntity['temp_x'] !== null && $currentEntity['temp_y'] !== null) {
                                    $pt = [$currentEntity['temp_x'], $currentEntity['temp_y']];
                                    if ($currentEntity['type'] === 'VERTEX' && $activePolyline !== null) {
                                        $activePolyline['points'][] = $pt;
                                    } elseif ($currentEntity['type'] === 'LWPOLYLINE') {
                                        $currentEntity['points'][] = $pt;
                                    }
                                    $currentEntity['temp_x'] = null;
                                    $currentEntity['temp_y'] = null;
                                }
                            }
                            break;
                        case 11: // LINE end X
                            $currentEntity['end_x'] = (float)$value;
                            break;
                        case 21: // LINE end Y
                            $currentEntity['end_y'] = (float)$value;
                            break;
                    }
                }
            }
        }

        if ($currentEntity !== null && in_array($currentEntity['type'], ['LINE', 'LWPOLYLINE'])) {
            $entities[] = $currentEntity;
        }

        fclose($handle);

        // Process entities into normalized records
        $processedGeometries = [];
        $precisionFactor = self::getUnitConversionFactor($sourceUnit);

        foreach ($entities as $ent) {
            $type = $ent['type'];
            $layer = $ent['layer'];
            $points = [];
            $isClosed = false;

            if ($type === 'LINE') {
                $startX = ($ent['temp_x'] ?? 0.0) * $precisionFactor;
                $startY = ($ent['temp_y'] ?? 0.0) * $precisionFactor;
                $endX = ($ent['end_x'] ?? 0.0) * $precisionFactor;
                $endY = ($ent['end_y'] ?? 0.0) * $precisionFactor;
                $points = [
                    [$startX, $startY],
                    [$endX, $endY]
                ];
                $isClosed = false;
            } elseif ($type === 'LWPOLYLINE' || $type === 'POLYLINE') {
                $rawPoints = $ent['points'];
                if (empty($rawPoints)) {
                    continue;
                }

                foreach ($rawPoints as $p) {
                    $points[] = [
                        $p[0] * $precisionFactor,
                        $p[1] * $precisionFactor
                    ];
                }

                $bitmaskClosed = (($ent['flags'] & 1) === 1);
                $euclideanClosed = false;

                if (count($points) >= 3) {
                    $first = $points[0];
                    $last = $points[count($points) - 1];
                    $dist = sqrt(pow($last[0] - $first[0], 2) + pow($last[1] - $first[1], 2));
                    if ($dist <= 1e-6) {
                        $euclideanClosed = true;
                    }
                }

                $isClosed = $bitmaskClosed || $euclideanClosed;
            } else {
                continue;
            }

            if (empty($points)) {
                continue;
            }

            $vertexCount = count($points);

            // Bounding Box Calculation
            $minX = $points[0][0];
            $minY = $points[0][1];
            $maxX = $points[0][0];
            $maxY = $points[0][1];

            foreach ($points as $p) {
                if ($p[0] < $minX) $minX = $p[0];
                if ($p[0] > $maxX) $maxX = $p[0];
                if ($p[1] < $minY) $minY = $p[1];
                if ($p[1] > $maxY) $maxY = $p[1];
            }

            // Area Calculation using Shoelace Formula
            $area = 0.0;
            if ($isClosed && $vertexCount >= 3) {
                $sum = 0.0;
                for ($i = 0; $i < $vertexCount; $i++) {
                    $j = ($i + 1) % $vertexCount;
                    $sum += ($points[$i][0] * $points[$j][1]) - ($points[$j][0] * $points[$i][1]);
                }
                $area = abs($sum) * 0.5;
            }

            // Geometry Hashing & Canonical Sorting
            $sortedPoints = $points;
            usort($sortedPoints, function($a, $b) {
                if (abs($a[0] - $b[0]) < 1e-4) {
                    return $a[1] <=> $b[1];
                }
                return $a[0] <=> $b[0];
            });

            $hashString = "points:";
            foreach ($sortedPoints as $p) {
                $hashString .= sprintf("(%.4f,%.4f)", $p[0], $p[1]);
            }
            $geometryHash = hash('sha256', $hashString);

            $processedGeometries[] = [
                'geometry_type' => $type,
                'layer_name' => $layer,
                'is_closed' => $isClosed,
                'vertex_count' => $vertexCount,
                'vertices_json' => $points,
                'area_value' => $area,
                'bounding_box' => [
                    'minX' => $minX,
                    'minY' => $minY,
                    'maxX' => $maxX,
                    'maxY' => $maxY
                ],
                'geometry_hash' => $geometryHash,
            ];
        }

        return [
            'geometries' => $processedGeometries,
            'diagnostics' => $diagnostics,
            'source_unit' => $sourceUnit,
            'normalized_unit' => 'METERS',
        ];
    }

    /**
     * Parse topological vectors for complex self-intersection.
     */
    public static function isSelfIntersecting(array $points): bool
    {
        $n = count($points);
        if ($n < 4) {
            return false;
        }

        for ($i = 0; $i < $n - 1; $i++) {
            for ($j = $i + 2; $j < $n - 1; $j++) {
                if ($i === 0 && $j === $n - 2) {
                    continue; // Skip adjacent endpoints segment
                }

                $p1 = $points[$i];
                $q1 = $points[$i + 1];
                $p2 = $points[$j];
                $q2 = $points[$j + 1];

                if (self::segmentsIntersect($p1, $q1, $p2, $q2)) {
                    return true;
                }
            }
        }
        return false;
    }

    private static function segmentsIntersect($p1, $q1, $p2, $q2): bool
    {
        $o1 = self::getOrientation($p1, $q1, $p2);
        $o2 = self::getOrientation($p1, $q1, $q2);
        $o3 = self::getOrientation($p2, $q2, $p1);
        $o4 = self::getOrientation($p2, $q2, $q1);

        if ($o1 !== $o2 && $o3 !== $o4) {
            return true;
        }
        return false;
    }

    private static function getOrientation($p, $q, $r): int
    {
        $val = ($q[1] - $p[1]) * ($r[0] - $q[0]) - ($q[0] - $p[0]) * ($r[1] - $q[1]);
        if (abs($val) < 1e-6) {
            return 0; // Collinear
        }
        return ($val > 0) ? 1 : 2; // Clockwise vs Counterclockwise
    }

    private static function resolveUnitCode(int $code): string
    {
        $units = [
            0 => 'UNITLESS',
            1 => 'INCHES',
            2 => 'FEET',
            3 => 'MILES',
            4 => 'METERS',
            5 => 'CENTIMETERS',
            6 => 'MILLIMETERS',
            14 => 'YARDS',
        ];
        return $units[$code] ?? 'METERS';
    }

    private static function getUnitConversionFactor(string $unit): float
    {
        $factors = [
            'INCHES' => 0.0254,
            'FEET' => 0.3048,
            'YARDS' => 0.9144,
            'MILLIMETERS' => 0.001,
            'CENTIMETERS' => 0.01,
            'METERS' => 1.0,
            'MILES' => 1609.344,
            'UNITLESS' => 1.0,
        ];
        return $factors[$unit] ?? 1.0;
    }
}
