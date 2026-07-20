import { MockGeometry } from "../../../components/MapWorkspace/types.ts";
import { getPolygonCentroid } from "../../../lib/plotEngine.ts";

export interface NumberingOptions {
  startingNumber: number;
  padding: number; // e.g. 3 for 001
  prefix?: string; // e.g. "A-"
  block?: string;  // e.g. "B1-"
  phase?: string;  // e.g. "PH-"
  sector?: string; // e.g. "SEC-"
  sequenceType: "numeric" | "padded" | "alphabetic" | "complex";
  sortingScheme: "row-wise" | "serpentine" | "clockwise" | "counter-clockwise" | "road-wise";
}

/**
 * Sorts plot objects based on the chosen sorting scheme.
 */
export function sortPlotsForNumbering(
  plots: MockGeometry[],
  scheme: NumberingOptions["sortingScheme"]
): MockGeometry[] {
  if (plots.length === 0) return [];

  // Get centroids for sorting
  const plotsWithCentroids = plots.map((p) => {
    const coords = p.geometry_data?.coordinates as Array<[number, number]>;
    const centroid = coords ? getPolygonCentroid(coords) : [0, 0];
    return { plot: p, cx: centroid[0], cy: centroid[1] };
  });

  if (scheme === "row-wise") {
    // Sort primarily by Y (vertical position), then by X
    // Group into rows if Y coordinates are within 15 meters
    plotsWithCentroids.sort((a, b) => {
      const yDiff = a.cy - b.cy;
      if (Math.abs(yDiff) < 30) {
        return a.cx - b.cx; // Same row, sort left-to-right
      }
      return yDiff;
    });
  } else if (scheme === "serpentine") {
    // Group into rows, then alternate direction
    plotsWithCentroids.sort((a, b) => a.cy - b.cy);
    // Group into logical rows
    const rows: Array<typeof plotsWithCentroids> = [];
    let currentRow: typeof plotsWithCentroids = [];
    for (const item of plotsWithCentroids) {
      if (currentRow.length === 0) {
        currentRow.push(item);
      } else {
        const avgY = currentRow.reduce((sum, r) => sum + r.cy, 0) / currentRow.length;
        if (Math.abs(item.cy - avgY) < 30) {
          currentRow.push(item);
        } else {
          rows.push(currentRow);
          currentRow = [item];
        }
      }
    }
    if (currentRow.length > 0) rows.push(currentRow);

    // Sort each row
    const sorted: typeof plotsWithCentroids = [];
    rows.forEach((row, index) => {
      row.sort((a, b) => a.cx - b.cx);
      if (index % 2 === 1) {
        row.reverse(); // Alternate direction
      }
      sorted.push(...row);
    });
    return sorted.map((s) => s.plot);
  } else if (scheme === "clockwise" || scheme === "counter-clockwise") {
    // Sort by angle around the collective center of all plots
    const sumX = plotsWithCentroids.reduce((sum, p) => sum + p.cx, 0);
    const sumY = plotsWithCentroids.reduce((sum, p) => sum + p.cy, 0);
    const centerX = sumX / plotsWithCentroids.length;
    const centerY = sumY / plotsWithCentroids.length;

    plotsWithCentroids.forEach((p) => {
      (p as any).angle = Math.atan2(p.cy - centerY, p.cx - centerX);
    });

    plotsWithCentroids.sort((a, b) => {
      return scheme === "clockwise"
        ? (a as any).angle - (b as any).angle
        : (b as any).angle - (a as any).angle;
    });
  } else {
    // Default / road-wise: sort left-to-right (by X coordinate)
    plotsWithCentroids.sort((a, b) => a.cx - b.cx);
  }

  return plotsWithCentroids.map((s) => s.plot);
}

/**
 * Formats a single number based on prefix, block, phase, sector, and padding.
 */
export function formatPlotNumber(num: number, options: NumberingOptions): string {
  let numStr = String(num);
  if (options.padding > 0) {
    numStr = numStr.padStart(options.padding, "0");
  }

  let finalParts: string[] = [];
  if (options.phase) finalParts.push(options.phase);
  if (options.sector) finalParts.push(options.sector);
  if (options.block) finalParts.push(options.block);
  if (options.prefix) finalParts.push(options.prefix);
  
  const basePrefix = finalParts.join("");
  return `${basePrefix}${numStr}`;
}

/**
 * Generates an preview object of plot objects mapped to their proposed numbers.
 */
export function generateRenumberingPreview(
  plots: MockGeometry[],
  options: NumberingOptions
): Array<{ id: string; currentNumber: string; proposedNumber: string }> {
  const sorted = sortPlotsForNumbering(plots, options.sortingScheme);
  return sorted.map((plot, index) => {
    const proposedNum = formatPlotNumber(options.startingNumber + index, options);
    return {
      id: plot.id,
      currentNumber: plot.properties?.plot_number || plot.name || "N/A",
      proposedNumber: proposedNum
    };
  });
}

/**
 * Finds duplicate plot numbers in a dataset.
 */
export function findDuplicatePlotNumbers(objects: MockGeometry[]): string[] {
  const plots = objects.filter((o) => o.layerName === "PLOTS");
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  plots.forEach((plot) => {
    const num = plot.properties?.plot_number;
    if (num) {
      if (seen.has(num)) {
        duplicates.add(num);
      } else {
        seen.add(num);
      }
    }
  });

  return Array.from(duplicates);
}
