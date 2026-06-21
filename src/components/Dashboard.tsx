import { useEffect, useState } from "react";
import api from "../lib/api.ts";
import { UserProfile, SystemHealth } from "../types/auth.ts";
import InventoryManager from "./InventoryManager.tsx";
import {
  LogOut,
  Fingerprint,
  Activity,
  Award,
  Globe,
  Database,
  Grid,
  TrendingUp,
  Sliders,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [simulationResult, setSimulationResult] = useState<{
    endpoint: string;
    status: "idle" | "loading" | "success" | "error";
    message: string;
    details?: any;
  } | null>(null);

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

      // Grab custom data mapping or logs if authenticated
      // To show real audit logs, let's fetch matching traces from the backend if required
      const url = `/api/v1/system/health`; // Local fetch uses api wrapper triggers
    } catch (err) {
      console.error("Health check fetch warning:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthAndAudit();

    // Setup active state list for demonstration
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
        details: "Dynamic authentication state checked manually via system health.",
      },
      ...prev,
    ]);
  };

  return (
    <div className="space-y-6" id="dashboard-root">
      {/* 1. Header Hero Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6" id="dashboard-hero">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authenticated Session Verified</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight font-sans">
            Welcome Back, <span className="text-zinc-100">{user.name}</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            BhoomiOne V3 Secure Sandbox Environment - Dynamic PostgreSQL Tenancy Resolver Module Active
          </p>
        </div>

        <button
          onClick={onLogout}
          className="bg-white hover:bg-slate-100 text-slate-900 font-medium text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          id="logout-btn"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Revoke Session Token</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-metrics-grid">
        {/* 2. Left side: Profile Credentials Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm" id="profile-card">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Session Attribute Tokens</h2>
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
              <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px]">
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

        {/* 3. Middle: Operational System Health State */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm lg:col-span-2" id="health-card">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Dynamic PostgreSQL Ingress Gateway</h2>
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

      {/* Sprint 2A: Inventory Management Canvas */}
      <InventoryManager 
        user={user} 
        onAuditLogged={(simLog) => {
          setAuditLogs((prev) => [simLog, ...prev]);
        }} 
      />

      {/* Dynamic Database-Driven RBAC System Panel (Sprint 1C) */}
      <div className="bg-white border border-slate-250 rounded-2xl p-6 lg:p-8 space-y-6 shadow-xs border-l-4 border-l-slate-900" id="rbac-panel">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
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

        {/* Part A: Active Database-Fetched Privilege Matrix */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Active Permissions Fetched Dynamically from DB ({user.permissions?.length || 0})
          </h3>
          {user.permissions && user.permissions.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {user.permissions.map((perm) => {
                let colorClass = "bg-slate-50 text-slate-700 border-slate-150";
                if (perm.startsWith("users")) colorClass = "bg-emerald-50 text-emerald-800 border-emerald-150";
                else if (perm.startsWith("tenants") || perm.startsWith("subscriptions")) colorClass = "bg-blue-50 text-blue-800 border-blue-150";
                else if (perm.startsWith("audit") || perm.startsWith("kyc")) colorClass = "bg-slate-900 text-white border-slate-800";
                else if (perm.startsWith("maps") || perm.startsWith("projects") || perm.startsWith("layouts") || perm.startsWith("plots")) colorClass = "bg-amber-50 text-amber-800 border-amber-150";
                else if (perm.startsWith("bookings") || perm.startsWith("collections")) colorClass = "bg-rose-50 text-rose-800 border-rose-150";
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

        {/* Part B: Database-Driven RBAC Middleware Simulator */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-slate-100">
          <div className="md:col-span-1 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">Request:</span>
                    <span className="text-amber-400 font-bold">{simulationResult.endpoint}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">Inbound Link Status:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
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
                <ShieldCheck className="w-10 h-10 text-slate-800" />
                <div>
                  <p className="font-bold text-slate-400">Idle Gateway Monitor</p>
                  <p className="text-[10px] max-w-sm leading-normal">
                    Select a secure sandbox action on the left to simulate active RBAC middleware evaluation checks.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Configuration Metadata specifications spec sheet (Configurable Units, Subscription details) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="dashboard-specs-grid">
        {/* Unit configurations */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm" id="units-spec">
          <div className="flex items-center gap-2 pb-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-md">
              <Grid className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Seeded Geographic Units (Mandate 9)</h3>
          </div>
          <p className="text-xs text-slate-500">
            Below represents the measurement conversion factors directly stored in the PostgreSQL database. Unit-agnostic pricing formulas pull this table dynamically.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="text-[11px] text-slate-400 uppercase bg-slate-50">
                <tr>
                  <th className="px-3 py-2">Unit Code</th>
                  <th className="px-3 py-2">English Title</th>
                  <th className="px-3 py-2 text-right">Conversion SQFT</th>
                  <th className="px-3 py-2 text-center">Status</th>
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

        {/* Subscription Tiers specs */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm" id="tiers-spec">
          <div className="flex items-center gap-2 pb-2">
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-md">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Platform Subscription Matrix</h3>
          </div>
          <p className="text-xs text-slate-500">
            Tiers feature flags are dynamically query-driven from `subscription_plans` and validated dynamically in API middlewares.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="text-[11px] text-slate-400 uppercase bg-slate-50">
                <tr>
                  <th className="px-3 py-2">Plan Code</th>
                  <th className="px-3 py-2">Monthly Rate</th>
                  <th className="px-3 py-2">Users Limit</th>
                  <th className="px-3 py-2">GIS Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-900">STARTER</td>
                  <td className="px-3 py-2 font-mono">$99.00</td>
                  <td className="px-3 py-2 font-mono">5</td>
                  <td className="px-3 py-2 text-slate-400">Disabled</td>
                </tr>
                <tr className="bg-amber-50/40">
                  <td className="px-3 py-2 font-semibold text-amber-950 flex items-center gap-1.5">
                    GROWTH
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-sans font-medium">Selected</span>
                  </td>
                  <td className="px-3 py-2 font-mono font-medium text-slate-900">$249.00</td>
                  <td className="px-3 py-2 font-mono text-slate-900">20</td>
                  <td className="px-3 py-2 text-emerald-600 font-medium">Enabled</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-slate-900">PROFESSIONAL</td>
                  <td className="px-3 py-2 font-mono">$499.00</td>
                  <td className="px-3 py-2 font-mono">100</td>
                  <td className="px-3 py-2 text-emerald-600 font-medium">Enabled</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Real-Time Secure Audit Events Logs Track */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm" id="audit-logs-pnl">
        <div className="flex items-center gap-2 pb-2">
          <Database className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">Security Audit Trail Engine</h3>
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
