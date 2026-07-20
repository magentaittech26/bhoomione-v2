import { RowGeneratorInput } from "../types.ts";
import { MockGeometry } from "../../../components/MapWorkspace/types.ts";

/**
 * Generates plot geometries and properties along a road segment line.
 */
export function generatePlotRow(
  input: RowGeneratorInput,
  roadObj: MockGeometry,
  nextPlotNumber: number
): Array<{ coords: Array<[number, number]>; properties: any }> {
  const {
    startPoint,
    endPoint,
    standardFrontage,
    standardDepth,
    plotCount,
    gap,
    startingNumber,
    numberingDirection,
    sideOfRoad,
    cornerTreatment,
    remainderHandling
  } = input;

  const dx = endPoint[0] - startPoint[0];
  const dy = endPoint[1] - startPoint[1];
  const roadLength = Math.sqrt(dx * dx + dy * dy);

  if (roadLength < 1.0) return [];

  // Direction vector along the road edge
  const ux = dx / roadLength;
  const uy = dy / roadLength;

  // Perpendicular vector for plot depth (+Y in screen space is downwards)
  // Left side of road vs Right side of road
  const wx = sideOfRoad === "right" ? -uy : uy;
  const wy = sideOfRoad === "right" ? ux : -ux;

  // Determine actual frontage per plot based on remainder handling
  let frontage = standardFrontage;
  const totalRequiredWidth = plotCount * standardFrontage + (plotCount - 1) * gap;

  if (totalRequiredWidth > roadLength && remainderHandling === "cancel") {
    throw new Error("Generation cancelled: The total plot width exceeds the selected road length segment.");
  }

  let distributedFrontage = standardFrontage;
  if (remainderHandling === "distribute") {
    // Distribute total road length evenly among plots, subtracting total gap
    const availableLength = roadLength - (plotCount - 1) * gap;
    distributedFrontage = Math.max(3.0, availableLength / plotCount);
  }

  const results: Array<{ coords: Array<[number, number]>; properties: any }> = [];

  for (let i = 0; i < plotCount; i++) {
    // Calculate current frontage for this plot
    let currentFrontage = remainderHandling === "distribute" ? distributedFrontage : frontage;

    // Last plot remainder check
    if (remainderHandling === "irregular-final" && i === plotCount - 1) {
      const placedLength = i * (frontage + gap);
      currentFrontage = Math.max(3.0, roadLength - placedLength);
    }

    // Offset along the road
    const startOffset = i * (currentFrontage + gap);
    if (startOffset + currentFrontage > roadLength + 0.1 && remainderHandling === "open-remainder") {
      break; // stop generating if we run out of road length
    }

    const p1x = startPoint[0] + ux * startOffset;
    const p1y = startPoint[1] + uy * startOffset;

    const p2x = p1x + ux * currentFrontage;
    const p2y = p1y + uy * currentFrontage;

    // Apply corner treatment to the depth of the first or last plot if requested
    let depth = standardDepth;
    if (cornerTreatment === "larger-first" && i === 0) {
      depth = standardDepth * 1.25;
    } else if (cornerTreatment === "larger-last" && i === plotCount - 1) {
      depth = standardDepth * 1.25;
    }

    // Project depth points perpendicular to the frontage line
    // Convert meters back to pixels (Scale: 1m = 2px, so meters * 2)
    // Actually, in the plot engine, scale is 1px = 0.5m. So 1m = 2px.
    const depthPx = depth * 2.0;
    const frontagePx = currentFrontage * 2.0;

    const p3x = p2x + wx * depthPx;
    const p3y = p2y + wy * depthPx;

    const p4x = p1x + wx * depthPx;
    const p4y = p1y + wy * depthPx;

    // Generate coordinates clockwise
    const coords: Array<[number, number]> = [
      [parseFloat(p1x.toFixed(1)), parseFloat(p1y.toFixed(1))],
      [parseFloat(p2x.toFixed(1)), parseFloat(p2y.toFixed(1))],
      [parseFloat(p3x.toFixed(1)), parseFloat(p3y.toFixed(1))],
      [parseFloat(p4x.toFixed(1)), parseFloat(p4y.toFixed(1))]
    ];

    // Plot properties setup
    const num = numberingDirection === "asc" ? startingNumber + i : startingNumber + (plotCount - 1 - i);

    results.push({
      coords,
      properties: {
        plot_number: String(num),
        zoning: "Residential",
        facing: sideOfRoad === "right" ? "West" : "East", // Initial approximate facing
        corner_type: (i === 0 || i === plotCount - 1) ? "end plot" : "internal plot",
        road_ids: [roadObj.id],
        road_names: [roadObj.properties?.road_name || roadObj.name || "Main Road"]
      }
    });
  }

  return results;
}
