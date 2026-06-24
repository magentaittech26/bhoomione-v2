import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Server, Globe, Terminal, Plus, Shield, ShieldAlert, Check, RefreshCw, 
  Trash2, Sliders, Calendar, Zap, Play, X, AlertTriangle, ArrowRight, HelpCircle,
  Activity, Key, CheckCircle, Info, ExternalLink, RefreshCw as RotateCcw, AlertOctagon
} from "lucide-react";
import api from "../../lib/api.ts";
import { formatCurrency } from "../../lib/currency.ts";

interface TenantManagementTabProps {
  initialSubTab?: "directory" | "profiles" | "domains" | "logs";
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function TenantManagementTab({ 
  initialSubTab = "directory",
  showToast 
}: TenantManagementTabProps) {
  const [subTab, setSubTab] = useState<"directory" | "profiles" | "domains" | "logs">(initialSubTab);
  
  // Data State
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Interaction State
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [lifecycleEvents, setLifecycleEvents] = useState<any[]>([]);
  const [selectedTenantDomains, setSelectedTenantDomains] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals Trigger State
  const [showProvisionModal, setShowProvisionModal] = useState<boolean>(false);
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [showAddonModal, setShowAddonModal] = useState<boolean>(false);
  const [showDomainModal, setShowDomainModal] = useState<boolean>(false);
  const [showActionModal, setShowActionModal] = useState<
    "ACTIVATE" | "SUSPEND" | "RESUME" | "CANCEL" | null
  >(null);
  const [actionReason, setActionReason] = useState<string>("");

  // Form Inputs State
  // 1. Provisioning Form
  const [provCode, setProvCode] = useState<string>("");
  const [provName, setProvName] = useState<string>("");
  const [provPlanId, setProvPlanId] = useState<string>("");
  const [provDomain, setProvDomain] = useState<string>("");
  const [provType, setProvType] = useState<string>("SUBDOMAIN");
  const [provTier, setProvTier] = useState<string>("SHARED");
  const [provStatus, setProvStatus] = useState<string>("TRIAL");
  const [submittingProv, setSubmittingProv] = useState<boolean>(false);

  // 2. Change Plan Form
  const [targetPlanId, setTargetPlanId] = useState<string>("");
  const [submittingPlan, setSubmittingPlan] = useState<boolean>(false);

  // 3. Addon Form
  const [targetAddonId, setTargetAddonId] = useState<string>("");
  const [submittingAddon, setSubmittingAddon] = useState<boolean>(false);

  // 4. Domain attachment form
  const [newDomainString, setNewDomainString] = useState<string>("");
  const [newDomainType, setNewDomainType] = useState<string>("CUSTOM");
  const [submittingDomain, setSubmittingDomain] = useState<boolean>(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [tData, pData, aData, lData] = await Promise.all([
        api.fetchTenants(),
        api.fetchSaasPlans(),
        api.fetchSaasAddons(),
        api.fetchProvisioningLogs()
      ]);
      setTenants(tData || []);
      setPlans(pData || []);
      setAddons(aData || []);
      setAllLogs(lData || []);
    } catch (err: any) {
      console.error(err);
      showToast("Failed to load tenant ecosystem details from database.", "error");
    } finally {
      setLoading(false);
    }
  };

  const reloadTenantsOnly = async () => {
    try {
      setRefreshing(true);
      const [tData, lData] = await Promise.all([
        api.fetchTenants(),
        api.fetchProvisioningLogs()
      ]);
      setTenants(tData || []);
      setAllLogs(lData || []);
      if (selectedTenant) {
        const refreshedSelected = tData.find((t: any) => t.id === selectedTenant.id);
        if (refreshedSelected) {
          setSelectedTenant(refreshedSelected);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectTenant = async (tenant: any) => {
    setSelectedTenant(tenant);
    try {
      const [events, domains] = await Promise.all([
        api.fetchLifecycleEvents(tenant.id),
        api.fetchTenantDomains(tenant.id)
      ]);
      setLifecycleEvents(events || []);
      setSelectedTenantDomains(domains || []);
    } catch (err) {
      console.error("Failed to load drill-down information:", err);
    }
  };

  // POST Handlers
  // 1. Provision Workspace
  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provCode || !provName || !provPlanId || !provDomain) {
      showToast("Please fill in all mandatory parameters.", "error");
      return;
    }
    try {
      setSubmittingProv(true);
      await api.provisionTenant({
        tenant_code: provCode,
        company_name: provName,
        plan_id: provPlanId,
        domain: provDomain,
        domain_type: provType,
        infrastructure_tier: provTier,
        initial_status: provStatus
      });
      showToast(`Workspace '${provName}' successfully provisioned!`, "success");
      setShowProvisionModal(false);
      // Reset
      setProvCode("");
      setProvName("");
      setProvPlanId("");
      setProvDomain("");
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to provision workspace. Check code duplication.", "error");
    } finally {
      setSubmittingProv(false);
    }
  };

  // 2. Change Tenant Plan
  const handleChangePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant || !targetPlanId) return;
    try {
      setSubmittingPlan(true);
      await api.changeTenantPlan(selectedTenant.id, targetPlanId);
      showToast("Plan changed successfully!", "success");
      setShowPlanModal(false);
      await reloadTenantsOnly();
    } catch (err: any) {
      showToast(err.message || "Failed to switch plan tier.", "error");
    } finally {
      setSubmittingPlan(false);
    }
  };

  // 3. Attach Custom Domain
  const handleAttachDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant || !newDomainString) return;
    try {
      setSubmittingDomain(true);
      await api.attachTenantDomain(selectedTenant.id, newDomainString, newDomainType);
      showToast(`Domain '${newDomainString}' attached to workspace.`, "success");
      setShowDomainModal(false);
      setNewDomainString("");
      
      // Refresh domains view
      const domains = await api.fetchTenantDomains(selectedTenant.id);
      setSelectedTenantDomains(domains || []);
      await reloadTenantsOnly();
    } catch (err: any) {
      showToast(err.message || "Failed to bind domain structure.", "error");
    } finally {
      setSubmittingDomain(false);
    }
  };

  // 4. Assign Addon
  const handleAssignAddonSubmit = async (addonId: string) => {
    if (!selectedTenant) return;
    try {
      setSubmittingAddon(true);
      await api.assignTenantAddon(selectedTenant.id, addonId);
      showToast("Utility add-on allocated successfully!", "success");
      setShowAddonModal(false);
      await reloadTenantsOnly();
    } catch (err: any) {
      showToast(err.message || "Failed to assign add-on package.", "error");
    } finally {
      setSubmittingAddon(false);
    }
  };

  // 5. Remove Addon
  const handleRemoveAddon = async (addonId: string) => {
    if (!selectedTenant) return;
    try {
      await api.removeTenantAddon(selectedTenant.id, addonId);
      showToast("Add-on removed from workspace configuration.", "success");
      await reloadTenantsOnly();
    } catch (err: any) {
      showToast(err.message || "Failed to dismiss add-on package.", "error");
    }
  };

  // 6. Subscription Lifecycle Actions (Activate, Suspend, Resume, Cancel)
  const handleLifecycleActionSubmit = async () => {
    if (!selectedTenant || !showActionModal) return;
    try {
      const id = selectedTenant.id;
      if (showActionModal === "ACTIVATE") {
        await api.activateTenant(id);
        showToast("Tenant successfully activated!", "success");
      } else if (showActionModal === "SUSPEND") {
        await api.suspendTenant(id, actionReason);
        showToast("Workspace locked and suspended.", "success");
      } else if (showActionModal === "RESUME") {
        await api.resumeTenant(id);
        showToast("Tenant workspace resumed successfully.", "success");
      } else if (showActionModal === "CANCEL") {
        await api.cancelTenant(id, actionReason);
        showToast("Tenant subscription terminated.", "success");
      }
      setShowActionModal(null);
      setActionReason("");
      await reloadTenantsOnly();
      // Reload sub details
      const events = await api.fetchLifecycleEvents(id);
      setLifecycleEvents(events || []);
    } catch (err: any) {
      showToast(err.error || err.message || "Operation rejected by transition engine.", "error");
    }
  };

  // Filtering
  const filteredTenants = tenants.filter((t: any) => {
    const matchSearch = 
      t.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tenant_code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const subStatus = t.subscription ? t.subscription.status : "MOCK";
    const matchStatus = statusFilter === "ALL" || subStatus === statusFilter;
    
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "ACTIVE":
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">ACTIVE</span>;
      case "TRIAL":
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">TRIAL</span>;
      case "SUSPENDED":
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">SUSPENDED</span>;
      case "CANCELLED":
        return <span className="bg-red-100 text-red-800 border border-red-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">CANCELLED</span>;
      case "EXPIRED":
        return <span className="bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">EXPIRED</span>;
      default:
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">{s}</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Horizontal Header Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-3 gap-4">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setSubTab("directory")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === "directory" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Tenant Directory
          </button>
          <button
            onClick={() => setSubTab("profiles")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === "profiles" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Subscription Profiles
          </button>
          <button
            onClick={() => setSubTab("domains")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === "domains" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Domains
          </button>
          <button
            onClick={() => setSubTab("logs")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === "logs" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Provisioning Logs
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadAllData();
              showToast("Refreshing operational matrices...", "success");
            }}
            disabled={loading || refreshing}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap"
            title="Reload metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing || loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
          <button
            onClick={() => {
              if (plans.length === 0) {
                showToast("Please register subscription plans in Subscription Center first.", "error");
                return;
              }
              // Set default selected plan
              if (plans.length > 0) {
                setProvPlanId(plans[0].id);
              }
              setShowProvisionModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 font-extrabold" />
            Provision Workspace
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Connecting database clusters...</p>
          <p className="text-xs text-slate-400 mt-1">Retrieving tenant organization schemas & system ledgers.</p>
        </div>
      ) : (
        <>
          {/* ===================================================== */}
          {/* VIEW A: TENANT DIRECTORY                              */}
          {/* ===================================================== */}
          {subTab === "directory" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Directory Grid */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 flex flex-wrap gap-3 items-center justify-between">
                  <div className="relative flex-1 min-w-[200px]">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                    <input
                      type="text"
                      placeholder="Search company or subdomain code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-bold uppercase">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="TRIAL">Trial</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="EXPIRED">Expired</option>
                    </select>
                  </div>
                </div>

                {filteredTenants.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
                    <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700">No matching clusters found</p>
                    <p className="text-xs text-slate-400 mt-1">Refine your filters or create a new database cluster tenant.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                    <table className="w-full text-xs text-left text-slate-700">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="px-5 py-3.5">Tenant workspace</th>
                          <th className="px-5 py-3.5">Current Plan</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5 text-center">Projects</th>
                          <th className="px-5 py-3.5 text-center">Members</th>
                          <th className="px-5 py-3.5">Renewal / Expiry</th>
                          <th className="px-5 py-3.5 text-right">Operation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTenants.map((t: any) => {
                          const sub = t.subscription;
                          const isSelected = selectedTenant && selectedTenant.id === t.id;
                          return (
                            <tr 
                              key={t.id} 
                              onClick={() => handleSelectTenant(t)}
                              className={`hover:bg-slate-50/50 cursor-pointer transition-all ${
                                isSelected ? "bg-indigo-50/50 border-l-2 border-indigo-600" : ""
                              }`}
                            >
                              <td className="px-5 py-4">
                                <div>
                                  <p className="font-extrabold text-slate-900">{t.company_name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{t.tenant_code}.bhoomione.in</p>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-bold text-slate-800">{sub ? sub.plan_name : "UNASSIGNED"}</span>
                              </td>
                              <td className="px-5 py-4">
                                {getStatusBadge(sub ? sub.status : "MOCK")}
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className="font-mono font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700">
                                  {t.usage.projects}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className="font-mono font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700">
                                  {t.usage.users}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className="text-slate-500 font-semibold">{sub ? sub.expiry_date || "N/A" : "N/A"}</span>
                              </td>
                              <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleSelectTenant(t)}
                                  className="text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-0.5 ml-auto text-xs"
                                >
                                  Manage <ArrowRight className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Drill-down interactive Sidebar Panel */}
              <div className="space-y-6">
                {selectedTenant ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase font-bold tracking-wider font-mono">
                          Workspace profile
                        </span>
                        <button 
                          onClick={() => setSelectedTenant(null)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <h2 className="text-lg font-extrabold text-slate-900 mt-2">{selectedTenant.company_name}</h2>
                      <p className="text-[10px] font-mono text-slate-400">UUID: {selectedTenant.id}</p>
                    </div>

                    {/* Operational Core Metrics */}
                    <div className="space-y-3.5 border-t border-slate-100 pt-4">
                      <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Active Limit Utilization</h3>
                      
                      {/* Project limits */}
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                          <span>Projects Created</span>
                          <span>{selectedTenant.usage.projects} / Active</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-indigo-600 rounded-full h-1.5"
                            style={{ width: `${Math.min(100, (selectedTenant.usage.projects / 10) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* User limits */}
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                          <span>Active Users</span>
                          <span>{selectedTenant.usage.users} / Active</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-emerald-600 rounded-full h-1.5"
                            style={{ width: `${Math.min(100, (selectedTenant.usage.users / 5) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Assigned Add-ons */}
                    <div className="space-y-3 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Assigned Add-ons</h4>
                        <button
                          onClick={() => {
                            if (addons.length === 0) {
                              showToast("Please register administrative add-ons first.", "error");
                              return;
                            }
                            setTargetAddonId(addons[0]?.id || "");
                            setShowAddonModal(true);
                          }}
                          className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>

                      {selectedTenant.subscription?.addons?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedTenant.subscription.addons.map((ad: any) => (
                            <span 
                              key={ad.id}
                              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[10px] text-slate-700 font-bold flex items-center gap-1.5"
                            >
                              <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                              {ad.name}
                              <button 
                                onClick={() => handleRemoveAddon(ad.id)}
                                className="text-slate-400 hover:text-red-600 text-xs text-bold cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No supplemental packages assigned.</p>
                      )}
                    </div>

                    {/* Connected domains */}
                    <div className="space-y-3 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Workspace Domains</h4>
                        <button
                          onClick={() => setShowDomainModal(true)}
                          className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Bind
                        </button>
                      </div>
                      
                      <div className="space-y-1.5">
                        {selectedTenantDomains.map((dom: any) => (
                          <div 
                            key={dom.id}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-between text-[11px]"
                          >
                            <div>
                              <p className="font-bold text-slate-800">{dom.domain || dom.domain_name}</p>
                              <span className="text-[9px] text-slate-400 uppercase font-mono font-bold tracking-wider">{dom.type}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {dom.is_primary && (
                                <span className="bg-indigo-50 border border-indigo-100 text-[8px] text-indigo-600 font-bold px-1.5 py-0.2 rounded uppercase">Primary</span>
                              )}
                              <span className="bg-emerald-50 text-emerald-700 text-[8px] font-bold px-1.5 py-0.2 rounded border border-emerald-100 uppercase">SSL Verified</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Operational Commands Button Grid (Activate, Suspend, Resume, Cancel, Change Plan) */}
                    <div className="space-y-3 border-t border-slate-100 pt-4">
                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Administrative Actions</h4>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {/* Activate for TRIAL */}
                        {selectedTenant.subscription?.status === "TRIAL" && (
                          <button
                            onClick={() => setShowActionModal("ACTIVATE")}
                            className="col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Activate subscription
                          </button>
                        )}

                        {/* Lock / Suspend */}
                        {selectedTenant.subscription?.status === "ACTIVE" && (
                          <button
                            onClick={() => setShowActionModal("SUSPEND")}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            Suspend
                          </button>
                        )}

                        {/* Resume */}
                        {selectedTenant.subscription?.status === "SUSPENDED" && (
                          <button
                            onClick={() => setShowActionModal("RESUME")}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            Resume
                          </button>
                        )}

                        {/* Change Plan */}
                        {["ACTIVE", "TRIAL"].includes(selectedTenant.subscription?.status) && (
                          <button
                            onClick={() => {
                              if (plans.length === 0) {
                                showToast("Please configure core subscription packaging first.", "error");
                                return;
                              }
                              setTargetPlanId(selectedTenant.subscription?.plan_id || plans[0]?.id || "");
                              setShowPlanModal(true);
                            }}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-205 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            Change Plan
                          </button>
                        )}

                        {/* Cancel */}
                        {selectedTenant.subscription?.status !== "CANCELLED" && (
                          <button
                            onClick={() => setShowActionModal("CANCEL")}
                            className="bg-red-50 hover:bg-red-100/80 text-red-700 border border-red-200/80 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                            Cancel Tenant
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Historical transition log */}
                    <div className="space-y-3.5 border-t border-slate-100 pt-4">
                      <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Status Transition History</h4>
                      {lifecycleEvents.length > 0 ? (
                        <div className="relative pl-4 border-l border-slate-200 space-y-4">
                          {lifecycleEvents.slice(0, 4).map((evt: any) => (
                            <div key={evt.id} className="relative text-[11px]">
                              {/* Dot status */}
                              <div className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-350 border-2 border-white ring-1 ring-slate-250" />
                              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                <span className="text-slate-400 capitalize">{evt.old_status || "None"}</span>
                                <span className="text-slate-400">→</span>
                                <span className="text-indigo-600">{evt.new_status}</span>
                              </div>
                              <p className="text-slate-500 mt-0.5">{evt.reason || "Change submitted by platform."}</p>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {new Date(evt.created_at).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No transition logs registered.</p>
                      )}
                    </div>

                  </motion.div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 h-full flex flex-col justify-center">
                    <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold tracking-wider uppercase text-slate-600">Select a workspace cluster</p>
                    <p className="text-[10px] text-slate-400 mt-1">Review domains, allocated add-ons, database sizing, active usage parameters, and issue operational updates.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ===================================================== */}
          {/* VIEW B: SUBSCRIPTION PROFILES                         */}
          {/* ===================================================== */}
          {subTab === "profiles" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="bg-indigo-50 text-indigo-600 rounded-xl p-3">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Plan Tiers</p>
                    <h3 className="text-2xl font-black text-slate-900">{plans.length} Packages</h3>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="bg-emerald-50 text-emerald-600 rounded-xl p-3">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Paid Subscriptions</p>
                    <h3 className="text-2xl font-black text-slate-900">
                      {tenants.filter(t => t.subscription?.status === "ACTIVE").length} Active
                    </h3>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="bg-blue-50 text-blue-600 rounded-xl p-3">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Onward Trials</p>
                    <h3 className="text-2xl font-black text-slate-900">
                      {tenants.filter(t => t.subscription?.status === "TRIAL").length} Free Trials
                    </h3>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">Tenant workspace</th>
                      <th className="px-5 py-3.5">Core Package</th>
                      <th className="px-5 py-3.5">Billed Rate</th>
                      <th className="px-5 py-3.5">Activation Date</th>
                      <th className="px-5 py-3.5">Renewal / Expiry</th>
                      <th className="px-5 py-3.5">Assigned Utilities</th>
                      <th className="px-5 py-3.5">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tenants.map((t: any) => {
                      const sub = t.subscription;
                      if (!sub) return null;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-extrabold text-slate-900">{t.company_name}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{t.tenant_code}.bhoomione.in</p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-slate-800">{sub.plan_name}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-mono font-bold text-slate-900">
                              {sub.plan_code === "ENTERPRISE" ? "Custom Invoice" : "Standard Tier"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-505 font-medium">
                            {sub.start_date || "N/A"}
                          </td>
                          <td className="px-5 py-4 text-slate-505 font-medium">
                            {sub.renewal_date || sub.expiry_date || "N/A"}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1">
                              {sub.addons?.length > 0 ? (
                                sub.addons.map((ad: any) => (
                                  <span key={ad.id} className="bg-slate-100 text-slate-700 border border-slate-200 rounded px-1.5 py-0.2 text-[9px] font-bold">
                                    {ad.code}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">None</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {getStatusBadge(sub.status)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* VIEW C: DOMAINS                                       */}
          {/* ===================================================== */}
          {subTab === "domains" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">Tenant workspace</th>
                      <th className="px-5 py-3.5">Mapped Hostname</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Primary Alignment</th>
                      <th className="px-5 py-3.5">SSL Status</th>
                      <th className="px-5 py-3.5">DNS Resolution</th>
                      <th className="px-5 py-3.5">Verified Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tenants.flatMap((t: any) => (t.domains || []).map((dom: any) => (
                      <tr key={dom.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-extrabold text-slate-900">{t.company_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Code: {t.tenant_code}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono font-extrabold text-indigo-650 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          {dom.domain || dom.domain_name}
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-[9px] font-bold uppercase py-0.5 px-2 bg-slate-50 border border-slate-150 rounded text-slate-600">
                            {dom.type}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {dom.is_primary ? (
                            <span className="text-indigo-600 font-extrabold flex items-center gap-1 text-[11px]">
                              <Check className="w-3.5 h-3.5 font-bold" /> Primary
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Alternate</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wide">ACTIVE SSL</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wide font-mono">RESOLVED</span>
                        </td>
                        <td className="px-5 py-4 text-slate-505 font-mono">
                          {dom.verified_at || "N/A"}
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* VIEW D: PROVISIONING LOGS TIMELINE                    */}
          {/* ===================================================== */}
          {subTab === "logs" && (
            <div className="space-y-6 animate-fade">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex align-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-550 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-slate-400" />
                    Complete provisioning ledger
                  </h3>
                </div>
                
                {allLogs.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-450 italic">No historical jobs indexed.</p>
                ) : (
                  <table className="w-full text-xs text-left text-slate-705">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3.5">Job UUID</th>
                        <th className="px-5 py-3.5">Workspace Organization</th>
                        <th className="px-5 py-3.5">Action Type</th>
                        <th className="px-5 py-3.5">Execution Status</th>
                        <th className="px-5 py-3.5">Initiator Id</th>
                        <th className="px-5 py-3.5">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allLogs.map((l: any) => (
                        <tr key={l.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4 font-mono text-slate-400 text-[10px]">
                            {l.id}
                          </td>
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-extrabold text-slate-900">{l.tenant_name}</p>
                              <p className="text-[10px] text-indigo-500 font-mono">Code: {l.tenant_code}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-mono text-[10px] font-black uppercase text-indigo-650 bg-indigo-50 px-2.5 py-0.8 rounded">
                              {l.job_type}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {l.status === "SUCCESS" ? (
                              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black tracking-wide uppercase px-2 py-0.5 border border-emerald-100 rounded">SUCCESS</span>
                            ) : l.status === "FAILED" ? (
                              <span className="bg-red-50 text-red-700 text-[10px] font-black tracking-wide uppercase px-2 py-0.5 border border-red-100 rounded">FAILED: {l.error_message}</span>
                            ) : (
                              <span className="bg-amber-50 text-amber-700 text-[10px] font-black tracking-wide uppercase px-2 py-0.5 border border-amber-100 rounded">PROCESSING</span>
                            )}
                          </td>
                          <td className="px-5 py-4 font-mono text-slate-450 text-[10px]">
                            {l.created_by || "ADMIN_SUITE_UI"}
                          </td>
                          <td className="px-5 py-4 text-slate-505 font-semibold">
                            {l.created_at || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ===================================================== */}
      {/* MODAL 1: PROVISION WORKSPACE                          */}
      {/* ===================================================== */}
      <AnimatePresence>
        {showProvisionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProvisionModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            {/* Window */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-xl w-full p-6 relative shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 uppercase">
                  <Server className="w-4 h-4 text-indigo-600" />
                  Provision tenant workspace & DNS configurations
                </h3>
                <button onClick={() => setShowProvisionModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleProvisionSubmit} className="space-y-4 text-xs font-semibold text-slate-800">
                <div className="grid grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block mb-1 text-slate-600">Workspace Code name (alphanumeric)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. smartinfra"
                      value={provCode}
                      onChange={(e) => {
                        const code = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
                        setProvCode(code);
                        if (!provDomain || provDomain.endsWith(".bhoomione.in")) {
                          setProvDomain(code ? `${code}.bhoomione.in` : "");
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-600">Administrative Company Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Smart Township Inc"
                      value={provName}
                      onChange={(e) => setProvName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-600">Target SaaS Subscription Package</label>
                    <select
                      value={provPlanId}
                      onChange={(e) => setProvPlanId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 focus:bg-white focus:outline-none"
                    >
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({formatCurrency(Number(p.monthly_price))}/mo)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-600">DNS Domain Host</label>
                    <input
                      type="text"
                      required
                      placeholder="smartinfra.bhoomione.in"
                      value={provDomain}
                      onChange={(e) => setProvDomain(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-600">Domain Mapping Logic</label>
                    <select
                      value={provType}
                      onChange={(e) => setProvType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 focus:bg-white focus:outline-none"
                    >
                      <option value="SUBDOMAIN">Subdomain (Platform managed)</option>
                      <option value="CUSTOM">Custom root Domain (Client mapped)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-600">Infrastructure Tier Mode</label>
                    <select
                      value={provTier}
                      onChange={(e) => setProvTier(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 focus:bg-white focus:outline-none"
                    >
                      <option value="SHARED">Tenant Namespace Isolation (PostgreSQL Shared PG-Master)</option>
                      <option value="DEDICATED">Dedicated Schema Vault (PostgreSQL Isolated Namespace)</option>
                      <option value="ENTERPRISE">Dedicated Cloud VPC (Dedicated physical Instance Cluster)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-slate-600">Starting Lifecycle status</label>
                    <select
                      value={provStatus}
                      onChange={(e) => setProvStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 focus:bg-white focus:outline-none"
                    >
                      <option value="TRIAL">14-Day Automated FREE TRIAL status</option>
                      <option value="ACTIVE">IMMEDIATE PAID SUBSCRIPTION</option>
                    </select>
                  </div>

                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowProvisionModal(false)}
                    className="border border-slate-200 hover:bg-slate-55 rounded-xl px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProv}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 font-extrabold shadow"
                  >
                    {submittingProv ? "Spinning containers..." : "Initialize Tenant Operations"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================== */}
      {/* MODAL 2: CHANGE WORKSPACE PLAN                        */}
      {/* ===================================================== */}
      <AnimatePresence>
        {showPlanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPlanModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 uppercase">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Migrate Subscription Packaging Tier
                </h3>
                <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleChangePlanSubmit} className="space-y-4 text-xs font-semibold text-slate-800">
                <div>
                  <p className="text-slate-500 mb-3 leading-relaxed">
                    Migrating package rates will immediately realign the tenant's maximum projects count, member roster slots, and layout boundaries.
                  </p>
                  <label className="block mb-1">Target subscription Tier</label>
                  <select
                    value={targetPlanId}
                    onChange={(e) => setTargetPlanId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({formatCurrency(Number(p.monthly_price))}/month)</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button type="button" onClick={() => setShowPlanModal(false)} className="border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl">
                    Cancel
                  </button>
                  <button type="submit" disabled={submittingPlan} className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2 rounded-xl">
                    {submittingPlan ? "Calculating..." : "Apply migration change"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================== */}
      {/* MODAL 3: ASSIGN SUPPLEMENT PACKAGE (ADDON)            */}
      {/* ===================================================== */}
      <AnimatePresence>
        {showAddonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddonModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 uppercase">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  Allocate Utility add-on profile
                </h3>
                <button onClick={() => setShowAddonModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-semibold text-slate-800">
                <p className="text-slate-550 leading-relaxed">
                  Assigning supplemental features provides instantaneous access to heavier file-parsing engines or higher mapping thresholds.
                </p>
                
                <div className="space-y-2">
                  <label className="block text-slate-650">Select Utility Catalog Item</label>
                  <select
                    value={targetAddonId}
                    onChange={(e) => setTargetAddonId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  >
                    {addons.map(ad => (
                      <option key={ad.id} value={ad.id}>{ad.name} (+{formatCurrency(Number(ad.monthly_price))}/month)</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button type="button" onClick={() => setShowAddonModal(false)} className="border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl">
                    Close
                  </button>
                  <button 
                    onClick={() => handleAssignAddonSubmit(targetAddonId)}
                    disabled={submittingAddon}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-extrabold shadow-sm cursor-pointer"
                  >
                    {submittingAddon ? "Binding Add-on..." : "Authorize assignment"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================== */}
      {/* MODAL 4: BIND DOMAIN                                  */}
      {/* ===================================================== */}
      <AnimatePresence>
        {showDomainModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDomainModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 uppercase">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  Bind Domain Map configuration
                </h3>
                <button onClick={() => setShowDomainModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAttachDomainSubmit} className="space-y-4 text-xs font-semibold text-slate-850">
                <div>
                  <label className="block mb-1 text-slate-600">DNS hostname string</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. township-v2.customclient.in"
                    value={newDomainString}
                    onChange={(e) => setNewDomainString(e.target.value.toLowerCase().trim())}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">Addressing type</label>
                  <select
                    value={newDomainType}
                    onChange={(e) => setNewDomainType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  >
                    <option value="CUSTOM">Custom root Domain (Client mapped)</option>
                    <option value="SUBDOMAIN">Alternate Subdomain (Managed scope)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button type="button" onClick={() => setShowDomainModal(false)} className="border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl">
                    Cancel
                  </button>
                  <button type="submit" disabled={submittingDomain} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-extrabold cursor-pointer">
                    {submittingDomain ? "Updating DNS entries..." : "Attach domain Map"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===================================================== */}
      {/* MODAL 5: LIFECYCLE OPERATIONS CONTROL (ACTIVATE, SUSPEND, RESUME, CANCEL) */}
      {/* ===================================================== */}
      <AnimatePresence>
        {showActionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActionModal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl z-10 space-y-4 font-sans"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <AlertTriangle className={`w-5 h-5 ${showActionModal === "CANCEL" ? 'text-red-500' : 'text-amber-500'}`} />
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  ⚠️ Administrative Subscription Override
                </h3>
              </div>

              <div className="text-xs font-semibold space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 leading-relaxed text-slate-700">
                  {showActionModal === "ACTIVATE" && "You are activating this trial workspace onto a billing period subscription schedule."}
                  {showActionModal === "SUSPEND" && "LOCKDOWN EXECUTABLE: Suspension immediate limits down member logins and closes resolution of DXF, layout maps operations. Proceed with extreme vigilance."}
                  {showActionModal === "RESUME" && "Resuming this cluster immediately unlocks all layouts, members, and restores standard operational limits."}
                  {showActionModal === "CANCEL" && "CRITICAL WARNING: Terminating this workspace marks the subscription CANCELLED, suspends workspace endpoints resolving, preventing any project or plot modifications. There is no automatic data recovery."}
                </div>

                {["SUSPEND", "CANCEL"].includes(showActionModal) && (
                  <div>
                    <label className="block mb-1 text-slate-650">Justification explanation log (Required)</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Input standard audit trailing reason e.g. Delinquent invoice billing payment term..."
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowActionModal(null);
                      setActionReason("");
                    }} 
                    className="border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={handleLifecycleActionSubmit}
                    disabled={["SUSPEND", "CANCEL"].includes(showActionModal) && !actionReason}
                    className={`px-4 py-2 rounded-xl font-extrabold text-white cursor-pointer shadow-sm shadow-indigo-600/10 ${
                      showActionModal === "CANCEL" 
                        ? "bg-red-650 hover:bg-red-750" 
                        : showActionModal === "SUSPEND"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    Confirm transaction
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
