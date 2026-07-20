import { MockGeometry } from "../../../components/MapWorkspace/types.ts";
import { distanceToSegment, getPolygonCentroid } from "../../../lib/plotEngine.ts";

export interface FrontageDetectionResult {
  primaryRoadId: string | null;
  primaryRoadName: string | null;
  roadClassification: string;
  frontageLength: number;
  isCorner: boolean;
  roadNames: string[];
}

/**
 * Detects detailed frontage info for a plot.
 */
export function detectRoadFrontageInfo(
  plotCoords: Array<[number, number]>,
  roadObjects: MockGeometry[]
): FrontageDetectionResult {
  if (roadObjects.length === 0 || plotCoords.length < 3) {
    return {
      primaryRoadId: null,
      primaryRoadName: null,
      roadClassification: "Local Road",
      frontageLength: 0,
      isCorner: false,
      roadNames: []
    };
  }

  const centroid = getPolygonCentroid(plotCoords);
  const matchedRoads: Array<{ road: MockGeometry; minDistance: number; edgeIndex: number }> = [];

  for (const road of roadObjects) {
    // Prefer using road's actual carriageway boundary polygon if it exists, otherwise center_line
    const roadCoords = road.properties?.boundary || road.properties?.center_line || road.geometry_data?.coordinates;
    if (!roadCoords || !Array.isArray(roadCoords)) continue;

    // Find the closest distance from the plot centroid to any segment of this road's layout
    let minDistance = Infinity;
    let closestEdgeIndex = 0;

    for (let j = 0; j < roadCoords.length - 1; j++) {
      const dist = distanceToSegment(centroid, roadCoords[j] as [number, number], roadCoords[j + 1] as [number, number]);
      if (dist < minDistance) {
        minDistance = dist;
        closestEdgeIndex = j;
      }
    }

    matchedRoads.push({ road, minDistance, edgeIndex: closestEdgeIndex });
  }

  // Sort by closest road first
  matchedRoads.sort((a, b) => a.minDistance - b.minDistance);

  if (matchedRoads.length === 0) {
    return {
      primaryRoadId: null,
      primaryRoadName: null,
      roadClassification: "Local Road",
      frontageLength: 0,
      isCorner: false,
      roadNames: []
    };
  }

  const primaryMatch = matchedRoads[0];
  const roadNames = matchedRoads.filter(m => m.minDistance < 30.0).map(m => m.road.properties?.road_name || "Secondary Road");
  const isCorner = roadNames.length >= 2;

  // Frontage edge length calculation
  // Find the edge in the plot closest to the primary road
  let plotFrontageEdgeIndex = 0;
  let minEdgeDistance = Infinity;
  const n = plotCoords.length;

  const roadLine = (primaryMatch.road.properties?.boundary || primaryMatch.road.properties?.center_line || primaryMatch.road.geometry_data?.coordinates) as Array<[number, number]>;

  for (let i = 0; i < n; i++) {
    const p1 = plotCoords[i];
    const p2 = plotCoords[(i + 1) % n];
    const edgeMid: [number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

    let minDistToRoadLine = Infinity;
    for (let k = 0; k < roadLine.length - 1; k++) {
      const dist = distanceToSegment(edgeMid, roadLine[k], roadLine[k + 1]);
      if (dist < minDistToRoadLine) {
        minDistToRoadLine = dist;
      }
    }

    if (minDistToRoadLine < minEdgeDistance) {
      minEdgeDistance = minDistToRoadLine;
      plotFrontageEdgeIndex = i;
    }
  }

  const f1 = plotCoords[plotFrontageEdgeIndex];
  const f2 = plotCoords[(plotFrontageEdgeIndex + 1) % n];
  const rawLen = Math.sqrt(Math.pow(f2[0] - f1[0], 2) + Math.pow(f2[1] - f1[1], 2)) * 0.5; // pixel to meter conversion

  return {
    primaryRoadId: primaryMatch.road.id,
    primaryRoadName: primaryMatch.road.properties?.road_name || primaryMatch.road.name || "Secondary Road",
    roadClassification: primaryMatch.road.properties?.road_type || "Secondary Road",
    frontageLength: parseFloat(rawLen.toFixed(1)),
    isCorner,
    roadNames
  };
}
