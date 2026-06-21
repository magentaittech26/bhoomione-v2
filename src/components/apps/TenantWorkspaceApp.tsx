import React, { useState, useEffect } from "react";
import api from "../../lib/api.ts";
import { UserProfile } from "../../types/auth.ts";
import TenantLogin from "../TenantLogin.tsx";
import PasswordReset from "../PasswordReset.tsx";
import Dashboard from "../Dashboard.tsx";
import { ShieldCheck, ArrowRight, Building2, HelpCircle, ServerOff } from "lucide-react";

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
      <div className="bg-slate-100 border-b border-slate-200/80 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Building2 className="w-4 h-4 text-indigo-650" />
            <span>Tenant Namespace Resolved:</span>
            <span className="font-mono text-[11px] bg-slate-200/70 text-indigo-700 px-1.5 py-0.5 rounded">
              {code}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[10px] text-slate-550">
            <span>Primary Schema: <strong className="text-slate-700 font-bold">{resolvedTenant.database}</strong></span>
            <span className="text-slate-300">•</span>
            <span>License: <strong className="text-emerald-700 font-bold">{resolvedTenant.plan}</strong></span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col justify-start">
        {currentUser ? (
          // Authenticated Protected Tenant Dashboard Layout
          // We wrap the Dashboard in a tenant layout with explicit brand title injection
          <div className="space-y-4 w-full">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-xl flex items-center justify-between text-xs font-semibold mb-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
                Auth Route Guard active: Valid Session Token on {resolvedTenant.name}
              </span>
              <span className="font-mono text-[10px] bg-emerald-100 py-0.5 px-2 rounded">
                ROLE: {currentUser.role}
              </span>
            </div>
            
            <Dashboard user={currentUser} onLogout={handleLogout} />
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
