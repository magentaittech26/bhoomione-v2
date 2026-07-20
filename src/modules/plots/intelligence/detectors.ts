import { MockGeometry } from "../../../components/MapWorkspace/types.ts";
import { getPolygonCentroid, distanceToSegment, calculateShoelaceArea } from "../../../lib/plotEngine.ts";

export interface FacingInfo {
  bearingDegrees: number;
  compassLabel: string;
  confidence: number;
  associatedRoadId: string | null;
  associatedRoadName: string | null;
  frontageSegment: [[number, number], [number, number]] | null;
}

export interface CornerInfo {
  isCornerPlot: boolean;
  cornerType: "two-road corner" | "three-road corner" | "end plot" | "internal plot" | "irregular corner" | "none";
  connectedRoadIds: string[];
  cornerConfidence: number;
}

export interface DimensionInfo {
  primaryFrontage: number;
  secondaryFrontage: number;
  effectiveFrontage: number;
  averageDepth: number;
  maxDepth: number;
  minDepth: number;
  sideLengths: number[];
  diagonalLengths: number[];
  northSide: number;
  southSide: number;
  eastSide: number;
  westSide: number;
}

/**
 * Calculates distance from point (pt) to a polyline.
 */
function distanceToPolyline(pt: [number, number], polyline: Array<[number, number]>): number {
  let minDist = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const dist = distanceToSegment(pt, polyline[i], polyline[i + 1]);
    if (dist < minDist) {
      minDist = dist;
    }
  }
  return minDist;
}

/**
 * Detects the facing direction of a plot.
 */
export function detectPlotFacingDetails(
  plotCoords: Array<[number, number]>,
  roadObjects: MockGeometry[]
): FacingInfo {
  const centroid = getPolygonCentroid(plotCoords);
  if (roadObjects.length === 0) {
    return {
      bearingDegrees: 0,
      compassLabel: "Undetermined",
      confidence: 0,
      associatedRoadId: null,
      associatedRoadName: null,
      frontageSegment: null
    };
  }

  // 1. Find nearest road
  let nearestRoad: MockGeometry | null = null;
  let minRoadDist = Infinity;

  for (const road of roadObjects) {
    const coords = road.properties?.center_line || road.geometry_data?.coordinates;
    if (!coords || !Array.isArray(coords)) continue;

    const dist = distanceToPolyline(centroid, coords as Array<[number, number]>);
    if (dist < minRoadDist) {
      minRoadDist = dist;
      nearestRoad = road;
    }
  }

  if (!nearestRoad) {
    return {
      bearingDegrees: 0,
      compassLabel: "Undetermined",
      confidence: 0,
      associatedRoadId: null,
      associatedRoadName: null,
      frontageSegment: null
    };
  }

  // 2. Find the edge of the plot closest to this nearest road
  let nearestEdgeIndex = 0;
  let minEdgeDist = Infinity;
  const n = plotCoords.length;

  const roadLine = (nearestRoad.properties?.center_line || nearestRoad.geometry_data?.coordinates) as Array<[number, number]>;

  for (let i = 0; i < n; i++) {
    const p1 = plotCoords[i];
    const p2 = plotCoords[(i + 1) % n];
    const edgeMidpoint: [number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    const dist = distanceToPolyline(edgeMidpoint, roadLine);
    if (dist < minEdgeDist) {
      minEdgeDist = dist;
      nearestEdgeIndex = i;
    }
  }

  const p1 = plotCoords[nearestEdgeIndex];
  const p2 = plotCoords[(nearestEdgeIndex + 1) % n];
  const frontageSegment: [[number, number], [number, number]] = [p1, p2];

  // 3. Compute vector from plot centroid to the midpoint of the frontage edge
  const edgeMid: [number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
  const dx = edgeMid[0] - centroid[0];
  const dy = edgeMid[1] - centroid[1];

  // In our coordinate system, standard screen-space math has y-down, but let's treat it as standard Cartesian:
  // dx = east, dy = north (if inverted dy is south, but let's compute standard atan2)
  let rad = Math.atan2(dy, dx); // dy is row-axis, dx is col-axis
  let deg = (rad * 180) / Math.PI;
  if (deg < 0) deg += 360;

  // Let's map degrees to Compass directions (Y is downwards in screen space, so +Y is South, +X is East, -X is West, -Y is North)
  // We'll map screen coordinates properly:
  // dx > 0, dy = 0 => East (90 deg in compass standard if 0 is North, but standard atan2 has 0 at East)
  // Let's map precisely:
  let compassLabel = "North";
  if (deg >= 337.5 || deg < 22.5) compassLabel = "East";
  else if (deg >= 22.5 && deg < 67.5) compassLabel = "South-East";
  else if (deg >= 67.5 && deg < 112.5) compassLabel = "South";
  else if (deg >= 112.5 && deg < 157.5) compassLabel = "South-West";
  else if (deg >= 157.5 && deg < 202.5) compassLabel = "West";
  else if (deg >= 202.5 && deg < 247.5) compassLabel = "North-West";
  else if (deg >= 247.5 && deg < 292.5) compassLabel = "North";
  else if (deg >= 292.5 && deg < 337.5) compassLabel = "North-East";

  // Confidence is inversely proportional to distance
  const confidence = Math.max(0.2, Math.min(0.95, 1 - minRoadDist / 150));

  return {
    bearingDegrees: Math.round(deg),
    compassLabel,
    confidence: parseFloat(confidence.toFixed(2)),
    associatedRoadId: nearestRoad.id,
    associatedRoadName: nearestRoad.properties?.road_name || nearestRoad.name || "Main Road",
    frontageSegment
  };
}

/**
 * Detects the corner status of a plot.
 */
export function detectPlotCornerDetails(
  plotCoords: Array<[number, number]>,
  roadObjects: MockGeometry[]
): CornerInfo {
  const centroid = getPolygonCentroid(plotCoords);
  if (roadObjects.length === 0) {
    return {
      isCornerPlot: false,
      cornerType: "internal plot",
      connectedRoadIds: [],
      cornerConfidence: 1
    };
  }

  // Find all distinct roads within 25 meters of the plot centroid
  const closeRoads = roadObjects.filter((road) => {
    const coords = road.properties?.center_line || road.geometry_data?.coordinates;
    if (!coords || !Array.isArray(coords)) return false;
    const dist = distanceToPolyline(centroid, coords as Array<[number, number]>);
    return dist < 25.0; // close proximity tolerance
  });

  const connectedRoadIds = closeRoads.map((r) => r.id);

  if (closeRoads.length >= 3) {
    return {
      isCornerPlot: true,
      cornerType: "three-road corner",
      connectedRoadIds,
      cornerConfidence: 0.9
    };
  } else if (closeRoads.length === 2) {
    return {
      isCornerPlot: true,
      cornerType: "two-road corner",
      connectedRoadIds,
      cornerConfidence: 0.85
    };
  } else {
    // If only 1 road is nearby, see if it is at the edge/end of the road segments
    // Or if it's just an internal plot
    return {
      isCornerPlot: false,
      cornerType: "internal plot",
      connectedRoadIds,
      cornerConfidence: 0.95
    };
  }
}

/**
 * Calculates precise dimensions, frontage, and depth for a plot.
 */
export function calculatePlotDimensions(
  plotCoords: Array<[number, number]>,
  facingInfo: FacingInfo
): DimensionInfo {
  const n = plotCoords.length;
  const sideLengths: number[] = [];
  const diagonalLengths: number[] = [];

  // Side lengths
  for (let i = 0; i < n; i++) {
    const p1 = plotCoords[i];
    const p2 = plotCoords[(i + 1) % n];
    // Convert pixels to meters (Scale: 1px = 0.5m)
    const len = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2)) * 0.5;
    sideLengths.push(parseFloat(len.toFixed(2)));
  }

  // Diagonals
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const p1 = plotCoords[i];
      const p2 = plotCoords[j];
      const len = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2)) * 0.5;
      diagonalLengths.push(parseFloat(len.toFixed(2)));
    }
  }

  // Calculate primary and secondary frontage
  let primaryFrontage = 0;
  if (facingInfo.frontageSegment) {
    const [p1, p2] = facingInfo.frontageSegment;
    primaryFrontage = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2)) * 0.5;
  } else if (sideLengths.length > 0) {
    primaryFrontage = sideLengths[0]; // Fallback to first side
  }

  // Depth calculation (distance from the frontage segment's midpoint to the furthest opposite vertex)
  let maxDepth = 0;
  let minDepth = Infinity;
  let sumDepth = 0;
  let depthCount = 0;

  if (facingInfo.frontageSegment && n > 2) {
    const [f1, f2] = facingInfo.frontageSegment;
    // For every vertex not in the frontage segment, calculate perpendicular distance
    for (const pt of plotCoords) {
      if (
        (pt[0] === f1[0] && pt[1] === f1[1]) ||
        (pt[0] === f2[0] && pt[1] === f2[1])
      ) {
        continue;
      }
      // Perpendicular distance to the frontage line
      const dist = distanceToSegment(pt, f1, f2) * 0.5;
      if (dist > maxDepth) maxDepth = dist;
      if (dist < minDepth) minDepth = dist;
      sumDepth += dist;
      depthCount++;
    }
  }

  if (depthCount === 0 || minDepth === Infinity) {
    // Fallback if no frontage segment
    maxDepth = sideLengths.length > 2 ? sideLengths[2] : sideLengths[0];
    minDepth = maxDepth;
    sumDepth = maxDepth;
    depthCount = 1;
  }

  const averageDepth = sumDepth / depthCount;

  // Let's classify edges into cardinal directions: North, South, East, West based on edge angles
  let northSide = 0;
  let southSide = 0;
  let eastSide = 0;
  let westSide = 0;

  for (let i = 0; i < n; i++) {
    const p1 = plotCoords[i];
    const p2 = plotCoords[(i + 1) % n];
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const len = sideLengths[i];

    // standard compass directions for sides:
    // angle near 0/360 or 180 is horizontal, angle near 90/270 is vertical
    // We map angle into cardinal categories
    let absAngle = Math.abs(angle);
    if (absAngle > 180) absAngle = 360 - absAngle;

    if (absAngle <= 45) {
      // Horizontal left-to-right (East-West alignment, let's treat as North side)
      northSide = len;
    } else if (absAngle >= 135) {
      // Horizontal right-to-left
      southSide = len;
    } else if (angle > 45 && angle < 135) {
      // Vertical down (East side in screen coords)
      eastSide = len;
    } else {
      // Vertical up (West side)
      westSide = len;
    }
  }

  // Ensure reasonable values
  if (northSide === 0) northSide = sideLengths[0] || 0;
  if (southSide === 0) southSide = sideLengths[2] || sideLengths[0] || 0;
  if (eastSide === 0) eastSide = sideLengths[1] || sideLengths[0] || 0;
  if (westSide === 0) westSide = sideLengths[3] || sideLengths[1] || 0;

  return {
    primaryFrontage: parseFloat(primaryFrontage.toFixed(1)),
    secondaryFrontage: parseFloat((primaryFrontage * 0.8).toFixed(1)), // Sim secondary
    effectiveFrontage: parseFloat(primaryFrontage.toFixed(1)),
    averageDepth: parseFloat(averageDepth.toFixed(1)),
    maxDepth: parseFloat(maxDepth.toFixed(1)),
    minDepth: parseFloat(minDepth.toFixed(1)),
    sideLengths,
    diagonalLengths,
    northSide: parseFloat(northSide.toFixed(1)),
    southSide: parseFloat(southSide.toFixed(1)),
    eastSide: parseFloat(eastSide.toFixed(1)),
    westSide: parseFloat(westSide.toFixed(1))
  };
}

/**
 * Evaluates shape type of a polygon.
 */
export function detectPlotShapeType(coords: Array<[number, number]>): string {
  const n = coords.length;
  if (n === 3) return "Triangle";
  if (n === 4) {
    // Check if it's rectangular or square
    const side1 = Math.sqrt(Math.pow(coords[1][0] - coords[0][0], 2) + Math.pow(coords[1][1] - coords[0][1], 2));
    const side2 = Math.sqrt(Math.pow(coords[2][0] - coords[1][0], 2) + Math.pow(coords[2][1] - coords[1][1], 2));
    const side3 = Math.sqrt(Math.pow(coords[3][0] - coords[2][0], 2) + Math.pow(coords[3][1] - coords[2][1], 2));
    const side4 = Math.sqrt(Math.pow(coords[0][0] - coords[3][0], 2) + Math.pow(coords[0][1] - coords[3][1], 2));

    const maxSide = Math.max(side1, side2, side3, side4);
    const minSide = Math.min(side1, side2, side3, side4);

    if (maxSide - minSide < maxSide * 0.08) {
      return "Square";
    }
    if (Math.abs(side1 - side3) < maxSide * 0.1 && Math.abs(side2 - side4) < maxSide * 0.1) {
      return "Rectangle";
    }
    return "Trapezoid";
  }
  return "Irregular polygon";
}
