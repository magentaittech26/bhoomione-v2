import { MockGeometry } from "../components/MapWorkspace/types.ts";
import {
  isPointInsidePolygon,
  checkPolygonsOverlap,
  distanceToPolyline,
  calculateCenterlineLength,
  lineSegmentsIntersect
} from "./plotEngine.ts";

/**
 * Gets the standard color representing a utility network type.
 */
export function getUtilityColor(type: string): string {
  const t = (type || "").toLowerCase();
  if (t.includes("water") || t.includes("irrigation") || t.includes("hydrant")) return "#3B82F6"; // Blue
  if (t.includes("sewer")) return "#78350F"; // Brown
  if (t.includes("storm") || t.includes("drain") || t.includes("rainwater")) return "#06B6D4"; // Cyan
  if (t.includes("electrical") || t.includes("voltage") || t.includes("power") || t.includes("transformer") || t.includes("pole")) return "#EF4444"; // Red
  if (t.includes("fiber") || t.includes("telecom")) return "#F97316"; // Orange
  if (t.includes("gas")) return "#EAB308"; // Yellow
  if (t.includes("street") || t.includes("light")) return "#8B5CF6"; // Purple
  if (t.includes("future")) return "#64748B"; // Grey (dashed)
  return "#64748B"; // Default slate grey
}

/**
 * Maps asset node types to their default network type classifications.
 */
export function getNetworkTypeForAsset(asset: string): string {
  const a = (asset || "").toLowerCase();
  if (a.includes("transformer") || a.includes("pole")) return "Electrical LT";
  if (a.includes("street light")) return "Street Lighting";
  if (a.includes("manhole") || a.includes("sewage") || a.includes("lift station")) return "Sewer Line";
  if (a.includes("chamber") || a.includes("drain")) return "Storm Water Drain";
  if (a.includes("valve") || a.includes("hydrant") || a.includes("pump house")) return "Water Supply";
  return "Future Reserved Utility";
}

/**
 * Checks if two coordinates are practically identical (within a tolerance in meters).
 */
function areCoordsEqual(c1: [number, number], c2: [number, number], tolerance = 1.0): boolean {
  if (!c1 || !c2) return false;
  const dx = c1[0] - c2[0];
  const dy = c1[1] - c2[1];
  return Math.sqrt(dx * dx + dy * dy) < tolerance;
}

/**
 * Interface representing the analyzed network topology.
 */
export interface NetworkTopology {
  connectedNodes: Array<{ nodeId: string; segmentId: string }>;
  junctions: Array<[number, number]>; // points where 3+ segments meet
  deadEnds: Array<{ segmentId: string; point: [number, number] }>;
  loops: Array<string[]>; // array of cycles of segment IDs
  disconnectedSegments: string[]; // segment IDs that are completely disconnected
}

/**
 * Analyze the topology of all active utility geometries.
 */
export function analyzeUtilityTopology(utilities: MockGeometry[]): NetworkTopology {
  const segments = utilities.filter(u => u.object_type === "POLYLINE" && u.layerName === "UTILITIES");
  const nodes = utilities.filter(u => u.object_type === "POINT" && u.layerName === "UTILITIES");

  const connectedNodes: Array<{ nodeId: string; segmentId: string }> = [];
  const deadEnds: Array<{ segmentId: string; point: [number, number] }> = [];
  const junctions: Array<[number, number]> = [];
  const loops: Array<string[]> = [];
  const disconnectedSegments: string[] = [];

  // 1. Analyze node-to-segment connectivity
  nodes.forEach(node => {
    const pt = node.geometry_data.coordinates as [number, number];
    if (!pt) return;

    segments.forEach(seg => {
      const segCoords = seg.geometry_data.coordinates as Array<[number, number]>;
      if (!segCoords || segCoords.length < 2) return;

      // If node is close to polyline (within 3m)
      const dist = distanceToPolyline(pt, segCoords);
      if (dist < 3.0) {
        connectedNodes.push({ nodeId: node.id, segmentId: seg.id });
      }
    });
  });

  // 2. Build adjacency list of endpoints to detect junctions and dead ends
  const endpointMap = new Map<string, { count: number; coords: [number, number]; segments: string[] }>();

  segments.forEach(seg => {
    const coords = seg.geometry_data.coordinates as Array<[number, number]>;
    if (!coords || coords.length < 2) return;

    const start = coords[0];
    const end = coords[coords.length - 1];

    const keys = [start, end];
    keys.forEach((pt, idx) => {
      const keyStr = `${Math.round(pt[0])},${Math.round(pt[1])}`;
      let existing = endpointMap.get(keyStr);
      if (!existing) {
        // Try fuzzy matching within 1.5m
        for (const [k, v] of endpointMap.entries()) {
          if (areCoordsEqual(pt, v.coords, 1.5)) {
            existing = v;
            break;
          }
        }
      }

      if (existing) {
        existing.count++;
        if (!existing.segments.includes(seg.id)) {
          existing.segments.push(seg.id);
        }
      } else {
        endpointMap.set(keyStr, {
          count: 1,
          coords: pt,
          segments: [seg.id]
        });
      }
    });
  });

  // Identify Junctions (3+ segments meeting)
  endpointMap.forEach((val) => {
    if (val.segments.length >= 3) {
      junctions.push(val.coords);
    }
  });

  // Identify Dead-ends (endpoints with count = 1 and no connected node)
  segments.forEach(seg => {
    const coords = seg.geometry_data.coordinates as Array<[number, number]>;
    if (!coords || coords.length < 2) return;

    const endpoints = [coords[0], coords[coords.length - 1]];
    endpoints.forEach(pt => {
      // Check if this endpoint has any other segments sharing it
      let sharesWithOthers = false;
      let hasAttachedNode = false;

      // Fuzzy check endpoints
      endpointMap.forEach((val) => {
        if (areCoordsEqual(pt, val.coords, 2.0)) {
          if (val.segments.length > 1) {
            sharesWithOthers = true;
          }
        }
      });

      // Check if any node is attached
      nodes.forEach(node => {
        const nodePt = node.geometry_data.coordinates as [number, number];
        if (nodePt && areCoordsEqual(pt, nodePt, 3.0)) {
          hasAttachedNode = true;
        }
      });

      if (!sharesWithOthers && !hasAttachedNode) {
        deadEnds.push({ segmentId: seg.id, point: pt });
      }
    });
  });

  // 3. Disconnected Segment Detection
  // Build direct adjacency graph for segment connections
  const adj = new Map<string, string[]>();
  segments.forEach(s => adj.set(s.id, []));

  segments.forEach(s1 => {
    const c1 = s1.geometry_data.coordinates as Array<[number, number]>;
    if (!c1 || c1.length < 2) return;

    segments.forEach(s2 => {
      if (s1.id === s2.id) return;
      const c2 = s2.geometry_data.coordinates as Array<[number, number]>;
      if (!c2 || c2.length < 2) return;

      // Check if they share any vertices or endpoints
      let connected = false;
      for (const pt1 of [c1[0], c1[c1.length - 1]]) {
        for (const pt2 of [c2[0], c2[c2.length - 1]]) {
          if (areCoordsEqual(pt1, pt2, 2.0)) {
            connected = true;
            break;
          }
        }
        if (connected) break;
      }

      if (connected) {
        adj.get(s1.id)?.push(s2.id);
      }
    });
  });

  // BFS / DFS to find disconnected components
  const visited = new Set<string>();
  const components: string[][] = [];

  segments.forEach(seg => {
    if (!visited.has(seg.id)) {
      const comp: string[] = [];
      const queue: string[] = [seg.id];
      visited.add(seg.id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        comp.push(curr);
        const neighbors = adj.get(curr) || [];
        neighbors.forEach(n => {
          if (!visited.has(n)) {
            visited.add(n);
            queue.push(n);
          }
        });
      }
      components.push(comp);
    }
  });

  // If there are multiple components, mark components with size 1 or small ones as disconnected segments
  if (components.length > 1) {
    // Find the largest component (assuming it is the main network)
    let maxCompIdx = 0;
    let maxLen = 0;
    components.forEach((c, idx) => {
      if (c.length > maxLen) {
        maxLen = c.length;
        maxCompIdx = idx;
      }
    });

    components.forEach((c, idx) => {
      if (idx !== maxCompIdx) {
        c.forEach(id => disconnectedSegments.push(id));
      }
    });
  } else if (components.length === 1 && segments.length === 1) {
    // A single isolated line is considered disconnected if there are no nodes attached to it
    const segId = segments[0].id;
    const hasNode = connectedNodes.some(cn => cn.segmentId === segId);
    if (!hasNode) {
      disconnectedSegments.push(segId);
    }
  }

  return {
    connectedNodes,
    junctions,
    deadEnds,
    loops,
    disconnectedSegments
  };
}

/**
 * Run utility layer validation rules.
 */
export function validateUtilities(objects: MockGeometry[]): string[] {
  const warnings: string[] = [];

  const boundary = objects.find(o => o.layerName === "BOUNDARY");
  const boundaryCoords = boundary?.geometry_data?.coordinates as Array<[number, number]>;

  const utilities = objects.filter(u => u.layerName === "UTILITIES");
  const roads = objects.filter(o => o.layerName === "ROADS");
  const parks = objects.filter(o => o.layerName === "PARK");
  const amenities = objects.filter(o => o.layerName === "AMENITIES");

  if (utilities.length === 0) return warnings;

  // 1. Analyze Topology
  const topology = analyzeUtilityTopology(objects);

  // A. Duplicate Utility Code verification
  const codes = new Set<string>();
  utilities.forEach(u => {
    const code = u.properties?.utility_code;
    if (code) {
      if (codes.has(code)) {
        warnings.push(`Duplicate Utility Code: Multiple assets share the code "${code}".`);
      }
      codes.add(code);
    }
  });

  // B. Disconnected Network Warning
  topology.disconnectedSegments.forEach(segId => {
    const s = utilities.find(u => u.id === segId);
    if (s) {
      warnings.push(`Disconnected Network: Utility segment "${s.name}" is isolated from the main grid.`);
    }
  });

  // C. Missing Junction Warning
  // Identify points where 3 or more polyline segments intersect, but no node (POINT) exists within 3m
  topology.junctions.forEach(jPt => {
    const nodeNearby = utilities.some(u => {
      if (u.object_type !== "POINT") return false;
      const pt = u.geometry_data.coordinates as [number, number];
      return pt && areCoordsEqual(jPt, pt, 3.5);
    });

    if (!nodeNearby) {
      warnings.push(`Missing Junction Node: 3 or more utility lines meet at (${jPt[0].toFixed(0)}, ${jPt[1].toFixed(0)}) without a junction, valve, or manhole.`);
    }
  });

  // Loop through each utility object for detailed audits
  utilities.forEach(util => {
    const name = util.name || util.properties?.utility_name || "Unnamed Utility";
    const type = util.properties?.network_type || util.properties?.utility_type || "Water Supply";

    // D. Inside Boundary check
    if (boundaryCoords && boundaryCoords.length >= 3) {
      if (util.object_type === "POINT") {
        const pt = util.geometry_data.coordinates as [number, number];
        if (pt) {
          if (!isPointInsidePolygon(pt, boundaryCoords)) {
            warnings.push(`Utility "${name}": Node is located outside of layout boundary.`);
          }
        }
      } else {
        const pts = util.geometry_data.coordinates as Array<[number, number]>;
        if (pts) {
          const outside = pts.some(p => !isPointInsidePolygon(p, boundaryCoords));
          if (outside) {
            warnings.push(`Utility "${name}": Pipeline route goes outside layout boundary.`);
          }
        }
      }
    }

    // E. Pipeline-specific checks
    if (util.object_type === "POLYLINE") {
      const pts = util.geometry_data.coordinates as Array<[number, number]>;
      if (!pts || pts.length < 2) return;

      // Invalid Pipe Diameter check (only for wet/pressure systems)
      if (
        ["water", "sewer", "storm", "drain", "gas", "fire hydrant"].some(kw => type.toLowerCase().includes(kw))
      ) {
        const dia = util.properties?.diameter;
        if (!dia || dia.trim() === "") {
          warnings.push(`Invalid Pipe: Utility pipeline "${name}" has no nominal diameter specified.`);
        }
      }

      // Minimum cover/depth warning
      const cover = util.properties?.minimum_cover || util.properties?.cover_depth;
      if (cover !== undefined) {
        const coverVal = parseFloat(cover);
        if (isNaN(coverVal) || coverVal < 0.6) {
          warnings.push(`Minimum Cover Warning: Utility "${name}" has a cover depth of ${cover}m, which is below the safe standard of 0.6m.`);
        }
      } else {
        // Warning if cover is totally missing
        warnings.push(`Minimum Cover Warning: Utility "${name}" has no cover depth specified.`);
      }

      // Road Crossings and Overlay warning check
      roads.forEach(road => {
        const roadCoords = road.geometry_data.coordinates as Array<[number, number]>;
        if (!roadCoords || roadCoords.length < 2) return;
        const roadWidth = road.properties?.road_width || 12;
        const roadPoly = road.properties?.boundary || [];

        // Check if polyline intersects any road centerline segment or is fully inside road boundary
        let intersectsCenter = false;
        for (let i = 0; i < pts.length - 1; i++) {
          for (let j = 0; j < roadCoords.length - 1; j++) {
            if (lineSegmentsIntersect(pts[i], pts[i + 1], roadCoords[j], roadCoords[j + 1])) {
              intersectsCenter = true;
              break;
            }
          }
          if (intersectsCenter) break;
        }

        if (intersectsCenter) {
          // Info or warning about road crossing (requires conduits/trenches)
          warnings.push(`Road Crossing: Utility line "${name}" crosses Road "${road.properties?.road_name || road.name}". Ensure safe trenching/conduits.`);
        }
      });

      // Park Crossing
      parks.forEach(park => {
        const parkCoords = park.geometry_data.coordinates as Array<[number, number]>;
        if (parkCoords && parkCoords.length >= 3) {
          const insideCount = pts.filter(p => isPointInsidePolygon(p, parkCoords)).length;
          if (insideCount > 0) {
            warnings.push(`Park Crossing: Utility line "${name}" intersects or is routed through Park "${park.properties?.park_name || park.name}".`);
          }
        }
      });

      // Amenity Collision
      amenities.forEach(amenity => {
        const amenityCoords = amenity.geometry_data.coordinates as Array<[number, number]>;
        if (amenityCoords && amenityCoords.length >= 3) {
          const insideCount = pts.filter(p => isPointInsidePolygon(p, amenityCoords)).length;
          if (insideCount > 0) {
            warnings.push(`Amenity Collision: Utility "${name}" directly overlaps/collides with Amenity block "${amenity.properties?.amenity_name || amenity.name}".`);
          }
        }
      });

    } else {
      // POINT checks (Utility Assets)
      const pt = util.geometry_data.coordinates as [number, number];
      if (!pt) return;

      // Amenity/Park Collisions for Utility Node points
      amenities.forEach(amenity => {
        const coords = amenity.geometry_data.coordinates as Array<[number, number]>;
        if (coords && coords.length >= 3) {
          if (isPointInsidePolygon(pt, coords)) {
            warnings.push(`Amenity Collision: Utility Node "${name}" overlaps Amenity block "${amenity.properties?.amenity_name || amenity.name}".`);
          }
        }
      });

      parks.forEach(park => {
        const coords = park.geometry_data.coordinates as Array<[number, number]>;
        if (coords && coords.length >= 3) {
          if (isPointInsidePolygon(pt, coords)) {
            warnings.push(`Park Crossing: Utility Node "${name}" overlaps Park "${park.properties?.park_name || park.name}".`);
          }
        }
      });
    }
  });

  return warnings;
}
