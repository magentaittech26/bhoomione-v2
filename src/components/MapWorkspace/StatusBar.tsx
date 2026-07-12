import React from "react";
import { 
  Activity, 
  MousePointer, 
  Move, 
  Ruler, 
  Maximize2, 
  AlertCircle,
  Database,
  Lock,
  GitBranch
} from "lucide-react";
import { WorkspaceTool } from "./types.ts";

interface StatusBarProps {
  mouseCoords: { x: number; y: number } | null;
  activeTool: WorkspaceTool;
  activeLayerName: string | null;
  zoomLevel: number;
  isSnapToGrid: boolean;
  statusLog: string;
}

export default function StatusBar({
  mouseCoords,
  activeTool,
  activeLayerName,
  zoomLevel,
  isSnapToGrid,
  statusLog
}: StatusBarProps) {
  return (
    <div className="bg-slate-950 text-slate-400 border-t border-slate-900 px-5 py-2.5 flex items-center justify-between gap-4 font-mono text-[10px] select-none h-10 antialiased" id="workspace-status-bar">
      {/* 1. Left Section: Cursor Tracker and Tool State */}
      <div className="flex items-center gap-5">
        {/* Real-time coordinates */}
        <div className="flex items-center gap-1.5 bg-slate-900/50 px-2.5 py-1 rounded text-zinc-350 border border-slate-800" id="status-coords">
          <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>
            X: {mouseCoords ? `${mouseCoords.x.toFixed(1)}m` : "0.0m"}
          </span>
          <span className="text-slate-800">|</span>
          <span>
            Y: {mouseCoords ? `${mouseCoords.y.toFixed(1)}m` : "0.0m"}
          </span>
        </div>

        {/* Active Tool label */}
        <div className="flex items-center gap-1.5" id="status-tool">
          {activeTool === "select" && <MousePointer className="w-3 h-3 text-indigo-400" />}
          {activeTool === "pan" && <Move className="w-3 h-3 text-indigo-400" />}
          {activeTool === "measure" && <Ruler className="w-3 h-3 text-indigo-400" />}
          <span className="text-slate-650 uppercase">Tool:</span>
          <span className="font-semibold text-zinc-200 uppercase">{activeTool}</span>
        </div>

        {/* Active Layer mapping */}
        <div className="hidden md:flex items-center gap-1.5" id="status-active-layer">
          <Database className="w-3 h-3 text-indigo-400" />
          <span className="text-slate-650 uppercase">Layer:</span>
          <span className="font-semibold text-zinc-200 uppercase">{activeLayerName || "NONE"}</span>
        </div>
      </div>

      {/* 2. Middle Section: Dynamic Status Log Marquee */}
      <div className="flex-1 min-w-0 flex items-center gap-2 justify-center text-center">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
        <span className="text-slate-300 truncate max-w-md select-text tracking-wide" id="status-log-message">
          {statusLog || "Ready. Select vectors to calibrate plot parameters."}
        </span>
      </div>

      {/* 3. Right Section: Snapping, Zoom, and Version State */}
      <div className="flex items-center gap-5">
        {/* Snapping */}
        <div className="flex items-center gap-1.5" id="status-snapping">
          <span className="text-slate-650">SNAP:</span>
          <span className={`font-bold tracking-tight ${isSnapToGrid ? "text-emerald-400" : "text-rose-400/95"}`}>
            {isSnapToGrid ? "ON (1.0m)" : "OFF"}
          </span>
        </div>

        {/* Zoom Level */}
        <div className="flex items-center gap-1.5" id="status-zoom">
          <Maximize2 className="w-3 h-3 text-slate-600" />
          <span className="text-slate-650">ZOOM:</span>
          <span className="font-bold text-zinc-200">{zoomLevel}%</span>
        </div>

        {/* Sync session badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/50 px-2.5 py-1 rounded text-emerald-400 border border-slate-800 font-medium" id="status-connection-badge">
          <GitBranch className="w-3 h-3 text-emerald-400" />
          <span>V3 PLATFORM ONLINE</span>
        </div>
      </div>
    </div>
  );
}
