import { GridGeneratorInput } from "../types.ts";
import { MockGeometry } from "../../../components/MapWorkspace/types.ts";
import { isModuleActive } from "../../index.ts";
import { segmentsIntersect } from "../geometry/operations.ts";
import { getPolygonCentroid } from "../../../lib/plotEngine.ts";

/**
 * Standard Ray Casting algorithm to check if a point is inside a polygon.
 */
export function isPointInPolygon(pt: [number, number], polygon: Array<[number, number]>): boolean {
  const [x, y] = pt;
  let inside = false;
  const n = polygon.length;
  if (n < 3) return false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Checks if any edge of poly1 intersects poly2 or if either is completely inside the other.
 */
export function doPolygonsOverlap(
  poly1: Array<[number, number]>,
  poly2: Array<[number, number]>
): boolean {
  if (poly1.length < 3 || poly2.length < 3) return false;

  // 1. Edge intersection check
  for (let i = 0; i < poly1.length; i++) {
    const p1 = poly1[i];
    const p2 = poly1[(i + 1) % poly1.length];
    for (let j = 0; j < poly2.length; j++) {
      const p3 = poly2[j];
      const p4 = poly2[(j + 1) % poly2.length];
      if (segmentsIntersect(p1, p2, p3, p4)) {
        return true;
      }
    }
  }

  // 2. Vertex containment check (completely inside)
  if (isPointInPolygon(poly1[0], poly2)) return true;
  if (isPointInPolygon(poly2[0], poly1)) return true;

  return false;
}

/**
 * Generates grid of plots inside a target zone polygon.
 */
export function generatePlotGrid(
  input: GridGeneratorInput,
  allObjects: MockGeometry[],
  nextPlotNumber: number
): Array<{ coords: Array<[number, number]>; properties: any }> {
  const {
    targetPolygon,
    plotWidth,
    plotDepth,
    rowSpacing,
    columnSpacing,
    rotation,
    roadFacingDirection,
    numberingScheme,
    minRemainderArea
  } = input;

  if (targetPolygon.length < 3) return [];

  // Find bounding box of target polygon
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const [x, y] of targetPolygon) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const dx = maxX - minX;
  const dy = maxY - minY;

  // Spacing and dimensions in pixels (Scale: 1m = 2px)
  const widthPx = plotWidth * 2.0;
  const depthPx = plotDepth * 2.0;
  const rowSpacingPx = rowSpacing * 2.0;
  const colSpacingPx = columnSpacing * 2.0;

  const results: Array<{ coords: Array<[number, number]>; properties: any }> = [];
  let plotCounter = nextPlotNumber;

  // Calculate rotation radians
  const angleRad = (rotation * Math.PI) / 180;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);

  // We scan coordinates and place a grid of plots
  // For safety, we cap the max columns/rows to avoid infinite loops or memory overhead with huge coordinates
  const cols = Math.min(50, Math.ceil(dx / (widthPx + colSpacingPx)));
  const rows = Math.min(50, Math.ceil(dy / (depthPx + rowSpacingPx)));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Local coordinate offset
      const lx = c * (widthPx + colSpacingPx);
      const ly = r * (depthPx + rowSpacingPx);

      // Centered on bounding box start point
      const rx = minX + lx;
      const ry = minY + ly;

      // Apply rotation transformation about minX, minY point
      const transformPoint = (x: number, y: number): [number, number] => {
        const ox = x - minX;
        const oy = y - minY;
        const tx = minX + (ox * cosA - oy * sinA);
        const ty = minY + (ox * sinA + oy * cosA);
        return [parseFloat(tx.toFixed(1)), parseFloat(ty.toFixed(1))];
      };

      const p1 = transformPoint(rx, ry);
      const p2 = transformPoint(rx + widthPx, ry);
      const p3 = transformPoint(rx + widthPx, ry + depthPx);
      const p4 = transformPoint(rx, ry + depthPx);

      const plotCoords: Array<[number, number]> = [p1, p2, p3, p4];
      const centroid = getPolygonCentroid(plotCoords);

      // 1. Must be entirely inside layout/target polygon
      const isInside = plotCoords.every(pt => isPointInPolygon(pt, targetPolygon)) && isPointInPolygon(centroid, targetPolygon);
      if (!isInside) continue;

      // 2. Check overlap against existing objects
      let overlapsUnlicensed = false;

      for (const obj of allObjects) {
        // Skip boundary layer itself
        if (obj.layerName === "BOUNDARY") continue;

        const coords = obj.geometry_data?.coordinates as Array<[number, number]>;
        if (!coords || coords.length < 3) continue;

        // Condition checks:
        // Avoid roads
        if (obj.layerName === "ROADS" && doPolygonsOverlap(plotCoords, coords)) {
          overlapsUnlicensed = true;
          break;
        }

        // Avoid parks if parks module is active
        if (isModuleActive("mod-parks") && obj.layerName === "PARK" && doPolygonsOverlap(plotCoords, coords)) {
          overlapsUnlicensed = true;
          break;
        }

        // Avoid amenities if amenities module is active
        if (isModuleActive("mod-amenities") && obj.layerName === "AMENITIES" && doPolygonsOverlap(plotCoords, coords)) {
          overlapsUnlicensed = true;
          break;
        }

        // Avoid utility lines if utility lines module is active
        if (isModuleActive("mod-utilities") && obj.layerName === "UTILITIES" && doPolygonsOverlap(plotCoords, coords)) {
          overlapsUnlicensed = true;
          break;
        }

        // Avoid existing plots
        if (obj.layerName === "PLOTS" && doPolygonsOverlap(plotCoords, coords)) {
          overlapsUnlicensed = true;
          break;
        }
      }

      if (overlapsUnlicensed) continue;

      // Passed all checks! Construct the plot properties
      results.push({
        coords: plotCoords,
        properties: {
          plot_number: String(plotCounter++),
          zoning: "Residential",
          facing: roadFacingDirection === "N" ? "North" : roadFacingDirection === "E" ? "East" : roadFacingDirection === "S" ? "South" : "West",
          corner_type: "internal plot"
        }
      });
    }
  }

  return results;
}
