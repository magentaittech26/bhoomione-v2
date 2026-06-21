import { useState, useEffect } from "react";
import api from "./lib/api.ts";
import { DomainResolver, AppType, ResolvedDomain } from "./lib/DomainResolver.ts";
import MarketplaceApp from "./components/apps/MarketplaceApp.tsx";
import SaaSAdminApp from "./components/apps/SaaSAdminApp.tsx";
import TenantWorkspaceApp from "./components/apps/TenantWorkspaceApp.tsx";
import CustomerPortalApp from "./components/apps/CustomerPortalApp.tsx";
import AgentPortalApp from "./components/apps/AgentPortalApp.tsx";
import { Server, ShieldCheck, Globe, Sliders, Info, Cpu, CheckCircle } from "lucide-react";

export default function App() {
  const [resolved, setResolved] = useState<ResolvedDomain | null>(null);
  const [systemOnline, setSystemOnline] = useState<boolean | null>(null);
  const [simulatedApp, setSimulatedApp] = useState<AppType | null>(null);
  const [simulatedTenant, setSimulatedTenant] = useState<string>("bhoomi-alpha");
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  useEffect(() => {
    // 1. Resolve host and set primary defaults
    const host = window.location.hostname;
    const res = DomainResolver.resolve(host);
    setResolved(res);

    // 2. Determine eligibility for Sandbox Simulator (Harden rules)
    const metaEnv = (import.meta as any).env;
    const isDevEnv = metaEnv?.MODE === "development" || metaEnv?.DEV;
    const isAllowedHost = 
      host === "localhost" || 
      host === "127.0.0.1" || 
      host.includes("webcontainer") || 
      host.includes("preview") ||
      host.includes(".run.app"); // support development server environment handshakes safely
    
    const simulatorEligible = isDevEnv || isAllowedHost;

    // Sandbox mode allows domain switching, but only when eligible and on unrecognized hostnames
    const unrecognized = 
      host === "localhost" || 
      host.includes(".run.app") || 
      host.includes("127.0.0.1") || 
      !host.endsWith("bhoomione.in");
    
    const shouldBeSandbox = unrecognized && simulatorEligible;
    setIsSandboxMode(shouldBeSandbox);
    if (shouldBeSandbox) {
      // Set the default simulator focus
      setSimulatedApp(res.appType);
    }

    // 3. System-wide PostgreSQL health pings
    api
      .testSystemHealth()
      .then(() => setSystemOnline(true))
      .catch(() => setSystemOnline(false));
  }, []);

  const getActiveAppType = (): AppType => {
    if (isSandboxMode && simulatedApp) {
      return simulatedApp;
    }
    return resolved ? resolved.appType : "marketplace";
  };

  const getActiveTenant = (): string | null => {
    if (isSandboxMode) {
      return simulatedTenant;
    }
    return resolved ? resolved.tenant : null;
  };

  const activeApp = getActiveAppType();
  const activeTenant = getActiveTenant();

  // Helper to construct simulated production / staging hostnames to explain setup to reviewers
  const getExpectedDomainUrl = (type: AppType, tenantName: string, staging: boolean): string => {
    const base = staging ? "staging.bhoomione.in" : "bhoomione.in";
    const prefix = staging ? "staging." : "";
    if (type === "marketplace") return `https://${base}`;
    if (type === "saas-admin") return `https://admin.${base}`;
    if (type === "tenant-workspace") return `https://${tenantName}.${base}`;
    if (type === "customer-portal") return `https://portal.${tenantName}.${base}`;
    if (type === "agent-portal") return `https://agents.${tenantName}.${base}`;
    return "";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="app-workspace">
      {/* 1. Global Multi-Tenant Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 shadow-xs" id="app-header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-sm">
              BO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 tracking-tight">BhoomiOne V3</span>
                {resolved?.isStaging && (
                  <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider">
                    Staging Node
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-450 font-mono tracking-wider uppercase font-semibold">
                Hostname-Aware Navigation Kernel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-755 border border-slate-200 font-mono text-[10px]">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>Host: {resolved?.originalHostname || "scanning..."}</span>
            </div>

            {systemOnline !== null && (
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
                  systemOnline
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${systemOnline ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span>{systemOnline ? "PostgreSQL Pool Active" : "Host Verification Testing"}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Interactive Interactive Developer Simulation Suite (visible in Sandbox/unrecognized hostnames like Localhost) */}
      {isSandboxMode && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 border-b border-indigo-900" id="dev-sandbox-banner">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="space-y-1">
                <p className="text-[10px] bg-indigo-500/20 text-indigo-305 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest w-fit">
                  Preview Environment Simulator Detected
                </p>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Hostname Routing Control Board
                </h4>
                <p className="text-xs text-slate-300">
                  Because this app is running in the sandbox/preview domain (<span className="font-mono text-amber-300">{resolved?.originalHostname}</span>), we have unlocked a domain switcher. Use it below to simulate the production architecture layouts.
                </p>
              </div>

              {/* Subdomain reference cheat-sheet helper tool */}
              <div className="bg-indigo-950/60 border border-indigo-900 rounded-xl p-3 text-[10px] space-y-1 font-mono max-w-sm">
                <span className="font-bold text-slate-350 block border-b border-indigo-901 pb-0.5 mb-1 text-slate-300">Production Routing Matrix</span>
                <p>Marketplace: <span className="text-emerald-450 font-semibold">bhoomione.in</span></p>
                <p>SaaS Admin: <span className="text-emerald-450 font-semibold">admin.bhoomione.in</span></p>
                <p>Tenant Workspace: <span className="text-emerald-400 font-semibold">{"{tenant}"}.bhoomione.in</span></p>
                <p>Customer Portal: <span className="text-emerald-400 font-semibold">portal.{"{tenant}"}.bhoomione.in</span></p>
                <p>Agent Portal: <span className="text-emerald-400 font-semibold">agents.{"{tenant}"}.bhoomione.in</span></p>
              </div>
            </div>

            {/* Simulated Workspace selectors */}
            <div className="flex flex-wrap items-center gap-4 bg-slate-950/50 p-3 rounded-xl border border-indigo-900/50">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Simulate Target Domain Application:</span>
                <div className="flex p-0.5 bg-slate-900 border border-slate-800 rounded-lg" id="app-type-selector">
                  <button
                    onClick={() => setSimulatedApp("marketplace")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      simulatedApp === "marketplace" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Marketplace
                  </button>
                  <button
                    onClick={() => setSimulatedApp("saas-admin")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      simulatedApp === "saas-admin" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    SaaS Admin
                  </button>
                  <button
                    onClick={() => setSimulatedApp("tenant-workspace")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      simulatedApp === "tenant-workspace" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Tenant Workspace
                  </button>
                  <button
                    onClick={() => setSimulatedApp("customer-portal")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      simulatedApp === "customer-portal" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Customer Portal
                  </button>
                  <button
                    onClick={() => setSimulatedApp("agent-portal")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      simulatedApp === "agent-portal" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Agent Portal
                  </button>
                </div>
              </div>

              {simulatedApp !== "marketplace" && simulatedApp !== "saas-admin" && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Mock Tenant Name Target:</span>
                  <input
                    type="text"
                    value={simulatedTenant}
                    onChange={(e) => setSimulatedTenant(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    placeholder="e.g. bhoomi-alpha"
                    className="bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none w-36 font-mono"
                  />
                </div>
              )}

              <div className="md:ml-auto select-none p-2 bg-indigo-950/80 border border-indigo-900 rounded-lg flex items-center gap-1.5">
                <div className="p-1 bg-amber-500/20 text-amber-400 rounded-md">
                  <Info className="w-3.5 h-3.5" />
                </div>
                <div className="text-[10px] leading-relaxed">
                  <p className="text-slate-300">Expected production DNS target mapping:</p>
                  <p className="font-mono text-amber-300 font-semibold select-all">
                    {getExpectedDomainUrl(simulatedApp || "marketplace", simulatedTenant, resolved?.isStaging || false)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Render Resolved Target Workspace Panel */}
      <main className="flex-1" id="main-resolution-viewport">
        {activeApp === "marketplace" && <MarketplaceApp />}
        {activeApp === "saas-admin" && <SaaSAdminApp />}
        {activeApp === "tenant-workspace" && <TenantWorkspaceApp tenantCode={activeTenant} />}
        {activeApp === "customer-portal" && <CustomerPortalApp tenantCode={activeTenant} />}
        {activeApp === "agent-portal" && <AgentPortalApp tenantCode={activeTenant} />}
      </main>

      {/* 4. Compliant Sticky Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 text-center text-xs text-slate-400" id="app-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 BhoomiOne Land Systems. All rights reserved. Multitenancy Hostname Module.</p>
          <div className="flex items-center gap-1.5 text-[10px] bg-slate-50 border border-slate-150 rounded px-2.5 py-0.5 text-slate-505">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            <span>Multi-Tenant Architecture Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
