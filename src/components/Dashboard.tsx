import { UserProfile } from "../types/auth.ts";
import InventoryManager from "./InventoryManager.tsx";
import { InventoryManagerErrorBoundary } from "./InventoryManagerErrorBoundary.tsx";
import { LogOut, ShieldCheck } from "lucide-react";

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  return (
    <div className="space-y-6" id="dashboard-root">
      {/* 1. Header Hero Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6" id="dashboard-hero">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authenticated ERP Session Active</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight font-sans">
            Welcome Back, <span className="text-zinc-100">{user.name}</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            BhoomiOne Project Workspace &mdash; Complete operational workflow for projects, layouts, plots, and document tracking.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="bg-white hover:bg-slate-100 text-slate-900 font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          id="logout-btn"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>

      {/* 2. Streamlined Project-First ERP Workspace */}
      <InventoryManagerErrorBoundary>
        <InventoryManager user={user} />
      </InventoryManagerErrorBoundary>
    </div>
  );
}
