import React, { useState } from "react";
import { 
  MousePointer, 
  Hand, 
  Maximize2, 
  Grid3X3, 
  Magnet, 
  Play, 
  Layers, 
  Folder, 
  FileCode2, 
  Eye, 
  RotateCcw, 
  ChevronDown, 
  ChevronLeft,
  Plus,
  Loader2,
  Ruler,
  Square,
  Route,
  Grid,
  Trees,
  Building2,
  Wrench,
  Type,
  Undo2,
  Redo2
} from "lucide-react";
import { WorkspaceTool } from "./types.ts";

interface ToolbarProps {
  projects: any[];
  layouts: any[];
  selectedProjectId: string | null;
  selectedLayoutId: string | null;
  selectedTool: WorkspaceTool;
  setSelectedTool: (tool: WorkspaceTool) => void;
  isGridVisible: boolean;
  setIsGridVisible: (visible: boolean) => void;
  isSnapToGrid: boolean;
  setIsSnapToGrid: (snap: boolean) => void;
  onProjectChange: (projectId: string) => void;
  onLayoutChange: (layoutId: string) => void;
  versions: any[];
  activeVersionId: string | null;
  setActiveVersionId: (id: string) => void;
  onCreateVersionSnapshot: (summary: string) => void;
  onRunValidation: () => void;
  isValidating: boolean;
  onResetView: () => void;
  onBackToLanding: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export default function Toolbar({
  projects,
  layouts,
  selectedProjectId,
  selectedLayoutId,
  selectedTool,
  setSelectedTool,
  isGridVisible,
  setIsGridVisible,
  isSnapToGrid,
  setIsSnapToGrid,
  onProjectChange,
  onLayoutChange,
  versions,
  activeVersionId,
  setActiveVersionId,
  onCreateVersionSnapshot,
  onRunValidation,
  isValidating,
  onResetView,
  onBackToLanding,
  canUndo = false,
  canRedo = false,
  onUndo = () => {},
  onRedo = () => {}
}: ToolbarProps) {
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [newVersionSummary, setNewVersionSummary] = useState("");

  const filteredLayouts = layouts.filter(l => l.project_id === selectedProjectId);
  const activeProject = projects.find(p => p.id === selectedProjectId);
  const activeLayout = layouts.find(l => l.id === selectedLayoutId);
  const activeVersion = versions.find(v => v.id === activeVersionId);

  const handleCreateSnapshotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionSummary.trim()) return;
    onCreateVersionSnapshot(newVersionSummary);
    setNewVersionSummary("");
    setIsNewVersionModalOpen(false);
  };

  return (
    <div className="bg-white border-b border-slate-200/80 px-5 py-2 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] select-none antialiased" id="workspace-top-toolbar">
      {/* 1. Left Section: Back link and Project/Layout quick select */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToLanding}
          className="p-1.5 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 hover:text-slate-900 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="Back to Projects Directory"
          id="toolbar-back-btn"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold tracking-tight">Directory</span>
        </button>
        <span className="text-slate-200 text-sm">/</span>

        {/* Project Selector */}
        <div className="relative">
          <select
            value={selectedProjectId || ""}
            onChange={(e) => onProjectChange(e.target.value)}
            className="appearance-none bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 rounded-lg pl-3 pr-8 py-1.5 text-[11px] font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10 cursor-pointer transition-all shadow-xs"
            id="toolbar-project-select"
          >
            <option value="" disabled>Select Project...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Layout Selector */}
        <div className="relative">
          <select
            value={selectedLayoutId || ""}
            onChange={(e) => onLayoutChange(e.target.value)}
            className="appearance-none bg-slate-50/50 hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 rounded-lg pl-3 pr-8 py-1.5 text-[11px] font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10 cursor-pointer transition-all shadow-xs"
            id="toolbar-layout-select"
            disabled={!selectedProjectId}
          >
            <option value="" disabled>Select Layout Plan...</option>
            {filteredLayouts.map(l => (
              <option key={l.id} value={l.id}>[{l.code}] {l.name}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 2. Middle Section: Tool Palette + Undo/Redo Stack controls */}
      <div className="flex items-center gap-3">
        {/* Tool Palette */}
        <div className="flex items-center bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/60 shadow-inner" id="toolbar-tool-palette">
          {/* Navigation Category */}
          <div className="flex items-center pr-1 mr-1 border-r border-slate-200/80 gap-0.5">
            <button
              onClick={() => setSelectedTool("select")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "select" ? "bg-white text-indigo-650 shadow-sm font-bold ring-1 ring-slate-200/10" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Select object (V)"
              id="tool-select"
            >
              <MousePointer className={`w-3.5 h-3.5 ${selectedTool === "select" ? "text-indigo-600" : ""}`} />
              <span className="hidden xl:inline text-[11px]">Select</span>
            </button>
            <button
              onClick={() => setSelectedTool("pan")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "pan" ? "bg-white text-indigo-650 shadow-sm font-bold ring-1 ring-slate-200/10" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Pan Workspace (H) - Hold SPACE for temporary pan"
              id="tool-pan"
            >
              <Hand className={`w-3.5 h-3.5 ${selectedTool === "pan" ? "text-indigo-600" : ""}`} />
              <span className="hidden xl:inline text-[11px]">Pan</span>
            </button>
          </div>

          {/* Drawing/Vector Category */}
          <div className="flex items-center pr-1 mr-1 border-r border-slate-200/80 gap-0.5">
            <button
              onClick={() => setSelectedTool("boundary")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "boundary" ? "bg-white text-indigo-650 shadow-sm font-bold ring-1 ring-slate-200/10" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Boundary Limit Tool (B)"
              id="tool-boundary"
            >
              <Square className={`w-3.5 h-3.5 ${selectedTool === "boundary" ? "text-indigo-600" : ""}`} />
              <span className="hidden xl:inline text-[11px]">Boundary</span>
            </button>

            <button
              onClick={() => setSelectedTool("road")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "road" ? "bg-white text-indigo-650 shadow-sm font-bold ring-1 ring-slate-200/10" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Road Alignment Tool (R)"
              id="tool-road"
            >
              <Route className={`w-3.5 h-3.5 ${selectedTool === "road" ? "text-indigo-600" : ""}`} />
              <span className="hidden xl:inline text-[11px]">Road</span>
            </button>

            <button
              onClick={() => setSelectedTool("plot")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "plot" ? "bg-white text-indigo-650 shadow-sm font-bold ring-1 ring-slate-200/10" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Subdivided Plot Tool (P)"
              id="tool-plot"
            >
              <Grid className={`w-3.5 h-3.5 ${selectedTool === "plot" ? "text-indigo-600" : ""}`} />
              <span className="hidden xl:inline text-[11px]">Plot</span>
            </button>

            <button
              onClick={() => setSelectedTool("park")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "park" ? "bg-white text-indigo-650 shadow-sm font-bold ring-1 ring-slate-200/10" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Parks & Green Zone Tool (G)"
              id="tool-park"
            >
              <Trees className={`w-3.5 h-3.5 ${selectedTool === "park" ? "text-indigo-600" : ""}`} />
              <span className="hidden xl:inline text-[11px]">Park</span>
            </button>

            <button
              onClick={() => setSelectedTool("amenity")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "amenity" ? "bg-white text-indigo-650 shadow-sm font-bold ring-1 ring-slate-200/10" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Community Amenity Tool (A)"
              id="tool-amenity"
            >
              <Building2 className={`w-3.5 h-3.5 ${selectedTool === "amenity" ? "text-indigo-600" : ""}`} />
              <span className="hidden xl:inline text-[11px]">Amenity</span>
            </button>

            <button
              onClick={() => setSelectedTool("utility")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "utility" ? "bg-white text-indigo-650 shadow-sm font-bold ring-1 ring-slate-200/10" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Utility Line Alignment Tool (U)"
              id="tool-utility"
            >
              <Wrench className={`w-3.5 h-3.5 ${selectedTool === "utility" ? "text-indigo-600" : ""}`} />
              <span className="hidden xl:inline text-[11px]">Utility</span>
            </button>

            <button
              onClick={() => setSelectedTool("label")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedTool === "label" ? "bg-white text-indigo-650 shadow-sm font-bold ring-1 ring-slate-200/10" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Geometric Text Label Cursor (L)"
              id="tool-label"
            >
              <Type className={`w-3.5 h-3.5 ${selectedTool === "label" ? "text-indigo-600" : ""}`} />
              <span className="hidden xl:inline text-[11px]">Label</span>
            </button>
          </div>

          {/* Analytics Category */}
          <button
            onClick={() => setSelectedTool("measure")}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedTool === "measure" ? "bg-white text-indigo-650 shadow-sm font-bold ring-1 ring-slate-200/10" : "text-slate-500 hover:text-slate-900"
            }`}
            title="CAD Scale Measure (M)"
            id="tool-measure"
          >
            <Ruler className={`w-3.5 h-3.5 ${selectedTool === "measure" ? "text-indigo-600" : ""}`} />
            <span className="hidden xl:inline text-[11px]">Measure</span>
          </button>
        </div>

        {/* Command Pattern History Controls */}
        <div className="flex items-center bg-slate-100/85 p-0.5 rounded-xl border border-slate-200/60 shadow-inner" id="toolbar-history-stack">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              canUndo ? "text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-sm" : "text-slate-300 cursor-not-allowed opacity-50"
            }`}
            title="Undo action (Ctrl+Z)"
            id="btn-undo-history"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              canRedo ? "text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-sm" : "text-slate-300 cursor-not-allowed opacity-50"
            }`}
            title="Redo action (Ctrl+Y)"
            id="btn-redo-history"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Right Section: Version dropdown, validation triggers & view controls */}
      <div className="flex items-center gap-3">
        {/* Version Engine Selector */}
        <div className="relative">
          <button
            onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            id="toolbar-version-btn"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Version: {activeVersion?.version_number || "v1.0"}</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
              activeVersion?.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-blue-50 text-blue-700 border-blue-100"
            }`}>
              {activeVersion?.status || "DRAFT"}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isVersionDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 text-xs animate-fadeIn" id="toolbar-version-menu">
              <div className="px-3 py-1 border-b border-slate-100 mb-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Historical Versions</span>
              </div>
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setActiveVersionId(v.id);
                    setIsVersionDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    activeVersionId === v.id ? "bg-indigo-50/40 text-indigo-900 font-bold" : "text-slate-600"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-mono">{v.version_number}</span>
                    <span className="text-[9px] text-slate-400 font-sans truncate max-w-[140px]">{v.change_summary}</span>
                  </div>
                  <span className={`px-1 rounded text-[8px] font-bold ${
                    v.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-blue-50 text-blue-700 border-blue-100"
                  }`}>
                    {v.status}
                  </span>
                </button>
              ))}
              <div className="px-2 pt-2 border-t border-slate-100 mt-1.5">
                <button
                  onClick={() => {
                    setIsVersionDropdownOpen(false);
                    setIsNewVersionModalOpen(true);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create Snapshot v1.2</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Validation Suite Button */}
        <button
          onClick={onRunValidation}
          disabled={isValidating || !selectedLayoutId}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
          title="Analyze active layer for geometrical alignment overlaps and road networks"
          id="toolbar-validate-btn"
        >
          {isValidating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>Run Validation Suite</span>
        </button>

        <span className="text-slate-350">|</span>

        {/* View toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsGridVisible(!isGridVisible)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isGridVisible ? "bg-slate-100 text-slate-800 border-slate-200" : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
            }`}
            title="Toggle Grid lines"
            id="btn-grid-toggle"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsSnapToGrid(!isSnapToGrid)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isSnapToGrid ? "bg-slate-100 text-slate-800 border-slate-200" : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
            }`}
            title="Toggle Snap to Grid coordinates"
            id="btn-snap-toggle"
          >
            <Magnet className="w-4 h-4" />
          </button>
          <button
            onClick={onResetView}
            className="p-1.5 rounded-lg border bg-white text-slate-400 border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
            title="Reset canvas pan & zoom coordinates"
            id="btn-view-reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* New Version Snapshot Modal */}
      {isNewVersionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Create Geometric Layout Snapshot</span>
              </h3>
              <button 
                onClick={() => setIsNewVersionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-base font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSnapshotSubmit} className="space-y-4 text-xs">
              <p className="text-slate-500 leading-normal">
                This will save the current active layer configurations, style overrides, and boundary object coordinates into a new immutable, audit-logged version.
              </p>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Change Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Added park buffer plots, modified main highway road lines"
                  value={newVersionSummary}
                  onChange={(e) => setNewVersionSummary(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewVersionModalOpen(false)}
                  className="px-3.5 py-2 font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Save Snapshot v1.2
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
