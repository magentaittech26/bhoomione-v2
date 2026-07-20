import React, { useState, useEffect } from "react";
import { MockGeometry } from "./types.ts";
import { PLANNING_PROFILES, LegalComplianceNotice } from "../../modules/plots/settings/profiles.ts";
import { generatePlotRow } from "../../modules/plots/generation/row.ts";
import { generatePlotGrid } from "../../modules/plots/generation/grid.ts";
import { generateRenumberingPreview, NumberingOptions, formatPlotNumber } from "../../modules/plots/numbering/schemes.ts";
import { detectRoadFrontageInfo } from "../../modules/plots/generation/frontage.ts";
import { 
  Grid, 
  Route, 
  Sliders, 
  Settings, 
  ArrowRight, 
  Compass, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Play, 
  Ruler, 
  Sparkles, 
  RefreshCw, 
  X,
  BookOpen
} from "lucide-react";
import api from "../../lib/api.ts";
import { BhoomiModuleRegistry } from "../../modules/spatial-core/registry/index.ts";

interface PlotControlCenterProps {
  objects: MockGeometry[];
  onUpdateObjects: (updated: MockGeometry[]) => void;
  selectedLayoutId: string | null;
  onClose: () => void;
}

export default function PlotControlCenter({
  objects,
  onUpdateObjects,
  selectedLayoutId,
  onClose
}: PlotControlCenterProps) {
  const isQaSimulationEnabled = import.meta.env.VITE_ENABLE_QA_SIMULATION === "true";
  const [activeTab, setActiveTab] = useState<"row" | "grid" | "numbering" | "profiles" | "qa">("row");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info" | null; text: string }>({ type: null, text: "" });

  // ----------------------------------------------------
  // QA SIMULATION TAB STATE
  // ----------------------------------------------------
  const registry = BhoomiModuleRegistry.getInstance();
  const [entitled, setEntitled] = useState(registry.hasEntitlement("maps.plots"));
  const [enabled, setEnabled] = useState(registry.isModuleActive("mod-plots"));
  const [userRole, setUserRole] = useState("DEVELOPER_OWNER");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [roadsActive, setRoadsActive] = useState(registry.isModuleActive("mod-roads"));

  useEffect(() => {
    const user = api.getCurrentUser();
    if (user) {
      setUserRole(user.role || "DEVELOPER_OWNER");
      setUserPermissions(user.permissions || []);
    }
  }, []);

  const handleToggleEntitlement = (val: boolean) => {
    setEntitled(val);
    if (val) {
      registry.addEntitlement("maps.plots");
    } else {
      registry.removeEntitlement("maps.plots");
    }
    setStatusMessage({ type: "info", text: `SaaS License Entitlement for maps.plots is now ${val ? "ENABLED" : "DISABLED"}` });
  };

  const handleToggleModuleEnabled = (val: boolean) => {
    setEnabled(val);
    registry.setModuleEnabled("mod-plots", val);
    setStatusMessage({ type: "info", text: `Plots Module Active status is now ${val ? "ENABLED" : "DISABLED"}` });
  };

  const handleToggleRoadsActive = (val: boolean) => {
    setRoadsActive(val);
    registry.setModuleEnabled("mod-roads", val);
    setStatusMessage({ type: "info", text: `Roads Module Active status is now ${val ? "ENABLED" : "DISABLED"}` });
  };

  const handleRoleChange = (role: string) => {
    setUserRole(role);
    const user = api.getCurrentUser();
    if (user) {
      const updatedUser = { ...user, role };
      api.setCurrentUser(updatedUser);
      setStatusMessage({ type: "success", text: `User role simulated as ${role} successfully` });
    }
  };

  const handleTogglePermission = (perm: string) => {
    let updatedPerms = [...userPermissions];
    if (updatedPerms.includes(perm)) {
      updatedPerms = updatedPerms.filter(p => p !== perm);
    } else {
      updatedPerms.push(perm);
    }
    setUserPermissions(updatedPerms);
    const user = api.getCurrentUser();
    if (user) {
      const updatedUser = { ...user, permissions: updatedPerms };
      api.setCurrentUser(updatedUser);
    }
  };

  // ----------------------------------------------------
  // PLANNING PROFILES TAB STATE
  // ----------------------------------------------------
  const [activeProfileId, setActiveProfileId] = useState("generic");
  const profile = PLANNING_PROFILES[activeProfileId];

  // ----------------------------------------------------
  // ROW GENERATOR TAB STATE
  // ----------------------------------------------------
  const roads = objects.filter(o => o.layerName === "ROADS");
  const [selectedRoadId, setSelectedRoadId] = useState("");
  const [rowFrontage, setRowFrontage] = useState(9.0);
  const [rowDepth, setRowDepth] = useState(12.0);
  const [rowCount, setRowCount] = useState(8);
  const [rowGap, setRowGap] = useState(0.5);
  const [rowSide, setRowSide] = useState<"left" | "right">("left");
  const [rowCornerTreatment, setRowCornerTreatment] = useState<"none" | "larger-first" | "larger-last">("none");
  const [rowRemainderHandling, setRowRemainderHandling] = useState<"distribute" | "irregular-final" | "open-remainder" | "cancel">("distribute");
  const [rowStartingNum, setRowStartingNum] = useState(201);
  const [rowPreview, setRowPreview] = useState<any[] | null>(null);

  // Sync with profile values
  useEffect(() => {
    if (profile) {
      setRowFrontage(profile.defaultFrontage);
      setRowDepth(profile.defaultDepth);
    }
  }, [activeProfileId]);

  // ----------------------------------------------------
  // GRID GENERATOR TAB STATE
  // ----------------------------------------------------
  const [gridWidth, setGridWidth] = useState(10.0);
  const [gridDepth, setGridDepth] = useState(15.0);
  const [gridRowSpacing, setGridRowSpacing] = useState(6.0);
  const [gridColSpacing, setGridColSpacing] = useState(0.5);
  const [gridRotation, setGridRotation] = useState(0);
  const [gridFacing, setGridFacing] = useState<"N" | "E" | "S" | "W">("E");
  const [gridStartingNum, setGridStartingNum] = useState(501);
  const [gridPreview, setGridPreview] = useState<any[] | null>(null);

  // ----------------------------------------------------
  // RE-NUMBERING TAB STATE
  // ----------------------------------------------------
  const [numStart, setNumStart] = useState(101);
  const [numPadding, setNumPadding] = useState(3);
  const [numPrefix, setNumPrefix] = useState("");
  const [numBlock, setNumBlock] = useState("");
  const [numPhase, setNumPhase] = useState("");
  const [numSector, setNumSector] = useState("");
  const [numSortScheme, setNumSortScheme] = useState<any>("row-wise");
  const [numPreview, setNumPreview] = useState<any[] | null>(null);

  // ----------------------------------------------------
  // GENERATION RUNNERS
  // ----------------------------------------------------
  const handleGenerateRowPreview = () => {
    const roadObj = roads.find(r => r.id === selectedRoadId);
    if (!roadObj) {
      setStatusMessage({ type: "error", text: "Please select a valid road alignment from the layout workspace." });
      return;
    }

    const roadCoords = roadObj.geometry_data?.coordinates as Array<[number, number]>;
    if (!roadCoords || roadCoords.length < 2) {
      setStatusMessage({ type: "error", text: "The selected road alignment has no valid polyline coordinates." });
      return;
    }

    const startPoint = roadCoords[0];
    const endPoint = roadCoords[roadCoords.length - 1];

    try {
      const generated = generatePlotRow({
        roadId: selectedRoadId,
        startPoint,
        endPoint,
        standardFrontage: rowFrontage,
        standardDepth: rowDepth,
        plotCount: rowCount,
        gap: rowGap,
        startingNumber: rowStartingNum,
        numberingDirection: "asc",
        sideOfRoad: rowSide,
        cornerTreatment: rowCornerTreatment,
        remainderHandling: rowRemainderHandling
      }, roadObj, rowStartingNum);

      if (generated.length === 0) {
        setStatusMessage({ type: "error", text: "Generation yielded 0 plots. Verify segment length and parameters." });
        return;
      }

      setRowPreview(generated);
      setStatusMessage({ type: "info", text: `Previewing ${generated.length} plots. Click Commit to append to canvas.` });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An error occurred during row generation." });
    }
  };

  const handleCommitRow = () => {
    if (!rowPreview || rowPreview.length === 0) return;

    const newPlots: MockGeometry[] = rowPreview.map((p, idx) => {
      const id = `obj-plot-row-${Date.now()}-${idx}`;
      return {
        id,
        layer_id: "l-plots",
        layout_id: selectedLayoutId || "lay-1",
        layerName: "PLOTS",
        name: `Subdivided Plot ${p.properties.plot_number}`,
        object_type: "POLYGON",
        geometry_data: {
          coordinates: p.coords
        },
        style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 },
        properties: p.properties,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    onUpdateObjects([...objects, ...newPlots]);
    setStatusMessage({ type: "success", text: `Successfully generated and committed ${newPlots.length} road-frontage plots!` });
    setRowPreview(null);
  };

  const handleGenerateGridPreview = () => {
    const boundary = objects.find(o => o.layerName === "BOUNDARY");
    if (!boundary) {
      setStatusMessage({ type: "error", text: "A Site Boundary layer limit is required as the target containment zone." });
      return;
    }

    const boundaryCoords = boundary.geometry_data?.coordinates as Array<[number, number]>;
    if (!boundaryCoords || boundaryCoords.length < 3) {
      setStatusMessage({ type: "error", text: "Site Boundary limit lacks valid closed polygon coords." });
      return;
    }

    try {
      const generated = generatePlotGrid({
        targetPolygon: boundaryCoords,
        plotWidth: gridWidth,
        plotDepth: gridDepth,
        rowSpacing: gridRowSpacing,
        columnSpacing: gridColSpacing,
        rotation: gridRotation,
        roadFacingDirection: gridFacing,
        numberingScheme: "numeric",
        minRemainderArea: 50
      }, objects, gridStartingNum);

      if (generated.length === 0) {
        setStatusMessage({ type: "error", text: "Grid layout yielded 0 valid containment plots. Adjust rotation, sizes, or avoid roads/parks." });
        return;
      }

      setGridPreview(generated);
      setStatusMessage({ type: "info", text: `Grid engine fit ${generated.length} plots inside boundary. Click Commit to save.` });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Grid generation failed." });
    }
  };

  const handleCommitGrid = () => {
    if (!gridPreview || gridPreview.length === 0) return;

    const newPlots: MockGeometry[] = gridPreview.map((p, idx) => {
      const id = `obj-plot-grid-${Date.now()}-${idx}`;
      return {
        id,
        layer_id: "l-plots",
        layout_id: selectedLayoutId || "lay-1",
        layerName: "PLOTS",
        name: `Subdivided Plot ${p.properties.plot_number}`,
        object_type: "POLYGON",
        geometry_data: {
          coordinates: p.coords
        },
        style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 },
        properties: p.properties,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    onUpdateObjects([...objects, ...newPlots]);
    setStatusMessage({ type: "success", text: `Grid Layout Committed! Placed ${newPlots.length} subdivided plots.` });
    setGridPreview(null);
  };

  const handleGenerateNumberingPreview = () => {
    const plots = objects.filter(o => o.layerName === "PLOTS");
    if (plots.length === 0) {
      setStatusMessage({ type: "error", text: "No active subdivided plots found on the workspace layout to renumber." });
      return;
    }

    const opts: NumberingOptions = {
      startingNumber: numStart,
      padding: numPadding,
      prefix: numPrefix || undefined,
      block: numBlock || undefined,
      phase: numPhase || undefined,
      sector: numSector || undefined,
      sequenceType: "complex",
      sortingScheme: numSortScheme
    };

    const preview = generateRenumberingPreview(plots, opts);
    setNumPreview(preview);
    setStatusMessage({ type: "info", text: `Previewed sequence sorting: ${numSortScheme.toUpperCase()}. Review and click Commit to overwrite.` });
  };

  const handleCommitNumbering = () => {
    if (!numPreview || numPreview.length === 0) return;

    const updated = objects.map(obj => {
      if (obj.layerName !== "PLOTS") return obj;
      const previewItem = numPreview.find(p => p.id === obj.id);
      if (!previewItem) return obj;

      return {
        ...obj,
        name: `Subdivided Plot ${previewItem.proposedNumber}`,
        properties: {
          ...(obj.properties || {}),
          plot_number: previewItem.proposedNumber
        }
      };
    });

    onUpdateObjects(updated);
    setStatusMessage({ type: "success", text: "Subdivision plot re-numbering sequence applied and committed!" });
    setNumPreview(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 font-sans select-none" id="plot-subdivision-center-modal">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full h-[600px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Plot Generation & Intelligence Module</h3>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider font-mono">BhoomiOne V3 Subdivisions &bull; ACTIVE</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* WORKSPACE MIDDLE BODY */}
        <div className="flex-1 flex min-h-0">
          
          {/* LEFT TAB DIRECTORY */}
          <div className="w-52 border-r border-slate-100 bg-slate-50/50 p-4 flex flex-col gap-1.5 shrink-0">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-2 block px-2">Subdivision Tools</span>
            
            <button
              onClick={() => { setActiveTab("row"); setStatusMessage({ type: null, text: "" }); }}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "row" ? "bg-white text-indigo-750 shadow-sm border border-slate-200" : "text-slate-650 hover:bg-slate-100"
              }`}
            >
              <Route className="w-4 h-4 text-indigo-600" />
              <span>Row alignment</span>
            </button>

            <button
              onClick={() => { setActiveTab("grid"); setStatusMessage({ type: null, text: "" }); }}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "grid" ? "bg-white text-indigo-750 shadow-sm border border-slate-200" : "text-slate-650 hover:bg-slate-100"
              }`}
            >
              <Grid className="w-4 h-4 text-emerald-600" />
              <span>Grid Subdivision</span>
            </button>

            <button
              onClick={() => { setActiveTab("numbering"); setStatusMessage({ type: null, text: "" }); }}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "numbering" ? "bg-white text-indigo-750 shadow-sm border border-slate-200" : "text-slate-650 hover:bg-slate-100"
              }`}
            >
              <RefreshCw className="w-4 h-4 text-purple-600 animate-spin-slow" />
              <span>Sequencer</span>
            </button>

            <div className="border-t border-slate-200/80 my-2 pt-2" />
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-2 block px-2">Regulatory Norms</span>

            <button
              onClick={() => { setActiveTab("profiles"); setStatusMessage({ type: null, text: "" }); }}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "profiles" ? "bg-white text-indigo-750 shadow-sm border border-slate-200" : "text-slate-650 hover:bg-slate-100"
              }`}
            >
              <BookOpen className="w-4 h-4 text-rose-500" />
              <span>Planning Profiles</span>
            </button>

            {isQaSimulationEnabled && (
              <>
                <div className="border-t border-slate-200/80 my-2 pt-2" />
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-2 block px-2">Verification</span>

                <button
                  onClick={() => { setActiveTab("qa"); setStatusMessage({ type: null, text: "" }); }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "qa" ? "bg-white text-indigo-750 shadow-sm border border-slate-200" : "text-slate-650 hover:bg-slate-100"
                  }`}
                  id="tab-qa-simulation"
                >
                  <Sliders className="w-4 h-4 text-orange-500" />
                  <span>QA Simulation Panel</span>
                </button>
              </>
            )}
          </div>

          {/* ACTIVE CONTENT VIEWPORT */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* STATUS MESSAGES RENDER */}
              {statusMessage.type && (
                <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2.5 leading-tight ${
                  statusMessage.type === "error" 
                    ? "bg-red-50 border-red-100 text-red-800" 
                    : statusMessage.type === "success" 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                      : "bg-indigo-50 border-indigo-100 text-indigo-800"
                }`}>
                  {statusMessage.type === "error" ? (
                    <AlertTriangle className="w-4 h-4 text-red-650 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* TAB 1: ROW ALIGNMENT GENERATOR */}
              {activeTab === "row" && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 tracking-tight">Generate plots sequentially along a selected road edge alignment.</h4>
                    <p className="text-[10px] text-slate-450 mt-0.5">Calculates precise perpendicular layout depths along the alignment boundary vectors.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Alignment Roadway</label>
                      <select
                        value={selectedRoadId}
                        onChange={(e) => setSelectedRoadId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-semibold cursor-pointer text-xs"
                      >
                        <option value="">Select a Road from workspace...</option>
                        {roads.map(r => (
                          <option key={r.id} value={r.id}>{r.properties?.road_name || r.name || "Access Road"}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Align Roadway Side</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-150 p-0.5 rounded-lg">
                        <button
                          onClick={() => setRowSide("left")}
                          className={`py-1 text-center font-bold text-[10px] uppercase rounded-md cursor-pointer ${rowSide === "left" ? "bg-white text-indigo-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                        >
                          Left Side
                        </button>
                        <button
                          onClick={() => setRowSide("right")}
                          className={`py-1 text-center font-bold text-[10px] uppercase rounded-md cursor-pointer ${rowSide === "right" ? "bg-white text-indigo-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                        >
                          Right Side
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plot Frontage (Meters: {rowFrontage}m)</label>
                      <input
                        type="range"
                        min="4"
                        max="30"
                        step="0.5"
                        value={rowFrontage}
                        onChange={(e) => setRowFrontage(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plot Depth (Meters: {rowDepth}m)</label>
                      <input
                        type="range"
                        min="6"
                        max="40"
                        step="0.5"
                        value={rowDepth}
                        onChange={(e) => setRowDepth(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sequence Plot Count ({rowCount} Plots)</label>
                      <input
                        type="range"
                        min="2"
                        max="30"
                        value={rowCount}
                        onChange={(e) => setRowCount(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Buffer Spacing Gap ({rowGap}m)</label>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={rowGap}
                        onChange={(e) => setRowGap(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remainder Area Handling</label>
                      <select
                        value={rowRemainderHandling}
                        onChange={(e) => setRowRemainderHandling(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 cursor-pointer text-xs font-semibold"
                      >
                        <option value="distribute">Distribute evenly among plots</option>
                        <option value="irregular-final">Irregular residual final plot</option>
                        <option value="open-remainder">Leave as open green space buffer</option>
                        <option value="cancel">Cancel if frontage exceeds road length</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Corner Lot Special Depth Treatment</label>
                      <select
                        value={rowCornerTreatment}
                        onChange={(e) => setRowCornerTreatment(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 cursor-pointer text-xs font-semibold"
                      >
                        <option value="none">No special adjustment (Standard Rectangle)</option>
                        <option value="larger-first">Make First plot larger (+25% depth)</option>
                        <option value="larger-last">Make Last plot larger (+25% depth)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sequence Start Index Number</label>
                      <input
                        type="number"
                        value={rowStartingNum}
                        onChange={(e) => setRowStartingNum(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  {rowPreview && (
                    <div className="border border-indigo-100 bg-indigo-50/20 rounded-xl p-3 text-xs flex justify-between items-center animate-fadeIn">
                      <div>
                        <span className="font-extrabold text-indigo-900 block">Row Alignment Grid Preview Rendered!</span>
                        <span className="text-[10px] text-slate-450">Generated {rowPreview.length} plots with sequence starting at #{rowStartingNum}.</span>
                      </div>
                      <button
                        onClick={handleCommitRow}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3.5 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Commit to Canvas Layer</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: GRID AREA SUBDIVISION */}
              {activeTab === "grid" && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 tracking-tight">Mass Grid Area Subdivision Generator</h4>
                    <p className="text-[10px] text-slate-450 mt-0.5">Places a grid of plots inside the Site Boundary layer, automatically avoiding road intersections and parks.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grid Plot Width (Meters: {gridWidth}m)</label>
                      <input
                        type="range"
                        min="5"
                        max="40"
                        step="0.5"
                        value={gridWidth}
                        onChange={(e) => setGridWidth(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grid Plot Depth (Meters: {gridDepth}m)</label>
                      <input
                        type="range"
                        min="5"
                        max="40"
                        step="0.5"
                        value={gridDepth}
                        onChange={(e) => setGridDepth(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grid Row Spacing (Meters: {gridRowSpacing}m)</label>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        step="0.5"
                        value={gridRowSpacing}
                        onChange={(e) => setGridRowSpacing(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grid Column Spacing (Meters: {gridColSpacing}m)</label>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={gridColSpacing}
                        onChange={(e) => setGridColSpacing(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subdivision Rotation (Degrees: {gridRotation}°)</label>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={gridRotation}
                        onChange={(e) => setGridRotation(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Default Road Facing Direction</label>
                      <select
                        value={gridFacing}
                        onChange={(e) => setGridFacing(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 cursor-pointer text-xs font-semibold"
                      >
                        <option value="E">East Facing</option>
                        <option value="W">West Facing</option>
                        <option value="N">North Facing</option>
                        <option value="S">South Facing</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Starting Number Sequence</label>
                      <input
                        type="number"
                        value={gridStartingNum}
                        onChange={(e) => setGridStartingNum(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  {gridPreview && (
                    <div className="border border-emerald-100 bg-emerald-50/20 rounded-xl p-3 text-xs flex justify-between items-center animate-fadeIn">
                      <div>
                        <span className="font-extrabold text-emerald-900 block">Subdivision Grid Generated Successfully!</span>
                        <span className="text-[10px] text-slate-455">Found {gridPreview.length} valid layout lots that fit safely inside perimeter bounds.</span>
                      </div>
                      <button
                        onClick={handleCommitGrid}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3.5 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Commit Layout Grid</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SEQUENTIAL NUMBERING */}
              {activeTab === "numbering" && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 tracking-tight">Advanced Sequential Re-Numbering Sequencer</h4>
                    <p className="text-[10px] text-slate-450 mt-0.5 font-sans">Sorts plots by logical geometric layouts (Row-wise, Serpentine, Clockwise, Road-wise) and applies sequential custom prefix codes.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sequence Order Sorting Algorithm</label>
                      <select
                        value={numSortScheme}
                        onChange={(e) => setNumSortScheme(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 cursor-pointer text-xs font-semibold"
                      >
                        <option value="row-wise">Row-wise (top-to-bottom, left-to-right)</option>
                        <option value="serpentine">Serpentine (alternating directions left/right)</option>
                        <option value="clockwise">Clockwise radial sorting</option>
                        <option value="counter-clockwise">Counter-Clockwise radial sorting</option>
                        <option value="road-wise">Road-wise (closest to road entry segment)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Numeric Padding (Digits)</label>
                      <select
                        value={numPadding}
                        onChange={(e) => setNumPadding(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 cursor-pointer text-xs font-semibold"
                      >
                        <option value="0">No Padding (e.g. 1, 2, 3)</option>
                        <option value="2">2 Digits (e.g. 01, 02)</option>
                        <option value="3">3 Digits (e.g. 001, 002)</option>
                        <option value="4">4 Digits (e.g. 0001, 0002)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Starting Sequence Code Number</label>
                      <input
                        type="number"
                        value={numStart}
                        onChange={(e) => setNumStart(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phase Tag Prefix</label>
                      <input
                        type="text"
                        value={numPhase}
                        onChange={(e) => setNumPhase(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs font-medium"
                        placeholder="e.g. PH1-"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sector Tag Prefix</label>
                      <input
                        type="text"
                        value={numSector}
                        onChange={(e) => setNumSector(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs font-medium"
                        placeholder="e.g. SEC-A-"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Block Tag Prefix</label>
                      <input
                        type="text"
                        value={numBlock}
                        onChange={(e) => setNumBlock(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 text-xs font-medium"
                        placeholder="e.g. B2-"
                      />
                    </div>
                  </div>

                  {numPreview && (
                    <div className="space-y-3 border border-purple-100 bg-purple-50/10 rounded-xl p-3 animate-fadeIn">
                      <div className="flex justify-between items-center border-b border-purple-100/50 pb-1.5">
                        <span className="font-extrabold text-purple-900 text-xs">Numbering Sequence Preview Ledger</span>
                        <button
                          onClick={handleCommitNumbering}
                          className="bg-purple-600 hover:bg-purple-750 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                        >
                          Over-write & Commit Sequence
                        </button>
                      </div>

                      <div className="max-h-[140px] overflow-y-auto divide-y divide-slate-100 pr-1 text-[11px] font-mono">
                        {numPreview.map((item, i) => (
                          <div key={i} className="flex justify-between py-1 text-slate-700">
                            <span>{item.currentNumber}</span>
                            <div className="flex items-center gap-1.5 font-bold">
                              <span>&rarr;</span>
                              <span className="text-purple-750 font-extrabold">{item.proposedNumber}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PLANNING PROFILES SETTINGS */}
              {activeTab === "profiles" && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 tracking-tight">Active Planning Profile Standards</h4>
                    <p className="text-[10px] text-slate-450 mt-0.5">Enforces regulatory legal minimum sizes, aspect ratios, and setbacks on active layouts validation.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Authority Profile</label>
                      <select
                        value={activeProfileId}
                        onChange={(e) => {
                          setActiveProfileId(e.target.value);
                          setStatusMessage({ type: "info", text: `Loaded regulatory standards for ${PLANNING_PROFILES[e.target.value].name}.` });
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-850 cursor-pointer text-xs font-extrabold"
                      >
                        {Object.values(PLANNING_PROFILES).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 text-xs font-medium">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Minimum Dimensions standards</span>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-450">Minimum Area</span>
                          <span className="font-mono font-bold text-slate-800">{profile.minArea} sqm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-450">Minimum Frontage</span>
                          <span className="font-mono font-bold text-slate-800">{profile.minFrontage} m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-450">Minimum Depth</span>
                          <span className="font-mono font-bold text-slate-800">{profile.minDepth} m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-450">Maximum Aspect Ratio</span>
                          <span className="font-mono font-bold text-slate-800">{profile.maxAspectRatio}:1</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex flex-col justify-between">
                      <div className="space-y-1 text-xs">
                        <span className="text-[9px] uppercase font-bold text-amber-800 tracking-wider flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Regulatory Notice</span>
                        </span>
                        <p className="text-[10px] text-amber-900 leading-normal font-sans font-medium">
                          {profile.legalNotice}
                        </p>
                      </div>
                      <span className="text-[8px] text-slate-400 block mt-2 font-mono">BHOOMI-RUL-PRO-V3</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: QA SIMULATION & VERIFICATION PANEL */}
              {activeTab === "qa" && isQaSimulationEnabled && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 tracking-tight">Interactive QA &amp; Integration Simulation Control</h4>
                    <p className="text-[10px] text-slate-450 mt-0.5">Toggle live license entitlements, system module active states, user RBAC roles, and fine-grained permissions to audit graceful degradation.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* SaaS & Module Registry Status */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block border-b border-slate-200/50 pb-1.5">SaaS &amp; Module Configuration</span>
                      
                      <div className="space-y-3 text-xs font-medium">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-slate-800 font-semibold block">maps.plots Entitlement</span>
                            <span className="text-[9px] text-slate-400">License flag on subscription tier</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={entitled}
                            onChange={(e) => handleToggleEntitlement(e.target.checked)}
                            className="w-4 h-4 text-indigo-650 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                            id="qa-toggle-entitlement"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-slate-800 font-semibold block">mod-plots Registry State</span>
                            <span className="text-[9px] text-slate-400">Enable/Disable Plots Module globally</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => handleToggleModuleEnabled(e.target.checked)}
                            className="w-4 h-4 text-indigo-650 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                            id="qa-toggle-enabled"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-slate-800 font-semibold block">mod-roads Dependency State</span>
                            <span className="text-[9px] text-slate-400">Enable/Disable Roads layer module dependency</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={roadsActive}
                            onChange={(e) => handleToggleRoadsActive(e.target.checked)}
                            className="w-4 h-4 text-indigo-650 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                            id="qa-toggle-roads"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Role & Core Permission Sets */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block border-b border-slate-200/50 pb-1.5">User Identity &amp; RBAC Roles</span>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-450 font-bold block">Simulate Role</label>
                          <select
                            value={userRole}
                            onChange={(e) => handleRoleChange(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-850 cursor-pointer text-xs font-bold"
                            id="qa-select-role"
                          >
                            <option value="DEVELOPER_OWNER">DEVELOPER_OWNER (Full Admin Access)</option>
                            <option value="PROJECT_MANAGER">PROJECT_MANAGER (Planner/Writer Access)</option>
                            <option value="AGENT_BROKER">AGENT_BROKER (Read-only Viewer)</option>
                            <option value="GUEST_USER">GUEST_USER (No Authorization)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-450 font-bold block">Simulated Permission Matrix</label>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-650">
                            {[
                              "plots.view", "plots.create", "plots.edit", "plots.delete",
                              "plots.generate", "plots.split", "plots.merge", "plots.renumber",
                              "plots.validate", "plots.approve", "plots.export"
                            ].map(perm => (
                              <label key={perm} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={userPermissions.includes(perm)}
                                  onChange={() => handleTogglePermission(perm)}
                                  className="w-3 h-3 text-indigo-650 rounded border-slate-300 focus:ring-indigo-500"
                                />
                                <span className="truncate">{perm}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assertion Matrix Reference */}
                  <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-3.5 space-y-2">
                    <span className="text-[9px] uppercase font-extrabold text-orange-850 tracking-wider block">Expected Integration Assertions</span>
                    <ul className="text-[10px] font-semibold text-orange-900 leading-normal list-disc pl-4 space-y-1">
                      <li><strong>Unlicensed / Disabled Modules</strong> must hide plot drawing tools, bypass hotkeys, and disable active validators immediately.</li>
                      <li><strong>Insufficient Permissions</strong> blocks generate actions, split/merge tools, and shows read-only inspector states.</li>
                      <li><strong>Disabled Dependencies</strong> forces the Plot Module to gracefully fall back without causing runtime script exceptions.</li>
                    </ul>
                  </div>
                </div>
              )}

            </div>

            {/* LOWER ACTIONS BAR */}
            <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-6">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">SaaS Plot Engine v3.0 &bull; SPRINT 6</span>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                {activeTab === "row" && (
                  <button
                    onClick={handleGenerateRowPreview}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Generate Row Preview</span>
                  </button>
                )}
                {activeTab === "grid" && (
                  <button
                    onClick={handleGenerateGridPreview}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Generate Grid Layout</span>
                  </button>
                )}
                {activeTab === "numbering" && (
                  <button
                    onClick={handleGenerateNumberingPreview}
                    className="bg-purple-600 hover:bg-purple-750 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Sort Sequencer</span>
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
