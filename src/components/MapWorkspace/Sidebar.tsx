import React, { useState, useRef } from "react";
import { 
  FolderOpen, 
  Layers, 
  Search, 
  FileText, 
  UploadCloud, 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  ChevronRight, 
  ChevronDown,
  Building,
  MapPin,
  GitBranch,
  CircleDot,
  FileCode2,
  ListFilter
} from "lucide-react";
import { GeometryLayer, LayoutAsset } from "../../MapEngine/Contracts/models.ts";

interface SidebarProps {
  layers: GeometryLayer[];
  setLayers: React.Dispatch<React.SetStateAction<GeometryLayer[]>>;
  assets: LayoutAsset[];
  onAddAsset: (asset: { name: string; size: number; mime_type: string }) => void;
  onDeleteAsset: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  projects: any[];
  layouts: any[];
  versions: any[];
  selectedProjectId: string | null;
  selectedLayoutId: string | null;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({
  layers,
  setLayers,
  assets,
  onAddAsset,
  onDeleteAsset,
  searchQuery,
  setSearchQuery,
  projects,
  layouts,
  versions,
  selectedProjectId,
  selectedLayoutId,
  isCollapsed,
  setIsCollapsed
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<"assets" | "layers" | "search" | "explorer">("layers");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    projectsRoot: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Toggle tree node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Toggle Layer visibility
  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => 
      prev.map(l => l.id === layerId ? { ...l, is_visible: !l.is_visible } : l)
    );
  };

  // Toggle Layer lock state
  const toggleLayerLock = (layerId: string) => {
    setLayers(prev => 
      prev.map(l => l.id === layerId ? { ...l, is_locked: !l.is_locked } : l)
    );
  };

  // Drag and drop handlers for Uploader
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      onAddAsset({
        name: file.name,
        size: file.size,
        mime_type: file.type || "application/octet-stream"
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onAddAsset({
        name: file.name,
        size: file.size,
        mime_type: file.type || "application/octet-stream"
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const activeProject = projects.find(p => p.id === selectedProjectId);
  const activeLayout = layouts.find(l => l.id === selectedLayoutId);

  return (
    <div 
      className={`border-r border-slate-200 bg-white flex transition-all duration-300 relative select-none ${
        isCollapsed ? "w-12" : "w-80"
      }`}
      id="workspace-left-sidebar"
    >
      {/* A. Vertical Tab Strip */}
      <div className="w-12 border-r border-slate-100 flex flex-col items-center py-4 gap-4 flex-shrink-0 bg-slate-50/70" id="sidebar-tab-strip">
        <button
          onClick={() => { setIsCollapsed(false); setActiveTab("explorer"); }}
          className={`p-2 rounded-lg transition-all cursor-pointer ${
            !isCollapsed && activeTab === "explorer" ? "bg-indigo-50 text-indigo-600 font-extrabold" : "text-slate-400 hover:text-slate-700"
          }`}
          title="Project Explorer"
          id="btn-tab-explorer"
        >
          <FolderOpen className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setIsCollapsed(false); setActiveTab("layers"); }}
          className={`p-2 rounded-lg transition-all cursor-pointer ${
            !isCollapsed && activeTab === "layers" ? "bg-indigo-50 text-indigo-600 font-extrabold" : "text-slate-400 hover:text-slate-700"
          }`}
          title="Layer Configuration"
          id="btn-tab-layers"
        >
          <Layers className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setIsCollapsed(false); setActiveTab("assets"); }}
          className={`p-2 rounded-lg transition-all cursor-pointer ${
            !isCollapsed && activeTab === "assets" ? "bg-indigo-50 text-indigo-600 font-extrabold" : "text-slate-400 hover:text-slate-700"
          }`}
          title="Asset Manager"
          id="btn-tab-assets"
        >
          <FileText className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setIsCollapsed(false); setActiveTab("search"); }}
          className={`p-2 rounded-lg transition-all cursor-pointer ${
            !isCollapsed && activeTab === "search" ? "bg-indigo-50 text-indigo-600 font-extrabold" : "text-slate-400 hover:text-slate-700"
          }`}
          title="Search Objects"
          id="btn-tab-search"
        >
          <Search className="w-5 h-5" />
        </button>

        <div className="mt-auto">
          {/* Toggle sidebar collapse handler */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            id="sidebar-toggle-trigger"
          >
            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "" : "rotate-180"}`} />
          </button>
        </div>
      </div>

      {/* B. Active Content Drawer Panel */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-w-0 animate-fadeIn" id="sidebar-drawer-panel">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-2">
              {activeTab === "explorer" && <FolderOpen className="w-4 h-4 text-indigo-600" />}
              {activeTab === "layers" && <Layers className="w-4 h-4 text-indigo-600" />}
              {activeTab === "assets" && <FileText className="w-4 h-4 text-indigo-600" />}
              {activeTab === "search" && <Search className="w-4 h-4 text-indigo-600" />}
              <span>
                {activeTab === "explorer" && "Project Explorer"}
                {activeTab === "layers" && "Geometry Layers"}
                {activeTab === "assets" && "Layout Assets"}
                {activeTab === "search" && "Canvas Search Engine"}
              </span>
            </h3>
            <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono uppercase">
              {activeTab}
            </span>
          </div>

          {/* Drawer Body content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" id="sidebar-drawer-body">
            
            {/* 1. PROJECT EXPLORER TREE VIEW */}
            {activeTab === "explorer" && (
              <div className="space-y-2 text-xs text-slate-600 font-sans" id="explorer-tree-root">
                {/* Root Projects Node */}
                <div className="space-y-1">
                  <div 
                    onClick={() => toggleNode("projectsRoot")}
                    className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-slate-50 cursor-pointer font-bold text-slate-800 select-none"
                  >
                    {expandedNodes.projectsRoot ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                    <Building className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Projects Hub Directory</span>
                  </div>

                  {expandedNodes.projectsRoot && (
                    <div className="pl-4 space-y-1 border-l border-slate-100 ml-2.5 pt-0.5">
                      {projects.map((proj) => {
                        const isProjSelected = proj.id === selectedProjectId;
                        const projNodeId = `proj-${proj.id}`;
                        const projLayouts = layouts.filter(l => l.project_id === proj.id);

                        return (
                          <div key={proj.id} className="space-y-1">
                            <div 
                              onClick={() => toggleNode(projNodeId)}
                              className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-all ${
                                isProjSelected ? "bg-indigo-50/50 text-indigo-900 font-semibold" : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              {expandedNodes[projNodeId] ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{proj.name}</span>
                            </div>

                            {/* Layouts list of Project */}
                            {expandedNodes[projNodeId] && (
                              <div className="pl-4 space-y-1 border-l border-slate-100 ml-2 pt-0.5">
                                {projLayouts.map((lay) => {
                                  const isLaySelected = lay.id === selectedLayoutId;
                                  const layNodeId = `lay-${lay.id}`;

                                  return (
                                    <div key={lay.id} className="space-y-1">
                                      <div 
                                        onClick={() => toggleNode(layNodeId)}
                                        className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded cursor-pointer transition-all ${
                                          isLaySelected ? "bg-indigo-100/60 text-indigo-950 font-bold" : "hover:bg-slate-50 text-slate-600"
                                        }`}
                                      >
                                        {expandedNodes[layNodeId] ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                                        <FileCode2 className="w-3 h-3 text-slate-400" />
                                        <span className="truncate">{lay.name}</span>
                                      </div>

                                      {/* Children nodes under Layout: Versions, Assets, Layers */}
                                      {expandedNodes[layNodeId] && (
                                        <div className="pl-4 space-y-1 border-l border-slate-100 ml-2 text-[11px] text-slate-500 pt-0.5">
                                          {/* Versions */}
                                          <div className="py-0.5 px-1 hover:bg-slate-50 rounded flex items-center gap-1.5">
                                            <GitBranch className="w-2.5 h-2.5 text-indigo-400" />
                                            <span>Versions ({versions.length})</span>
                                          </div>
                                          {/* Assets */}
                                          <div className="py-0.5 px-1 hover:bg-slate-50 rounded flex items-center gap-1.5">
                                            <FileText className="w-2.5 h-2.5 text-indigo-400" />
                                            <span>Assets ({assets.length})</span>
                                          </div>
                                          {/* Layers */}
                                          <div className="py-0.5 px-1 hover:bg-slate-50 rounded flex items-center gap-1.5">
                                            <Layers className="w-2.5 h-2.5 text-indigo-400" />
                                            <span>Layers ({layers.length})</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {projLayouts.length === 0 && (
                                  <span className="text-[10px] text-slate-400 pl-4 italic block">No layouts cataloged</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. GEOMETRY LAYERS PANEL */}
            {activeTab === "layers" && (
              <div className="space-y-2 text-xs" id="layers-engine-list">
                <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                  Configure visual filters, locks, and arrangement priority order of geometry objects.
                </p>

                {layers.map((layer, index) => {
                  const style = layer.style_config || {};
                  return (
                    <div 
                      key={layer.id} 
                      className={`p-2 rounded-xl border flex items-center justify-between transition-all ${
                        layer.is_visible ? "bg-white border-slate-200 shadow-xs" : "bg-slate-50/50 border-slate-150 text-slate-400"
                      }`}
                      id={`sidebar-layer-row-${layer.layer_name.toLowerCase()}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Layer Color Preview dot */}
                        <span 
                          className="w-3 h-3 rounded-full flex-shrink-0 border border-black/10"
                          style={{ backgroundColor: style.strokeColor || "#CBD5E1" }}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate leading-tight">{layer.display_name}</p>
                          <p className="text-[9px] text-slate-400 font-mono tracking-wide">ORDER: {index + 1} &bull; WT: {style.strokeWidth || 1}px</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Visibility Toggle button */}
                        <button
                          onClick={() => toggleLayerVisibility(layer.id)}
                          className={`p-1 hover:bg-slate-100 rounded-md transition-colors cursor-pointer ${
                            layer.is_visible ? "text-slate-600 hover:text-slate-900" : "text-slate-300"
                          }`}
                          title={layer.is_visible ? "Hide Layer" : "Show Layer"}
                          id={`btn-visible-${layer.id}`}
                        >
                          {layer.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        {/* Lock Toggle button */}
                        <button
                          onClick={() => toggleLayerLock(layer.id)}
                          className={`p-1 hover:bg-slate-100 rounded-md transition-colors cursor-pointer ${
                            layer.is_locked ? "text-amber-600 hover:text-amber-800" : "text-slate-300 hover:text-slate-500"
                          }`}
                          title={layer.is_locked ? "Unlock Layer editing" : "Lock Layer editing"}
                          id={`btn-lock-${layer.id}`}
                        >
                          {layer.is_locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. LAYOUT ASSETS MANAGER */}
            {activeTab === "assets" && (
              <div className="space-y-4 text-xs" id="assets-panel-container">
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Upload layouts references, AutoCAD designs, or coordinate maps to overlay on the active canvas.
                </p>

                {/* Upload drag drop box */}
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    dragActive 
                      ? "border-indigo-500 bg-indigo-50/50" 
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-300"
                  }`}
                  id="assets-uploader-zone"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.dxf,.svg"
                  />
                  <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-xs text-indigo-500">
                    <UploadCloud className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Upload design asset</p>
                    <p className="text-[9px] text-slate-400 mt-1">Drag DXF, SVG, PDF or Image (Max 10MB)</p>
                  </div>
                </div>

                {/* Assets list ledger */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1">
                    <span>Registered Assets ({assets.length})</span>
                    <ListFilter className="w-3.5 h-3.5" />
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-150 rounded-xl bg-white overflow-hidden max-h-60 overflow-y-auto shadow-xs" id="assets-list-ledger">
                    {assets.map((asset) => (
                      <div 
                        key={asset.id} 
                        className="p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                        id={`asset-item-${asset.id}`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-slate-800 truncate" title={asset.file_name}>{asset.file_name}</p>
                          <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-400 mt-0.5">
                            <span className="bg-slate-100 text-slate-600 px-1 rounded uppercase font-bold">{asset.asset_type}</span>
                            <span>{formatBytes(asset.file_size)}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => onDeleteAsset(asset.id)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-all cursor-pointer"
                          title="Delete asset overlay"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {assets.length === 0 && (
                      <div className="p-8 text-center text-slate-400 italic text-[11px]" id="assets-empty-display">
                        No active file overlays yet. Upload drawing maps above.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. CANVAS SEARCH ENGINE PANEL */}
            {activeTab === "search" && (
              <div className="space-y-3 text-xs" id="search-engine-panel">
                <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                  Query specific coordinate bounding boxes, layout boundary pins, or plot numbers registered in BhoomiOne ERP.
                </p>

                {/* Search query box */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search plot number (e.g. Plot 101)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 pl-9 pr-8 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
                    id="search-panel-input"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Search suggestion indexes */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Suggested Queries</span>
                  
                  <div className="grid grid-cols-2 gap-1.5" id="search-suggestions">
                    {["Plot 101", "Plot 104", "Main Highway", "Sector Park", "Commercial CA", "Boundary Outline"].map((term) => (
                      <button
                        key={term}
                        onClick={() => setSearchQuery(term)}
                        className="p-2 text-left bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-900 border border-slate-150 rounded-lg text-[10px] transition-colors cursor-pointer truncate font-medium"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live search feedback */}
                {searchQuery && (
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1 animate-fadeIn" id="search-feedback-box">
                    <span className="text-[9px] font-bold text-indigo-800 uppercase tracking-wider">Canvas Indexer Status</span>
                    <p className="text-[11px] text-indigo-900 font-medium">
                      Filtering geometries matching <strong className="font-extrabold text-indigo-950">"{searchQuery}"</strong>
                    </p>
                    <p className="text-[9px] text-indigo-500 leading-normal">
                      Dynamic query resolved. Matched layers are highlighted on the center workspace canvas.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
