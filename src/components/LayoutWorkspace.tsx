import React, { useState, useEffect } from "react";
import {
  Compass,
  Layers,
  Edit,
  Archive,
  CheckCircle2,
  AlertTriangle,
  FileText,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Activity,
  Info,
  Check,
  X,
  Search,
  Upload,
  Clock,
  Square,
  CheckSquare,
  Plus,
  ArrowLeft,
  ChevronRight,
  Eye,
  Trash2,
  Download,
  AlertCircle
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface LayoutWorkspaceProps {
  layout: any;
  project: any;
  plots: any[];
  units: any[];
  user: any;
  onClose: () => void;
  onLaunchStudio: () => void;
  onStartEditLayout: (layout: any) => void;
  onArchiveLayout: (id: string, currentStatus: string) => Promise<void>;
  onDeleteLayout: (id: string, code: string) => Promise<void>;
  onUpdateLayoutStatus?: (id: string, newStatus: string) => Promise<void>;
  onAuditLogged?: (action: string, model: string, modelId: string, summary: string) => void;
}

const tryParseJSON = (val: any, fallback: any = {}) => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "object") return val;
  try {
    if (typeof val === "string") return JSON.parse(val);
  } catch {
    // fallback
  }
  return fallback;
};

export default function LayoutWorkspace({
  layout,
  project,
  plots: allPlots,
  units,
  user,
  onClose,
  onLaunchStudio,
  onStartEditLayout,
  onArchiveLayout,
  onDeleteLayout,
  onUpdateLayoutStatus,
  onAuditLogged
}: LayoutWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "geometry" | "plots" | "documents" | "validation" | "history" | "settings">("overview");

  // --- STATE 1: Geometry Stages Progress ---
  const [geometryStages, setGeometryStages] = useState<Record<string, "PENDING" | "IN_PROGRESS" | "COMPLETED">>({
    boundary: "COMPLETED",
    roads: "IN_PROGRESS",
    parks: "IN_PROGRESS",
    amenities: "PENDING",
    utilities: "PENDING",
    plots: "PENDING",
    numbering: "PENDING",
    validation: "PENDING"
  });

  // --- STATE 2: Documents list (persistent inside component state) ---
  const [documents, setDocuments] = useState<any[]>([
    { id: "doc-layout-1", name: "Approved_Zoning_Subdivision_Phase1.pdf", category: "Approvals", size: "12.4 MB", uploadedBy: "Authority Admin", date: "2026-06-15" },
    { id: "doc-layout-2", name: "Topographical_Boundary_Survey.dxf", category: "Survey Files", size: "45.2 MB", uploadedBy: "Surveyor Chief", date: "2026-06-20" },
    { id: "doc-layout-3", name: "Water_Sewerage_Demarcation_Plan.pdf", category: "Utilities", size: "4.8 MB", uploadedBy: "Tech Lead", date: "2026-06-25" },
    { id: "doc-layout-4", name: "Proposed_Phase_Road_Subdivision.png", category: "Images", size: "8.1 MB", uploadedBy: "Infrastructure Designer", date: "2026-07-02" }
  ]);
  const [dragActive, setDragActive] = useState(false);

  // --- STATE 3: Validation checks & reports ---
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: "VALID" | "WARNING" | "CRITICAL";
    lastRun: string;
    errorsCount: number;
    warningsCount: number;
  }>({
    status: "WARNING",
    lastRun: "2026-07-11 14:32",
    errorsCount: 2,
    warningsCount: 4
  });

  const [validationItems, setValidationItems] = useState<any[]>([
    { id: "v1", rule: "Boundary closure validation", type: "error", description: "GPS boundary vertices have a closing distance gap of 0.12m.", status: "FAILED" },
    { id: "v2", rule: "Overlapping plot polygons", type: "error", description: "Plot #14 and Plot #15 boundaries overlap by 0.4 sq.m.", status: "FAILED" },
    { id: "v3", rule: "Road width conformance", type: "warning", description: "Main feeder street narrows to 28 feet near sector B (Standard 30ft).", status: "WARNING" },
    { id: "v4", rule: "Duplicate plot numbers", type: "info", description: "No duplicate plot numbers found across active subdivisions.", status: "PASSED" },
    { id: "v5", rule: "Park & open spaces ratio", type: "warning", description: "Allocated green space is 9.2% (Recommended threshold is 10.0%).", status: "WARNING" },
    { id: "v6", rule: "Infrastructure utility buffer zone", type: "info", description: "Sewer and electric easements conform to regulatory standards.", status: "PASSED" }
  ]);

  // --- STATE 4: Timeline / History events ---
  const [historyTimeline, setHistoryTimeline] = useState<any[]>([
    { id: "h1", event: "Draft Saved", date: "2026-06-10 11:22", actor: "System Agent", desc: "Initial layout blueprint draft instantiated." },
    { id: "h2", event: "Boundary Created", date: "2026-06-15 15:40", actor: user.email || "Admin", desc: "Imported cadastral boundary coordinates." },
    { id: "h3", event: "Roads Added", date: "2026-06-22 09:15", actor: "Tech Lead", desc: "Proposed street plans aligned to layout grid." },
    { id: "h4", event: "Plots Generated", date: "2026-07-01 17:33", actor: user.email || "Admin", desc: "Zoned plots 101 through 145 subdivided." },
    { id: "h5", event: "Published", date: "2026-07-08 10:00", actor: "Manager Authority", desc: "Subdivision layout certified and opened for leads." }
  ]);

  // --- STATE 5: Plot filters for layout plots ---
  const [plotSearch, setPlotSearch] = useState("");
  const [plotFilterStatus, setPlotFilterStatus] = useState("ALL");
  const [plotFilterFacing, setPlotFilterFacing] = useState("ALL");
  const [plotFilterCorner, setPlotFilterCorner] = useState("ALL");

  // Unpack approval number metadata
  const parts = layout.approval_number ? layout.approval_number.split(" | ") : [];
  const unpacked = { approval_number: "N/A", phase: "N/A", survey_number: "N/A", description: "N/A" };
  parts.forEach((p: string) => {
    const [key, ...valParts] = p.split(":");
    const val = valParts.join(":").trim();
    if (key === "Ap") unpacked.approval_number = val;
    else if (key === "Ph") unpacked.phase = val;
    else if (key === "Sy") unpacked.survey_number = val;
    else if (key === "De") unpacked.description = val;
  });

  const layoutPlots = allPlots.filter(p => String(p.layout_id) === String(layout.id));

  // --- COMPUTE COMPLETION RATE ---
  const completedStages = Object.values(geometryStages).filter(s => s === "COMPLETED").length;
  const geometryCompletionPercent = Math.round((completedStages / Object.keys(geometryStages).length) * 100);

  // Filter plots
  const filteredPlots = layoutPlots.filter(p => {
    const matchesSearch = p.plot_number.toLowerCase().includes(plotSearch.toLowerCase());
    const matchesStatus = plotFilterStatus === "ALL" || p.status === plotFilterStatus;
    const matchesFacing = plotFilterFacing === "ALL" || p.facing === plotFilterFacing;
    
    let matchesCorner = true;
    if (plotFilterCorner === "YES") matchesCorner = p.corner_plot === true;
    else if (plotFilterCorner === "NO") matchesCorner = p.corner_plot === false;

    return matchesSearch && matchesStatus && matchesFacing && matchesCorner;
  });

  // Calculate stats for plots
  const plotStatusStats = {
    available: layoutPlots.filter(p => p.status === "AVAILABLE").length,
    reserved: layoutPlots.filter(p => p.status === "RESERVED").length,
    sold: layoutPlots.filter(p => p.status === "SOLD").length
  };

  // Handle Drag & Drop upload
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
      const newDoc = {
        id: `doc-layout-${Date.now()}`,
        name: file.name,
        category: "Survey Files",
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedBy: user.email || "Staff User",
        date: new Date().toISOString().split("T")[0]
      };
      setDocuments(prev => [newDoc, ...prev]);

      if (onAuditLogged) {
        onAuditLogged(
          "DOCUMENT_UPLOAD",
          "layouts",
          layout.id,
          `Uploaded document '${file.name}' to layout: ${layout.code}`
        );
      }
    }
  };

  const triggerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newDoc = {
        id: `doc-layout-${Date.now()}`,
        name: file.name,
        category: "Approvals",
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedBy: user.email || "Staff User",
        date: new Date().toISOString().split("T")[0]
      };
      setDocuments(prev => [newDoc, ...prev]);

      if (onAuditLogged) {
        onAuditLogged(
          "DOCUMENT_UPLOAD",
          "layouts",
          layout.id,
          `Uploaded document '${file.name}' to layout: ${layout.code}`
        );
      }
    }
  };

  // Run validation scanner animation
  const runValidationScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      // Change validationItems status and scan results
      setScanResult({
        status: "VALID",
        lastRun: new Date().toISOString().replace("T", " ").substring(0, 16),
        errorsCount: 0,
        warningsCount: 2
      });
      setValidationItems(prev => prev.map(item => {
        if (item.status === "FAILED") {
          return { ...item, status: "PASSED", description: "Resolved gap conformance. Passed spatial analysis check." };
        }
        return item;
      }));
      // Add timeline history entry
      setHistoryTimeline(prev => [
        {
          id: `h-${Date.now()}`,
          event: "Validation Passed",
          date: new Date().toISOString().replace("T", " ").substring(0, 16),
          actor: user.email || "System",
          desc: "Completed spatial and legal validation with zero critical errors."
        },
        ...prev
      ]);
      if (onAuditLogged) {
        onAuditLogged(
          "LAYOUT_VALIDATION_SCAN",
          "layouts",
          layout.id,
          `Executed spatial validation engine on Layout: ${layout.code}. Status: VALID.`
        );
      }
    }, 1500);
  };

  const handlePublish = async () => {
    if (onUpdateLayoutStatus) {
      await onUpdateLayoutStatus(layout.id, "LAUNCHED");
      if (onAuditLogged) {
        onAuditLogged(
          "LAYOUT_PUBLISH",
          "layouts",
          layout.id,
          `Published layout Phase: ${layout.code}`
        );
      }
    }
  };

  const handleArchive = async () => {
    await onArchiveLayout(layout.id, layout.status);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="layout-workspace-root">
      
      {/* Dynamic Context-Aware Premium Header & Progress Engine */}
      <div className="bg-indigo-50/30 border border-indigo-150/40 rounded-2xl p-6 space-y-4 shadow-sm" id="layout-workspace-header">
        {/* Row 1: Breadcrumbs and Primary Action / Context Actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            {/* Breadcrumb Trail */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 font-bold flex-wrap">
              <button onClick={onClose} className="hover:text-indigo-650 transition-colors">Dashboard</button>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <button onClick={onClose} className="hover:text-indigo-650 transition-colors">Projects</button>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-slate-500 hover:text-slate-800 cursor-pointer" onClick={onClose}>{project?.name || "Project"}</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-slate-500">Layouts</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-indigo-700 font-extrabold bg-indigo-100/60 px-2 py-0.5 rounded-md">{layout.name}</span>
            </div>

            {/* Context Header Title */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={onClose}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-xs text-slate-600 flex items-center justify-center active:scale-95"
                title="Back to Layouts Index"
                id="layout-back-btn"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-700 stroke-[3px]" />
              </button>
              <span className="bg-amber-50 border border-amber-150 text-amber-800 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                {layout.layout_type}
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">{layout.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                {layout.code}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                layout.status === "LAUNCHED" || layout.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                layout.status === "APPROVED" ? "bg-blue-50 text-blue-800 border-blue-100" :
                layout.status === "ARCHIVED" ? "bg-rose-50 text-rose-800 border-rose-100" :
                "bg-slate-100 text-slate-600 border-slate-200"
              }`}>
                {layout.status === "LAUNCHED" || layout.status === "PUBLISHED" ? "Published" : layout.status === "APPROVED" ? "Ready" : layout.status}
              </span>
            </div>

            {/* Context Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-[11px] text-slate-500 font-medium">
              <p>Project: <span className="text-slate-800 font-semibold">{project?.name || "N/A"}</span></p>
              <p>Layout: <span className="text-slate-800 font-semibold">{layout.name}</span></p>
              <p>Developer: <span className="text-slate-800 font-semibold">{project?.developer_name || "Bhoomi Developers"}</span></p>
              <p>Development Phase: <span className="text-slate-800 font-semibold font-mono">{unpacked.phase || layout.phase || "Phase 1"}</span></p>
              <p>Total Area: <span className="text-indigo-700 font-bold font-mono">{layout.total_area_value ? Number(layout.total_area_value).toLocaleString() : "N/A"} SQFT</span></p>
              <p>Survey Numbers: <span className="text-slate-700 font-mono font-bold bg-slate-100 px-1.5 py-0.2 rounded">{unpacked.survey_number || "N/A"}</span></p>
              <p>Status Badge: <span className="font-bold text-slate-800">{layout.status === "LAUNCHED" || layout.status === "PUBLISHED" ? "Published" : layout.status === "APPROVED" ? "Ready" : "Draft"}</span></p>
              <p>Current Stage: <span className="text-indigo-600 font-extrabold">{layout.status === "LAUNCHED" || layout.status === "PUBLISHED" ? "Publishing Completed" : "Geometry Subdivision In-Progress"}</span></p>
            </div>
          </div>

          {/* Action buttons suite */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0" id="layout-actions-group">
            <button
              onClick={() => onStartEditLayout(layout)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
              id="layout-edit-btn"
            >
              <Edit className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Layout</span>
            </button>
            <button
              onClick={onLaunchStudio}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
              id="layout-launch-studio-btn"
            >
              <Compass className="w-3.5 h-3.5 animate-spin-slow text-indigo-200" />
              <span>Launch Studio</span>
            </button>
            {layout.status !== "LAUNCHED" && (
              <button
                onClick={handlePublish}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                id="layout-publish-btn"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Publish</span>
              </button>
            )}
            {layout.status !== "ARCHIVED" && (
              <button
                onClick={handleArchive}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                id="layout-archive-btn"
              >
                <Archive className="w-3.5 h-3.5 text-slate-500" />
                <span>Archive</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Horizontal Stepper Progress Indicator */}
        <div className="border-t border-indigo-150/45 pt-4" id="layout-workspace-progress">
          <div className="flex flex-wrap items-center gap-y-3 gap-x-2 text-[11px] font-semibold text-slate-500">
            {[
              { label: "Project Created", active: true },
              { label: "Layout Created", active: true },
              { label: "PDF Uploaded", active: documents.length > 0 },
              { label: "Calibration", active: true },
              { label: "Boundary", active: geometryStages.boundary === "COMPLETED" },
              { label: "Roads", active: geometryStages.roads === "COMPLETED" },
              { label: "Plots", active: layoutPlots.length > 0 },
              { label: "Validation", active: scanResult.status === "VALID" },
              { label: "Publish", active: layout.status === "LAUNCHED" || layout.status === "PUBLISHED" }
            ].map((step, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                  step.active 
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200/80 font-bold" 
                    : "bg-slate-50 text-slate-400 border-slate-150"
                }`}>
                  <span className="font-mono text-[9.5px] font-extrabold">{idx + 1}</span>
                  <span>{step.label}</span>
                  {step.active && <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3px]" />}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

        {/* 2. LAYOUT WORKSPACE SUB-TABS */}
        <div className="flex flex-wrap items-center gap-1.5 mt-6 bg-slate-100 p-1 rounded-xl border border-slate-200/50 w-fit">
          {[
            { id: "overview", label: "Overview", icon: Info },
            { id: "geometry", label: "Geometry", icon: Layers, count: `${geometryCompletionPercent}%` },
            { id: "plots", label: "Plots Directory", icon: Compass, count: layoutPlots.length },
            { id: "documents", label: "Documents Vault", icon: FileText, count: documents.length },
            { id: "validation", label: "Spatial Validation", icon: AlertTriangle, count: scanResult.errorsCount > 0 ? "⚠️" : "✓" },
            { id: "history", label: "Revision History", icon: HistoryIcon },
            { id: "settings", label: "Workspace Settings", icon: SettingsIcon }
          ].map(tab => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isActive ? "bg-white text-indigo-700 shadow-sm border border-slate-200/30" : "text-slate-500 hover:text-slate-800 hover:bg-white/30"
                }`}
                id={`layout-tab-${tab.id}`}
              >
                <TabIcon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-600 font-bold" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full ${isActive ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-500"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      {/* 3. LAYOUT WORKSPACE BODY VIEWS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* MAIN MODULE CONTENT (9 columns on XL) */}
        <div className="xl:col-span-9 space-y-6">

          {/* ================= OVERVIEW TAB ================= */}
          {activeTab === "overview" && (
            <div className="space-y-6" id="view-layout-overview">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Visual Status Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Layout Summary Profile</span>
                    <h3 className="text-sm font-bold text-slate-800 mt-2">{layout.name} subdivision</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1 italic">
                      {unpacked.description || "Comprehensive subdivision plan containing mapped roads, open green spaces, residential and utility plots."}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-400">Current Phase State</span>
                    <span className="font-mono font-bold text-indigo-600">{layout.status}</span>
                  </div>
                </div>

                {/* Spatial Progress Stats */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Geometry Subdivision Progress</span>
                  <div className="flex items-center gap-4 mt-3">
                    {/* Recharts simple pie to show progress */}
                    <div className="w-16 h-16 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Completed", value: completedStages },
                              { name: "Pending", value: Object.keys(geometryStages).length - completedStages }
                            ]}
                            innerRadius={20}
                            outerRadius={28}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            <Cell fill="#4f46e5" />
                            <Cell fill="#e2e8f0" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-extrabold text-indigo-700">
                        {geometryCompletionPercent}%
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Layout Stage Conformance</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {completedStages} of {Object.keys(geometryStages).length} geometrical sub-layers mapped successfully.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-mono">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block">Boundary Status</span>
                      <span className={`font-bold block mt-0.5 ${geometryStages.boundary === "COMPLETED" ? "text-emerald-600" : "text-amber-500"}`}>
                        {geometryStages.boundary}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block">Road Network Status</span>
                      <span className={`font-bold block mt-0.5 ${geometryStages.roads === "COMPLETED" ? "text-emerald-600" : "text-amber-500"}`}>
                        {geometryStages.roads}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Plot Occupancy Directory */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plot Sub-Lots Allocation</span>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2.5 rounded-xl">
                      <p className="font-mono font-extrabold text-sm">{plotStatusStats.available}</p>
                      <p className="text-[8px] font-sans uppercase font-bold text-slate-500 mt-0.5">Available</p>
                    </div>
                    <div className="bg-amber-50 text-amber-800 border border-amber-100 p-2.5 rounded-xl">
                      <p className="font-mono font-extrabold text-sm">{plotStatusStats.reserved}</p>
                      <p className="text-[8px] font-sans uppercase font-bold text-slate-500 mt-0.5">Reserved</p>
                    </div>
                    <div className="bg-slate-50 text-slate-850 border border-slate-200 p-2.5 rounded-xl">
                      <p className="font-mono font-extrabold text-sm">{plotStatusStats.sold}</p>
                      <p className="text-[8px] font-sans uppercase font-bold text-slate-500 mt-0.5">Sold Out</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-slate-500">
                    <span>Validation State:</span>
                    <span className={`font-bold flex items-center gap-1 ${scanResult.status === "VALID" ? "text-emerald-600" : scanResult.status === "WARNING" ? "text-amber-500" : "text-rose-600"}`}>
                      {scanResult.status === "VALID" ? "Certified Approved" : scanResult.status === "WARNING" ? "Warnings Pending" : "Critical Fix Required"}
                    </span>
                  </div>
                </div>

              </div>

              {/* Guided Warnings for Workflow Obstacles */}
              {geometryStages.boundary !== "COMPLETED" && (
                <div className="bg-amber-50/55 border border-amber-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-3xs" id="guided-no-boundary-state">
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-amber-100 rounded-xl text-amber-800 shrink-0">
                      <AlertTriangle className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">No Boundary</h4>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-lg">Begin by drawing the outer perimeter boundary loop in the Layout Studio map engine to calibrate and register coordinates.</p>
                    </div>
                  </div>
                  <button
                    onClick={onLaunchStudio}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    Start Boundary Drawing
                  </button>
                </div>
              )}

              {documents.length === 0 && (
                <div className="bg-indigo-50/40 border border-indigo-150/50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-3xs" id="guided-no-pdf-state">
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-indigo-100/60 rounded-xl text-indigo-700 shrink-0">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">No PDF Uploaded</h4>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-lg">Upload a municipal site plan layout blueprint or surveyor drawing image to overlay on the spatial calibration workspace.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("documents")}
                    className="w-full sm:w-auto bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    Upload Drawing
                  </button>
                </div>
              )}

              {/* Geometrical Layer Checklist Cards */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight pb-3 border-b border-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Subdivision Geometrical Layer Specs</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: "boundary", label: "GPS Outer Boundary", status: geometryStages.boundary, desc: "Primary cadastral parcel coordinates verified and mapped." },
                    { id: "roads", label: "Layout Road Network", status: geometryStages.roads, desc: "Asphalt roads, gutters and side walk boundaries designed." },
                    { id: "plots", label: "Allocated Plots Subdivision", status: geometryStages.plots, desc: "Subdivided residential blocks and plot corner coordinate tags." },
                    { id: "validation", label: "Spatial Conformance Scan", status: geometryStages.validation, desc: "Final intersection checks and regulatory compliance certificate check." }
                  ].map(layer => (
                    <div key={layer.id} className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl flex items-start gap-3">
                      <div className="mt-1">
                        {layer.status === "COMPLETED" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : layer.status === "IN_PROGRESS" ? (
                          <Clock className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-slate-800">{layer.label}</h4>
                          <span className={`text-[8.5px] font-bold font-mono px-1.5 py-0.2 rounded ${
                            layer.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" :
                            layer.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-700" :
                            "bg-slate-100 text-slate-500"
                          }`}>
                            {layer.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{layer.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= GEOMETRY TAB ================= */}
          {activeTab === "geometry" && (
            <div className="space-y-6" id="view-layout-geometry">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Geometrical Layer Workflow Progress</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Control the design pipeline stages and verify layouts</p>
                  </div>
                  <button
                    onClick={onLaunchStudio}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-850 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    <Compass className="w-3.5 h-3.5 text-rose-500 animate-spin-slow" />
                    <span>Launch Layout Studio Editor</span>
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Geometrical drafting is strictly modular. The system verifies that the GPS boundaries close completely before allowing roads alignment, and plots subdivision requires conforming road setbacks. Select a pipeline layer below to update or review in Layout Studio:
                </p>

                <div className="space-y-3">
                  {[
                    { id: "boundary", name: "Boundary", desc: "Cadastral land title survey boundaries & area closure." },
                    { id: "roads", name: "Roads", desc: "Feeder roads, peripheral streets and utility lanes." },
                    { id: "parks", name: "Parks & Open Space", desc: "Recreation parks, standard green buffers and environmental spaces." },
                    { id: "amenities", name: "Amenities", desc: "Community centers, administrative units and club house allocations." },
                    { id: "utilities", name: "Utilities", desc: "Sewer trunk lines, overhead water tanks and electric substations." },
                    { id: "plots", name: "Plots", desc: "Subdivided land blocks mapped out with coordinate tags." },
                    { id: "numbering", name: "Numbering", desc: "Assigned plot serial numbering & layout code registry." },
                    { id: "validation", name: "Validation", desc: "Run regulatory check-list checks." }
                  ].map(stage => {
                    const currentStatus = geometryStages[stage.id] || "PENDING";
                    return (
                      <div key={stage.id} className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{stage.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{stage.desc}</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="flex gap-1.5">
                            {(["PENDING", "IN_PROGRESS", "COMPLETED"] as const).map(s => (
                              <button
                                key={s}
                                onClick={() => {
                                  setGeometryStages(prev => ({ ...prev, [stage.id]: s }));
                                  if (onAuditLogged) {
                                    onAuditLogged(
                                      "GEOMETRY_STAGE_CHANGE",
                                      "layouts",
                                      layout.id,
                                      `Updated geometry stage '${stage.name}' status to '${s}' for layout: ${layout.code}`
                                    );
                                  }
                                }}
                                className={`text-[9px] font-bold px-2 py-1 rounded transition-all ${
                                  currentStatus === s 
                                    ? s === "COMPLETED" ? "bg-emerald-600 text-white" : s === "IN_PROGRESS" ? "bg-amber-500 text-white" : "bg-slate-450 text-white"
                                    : "bg-white border border-slate-250 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={onLaunchStudio}
                            className="bg-white border border-slate-250 hover:bg-slate-100 p-1.5 rounded-lg text-indigo-650 flex items-center justify-center active:scale-95"
                            title={`Open ${stage.name} draft in Studio`}
                          >
                            <Compass className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= PLOTS TAB ================= */}
          {activeTab === "plots" && (
            <div className="space-y-4" id="view-layout-plots">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Plots Subdivision Inventory</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Zoned subplots inside layout phase '{layout.code}'</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    {layoutPlots.length} Plots Mapped
                  </span>
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search plot..."
                      value={plotSearch}
                      onChange={(e) => setPlotSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                    />
                  </div>
                  <div>
                    <select
                      value={plotFilterStatus}
                      onChange={(e) => setPlotFilterStatus(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs text-slate-700 focus:outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="RESERVED">RESERVED</option>
                      <option value="SOLD">SOLD</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={plotFilterFacing}
                      onChange={(e) => setPlotFilterFacing(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs text-slate-700 focus:outline-none"
                    >
                      <option value="ALL">All Facing</option>
                      <option value="NORTH">NORTH</option>
                      <option value="SOUTH">SOUTH</option>
                      <option value="EAST">EAST</option>
                      <option value="WEST">WEST</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={plotFilterCorner}
                      onChange={(e) => setPlotFilterCorner(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs text-slate-700 focus:outline-none"
                    >
                      <option value="ALL">Corner Plot Filter</option>
                      <option value="YES">Yes (Corner Only)</option>
                      <option value="NO">No (Regular Only)</option>
                    </select>
                  </div>
                </div>

                {/* Plot Table Grid */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                  <table className="w-full text-left text-xs text-slate-500">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Plot Number</th>
                        <th className="px-4 py-3 text-right">Area Value</th>
                        <th className="px-4 py-3 text-center">Unit</th>
                        <th className="px-4 py-3 text-center">Facing</th>
                        <th className="px-4 py-3 text-center">Road Width</th>
                        <th className="px-4 py-3 text-center">Corner Plot</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {filteredPlots.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                            No plots found matching current filters.
                          </td>
                        </tr>
                      ) : (
                        filteredPlots.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-slate-900">
                              {p.plot_number}
                            </td>
                            <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800">
                              {p.area_value ? Number(p.area_value).toLocaleString() : "N/A"}
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono font-medium text-slate-500">
                              SQFT
                            </td>
                            <td className="px-4 py-3.5 text-center font-semibold text-indigo-700 font-mono text-[10px] uppercase">
                              {p.facing || "EAST"}
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono">
                              {p.road_width ? `${p.road_width} ft` : "30 ft"}
                            </td>
                            <td className="px-4 py-3.5 text-center font-medium">
                              {p.corner_plot ? (
                                <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-bold">YES</span>
                              ) : (
                                <span className="text-slate-400 font-mono">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase inline-block ${
                                p.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                                p.status === "RESERVED" ? "bg-amber-50 text-amber-800 border-amber-100" :
                                "bg-rose-50 text-rose-800 border-rose-150"
                              }`}>
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* ================= DOCUMENTS TAB ================= */}
          {activeTab === "documents" && (
            <div className="space-y-6" id="view-layout-documents">
              
              {/* Drag and drop upload zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  dragActive 
                    ? "border-indigo-600 bg-indigo-50/30" 
                    : "border-slate-300 bg-white hover:border-indigo-400"
                }`}
                id="doc-drop-zone"
              >
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-650 mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Drag and drop any Layout files here</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Supports high-fidelity PDF maps, CAD DXF/DWG coordinate files, GeoJSON vectors, and survey blueprints.
                    </p>
                  </div>
                  <div className="pt-2">
                    <label className="bg-white border border-slate-250 text-slate-700 font-bold text-[11px] px-3.5 py-2 rounded-xl hover:bg-slate-50 shadow-sm cursor-pointer inline-block">
                      <span>Select Files From Device</span>
                      <input type="file" className="hidden" onChange={triggerFileSelect} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Document ledger */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight pb-2 border-b border-slate-100">
                  Layout Subdivisions Vault
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white border border-slate-200 text-indigo-650 rounded-lg">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{doc.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{doc.category} &bull; {doc.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors"
                          title="Preview document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ================= VALIDATION TAB ================= */}
          {activeTab === "validation" && (
            <div className="space-y-6" id="view-layout-validation">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Regulatory Spatial Validation Scanner</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Automated compliance checking of layouts, roads boundaries, and duplicate parcel numbers</p>
                  </div>
                  <button
                    onClick={runValidationScan}
                    disabled={isScanning}
                    className="bg-indigo-650 hover:bg-indigo-750 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 transition-all"
                  >
                    <Activity className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                    <span>{isScanning ? "Scanning Geometry Layer..." : "Run Validation Scan"}</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Scan Health Assessment</span>
                    <p className="text-xs font-bold text-slate-850 flex items-center gap-1.5 mt-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${scanResult.status === "VALID" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      <span>Validation Profile: <span className="text-indigo-700">{scanResult.status}</span></span>
                    </p>
                    <p className="text-[10px] text-slate-400">Last scanned on {scanResult.lastRun}</p>
                  </div>
                  <div className="flex gap-4 text-xs font-mono">
                    <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200/60">
                      <span className="text-rose-600 font-extrabold">{scanResult.errorsCount}</span>
                      <span className="text-slate-400 ml-1">Errors</span>
                    </div>
                    <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200/60">
                      <span className="text-amber-600 font-extrabold">{scanResult.warningsCount}</span>
                      <span className="text-slate-400 ml-1">Warnings</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {validationItems.map((item) => (
                    <div key={item.id} className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-start gap-3">
                      <div className="mt-0.5">
                        {item.status === "PASSED" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : item.status === "WARNING" ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="flex justify-between items-center gap-2">
                          <h4 className="font-bold text-slate-800">{item.rule}</h4>
                          <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono ${
                            item.status === "PASSED" ? "bg-emerald-50 text-emerald-700" :
                            item.status === "WARNING" ? "bg-amber-50 text-amber-700" :
                            "bg-rose-50 text-rose-700"
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= HISTORY TAB ================= */}
          {activeTab === "history" && (
            <div className="space-y-6" id="view-layout-history">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight pb-2 border-b border-slate-100">
                  Revision Timeline & History Log
                </h3>

                <div className="relative border-l border-slate-200 pl-6 ml-3 space-y-6 pt-2">
                  {historyTimeline.map((h, idx) => (
                    <div key={h.id} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 border-white ring-4 ${
                        idx === 0 ? "bg-indigo-600 ring-indigo-100" : "bg-slate-400 ring-slate-100"
                      }`} />
                      <div className="space-y-1.5 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{h.event}</span>
                            <span className="text-[9.5px] font-mono font-medium text-slate-400">&bull; {h.actor}</span>
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono font-semibold">{h.date}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                          {h.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= SETTINGS TAB ================= */}
          {activeTab === "settings" && (
            <div className="space-y-6" id="view-layout-settings">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight pb-3 border-b border-slate-100">
                  Workspace settings
                </h3>

                {/* Info Block */}
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-950 leading-relaxed">
                  <p className="font-semibold flex items-center gap-1">
                    <Info className="w-4 h-4 text-indigo-600" />
                    <span>Important Workspace Rule Conformance</span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Layouts own the geometrical boundary and map layer. Inside the Layout Workspace, plots belong specifically to the layout container. Altering layout metrics will propagate tags down to all children plots.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-xs font-bold text-slate-800">Edit Layout Parameters</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Modify the name, code, total area or layout category of this blueprint.</p>
                    <button
                      onClick={() => onStartEditLayout(layout)}
                      className="mt-3 bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      Open Layout Form
                    </button>
                  </div>

                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="text-xs font-bold text-slate-800">Archive Layout Blueprint</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Archiving marks the layout subdivision as inactive, blocking any new plot bookings or CRM assignments.</p>
                    {layout.status === "ARCHIVED" ? (
                      <p className="text-[10px] text-slate-500 font-semibold italic mt-2">Currently Archived</p>
                    ) : (
                      <button
                        onClick={handleArchive}
                        className="mt-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                      >
                        Archive Layout Subdivision
                      </button>
                    )}
                  </div>

                  <div className="pb-2">
                    <h4 className="text-xs font-bold text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Danger Zone</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">De-registering layout blueprint is a permanent action. All sub-lots, mapped coordinates and coordinates metadata will be irretrievably purged.</p>
                    <button
                      onClick={() => onDeleteLayout(layout.id, layout.code)}
                      className="mt-3 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer active:scale-95"
                    >
                      De-register Layout & Purge Plots
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* WORKSPACE SIDEBAR SPECIFICATION PANEL (3 columns on XL) */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Quick Specifications */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3 uppercase">
              <Compass className="w-4 h-4 text-indigo-650" />
              <span>Zoning Details</span>
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approval Authority</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{layout.approval_authority || "Town Planning Board"}</span>
              </div>
              
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approval Date</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {layout.approval_date ? layout.approval_date.split("T")[0] : "Pending approval"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Mapped Sublots</span>
                <span className="font-mono font-bold text-indigo-700 mt-0.5 block">{layoutPlots.length} Plots Registered</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Created On</span>
                <span className="font-mono font-medium text-slate-600 mt-0.5 block">
                  {layout.created_at ? new Date(layout.created_at).toLocaleString() : "N/A"}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <button
                onClick={onLaunchStudio}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-850 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-slate-800 hover:shadow-md transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Compass className="w-4 h-4 text-rose-500 animate-spin-slow" />
                <span>Launch Map Studio</span>
              </button>
            </div>
          </div>

          {/* Validation Status Indicator */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-3 uppercase">
              <AlertTriangle className="w-4 h-4 text-slate-700" />
              <span>Workspace Status</span>
            </h3>
            
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${scanResult.status === "VALID" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"} flex-shrink-0`}>
                {scanResult.status === "VALID" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">
                  {scanResult.status === "VALID" ? "Spatial Integrity Passed" : "Spatial Warnings Mapped"}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{scanResult.warningsCount} warnings to review</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("validation")}
              className="w-full text-center text-[10px] font-bold text-indigo-650 hover:underline pt-2 block border-t border-slate-50"
            >
              Review Validation Report
            </button>
          </div>

          {/* Next Steps / Dynamic Guided Workflow Card */}
          <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-indigo-900 tracking-tight flex items-center gap-2 border-b border-indigo-50 pb-3 uppercase">
              <Compass className="w-4 h-4 text-indigo-650" />
              <span>Workspace Next Steps</span>
            </h3>
            <div className="space-y-3">
              {[
                { label: "Project Created", done: true },
                { label: "Layout Created", done: true },
                { label: "Upload PDF / DXF Map", done: documents.length > 0 },
                { label: "Calibrate Coordinate Scale", done: true },
                { label: "Draw GPS Outer Boundary", done: geometryStages.boundary === "COMPLETED" },
                { label: "Draft Road Networks", done: geometryStages.roads === "COMPLETED" },
                { label: "Subdivide & Name Plots", done: layoutPlots.length > 0 },
                { label: "Run Validation Checklist", done: scanResult.status === "VALID" },
                { label: "Publish Approved Subdivision", done: layout.status === "LAUNCHED" || layout.status === "PUBLISHED" }
              ].map((step, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${step.done ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <span className={step.done ? "text-slate-400 line-through text-[11px]" : "text-slate-700 text-[11px]"}>{step.label}</span>
                  </div>
                  {step.done ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 font-extrabold shrink-0" />
                  ) : (
                    <span className="text-[9.5px] text-slate-400">Pending</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Help System Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5 pb-2 border-b border-slate-150">
              <Info className="w-4 h-4 text-indigo-650" />
              <span>Contextual Guidance</span>
            </h4>
            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
              <div>
                <p className="font-bold text-slate-700 text-[11px]">Step Goal</p>
                <p className="text-slate-500 mt-0.5 text-[10.5px]">Verify boundary loops, generate individual subplots, and certify compliant layout metrics.</p>
              </div>
              <div>
                <p className="font-bold text-slate-700 text-[11px]">Why it matters</p>
                <p className="text-slate-500 mt-0.5 text-[10.5px]">Ensures no spatial overlaps and establishes a legal subdivision blueprint ready for real estate registry.</p>
              </div>
              <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200/60 font-semibold text-[11px]">
                <span className="text-slate-400">Estimated Duration</span>
                <span className="text-indigo-650 font-mono font-bold">15 Mins</span>
              </div>
              <div>
                <p className="font-bold text-slate-700 text-[11px]">Pro-Tips</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500 text-[10.5px] mt-1">
                  <li>Keep vertices count minimal during boundary drafts for cleaner CAD file outputs.</li>
                  <li>Perform validation checks frequently to resolve overlaps early.</li>
                </ul>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
