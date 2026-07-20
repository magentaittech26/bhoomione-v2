import { MockGeometry } from "../../../components/MapWorkspace/types.ts";
import { runPlotValidationSuite } from "../validation/rules.ts";

/**
 * Searches for a plot based on the advanced multi-field queries.
 */
export function queryPlots(
  objects: MockGeometry[],
  searchQuery: string
): MockGeometry | null {
  if (!searchQuery || searchQuery.trim().length < 2) return null;

  const q = searchQuery.toLowerCase().trim();
  const plots = objects.filter((o) => o.layerName === "PLOTS");
  const validationMessages = runPlotValidationSuite(objects);

  // 1. Direct search loop
  for (const plot of plots) {
    const props = plot.properties || {};
    const pNum = String(props.plot_number || "").toLowerCase();
    const pName = String(props.plot_name || "").toLowerCase();
    const block = String(props.block || "").toLowerCase();
    const sector = String(props.sector || "").toLowerCase();
    const phase = String(props.phase || "").toLowerCase();
    const type = String(props.plot_type || "").toLowerCase();
    const facing = String(props.facing || "").toLowerCase();
    const cornerType = String(props.corner_status?.corner_type || props.corner_type || "").toLowerCase();
    const roadNames = (props.road_names || []).map((n: string) => n.toLowerCase());

    // Validation matching
    const plotErrors = validationMessages.filter((m) => m.plot_id === plot.id);
    const hasError = plotErrors.some((m) => m.severity === "ERROR");
    const hasWarning = plotErrors.some((m) => m.severity === "WARNING");

    // Matching criteria checks
    const matchPlotNum = pNum.includes(q) || `plot ${pNum}`.includes(q) || `plot-${pNum}`.includes(q);
    const matchName = pName.includes(q);
    const matchBlock = block.includes(q) || `block ${block}`.includes(q) || `block-${block}`.includes(q);
    const matchSector = sector.includes(q) || `sector ${sector}`.includes(q) || `sector-${sector}`.includes(q);
    const matchPhase = phase.includes(q) || `phase ${phase}`.includes(q) || `phase-${phase}`.includes(q);
    const matchType = type.includes(q) || `zoning ${type}`.includes(q);
    const matchFacing = facing.includes(q) || `${facing} facing`.includes(q);
    const matchCorner = q === "corner" || q === "corner plot" ? (props.corner_status?.is_corner_plot || props.corner_type && props.corner_type !== "internal plot") : cornerType.includes(q);
    const matchRoad = roadNames.some((name: string) => name.includes(q)) || (props.road_ids || []).some((id: string) => id.toLowerCase().includes(q));
    
    // Status keywords
    const matchValidation = (q === "error" || q === "invalid") ? hasError : (q === "warning" ? hasWarning : false);
    const matchStatus = String(props.status || "").toLowerCase().includes(q);

    if (
      matchPlotNum ||
      matchName ||
      matchBlock ||
      matchSector ||
      matchPhase ||
      matchType ||
      matchFacing ||
      matchCorner ||
      matchRoad ||
      matchValidation ||
      matchStatus
    ) {
      return plot;
    }
  }

  return null;
}
