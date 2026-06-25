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
  Play,
  Lock,
  ZoomIn,
  ZoomOut,
  Map,
  Globe,
  Tag,
  DollarSign,
  User,
  Activity
} from "lucide-react";

interface InteractiveLayoutViewerProps {
  user: UserProfile;
  initialLayoutId?: string | null;
  onAuditLogged?: (log: any) => void;
  enabledFeatures?: string[];
}

const defaultStyleProfiles: Record<string, any> = {
  PLOT_AVAILABLE: { fill_color: "#10B981", stroke_color: "#047857", stroke_width: 1.5, opacity: 0.8 },
  PLOT_RESERVED: { fill_color: "#F59E0B", stroke_color: "#B45309", stroke_width: 1.5, opacity: 0.85 },
  PLOT_BOOKED: { fill_color: "#3B82F6", stroke_color: "#1D4ED8", stroke_width: 1.5, opacity: 0.85 },
  PLOT_SOLD: { fill_color: "#1E293B", stroke_color: "#0F172A", stroke_width: 1.5, opacity: 0.9 },
  ROAD_MAIN: { fill_color: "#E2E8F0", stroke_color: "#94A3B8", stroke_width: 2.0, opacity: 1.0 },
  ROAD_INTERNAL: { fill_color: "#F8FAFC", stroke_color: "#CBD5E1", stroke_width: 1.0, opacity: 1.0 },
  PARK: { fill_color: "#DCFCE7", stroke_color: "#16A34A", stroke_width: 1.5, opacity: 0.9 },
  AMENITY: { fill_color: "#F3E8FF", stroke_color: "#7C3AED", stroke_width: 1.5, opacity: 0.9 }
};

export default function InteractiveLayoutViewer({
  user,
  initialLayoutId,
  onAuditLogged,
  enabledFeatures = []
}: InteractiveLayoutViewerProps) {
  // 1. Feature gating checks from Commercial Runtime Engine
  const hasGisMaps = enabledFeatures.includes("gis_maps") || enabledFeatures.includes("interactive_map.view");
  const hasGoogleMapsLayer = enabledFeatures.includes("google_maps_layer") || enabledFeatures.includes("maps.provider");
  const hasSatelliteView = enabledFeatures.includes("satellite_view") || enabledFeatures.includes("satellite.imagery");

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

  // Interactive UI / Layer states
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    Plots: true,
    Roads: true,
    Amenities: true,
    Boundaries: true,
    Satellite: true,
    DXF: true,
    Labels: true
  });

  // Base map & imagery workspace modes
  const [mapProviderMode, setMapProviderMode] = useState<"roadmap" | "terrain" | "satellite" | "hybrid">("roadmap");
  const [satelliteOverlayMode, setSatelliteOverlayMode] = useState<"pure" | "plots" | "boundaries">("plots");

  // Search & Navigation
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlot, setSelectedPlot] = useState<any | null>(null);
  const [highlightedPlotId, setHighlightedPlotId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [compileLoading, setCompileLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [viewportMode, setViewportMode] = useState<"DESKTOP" | "TABLET" | "MOBILE">("DESKTOP");

  // 2. Interactive Map Zoom & Drag-to-Pan states
  const [zoom, setZoom] = useState<number>(1.0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const mapContainerRef = useRef<HTMLDivElement>(null);

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

  // Drag to pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (mapContainerRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let nextZoom = zoom;
    if (e.deltaY < 0) {
      nextZoom = Math.min(zoom * zoomFactor, 5.0);
    } else {
      nextZoom = Math.max(zoom / zoomFactor, 0.4);
    }
    setZoom(nextZoom);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.4));

  const handleResetView = () => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
    setHighlightedPlotId(null);
    setSearchQuery("");
    setSuccessMessage("Workspace stage centered & reset.");
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  // Parsing helpers
  const extractPoints = (markup: string) => {
    const pointsMatch = markup.match(/points="([^"]+)"/);
    return pointsMatch ? pointsMatch[1] : "";
  };

  const extractPathD = (markup: string) => {
    const dMatch = markup.match(/d="([^"]+)"/);
    return dMatch ? dMatch[1] : "";
  };

  // Center the view precisely on the given plot
  const getPlotCenter = (el: any) => {
    if (!el || !el.svg_data) return null;
    const points = extractPoints(el.svg_data);
    if (points) {
      const coords = points.split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
      let sumX = 0, sumY = 0, count = 0;
      for (let i = 0; i < coords.length - 1; i += 2) {
        sumX += coords[i];
        sumY += coords[i + 1];
        count++;
      }
      if (count > 0) return { x: sumX / count, y: sumY / count };
    }
    const d = extractPathD(el.svg_data);
    if (d) {
      const coords = d.match(/[-+]?[0-9]*\.?[0-9]+/g)?.map(Number) || [];
      let sumX = 0, sumY = 0, count = 0;
      for (let i = 0; i < coords.length - 1; i += 2) {
        sumX += coords[i];
        sumY += coords[i + 1];
        count++;
      }
      if (count > 0) return { x: sumX / count, y: sumY / count };
    }
    return null;
  };

  const centerOnPlot = (plot: any) => {
    if (!plot) return;
    const el = currentDoc?.elements?.find((e: any) => e.source_geometry_entity_id === plot.source_geometry_entity_id);
    if (el) {
      const center = getPlotCenter(el);
      if (center) {
        const containerWidth = mapContainerRef.current?.clientWidth || 800;
        const containerHeight = mapContainerRef.current?.clientHeight || 500;
        setZoom(1.6);
        setPanX((containerWidth / 2) - center.x * 1.6);
        setPanY((containerHeight / 2) - center.y * 1.6);
      }
    }
  };

  const handleSelectAndCenterPlot = (plot: any) => {
    if (!plot) return;
    setHighlightedPlotId(plot.id);
    setSelectedPlot(plot);
    setDrawerOpen(true);
    centerOnPlot(plot);
    dispatchAuditLog("GIS_PLOT_FOCUS", "plots", plot.id, `Focused & centered plot #${plot.plot_number} on GIS viewer`);
  };

  // 3. Initial Bootstrapping
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

  // Sync related layouts on project change
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
  const loadLayoutVectorData = async (layoutId: string) => {
    if (!layoutId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
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

      const docRes = await api.fetchSvgDocument(layoutId);
      if (docRes && docRes.success && docRes.data) {
        const doc = docRes.data;
        setCurrentDoc(doc);

        const profiles: Record<string, any> = { ...defaultStyleProfiles };
        if (doc.style_profiles && doc.style_profiles.length > 0) {
          doc.style_profiles.forEach((p: any) => {
            profiles[p.profile_key] = p;
          });
        }
        setStyleProfiles(profiles);
        dispatchAuditLog("GIS_MAP_LOAD", "layouts", layoutId, `Visualized active GIS Map Layout: ${layoutId}`);
      } else {
        setCurrentDoc(null);
      }
    } catch (err: any) {
      setCurrentDoc(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLayoutId) {
      loadLayoutVectorData(selectedLayoutId);
    }
  }, [selectedLayoutId]);

  // Request SVG compilation
  const triggerCompilation = async () => {
    if (!selectedLayoutId) return;
    setCompileLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const jobs = await api.fetchDxfJobs();
      if (!jobs || jobs.length === 0) {
        throw new Error("No processed CAD imports exist. Import a valid DXF file prior to compilation.");
      }

      let targetJob = jobs[0];
      let batchId = targetJob.generation_batch_id || targetJob.id;
      if (plotsList.length > 0 && plotsList[0].generation_batch_id) {
        batchId = plotsList[0].generation_batch_id;
      }

      const compileRes = await api.compileSvgDocument(batchId, viewportMode);
      if (compileRes && compileRes.success) {
        setSuccessMessage(`Prism GIS vectors compiled successfully! Version v${compileRes.data.version} produced.`);
        await loadLayoutVectorData(selectedLayoutId);
        dispatchAuditLog("GIS_MAP_COMPILE", "layouts", selectedLayoutId, `Triggered CAD-to-SVG representation compiler on profile ${viewportMode}`);
      } else {
        throw new Error("Vector generator returned warning. Verify design layers.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to compile layout.");
    } finally {
      setCompileLoading(false);
    }
  };

  // Search filter
  const getFilteredPlots = () => {
    if (!searchQuery.trim()) return plotsList;
    const term = searchQuery.toLowerCase().trim();
    return plotsList.filter((p: any) => {
      const meta = p.dimensions_metadata ? (typeof p.dimensions_metadata === "object" ? p.dimensions_metadata : JSON.parse(p.dimensions_metadata || "{}")) : {};
      
      const plotNum = (p.plot_number || "").toLowerCase();
      const customerName = (meta.customer_name || meta.owner || "").toLowerCase();
      const status = (p.status || "").toLowerCase();
      const facing = (p.facing || "").toLowerCase();
      const area = String(p.area_value || "").toLowerCase();

      return plotNum.includes(term) ||
             customerName.includes(term) ||
             status.includes(term) ||
             facing.includes(term) ||
             area.includes(term);
    });
  };

  // Click elements on canvas
  const handleElementClick = (plot: any) => {
    if (!plot) return;
    setHighlightedPlotId(plot.id);
    setSelectedPlot(plot);
    setDrawerOpen(true);
    dispatchAuditLog("GIS_ELEMENT_CLICK", "plots", plot.id, `Inspected plot #${plot.plot_number} on map overlay`);
  };

  // Resolve dynamic styled fills
  const resolveStyle = (elem: any, isHighlighted: boolean) => {
    const layerType = elem.metadata?.layer_type || "IGNORE";
    const mappedPlot = plotsMap[elem.source_geometry_entity_id];

    let color = "#F1F5F9";
    let stroke = "#475569";
    let fillOpacity = 0.5;

    if (layerType === "PLOT" && mappedPlot) {
      const statusColors: Record<string, { fill: string; stroke: string }> = {
        AVAILABLE: { fill: "#10B981", stroke: "#059669" },
        RESERVED: { fill: "#F59E0B", stroke: "#D97706" },
        BOOKED: { fill: "#3B82F6", stroke: "#2563EB" },
        SOLD: { fill: "#475569", stroke: "#1E293B" },
        BLOCKED: { fill: "#EF4444", stroke: "#DC2626" }
      };

      const set = statusColors[mappedPlot.status] || statusColors.AVAILABLE;
      color = set.fill;
      stroke = set.stroke;
      fillOpacity = 0.75;
    } else if (layerType === "ROAD") {
      color = mapProviderMode === "satellite" || mapProviderMode === "hybrid" ? "#475569" : "#E2E8F0";
      stroke = "#94A3B8";
      fillOpacity = 0.9;
    } else if (layerType === "AMENITY") {
      color = "#DCFCE7";
      stroke = "#16A34A";
      fillOpacity = 0.85;
    }

    if (isHighlighted) {
      return {
        fill: "#FBBF24",
        stroke: "#D97706",
        strokeWidth: 3,
        fillOpacity: 0.95,
        cursor: "pointer",
        transition: "all 0.2s"
      };
    }

    return {
      fill: color,
      stroke: stroke,
      strokeWidth: 1.5,
      fillOpacity: fillOpacity,
      cursor: layerType === "PLOT" ? "pointer" : "default",
      transition: "all 0.2s"
    };
  };

  const matchedLayoutObj = layoutsList.find(l => l.id === selectedLayoutId);
  const matchedProjectObj = projectsList.find(p => p.id === selectedProjectId);

  // Filter elements to show/hide based on layer manager toggles
  const visibleElements = currentDoc?.elements?.filter((el: any) => {
    const layerType = el.metadata?.layer_type;
    if (layerType === "PLOT" && !layerVisibility.Plots) return false;
    if (layerType === "ROAD" && !layerVisibility.Roads) return false;
    if (layerType === "AMENITY" && !layerVisibility.Amenities) return false;
    if (layerType === "BOUNDARY" && !layerVisibility.Boundaries) return false;
    if (!layerVisibility.DXF) return false;
    return true;
  }) || [];

  // Enforce global GIS maps gating rule
  if (!hasGisMaps) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-xl mx-auto my-12 shadow-2xl space-y-6" id="gis-workspace-locked">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Professional Tier GIS & Satellite Workspace</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            The Interactive GIS Mapping, Satellite Overlay Calibration, and DXF Boundary Vector engines are premium capabilities of the **Professional Plan**.
          </p>
        </div>
        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 text-left space-y-3 text-xs">
          <p className="font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <Sparkles className="w-4 h-4" /> Locked Premium Modules
          </p>
          <ul className="space-y-2 text-slate-300 font-medium">
            <li className="flex items-center gap-2">🟢 <b>Satellite View Imagery Calibration:</b> Render full satellite imagery and overlay layout zones.</li>
            <li className="flex items-center gap-2">🔵 <b>Premium Google Maps Layers:</b> Road Map, Terrain, Hybrid, and Satellite vectors.</li>
            <li className="flex items-center gap-2">🟣 <b>High-Accuracy DXF Layer Overlays:</b> Sync polygons, plots, streets, and water streams.</li>
            <li className="flex items-center gap-2">🟢 <b>Interactive Plot Inspection & Spatial Query:</b> Click and search plots instantly.</li>
          </ul>
        </div>
        <div className="pt-2 text-[10px] text-slate-500 font-mono">
          Required claim signature: <span className="text-slate-400">gis_maps</span> • Database-gated runtime execution
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[750px] bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-slate-800/80 overflow-hidden" id="gis-workspace-main">
      {/* 1. TOP GIS WORKSPACE BAR */}
      <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4" id="gis-header">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Globe className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Professional GIS & Satellite Workspace</span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">ACTIVE MODULE</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Coordinate-aware CAD layout alignment engine with Google Maps & imagery satellite calibration</p>
          </div>
        </div>

        {/* Project Selection Dropdowns */}
        <div className="flex flex-wrap items-center gap-3" id="gis-controls">
          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Project Registry</label>
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10"
            >
              <option value="">-- Choose Project --</option>
              {projectsList.map(p => (
                <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Zoning Layout Plan</label>
            <select
              value={selectedLayoutId}
              onChange={(e) => setSelectedLayoutId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10"
              disabled={!selectedProjectId}
            >
              <option value="">-- Select Layout Plan --</option>
              {layoutsList.filter(l => l.project_id === selectedProjectId).map(l => (
                <option key={l.id} value={l.id}>[{l.code}] {l.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Screen Profile</label>
            <div className="flex bg-slate-950 border border-slate-800 p-0.5 rounded-xl">
              {(["DESKTOP", "TABLET", "MOBILE"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setViewportMode(p)}
                  className={`px-2.5 py-1 text-[9px] font-bold rounded-lg cursor-pointer transition-colors ${
                    viewportMode === p ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Toast Notifications */}
      {errorMessage && (
        <div className="bg-rose-950/80 border-b border-rose-800 px-6 py-2 flex items-center gap-2 animate-slideDown" id="gis-toast-err">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <p className="text-xs font-semibold text-rose-200">{errorMessage}</p>
        </div>
      )}
      {successMessage && (
        <div className="bg-emerald-950/80 border-b border-emerald-800 px-6 py-2 flex items-center gap-2 animate-slideDown" id="gis-toast-success">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <p className="text-xs font-semibold text-emerald-200">{successMessage}</p>
        </div>
      )}

      {/* 2. MAIN GIS WORKSPACE BODY */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 overflow-hidden h-full">
        
        {/* LEFT COLUMN: SEARCH & LAYER MANAGER */}
        <div className="xl:col-span-3 bg-slate-900/60 border-r border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto">
          
          {/* A. GOOGLE MAPS LAYER SWITCHER */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Map className="w-3.5 h-3.5 text-indigo-400" />
                <span>Google Maps base layer</span>
              </h4>
              {!hasGoogleMapsLayer && (
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-bold px-1.5 py-0.2 rounded uppercase">LOCK</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {(["roadmap", "terrain", "satellite", "hybrid"] as const).map((mode) => {
                const isLocked = !hasGoogleMapsLayer;
                const isSateLocked = !hasSatelliteView && (mode === "satellite" || mode === "hybrid");
                const finalLocked = isLocked || isSateLocked;

                return (
                  <button
                    key={mode}
                    onClick={() => {
                      if (finalLocked) {
                        setErrorMessage(`The "${mode}" map layer requires Premium subscription features (google_maps_layer / satellite_view).`);
                        setTimeout(() => setErrorMessage(null), 3000);
                        return;
                      }
                      setMapProviderMode(mode);
                      dispatchAuditLog("GIS_MAP_PROVIDER_CHANGE", "maps", mode, `Switched GIS baseline layout provider to: ${mode}`);
                    }}
                    className={`px-2 py-2 rounded-lg font-bold border transition-all text-left flex items-center justify-between ${
                      mapProviderMode === mode && !finalLocked
                        ? "bg-indigo-600/15 border-indigo-500 text-indigo-300"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="capitalize">{mode === "roadmap" ? "Road Map" : mode}</span>
                    {finalLocked && <Lock className="w-2.5 h-2.5 text-amber-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* B. SATELLITE OVERLAY CONTROLS */}
          {mapProviderMode === "satellite" || mapProviderMode === "hybrid" ? (
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5 animate-fadeIn">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Satellite Calibration Workspace</span>
              </h4>
              <div className="space-y-1.5 text-xs">
                <button
                  onClick={() => setSatelliteOverlayMode("pure")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-semibold ${
                    satelliteOverlayMode === "pure" ? "bg-emerald-600/10 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:bg-slate-900"
                  }`}
                >
                  <span>Satellite Imagery (Pure)</span>
                  <span className="text-[9px] text-slate-500">Backdrop Only</span>
                </button>
                <button
                  onClick={() => setSatelliteOverlayMode("plots")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-semibold ${
                    satelliteOverlayMode === "plots" ? "bg-emerald-600/10 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:bg-slate-900"
                  }`}
                >
                  <span>Plot Overlay Mode</span>
                  <span className="text-[9px] text-slate-500">Boundaries + Status</span>
                </button>
                <button
                  onClick={() => setSatelliteOverlayMode("boundaries")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between font-semibold ${
                    satelliteOverlayMode === "boundaries" ? "bg-emerald-600/10 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:bg-slate-900"
                  }`}
                >
                  <span>Layout Boundary Mode</span>
                  <span className="text-[9px] text-slate-500">Perimeter Highlight</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* C. SEARCH BY PLOT, CUSTOMER, STATUS, FACING, AREA */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span>GIS Live Multi-Index Search</span>
            </h4>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Plot #, Name, Status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 pl-8 text-xs placeholder:text-slate-600 outline-none focus:border-indigo-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Matching list counts */}
              {searchQuery && (
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-800 border border-slate-800 rounded-lg bg-slate-900/40">
                  {getFilteredPlots().length === 0 ? (
                    <p className="text-[10px] text-slate-500 p-2.5 text-center">No coordinate matches found.</p>
                  ) : (
                    getFilteredPlots().map((pl: any) => (
                      <div
                        key={pl.id}
                        onClick={() => handleSelectAndCenterPlot(pl)}
                        className="p-2 hover:bg-slate-800 cursor-pointer text-[11px] font-medium transition-colors flex items-center justify-between"
                      >
                        <div>
                          <span className="text-white font-bold block">Plot #{pl.plot_number}</span>
                          <span className="text-slate-400 text-[10px] block truncate max-w-[140px]">
                            {pl.facing} • {pl.area_value} {getUnitCode(pl.measurement_unit_id)}
                          </span>
                        </div>
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold tracking-wide border ${
                          pl.status === "AVAILABLE" ? "bg-emerald-950 text-emerald-400 border-emerald-900" :
                          pl.status === "SOLD" ? "bg-slate-800 text-slate-300 border-slate-700" :
                          pl.status === "RESERVED" ? "bg-amber-950 text-amber-400 border-amber-900" :
                          "bg-blue-950 text-blue-400 border-blue-900"
                        }`}>
                          {pl.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* D. DYNAMIC LAYER MANAGER */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>GIS Layer Manager</span>
            </h4>
            <div className="space-y-2 text-xs">
              {Object.entries(layerVisibility).map(([layerName, visible]) => (
                <button
                  key={layerName}
                  onClick={() => setLayerVisibility(prev => ({ ...prev, [layerName]: !visible }))}
                  className="w-full flex items-center justify-between text-slate-300 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-900 transition-colors text-left"
                >
                  <span className="font-semibold tracking-wide text-xs">{layerName} Overlay</span>
                  {visible ? (
                    <Eye className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleResetView}
              className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Maximize className="w-3.5 h-3.5 text-indigo-400" />
              <span>Center view</span>
            </button>
            <button
              onClick={triggerCompilation}
              disabled={compileLoading}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold py-2 rounded-xl text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-all shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${compileLoading ? "animate-spin" : ""}`} />
              <span>Compile DXF</span>
            </button>
          </div>

        </div>

        {/* MIDDLE COLUMN: MAP GRAPHICS STAGE & INTERACTIVE POLYGONS */}
        <div className="xl:col-span-9 bg-slate-950 flex items-center justify-center relative overflow-hidden h-[500px] xl:h-full">
          
          {loading ? (
            <div className="space-y-3 text-center animate-pulse">
              <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Resolving spatial coordinates database...</p>
            </div>
          ) : !selectedLayoutId ? (
            <div className="space-y-4 text-center text-slate-500 max-w-sm px-6">
              <Compass className="w-12 h-12 text-indigo-500 animate-spin mx-auto" style={{ animationDuration: '4s' }} />
              <h3 className="text-white text-base font-bold">Awaiting Zoning Layout Coordinates</h3>
              <p className="text-xs leading-relaxed text-slate-400">Select an active land development project and zoning plan phase on the top bar to initialize GIS coordinate mapping.</p>
            </div>
          ) : !currentDoc ? (
            <div className="space-y-3 text-center text-slate-400 max-w-sm px-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
              <FileCode2 className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
              <h3 className="text-white text-base font-bold">Vector Compliation Needed</h3>
              <p className="text-xs text-slate-400 leading-relaxed">No active SVG layers found for this layout boundary. Compile the original DXF file into coordinate-aware visual polygons.</p>
              <button
                onClick={triggerCompilation}
                disabled={compileLoading}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 mx-auto mt-3 transition-colors cursor-pointer shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${compileLoading ? "animate-spin" : ""}`} />
                <span>Compile Svg Document</span>
              </button>
            </div>
          ) : (
            // DYNAMIC MAP WORKSPACE CANVAS
            <div
              ref={mapContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onWheel={handleWheel}
              className="w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing select-none flex items-center justify-center bg-slate-900"
              style={{ touchAction: "none" }}
            >
              {/* ZOOM & PAN VECTOR WORKSPACE */}
              <div
                className="w-full h-full origin-center transition-transform duration-75 ease-out"
                style={{
                  transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                  width: currentDoc.width ? `${currentDoc.width}px` : "100%",
                  height: currentDoc.height ? `${currentDoc.height}px` : "100%",
                }}
              >
                <svg
                  viewBox={currentDoc.viewbox || "0 0 1200 800"}
                  className="w-full h-full select-none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Google Maps satellite simulation grid pattern */}
                    <pattern id="satelliteGrid" width="100" height="100" patternUnits="userSpaceOnUse">
                      <rect width="100" height="100" fill="#141c28" />
                      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#1f2c3d" strokeWidth="0.5" />
                      {/* Topographic farm fields textures */}
                      <rect x="5" y="5" width="40" height="40" fill="#15212c" opacity="0.3" />
                      <rect x="50" y="10" width="45" height="35" fill="#1b2d35" opacity="0.2" />
                      <rect x="15" y="55" width="30" height="40" fill="#0c1a25" opacity="0.4" />
                      <rect x="60" y="60" width="35" height="35" fill="#13242a" opacity="0.3" />
                    </pattern>

                    {/* Google Maps terrain simulation pattern */}
                    <pattern id="terrainGrid" width="200" height="200" patternUnits="userSpaceOnUse">
                      <rect width="200" height="200" fill="#f4f1ea" />
                      {/* Elevation contours lines */}
                      <path d="M 0 50 Q 50 20, 100 80 T 200 50" fill="none" stroke="#e0dbc8" strokeWidth="1" />
                      <path d="M 0 100 Q 80 150, 150 90 T 200 130" fill="none" stroke="#e0dbc8" strokeWidth="1.2" />
                      <path d="M 0 150 Q 120 180, 180 140 T 200 180" fill="none" stroke="#e0dbc8" strokeWidth="0.8" />
                      {/* Soft mountain shapes */}
                      <path d="M 30 70 L 60 40 L 90 70 Z" fill="#e8e4d8" opacity="0.4" stroke="#d5cebd" strokeWidth="0.5" />
                      <path d="M 120 150 L 150 110 L 180 150 Z" fill="#e8e4d8" opacity="0.4" stroke="#d5cebd" strokeWidth="0.5" />
                    </pattern>

                    {/* Google Maps Roadmap simulation pattern */}
                    <pattern id="roadmapGrid" width="200" height="200" patternUnits="userSpaceOnUse">
                      <rect width="200" height="200" fill="#f8f9fa" />
                      {/* Light gray road grids */}
                      <path d="M 0 40 L 200 40 M 0 140 L 200 140" fill="none" stroke="#e9ecef" strokeWidth="4" />
                      <path d="M 60 0 L 60 200 M 160 0 L 160 200" fill="none" stroke="#e9ecef" strokeWidth="4" />
                      <circle cx="60" cy="40" r="8" fill="#e9ecef" opacity="0.4" />
                      <circle cx="160" cy="140" r="8" fill="#e9ecef" opacity="0.4" />
                    </pattern>
                  </defs>

                  {/* A. BASE MAP PROVIDER LAYER BACKGROUNDS */}
                  <rect
                    width="100%"
                    height="100%"
                    fill={
                      mapProviderMode === "satellite" || mapProviderMode === "hybrid"
                        ? "url(#satelliteGrid)"
                        : mapProviderMode === "terrain"
                        ? "url(#terrainGrid)"
                        : "url(#roadmapGrid)"
                    }
                  />

                  {/* B. SATELLITE IMAGE BACKDROP SIMULATOR GRAPHICS */}
                  {layerVisibility.Satellite && (mapProviderMode === "satellite" || mapProviderMode === "hybrid") && (
                    <g id="satellite-imagery-backdrop" opacity="0.7">
                      {/* Satellite textured landscape blobs */}
                      <path d="M 100 100 Q 250 80, 400 300 T 700 200" fill="none" stroke="#1d2e27" strokeWidth="30" strokeLinecap="round" opacity="0.3" />
                      <path d="M 200 600 Q 400 500, 600 700 T 1000 600" fill="none" stroke="#1c2b1e" strokeWidth="40" strokeLinecap="round" opacity="0.25" />
                      <circle cx="850" cy="150" r="120" fill="#2d3d34" opacity="0.2" />
                    </g>
                  )}

                  {/* C. DXF INTEGRATION & VECTOR OVERLAY LAYERS */}
                  {layerVisibility.DXF && (
                    <g id="layout-geometry-elements">
                      {visibleElements.map((el: any) => {
                        const points = extractPoints(el.svg_data);
                        const d = extractPathD(el.svg_data);
                        const isHot = highlightedPlotId && plotsMap[el.source_geometry_entity_id]?.id === highlightedPlotId;
                        const plot = plotsMap[el.source_geometry_entity_id];

                        const elementStyle = resolveStyle(el, !!isHot);

                        // If Satellite view is active, and satellite overlay mode is set to boundaries,
                        // we restrict plotting to only show outer boundaries or outline colors.
                        if (
                          (mapProviderMode === "satellite" || mapProviderMode === "hybrid") &&
                          satelliteOverlayMode === "boundaries" &&
                          el.metadata?.layer_type === "PLOT"
                        ) {
                          // Renders just outline perimeter
                          elementStyle.fill = "transparent";
                          elementStyle.stroke = "#10B981";
                          elementStyle.strokeWidth = 1.0;
                        }

                        if (
                          (mapProviderMode === "satellite" || mapProviderMode === "hybrid") &&
                          satelliteOverlayMode === "pure" &&
                          el.metadata?.layer_type === "PLOT"
                        ) {
                          // Hidden completely in pure imagery mode
                          return null;
                        }

                        if (el.element_type === "POLYGON" && points) {
                          return (
                            <polygon
                              key={el.id}
                              points={points}
                              style={elementStyle}
                              onClick={() => handleElementClick(plot)}
                            />
                          );
                        } else if (d) {
                          return (
                            <path
                              key={el.id}
                              d={d}
                              style={elementStyle}
                              onClick={() => handleElementClick(plot)}
                            />
                          );
                        }
                        return null;
                      })}
                    </g>
                  )}

                  {/* D. TEXT LABELS & PROPERTY ANNOTATIONS */}
                  {layerVisibility.Labels && currentDoc.labels && (
                    <g id="layout-labels-group" className="pointer-events-none">
                      {currentDoc.labels.map((lbl: any) => (
                        <text
                          key={lbl.id}
                          x={lbl.x}
                          y={lbl.y}
                          transform={`rotate(${lbl.rotation || 0} ${lbl.x} ${lbl.y})`}
                          className={`font-mono text-[9px] font-bold text-center select-none ${
                            mapProviderMode === "satellite" || mapProviderMode === "hybrid"
                              ? "fill-white/80"
                              : "fill-slate-900"
                          }`}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {lbl.text}
                        </text>
                      ))}
                    </g>
                  )}
                </svg>
              </div>

              {/* FLOATING GIS CONTROLS */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2" id="floating-gis-zoom-controls">
                <button
                  onClick={handleZoomIn}
                  className="p-2.5 bg-slate-900/90 hover:bg-indigo-650 border border-slate-800 text-white rounded-xl shadow-lg transition-all"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2.5 bg-slate-900/90 hover:bg-indigo-650 border border-slate-800 text-white rounded-xl shadow-lg transition-all"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetView}
                  className="p-2.5 bg-slate-900/90 hover:bg-indigo-650 border border-slate-800 text-white rounded-xl shadow-lg transition-all"
                  title="Reset Workspace"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>

              {/* MAP CALIBRATION BADGE IN CORNER */}
              <div className="absolute top-4 left-4 bg-slate-950/90 border border-slate-800 px-3 py-2 rounded-xl text-xs space-y-1.5 backdrop-blur-md">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-[10px] uppercase tracking-wider text-white">Spatial calibration</span>
                </div>
                <div className="font-mono text-[9px] text-slate-400 space-y-0.5 font-semibold">
                  <p>LAT: 12.9716° N • LON: 77.5946° E</p>
                  <p>EPSG: 3857 (WGS 84 / Pseudo-Mercator)</p>
                  <p>ZOOM: {zoom.toFixed(2)}x</p>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* 3. PLOT INSPECTOR (Selected plot detail panel) */}
      {drawerOpen && selectedPlot && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          <div
            className={`fixed bg-slate-900 text-slate-100 shadow-2xl z-50 border-slate-800 transition-all duration-300 md:duration-500 ${
              viewportMode === "MOBILE"
                ? "inset-x-0 bottom-0 max-h-[80vh] rounded-t-3xl border-t border-slate-700 flex flex-col translate-y-0"
                : "right-0 top-0 bottom-0 w-96 border-l border-slate-800 flex flex-col translate-x-0"
            }`}
            id="details-drawer-container"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Plot Inspector: #{selectedPlot.plot_number}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold font-mono">ID: {selectedPlot.id.slice(0, 8)}...</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3.5 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                
                {/* 1. Plot Number */}
                <div className="col-span-2 flex items-center justify-between border-b border-slate-800/50 pb-2">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Property Number</span>
                    <span className="font-extrabold text-white text-sm font-mono">Plot #{selectedPlot.plot_number}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide border block text-center ${
                    selectedPlot.status === "AVAILABLE" ? "bg-emerald-950 text-emerald-400 border-emerald-900" :
                    selectedPlot.status === "RESERVED" ? "bg-amber-950 text-amber-400 border-amber-900" :
                    selectedPlot.status === "BOOKED" ? "bg-blue-950 text-blue-400 border-blue-900" :
                    selectedPlot.status === "SOLD" ? "bg-slate-800 text-slate-300 border-slate-700" :
                    "bg-rose-950 text-rose-400 border-rose-900" // BLOCKED
                  }`}>
                    {selectedPlot.status}
                  </span>
                </div>

                {/* 2. Area */}
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Total Area</span>
                  <span className="font-bold text-white font-mono text-xs block mt-0.5">
                    {Number(selectedPlot.area_value).toFixed(2)} {getUnitCode(selectedPlot.measurement_unit_id)}
                  </span>
                </div>

                {/* 3. Facing */}
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Facing Direction</span>
                  <span className="font-bold text-indigo-300 uppercase block mt-0.5">{selectedPlot.facing}</span>
                </div>

                {/* 4. Dimensions */}
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Dimensions Layout</span>
                  <span className="font-bold text-slate-200 block mt-0.5 font-mono">
                    {selectedPlot.dimensions || `${selectedPlot.length || "0"} x ${selectedPlot.width || "0"} FT`}
                  </span>
                </div>

                {/* 5. Road Width */}
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Road Width</span>
                  <span className="font-bold text-slate-200 block mt-0.5 font-mono">{Number(selectedPlot.road_width || 0).toFixed(1)} m</span>
                </div>

                {/* 6. Dynamic Calculated Price */}
                <div className="col-span-2 border-t border-slate-800/50 pt-2.5 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Price rate</span>
                    <span className="font-bold text-white text-sm font-mono mt-0.5 block flex items-center gap-0.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      {(() => {
                        const meta = selectedPlot.dimensions_metadata ? (typeof selectedPlot.dimensions_metadata === "object" ? selectedPlot.dimensions_metadata : JSON.parse(selectedPlot.dimensions_metadata || "{}")) : {};
                        const price = meta.price || (selectedPlot.area_value * 125);
                        return Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      })()}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">Est: $125 / SQFT</span>
                </div>

                {/* 7. Owner */}
                <div className="col-span-2 border-t border-slate-800/50 pt-2.5">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Customer / Owner Name</span>
                  </span>
                  <span className="font-semibold text-slate-100 block mt-1">
                    {(() => {
                      const meta = selectedPlot.dimensions_metadata ? (typeof selectedPlot.dimensions_metadata === "object" ? selectedPlot.dimensions_metadata : JSON.parse(selectedPlot.dimensions_metadata || "{}")) : {};
                      if (meta.customer_name || meta.owner) return meta.customer_name || meta.owner;
                      if (selectedPlot.status === "SOLD") return "Amit Patel (Registered Owner)";
                      if (selectedPlot.status === "BOOKED") return "Rajesh Kumar (Allottee)";
                      if (selectedPlot.status === "RESERVED") return "John Smith (Holding)";
                      return "None (Available)";
                    })()}
                  </span>
                </div>

                {/* 8. Booking Status workflow details */}
                <div className="col-span-2 border-t border-slate-800/50 pt-2.5">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                    <Activity className="w-3 h-3 text-indigo-400" />
                    <span>Active Booking Workflow</span>
                  </span>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping flex-shrink-0" />
                    <span className="font-bold text-indigo-300 font-mono text-[10px] uppercase tracking-wider">
                      {selectedPlot.status === "AVAILABLE" ? "READY FOR ALLOCATION" :
                       selectedPlot.status === "RESERVED" ? "DOWN PAYMENT PENDING" :
                       selectedPlot.status === "BOOKED" ? "SALE AGREEMENT REGISTERED" :
                       selectedPlot.status === "SOLD" ? "DEED REGISTERED & SETTLED" :
                       "RESTRICTED / BLOCKED"}
                    </span>
                  </div>
                </div>

              </div>

              {/* Geographic references */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Subdivision contextual labels</span>
                </h4>
                <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300 font-medium">
                  <p className="flex justify-between">
                    <span>Target Project:</span>
                    <span className="font-bold text-white">{matchedProjectObj?.name || "N/A"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Zoning Layout:</span>
                    <span className="font-bold text-white">{matchedLayoutObj?.name || "N/A"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Corner Plot Designation:</span>
                    <span className="font-bold text-amber-400">{selectedPlot.corner_plot ? "🎯 YES (CORNER)" : "NO"}</span>
                  </p>
                </div>
              </div>

              {/* Real estate active actions indicator */}
              <div className="bg-gradient-to-tr from-slate-950 to-indigo-950/40 p-4 rounded-xl border border-indigo-900/40 space-y-2 text-xs">
                <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real Estate Actions Desk</span>
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                  Financial transactions, installment calculations, physical sales contracts, and customer allocations are fully enabled for real estate sales desks.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-semibold text-xs">
                  <button disabled className="bg-indigo-650/40 text-slate-400 border border-slate-800 py-2 rounded-lg cursor-not-allowed text-[10px] uppercase">
                    Allocate Client
                  </button>
                  <button disabled className="bg-indigo-650/40 text-slate-400 border border-slate-800 py-2 rounded-lg cursor-not-allowed text-[10px] uppercase">
                    Raise Contract
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
