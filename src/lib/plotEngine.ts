import { MockGeometry } from "../components/MapWorkspace/types.ts";

export interface AreaMetrics {
  sqm: number;
  sqft: number;
  acres: number;
  gunta: number;
  cent: number;
}

/**
 * Standard Shoelace formula to calculate the pixel area of a polygon.
 */
export function calculateShoelaceArea(coords: Array<[number, number]>): number {
  let area = 0;
  const n = coords.length;
  if (n < 3) return 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

/**
 * Converts pixel area into metric and imperial land measurements.
 * Scale: 1 pixel = 0.5 meters (so 1 pixel squared = 0.25 sq meters).
 */
export function calculatePlotMetrics(coords: Array<[number, number]>): AreaMetrics {
  const areaPx = calculateShoelaceArea(coords);
  const sqm = areaPx * 0.25;
  const sqft = sqm * 10.76391;
  const acres = sqm / 4046.8564;
  const gunta = sqm / 101.17141;
  const cent = sqm / 40.468564;

  return {
    sqm: Math.round(sqm * 10) / 10,
    sqft: Math.round(sqft * 10) / 10,
    acres: Math.round(acres * 10000) / 10000,
    gunta: Math.round(gunta * 100) / 100,
    cent: Math.round(cent * 100) / 100
  };
}

/**
 * Calculates the exact geometric centroid of a polygon.
 */
export function getPolygonCentroid(pts: Array<[number, number]>): [number, number] {
  let cx = 0, cy = 0;
  let area = 0;
  const n = pts.length;
  if (n === 0) return [0, 0];
  if (n < 3) {
    let sx = 0, sy = 0;
    for (const pt of pts) {
      sx += pt[0];
      sy += pt[1];
    }
    return [sx / n, sy / n];
  }

  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % n];
    const factor = (x1 * y2 - x2 * y1);
    cx += (x1 + x2) * factor;
    cy += (y1 + y2) * factor;
    area += factor;
  }
  area = area / 2;

  if (Math.abs(area) < 1e-5) {
    let sx = 0, sy = 0;
    for (const pt of pts) {
      sx += pt[0];
      sy += pt[1];
    }
    return [sx / n, sy / n];
  }

  cx = cx / (6 * area);
  cy = cy / (6 * area);
  return [cx, cy];
}

/**
 * Calculates perpendicular distance from a point to a line segment.
 */
export function distanceToSegment(p: [number, number], v: [number, number], w: [number, number]): number {
  const l2 = Math.pow(v[0] - w[0], 2) + Math.pow(v[1] - w[1], 2);
  if (l2 === 0) return Math.sqrt(Math.pow(p[0] - v[0], 2) + Math.pow(p[1] - v[1], 2));
  let t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt(
    Math.pow(p[0] - (v[0] + t * (w[0] - v[0])), 2) +
    Math.pow(p[1] - (v[1] + t * (w[1] - v[1])), 2)
  );
}

/**
 * Calculates the shortest distance from a point to a polyline.
 */
export function distanceToPolyline(p: [number, number], polylineCoords: Array<[number, number]>): number {
  let minDistance = Infinity;
  if (polylineCoords.length < 2) return minDistance;

  for (let i = 0; i < polylineCoords.length - 1; i++) {
    const d = distanceToSegment(p, polylineCoords[i], polylineCoords[i + 1]);
    if (d < minDistance) {
      minDistance = d;
    }
  }
  return minDistance;
}

/**
 * Finds the nearest point on any road to a given plot centroid.
 */
export function getClosestPointOnRoad(centroid: [number, number], roadCoords: Array<[number, number]>): [number, number] {
  let minD = Infinity;
  let closestPt: [number, number] = [0, 0];
  if (roadCoords.length < 2) return closestPt;

  for (let i = 0; i < roadCoords.length - 1; i++) {
    const v = roadCoords[i];
    const w = roadCoords[i + 1];
    
    // Calculate nearest point on segment
    const l2 = Math.pow(v[0] - w[0], 2) + Math.pow(v[1] - w[1], 2);
    let t = 0;
    if (l2 > 0) {
      t = ((centroid[0] - v[0]) * (w[0] - v[0]) + (centroid[1] - v[1]) * (w[1] - v[1])) / l2;
      t = Math.max(0, Math.min(1, t));
    }
    const ptOnSeg: [number, number] = [v[0] + t * (w[0] - v[0]), v[1] + t * (w[1] - v[1])];
    const dist = Math.sqrt(Math.pow(centroid[0] - ptOnSeg[0], 2) + Math.pow(centroid[1] - ptOnSeg[1], 2));
    
    if (dist < minD) {
      minD = dist;
      closestPt = ptOnSeg;
    }
  }
  return closestPt;
}

/**
 * Automatically detects the facing direction of a plot based on the nearest road.
 * Angle calculated from plot centroid to closest point on nearest road polyline.
 * Y is inverted (negative is North, positive is South).
 */
export function detectPlotFacing(plotCoords: Array<[number, number]>, roadObjects: MockGeometry[]): string {
  if (roadObjects.length === 0) return "NORTH";

  const centroid = getPolygonCentroid(plotCoords);
  let minD = Infinity;
  let closestRoadPt: [number, number] = [0, 0];

  for (const road of roadObjects) {
    const roadPts = road.geometry_data.coordinates as Array<[number, number]>;
    if (!roadPts || roadPts.length < 2) continue;

    const pt = getClosestPointOnRoad(centroid, roadPts);
    const dist = Math.sqrt(Math.pow(centroid[0] - pt[0], 2) + Math.pow(centroid[1] - pt[1], 2));
    if (dist < minD) {
      minD = dist;
      closestRoadPt = pt;
    }
  }

  if (minD === Infinity) return "NORTH";

  const dx = closestRoadPt[0] - centroid[0];
  // Invert Y so standard trigonometry matches negative coordinate Y for North
  const dy = -(closestRoadPt[1] - centroid[1]); 

  const angleRad = Math.atan2(dy, dx);
  const angleDeg = (angleRad * 180) / Math.PI;

  // Map to 8 cardinal directions
  if (angleDeg >= -22.5 && angleDeg < 22.5) return "EAST";
  if (angleDeg >= 22.5 && angleDeg < 67.5) return "NORTH-EAST";
  if (angleDeg >= 67.5 && angleDeg < 112.5) return "NORTH";
  if (angleDeg >= 112.5 && angleDeg < 157.5) return "NORTH-WEST";
  if (angleDeg >= 157.5 || angleDeg < -157.5) return "WEST";
  if (angleDeg >= -157.5 && angleDeg < -112.5) return "SOUTH-WEST";
  if (angleDeg >= -112.5 && angleDeg < -67.5) return "SOUTH";
  if (angleDeg >= -67.5 && angleDeg < -22.5) return "SOUTH-EAST";

  return "NORTH";
}

/**
 * Automatically detects the corner style status of a plot based on how many distinct 
 * road lines lie within 160 pixels (80 meters).
 */
export function detectPlotCornerType(plotCoords: Array<[number, number]>, roadObjects: MockGeometry[]): "Internal Plot" | "Corner Plot" | "Multiple Road Frontage" {
  if (roadObjects.length === 0) return "Internal Plot";

  const centroid = getPolygonCentroid(plotCoords);
  const proximityThreshold = 160; // 80 meters in scale
  let matchingRoadsCount = 0;

  for (const road of roadObjects) {
    const roadPts = road.geometry_data.coordinates as Array<[number, number]>;
    if (!roadPts || roadPts.length < 2) continue;

    const minD = distanceToPolyline(centroid, roadPts);
    if (minD < proximityThreshold) {
      matchingRoadsCount++;
    }
  }

  if (matchingRoadsCount >= 3) return "Multiple Road Frontage";
  if (matchingRoadsCount === 2) return "Corner Plot";
  return "Internal Plot";
}

/**
 * Checks if a polygon has self-intersecting lines.
 */
export function isPolygonSelfIntersecting(pts: Array<[number, number]>): boolean {
  const n = pts.length;
  if (n < 4) return false;

  const orientation = (p: [number, number], q: [number, number], r: [number, number]): number => {
    const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
    if (Math.abs(val) < 1e-9) return 0;
    return (val > 0) ? 1 : 2;
  };

  const onSegment = (p: [number, number], q: [number, number], r: [number, number]): boolean => {
    return q[0] <= Math.max(p[0], r[0]) && q[0] >= Math.min(p[0], r[0]) &&
           q[1] <= Math.max(p[1], r[1]) && q[1] >= Math.min(p[1], r[1]);
  };

  const intersect = (p1: [number, number], q1: [number, number], p2: [number, number], q2: [number, number]): boolean => {
    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    if (o1 !== o2 && o3 !== o4) return true;

    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;

    return false;
  };

  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];

    for (let j = i + 2; j < n; j++) {
      if ((j + 1) % n === i) continue; // Skip adjacent edges
      const c = pts[j];
      const d = pts[(j + 1) % n];

      if (intersect(a, b, c, d)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Standard ray casting point-in-polygon algorithm.
 */
export function isPointInsidePolygon(point: [number, number], vs: Array<[number, number]>): boolean {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Checks if two polygons overlap.
 */
export function checkPolygonsOverlap(polyA: Array<[number, number]>, polyB: Array<[number, number]>): boolean {
  // Check if any vertex of polyA is inside polyB
  for (const pt of polyA) {
    if (isPointInsidePolygon(pt, polyB)) return true;
  }
  // Check if any vertex of polyB is inside polyA
  for (const pt of polyB) {
    if (isPointInsidePolygon(pt, polyA)) return true;
  }
  return false;
}

/**
 * Runs a complete plot validation suite.
 */
export function runValidationSuite(objects: MockGeometry[]): string[] {
  const warnings: string[] = [];
  const plots = objects.filter(o => o.layerName === "PLOTS");
  
  const plotNumbers = new Set<string>();
  
  plots.forEach((plot) => {
    const coords = plot.geometry_data.coordinates as Array<[number, number]>;
    if (!coords || coords.length === 0) {
      warnings.push(`Plot "${plot.name}": Empty geometry coordinates!`);
      return;
    }

    // 1. Minimum Vertex Validation / Open Polygons
    if (coords.length < 3) {
      warnings.push(`Plot "${plot.name}": Open polygon warning (fewer than 3 vertices).`);
    }

    // 2. Self Intersection Validation
    if (isPolygonSelfIntersecting(coords)) {
      warnings.push(`Plot "${plot.name}": Invalid self-intersecting polygon footprint.`);
    }

    const areaPx = calculateShoelaceArea(coords);
    const areaSqm = areaPx * 0.25;

    // 3. Zero Area Validation
    if (areaSqm === 0) {
      warnings.push(`Plot "${plot.name}": Invalid zero-area polygon.`);
    } else if (areaSqm < 15) {
      // 4. Tiny Polygons Validation (< 15 sq meters)
      warnings.push(`Plot "${plot.name}": Footprint area is extremely tiny (${areaSqm.toFixed(1)} sqm).`);
    }

    // 5. Duplicate Plot Numbers
    const num = plot.properties.plot_number;
    if (num) {
      if (plotNumbers.has(num)) {
        warnings.push(`Plot Number Conflict: Duplicate plot number "${num}" detected.`);
      } else {
        plotNumbers.add(num);
      }
    }
  });

  // 6. Overlapping Plots Check
  for (let i = 0; i < plots.length; i++) {
    for (let j = i + 1; j < plots.length; j++) {
      const polyA = plots[i].geometry_data.coordinates as Array<[number, number]>;
      const polyB = plots[j].geometry_data.coordinates as Array<[number, number]>;
      if (polyA && polyB && polyA.length >= 3 && polyB.length >= 3) {
        if (checkPolygonsOverlap(polyA, polyB)) {
          warnings.push(`Overlap: Plot "${plots[i].properties.plot_number || plots[i].name}" overlaps Plot "${plots[j].properties.plot_number || plots[j].name}".`);
        }
      }
    }
  }

  return warnings;
}

/**
 * Geometric helper to rotate coordinates around a point (degrees).
 */
export function rotatePoints(coords: Array<[number, number]>, angleDeg: number, center: [number, number]): Array<[number, number]> {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const [cx, cy] = center;

  return coords.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    return [cx + rx, cy + ry];
  });
}

/**
 * Geometric helper to scale coordinates relative to a center point.
 */
export function scalePoints(coords: Array<[number, number]>, factor: number, center: [number, number]): Array<[number, number]> {
  const [cx, cy] = center;
  return coords.map(([x, y]) => {
    const rx = (x - cx) * factor;
    const ry = (y - cy) * factor;
    return [cx + rx, cy + ry];
  });
}
