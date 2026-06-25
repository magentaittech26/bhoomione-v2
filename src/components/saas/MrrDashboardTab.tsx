import React, { useState, useEffect } from "react";
import { 
  TrendingUp, Users, Shield, Server, CreditCard, Activity, IndianRupee, Cloud, 
  BarChart, ArrowUpRight, CheckCircle2, AlertCircle, RefreshCw, Layers, Box, Calendar, Clock, Terminal, HardDrive
} from "lucide-react";
import { api } from "../../lib/api.ts";
import { formatCurrency } from "../../lib/currency.ts";

export default function MrrDashboardTab() {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error("Failed to load dashboard stats:", err);
      setError("Unable to compile real-time SaaS database metrics.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white border border-slate-200 rounded-2xl shadow-xs" id="dashboard-loading">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500 font-sans tracking-wide uppercase">Compiling Executive SaaS Ledger Statistics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3" id="dashboard-error">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
        <p className="text-xs font-bold text-red-950 font-sans uppercase tracking-wide">Error Loading Dashboard Metrics</p>
        <p className="text-xs text-red-700 max-w-md mx-auto">{error || "Ensure database migrations and seeders are fully synced."}</p>
        <button 
          onClick={loadDashboardStats}
          className="mt-2 bg-red-100 hover:bg-red-200 text-red-900 font-bold text-xs px-4 py-2 rounded-xl transition-all border border-red-300"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans" id="executive-saas-dashboard">
      
      {/* 1. TOP EXECUTIVE REVENUE & STATUS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="executive-kpi-grid">
        
        {/* Card 1: MRR & ARR */}
        <div className="bg-slate-900 border border-slate-950 p-5 rounded-2xl text-white space-y-3 relative overflow-hidden shadow-lg" id="kpi-mrr">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Platform MRR & ARR</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Monthly Recurring Revenue</p>
            <h3 className="text-2xl font-extrabold text-slate-50 font-mono tracking-tight">
              {formatCurrency(stats.mrr)}
            </h3>
            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>Projected ARR: {formatCurrency(stats.arr)}/yr</span>
            </p>
          </div>
          <div className="text-[10px] text-slate-400 pt-3 border-t border-slate-800 flex justify-between font-mono">
            <span>Dynamic DB Driven</span>
            <span>12.0x ARR Ratio</span>
          </div>
        </div>

        {/* Card 2: TODAY'S REVENUE PROJECTION */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs" id="kpi-today-revenue">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Today's Revenue</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <BarChart className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Prorated Daily Run Rate</p>
            <h3 className="text-2xl font-extrabold text-slate-950 font-mono tracking-tight">
              {formatCurrency(stats.today_revenue)}
            </h3>
            <p className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 mt-1">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Real-time subscription rate</span>
            </p>
          </div>
          <div className="text-[10px] text-slate-400 pt-3 border-t border-slate-100 flex justify-between font-mono">
            <span>Updated Daily</span>
            <span>Tax Exclusive</span>
          </div>
        </div>

        {/* Card 3: TENANT LICENSE STATES */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs" id="kpi-tenant-states">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Workspace Tenants</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Active vs Trial Licencing</p>
            <h3 className="text-2xl font-extrabold text-slate-950 font-mono tracking-tight">
              {stats.active_tenants} <span className="text-xs font-bold text-slate-400">/ {stats.active_tenants + stats.trial_tenants} Licenses</span>
            </h3>
            <div className="flex gap-2 text-[9px] font-bold mt-1 font-mono">
              <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">TRIAL: {stats.trial_tenants}</span>
              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">EXPIRING: {stats.expiring_soon_tenants}</span>
              <span className="text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-250">CANCELLED: {stats.cancelled_tenants}</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 pt-3 border-t border-slate-100 flex justify-between font-mono">
            <span>Isolation Enforced</span>
            <span>Live Sync</span>
          </div>
        </div>

        {/* Card 4: ENTERPRISE SYSTEM HEALTH */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-xs" id="kpi-system-health">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">System Gateway</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">{stats.system_health.status}</span>
            </div>
            <p className="text-[10px] text-slate-400">DB Latency: <span className="font-mono text-slate-700 font-bold">{stats.system_health.database_latency_ms}ms</span> • Cache Hit: <span className="font-mono text-slate-700 font-bold">{stats.system_health.cache_hit_rate}</span></p>
            <div className="text-[9px] text-slate-500 font-semibold space-y-0.5">
              {stats.system_health.services.slice(0, 2).map((srv: any, i: number) => (
                <div key={i} className="flex justify-between border-b border-slate-50 pb-0.5 last:border-0">
                  <span>{srv.name}</span>
                  <span className="text-emerald-700 font-bold">{srv.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 pt-3 border-t border-slate-100 flex justify-between font-mono">
            <span>Nginx Proxy Binded</span>
            <span>Port 3000</span>
          </div>
        </div>

      </div>

      {/* 2. REAL-TIME MULTI-TENANCY VOLUMES */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Live Multi-Tenancy Operational Volume Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4" id="tenancy-metrics-bento">
          
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex items-center gap-3.5 hover:shadow-xs transition-all">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wide">Projects</p>
              <h4 className="text-base font-extrabold text-slate-900 font-mono mt-0.5">{stats.projects_count}</h4>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex items-center gap-3.5 hover:shadow-xs transition-all">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wide">Layouts</p>
              <h4 className="text-base font-extrabold text-slate-900 font-mono mt-0.5">{stats.layouts_count}</h4>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex items-center gap-3.5 hover:shadow-xs transition-all">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 shrink-0">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wide">Plot Parcels</p>
              <h4 className="text-base font-extrabold text-slate-900 font-mono mt-0.5">{stats.plots_count}</h4>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex items-center gap-3.5 hover:shadow-xs transition-all">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wide">Bookings</p>
              <h4 className="text-base font-extrabold text-slate-900 font-mono mt-0.5">{stats.bookings_count}</h4>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex items-center gap-3.5 hover:shadow-xs transition-all col-span-2 md:col-span-1">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wide">Collections</p>
              <h4 className="text-base font-extrabold text-slate-900 font-mono mt-0.5">{stats.collections_count}</h4>
            </div>
          </div>

        </div>
      </div>

      {/* 3. PLAN DISTRIBUTION & STORAGE TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Subscription Plan Distribution */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4 lg:col-span-2" id="dashboard-plan-distribution">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase">Subscription Plan Distribution</h3>
            <p className="text-[11px] text-slate-500">Total active license count and core revenue yield allocated across dynamic commercial tier slabs.</p>
          </div>

          <div className="space-y-4 pt-1">
            {stats.subscription_distribution.map((item: any) => {
              const totalRevenue = stats.mrr > 0 ? stats.mrr : 1;
              const pct = Math.round((item.revenue / totalRevenue) * 100);
              return (
                <div key={item.code} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">
                      {item.name} ({item.code}) • <span className="font-mono text-slate-500">{formatCurrency(item.monthly_price)}/mo</span>
                    </span>
                    <span className="font-mono font-extrabold text-slate-600">
                      {item.count} Active • {pct}% ({formatCurrency(item.revenue)}/mo)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct > 0 ? pct : 2}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Storage Limits Telemetry */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4" id="dashboard-storage-telemetry">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase">Global Cloud Storage</h3>
            <p className="text-[11px] text-slate-500">Aggregated disk utilization boundaries assigned compared with active uploads.</p>
          </div>

          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <div className="relative flex items-center justify-center">
              {/* Simple pure-CSS gauge mockup */}
              <div className="w-24 h-24 rounded-full border-8 border-slate-100 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold text-slate-900 font-mono">
                  {Math.round((stats.storage_used_gb / (stats.storage_assigned_gb || 10)) * 100) || 1}%
                </span>
                <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wide">Used</span>
              </div>
              <div className="absolute p-1 bg-white border border-slate-200 rounded-lg -bottom-2">
                <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
              </div>
            </div>

            <div className="w-full space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Calculated Active Uploads:</span>
                <span className="font-mono font-bold text-slate-800">{stats.storage_used_gb} GB</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Assigned Limits:</span>
                <span className="font-mono font-bold text-slate-800">{stats.storage_assigned_gb} GB</span>
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center leading-relaxed">
            Estimates auto-recompute in real-time dynamically out of total AutoCAD DXF files and map layout uploads.
          </div>
        </div>

      </div>

      {/* 4. REAL-TIME SAAS LEDGERS (Payments, Signups, Audits) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-realtime-ledgers">
        
        {/* Recent Payments Ledger */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden" id="ledger-payments">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Recent Payments</span>
            </h4>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase font-mono">Live Receipts</span>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.recent_payments.map((p: any, idx: number) => (
              <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/40 transition-all">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-slate-800 truncate">{p.tenant_name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{p.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-bold text-slate-900">{formatCurrency(p.amount)}</p>
                  <span className="inline-block mt-1 text-[8px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-700">PAID</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Signups & Renewals */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden" id="ledger-signups">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Signups & Renewals</span>
            </h4>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase font-mono">Operations</span>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.recent_renewals.slice(0, 2).map((r: any, idx: number) => (
              <div key={`ren-${idx}`} className="p-3.5 flex items-start gap-2.5 text-xs">
                <Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 leading-normal truncate">{r.tenant_name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{r.reason}</p>
                  <span className="text-[9px] text-slate-400 font-mono block mt-1">{r.date}</span>
                </div>
              </div>
            ))}
            {stats.recent_signups.slice(0, 3).map((s: any, idx: number) => (
              <div key={`sig-${idx}`} className="p-3.5 flex items-start gap-2.5 text-xs">
                <ArrowUpRight className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 leading-normal truncate">{s.tenant_name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-none">New Account • Plan: <span className="font-bold text-slate-750">{s.plan_name}</span></p>
                  <span className="text-[9px] text-slate-400 font-mono block mt-1">{s.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Log Stream */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden" id="ledger-audits">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-700" />
              <span>Audit Logs</span>
            </h4>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase font-mono">Stream</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
            {stats.recent_audit_activity.slice(0, 6).map((log: any) => (
              <div key={log.id} className="p-3.5 text-xs hover:bg-slate-50/40 transition-all space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-800 truncate max-w-[130px]">{log.tenant_name}</span>
                  <span className="font-mono text-[9px] bg-slate-50 px-1.5 py-0.5 border border-slate-200 rounded text-slate-600 font-bold uppercase shrink-0">{log.action}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono leading-none">
                  <span>Entity: {log.entity_name}</span>
                  <span>IP: {log.ip_address || "System"}</span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono block pt-1">{log.created_at}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
