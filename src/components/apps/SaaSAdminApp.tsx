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
  Clock
} from "lucide-react";

export default function SaaSAdminApp() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"clusters" | "logs" | "revenue" | "settings">("clusters");
  
  const [tenants, setTenants] = useState<any[]>([
    { id: "ten-01", name: "Bhoomi Realty Developers", code: "bhoomi-alpha", plan: "GROWTH", status: "ACTIVE", plots: 124, dbSize: "14.2 MB", created: "2025-01-10" },
    { id: "ten-02", name: "Apex Plotting Conglomerate", code: "apex-plots", plan: "PROFESSIONAL", status: "ACTIVE", plots: 250, dbSize: "28.5 MB", created: "2025-03-12" },
    { id: "ten-03", name: "Capital Housing Estates", code: "capital-house", plan: "STARTER", status: "ACTIVE", plots: 45, dbSize: "4.1 MB", created: "2025-05-18" },
    { id: "ten-04", name: "Vantage Lands International", code: "vantage-labs", plan: "GROWTH", status: "SUSPENDED", plots: 80, dbSize: "12.8 MB", created: "2025-06-01" },
  ]);

  const [auditLogs, setAuditLogs] = useState<any[]>([
    { id: "1", action: "TENANT_PROVISION_SUCCESS", target: "apex-plots", operator: "admin@bhoomione.in", details: "Provisioned database container schema cluster 'apex-plots'.", timestamp: "10:14:02 AM" },
    { id: "2", action: "GATEWAY_RBAC_GRANT", target: "bhoomi-alpha", operator: "system-token", details: "Access code tenants.manage validated for token handshake.", timestamp: "09:42:15 AM" },
    { id: "3", action: "DATABASE_VACUUM_PERFORMED", target: "bhoomione_v2_prod", operator: "cron-engine", details: "Vacuumed index indexes freeing 48.2 MB buffer cache.", timestamp: "02:00:00 AM" }
  ]);

  const [loading, setLoading] = useState(false);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: "", code: "", plan: "GROWTH", company: "" });
  const [stats, setStats] = useState({
    activeTenants: 4,
    totalPlots: 499,
    dbConnections: 12,
    subscriptionRevenue: "$4,240 / mo"
  });

  useEffect(() => {
    const user = api.getCurrentUser();
    if (user && user.role === "admin") {
      setCurrentUser(user);
    }
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.code) return;

    setLoading(true);
    setTimeout(() => {
      const code = newTenant.code.toLowerCase().trim().replace(/\s+/g, "-");
      const createdTenant = {
        id: `ten-${Math.floor(Math.random() * 900) + 100}`,
        name: newTenant.name,
        code,
        plan: newTenant.plan,
        status: "ACTIVE",
        plots: 0,
        dbSize: "256 KB",
        created: new Date().toISOString().split("T")[0]
      };

      setTenants([createdTenant, ...tenants]);

      setAuditLogs([
        {
          id: String(new Date().getTime()),
          action: "TENANT_PROVISION_SUCCESS",
          target: code,
          operator: currentUser?.email || "admin@bhoomione.in",
          details: `Provisioned database container schema cluster '${code}' on plan ${newTenant.plan}.`,
          timestamp: new Date().toLocaleTimeString()
        },
        ...auditLogs
      ]);

      setStats(prev => ({
        ...prev,
        activeTenants: prev.activeTenants + 1,
      }));

      setShowAddTenant(false);
      setNewTenant({ name: "", code: "", plan: "GROWTH", company: "" });
      setLoading(false);
    }, 1200);
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
              <ShieldAlert className="w-3.5 h-3.5 text-red-00" />
              <span>Supervisor: {currentUser.name} (Global Administrator)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              SaaS Control Center
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Platform administration workspace. Control database namespaces, monitor audit metrics, manage active tenant subscriptions and configure gateway limits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAddTenant(true)}
              className="bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Provision Tenant</span>
            </button>
            <button 
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm border border-slate-705"
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
              <div>
                <h2 className="text-base font-bold text-slate-900">Tenant Clusters</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Active isolated developer schemes. Authenticated administrative users are permitted to manage parameters.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-650">
                  <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="px-4 py-3">Tenant Name / Label</th>
                      <th className="px-4 py-3">Inbound Subdomain Mapping</th>
                      <th className="px-4 py-3 text-center">License Level</th>
                      <th className="px-4 py-3 text-center">SQL Footprint</th>
                      <th className="px-4 py-3 text-right">Cluster State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tenants.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div>
                            <p>{t.name}</p>
                            <p className="text-[10px] text-indigo-600 font-mono">namespace: {t.code}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5 font-mono text-[10px]">
                            <p className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded w-fit select-all">{t.code}.bhoomione.in</p>
                            <p className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded w-fit select-all">{t.code}.staging.bhoomione.in</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-amber-50 text-amber-805 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-100">
                            {t.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-500">{t.dbSize}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            t.status === "ACTIVE" 
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-150" 
                              : "bg-red-50 text-red-800 border border-red-150"
                          }`}>
                            <div className={`w-1 h-1 rounded-full ${t.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"}`} />
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                onClick={() => alert("Simulation log cache has been refreshed successfully.")}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {auditLogs.map(l => (
                <div key={l.id} className="p-4 bg-slate-900 text-slate-200 border border-slate-950 rounded-xl space-y-2 font-mono text-[11px] shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-1.5 text-slate-400">
                    <span className="font-bold text-emerald-400">{l.action}</span>
                    <span className="text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {l.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-100 leading-relaxed text-xs font-sans">{l.details}</p>
                  <p className="text-[10px] text-slate-500">operator: {l.operator} • cluster namespace target: {l.target}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "revenue" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs animate-fadeIn" id="saas-tab-revenue">
            <div>
              <h2 className="text-base font-bold text-slate-900">Subscription Licenses and MRR Summary</h2>
              <p className="text-xs text-slate-400">
                Track dynamic billing outputs and upcoming renewals in real-time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-6 border border-slate-200 rounded-2xl space-y-4">
                <p className="text-xs font-bold text-slate-450 uppercase tracking-wider">Dynamic License MRR</p>
                <p className="text-4xl font-extrabold text-emerald-700 font-mono">{stats.subscriptionRevenue}</p>
                <div className="pt-2 border-t border-dashed border-slate-200">
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-500">Starter Tier (1 active)</span>
                    <span className="font-semibold text-slate-800">$99/mo</span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-500">Growth Tier (2 active)</span>
                    <span className="font-semibold text-slate-800">$498/mo</span>
                  </div>
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-slate-500">Professional Enterprise (1 active)</span>
                    <span className="font-semibold text-slate-800">$499/mo</span>
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
                <div className="bg-yellow-50 text-yellow-800 border border-yellow-100 text-[11px] p-3 rounded-lg font-medium flex items-start gap-2">
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
              <p className="text-xs text-slate-400">
                System parameters controlling hostname routing and root credentials locks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700 font-sans">
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
                      The service binds directly to host IP <strong className="font-mono text-slate-700">0.0.0.0</strong> mapping ingress to internal container PORT <strong className="font-mono text-slate-700">3000</strong> behind modern reverse proxies.
                    </p>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
                    <Server className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-[11px] text-slate-650">BhoomiOne Server Handshake 3.5.21V</span>
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

            <form onSubmit={handleCreateTenant} className="space-y-4" id="provision-tenant-form">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Company/Authority Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Prestige Planners Ltd"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value, code: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Domain Namespace / Code Code</label>
                <div className="flex items-center gap-1">
                  <input 
                    type="text"
                    required
                    placeholder="e.g. prestige"
                    value={newTenant.code}
                    onChange={(e) => setNewTenant({ ...newTenant, code: e.target.value })}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none font-mono"
                  />
                  <span className="text-xs text-slate-500 font-semibold">.bhoomione.in</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Subscription License Tier</label>
                <select
                  value={newTenant.plan}
                  onChange={(e) => setNewTenant({ ...newTenant, plan: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                >
                  <option value="STARTER">Starter Plan ($99/mo)</option>
                  <option value="GROWTH">Growth Plan ($249/mo)</option>
                  <option value="PROFESSIONAL">Professional Enterprise ($499/mo)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowAddTenant(false)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold text-xs py-2"
                >
                  Close
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs py-2 transition-colors cursor-pointer"
                >
                  {loading ? "Registering Schema..." : "Authorize Registry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
