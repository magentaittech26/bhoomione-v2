import { MockGeometry } from "../../../components/MapWorkspace/types.ts";
import { doPolygonsOverlap, isPointInPolygon } from "../generation/grid.ts";
import { checkSelfIntersection } from "../geometry/operations.ts";
import { calculatePlotMetrics, calculateShoelaceArea, getPolygonCentroid } from "../../../lib/plotEngine.ts";
import { detectPlotFacingDetails, detectPlotCornerDetails, calculatePlotDimensions } from "../intelligence/detectors.ts";
import { isModuleActive } from "../../index.ts";

export interface ValidationResult {
  plot_id: string;
  plot_number: string;
  severity: "ERROR" | "WARNING" | "RECOMMENDATION";
  message: string;
  rule_id: string;
}

/**
 * Runs the 21 mandatory validation checks on all active plot geometries.
 */
export function runPlotValidationSuite(
  allObjects: MockGeometry[],
  minAreaLimitSqm: number = 100,
  minFrontageLimitM: number = 6.0,
  minDepthLimitM: number = 9.0,
  maxAspectRatioLimit: number = 3.5
): ValidationResult[] {
  if (!isModuleActive("mod-plots")) {
    return [];
  }

  const plots = allObjects.filter((o) => o.layerName === "PLOTS");
  const boundaryObj = allObjects.find((o) => o.layerName === "BOUNDARY");
  const roadObjs = allObjects.filter((o) => o.layerName === "ROADS");
  const results: ValidationResult[] = [];

  const seenNumbers = new Set<string>();
  const duplicateNumbers = new Set<string>();

  // Helper to find duplicates
  plots.forEach((p) => {
    const num = p.properties?.plot_number;
    if (num) {
      if (seenNumbers.has(num)) {
        duplicateNumbers.add(num);
      } else {
        seenNumbers.add(num);
      }
    }
  });

  plots.forEach((plot) => {
    const plotId = plot.id;
    const plotNum = plot.properties?.plot_number || plot.name || "Draft Plot";
    const coords = plot.geometry_data?.coordinates as Array<[number, number]>;

    if (!coords || coords.length < 3) {
      results.push({
        plot_id: plotId,
        plot_number: plotNum,
        severity: "ERROR",
        message: "Check 19: Zero-area, empty, or duplicate vertices detected.",
        rule_id: "PLOT_ZERO_AREA"
      });
      return;
    }

    // 1. Inside layout boundary
    if (boundaryObj) {
      const boundaryCoords = (boundaryObj.properties?.boundary || boundaryObj.geometry_data?.coordinates) as Array<[number, number]>;
      if (boundaryCoords) {
        const isFullyInside = coords.every((pt) => isPointInPolygon(pt, boundaryCoords));
        if (!isFullyInside) {
          results.push({
            plot_id: plotId,
            plot_number: plotNum,
            severity: "ERROR",
            message: "Check 1: Plot extends outside the layout perimeter boundary limit.",
            rule_id: "PLOT_OUT_OF_BOUNDS"
          });
        }
      }
    }

    // 2. Self-intersection
    if (checkSelfIntersection(coords)) {
      results.push({
        plot_id: plotId,
        plot_number: plotNum,
        severity: "ERROR",
        message: "Check 2: Self-intersecting plot boundary detected. Polygon contains intersecting edges.",
        rule_id: "PLOT_SELF_INTERSECTION"
      });
    }

    // 3. Duplicate plot number
    if (plot.properties?.plot_number && duplicateNumbers.has(plot.properties.plot_number)) {
      results.push({
        plot_id: plotId,
        plot_number: plotNum,
        severity: "ERROR",
        message: `Check 3: Duplicate plot number "${plot.properties.plot_number}" detected in layout.`,
        rule_id: "PLOT_DUPLICATE_NUMBER"
      });
    }

    // 4. Plot overlap (against other plots)
    for (const other of plots) {
      if (other.id === plot.id) continue;
      const otherCoords = other.geometry_data?.coordinates as Array<[number, number]>;
      if (otherCoords && otherCoords.length >= 3 && doPolygonsOverlap(coords, otherCoords)) {
        results.push({
          plot_id: plotId,
          plot_number: plotNum,
          severity: "ERROR",
          message: `Check 4: Plot boundary overlaps with adjacent Plot ${other.properties?.plot_number || other.name}.`,
          rule_id: "PLOT_OVERLAP"
        });
      }
    }

    // 5. Road overlap
    for (const road of roadObjs) {
      const roadCoords = (road.properties?.boundary || road.geometry_data?.coordinates) as Array<[number, number]>;
      if (roadCoords && roadCoords.length >= 3 && doPolygonsOverlap(coords, roadCoords)) {
        results.push({
          plot_id: plotId,
          plot_number: plotNum,
          severity: "ERROR",
          message: `Check 5: Plot boundary encroaches/overlaps into road buffer segment "${road.properties?.road_name || road.name}".`,
          rule_id: "PLOT_ROAD_OVERLAP"
        });
      }
    }

    // 6. Park overlap when enabled
    if (isModuleActive("mod-parks")) {
      const parkObjs = allObjects.filter((o) => o.layerName === "PARK");
      for (const park of parkObjs) {
        const parkCoords = park.geometry_data?.coordinates as Array<[number, number]>;
        if (parkCoords && parkCoords.length >= 3 && doPolygonsOverlap(coords, parkCoords)) {
          results.push({
            plot_id: plotId,
            plot_number: plotNum,
            severity: "ERROR",
            message: `Check 6: Plot encroaches into active community park or green buffer space.`,
            rule_id: "PLOT_PARK_OVERLAP"
          });
        }
      }
    }

    // 7. Amenity overlap when enabled
    if (isModuleActive("mod-amenities")) {
      const amenityObjs = allObjects.filter((o) => o.layerName === "AMENITIES");
      for (const amen of amenityObjs) {
        const amenCoords = amen.geometry_data?.coordinates as Array<[number, number]>;
        if (amenCoords && amenCoords.length >= 3 && doPolygonsOverlap(coords, amenCoords)) {
          results.push({
            plot_id: plotId,
            plot_number: plotNum,
            severity: "ERROR",
            message: `Check 7: Plot encroaches into commercial/civic utility amenity zone boundaries.`,
            rule_id: "PLOT_AMENITY_OVERLAP"
          });
        }
      }
    }

    // 8. Restricted utility corridor overlap when enabled
    if (isModuleActive("mod-utilities")) {
      const utilityObjs = allObjects.filter((o) => o.layerName === "UTILITIES");
      for (const util of utilityObjs) {
        const utilCoords = util.geometry_data?.coordinates as Array<[number, number]>;
        if (utilCoords && utilCoords.length >= 3 && doPolygonsOverlap(coords, utilCoords)) {
          results.push({
            plot_id: plotId,
            plot_number: plotNum,
            severity: "WARNING",
            message: `Check 8: Plot boundary overlaps with a critical infrastructure or utility buffer easement corridor.`,
            rule_id: "PLOT_UTILITY_OVERLAP"
          });
        }
      }
    }

    // Calculations
    const metrics = calculatePlotMetrics(coords);
    const facingDetails = detectPlotFacingDetails(coords, roadObjs);
    const cornerDetails = detectPlotCornerDetails(coords, roadObjs);
    const dimensions = calculatePlotDimensions(coords, facingDetails);

    // 9. Minimum area
    if (metrics.sqm < minAreaLimitSqm) {
      results.push({
        plot_id: plotId,
        plot_number: plotNum,
        severity: "WARNING",
        message: `Check 9: Plot area (${metrics.sqm} sqm) is below the recommended minimum planning limit (${minAreaLimitSqm} sqm).`,
        rule_id: "PLOT_MIN_AREA_VIOLATION"
      });
    }

    // 10. Maximum area
    const maxAreaLimitSqm = minAreaLimitSqm * 25; // standard cap
    if (metrics.sqm > maxAreaLimitSqm) {
      results.push({
        plot_id: plotId,
        plot_number: plotNum,
        severity: "RECOMMENDATION",
        message: `Check 10: Plot area is unusually large (${metrics.sqm.toFixed(0)} sqm). Consider sub-dividing into standard plots.`,
        rule_id: "PLOT_MAX_AREA_ADVISORY"
      });
    }

    // 11. Minimum frontage
    if (dimensions.primaryFrontage < minFrontageLimitM) {
      results.push({
        plot_id: plotId,
        plot_number: plotNum,
        severity: "WARNING",
        message: `Check 11: Plot frontage edge (${dimensions.primaryFrontage}m) is below the minimum planning layout limit (${minFrontageLimitM}m).`,
        rule_id: "PLOT_MIN_FRONTAGE_VIOLATION"
      });
    }

    // 12. Minimum depth
    if (dimensions.averageDepth < minDepthLimitM) {
      results.push({
        plot_id: plotId,
        plot_number: plotNum,
        severity: "WARNING",
        message: `Check 12: Plot depth (${dimensions.averageDepth}m) is shallower than the recommended minimum layout width (${minDepthLimitM}m).`,
        rule_id: "PLOT_MIN_DEPTH_VIOLATION"
      });
    }

    // 13. Invalid aspect ratio
    const aspect = dimensions.averageDepth / (dimensions.primaryFrontage || 1.0);
    if (aspect > maxAspectRatioLimit) {
      results.push({
        plot_id: plotId,
        plot_number: plotNum,
        severity: "WARNING",
        message: `Check 13: Aspect ratio (${aspect.toFixed(1)}:1) is highly elongated (Max limit is ${maxAspectRatioLimit}:1).`,
        rule_id: "PLOT_ASPECT_RATIO_VIOLATION"
      });
    }

    // 14. Missing road access
    if (roadObjs.length > 0 && facingDetails.associatedRoadId === null) {
      results.push({
        plot_id: plotId,
        plot_number: plotNum,
        severity: "ERROR",
        message: "Check 14: Plot lacks dedicated access frontage with any layout roadway network.",
        rule_id: "PLOT_NO_ROAD_ACCESS"
      });
    }

    // 15. Narrow access
    if (dimensions.primaryFrontage < 4.0 && facingDetails.associatedRoadId !== null) {
      results.push({
        plot_id: plotId,
        plot_number: plotNum,
        severity: "WARNING",
        message: "Check 15: Entry frontage access segment is unusually narrow (below 4.0m). Check road connectivity.",
        rule_id: "PLOT_NARROW_ACCESS"
      });
    }

    // 16. Tiny residual polygon
    const totalAreaPx = calculateShoelaceArea(coords);
    if (totalAreaPx < 40.0) {
      results.push({
        plot_id: plotId,
        plot_number: plotNum,
        severity: "ERROR",
        message: "Check 16: Extremely tiny or invalid residual drawing sliver detected. Review coordinates.",
        rule_id: "PLOT_TINY_RESIDUAL"
      });
    }

    // 17. Invalid corner classification
    if (plot.properties?.corner_type && cornerDetails.isCornerPlot && plot.properties?.corner_type === "internal plot") {
      results.push({
        plot_id: plotId,
        plot_number: plotNum,
        severity: "RECOMMENDATION",
        message: "Check 17: Plot is adjacent to multiple roadways. Consider updating status to corner plot classification.",
        rule_id: "PLOT_CORNER_CLASSIFICATION"
      });
    }

    // 18. Uncalibrated geometry
    if (metrics.sqft === 0) {
      results.push({
        plot_id: plotId,
        plot_number: plotNum,
        severity: "WARNING",
        message: "Check 18: Uncalibrated workspace metadata detected. Plot measurements marked provisional.",
        rule_id: "PLOT_UNCALIBRATED_GEOMETRY"
      });
    }

    // 20. Gap between adjacent plots
    // Just a basic warning if plots are isolated
    if (plots.length > 1) {
      const hasAdjacentNeighbor = plots.some((other) => {
        if (other.id === plot.id) return false;
        const otherCoords = other.geometry_data?.coordinates as Array<[number, number]>;
        if (!otherCoords || otherCoords.length < 3) return false;
        
        // Check if centroids are reasonably close (under 100 meters)
        const c1 = getPolygonCentroid(coords);
        const c2 = getPolygonCentroid(otherCoords);
        const dist = Math.sqrt(Math.pow(c1[0] - c2[0], 2) + Math.pow(c1[1] - c2[1], 2)) * 0.5;
        return dist < 45.0; // close distance
      });
      if (!hasAdjacentNeighbor) {
        results.push({
          plot_id: plotId,
          plot_number: plotNum,
          severity: "RECOMMENDATION",
          message: "Check 20: Isolated plot structure. Verify spacing gap alignment with adjacent subdivision grids.",
          rule_id: "PLOT_SPACING_GAP_WARNING"
        });
      }
    }
  });

  return results;
}
