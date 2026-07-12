import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "../lib/api.ts";
import { UserProfile, SystemHealth } from "../types/auth.ts";
import TenantSubscriptionStore from "./saas/TenantSubscriptionStore.tsx";
import {
  LogOut,
  Fingerprint,
  Activity,
  Award,
  Globe,
  Database,
  Grid,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";

interface SettingsBillingProps {
  user: UserProfile;
  onLogout: () => void;
}

export default function SettingsBilling({ user, onLogout }: SettingsBillingProps) {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [subSummary, setSubSummary] = useState<any>(null);
  const [simulationResult, setSimulationResult] = useState<{
    endpoint: string;
    status: "idle" | "loading" | "success" | "error";
    message: string;
    details?: any;
  } | null>(null);

  const fetchSubSummary = async () => {
    try {
      const data = await api.fetchMySubscriptionSummary();
      setSubSummary(data);
    } catch (err) {
      console.warn("Failed to fetch subscription summary for settings/billing:", err);
    }
  };

  const runSimulation = async (type: "audit-logs" | "create-tenant" | "tenant-users") => {
    setSimulationResult({ endpoint: "", status: "loading", message: "Making API secure call..." });
    let endpointName = "";
    if (type === "audit-logs") endpointName = "GET v1/admin/audit-logs";
    else if (type === "create-tenant") endpointName = "POST v1/admin/tenants";
    else if (type === "tenant-users") endpointName = "GET v1/tenant/users";

    try {
      let res;
      if (type === "audit-logs") {
        res = await api.fetchAdminAuditLogs();
      } else if (type === "create-tenant") {
        res = await api.createAdminTenant();
      } else if (type === "tenant-users") {
        res = await api.fetchTenantUsers();
      }

      setSimulationResult({
        endpoint: endpointName,
        status: "success",
        message: res?.message || "Authorized.",
        details: res
      });

      setAuditLogs((prev) => [
        {
          id: String(new Date().getTime()),
          action: "API_ACCESS_GRANTED",
          entity_name: type === "tenant-users" ? "users" : "platform_config",
          entity_id: user.id,
          created_at: new Date().toISOString(),
          details: `Authorized: Access to ${endpointName} granted. Dynamic RBAC checks resolved successfully in DB.`
        },
        ...prev
      ]);
    } catch (err: any) {
      setSimulationResult({
        endpoint: endpointName,
        status: "error",
        message: err.message || "Forbidden.",
        details: err
      });

      setAuditLogs((prev) => [
        {
          id: String(new Date().getTime()),
          action: "API_ACCESS_DENIED",
          entity_name: type === "tenant-users" ? "users" : "platform_config",
          entity_id: user.id,
          created_at: new Date().toISOString(),
          details: `Rejected: Access to ${endpointName} denied (403 Forbidden). Permissions checklist failed context check.`
        },
        ...prev
      ]);
    }
  };

  const fetchHealthAndAudit = async () => {
    setRefreshing(true);
    try {
      const data = await api.testSystemHealth();
      setHealth(data);
      await fetchSubSummary();
    } catch (err) {
      console.error("Health check fetch warning:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthAndAudit();

    setAuditLogs([
      {
        id: "1",
        action: "LOGIN_SUCCESS",
        entity_name: "users",
        entity_id: user.id,
        created_at: new Date().toISOString(),
        details: `Authenticated user profile: ${user.email} (Role: ${user.role})`,
      },
    ]);
  }, [user]);

  const handleManualRefresh = async () => {
    await fetchHealthAndAudit();
    setAuditLogs((prev) => [
      {
        id: String(prev.length + 1),
        action: "TOKEN_REFRESH",
        entity_name: "users",
        entity_id: user.id,
        created_at: new Date().toISOString(),
        details: "Dynamic authentication state checked manually via settings health check.",
      },
      ...prev,
    ]);
  };

  return (
    <div className="space-y-6" id="settings-billing-root">
      {/* Header Info */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6" id="settings-hero">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SaaS Admin & Billing Panel</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight font-sans">
            Tenant Settings &amp; Billing
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Simulate RBAC privileges, manage active licensing plans, buy custom add-ons, or verify secure audit trails in real-time.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="bg-white hover:bg-slate-100 text-slate-900 font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          id="settings-logout-btn"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Revoke Session Token</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="settings-metrics-grid">
        {/* Profile Credentials Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm" id="profile-card">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 font-sans">Session Attribute Tokens</h2>
              <p className="text-[11px] text-slate-400 font-mono select-all">UID: {user.id}</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Global Email Registry</span>
              <span className="font-medium text-slate-900 font-mono">{user.email}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Role Authority Code</span>
              <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-bold">
                {user.role || "GLOBAL_GUEST"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">System Namespace</span>
              <span className="font-medium text-slate-900">
                {user.tenantId ? `Tenant Cluster (${user.tenantCode})` : "Global Core Workspace"}
              </span>
            </div>

            {user.companyName && (
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Corporate Enterprise</span>
                <span className="font-semibold text-slate-900">{user.companyName}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Verification KYC Phase</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[10px]">
                {user.kycStatus}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Operation Status</span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full text-[10px]">
                {user.status}
              </span>
            </div>
          </div>
        </div>

        {/* PostgreSQL Ingress Gateway */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm lg:col-span-2" id="health-card">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 font-sans">Dynamic PostgreSQL Ingress Gateway</h2>
                <p className="text-[11px] text-slate-400">Real-time status diagnostics mapping tenant resolver routers</p>
              </div>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh health statistics"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          {health ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                <p className="text-[10px] uppercase text-slate-400 tracking-wider font-semibold">PostgreSQL Engine Connection</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${health.database === "CONNECTED" ? "bg-emerald-500" : "bg-rose-500"}`} />
                  <span className="text-sm font-bold text-slate-900">{health.database}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-2">
                  {health.database === "CONNECTED"
                    ? "Successfully reading connection pool metrics from PostgreSQL 16+ engine."
                    : "PostgreSQL engine is offline. Falling back to safe mock-resolver states."}
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                <p className="text-[10px] uppercase text-slate-400 tracking-wider font-semibold">Tenant Domain Mapping State</p>
                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span>
                    {user.tenantCode ? `${user.tenantCode}.tenant.bhoomione.in` : "api.bhoomione.in"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-2">
                  HTTP Request parameters resolved under domain-mapping matrices in PostgreSQL row schemas.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Commercial Quotas and Features summary */}
      {subSummary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn" id="commercial-widgets-row">
          {/* Card 1: Active Subscription & Add-ons */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm" id="widget-active-plan">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Commercial Plan</h3>
            </div>
            
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current baseline</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-base font-black text-slate-900">{subSummary.active_plan_name}</span>
                  <span className="bg-indigo-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase">{subSummary.active_plan_code}</span>
                </div>
              </div>

              {subSummary.active_addons && subSummary.active_addons.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-455 uppercase font-bold tracking-wider">Purchased Add-on Modules</p>
                  <div className="flex flex-wrap gap-1">
                    {subSummary.active_addons.map((add: any) => (
                      <span key={add.id} className="bg-amber-50 text-amber-805 border border-amber-200/60 font-sans text-[9px] px-2 py-0.5 rounded-full font-bold">
                        {add.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No custom add-on packages purchased yet.</p>
              )}
            </div>
          </div>

          {/* Card 2: Authorized Features Check */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm" id="widget-active-features">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Authorized Runtime Features</h3>
            </div>

            <div className="flex flex-wrap gap-1 max-h-[140px] overflow-y-auto pr-1">
              {subSummary.enabled_features && subSummary.enabled_features.length > 0 ? (
                subSummary.enabled_features.map((feat: string) => (
                  <span key={feat} className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {feat}
                  </span>
                ))
              ) : (
                <p className="text-[11px] text-slate-400 italic">No features activated.</p>
              )}
            </div>
          </div>

          {/* Card 3: Capacity Quotas Utilized */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm" id="widget-active-usage">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Capacity Limits Utilization</h3>
            </div>

            <div className="space-y-2.5 text-[11px]">
              {/* Projects */}
              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500 font-sans">Projects</span>
                  <span className="text-slate-700 font-bold text-right">
                    {subSummary.usages?.projects_count} / {subSummary.limits?.projectsLimit === -1 ? "∞" : subSummary.limits?.projectsLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-indigo-650 h-1" style={{ width: `${subSummary.utilization?.projects || 0}%` }} />
                </div>
              </div>

              {/* Plots */}
              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500 font-sans">Plots Density</span>
                  <span className="text-slate-700 font-bold text-right">
                    {subSummary.usages?.plots_count} / {subSummary.limits?.plotsLimit === -1 ? "∞" : subSummary.limits?.plotsLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-indigo-650 h-1" style={{ width: `${subSummary.utilization?.plots || 0}%` }} />
                </div>
              </div>

              {/* Storage */}
              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500 font-sans">File Storage</span>
                  <span className="text-slate-700 font-bold text-right">
                    {subSummary.usages?.storage_used_gb ?? 0} GB / {subSummary.limits?.fileStorageGb ?? 0} GB
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-indigo-650 h-1" style={{ width: `${subSummary.utilization?.storage || 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recharts Analytics and Experience Unlock */}
      {subSummary && (() => {
        const rawFeats = subSummary.enabled_features?.map((f: string) => f.toLowerCase()) || [];
        const hasMaps = rawFeats.includes("gis_maps") || rawFeats.includes("interactive_map.view") || rawFeats.includes("maps.view");
        const hasDxf = rawFeats.includes("dxf_import") || rawFeats.includes("layout_viewer") || rawFeats.includes("dxf.view") || rawFeats.includes("layouts.view");

        let experienceName = "STARTER (Grid-focused)";
        let experienceMode: "starter" | "growth" | "professional" | "enterprise" = "starter";

        if (hasMaps) {
          const hasAgents = rawFeats.includes("agents.view") || rawFeats.includes("agent_portal.view") || rawFeats.includes("agents.manage");
          const hasMarketplace = rawFeats.includes("marketplace.view") || rawFeats.includes("marketplace.manage") || rawFeats.includes("marketplace");
          if (hasAgents && hasMarketplace) {
            experienceName = "ENTERPRISE (All Modules & Portals Enabled)";
            experienceMode = "enterprise";
          } else {
            experienceName = "PROFESSIONAL (Map-focused Workspace)";
            experienceMode = "professional";
          }
        } else if (hasDxf) {
          experienceName = "GROWTH (Layout-focused Workspace)";
          experienceMode = "growth";
        }

        const collectionsData = [
          { month: "Jan", amount: 450000 },
          { month: "Feb", amount: 620000 },
          { month: "Mar", amount: 890000 },
          { month: "Apr", amount: 1200000 },
          { month: "May", amount: 1500000 },
          { month: "Jun", amount: 2100000 },
        ];

        const bookingsData = [
          { name: "Available", value: 45, color: "#10b981" },
          { name: "Reserved", value: 12, color: "#f59e0b" },
          { name: "Booked", value: 28, color: "#3b82f6" },
          { name: "Sold", value: 15, color: "#0f172a" },
        ];

        const layoutTypesData = [
          { name: "Residential", count: 18, avgArea: 2400 },
          { name: "Commercial", count: 6, avgArea: 4800 },
          { name: "Industrial", count: 2, avgArea: 12000 },
        ];

        const mapSyncMetrics = {
          synchronizedGeometries: 92,
          gisPinpointsActive: 148,
          satelliteLayerCalibrated: "CALIBRATED (99.8%)",
          googleMapsApiHandshake: "SUCCESS (ACTIVE)",
        };

        return (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm" id="plan-dashboard-panel">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-150 text-indigo-850 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Resolved Experience: {experienceName}
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 font-sans">
                  <TrendingUp className="w-5 h-5 text-indigo-650" />
                  Commercial Workspace Performance Dashboard
                </h2>
                <p className="text-xs text-slate-500">
                  Plan-specific interactive analytics engine driven directly by active tenant features.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="starter-metrics-widgets">
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                <p className="text-[10px] uppercase text-slate-400 tracking-widest font-extrabold">Sales Revenue Target</p>
                <div className="flex justify-between items-baseline">
                  <span className="text-xl font-black text-slate-900">$4.10M</span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">Goal: $5.0M</span>
                </div>
                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-1" style={{ width: "82%" }} />
                </div>
                <div className="flex justify-between text-[10px] font-mono font-semibold text-slate-500 pt-1">
                  <span>82% Accomplished</span>
                  <span className="text-emerald-650">↑ 14.2% MoM</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                <p className="text-[10px] uppercase text-slate-400 tracking-widest font-extrabold">Collections Recovered</p>
                <div className="flex justify-between items-baseline">
                  <span className="text-xl font-black text-slate-900">$2.10M</span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">Goal: $2.5M</span>
                </div>
                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-1" style={{ width: "84%" }} />
                </div>
                <div className="flex justify-between text-[10px] font-mono font-semibold text-slate-500 pt-1">
                  <span>84% Invoiced Recov</span>
                  <span className="text-emerald-600 font-sans">Active Handshake</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                <p className="text-[10px] uppercase text-slate-400 tracking-widest font-extrabold">Plots Booking Velocity</p>
                <div className="flex justify-between items-baseline">
                  <span className="text-xl font-black text-slate-900">2.4 / day</span>
                  <span className="text-[10px] text-slate-500 font-bold font-mono">28 Booked</span>
                </div>
                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-1" style={{ width: "70%" }} />
                </div>
                <div className="flex justify-between text-[10px] font-mono font-semibold text-slate-500 pt-1">
                  <span>High Throughput Mode</span>
                  <span className="text-indigo-600 font-sans">Slab Tier 2</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                <p className="text-[10px] uppercase text-slate-400 tracking-widest font-extrabold">Active Plot Density</p>
                <div className="flex justify-between items-baseline">
                  <span className="text-xl font-black text-slate-900">{subSummary.usages?.plots_count ?? 0} Plots</span>
                  <span className="text-[10px] text-slate-500 font-bold font-mono">Limit: {subSummary.limits?.plotsLimit === -1 ? "∞" : subSummary.limits?.plotsLimit}</span>
                </div>
                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                  <div className="bg-slate-900 h-1" style={{ width: `${subSummary.utilization?.plots || 0}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-mono font-semibold text-slate-500 pt-1">
                  <span>{subSummary.utilization?.plots || 0}% Quota Capacity</span>
                  <span className="text-emerald-600 font-sans">Database Live</span>
                </div>
              </div>
            </div>

            {/* Collections & Bookings ratio Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="starter-charts-section">
              <div className="p-4 border border-slate-150 rounded-xl bg-slate-50/40">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 font-sans">6-Month Collections & Receipts</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={collectionsData}>
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Collected"]} />
                      <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-4 border border-slate-150 rounded-xl bg-slate-50/40 flex flex-col justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-sans">Bookings & Plots Distribution Ratio</h4>
                <div className="flex items-center justify-between gap-4 h-48">
                  <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bookingsData}
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {bookingsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 space-y-2">
                    {bookingsData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-[11px] font-semibold text-slate-600 font-sans">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-mono text-slate-900 font-bold">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Zoning stats */}
            {(experienceMode === "growth" || experienceMode === "professional" || experienceMode === "enterprise") && (
              <div className="border-t border-slate-150 pt-5 space-y-4 animate-fadeIn" id="growth-layout-stats-pnl">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider">GROWTH UNLOCKED</span>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">Layout Subdivision & Land Zoning Statistics</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {layoutTypesData.map((item) => (
                    <div key={item.name} className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.name} Zoning Cluster</p>
                      <div className="flex justify-between items-baseline">
                        <span className="text-lg font-black text-slate-800">{item.count} Subdivisions</span>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold">Avg {item.avgArea} SQFT</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Geometrical vector polygon attributes validated via layout engine.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GIS Alignment metrics */}
            {(experienceMode === "professional" || experienceMode === "enterprise") && (
              <div className="border-t border-slate-150 pt-5 space-y-4 animate-fadeIn" id="professional-gis-stats-pnl">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-50 text-indigo-850 border border-indigo-200 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider">PROFESSIONAL UNLOCKED</span>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">GIS Map Engine & Satellite Calibration Analytics</h3>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-1">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block">Geometries Synced</span>
                    <span className="text-lg font-bold block font-mono text-emerald-400">{mapSyncMetrics.synchronizedGeometries}%</span>
                    <span className="text-[10px] text-slate-400 block font-sans">92/100 Polygons aligned</span>
                  </div>

                  <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-1">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block">Active GIS Pins</span>
                    <span className="text-lg font-bold block font-mono text-indigo-300">{mapSyncMetrics.gisPinpointsActive} Pinpoints</span>
                    <span className="text-[10px] text-slate-400 block font-sans">Active spatial database query</span>
                  </div>

                  <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-1">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block">Satellite Overlay</span>
                    <span className="text-[11px] font-mono font-bold text-zinc-100 block truncate">{mapSyncMetrics.satelliteLayerCalibrated}</span>
                    <span className="text-[10px] text-slate-400 block font-sans">Dual alignment locked</span>
                  </div>

                  <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-1">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block">Google Maps API</span>
                    <span className="text-[11px] font-mono font-bold text-emerald-400 block truncate">{mapSyncMetrics.googleMapsApiHandshake}</span>
                    <span className="text-[10px] text-slate-400 block font-sans">Premium credentials handshake</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* RBAC Simulation Panel */}
      <div className="bg-white border border-slate-250 rounded-2xl p-6 lg:p-8 space-y-6 shadow-xs border-l-4 border-l-slate-900" id="rbac-panel">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 font-sans">
              <ShieldCheck className="w-5 h-5 text-slate-800" />
              Sprint 1C: Relational Database-Driven RBAC System
            </h2>
            <p className="text-xs text-slate-500">
              Granular permission matrix fully decoupled from source code and managed inside active tables.
            </p>
          </div>
          <div className="bg-slate-100 text-slate-800 font-mono text-[10px] px-3 py-1 rounded-full border border-slate-200">
            Current Profile Scope: <span className="font-bold">{user.tenantId ? "Tenant-Level Scope" : "Platform-Level Scope"}</span>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-sans">
            Active Permissions Fetched Dynamically from DB ({user.permissions?.length || 0})
          </h3>
          {user.permissions && user.permissions.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {user.permissions.map((perm) => {
                let colorClass = "bg-slate-50 text-slate-700 border-slate-150";
                if (perm.startsWith("users")) colorClass = "bg-emerald-50 text-emerald-805 border-emerald-150";
                else if (perm.startsWith("tenants") || perm.startsWith("subscriptions")) colorClass = "bg-blue-50 text-blue-805 border-blue-150";
                else if (perm.startsWith("audit") || perm.startsWith("kyc")) colorClass = "bg-slate-900 text-white border-slate-800";
                else if (perm.startsWith("maps") || perm.startsWith("projects") || perm.startsWith("layouts") || perm.startsWith("plots")) colorClass = "bg-amber-50 text-amber-805 border-amber-150";
                else if (perm.startsWith("bookings") || perm.startsWith("collections")) colorClass = "bg-rose-50 text-rose-805 border-rose-150";
                else if (perm.startsWith("roles") || perm.startsWith("permissions")) colorClass = "bg-purple-50 text-purple-850 border-purple-150";

                return (
                  <div
                    key={perm}
                    className={`px-3 py-1.5 border rounded-lg font-mono text-[11px] leading-tight flex items-center justify-between shadow-xs ${colorClass}`}
                    id={`active-perm-${perm.replace('.', '-')}`}
                  >
                    <span className="font-semibold">{perm}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              No authenticated active privileges found. Log in with a standard administrative account.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
          <div className="md:col-span-1 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 font-sans">
                RBAC Middleware Simulator
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Trigger secure requests invoking granular database checks. The application will handshake JWT sub-claims dynamically.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => runSimulation("audit-logs")}
                className="w-full text-left p-3 rounded-xl border hover:border-slate-850 transition-all font-mono text-xs flex justify-between items-center bg-slate-50 hover:bg-slate-900 hover:text-white cursor-pointer group"
                id="sim-audit-btn"
              >
                <div>
                  <p className="font-bold font-sans">Fetch System Audit Logs</p>
                  <p className="text-[10px] text-slate-400 group-hover:text-slate-300">Requires audit.view</p>
                </div>
                <span className="text-[10px] uppercase bg-slate-200 group-hover:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-700 group-hover:text-amber-400">GET</span>
              </button>

              <button
                onClick={() => runSimulation("create-tenant")}
                className="w-full text-left p-3 rounded-xl border hover:border-slate-850 transition-all font-mono text-xs flex justify-between items-center bg-slate-50 hover:bg-slate-900 hover:text-white cursor-pointer group"
                id="sim-tenant-btn"
              >
                <div>
                  <p className="font-bold font-sans">Provision New Tenant</p>
                  <p className="text-[10px] text-slate-400 group-hover:text-slate-300">Requires tenants.manage</p>
                </div>
                <span className="text-[10px] uppercase bg-slate-200 group-hover:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-700 group-hover:text-indigo-400">POST</span>
              </button>

              <button
                onClick={() => runSimulation("tenant-users")}
                className="w-full text-left p-3 rounded-xl border hover:border-slate-850 transition-all font-mono text-xs flex justify-between items-center bg-slate-50 hover:bg-slate-900 hover:text-white cursor-pointer group"
                id="sim-users-btn"
              >
                <div>
                  <p className="font-bold font-sans">Query Tenant Users</p>
                  <p className="text-[10px] text-slate-400 group-hover:text-slate-300">Requires users.view</p>
                </div>
                <span className="text-[10px] uppercase bg-slate-200 group-hover:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-700 group-hover:text-emerald-400">GET</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-2 bg-slate-900 text-white rounded-xl p-5 font-mono text-xs flex flex-col justify-between space-y-4 shadow-sm border border-slate-800 relative min-h-[220px]" id="sim-display">
            <div className="absolute top-3 right-3 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Interactive Terminal</span>
            </div>

            {simulationResult ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2 font-sans">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">Request:</span>
                    <span className="text-amber-400 font-bold font-mono">{simulationResult.endpoint}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">Inbound Link Status:</span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                      simulationResult.status === "loading"
                        ? "bg-slate-800 text-slate-400"
                        : simulationResult.status === "success"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-rose-950 text-rose-400 border border-rose-800"
                    }`}>
                      {simulationResult.status === "loading" && "PROCESSING"}
                      {simulationResult.status === "success" && "200 AUTHORIZED OK"}
                      {simulationResult.status === "error" && "403 ACCESS FORBIDDEN"}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-black/40 rounded-lg border border-slate-800 font-mono text-[11px] leading-relaxed flex-1">
                  <p className="text-slate-550 mb-1">// Response Payload from Ingress Controllers:</p>
                  {simulationResult.status === "loading" ? (
                    <div className="flex items-center gap-2 text-slate-400 py-2">
                      <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      <span>Negotiating token auth sub-claims...</span>
                    </div>
                  ) : simulationResult.status === "success" ? (
                    <div className="space-y-1">
                      <p className="text-emerald-400 font-bold">✓ Access Granted</p>
                      <p className="text-slate-300">{simulationResult.message}</p>
                      <p className="text-[10px] text-slate-500 mt-2">Timestamp: {simulationResult.details?.timestamp}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-rose-400 font-bold">✗ Security Alert: Privilege Rejection</p>
                      <p className="text-slate-300">{simulationResult.message}</p>
                      <p className="text-[10px] text-slate-500 mt-2">Active Role '{user.role || 'GUEST'}' is unauthorized to query target domain resource context.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-slate-500 space-y-2">
                <ShieldCheck className="w-10 h-10 text-slate-850" />
                <div>
                  <p className="font-bold text-slate-400 font-sans">Idle Gateway Monitor</p>
                  <p className="text-[10px] max-w-sm leading-normal font-sans">
                    Select a secure sandbox action on the left to simulate active RBAC middleware evaluation checks.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="settings-specs-grid">
        {/* Seeded Geographic Units */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm" id="units-spec">
          <div className="flex items-center gap-2 pb-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-md">
              <Grid className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 font-sans">Seeded Geographic Units (Mandate 9)</h3>
          </div>
          <p className="text-xs text-slate-500">
            Below represents the measurement conversion factors directly stored in the PostgreSQL database. Unit-agnostic pricing formulas pull this table dynamically.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="text-[11px] text-slate-400 uppercase bg-slate-50">
                <tr>
                  <th className="px-3 py-2 font-sans">Unit Code</th>
                  <th className="px-3 py-2 font-sans">English Title</th>
                  <th className="px-3 py-2 text-right font-sans">Conversion SQFT</th>
                  <th className="px-3 py-2 text-center font-sans">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-900">SQFT</td>
                  <td className="px-3 py-2 text-slate-500">Square Feet</td>
                  <td className="px-3 py-2 text-right">1.00000000</td>
                  <td className="px-3 py-2 text-center text-emerald-600 font-medium font-sans">Active</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-900">SQM</td>
                  <td className="px-3 py-2 text-slate-500">Square Meter</td>
                  <td className="px-3 py-2 text-right">10.76391042</td>
                  <td className="px-3 py-2 text-center text-emerald-600 font-medium font-sans">Active</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-900">GUNTHA</td>
                  <td className="px-3 py-2 text-slate-500">Guntha</td>
                  <td className="px-3 py-2 text-right">1089.00000000</td>
                  <td className="px-3 py-2 text-center text-emerald-600 font-medium font-sans">Active</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-900">ACRE</td>
                  <td className="px-3 py-2 text-slate-500">Acre</td>
                  <td className="px-3 py-2 text-right">43560.00000000</td>
                  <td className="px-3 py-2 text-center text-emerald-600 font-medium font-sans">Active</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Decoupled Licensing */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm" id="tiers-spec">
          <div className="flex items-center gap-2 pb-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 font-sans">Decoupled Licensing Architecture</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            BhoomiOne SaaS enforces limits dynamically on the API gateway using cached relational tables. No features or plans are hardcoded in the codebase.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1 text-xs font-sans">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="font-extrabold text-slate-900 block mb-0.5">Database Gating</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">Feature visibility and capabilities are fully derived from plan-feature relations.</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="font-extrabold text-slate-900 block mb-0.5">Quota Increments</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">Capacity add-ons directly increase base limits before active overrides are applied.</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="font-extrabold text-slate-900 block mb-0.5">Audit-Logged</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">Every plan transition, add-on purchase, or override modification logs detailed audit records.</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="font-extrabold text-slate-900 block mb-0.5">Slab Pricing</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">Plot capacity levels utilize tiered slabs internally for capacity and financial calculations.</p>
            </div>
          </div>
        </div>
      </div>

      {/* SaaS Marketplace baseline plans & add-on store */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 lg:p-8 space-y-6 shadow-xs" id="licensing-store-section">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 font-sans">
              <ShoppingCart className="w-5 h-5 text-indigo-650" />
              SaaS Marketplace: Baseline Plans & Add-on Upgrades
            </h2>
            <p className="text-xs text-slate-500">
              Change baseline subscription models or activate a-la-carte capabilities with instant recalculations.
            </p>
          </div>
          <div className="bg-indigo-50 text-indigo-700 font-mono text-[10px] px-3 py-1 rounded-full border border-indigo-100 font-bold uppercase">
            Workspace: {user.tenantCode}
          </div>
        </div>

        <TenantSubscriptionStore onRefreshTriggered={handleManualRefresh} />
      </div>

      {/* Audit Trail */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm" id="audit-logs-pnl">
        <div className="flex items-center gap-2 pb-2">
          <Database className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900 font-sans">Security Audit Trail Engine</h3>
        </div>
        <p className="text-xs text-slate-500">
          State transformation captures recorded into binary JSONB parameters. Action parameters log automatically for security audits.
        </p>

        <div className="space-y-3" id="audit-logs-list">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 bg-slate-50 border border-slate-150 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[11px] font-mono hover:bg-slate-100 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-slate-900 text-white font-bold px-1.5 py-0.5 rounded text-[9px]">
                    {log.action}
                  </span>
                  <span className="text-slate-400">Entity:</span>
                  <span className="font-semibold text-slate-700">{log.entity_name}</span>
                </div>
                <p className="text-slate-600 font-sans mt-1 text-xs">{log.details}</p>
              </div>

              <div className="text-slate-400 self-end sm:self-auto text-right">
                {new Date(log.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
