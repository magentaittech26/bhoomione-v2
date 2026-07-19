import { MockGeometry } from "../components/MapWorkspace/types.ts";
import { validateUtilities } from "./utilityEngine.ts";
import { isModuleActive } from "../modules/index.ts";

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
  const plots = isModuleActive("mod-plots") ? objects.filter(o => o.layerName === "PLOTS") : [];
  
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

  // 7. Roads Validation
  const roads = isModuleActive("mod-roads") ? objects.filter(o => o.layerName === "ROADS") : [];
  if (isModuleActive("mod-roads")) {
    roads.forEach((road) => {
      const roadWarnings = validateRoad(road, objects);
      warnings.push(...roadWarnings);
    });
  }

  // 8. Parks Validation
  const parks = isModuleActive("mod-parks") ? objects.filter(o => o.layerName === "PARK") : [];
  const boundary = objects.find(o => o.layerName === "BOUNDARY");
  const boundaryCoords = boundary?.geometry_data.coordinates as Array<[number, number]>;

  parks.forEach((park) => {
    const parkCoords = park.geometry_data.coordinates as Array<[number, number]>;
    if (!parkCoords || parkCoords.length < 3) {
      warnings.push(`Park "${park.name}": Open polygon warning (fewer than 3 vertices).`);
      return;
    }

    const parkName = park.properties?.park_name || park.name || "Unnamed Park";

    // A. Park inside Boundary
    if (boundaryCoords && boundaryCoords.length >= 3) {
      let isFullyInside = true;
      for (const pt of parkCoords) {
        if (!isPointInsidePolygon(pt, boundaryCoords)) {
          isFullyInside = false;
          break;
        }
      }
      if (!isFullyInside) {
        warnings.push(`Park "${parkName}": Located outside or intersecting layout boundary.`);
      }
    }

    // B. No overlap with Roads
    roads.forEach((road) => {
      const roadCoords = road.geometry_data.coordinates as Array<[number, number]>;
      if (!roadCoords || roadCoords.length < 2) return;
      const roadWidth = road.properties?.road_width || 12;
      const roadPoly = road.properties?.boundary || generateCarriagewayPolygon(roadCoords, roadWidth);
      if (roadPoly && roadPoly.length >= 3) {
        if (checkPolygonsOverlap(parkCoords, roadPoly)) {
          warnings.push(`Overlap: Park "${parkName}" overlaps Road "${road.properties?.road_name || road.name}".`);
        }
      }
    });

    // C. No overlap with Utilities
    const utilities = objects.filter(o => o.layerName === "UTILITIES");
    utilities.forEach((utility) => {
      const utilCoords = utility.geometry_data.coordinates;
      if (!utilCoords) return;
      const pts = Array.isArray(utilCoords[0]) ? (utilCoords as Array<[number, number]>) : [utilCoords as [number, number]];
      let overlaps = false;
      for (const pt of pts) {
        if (isPointInsidePolygon(pt, parkCoords)) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) {
        warnings.push(`Overlap: Park "${parkName}" overlaps Utility "${utility.name}".`);
      }
    });

    // D. No overlap with Plots
    plots.forEach((plot) => {
      const plotCoords = plot.geometry_data.coordinates as Array<[number, number]>;
      if (plotCoords && plotCoords.length >= 3) {
        if (checkPolygonsOverlap(parkCoords, plotCoords)) {
          warnings.push(`Overlap: Park "${parkName}" overlaps Plot "${plot.properties?.plot_number || plot.name}".`);
        }
      }
    });

    // E. Duplicate Park Name
    const otherParks = parks.filter(p => p.id !== park.id);
    const duplicate = otherParks.some(p => (p.properties?.park_name || p.name || "").toLowerCase() === parkName.toLowerCase());
    if (duplicate && parkName.toLowerCase() !== "unnamed park") {
      warnings.push(`Park Name Conflict: Duplicate park name "${parkName}" detected.`);
    }

    // F. Minimum Area
    const metrics = calculatePlotMetrics(parkCoords);
    if (metrics.sqm < 100) {
      warnings.push(`Park "${parkName}": Footprint area is below recommended minimum of 100 sqm (currently ${metrics.sqm} sqm).`);
    }

    // G. Disconnected Park (Road frontage)
    let isNearRoad = false;
    if (roads.length === 0) {
      isNearRoad = true; // Skip if no roads are defined yet
    } else {
      for (const road of roads) {
        const roadCoords = road.geometry_data.coordinates as Array<[number, number]>;
        if (roadCoords && roadCoords.length >= 2) {
          if (distanceToPolyline(getPolygonCentroid(parkCoords), roadCoords) < 160) { // ~80m proximity
            isNearRoad = true;
            break;
          }
        }
      }
    }
    if (!isNearRoad) {
      warnings.push(`Park "${parkName}": Disconnected from public access network (no road frontage nearby).`);
    }
  });

  // 9. Amenities Validation
  const amenities = isModuleActive("mod-amenities") ? objects.filter(o => o.layerName === "AMENITIES") : [];
  amenities.forEach((amenity) => {
    const amenityName = amenity.properties?.amenity_name || amenity.name || "Unnamed Amenity";
    const otherAmenities = amenities.filter(a => a.id !== amenity.id);
    const isPoint = amenity.object_type === "POINT";

    // A. Duplicate name verification
    const isDuplicate = otherAmenities.some(a => (a.properties?.amenity_name || a.name || "").toLowerCase() === amenityName.toLowerCase());
    if (isDuplicate && amenityName.toLowerCase() !== "unnamed amenity") {
      warnings.push(`Amenity Conflict: Duplicate name "${amenityName}" detected on layout.`);
    }

    if (isPoint) {
      const pt = amenity.geometry_data.coordinates as [number, number];
      if (!pt || pt.length !== 2) return;

      // B. Inside Boundary (Point)
      if (boundaryCoords && boundaryCoords.length >= 3) {
        if (!isPointInsidePolygon(pt, boundaryCoords)) {
          warnings.push(`Amenity "${amenityName}": Located outside of layout boundary.`);
        }
      }

      // C. No overlap with Roads (Point)
      roads.forEach((road) => {
        const roadCoords = road.geometry_data.coordinates as Array<[number, number]>;
        if (!roadCoords || roadCoords.length < 2) return;
        const roadWidth = road.properties?.road_width || 12;
        const roadPoly = road.properties?.boundary || generateCarriagewayPolygon(roadCoords, roadWidth);
        if (roadPoly && roadPoly.length >= 3) {
          if (isPointInsidePolygon(pt, roadPoly)) {
            warnings.push(`Overlap: Amenity point "${amenityName}" overlaps Road "${road.properties?.road_name || road.name}".`);
          }
        }
      });

      // D. No overlap with Parks (Point)
      parks.forEach((park) => {
        const parkCoords = park.geometry_data.coordinates as Array<[number, number]>;
        if (parkCoords && parkCoords.length >= 3) {
          if (isPointInsidePolygon(pt, parkCoords)) {
            warnings.push(`Overlap: Amenity point "${amenityName}" overlaps Park "${park.properties?.park_name || park.name}".`);
          }
        }
      });

      // E. No overlap with Plots (Point)
      plots.forEach((plot) => {
        const plotCoords = plot.geometry_data.coordinates as Array<[number, number]>;
        if (plotCoords && plotCoords.length >= 3) {
          if (isPointInsidePolygon(pt, plotCoords)) {
            warnings.push(`Overlap: Amenity point "${amenityName}" overlaps Plot "${plot.properties?.plot_number || plot.name}".`);
          }
        }
      });

      // F. Road Frontage / Access (Point)
      let isNearRoad = false;
      if (roads.length === 0) {
        isNearRoad = true;
      } else {
        for (const road of roads) {
          const roadCoords = road.geometry_data.coordinates as Array<[number, number]>;
          if (roadCoords && roadCoords.length >= 2) {
            if (distanceToPolyline(pt, roadCoords) < 160) {
              isNearRoad = true;
              break;
            }
          }
        }
      }
      if (!isNearRoad) {
        warnings.push(`Amenity "${amenityName}": No road frontage or entrance access nearby.`);
      }

    } else {
      // Polygon / Rectangle Amenities
      const amenityCoords = amenity.geometry_data.coordinates as Array<[number, number]>;
      if (!amenityCoords || amenityCoords.length < 3) {
        warnings.push(`Amenity "${amenityName}": Open polygon warning (fewer than 3 vertices).`);
        return;
      }

      // B. Inside Boundary (Polygon)
      if (boundaryCoords && boundaryCoords.length >= 3) {
        let isFullyInside = true;
        for (const pt of amenityCoords) {
          if (!isPointInsidePolygon(pt, boundaryCoords)) {
            isFullyInside = false;
            break;
          }
        }
        if (!isFullyInside) {
          warnings.push(`Amenity "${amenityName}": Located outside or intersecting layout boundary.`);
        }
      }

      // C. No overlap with Roads (Polygon)
      roads.forEach((road) => {
        const roadCoords = road.geometry_data.coordinates as Array<[number, number]>;
        if (!roadCoords || roadCoords.length < 2) return;
        const roadWidth = road.properties?.road_width || 12;
        const roadPoly = road.properties?.boundary || generateCarriagewayPolygon(roadCoords, roadWidth);
        if (roadPoly && roadPoly.length >= 3) {
          if (checkPolygonsOverlap(amenityCoords, roadPoly)) {
            warnings.push(`Overlap: Amenity "${amenityName}" overlaps Road "${road.properties?.road_name || road.name}".`);
          }
        }
      });

      // D. No overlap with Parks (Polygon)
      parks.forEach((park) => {
        const parkCoords = park.geometry_data.coordinates as Array<[number, number]>;
        if (parkCoords && parkCoords.length >= 3) {
          if (checkPolygonsOverlap(amenityCoords, parkCoords)) {
            warnings.push(`Overlap: Amenity "${amenityName}" overlaps Park "${park.properties?.park_name || park.name}".`);
          }
        }
      });

      // E. No overlap with Plots (Polygon)
      plots.forEach((plot) => {
        const plotCoords = plot.geometry_data.coordinates as Array<[number, number]>;
        if (plotCoords && plotCoords.length >= 3) {
          if (checkPolygonsOverlap(amenityCoords, plotCoords)) {
            warnings.push(`Overlap: Amenity "${amenityName}" overlaps Plot "${plot.properties?.plot_number || plot.name}".`);
          }
        }
      });

      // F. Road Frontage / Access (Polygon)
      let isNearRoad = false;
      if (roads.length === 0) {
        isNearRoad = true;
      } else {
        const centroid = getPolygonCentroid(amenityCoords);
        for (const road of roads) {
          const roadCoords = road.geometry_data.coordinates as Array<[number, number]>;
          if (roadCoords && roadCoords.length >= 2) {
            if (distanceToPolyline(centroid, roadCoords) < 160) {
              isNearRoad = true;
              break;
            }
          }
        }
      }
      if (!isNearRoad) {
        warnings.push(`Amenity "${amenityName}": No road frontage or entrance access nearby.`);
      }

      // G. Minimum footprint area verification
      const metrics = calculatePlotMetrics(amenityCoords);
      if (metrics.sqm < 100) {
        warnings.push(`Amenity "${amenityName}": Footprint area is below recommended minimum of 100 sqm (currently ${metrics.sqm} sqm).`);
      }
    }
  });

  // 10. Utility Network Engine Validations
  if (isModuleActive("mod-utilities")) {
    const utilityWarnings = validateUtilities(objects);
    warnings.push(...utilityWarnings);
  }

  return warnings;
}

/**
 * Calculates centerline total length in physical meters.
 * Scale: 1 pixel = 0.5 meters
 */
export function calculateCenterlineLength(pts: Array<[number, number]>): number {
  if (pts.length < 2) return 0;
  let lenPx = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dy = pts[i + 1][1] - pts[i][1];
    lenPx += Math.sqrt(dx * dx + dy * dy);
  }
  return lenPx * 0.5;
}

/**
 * Calculates road bearing direction mapped to compass directions
 */
export function calculateRoadDirection(pts: Array<[number, number]>): string {
  if (pts.length < 2) return "N";
  const start = pts[0];
  const end = pts[pts.length - 1];
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const angleRad = Math.atan2(dy, dx);
  const angleDeg = (angleRad * 180) / Math.PI;
  
  let compass = "N";
  const normalizedDeg = (angleDeg + 360) % 360;
  if (normalizedDeg >= 337.5 || normalizedDeg < 22.5) compass = "E";
  else if (normalizedDeg >= 22.5 && normalizedDeg < 67.5) compass = "SE";
  else if (normalizedDeg >= 67.5 && normalizedDeg < 112.5) compass = "S";
  else if (normalizedDeg >= 112.5 && normalizedDeg < 157.5) compass = "SW";
  else if (normalizedDeg >= 157.5 && normalizedDeg < 202.5) compass = "W";
  else if (normalizedDeg >= 202.5 && normalizedDeg < 247.5) compass = "NW";
  else if (normalizedDeg >= 247.5 && normalizedDeg < 292.5) compass = "N";
  else compass = "NE";
  
  return `${compass} (${normalizedDeg.toFixed(0)}°)`;
}

/**
 * Generates outer carriageway polygon boundaries based on center line coordinates and width in meters.
 * Scale: 1 pixel = 0.5 meters (so a meter of offset is widthInMeters world units on both sides of the center line)
 */
export function generateCarriagewayPolygon(pts: Array<[number, number]>, widthInMeters: number): Array<[number, number]> {
  if (pts.length < 2) return [];
  const leftPoints: Array<[number, number]> = [];
  const rightPoints: Array<[number, number]> = [];

  for (let i = 0; i < pts.length; i++) {
    let dx = 0;
    let dy = 0;

    if (i === 0) {
      dx = pts[1][0] - pts[0][0];
      dy = pts[1][1] - pts[0][1];
    } else if (i === pts.length - 1) {
      dx = pts[pts.length - 1][0] - pts[pts.length - 2][0];
      dy = pts[pts.length - 1][1] - pts[pts.length - 2][1];
    } else {
      const dx1 = pts[i][0] - pts[i - 1][0];
      const dy1 = pts[i][1] - pts[i - 1][1];
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;

      const dx2 = pts[i + 1][0] - pts[i][0];
      const dy2 = pts[i + 1][1] - pts[i][1];
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;

      dx = (dx1 / len1) + (dx2 / len2);
      dy = (dy1 / len1) + (dy2 / len2);
    }

    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) continue;

    const nx = -dy / len;
    const ny = dx / len;

    // 1 pixel = 0.5 meters.
    // For a physical offset of widthInMeters / 2 on each side, we want:
    // (widthInMeters / 2) / 0.5 = widthInMeters world units.
    const offsetUnits = widthInMeters;

    leftPoints.push([pts[i][0] + nx * offsetUnits, pts[i][1] + ny * offsetUnits]);
    rightPoints.push([pts[i][0] - nx * offsetUnits, pts[i][1] - ny * offsetUnits]);
  }

  return [...leftPoints, ...rightPoints.reverse()];
}

/**
 * Performs intersection calculations for line segments
 */
export function lineSegmentsIntersect(
  p1: [number, number],
  q1: [number, number],
  p2: [number, number],
  q2: [number, number]
): boolean {
  const orientation = (p: [number, number], q: [number, number], r: [number, number]): number => {
    const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
    if (Math.abs(val) < 1e-9) return 0;
    return (val > 0) ? 1 : 2;
  };

  const onSegment = (p: [number, number], q: [number, number], r: [number, number]): boolean => {
    return q[0] <= Math.max(p[0], r[0]) && q[0] >= Math.min(p[0], r[0]) &&
           q[1] <= Math.max(p[1], r[1]) && q[1] >= Math.min(p[1], r[1]);
  };

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
}

/**
 * Validates a single road spatial object for Connectivity, Boundaries, Crossings, Dead-ends, and Minimum Width.
 */
export function validateRoad(road: MockGeometry, objects: MockGeometry[]): string[] {
  const warnings: string[] = [];
  const roadCoords = road.geometry_data.coordinates as Array<[number, number]>;
  if (!roadCoords || roadCoords.length < 2) return warnings;

  const roadName = road.properties.road_name || road.properties.name || road.name;
  const width = road.properties.road_width || 12;

  // 1. Minimum width validation
  const minWidthRequired = 3;
  if (width < minWidthRequired) {
    warnings.push(`Road "${roadName}": Width (${width}m) is below the minimum required standard of ${minWidthRequired}m.`);
  }

  // 2. Road cannot leave boundary
  const boundaryObj = objects.find(o => o.layerName === "BOUNDARY");
  if (boundaryObj) {
    const boundaryCoords = boundaryObj.geometry_data.coordinates as Array<[number, number]>;
    if (boundaryCoords && boundaryCoords.length >= 3) {
      let leftBoundary = false;
      for (const pt of roadCoords) {
        if (!isPointInsidePolygon(pt, boundaryCoords)) {
          leftBoundary = true;
          break;
        }
      }
      if (leftBoundary) {
        warnings.push(`Road "${roadName}": Coordinates exceed the layout boundary polygon limit.`);
      }
    }
  }

  const otherRoads = objects.filter(o => o.layerName === "ROADS" && o.id !== road.id);

  // Helper to check if two points are close (2 meters = 4 pixels)
  const arePointsClose = (p1: [number, number], p2: [number, number], tolerancePx = 4) => {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy) <= tolerancePx;
  };

  // Helper to find minimum distance from a point to another road centerline
  const distanceToPolyline = (p: [number, number], poly: Array<[number, number]>) => {
    let minDist = Infinity;
    for (let i = 0; i < poly.length - 1; i++) {
      const dist = distanceToSegment(p, poly[i], poly[i + 1]);
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  };

  // 3. Road must connect
  let isConnected = false;
  if (otherRoads.length === 0 && !boundaryObj) {
    isConnected = true;
  } else {
    const startPt = roadCoords[0];
    const endPt = roadCoords[roadCoords.length - 1];

    for (const other of otherRoads) {
      const otherCoords = other.geometry_data.coordinates as Array<[number, number]>;
      if (!otherCoords || otherCoords.length < 2) continue;

      for (const opt of otherCoords) {
        if (arePointsClose(startPt, opt) || arePointsClose(endPt, opt)) {
          isConnected = true;
          break;
        }
      }
      if (isConnected) break;

      if (distanceToPolyline(startPt, otherCoords) <= 4 || distanceToPolyline(endPt, otherCoords) <= 4) {
        isConnected = true;
        break;
      }
    }

    if (!isConnected && boundaryObj) {
      const boundaryCoords = boundaryObj.geometry_data.coordinates as Array<[number, number]>;
      if (boundaryCoords) {
        for (const bpt of boundaryCoords) {
          if (arePointsClose(startPt, bpt) || arePointsClose(endPt, bpt)) {
            isConnected = true;
            break;
          }
        }
        if (!isConnected && (distanceToPolyline(startPt, boundaryCoords) <= 4 || distanceToPolyline(endPt, boundaryCoords) <= 4)) {
          isConnected = true;
        }
      }
    }
  }

  if (!isConnected && (otherRoads.length > 0 || boundaryObj)) {
    warnings.push(`Road "${roadName}": Connectivity warning. Road does not touch any other road centerlines or boundary.`);
  }

  // 4. Dead-end warning
  if (otherRoads.length > 0 || boundaryObj) {
    const startPt = roadCoords[0];
    const endPt = roadCoords[roadCoords.length - 1];

    let startConnected = false;
    let endConnected = false;

    for (const other of otherRoads) {
      const otherCoords = other.geometry_data.coordinates as Array<[number, number]>;
      if (!otherCoords) continue;

      for (const opt of otherCoords) {
        if (arePointsClose(startPt, opt)) startConnected = true;
        if (arePointsClose(endPt, opt)) endConnected = true;
      }
      if (distanceToPolyline(startPt, otherCoords) <= 4) startConnected = true;
      if (distanceToPolyline(endPt, otherCoords) <= 4) endConnected = true;
    }

    if (boundaryObj) {
      const boundaryCoords = boundaryObj.geometry_data.coordinates as Array<[number, number]>;
      if (boundaryCoords) {
        if (distanceToPolyline(startPt, boundaryCoords) <= 4) startConnected = true;
        if (distanceToPolyline(endPt, boundaryCoords) <= 4) endConnected = true;
      }
    }

    if (!startConnected || !endConnected) {
      warnings.push(`Road "${roadName}": Dead-end warning. Road has at least one loose, disconnected terminus.`);
    }
  }

  // 5. Roads cannot overlap incorrectly
  for (const other of otherRoads) {
    const otherCoords = other.geometry_data.coordinates as Array<[number, number]>;
    if (!otherCoords || otherCoords.length < 2) continue;

    for (let i = 0; i < roadCoords.length - 1; i++) {
      const p1 = roadCoords[i];
      const q1 = roadCoords[i + 1];

      for (let j = 0; j < otherCoords.length - 1; j++) {
        const p2 = otherCoords[j];
        const q2 = otherCoords[j + 1];

        if (lineSegmentsIntersect(p1, q1, p2, q2)) {
          const sharesVertex = arePointsClose(p1, p2) || arePointsClose(p1, q2) || arePointsClose(q1, p2) || arePointsClose(q1, q2);
          if (!sharesVertex) {
            const otherName = other.properties.road_name || other.properties.name || other.name;
            warnings.push(`Road Overlap: "${roadName}" incorrectly crosses "${otherName}" without a snap/intersection node.`);
          }
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

/**
 * Calculates total perimeter of a polygon in physical meters.
 * Scale: 1 pixel = 0.5 meters
 */
export function calculatePolygonPerimeter(coords: Array<[number, number]>): number {
  if (!coords || coords.length < 2) return 0;
  let lenPx = 0;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % n];
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    lenPx += Math.sqrt(dx * dx + dy * dy);
  }
  return lenPx * 0.5;
}
