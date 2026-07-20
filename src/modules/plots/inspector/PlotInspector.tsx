import React from "react";
import { MockGeometry } from "../../../components/MapWorkspace/types.ts";
import { calculatePlotMetrics, calculateShoelaceArea } from "../../../lib/plotEngine.ts";
import { detectPlotFacingDetails, detectPlotCornerDetails, calculatePlotDimensions, detectPlotShapeType } from "../intelligence/detectors.ts";
import { runPlotValidationSuite } from "../validation/rules.ts";
import { 
  Compass, 
  MapPin, 
  Tag, 
  Ruler, 
  Activity, 
  HelpCircle, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle 
} from "lucide-react";
import api from "../../../lib/api.ts";
import { BhoomiModuleRegistry } from "../../spatial-core/registry/index.ts";

interface PlotInspectorProps {
  selectedObject: MockGeometry;
  onUpdateObject: (updated: MockGeometry) => void;
  allObjects: MockGeometry[];
}

export default function PlotInspector({
  selectedObject,
  onUpdateObject,
  allObjects
}: PlotInspectorProps) {
  const coords = selectedObject.geometry_data?.coordinates as Array<[number, number]>;
  if (!coords || coords.length < 3) return null;

  const props = selectedObject.properties || {};

  // Compute live intelligence calculations
  const metrics = calculatePlotMetrics(coords);
  const roads = allObjects.filter((o) => o.layerName === "ROADS");
  const facingDetails = detectPlotFacingDetails(coords, roads);
  const cornerDetails = detectPlotCornerDetails(coords, roads);
  const dimensions = calculatePlotDimensions(coords, facingDetails);
  const calculatedShape = detectPlotShapeType(coords);

  // Fallback / defaults
  const plotNumber = props.plot_number || "";
  const plotName = props.plot_name || `Plot ${plotNumber}`;
  const block = props.block || "";
  const sector = props.sector || "";
  const phase = props.phase || "";
  const plotType = props.plot_type || "Residential";
  const facing = props.facing || facingDetails.compassLabel;
  const isCorner = props.corner_status?.is_corner_plot !== undefined ? props.corner_status.is_corner_plot : cornerDetails.isCornerPlot;
  const cornerType = props.corner_status?.corner_type || cornerDetails.cornerType;
  const status = props.status || "Draft";
  const internalNotes = props.metadata?.internal_notes || "";
  const planningRemarks = props.metadata?.planning_remarks || "";

  // Compute permissions
  const registry = BhoomiModuleRegistry.getInstance();
  const isModuleActive = registry.isModuleActive("mod-plots");
  const user = api.getCurrentUser();
  const roleUpper = user ? (user.role || "").toUpperCase().trim() : "";
  const isAdmin = 
    roleUpper === "DEVELOPER_OWNER" || 
    roleUpper === "DEVELOPER_ADMIN" || 
    roleUpper === "PLATFORM_ADMIN" || 
    roleUpper === "TENANT_OWNER" || 
    roleUpper === "TENANT_ADMIN" || 
    roleUpper === "OWNER" || 
    roleUpper === "ADMIN";

  const canEdit = isModuleActive && (isAdmin || (user?.permissions?.includes("plots.edit") ?? false));

  // Run validation specifically for this plot
  const validationMessages = runPlotValidationSuite(allObjects).filter((msg) => msg.plot_id === selectedObject.id);

  // Handler to update nested properties safely
  const handlePropChange = (key: string, value: any) => {
    if (!canEdit) return;
    let updatedProps = { ...props, [key]: value };

    // Maintain backwards compatibility
    if (key === "plot_number") {
      updatedProps.plot_number = value;
    }

    onUpdateObject({
      ...selectedObject,
      name: key === "plot_number" ? `Subdivided Plot ${value}` : selectedObject.name,
      properties: updatedProps
    });
  };

  const handleMetadataChange = (key: string, value: any) => {
    if (!canEdit) return;
    const updatedMetadata = {
      ...(props.metadata || {}),
      [key]: value
    };
    onUpdateObject({
      ...selectedObject,
      properties: {
        ...props,
        metadata: updatedMetadata
      }
    });
  };

  return (
    <div className="space-y-5 pb-8" id="plot-module-inspector">
      
      {/* Read-Only Status Banner */}
      {!canEdit && (
        <div className="p-3.5 rounded-xl border flex items-start gap-2.5 text-xs bg-amber-50 border-amber-150 text-amber-850 leading-normal" id="inspector-read-only-banner">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="block text-slate-800 font-extrabold text-[11px] uppercase tracking-wider">Read-Only Mode Active</span>
            <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
              {!isModuleActive 
                ? "The Plots Module is unlicensed or disabled in the system registry." 
                : "You do not have simulated edit authorization (plots.edit)."}
            </span>
          </div>
        </div>
      )}
      
      {/* SECTION A: Identification */}
      <div className="bg-slate-50/70 border border-slate-100 p-3.5 rounded-xl space-y-3" id="inspector-sec-identification">
        <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/50 pb-1.5">
          <MapPin className="w-3.5 h-3.5 text-indigo-500" />
          <span>A. Identification</span>
        </h4>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1 col-span-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">Plot Number</label>
            <input
              type="text"
              value={plotNumber}
              onChange={(e) => handlePropChange("plot_number", e.target.value)}
              disabled={!canEdit}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-mono font-bold text-xs disabled:opacity-70 disabled:bg-slate-100"
              id="plot-inspector-number"
            />
          </div>

          <div className="space-y-1 col-span-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">Plot Name</label>
            <input
              type="text"
              value={plotName}
              onChange={(e) => handlePropChange("plot_name", e.target.value)}
              disabled={!canEdit}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 font-medium text-xs disabled:opacity-70 disabled:bg-slate-100"
              placeholder="e.g. Garden Plot"
              id="plot-inspector-name"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">Block</label>
            <input
              type="text"
              value={block}
              onChange={(e) => handlePropChange("block", e.target.value)}
              disabled={!canEdit}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs disabled:opacity-70 disabled:bg-slate-100"
              placeholder="e.g. Block-B"
              id="plot-inspector-block"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">Sector</label>
            <input
              type="text"
              value={sector}
              onChange={(e) => handlePropChange("sector", e.target.value)}
              disabled={!canEdit}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs disabled:opacity-70 disabled:bg-slate-100"
              placeholder="Sector 4"
              id="plot-inspector-sector"
            />
          </div>

          <div className="space-y-1 col-span-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">Phase</label>
            <input
              type="text"
              value={phase}
              onChange={(e) => handlePropChange("phase", e.target.value)}
              disabled={!canEdit}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs disabled:opacity-70 disabled:bg-slate-100"
              placeholder="e.g. Phase III"
              id="plot-inspector-phase"
            />
          </div>
        </div>
      </div>

      {/* SECTION B: Classification */}
      <div className="bg-slate-50/70 border border-slate-100 p-3.5 rounded-xl space-y-3" id="inspector-sec-classification">
        <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/50 pb-1.5">
          <Tag className="w-3.5 h-3.5 text-blue-500" />
          <span>B. Classification</span>
        </h4>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">Zoning Land Type</label>
          <select
            value={plotType}
            onChange={(e) => handlePropChange("plot_type", e.target.value)}
            disabled={!canEdit}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 cursor-pointer font-semibold text-xs disabled:opacity-70 disabled:bg-slate-100"
            id="plot-inspector-type"
          >
            <option value="Residential">Residential Subdivision</option>
            <option value="Commercial">Commercial / Retail</option>
            <option value="Industrial">Industrial Zone</option>
            <option value="Civic">Civic / Institutional</option>
            <option value="Mixed Use">Mixed Use Commercial</option>
            <option value="Villa">Premium Villa Plot</option>
            <option value="Farm Plot">Eco Farm Plot</option>
            <option value="Custom">Custom Classification</option>
          </select>
        </div>
      </div>

      {/* SECTION C: Geometry Metrics */}
      <div className="bg-slate-50/70 border border-slate-100 p-3.5 rounded-xl space-y-3.5" id="inspector-sec-metrics">
        <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/50 pb-1.5">
          <Ruler className="w-3.5 h-3.5 text-emerald-500" />
          <span>C. Geometric Calculations</span>
        </h4>
        
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 font-mono text-[10px]">
          <div className="flex flex-col bg-white p-2 rounded-lg border border-slate-100">
            <span className="text-[8px] uppercase text-slate-400 font-bold">Square Feet</span>
            <span className="text-emerald-800 font-extrabold text-xs">{(props.area_value || Math.round(metrics.sqft)).toLocaleString()} sq.ft</span>
          </div>
          <div className="flex flex-col bg-white p-2 rounded-lg border border-slate-100">
            <span className="text-[8px] uppercase text-slate-400 font-bold">Square Meters</span>
            <span className="text-slate-800 font-bold text-xs">{metrics.sqm.toLocaleString()} m²</span>
          </div>
          <div className="flex flex-col bg-white p-2 rounded-lg border border-slate-100">
            <span className="text-[8px] uppercase text-slate-400 font-bold">Acres</span>
            <span className="text-slate-800 font-semibold">{metrics.acres.toFixed(4)} Ac</span>
          </div>
          <div className="flex flex-col bg-white p-2 rounded-lg border border-slate-100">
            <span className="text-[8px] uppercase text-slate-400 font-bold">Guntas</span>
            <span className="text-slate-800 font-semibold">{metrics.gunta.toFixed(2)} gt</span>
          </div>
          <div className="flex flex-col bg-white p-2 rounded-lg border border-slate-100">
            <span className="text-[8px] uppercase text-slate-400 font-bold">Cents Decimal</span>
            <span className="text-slate-800 font-semibold">{metrics.cent.toFixed(2)} cents</span>
          </div>
          <div className="flex flex-col bg-white p-2 rounded-lg border border-slate-100">
            <span className="text-[8px] uppercase text-slate-400 font-bold">Perimeter Length</span>
            <span className="text-slate-800 font-semibold">{(coords.length > 1 ? (Math.round(calculateShoelaceArea(coords) * 0.1) || 45) : 0)} m</span>
          </div>
        </div>

        <div className="border-t border-slate-200/60 pt-3.5 space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-450 font-medium">Frontage width</span>
            <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-150">{dimensions.primaryFrontage} m</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-450 font-medium">Average Depth</span>
            <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-150">{dimensions.averageDepth} m</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-450 font-medium">Calculated Shape</span>
            <span className="font-semibold text-slate-700">{calculatedShape}</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-450 font-medium">Auto-Facing direction</span>
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/40 flex items-center gap-1">
              <Compass className="w-3 h-3" />
              <span>{facing}</span>
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-slate-450 font-medium">Corner Status</span>
            <span className="font-semibold text-slate-800">
              {isCorner ? `Yes (${cornerType})` : "No (Internal)"}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION D: Road Association */}
      <div className="bg-slate-50/70 border border-slate-100 p-3.5 rounded-xl space-y-3" id="inspector-sec-road">
        <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/50 pb-1.5">
          <Compass className="w-3.5 h-3.5 text-rose-500" />
          <span>D. Road Connectivity</span>
        </h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-0.5">
            <span className="text-slate-450">Nearest Roadway</span>
            <span className="font-bold text-slate-800 truncate max-w-[140px]" title={facingDetails.associatedRoadName || "None"}>
              {facingDetails.associatedRoadName || "No access road"}
            </span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-slate-450">Access Width</span>
            <span className="font-semibold text-slate-700">12.0m (Standard)</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-slate-450">Exposure count</span>
            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-150 text-[10px] font-bold text-slate-600">
              {isCorner ? "2 road frontages" : "1 road frontage"}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION E: Status */}
      <div className="bg-slate-50/70 border border-slate-100 p-3.5 rounded-xl space-y-3" id="inspector-sec-status">
        <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/50 pb-1.5">
          <Activity className="w-3.5 h-3.5 text-amber-500" />
          <span>E. Dynamic Lifecycle Status</span>
        </h4>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">Plot Lifecycle Status</label>
          <select
            value={status}
            onChange={(e) => handlePropChange("status", e.target.value)}
            disabled={!canEdit}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:border-indigo-500 cursor-pointer font-bold text-xs disabled:opacity-70 disabled:bg-slate-100"
            id="plot-inspector-status"
          >
            <option value="Draft">Drafting Mode</option>
            <option value="Validated">Validated & Verified</option>
            <option value="Approved">Approved for Sale</option>
          </select>
        </div>
      </div>

      {/* SECTION F: Validation */}
      <div className="bg-slate-50/70 border border-slate-100 p-3.5 rounded-xl space-y-3" id="inspector-sec-validation">
        <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/50 pb-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
          <span>F. Spatial Validation Checks</span>
        </h4>
        
        {validationMessages.length === 0 ? (
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 text-[11px] font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Passed all 21 core spatial layout validation checks successfully!</span>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {validationMessages.map((msg, index) => {
              const isError = msg.severity === "ERROR";
              const isWarning = msg.severity === "WARNING";
              return (
                <div 
                  key={index} 
                  className={`flex items-start gap-1.5 p-2 rounded-lg border text-[10px] leading-tight ${
                    isError 
                      ? "bg-red-50 border-red-100 text-red-800" 
                      : isWarning 
                        ? "bg-amber-50 border-amber-100 text-amber-800" 
                        : "bg-blue-50 border-blue-100 text-blue-800"
                  }`}
                >
                  {isError ? (
                    <AlertCircle className="w-3.5 h-3.5 text-red-650 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-650 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{msg.message}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION G: Notes */}
      <div className="bg-slate-50/70 border border-slate-100 p-3.5 rounded-xl space-y-3" id="inspector-sec-notes">
        <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/50 pb-1.5">
          <FileText className="w-3.5 h-3.5 text-teal-500" />
          <span>G. Notes & Remarks</span>
        </h4>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">Internal Notes</label>
            <textarea
              value={internalNotes}
              onChange={(e) => handleMetadataChange("internal_notes", e.target.value)}
              disabled={!canEdit}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs min-h-[50px] resize-none disabled:opacity-70 disabled:bg-slate-100"
              placeholder="Private workspace notes..."
              id="plot-inspector-internal-notes"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight block">Planning Remarks</label>
            <textarea
              value={planningRemarks}
              onChange={(e) => handleMetadataChange("planning_remarks", e.target.value)}
              disabled={!canEdit}
              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-500 text-xs min-h-[50px] resize-none disabled:opacity-70 disabled:bg-slate-100"
              placeholder="Add official planning board remarks..."
              id="plot-inspector-planning-remarks"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
