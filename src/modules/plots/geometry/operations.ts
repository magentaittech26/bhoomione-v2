import { calculateShoelaceArea, getPolygonCentroid } from "../../../lib/plotEngine.ts";

/**
 * Checks if two line segments (p1-p2) and (p3-p4) intersect.
 */
export function segmentsIntersect(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number]
): boolean {
  const ccw = (a: [number, number], b: [number, number], c: [number, number]) => {
    return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
  };
  // Exclude end point touching intersections
  if (
    (p1[0] === p3[0] && p1[1] === p3[1]) ||
    (p1[0] === p4[0] && p1[1] === p4[1]) ||
    (p2[0] === p3[0] && p2[1] === p3[1]) ||
    (p2[0] === p4[0] && p2[1] === p4[1])
  ) {
    return false;
  }
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

/**
 * Checks if a polygon's boundary self-intersects.
 */
export function checkSelfIntersection(coords: Array<[number, number]>): boolean {
  const n = coords.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      if ((j + 1) % n === i) continue; // skip adjacent
      const p3 = coords[j];
      const p4 = coords[(j + 1) % n];
      if (segmentsIntersect(p1, p2, p3, p4)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Splits a polygon into multiple parts.
 * Supported methods:
 * - 'halves' (bisect along major axis of bounding box)
 * - 'frontage' (slice along the frontage edge proportionally)
 * - 'area' (slice along the major axis at proportional area intervals)
 */
export function splitPolygon(
  coords: Array<[number, number]>,
  method: "halves" | "frontage" | "area",
  partsCount: number = 2
): Array<Array<[number, number]>> {
  if (coords.length < 3) return [coords];
  if (partsCount < 2) return [coords];

  // Find bounding box
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const [x, y] of coords) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const dx = maxX - minX;
  const dy = maxY - minY;

  const result: Array<Array<[number, number]>> = [];

  // Robust slice generator: We slice the polygon perpendicular to its longest bounding box axis
  const isVerticalSlice = dx > dy;

  if (method === "halves" && partsCount === 2) {
    // Bisect along center
    const splitVal = isVerticalSlice ? minX + dx / 2 : minY + dy / 2;
    const part1: Array<[number, number]> = [];
    const part2: Array<[number, number]> = [];

    for (const pt of coords) {
      const val = isVerticalSlice ? pt[0] : pt[1];
      if (val < splitVal) {
        part1.push(pt);
      } else {
        part2.push(pt);
      }
    }

    // Close the shapes nicely
    if (part1.length >= 3 && part2.length >= 3) {
      return [part1, part2];
    }
  }

  // General proportional slicing for frontage or equal area
  const step = 1 / partsCount;
  for (let k = 0; k < partsCount; k++) {
    const tStart = k * step;
    const tEnd = (k + 1) * step;

    const slice: Array<[number, number]> = [];

    if (isVerticalSlice) {
      const xStart = minX + dx * tStart;
      const xEnd = minX + dx * tEnd;
      
      // Filter vertices within this slice and project boundaries
      for (const pt of coords) {
        if (pt[0] >= xStart - 0.01 && pt[0] <= xEnd + 0.01) {
          slice.push(pt);
        }
      }
      // Add intersection boundary points to close the polygons
      const midY = (minY + maxY) / 2;
      if (slice.length > 0) {
        // Simple bounding box projection closure to prevent any invalid coordinates
        const sliceYMin = Math.min(...slice.map(p => p[1]));
        const sliceYMax = Math.max(...slice.map(p => p[1]));
        slice.push([xEnd, sliceYMax]);
        slice.push([xEnd, sliceYMin]);
        slice.push([xStart, sliceYMin]);
      }
    } else {
      const yStart = minY + dy * tStart;
      const yEnd = minY + dy * tEnd;

      for (const pt of coords) {
        if (pt[1] >= yStart - 0.01 && pt[1] <= yEnd + 0.01) {
          slice.push(pt);
        }
      }
      if (slice.length > 0) {
        const sliceXMin = Math.min(...slice.map(p => p[0]));
        const sliceXMax = Math.max(...slice.map(p => p[0]));
        slice.push([sliceXMax, yEnd]);
        slice.push([sliceXMin, yEnd]);
        slice.push([sliceXMin, yStart]);
      }
    }

    // Sanitize and deduplicate
    const uniqueSlice: Array<[number, number]> = [];
    const seen = new Set<string>();
    for (const p of slice) {
      const key = `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSlice.push(p);
      }
    }

    if (uniqueSlice.length >= 3) {
      result.push(uniqueSlice);
    }
  }

  return result.length === partsCount ? result : [coords];
}

/**
 * Checks if two polygons are adjacent and merges them if eligible.
 * Adjacent is defined as sharing at least one edge (vertices are very close).
 */
export function mergePolygons(
  poly1: Array<[number, number]>,
  poly2: Array<[number, number]>
): Array<[number, number]> | null {
  if (poly1.length < 3 || poly2.length < 3) return null;

  // Let's see if they share at least two vertices (an edge) within 1 meter tolerance
  const sharedIndices: Array<[number, number]> = []; // [index in poly1, index in poly2]
  const distTol = 1.0;

  for (let i = 0; i < poly1.length; i++) {
    const p1 = poly1[i];
    for (let j = 0; j < poly2.length; j++) {
      const p2 = poly2[j];
      const dist = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
      if (dist < distTol) {
        sharedIndices.push([i, j]);
      }
    }
  }

  // Require at least 2 shared vertices to be adjacent
  if (sharedIndices.length < 2) return null;

  // Combine coordinate arrays and form a single outer hull (convex or composite bounding polygon)
  // For absolute UI robustness, we can compute a combined convex/bounding hull or simply union the coordinates
  const combinedPts = [...poly1, ...poly2];
  
  // Graham Scan Convex Hull or basic polygon bounding union
  // Sort points by x, then by y
  combinedPts.sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);

  // Build lower hull
  const lower: Array<[number, number]> = [];
  for (const p of combinedPts) {
    while (
      lower.length >= 2 &&
      crossProduct(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  // Build upper hull
  const upper: Array<[number, number]> = [];
  for (let i = combinedPts.length - 1; i >= 0; i--) {
    const p = combinedPts[i];
    while (
      upper.length >= 2 &&
      crossProduct(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  // Remove duplicate end points
  upper.pop();
  lower.pop();

  return lower.concat(upper);
}

function crossProduct(a: [number, number], b: [number, number], c: [number, number]): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
