import { UserProfile } from "../types/auth.ts";
import InventoryManager from "./InventoryManager.tsx";
import { InventoryManagerErrorBoundary } from "./InventoryManagerErrorBoundary.tsx";
import { LogOut, ShieldCheck, HelpCircle } from "lucide-react";

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  return (
    <div className="space-y-6 md:space-y-8" id="dashboard-root">
      {/* 1. Header Hero Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md border border-slate-800/80 antialiased relative overflow-hidden" id="dashboard-hero">
        {/* Subtle decorative mesh background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none" />
        
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 text-slate-300 border border-slate-700/60 text-[10px] font-mono uppercase tracking-wider font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authenticated ERP Session Active</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-display text-zinc-50 leading-none">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs md:text-[13px] text-slate-400 max-w-xl leading-relaxed">
            BhoomiOne V3 Project Workspace &mdash; Configure development sites, upload architectural CAD drawings, and track plot inventory status records dynamically.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full md:w-auto mt-2 md:mt-0">
          <button
            onClick={onLogout}
            className="flex-1 md:flex-initial bg-white hover:bg-slate-50 text-slate-900 font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            id="logout-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Account</span>
          </button>
        </div>
      </div>

      {/* 2. Streamlined Project-First ERP Workspace */}
      <InventoryManagerErrorBoundary>
        <InventoryManager user={user} />
      </InventoryManagerErrorBoundary>
    </div>
  );
}
