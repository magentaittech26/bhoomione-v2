import React, { useState, useEffect, useRef } from "react";
import api from "../lib/api.ts";
import { UserProfile } from "../types/auth.ts";
import {
  Layers,
  Search,
  Maximize,
  SlidersHorizontal,
  MapPin,
  Compass,
  Square,
  ChevronRight,
  Info,
  X,
  FileCode2,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Building2,
  Play
} from "lucide-react";

interface InteractiveLayoutViewerProps {
  user: UserProfile;
  initialLayoutId?: string | null;
  onAuditLogged?: (log: any) => void;
  highlightedPlotId?: string | null;
  onPlotSelected?: (plot: any) => void;
}

const defaultStyleProfiles: Record<string, any> = {
  PLOT_AVAILABLE: { fill_color: "#F1F5F9", stroke_color: "#64748B", stroke_width: 1.5, opacity: 0.9 },
  PLOT_RESERVED: { fill_color: "#FEF3C7", stroke_color: "#D97706", stroke_width: 1.5, opacity: 0.95 },
  PLOT_BOOKED: { fill_color: "#DBEAFE", stroke_color: "#2563EB", stroke_width: 1.5, opacity: 0.95 },
  PLOT_SOLD: { fill_color: "#D1FAE5", stroke_color: "#059669", stroke_width: 1.5, opacity: 0.95 },
  ROAD_MAIN: { fill_color: "#E2E8F0", stroke_color: "#94A3B8", stroke_width: 2.0, opacity: 1.0 },
  ROAD_INTERNAL: { fill_color: "#F8FAFC", stroke_color: "#CBD5E1", stroke_width: 1.0, opacity: 1.0 },
  PARK: { fill_color: "#DCFCE7", stroke_color: "#16A34A", stroke_width: 1.5, opacity: 0.9 },
  AMENITY: { fill_color: "#F3E8FF", stroke_color: "#7C3AED", stroke_width: 1.5, opacity: 0.9 }
};

export default function InteractiveLayoutViewer({
  user,
  initialLayoutId,
  onAuditLogged,
  highlightedPlotId: externalHighlightedPlotId,
  onPlotSelected
}: InteractiveLayoutViewerProps) {
  // Navigation & Data Selection states
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [layoutsList, setLayoutsList] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>("");
  
  // Compiled SVG Document state
  const [currentDoc, setCurrentDoc] = useState<any | null>(null);
  const [styleProfiles, setStyleProfiles] = useState<Record<string, any>>(defaultStyleProfiles);
  const [plotsMap, setPlotsMap] = useState<Record<string, any>>({});
  const [plotsList, setPlotsList] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  
  // Interactive UI states
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    PLOTS: true,
    ROADS: true,
    AMENITIES: true,
    BOUNDARIES: true,
    UTILITIES: true,
    LABELS: true
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlot, setSelectedPlot] = useState<any | null>(null);
  const [highlightedPlotId, setHighlightedPlotId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [compileLoading, setCompileLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [viewportMode, setViewportMode] = useState<"DESKTOP" | "TABLET" | "MOBILE">("DESKTOP");

  // Sync external highlightedPlotId prop
  useEffect(() => {
    if (externalHighlightedPlotId) {
      setHighlightedPlotId(externalHighlightedPlotId);
      const found = plotsList.find(p => p.id === externalHighlightedPlotId);
      if (found) {
        setSelectedPlot(found);
      }
    }
  }, [externalHighlightedPlotId, plotsList]);
  
  // Measurement unit helper
  const getUnitCode = (unitId: string) => {
    const matched = units.find(u => u.id === unitId);
    return matched ? matched.code : "SQFT";
  };

  const dispatchAuditLog = (action: string, model: string, modelId: string, summary: string) => {
    if (onAuditLogged) {
      onAuditLogged({
        id: `AuditViewer-${Date.now()}`,
        action,
        entity_name: model,
        entity_id: modelId,
        details: summary,
        created_at: new Date().toISOString()
      });
    }
  };

  // 1. Initial State bootstrapping
  useEffect(() => {
    async function loadMasterData() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const [prjRes, layRes, unitRes] = await Promise.all([
          api.fetchProjects({ per_page: 1000 }),
          api.fetchLayouts({ per_page: 1000 }),
          api.fetchMeasurementUnits()
        ]);
        
        setProjectsList(prjRes.data || []);
        setLayoutsList(layRes.data || []);
        setUnits(unitRes || []);
        
        if (initialLayoutId) {
          const matchedLay = (layRes.data || []).find((l: any) => l.id === initialLayoutId);
          if (matchedLay) {
            setSelectedProjectId(matchedLay.project_id);
            setSelectedLayoutId(initialLayoutId);
          }
        } else if (prjRes.data && prjRes.data.length > 0) {
          setSelectedProjectId(prjRes.data[0].id);
          const relatedLays = (layRes.data || []).filter((l: any) => l.project_id === prjRes.data[0].id);
          if (relatedLays.length > 0) {
            setSelectedLayoutId(relatedLays[0].id);
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to load master projects metadata.");
      } finally {
        setLoading(false);
      }
    }
    loadMasterData();
  }, [initialLayoutId]);

  // Sync related layouts when project dropdown switches
  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId);
    const related = layoutsList.filter((l) => l.project_id === projId);
    if (related.length > 0) {
      setSelectedLayoutId(related[0].id);
    } else {
      setSelectedLayoutId("");
    }
    setCurrentDoc(null);
    setSelectedPlot(null);
    setHighlightedPlotId(null);
    setDrawerOpen(false);
  };

  // Fetch the selected layout vector representation
  const loadLayoutVectorData = async (layoutId: string, profile: "DESKTOP" | "TABLET" | "MOBILE") => {
    if (!layoutId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      // Step A: fetch all plots of layout to match coordinates to metadata
      const plotRes = await api.fetchPlots({ per_page: 1000, layout_id: layoutId });
      const plotsData = plotRes.data || [];
      setPlotsList(plotsData);
      
      const pMap: Record<string, any> = {};
      plotsData.forEach((p: any) => {
        if (p.source_geometry_entity_id) {
          pMap[p.source_geometry_entity_id] = p;
        }
      });
      setPlotsMap(pMap);
      
      // Step B: Fetch the compiled SVG doc representation if exists
      const docRes = await api.fetchSvgDocument(layoutId);
      if (docRes && docRes.success && docRes.data) {
        const doc = docRes.data;
        setCurrentDoc(doc);
        
        // Build style profiles dictionary
        const profiles: Record<string, any> = { ...defaultStyleProfiles };
        if (doc.style_profiles && doc.style_profiles.length > 0) {
          doc.style_profiles.forEach((p: any) => {
            profiles[p.profile_key] = p;
          });
        }
        setStyleProfiles(profiles);
        dispatchAuditLog("LAY_VIEW_LOADED", "layouts", layoutId, `Visualized active SVG layout for Layout Node: ${layoutId} (${doc.render_profile} v${doc.version})`);
      } else {
        setCurrentDoc(null);
      }
    } catch (err: any) {
      // It is normal if SVG doc does not exist yet; we can show option to compile it.
      setCurrentDoc(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLayoutId) {
      loadLayoutVectorData(selectedLayoutId, viewportMode);
    }
  }, [selectedLayoutId, viewportMode]);

  // Request high-fidelity vector compilation via backend execution batch loop
  const triggerCompilation = async () => {
    if (!selectedLayoutId) return;
    setCompileLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      // Find latest DXF generation batch or import job that allows SVG compile
      // In compliance with backend controllers, we fetch activeDXF jobs
      const jobs = await api.fetchDxfJobs();
      if (!jobs || jobs.length === 0) {
        throw new Error("No processed CAD imports exist. Import a valid DXF file prior to compilation.");
      }
      
      // Let's search if any job belongs to this layout or project
      let targetJob = jobs[0];
      // Compile command parameters: compiles layout vector dynamically
      // To guarantee compile works, let's use the layout's generation batch id if we can find it
      // Let's look for a generation batch of the imported plot
      let batchId = targetJob.generation_batch_id || targetJob.id;
      if (plotsList.length > 0 && plotsList[0].generation_batch_id) {
        batchId = plotsList[0].generation_batch_id;
      }
      
      const compileRes = await api.compileSvgDocument(batchId, viewportMode);
      if (compileRes && compileRes.success) {
        setSuccessMessage(`Prism vector layout Compiled successfully! Version v${compileRes.data.version} produced.`);
        await loadLayoutVectorData(selectedLayoutId, viewportMode);
        dispatchAuditLog("LAY_COMPILE", "layouts", selectedLayoutId, `Triggered CAD-to-SVG representation compiler for Layout: ${selectedLayoutId} on profile ${viewportMode}`);
      } else {
        throw new Error("Vector generator returned warning index. Verify design layers.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to trigger compilation. Confirm DXF has mapped coordinates.");
    } finally {
      setCompileLoading(false);
    }
  };

  // Interactive Click Handlers
  const handleElementSingleClick = (plot: any) => {
    if (!plot) return;
    setHighlightedPlotId(plot.id);
    setSelectedPlot(plot);
    if (onPlotSelected) {
      onPlotSelected(plot);
    }
  };

  const handleElementDoubleClick = (plot: any) => {
    if (!plot) return;
    setHighlightedPlotId(plot.id);
    setSelectedPlot(plot);
    setDrawerOpen(true);
    if (onPlotSelected) {
      onPlotSelected(plot);
    }
  };

  // Dynamic Class/Style resolution mapping
  const resolveStyle = (elem: any, isHighlighted: boolean) => {
    const layerType = elem.metadata?.layer_type || "IGNORE";
    const profileKey = elem.metadata?.style_profile || "PLOT_AVAILABLE";
    
    // Fallback profile resolve
    let profile = styleProfiles[profileKey] || defaultStyleProfiles[profileKey] || defaultStyleProfiles.PLOT_AVAILABLE;
    
    // Dynamic styles based on connected plot status if layer matches plots
    const mappedPlot = plotsMap[elem.source_geometry_entity_id];
    if (layerType === "PLOT" && mappedPlot) {
      const statusKey = `PLOT_${mappedPlot.status}`;
      if (styleProfiles[statusKey]) {
        profile = styleProfiles[statusKey];
      } else if (defaultStyleProfiles[statusKey]) {
        profile = defaultStyleProfiles[statusKey];
      }
    }

    if (isHighlighted) {
      return {
        fill: "#FCD34D", // Highlight golden visual glow
        stroke: "#D97706",
        strokeWidth: (Number(profile.stroke_width) || 1.5) + 1.5,
        fillOpacity: 0.95,
        cursor: "pointer",
        transition: "all 0.2s ease"
      };
    }

    return {
      fill: profile.fill_color || "#F1F5F9",
      stroke: profile.stroke_color || "#64748B",
      strokeWidth: Number(profile.stroke_width) || 1.5,
      fillOpacity: Number(profile.opacity) || 0.9,
      cursor: layerType === "PLOT" ? "pointer" : "default",
      transition: "all 0.2s ease"
    };
  };

  // Robust parsing helper for inline geometric parameters
  const extractPoints = (markup: string) => {
    const pointsMatch = markup.match(/points="([^"]+)"/);
    return pointsMatch ? pointsMatch[1] : "";
  };

  const extractPathD = (markup: string) => {
    const dMatch = markup.match(/d="([^"]+)"/);
    return dMatch ? dMatch[1] : "";
  };

  // Perform active user Plot Search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Search target across: plot_number, detected_label, generated_label
    const term = searchQuery.trim().toLowerCase();
    const matched = plotsList.find((p: any) => {
      const pNum = (p.plot_number || "").toLowerCase();
      const detLabel = (p.dimensions_metadata?.detected_label || "").toLowerCase();
      const genLabel = (p.dimensions_metadata?.plot_attributes?.generated_label || "").toLowerCase();
      return pNum === term || pNum.includes(term) || detLabel.includes(term) || genLabel.includes(term);
    });

    if (matched) {
      setHighlightedPlotId(matched.id);
      setSelectedPlot(matched);
      setDrawerOpen(true);
      if (onPlotSelected) {
        onPlotSelected(matched);
      }
      setSuccessMessage(`Plot ${matched.plot_number} found and highlighted!`);
      // Auto dismiss success toast
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setErrorMessage(`No matching plot catalog found for input term: "${searchQuery}"`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Re-fit viewbox to clear highlight focus or fit to screen coordinates
  const handleFitToScreen = () => {
    setHighlightedPlotId(null);
    setSearchQuery("");
    setSuccessMessage("Canvas fitted to screen viewport.");
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  // Filter elements to obey do not render hidden layers rule
  const visibleElements = currentDoc?.elements?.filter((el: any) => {
    const layerType = el.metadata?.layer_type;
    if (layerType === "PLOT" && !layerVisibility.PLOTS) return false;
    if (layerType === "ROAD" && !layerVisibility.ROADS) return false;
    if (layerType === "AMENITY" && !layerVisibility.AMENITIES) return false;
    if (layerType === "UTILITY" && !layerVisibility.UTILITIES) return false;
    // Any default boundaries layers
    if (layerType === "BOUNDARY" && !layerVisibility.BOUNDARIES) return false;
    return true;
  }) || [];

  const matchedLayoutObj = layoutsList.find(l => l.id === selectedLayoutId);
  const matchedProjectObj = projectsList.find(p => p.id === selectedProjectId);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-2xl shadow-xl border border-slate-800 overflow-hidden" id="interactive-layout-viewer-main">
      {/* 1. TOP UTILITY HEADER RAIL */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" id="viewer-header">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Interactive Layout Viewer</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">High-accuracy vector rendering of compiled DXF layers (Sprint 4A-compliant read-only)</p>
        </div>

        {/* Workspace dynamic selection */}
        <div className="flex flex-wrap items-center gap-2" id="viewer-dropdowns">
          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- Choose Project --</option>
              {projectsList.map(p => (
                <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phase/Layout</label>
            <select
              value={selectedLayoutId}
              onChange={(e) => setSelectedLayoutId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              disabled={!selectedProjectId}
            >
              <option value="">-- Select Layout Plan --</option>
              {layoutsList.filter(l => l.project_id === selectedProjectId).map(l => (
                <option key={l.id} value={l.id}>[{l.code}] {l.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Render Profile</label>
            <div className="flex bg-slate-905 border border-slate-800 p-1 rounded-xl">
              {(["DESKTOP", "TABLET", "MOBILE"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setViewportMode(p)}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-colors ${
                    viewportMode === p ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Alerts Banner */}
      {errorMessage && (
        <div className="bg-rose-950/80 border-b border-b-rose-800 text-rose-200 px-6 py-2.5 flex items-center gap-2" id="viewer-error-banner">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <p className="text-xs font-semibold leading-relaxed">{errorMessage}</p>
        </div>
      )}
      {successMessage && (
        <div className="bg-emerald-950/80 border-b border-b-emerald-800 text-emerald-200 px-6 py-2.5 flex items-center gap-2" id="viewer-success-banner">
          <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-xs font-semibold">{successMessage}</p>
        </div>
      )}

      {/* 2. DYNAMIC WORKSPACE BODY CONTAINER split to grid layout */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 overflow-hidden h-full">
        {/* LEFT COLUMN - INTERACTION LAYER CONTROLS AND SEARCH */}
        <div className="xl:col-span-3 bg-slate-950/60 border-r border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Plot Search widget */}
          <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span>Plot Search Engine</span>
            </h4>
            <form onSubmit={handleSearchSubmit} className="space-y-2">
              <input
                type="text"
                placeholder="Search Plot Code or Label..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 px-3 py-1.5 rounded-lg text-xs placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                className="w-full bg-indigo-650 hover:bg-indigo-750 text-white font-semibold py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
              >
                Find & Focus Plot
              </button>
            </form>
          </div>

          {/* Layers Visibility toggle panel */}
          <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Layer Toggle Control</span>
            </h4>
            <div className="space-y-2">
              {Object.entries(layerVisibility).map(([layerKey, visible]) => (
                <button
                  key={layerKey}
                  onClick={() => setLayerVisibility(prev => ({ ...prev, [layerKey]: !visible }))}
                  className="w-full flex items-center justify-between text-left text-xs text-slate-300 hover:text-white px-2 py-1 rounded-md hover:bg-slate-900 transition-colors"
                >
                  <span className="font-medium tracking-wide">{layerKey}</span>
                  {visible ? (
                    <Eye className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Styles overview ledger info panel */}
          <div className="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Design Styles Dictionary</span>
            </h4>
            <div className="space-y-1.5">
              {Object.entries(styleProfiles).map(([profileKey, prof]: [string, any]) => (
                <div key={profileKey} className="flex items-center gap-2 text-xs">
                  <span
                    className="w-3 h-3 rounded-md border border-slate-600 inline-block flex-shrink-0"
                    style={{ backgroundColor: prof.fill_color }}
                  />
                  <span className="text-slate-400 text-[10px] truncate max-w-[150px] font-mono uppercase">
                    {profileKey.replace("PLOT_", "")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fits view triggers */}
          <div className="flex gap-2">
            <button
              onClick={handleFitToScreen}
              className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-lg py-1.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Maximize className="w-3.5 h-3.5 text-indigo-400" />
              <span>Fit Stage</span>
            </button>
            <button
              onClick={triggerCompilation}
              disabled={compileLoading}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-1.5 rounded-lg text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${compileLoading ? "animate-spin" : ""}`} />
              <span>Compile SVG</span>
            </button>
          </div>
        </div>

        {/* MIDDLE COLUMN - RESPONSIVE STAGE VECTOR VISUALIZER */}
        <div className="xl:col-span-9 bg-slate-905 flex items-center justify-center p-4 relative overflow-hidden h-[450px] xl:h-full">
          {loading ? (
            <div className="space-y-3 text-center">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Streaming CAD vector definitions...</p>
            </div>
          ) : !selectedLayoutId ? (
            <div className="space-y-2 text-center text-slate-500 max-w-sm px-6">
              <Compass className="w-10 h-10 text-slate-700 mx-auto" />
              <h3 className="text-white text-sm font-semibold">Select Layout Boundary To Start</h3>
              <p className="text-xs">Browse real estate inventory projects on the top drop-downs to generate and view CAD subdivision boundaries.</p>
            </div>
          ) : !currentDoc ? (
            <div className="space-y-3 text-center text-slate-500 max-w-sm px-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
              <FileCode2 className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
              <h3 className="text-white text-sm font-semibold">SVG Layout Compilation Required</h3>
              <p className="text-xs">This layout phase lacks a compiled SVG vector model in the current profile representation.</p>
              <button
                onClick={triggerCompilation}
                disabled={compileLoading}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 mx-auto mt-2 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${compileLoading ? "animate-spin" : ""}`} />
                <span>Build Svg Document</span>
              </button>
            </div>
          ) : (
            // COMPILING SVG STAGE VIEWER
            <div className="w-full h-full flex flex-col items-center justify-center">
              {/* Responsive simulation container box */}
              <div
                className="bg-slate-950 rounded-2xl border border-slate-800 relative shadow-2xl flex items-center justify-center p-1.5 overflow-hidden transition-all duration-300"
                style={{
                  width: currentDoc.width ? `${currentDoc.width}px` : "100%",
                  height: currentDoc.height ? `${currentDoc.height}px` : "100%",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  aspectRatio: currentDoc.width ? `${currentDoc.width}/${currentDoc.height}` : "auto"
                }}
              >
                <svg
                  viewBox={currentDoc.viewbox || "0 0 1200 800"}
                  className="w-full h-full select-none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Geometric Elements Groups */}
                  <g id="layout-geometry-elements">
                    {visibleElements.map((el: any) => {
                      const points = extractPoints(el.svg_data);
                      const d = extractPathD(el.svg_data);
                      const isHot = highlightedPlotId && plotsMap[el.source_geometry_entity_id]?.id === highlightedPlotId;
                      const plot = plotsMap[el.source_geometry_entity_id];
                      
                      const elementStyle = resolveStyle(el, !!isHot);

                      if (el.element_type === "POLYGON" && points) {
                        return (
                          <polygon
                            key={el.id}
                            points={points}
                            style={elementStyle}
                            onClick={() => handleElementSingleClick(plot)}
                            onDoubleClick={() => handleElementDoubleClick(plot)}
                          />
                        );
                      } else if (d) {
                        return (
                          <path
                            key={el.id}
                            d={d}
                            style={elementStyle}
                            onClick={() => handleElementSingleClick(plot)}
                            onDoubleClick={() => handleElementDoubleClick(plot)}
                          />
                        );
                      }
                      return null;
                    })}
                  </g>

                  {/* Text labels layer - obeying layout visibility controls */}
                  {layerVisibility.LABELS && currentDoc.labels && (
                    <g id="layout-labels-group" className="pointer-events-none">
                      {currentDoc.labels.map((lbl: any) => (
                        <text
                          key={lbl.id}
                          x={lbl.x}
                          y={lbl.y}
                          transform={`rotate(${lbl.rotation || 0} ${lbl.x} ${lbl.y})`}
                          className="font-mono text-[9px] font-bold fill-slate-950 text-center select-none shadow-sm"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {lbl.text}
                        </text>
                      ))}
                    </g>
                  )}
                </svg>

                {/* Micro layout details overlay marker */}
                {selectedPlot && (
                  <div className="absolute top-3 left-3 bg-slate-900/90 border border-indigo-500/30 px-3 py-2 rounded-xl text-xs space-y-1 backdrop-blur-md">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Square className="w-3" style={{ fill: resolveStyle(visibleElements.find(el => el.source_geometry_entity_id === selectedPlot.source_geometry_entity_id) || {}, false).fill }} />
                      <span>Plot No: {selectedPlot.plot_number}</span>
                    </p>
                    <p className="font-mono text-[10px] text-slate-400">
                      {selectedPlot.area_value} {getUnitCode(selectedPlot.measurement_unit_id)} • {selectedPlot.facing}
                    </p>
                    <button
                      onClick={() => setDrawerOpen(true)}
                      className="text-[10px] text-indigo-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Show Full Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. RESPONSIVE DETAILS DRAWER & Future actions widget */}
      {drawerOpen && selectedPlot && (
        <>
          {/* Backdrop screen mask to lock drawers in mobile/tablet */}
          <div
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Dynamic CSS wrapper targeting: Desktop (right sidebar Drawer), Tablet (right Slide panel), Mobile (Bottom actions sheet) */}
          <div
            className={`fixed bg-slate-900 text-slate-100 shadow-2xl z-50 border-slate-800 transition-all duration-300 md:duration-500 ${
              viewportMode === "MOBILE"
                ? "inset-x-0 bottom-0 max-h-[80vh] rounded-t-3xl border-t border-slate-700 flex flex-col translate-y-0"
                : viewportMode === "TABLET"
                ? "right-0 top-0 bottom-0 w-80 border-l border-slate-800 flex flex-col translate-x-0"
                : "right-0 top-0 bottom-0 w-96 border-l border-slate-800 flex flex-col translate-x-0"
            }`}
            id="details-drawer-container"
          >
            {/* Header section */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Plot Parcel #{selectedPlot.plot_number}
                </h3>
                <p className="text-[10px] text-slate-500">Inventory Registry Specifications</p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Detail specs */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3.5 bg-slate-950/50 p-4 rounded-xl border border-slate-800/60 font-sans">
                <div>
                  <span className="text-[10px] text-slate-500 block">Status state</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] mt-1 font-bold inline-block border ${
                    selectedPlot.status === "AVAILABLE" ? "bg-slate-800 text-slate-300 border-slate-700" :
                    selectedPlot.status === "SOLD" ? "bg-emerald-950 text-emerald-400 border-emerald-900" :
                    selectedPlot.status === "BOOKED" ? "bg-blue-950 text-blue-400 border-blue-900" :
                    "bg-amber-950 text-amber-400 border-amber-900"
                  }`}>
                    {selectedPlot.status}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Total Area</span>
                  <span className="font-bold text-white font-mono">{selectedPlot.area_value} {getUnitCode(selectedPlot.measurement_unit_id)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Facing orientation</span>
                  <span className="font-bold text-white uppercase">{selectedPlot.facing}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Road Width</span>
                  <span className="font-bold text-white font-mono">{selectedPlot.road_width || "0"} FT</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-500 block">Dimensions Layout</span>
                  <span className="font-bold text-white font-mono block mt-0.5">
                    {selectedPlot.dimensions || `${selectedPlot.length || "N/A"} x ${selectedPlot.width || "N/A"}`}
                  </span>
                </div>
              </div>

              {/* Connected Layout/Project reference context */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Subdivision Context</span>
                </h4>
                <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                  <p className="text-slate-300 flex justify-between">
                    <span>Project:</span>
                    <span className="font-semibold text-white">{matchedProjectObj?.name || "N/A"}</span>
                  </p>
                  <p className="text-slate-300 flex justify-between">
                    <span>Zoning Layout:</span>
                    <span className="font-semibold text-white">{matchedLayoutObj?.name || "N/A"}</span>
                  </p>
                  <p className="text-slate-300 flex justify-between">
                    <span>Corner Plot?:</span>
                    <span className="font-semibold text-amber-400">{selectedPlot.corner_plot ? "YES (Corner)" : "NO"}</span>
                  </p>
                </div>
              </div>

              {/* PLACEHOLDER PANEL FOR FUTURE ACTIONS */}
              <div className="bg-gradient-to-tr from-slate-950 to-indigo-950/40 p-4 rounded-xl border border-indigo-900/30 space-y-2.5">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Actions Portal
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Booking allocations, physical sales contracts, CRM updates, and Escrow payments can be handled post approval.
                </p>
                
                {/* Future reserve / book / sell action indicators */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button disabled className="bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-bold py-1.5 rounded-lg opacity-40 inline-flex items-center justify-center gap-1">
                     Reserve
                  </button>
                  <button disabled className="bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-bold py-1.5 rounded-lg opacity-40 inline-flex items-center justify-center gap-1">
                     Book
                  </button>
                  <button disabled className="bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-bold py-1.5 rounded-lg opacity-40 inline-flex items-center justify-center gap-1">
                     Sell
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
