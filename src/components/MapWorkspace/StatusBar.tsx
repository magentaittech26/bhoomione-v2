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
    <div className="bg-slate-900 text-slate-300 border-t border-slate-950 px-4 py-2 flex items-center justify-between gap-4 font-mono text-[10px] select-none h-9" id="workspace-status-bar">
      {/* 1. Left Section: Cursor Tracker and Tool State */}
      <div className="flex items-center gap-4">
        {/* Real-time coordinates */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded text-zinc-400 border border-slate-800" id="status-coords">
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
        <div className="flex items-center gap-1" id="status-tool">
          {activeTool === "select" && <MousePointer className="w-3 h-3 text-indigo-400" />}
          {activeTool === "pan" && <Move className="w-3 h-3 text-indigo-400" />}
          {activeTool === "measure" && <Ruler className="w-3 h-3 text-indigo-400" />}
          <span className="text-slate-500 uppercase">Tool:</span>
          <span className="font-bold text-zinc-100 uppercase">{activeTool}</span>
        </div>

        {/* Active Layer mapping */}
        <div className="hidden md:flex items-center gap-1" id="status-active-layer">
          <Database className="w-3 h-3 text-indigo-400" />
          <span className="text-slate-500 uppercase">Layer:</span>
          <span className="font-bold text-zinc-100 uppercase">{activeLayerName || "NONE SELECTED"}</span>
        </div>
      </div>

      {/* 2. Middle Section: Dynamic Status Log Marquee */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5 justify-center text-center">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
        <span className="text-slate-400 truncate max-w-md select-text" id="status-log-message">
          {statusLog || "Ready. Select vectors to calibrate plot parameters."}
        </span>
      </div>

      {/* 3. Right Section: Snapping, Zoom, and Version State */}
      <div className="flex items-center gap-4">
        {/* Snapping */}
        <div className="flex items-center gap-1" id="status-snapping">
          <span className="text-slate-500">SNAP:</span>
          <span className={`font-bold ${isSnapToGrid ? "text-emerald-400" : "text-rose-400"}`}>
            {isSnapToGrid ? "ON (1.0m)" : "OFF"}
          </span>
        </div>

        {/* Zoom Level */}
        <div className="flex items-center gap-1" id="status-zoom">
          <Maximize2 className="w-3 h-3 text-slate-500" />
          <span className="text-slate-500">ZOOM:</span>
          <span className="font-bold text-zinc-100">{zoomLevel}%</span>
        </div>

        {/* Sync session badge */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded text-emerald-400 border border-slate-800" id="status-connection-badge">
          <GitBranch className="w-3 h-3 text-emerald-400" />
          <span>V3 PLATFORM ONLINE</span>
        </div>
      </div>
    </div>
  );
}
