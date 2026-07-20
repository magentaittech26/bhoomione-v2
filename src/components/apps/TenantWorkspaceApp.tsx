import React, { useState, useEffect } from "react";
import api from "../../lib/api.ts";
import { UserProfile } from "../../types/auth.ts";
import TenantLogin from "../TenantLogin.tsx";
import PasswordReset from "../PasswordReset.tsx";
import Dashboard from "../Dashboard.tsx";
import SettingsBilling from "../SettingsBilling.tsx";
import { ShieldCheck, ArrowRight, Building2, HelpCircle, ServerOff, Settings, Layout, Sliders } from "lucide-react";

interface TenantWorkspaceAppProps {
  tenantCode: string | null;
}

interface TenantDetails {
  name: string;
  plan: string;
  database: string;
  supportEmail: string;
}

const TENANT_REGISTRY: Record<string, TenantDetails> = {
  "bhoomi-alpha": {
    name: "Bhoomi Realty Developers",
    plan: "Growth Enterprise Plan",
    database: "bhoomione_bhoomi_alpha",
    supportEmail: "support@bhoomirealty.in"
  },
  "apex-plots": {
    name: "Apex Plotting Conglomerate",
    plan: "Professional Scale Plan",
    database: "bhoomione_apex_plots",
    supportEmail: "ops@apexconglomerate.com"
  },
  "capital-house": {
    name: "Capital Housing Estates",
    plan: "Starter Basic Plan",
    database: "bhoomione_capital_house",
    supportEmail: "billing@capitalhouse.in"
  },
  "vantage-labs": {
    name: "Vantage Lands International",
    plan: "Growth Enterprise Plan",
    database: "bhoomione_vantage_labs",
    supportEmail: "contact@vantagelands.com"
  }
};

export default function TenantWorkspaceApp({ tenantCode }: TenantWorkspaceAppProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<"login" | "reset">("login");
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings">("dashboard");

  // Lookup tenant details dynamically
  const code = tenantCode || "bhoomi-alpha";
  const resolvedTenant = TENANT_REGISTRY[code] || {
    name: code.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
    plan: "Dynamic Sandbox Allocation",
    database: `bhoomione_dynamic_${code.replace(/-/g, "_")}`,
    supportEmail: `admin@${code}.bhoomione.in`
  };

  useEffect(() => {
    // Session token handshake from sessionStorage
    const cachedUser = api.getCurrentUser();
    if (cachedUser) {
      setCurrentUser(cachedUser);
    }
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setView("login");
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
  };

  return (
    <div className="w-full min-h-[85vh] bg-slate-50 flex flex-col" id="tenant-workspace-app">
      {/* Dynamic Tenant Resolver Banner (Horizontal status ribbon) */}
      <div className="bg-white border-b border-slate-200/60 px-6 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]" id="tenant-workspace-header-ribbon">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5 text-xs font-medium text-slate-800">
            <div className="p-1.5 bg-indigo-50/60 rounded-lg text-indigo-650">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Workspace Tenant</span>
              <span className="font-semibold text-slate-900 leading-tight">
                {resolvedTenant.name}
              </span>
            </div>
            <span className="font-mono text-[10px] bg-slate-100/80 text-slate-600 border border-slate-200/50 px-2 py-0.5 rounded-md ml-2">
              {code}
            </span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px] text-slate-500">
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Schema:</span>
              <span className="font-semibold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-150">{resolvedTenant.database}</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Tier:</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50/60 px-1.5 py-0.5 rounded border border-emerald-100/55">{resolvedTenant.plan}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col justify-start">
        {currentUser ? (
          // Authenticated Protected Tenant Dashboard Layout
          // We wrap the Dashboard in a tenant layout with explicit brand title injection
          <div className="space-y-6 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm mb-2" id="tenant-session-bar">
              <div className="flex items-center gap-3 text-xs font-medium text-slate-700">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">Session Active</span>
                    <span className="font-mono text-[9px] font-extrabold uppercase tracking-widest bg-emerald-100/70 text-emerald-800 border border-emerald-200/40 py-0.5 px-2 rounded-md">
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Role-based access controls fully enforced</p>
                </div>
              </div>

              {/* Navigation Tabs Switcher */}
              <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shadow-inner">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === "dashboard"
                      ? "bg-white text-slate-900 shadow-sm font-bold border border-slate-200/20"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  id="tab-erp-dashboard"
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>ERP Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === "settings"
                      ? "bg-white text-slate-900 shadow-sm font-bold border border-slate-200/20"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  id="tab-settings-billing"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings &amp; Billing</span>
                </button>
              </div>
            </div>
            
            {activeTab === "dashboard" ? (
              <Dashboard user={currentUser} onLogout={handleLogout} />
            ) : (
              <SettingsBilling user={currentUser} onLogout={handleLogout} />
            )}
          </div>
        ) : (
          // Guest Tenant Workspace Authorization Layout
          <div className="w-full max-w-lg mx-auto py-10 space-y-8" id="tenant-guest-zone">
            
            {/* Elegant Header with Resolved Tenant Name */}
            <div className="text-center space-y-2">
              <p className="text-[10px] uppercase font-mono tracking-widest text-indigo-600 font-extrabold bg-indigo-50 px-2.5 py-0.5 rounded-full w-fit mx-auto border border-indigo-100">
                Tenant Portal Entry Gate
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-905">
                {resolvedTenant.name}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Authenticate using workspace credentials registered on this tenant subdomain branch. Database access limits will be dynamically governed.
              </p>
            </div>

            {view === "login" ? (
              <div className="space-y-6">
                <TenantLogin
                  onLoginSuccess={handleLoginSuccess}
                  onForgotPassword={() => setView("reset")}
                  defaultTenantCode={code}
                />
              </div>
            ) : (
              <PasswordReset onBackToLogin={() => setView("login")} />
            )}

            {/* SLA Compliance Statement */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center text-xs text-slate-550 space-y-3 shadow-xs" id="tenant-compliance">
              <div className="flex justify-center text-indigo-650">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="font-semibold text-slate-800">Sprint 1B Multi-Tenancy Compliance Active</p>
              <p className="text-[11px] leading-relaxed">
                Security handshakes query table rows partition matching target schema. Role-based filters (RBAC) restrict read-write operations in real-time.
              </p>
              
              <div className="pt-2 border-t border-slate-150 flex justify-between text-[10px] font-mono text-slate-400">
                <span>Support: {resolvedTenant.supportEmail}</span>
                <span>Active Isolation: V3</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
