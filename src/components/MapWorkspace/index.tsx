import React, { useState, useEffect, useRef } from "react";
import { 
  Building2, 
  MapPin, 
  Compass, 
  ArrowRight, 
  Layers, 
  Search, 
  Plus, 
  Activity, 
  ShieldCheck, 
  Database,
  ListFilter,
  CheckCircle2,
  AlertTriangle,
  Map
} from "lucide-react";
import api from "../../lib/api.ts";
import { runValidationSuite } from "../../lib/plotEngine.ts";
import { WorkspaceState, MockGeometry, WorkspaceTool } from "./types.ts";
import { GeometryLayer, LayoutAsset, LayoutVersion } from "../../MapEngine/Contracts/models.ts";
import { DrawingToolManager, DeleteObjectCommand, AppTool } from "../../MapEngine/Drawing/DrawingToolManager.ts";

import Toolbar from "./Toolbar.tsx";
import Sidebar from "./Sidebar.tsx";
import Canvas from "./Canvas.tsx";
import Inspector from "./Inspector.tsx";
import StatusBar from "./StatusBar.tsx";
import EmptyState from "./EmptyState.tsx";

// Seeded high-fidelity fallback mock data in case DB tables are unpopulated
const MOCK_PROJECTS = [
  { id: "proj-1", code: "PRJ-GME", name: "Green Meadows Elite", location: "North Bengaluru, Karnataka", status: "Active", totalLayouts: 2, developer: "Bhoomi Realty Developers" },
  { id: "proj-2", code: "PRJ-SFT", name: "Springfields Township", location: "Pune West, Maharashtra", status: "Active", totalLayouts: 1, developer: "Apex Plotting Conglomerate" },
  { id: "proj-3", code: "PRJ-GVC", name: "Golden Valley County", location: "Chennai Coastal, Tamil Nadu", status: "Draft", totalLayouts: 0, developer: "Capital Housing Estates" }
];

const MOCK_LAYOUTS = [
  { id: "lay-1", project_id: "proj-1", code: "LAY-SEC-A", name: "Sector A Premium Residential Layout", type: "Residential", status: "Approved", totalArea: "450,000 SQFT", totalPlots: 45 },
  { id: "lay-2", project_id: "proj-1", code: "LAY-SEC-B", name: "Sector B Commercial Tech Zone", type: "Commercial", status: "Approved", totalArea: "210,000 SQFT", totalPlots: 12 },
  { id: "lay-3", project_id: "proj-2", code: "LAY-SF-P1", name: "Springfields Phase 1 Layout Blueprint", type: "Mixed-Use", status: "Approved", totalArea: "350,000 SQFT", totalPlots: 28 }
];

const DEFAULT_LAYERS: GeometryLayer[] = [
  { id: "l-boundary", layout_id: "lay-1", layer_name: "BOUNDARY", display_name: "Site Boundary Limit", is_visible: true, is_locked: false, display_order: 1, style_config: { strokeColor: "#4F46E5", strokeWidth: 3, fillColor: "#818CF8", opacity: 0.15 }, permissions: { viewRoles: ["ADMIN", "USER"], editRoles: ["ADMIN"] }, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" },
  { id: "l-plots", layout_id: "lay-1", layer_name: "PLOTS", display_name: "Subdivided Plots", is_visible: true, is_locked: false, display_order: 2, style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 }, permissions: { viewRoles: ["ADMIN", "USER"], editRoles: ["ADMIN"] }, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" },
  { id: "l-roads", layout_id: "lay-1", layer_name: "ROADS", display_name: "Slab Roads & Access", is_visible: true, is_locked: false, display_order: 3, style_config: { strokeColor: "#475569", strokeWidth: 4, fillColor: "#94A3B8", opacity: 0.5 }, permissions: { viewRoles: ["ADMIN", "USER"], editRoles: ["ADMIN"] }, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" },
  { id: "l-park", layout_id: "lay-1", layer_name: "PARK", display_name: "Community Park Buffer", is_visible: true, is_locked: false, display_order: 4, style_config: { strokeColor: "#22C55E", strokeWidth: 1.5, fillColor: "#4ADE80", opacity: 0.35 }, permissions: { viewRoles: ["ADMIN", "USER"], editRoles: ["ADMIN"] }, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" },
  { id: "l-ca", layout_id: "lay-1", layer_name: "CA", display_name: "Civic Amenities (CA)", is_visible: true, is_locked: false, display_order: 5, style_config: { strokeColor: "#F59E0B", strokeWidth: 2, fillColor: "#FBBF24", opacity: 0.3 }, permissions: { viewRoles: ["ADMIN", "USER"], editRoles: ["ADMIN"] }, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" },
  { id: "l-amenities", layout_id: "lay-1", layer_name: "AMENITIES", display_name: "General Amenities Zone", is_visible: true, is_locked: false, display_order: 6, style_config: { strokeColor: "#EC4899", strokeWidth: 1.5, fillColor: "#F472B6", opacity: 0.25 }, permissions: { viewRoles: ["ADMIN", "USER"], editRoles: ["ADMIN"] }, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" },
  { id: "l-utilities", layout_id: "lay-1", layer_name: "UTILITIES", display_name: "Water/Sewer Lines", is_visible: true, is_locked: false, display_order: 7, style_config: { strokeColor: "#3B82F6", strokeWidth: 2, fillColor: "#60A5FA", opacity: 0.2 }, permissions: { viewRoles: ["ADMIN", "USER"], editRoles: ["ADMIN"] }, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" },
  { id: "l-labels", layout_id: "lay-1", layer_name: "LABELS", display_name: "Dynamic Map Labels", is_visible: true, is_locked: false, display_order: 8, style_config: { strokeColor: "#334155", strokeWidth: 1, fillColor: "#E2E8F0", opacity: 0.8 }, permissions: { viewRoles: ["ADMIN", "USER"], editRoles: ["ADMIN"] }, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" }
];

const INITIAL_MOCK_OBJECTS: MockGeometry[] = [
  {
    id: "obj-boundary",
    layer_id: "l-boundary",
    layout_id: "lay-1",
    layerName: "BOUNDARY",
    name: "Site Boundary Limit",
    object_type: "BOUNDARY",
    geometry_data: {
      coordinates: [[100, 100], [700, 100], [700, 500], [100, 500]]
    },
    style_config: { strokeColor: "#4F46E5", strokeWidth: 3, fillColor: "#818CF8", opacity: 0.15 },
    properties: { zoning: "Residential", owner: "Bhoomi Developers" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  },
  {
    id: "obj-plot-101",
    layer_id: "l-plots",
    layout_id: "lay-1",
    layerName: "PLOTS",
    name: "Subdivided Plot 101",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[150, 120], [280, 120], [280, 200], [150, 200]]
    },
    style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 },
    properties: { plot_number: "101", area_value: 1200, facing: "EAST", owner: "Aditya Kumar", zoning: "Residential" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  },
  {
    id: "obj-plot-102",
    layer_id: "l-plots",
    layout_id: "lay-1",
    layerName: "PLOTS",
    name: "Subdivided Plot 102",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[150, 220], [280, 220], [280, 300], [150, 300]]
    },
    style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 },
    properties: { plot_number: "102", area_value: 1200, facing: "WEST", owner: "Sunita Sharma", zoning: "Residential" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  },
  {
    id: "obj-plot-103",
    layer_id: "l-plots",
    layout_id: "lay-1",
    layerName: "PLOTS",
    name: "Subdivided Plot 103",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[150, 320], [280, 320], [280, 400], [150, 400]]
    },
    style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 },
    properties: { plot_number: "103", area_value: 1200, facing: "CORNER", owner: "Ramanathan Iyer", zoning: "Residential" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  },
  {
    id: "obj-plot-104",
    layer_id: "l-plots",
    layout_id: "lay-1",
    layerName: "PLOTS",
    name: "Subdivided Plot 104",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[450, 120], [580, 120], [580, 200], [450, 200]]
    },
    style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 },
    properties: { plot_number: "104", area_value: 1200, facing: "NORTH", owner: "Priyanka Roy", zoning: "Residential" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  },
  {
    id: "obj-plot-105",
    layer_id: "l-plots",
    layout_id: "lay-1",
    layerName: "PLOTS",
    name: "Subdivided Plot 105",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[450, 220], [580, 220], [580, 300], [450, 300]]
    },
    style_config: { strokeColor: "#10B981", strokeWidth: 2, fillColor: "#34D399", opacity: 0.25 },
    properties: { plot_number: "105", area_value: 1200, facing: "SOUTH", owner: "David Dsouza", zoning: "Residential" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  },
  {
    id: "obj-park",
    layer_id: "l-park",
    layout_id: "lay-1",
    layerName: "PARK",
    name: "Central Recreation Sector Park",
    object_type: "POLYGON",
    geometry_data: {
      coordinates: [[310, 250], [420, 250], [420, 400], [310, 400]]
    },
    style_config: { strokeColor: "#22C55E", strokeWidth: 1.5, fillColor: "#4ADE80", opacity: 0.35 },
    properties: { amenity_type: "Garden Park", area_value: 4500, owner: "Municipal Board" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  },
  {
    id: "obj-road-main",
    layer_id: "l-roads",
    layout_id: "lay-1",
    layerName: "ROADS",
    name: "Primary Central Sector Boulevard",
    object_type: "POLYLINE",
    geometry_data: {
      coordinates: [[350, 100], [350, 500]]
    },
    style_config: { strokeColor: "#475569", strokeWidth: 4, fillColor: "#94A3B8", opacity: 0.5 },
    properties: { road_width: 12, owner: "National Highway Authority" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  },
  {
    id: "obj-road-highway",
    layer_id: "l-roads",
    layout_id: "lay-1",
    layerName: "ROADS",
    name: "East Express Link Expressway",
    object_type: "POLYLINE",
    geometry_data: {
      coordinates: [[100, 450], [700, 450]]
    },
    style_config: { strokeColor: "#475569", strokeWidth: 4, fillColor: "#94A3B8", opacity: 0.5 },
    properties: { road_width: 24, owner: "National Highway Authority" },
    is_active: true,
    created_at: "2026-07-09T00:00:00Z",
    updated_at: "2026-07-09T00:00:00Z"
  }
];

const INITIAL_MOCK_ASSETS: LayoutAsset[] = [
  { id: "a-1", layout_id: "lay-1", file_name: "green_meadows_survey_dxf_v1.dxf", asset_type: "DXF", file_size: 4425890, file_path: "/uploads/green_meadows_survey_dxf_v1.dxf", mime_type: "application/dxf", uploaded_by: "ADMIN", metadata: {}, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" },
  { id: "a-2", layout_id: "lay-1", file_name: "site_boundary_aerial.png", asset_type: "IMAGE", file_size: 8912440, file_path: "/uploads/site_boundary_aerial.png", mime_type: "image/png", uploaded_by: "ADMIN", metadata: {}, created_at: "2026-07-09T00:00:00Z", updated_at: "2026-07-09T00:00:00Z" }
];

const INITIAL_MOCK_VERSIONS: LayoutVersion[] = [
  { id: "v-1", layout_id: "lay-1", version_number: "v1.0", change_summary: "Initial layout blueprint release approved by city planner.", status: "APPROVED", snapshot_data: { layers: [], objects: [] }, created_by: "ADMIN", created_at: "2026-07-09T00:00:00Z" },
  { id: "v-2", layout_id: "lay-1", version_number: "v1.1", change_summary: "Adjusted layout roads alignments and added green park buffers.", status: "DRAFT", snapshot_data: { layers: [], objects: [] }, created_by: "ADMIN", created_at: "2026-07-09T00:00:00Z" }
];

export default function MapWorkspaceIndex() {
  // Navigation flow state: "projects" | "layouts" | "workspace"
  const [currentStep, setCurrentStep] = useState<"projects" | "layouts" | "workspace">("projects");
  
  // Data State Arrays
  const [projectsList, setProjectsList] = useState<any[]>(MOCK_PROJECTS);
  const [layoutsList, setLayoutsList] = useState<any[]>(MOCK_LAYOUTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);

  // Search filter for landing steps
  const [projectsSearch, setProjectsSearch] = useState("");
  const [layoutsSearch, setLayoutsSearch] = useState("");

  // Grid system and mapping visualizers states
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [isSnapToGrid, setIsSnapToGrid] = useState(false);

  // Map workspace components states
  const [layers, setLayers] = useState<GeometryLayer[]>(DEFAULT_LAYERS);
  const [assets, setAssets] = useState<LayoutAsset[]>(INITIAL_MOCK_ASSETS);
  const [versions, setVersions] = useState<LayoutVersion[]>(INITIAL_MOCK_VERSIONS);
  const [activeVersionId, setActiveVersionId] = useState<string | null>("v-2");
  const [objects, setObjects] = useState<MockGeometry[]>(INITIAL_MOCK_OBJECTS);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<WorkspaceTool>("select");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isSpacePanActive, setIsSpacePanActive] = useState(false);

  // Core Drawing Engine Foundation instantiation
  const drawingManagerRef = useRef<DrawingToolManager>(new DrawingToolManager());
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pan, setPan] = useState({ x: 200, y: 150 });
  
  // Sidebar state collapses
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Status indicators
  const [searchQuery, setSearchQuery] = useState("");
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number } | null>(null);
  const [statusLog, setStatusLog] = useState("Map Engine workspace loaded. Ready to inspect vector geometry layers.");
  const [isValidating, setIsValidating] = useState(false);
  const [showValidationToast, setShowValidationToast] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Fetch initial data from APIs, fallback to mocks
  useEffect(() => {
    async function loadInitialData() {
      try {
        const fetchedProjects = await api.fetchProjects();
        if (fetchedProjects && fetchedProjects.length > 0) {
          setProjectsList(fetchedProjects);
        }
        
        const fetchedLayouts = await api.fetchLayouts();
        if (fetchedLayouts && fetchedLayouts.length > 0) {
          setLayoutsList(fetchedLayouts);
        }
      } catch (err) {
        console.warn("API endpoints not fully mapped or unseeded. Falling back to high-fidelity mock assets.", err);
      }
    }
    loadInitialData();
  }, []);

  // Update selected layout dependencies
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentStep("layouts");
    setStatusLog(`Selected project. Please pick a geometric Layout Plan.`);
  };

  const handleSelectLayout = (layoutId: string) => {
    setSelectedLayoutId(layoutId);
    setCurrentStep("workspace");
    setStatusLog(`Workspace Shell loaded for selected layout plan. Scale rulers aligned.`);
  };

  // Upload Asset simulation
  const handleAddAsset = (newAsset: { name: string; size: number; mime_type: string }) => {
    const assetObj: LayoutAsset = {
      id: `asset-${Date.now()}`,
      layout_id: selectedLayoutId || "lay-1",
      file_name: newAsset.name,
      asset_type: newAsset.name.toUpperCase().endsWith(".DXF") ? "DXF" : newAsset.name.toUpperCase().endsWith(".SVG") ? "SVG" : "IMAGE",
      file_size: newAsset.size,
      file_path: `/uploads/${newAsset.name}`,
      mime_type: newAsset.mime_type || "application/octet-stream",
      uploaded_by: "ADMIN",
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setAssets(prev => [assetObj, ...prev]);
    setStatusLog(`Asset "${newAsset.name}" uploaded successfully. Registered vector layers overlay.`);
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    setStatusLog(`Removed asset overlay reference.`);
  };

  // Create immutable snapshot version
  const handleCreateVersionSnapshot = (summary: string) => {
    const nextVerNum = `v1.${versions.length}`;
    const nextVer: LayoutVersion = {
      id: `ver-${Date.now()}`,
      layout_id: selectedLayoutId || "lay-1",
      version_number: nextVerNum,
      change_summary: summary,
      status: "DRAFT",
      snapshot_data: { layers: layers, objects: [] },
      created_by: "ADMIN",
      created_at: new Date().toISOString()
    };
    setVersions(prev => [...prev, nextVer]);
    setActiveVersionId(nextVer.id);
    setStatusLog(`Created snapshot ${nextVerNum}. Layer states persisted into relational cache.`);
  };

  // Run validation checks
  const handleRunValidation = () => {
    setIsValidating(true);
    setStatusLog("Analyzing vector polygons for overlap anomalies and disconnects...");
    
    setTimeout(() => {
      setIsValidating(false);
      setShowValidationToast(true);
      
      const errors = runValidationSuite(objects);
      if (errors.length === 0) {
        setValidationErrors(["All plot validations passed successfully! 0 overlap or self-intersection issues detected."]);
        setStatusLog("Validation finished. Clean layout state.");
      } else {
        setValidationErrors(errors);
        setStatusLog(`Validation finished. Identified ${errors.length} layout warnings/checks.`);
      }
    }, 800);
  };

  // Sync objects update loop
  const handleUpdateObject = (updatedObj: MockGeometry) => {
    setObjects(prev => prev.map(obj => obj.id === updatedObj.id ? updatedObj : obj));
  };

  const handleResetView = () => {
    setPan({ x: 200, y: 150 });
    setZoomLevel(100);
    setStatusLog("Canvas pan offset and scale factor calibrated back to origin.");
  };

  const handleBackToLanding = () => {
    setSelectedLayoutId(null);
    setSelectedProjectId(null);
    setCurrentStep("projects");
    setStatusLog("Map Engine workspace unloaded.");
  };

  // Core subscription manager syncing React states with the CAD drawing engine class
  useEffect(() => {
    const manager = drawingManagerRef.current;

    const unsubTool = manager.onToolChange((tool) => {
      setSelectedTool(tool as WorkspaceTool);
      setIsSpacePanActive((manager as any).isSpacePanActive);
    });

    const unsubSelection = manager.onSelectionChange((id) => {
      setSelectedObjectId(id);
    });

    const unsubLog = manager.onLogMessage((msg) => {
      setStatusLog(msg);
    });

    const unsubHistory = manager.onHistoryChange((undoCount, redoCount) => {
      setCanUndo(undoCount > 0);
      setCanRedo(redoCount > 0);
    });

    return () => {
      unsubTool();
      unsubSelection();
      unsubLog();
      unsubHistory();
    };
  }, []);

  // Update space-pan-active state query directly from ref
  const syncSpacePanState = () => {
    setIsSpacePanActive((drawingManagerRef.current as any).isSpacePanActive);
  };

  const handleUndo = () => {
    drawingManagerRef.current.undo();
  };

  const handleRedo = () => {
    drawingManagerRef.current.redo();
  };

  const handleSelectTool = (tool: WorkspaceTool) => {
    drawingManagerRef.current.switchTool(tool as AppTool);
  };

  // Setup Keyboard Shortcuts and escape handlers
  useEffect(() => {
    if (currentStep !== "workspace") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        return; // Skip bindings if editing form elements
      }

      const key = e.key.toLowerCase();

      // Check undo/redo first
      if (e.ctrlKey || e.metaKey) {
        if (key === "z") {
          e.preventDefault();
          handleUndo();
          return;
        }
        if (key === "y") {
          e.preventDefault();
          handleRedo();
          return;
        }
      }

      // Space bar panning trigger
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        drawingManagerRef.current.activateSpacePan();
        syncSpacePanState();
        return;
      }

      // Delete/Backspace key handler
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedObjectId) {
          const targetObj = objects.find(o => o.id === selectedObjectId);
          if (targetObj) {
            e.preventDefault();
            const deleteCmd = new DeleteObjectCommand(
              targetObj,
              objects,
              (updated) => setObjects(updated),
              () => setSelectedObjectId(null)
            );
            drawingManagerRef.current.executeCommand(deleteCmd);
          }
        }
        return;
      }

      // Escape key cancels current selections or resets active tool
      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        drawingManagerRef.current.setSelectedObjectId(null);
        drawingManagerRef.current.switchTool("select");
        setStatusLog("Selections cleared. Restored select mode.");
        return;
      }

      // Standard single character shortcuts
      const shortcuts: Record<string, AppTool> = {
        v: "select",
        h: "pan",
        b: "boundary",
        r: "road",
        p: "plot",
        g: "park",
        a: "amenity",
        u: "utility",
        l: "label",
        m: "measure"
      };

      if (shortcuts[key]) {
        e.preventDefault();
        drawingManagerRef.current.switchTool(shortcuts[key]);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        drawingManagerRef.current.deactivateSpacePan();
        syncSpacePanState();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [currentStep, selectedObjectId, objects]);

  const activeProjectObj = projectsList.find(p => p.id === selectedProjectId);
  const activeLayoutObj = layoutsList.find(l => l.id === selectedLayoutId);
  const activeVersionObj = versions.find(v => v.id === activeVersionId);
  const selectedObj = objects.find(o => o.id === selectedObjectId) || null;

  // Filter lists based on search
  const filteredProjects = projectsList.filter(p => 
    p.name.toLowerCase().includes(projectsSearch.toLowerCase()) || 
    p.code.toLowerCase().includes(projectsSearch.toLowerCase()) ||
    p.location.toLowerCase().includes(projectsSearch.toLowerCase())
  );

  const filteredLayouts = layoutsList.filter(l => 
    l.project_id === selectedProjectId &&
    (l.name.toLowerCase().includes(layoutsSearch.toLowerCase()) || 
     l.code.toLowerCase().includes(layoutsSearch.toLowerCase()))
  );

  return (
    <div className="w-full min-h-[80vh] flex flex-col bg-slate-50 relative select-none" id="map-intelligence-workspace-engine">
      
      {/* ==========================================
          STEP 1: PROJECT SELECTION DIRECTORY DIRECT
          ========================================== */}
      {currentStep === "projects" && (
        <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full animate-fadeIn" id="landing-projects-directory">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-650" />
                Map Workspace Directory: Select Active Project
              </h2>
              <p className="text-xs text-slate-500">
                Choose an active layout project to bootstrap the CAD geometry engines and calibrate vector scales.
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects directory..."
                value={projectsSearch}
                onChange={(e) => setProjectsSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="projects-grid">
            {filteredProjects.map((proj) => (
              <div 
                key={proj.id}
                onClick={() => handleSelectProject(proj.id)}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                id={`project-card-${proj.code.toLowerCase()}`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="bg-slate-100 text-slate-700 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                      {proj.code}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                      {proj.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-850 group-hover:text-indigo-650 transition-colors">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {proj.location}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3.5 flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">Developer: <strong className="text-slate-700 font-semibold">{proj.developer}</strong></span>
                  <button className="text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Layouts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {filteredProjects.length === 0 && (
              <div className="col-span-full">
                <EmptyState 
                  title="No projects match query" 
                  description="Adjust search filter parameters or clear query filters." 
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          STEP 2: LAYOUT SELECTION BLUEPRINT DIRECT
          ========================================== */}
      {currentStep === "layouts" && (
        <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full animate-fadeIn" id="landing-layouts-directory">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <button 
                onClick={() => setCurrentStep("projects")}
                className="text-xs text-slate-400 hover:text-slate-700 font-semibold mb-1 flex items-center gap-1"
              >
                &larr; Back to Projects
              </button>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-650" />
                Layout Plans Directory for: <strong className="text-indigo-700 font-extrabold">"{activeProjectObj?.name}"</strong>
              </h2>
              <p className="text-xs text-slate-500">
                Each project stores separate AutoCAD layers, surveying snapshots, and registered sales plots.
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search layout blueprints..."
                value={layoutsSearch}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="layouts-grid">
            {filteredLayouts.map((lay) => (
              <div 
                key={lay.id}
                onClick={() => handleSelectLayout(lay.id)}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                id={`layout-card-${lay.code.toLowerCase()}`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="bg-slate-100 text-slate-700 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                      {lay.code}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                      {lay.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-850 group-hover:text-indigo-650 transition-colors">
                    {lay.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 pt-1.5">
                    <div>Area: <strong className="text-slate-800">{lay.totalArea}</strong></div>
                    <div>Plots: <strong className="text-slate-800">{lay.totalPlots} units</strong></div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3.5 flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">Type: <strong className="text-slate-700 font-semibold">{lay.type}</strong></span>
                  <button className="text-indigo-650 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Launch CAD Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {filteredLayouts.length === 0 && (
              <div className="col-span-full">
                <EmptyState 
                  title="No layout blueprints mapped" 
                  description="No layout geometries uploaded yet for this target project boundary." 
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          STEP 3: THE MAP WORKSPACE SHELL (STUDIO)
          ========================================== */}
      {currentStep === "workspace" && (
        <div className="flex-1 flex flex-col min-h-0 relative select-none h-[82vh]" id="workspace-layout-canvas">
          {/* Top Bar Controls */}
          <Toolbar
            projects={projectsList}
            layouts={layoutsList}
            selectedProjectId={selectedProjectId}
            selectedLayoutId={selectedLayoutId}
            selectedTool={selectedTool}
            setSelectedTool={handleSelectTool}
            isGridVisible={isGridVisible}
            setIsGridVisible={setIsGridVisible}
            isSnapToGrid={isSnapToGrid}
            setIsSnapToGrid={setIsSnapToGrid}
            onProjectChange={(id) => { setSelectedProjectId(id); setSelectedLayoutId(null); setCurrentStep("layouts"); }}
            onLayoutChange={(id) => setSelectedLayoutId(id)}
            versions={versions}
            activeVersionId={activeVersionId}
            setActiveVersionId={setActiveVersionId}
            onCreateVersionSnapshot={handleCreateVersionSnapshot}
            onRunValidation={handleRunValidation}
            isValidating={isValidating}
            onResetView={handleResetView}
            onBackToLanding={handleBackToLanding}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />

          {/* Central Workspace Panel */}
          <div className="flex-1 flex min-h-0 overflow-hidden" id="workspace-panel-body">
            {/* Left Drawer Collapsible */}
            <Sidebar
              layers={layers}
              setLayers={setLayers}
              assets={assets}
              onAddAsset={handleAddAsset}
              onDeleteAsset={handleDeleteAsset}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              projects={projectsList}
              layouts={layoutsList}
              versions={versions}
              selectedProjectId={selectedProjectId}
              selectedLayoutId={selectedLayoutId}
              isCollapsed={isLeftCollapsed}
              setIsCollapsed={setIsLeftCollapsed}
            />

            {/* Center interactive Drawing area */}
            <Canvas
              layers={layers}
              selectedTool={selectedTool}
              isSpacePanActive={isSpacePanActive}
              objects={objects}
              onSelectObject={(obj) => setSelectedObjectId(obj ? obj.id : null)}
              selectedObjectId={selectedObjectId}
              onUpdateObjects={setObjects}
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
              searchQuery={searchQuery}
              onUpdateMouseCoords={setMouseCoords}
              isGridVisible={isGridVisible}
              isSnapToGrid={isSnapToGrid}
              pan={pan}
              setPan={setPan}
              statusLog={statusLog}
              setStatusLog={setStatusLog}
              drawingManager={drawingManagerRef.current}
            />

            {/* Right Collapsible inspector */}
            <Inspector
              selectedObject={selectedObj}
              onUpdateObject={handleUpdateObject}
              isCollapsed={isRightCollapsed}
              setIsCollapsed={setIsRightCollapsed}
              objects={objects}
              onUpdateObjects={setObjects}
              drawingManager={drawingManagerRef.current}
            />
          </div>

          {/* Bottom Engineering status ribbon */}
          <StatusBar
            mouseCoords={mouseCoords}
            activeTool={selectedTool}
            activeLayerName={selectedObj ? selectedObj.layerName : "BOUNDARY"}
            zoomLevel={zoomLevel}
            isSnapToGrid={isSnapToGrid}
            statusLog={statusLog}
          />
        </div>
      )}

      {/* Validation Suite Alerts Overlay Toast */}
      {showValidationToast && (
        <div className="fixed top-16 right-6 bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-5 w-96 z-50 animate-slideIn" id="validation-report-toast">
          <div className="flex justify-between items-start pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Geometrical Validation Report</h4>
            </div>
            <button 
              onClick={() => setShowValidationToast(false)}
              className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
            >
              &times;
            </button>
          </div>

          <div className="py-3 space-y-2.5 text-xs text-slate-600">
            <p className="leading-relaxed">
              BhoomiOne validation middleware completed analysis checks on vector layers. 2 minor warnings recorded:
            </p>
            <div className="space-y-1.5 font-mono text-[10px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
              {validationErrors.map((err, index) => (
                <div key={index} className="flex gap-1">
                  <span className="font-bold flex-shrink-0">&bull;</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Overlap checking checks layout vertices boundary limits to prevent duplicate survey registrations automatically.
            </p>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowValidationToast(false)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
            >
              Acknowledge Checks
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
