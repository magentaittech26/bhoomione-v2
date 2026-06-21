import React, { useState, useEffect } from "react";
import api from "../../lib/api.ts";
import AdminLogin from "../AdminLogin.tsx";
import { UserProfile } from "../../types/auth.ts";
import { 
  ShieldAlert, 
  Database, 
  Users, 
  Activity, 
  TrendingUp, 
  Server, 
  Plus, 
  Check, 
  RefreshCw,
  Globe,
  Settings,
  CreditCard,
  Layers,
  LogOut,
  Sliders,
  Terminal,
  Clock,
  AlertTriangle
} from "lucide-react";

export default function SaaSAdminApp() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"clusters" | "logs" | "revenue" | "settings">("clusters");
  
  const [tenants, setTenants] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [loadingTenants, setLoadingTenants] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [tenantsError, setTenantsError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false); // for modal form submit
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const [showAddTenant, setShowAddTenant] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: "", code: "", plan: "GROWTH", company: "" });
  
  const [stats, setStats] = useState({
    activeTenants: 0,
    totalPlots: 0,
    dbConnections: 12,
    subscriptionRevenue: "$0 / mo"
  });

  useEffect(() => {
    const user = api.getCurrentUser();
    if (user && user.role === "admin") {
      setCurrentUser(user);
    }
  }, []);

  const loadTenants = async () => {
    setLoadingTenants(true);
    setTenantsError(null);
    try {
      const data = await api.fetchAdminTenants();
      setTenants(data);
      
      // Calculate stats based on real API response
      const activeCount = data.filter(t => t.status === "ACTIVE").length;
      const totalPlotsCount = data.reduce((acc, curr) => acc + (curr.plots || 0), 0);
      
      let mrr = 0;
      data.forEach(t => {
        if (t.status === "ACTIVE") {
          if (t.plan === "STARTER") mrr += 99;
          else if (t.plan === "PROFESSIONAL") mrr += 499;
          else mrr += 249; // Default GROWTH
        }
      });

      setStats(prev => ({
        ...prev,
        activeTenants: data.length,
        totalPlots: totalPlotsCount,
        subscriptionRevenue: `$${mrr.toLocaleString()} / mo`
      }));
    } catch (err: any) {
      setTenantsError(err.message || "Failed to load tenant clusters from database server.");
    } finally {
      setLoadingTenants(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    setLogsError(null);
    try {
      const data = await api.fetchAdminAuditLogs();
      setAuditLogs(data);
    } catch (err: any) {
      setLogsError(err.message || "Failed to load ingress audit logs from admin endpoint.");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadTenants();
      loadAuditLogs();
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // safe logout
    }
    setCurrentUser(null);
    setTenants([]);
    setAuditLogs([]);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.code) return;

    setLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const payload = {
        name: newTenant.name,
        code: newTenant.code.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"),
        plan: newTenant.plan
      };

      const res = await api.createAdminTenant(payload);
      
      if (res && res.tenant) {
        setSubmitSuccess(`Tenant namespace '${payload.code}' was successfully provisioned in the database!`);
        
        // Reload all metrics & lists immediately to reflect changes
        await loadTenants();
        await loadAuditLogs();

        setTimeout(() => {
          setShowAddTenant(false);
          setNewTenant({ name: "", code: "", plan: "GROWTH", company: "" });
          setSubmitSuccess(null);
        }, 1500);
      } else {
        throw new Error("Unexpected response structure from tenant provision authority.");
      }
    } catch (err: any) {
      setSubmitError(err.message || "Failed to finalize database schema mapping registry.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-slate-50 min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <AdminLogin 
            onLoginSuccess={handleLoginSuccess}
            onForgotPassword={() => alert("Simulation module reset request. Use standard admin parameters to sign in.")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans" id="saas-admin-root">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* SaaS Admin Hero Header and Logout */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md" id="saas-admin-header">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Supervisor: {currentUser.name} (Global Administrator)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              SaaS Control Center
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Platform administration workspace. Control database namespaces, monitor audit metrics, manage active tenant subscriptions and configure gateway limits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setSubmitError(null);
                setSubmitSuccess(null);
                setShowAddTenant(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              id="provision-tenant-init-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Provision Tenant</span>
            </button>
            <button 
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm border border-slate-700"
              id="saas-admin-logout-btn"
            >
              <LogOut className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>

        {/* Tab-driven Navigation Menu Structure */}
        <div className="flex border-b border-slate-200" id="saas-admin-navigation">
          <button
            onClick={() => setActiveTab("clusters")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "clusters" 
                ? "border-slate-900 text-slate-900 bg-slate-100/50 rounded-t-lg" 
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Globe className="w-4 h-4" />
            Active Subdomain Clusters
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "logs" 
                ? "border-slate-900 text-slate-900 bg-slate-100/50 rounded-t-lg" 
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Activity className="w-4 h-4" />
            Ingress Audit Trails
          </button>
          <button
            onClick={() => setActiveTab("revenue")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "revenue" 
                ? "border-slate-900 text-slate-900 bg-slate-100/50 rounded-t-lg" 
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            License Billing / MRR
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "settings" 
                ? "border-slate-900 text-slate-900 bg-slate-100/50 rounded-t-lg" 
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Settings className="w-4 h-4" />
            Global Parameters
          </button>
        </div>

        {/* Viewport Render Block based on current tab state */}
        {activeTab === "clusters" && (
          <div className="space-y-6" id="saas-tab-clusters">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-1">
                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Tenant Namespaces</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-slate-900">{stats.activeTenants}</p>
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-[10px] text-slate-500">Live matched DNS records</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-1">
                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Physical Land Lots</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-slate-900">{stats.totalPlots}</p>
                  <Layers className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-[10px] text-slate-500">Managed in separate DB tables</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-1">
                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">PostgreSQL Connection Pool</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-slate-900">{stats.dbConnections}</p>
                  <Database className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-[10px] text-slate-500">Active physical connections</p>
              </div>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Tenant Clusters</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Active isolated developer schemes. Authenticated administrative users are permitted to manage parameters.
                  </p>
                </div>
                <button 
                  onClick={loadTenants}
                  disabled={loadingTenants}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  id="re-fetch-tenants-btn"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingTenants ? 'animate-spin' : ''}`} />
                  Refresh Matrix
                </button>
              </div>

              {/* Error State */}
              {tenantsError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-xs shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">Failed to load tenant directory</p>
                    <p className="text-red-650 mt-0.5">{tenantsError}</p>
                  </div>
                  <button onClick={loadTenants} className="bg-red-100 hover:bg-red-200 text-red-800 font-bold px-3 py-1.5 rounded-lg">
                    Retry Sync
                  </button>
                </div>
              )}

              {/* Loading State Skeleton */}
              {loadingTenants && (
                <div className="space-y-3 py-4 animate-pulse">
                  <div className="h-8 bg-slate-100 rounded-lg w-full" />
                  <div className="h-10 bg-slate-50 rounded-lg w-full" />
                  <div className="h-10 bg-slate-50 rounded-lg w-full" />
                  <div className="h-10 bg-slate-50 rounded-lg w-full" />
                </div>
              )}

              {/* Empty/No Data State */}
              {!loadingTenants && !tenantsError && tenants.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                  <div className="p-3 bg-slate-100 rounded-full w-fit mx-auto text-slate-400">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">No tenant registry entries found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Global database registry returned an empty cluster matrix. Click "Provision Tenant" to configure a new environment.
                  </p>
                  <button 
                    onClick={() => {
                      setSubmitError(null);
                      setSubmitSuccess(null);
                      setShowAddTenant(true);
                    }}
                    className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold px-4 py-2 rounded-lg"
                  >
                    Provision First Tenant
                  </button>
                </div>
              )}

              {/* Real Table list */}
              {!loadingTenants && !tenantsError && tenants.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-600">
                    <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="px-4 py-3">Tenant Name / Label</th>
                        <th className="px-4 py-3">Inbound Subdomain Mapping</th>
                        <th className="px-4 py-3 text-center">License Level</th>
                        <th className="px-4 py-3 text-center">Physical Plots</th>
                        <th className="px-4 py-3 text-center">SQL Footprint</th>
                        <th className="px-4 py-3 text-right">Cluster State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tenants.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">{t.name}</p>
                              <p className="text-[10px] text-indigo-600 font-mono mt-0.5">namespace: {t.code}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-0.5 font-mono text-[10px]">
                              <p className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded w-fit select-all">{t.domain || `${t.code}.bhoomione.in`}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded text-[10px] font-bold border border-amber-100">
                              {t.plan}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700">
                            {t.plots}
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-slate-500">{t.dbSize || "14.2 MB"}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              t.status === "ACTIVE" 
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-150" 
                                : "bg-red-50 text-red-800 border border-red-150"
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${t.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"}`} />
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs" id="saas-tab-logs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-150">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-slate-800" />
                  Telemetry Handshake Auditing
                </h2>
                <p className="text-xs text-slate-500">
                  Raw stream trackers from container ingress, RBAC privileges, and vacuum queries.
                </p>
              </div>
              <button 
                onClick={loadAuditLogs}
                disabled={loadingLogs}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                id="re-fetch-logs-btn"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Ingress Error */}
            {logsError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs shadow-sm">
                <p className="font-semibold">Telemetry extraction failed</p>
                <p className="text-red-650 text-[11px] mt-0.5">{logsError}</p>
              </div>
            )}

            {/* Spinner */}
            {loadingLogs && (
              <div className="space-y-3 py-4 animate-pulse">
                <div className="h-16 bg-slate-900 rounded-xl w-full" />
                <div className="h-16 bg-slate-900 rounded-xl w-full" />
              </div>
            )}

            {/* Empty check */}
            {!loadingLogs && !logsError && auditLogs.length === 0 && (
              <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl font-sans">
                <Terminal className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">No logs found</p>
                <p className="text-slate-500 text-[11px] mt-0.5">The platform audit logs directory is currently empty.</p>
              </div>
            )}

            {/* Logs List representation */}
            {!loadingLogs && !logsError && auditLogs.length > 0 && (
              <div className="space-y-3">
                {auditLogs.map(l => (
                  <div key={l.id} className="p-4 bg-slate-900 text-slate-200 border border-slate-950 rounded-xl space-y-2 font-mono text-[11px] shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-slate-400">
                      <span className="font-bold text-emerald-400">{l.action}</span>
                      <span className="text-[10px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-100 leading-relaxed text-xs font-sans">{l.details || `Admin execution trigger: ${l.action}`}</p>
                    <p className="text-[10px] text-slate-500">operator: {l.operator} • cluster namespace target: {l.target}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "revenue" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs animate-fadeIn" id="saas-tab-revenue">
            <div>
              <h2 className="text-base font-bold text-slate-900">Subscription Licenses and MRR Summary</h2>
              <p className="text-xs text-slate-500 mt-1">
                Track dynamic billing outputs and upcoming renewals in real-time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-6 border border-slate-200 rounded-2xl space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dynamic License MRR</p>
                <p className="text-4xl font-extrabold text-emerald-700 font-mono">{stats.subscriptionRevenue}</p>
                <div className="pt-2 border-t border-dashed border-slate-200 text-slate-600">
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-500">Starter Tier ($99/mo)</span>
                    <span className="font-semibold text-slate-805">
                      {tenants.filter(t => t.plan === "STARTER" && t.status === "ACTIVE").length} active
                    </span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-500">Growth Tier ($249/mo)</span>
                    <span className="font-semibold text-slate-805">
                      {tenants.filter(t => (t.plan === "GROWTH" || !t.plan) && t.status === "ACTIVE").length} active
                    </span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-500">Professional Enterprise ($499/mo)</span>
                    <span className="font-semibold text-slate-805">
                      {tenants.filter(t => t.plan === "PROFESSIONAL" && t.status === "ACTIVE").length} active
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 border border-slate-200 rounded-2xl flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">Dynamic Billing Status</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Recurring client invocations are billed automatically on the 1st of every calendar month through automated Stripe hooks. Use settings to declare public payment accounts.
                  </p>
                </div>
                <div className="bg-yellow-50 text-yellow-850 border border-yellow-105 text-[11px] p-3 rounded-lg font-medium flex items-start gap-2 mt-4">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-yellow-600" />
                  <span>Staging billing metrics correspond to sandboxed transaction logs only.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs" id="saas-tab-settings">
            <div>
              <h2 className="text-base font-bold text-slate-900">Global DNS and Security Parameters</h2>
              <p className="text-xs text-slate-500 mt-1">
                System parameters controlling hostname routing and root credentials locks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-750 font-sans">
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Multi-Tenant Routing Policy</h4>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Strict Hostname matching rules</span>
                      <span className="text-emerald-700 font-bold uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded">Enforced</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Dynamic Subdomains provisioning</span>
                      <span className="text-emerald-700 font-bold uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded">Enforced</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Database Limits</h4>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-500">Max schema namespace clusters</span>
                      <span className="font-bold text-slate-850">Unlimited</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-500">Max plots table allocation</span>
                      <span className="font-bold text-slate-850">10,000 lots / cluster</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Ingress Control Core Security</h4>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">Server Container Node</p>
                    <p className="text-slate-500 leading-normal">
                      The service binds directly to host IP <strong className="font-mono text-slate-705">0.0.0.0</strong> mapping ingress to internal container PORT <strong className="font-mono text-slate-705">3000</strong> behind modern reverse proxies.
                    </p>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-250 flex items-center gap-2">
                    <Server className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-[11px] text-slate-600 font-mono">BhoomiOne Server Handshake 3.5.21V</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Provision new tenant modal drawer */}
      {showAddTenant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4" id="provision-tenant-modal">
            <h2 className="text-lg font-bold text-slate-900">Provision Tenant Domain Suite</h2>
            <p className="text-xs text-slate-500 leading-normal">
              Entering the parameters below registers a new PostgreSQL schema configuration dynamically. This updates mapping matrices in real-time.
            </p>

            {/* Error Message banner */}
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-650 text-xs flex items-start gap-2" id="provision-err-msg">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Success Message banner */}
            {submitSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-805 text-xs flex items-center gap-2" id="provision-success-msg">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-4" id="provision-tenant-form">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Company/Authority Name</label>
                <input 
                  type="text"
                  required
                  disabled={loading}
                  placeholder="e.g. Prestige Planners Ltd"
                  value={newTenant.name}
                  onChange={(e) => {
                    const cleanCode = e.target.value.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-");
                    setNewTenant({ ...newTenant, name: e.target.value, code: cleanCode });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none disabled:opacity-60"
                  id="provision-comp-input"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Domain Namespace / Code</label>
                <div className="flex items-center gap-1">
                  <input 
                    type="text"
                    required
                    disabled={loading}
                    placeholder="e.g. prestige"
                    value={newTenant.code}
                    onChange={(e) => {
                      const strictCode = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                      setNewTenant({ ...newTenant, code: strictCode });
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none font-mono disabled:opacity-60"
                    id="provision-code-input"
                  />
                  <span className="text-xs text-slate-500 font-semibold font-mono">.bhoomione.in</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Subscription License Tier</label>
                <select
                  disabled={loading}
                  value={newTenant.plan}
                  onChange={(e) => setNewTenant({ ...newTenant, plan: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none disabled:opacity-60"
                  id="provision-plan-select"
                >
                  <option value="STARTER">Starter Plan ($99/mo)</option>
                  <option value="GROWTH">Growth Plan ($249/mo)</option>
                  <option value="PROFESSIONAL">Professional Enterprise ($499/mo)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => setShowAddTenant(false)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold text-xs py-2 disabled:opacity-50"
                  id="provision-close-btn"
                >
                  Close
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs py-2 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  id="provision-submit-btn"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? "Registering..." : "Authorize Registry"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
