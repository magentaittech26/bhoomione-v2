import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, Sliders, Search, Calendar, Zap, RefreshCw, FileText, 
  Settings, AlertTriangle, Shield, Check, Info, ShieldAlert,
  ArrowRight, ShieldCheck, DollarSign, Layers, Plus, Minus, Key
} from "lucide-react";
import api from "../../lib/api.ts";

interface TenantOverridesTabProps {
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function TenantOverridesTab({ showToast }: TenantOverridesTabProps) {
  // Global Data
  const [tenants, setTenants] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selector State
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [subscriptionProfile, setSubscriptionProfile] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [planFilter, setPlanFilter] = useState<string>("ALL");

  // Local Editable Override States
  const [localFeatures, setLocalFeatures] = useState<Record<string, "ENABLED" | "DISABLED" | "DEFAULT">>({});
  const [localLimits, setLocalLimits] = useState<Record<string, number>>({});
  const [localAddons, setLocalAddons] = useState<string[]>([]); // Array of addon IDs
  const [localBilling, setLocalBilling] = useState({
    custom_monthly_fee: "",
    custom_annual_fee: "",
    custom_discount_percentage: "0",
    special_contract_notes: ""
  });

  const [saving, setSaving] = useState<boolean>(false);

  // Plan Assignment local form states
  const [assignPlanId, setAssignPlanId] = useState<string>("");
  const [assignBillingPeriod, setAssignBillingPeriod] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [assignTrialDays, setAssignTrialDays] = useState<number>(0);

  // Initial Data Fetch
  useEffect(() => {
    fetchInitialEcosystem();
  }, []);

  const fetchInitialEcosystem = async () => {
    try {
      setLoading(true);
      const [tData, mData, pData, aData, lData] = await Promise.all([
        api.fetchTenants(),
        api.fetchSaasModules(),
        api.fetchSaasPlans(),
        api.fetchSaasAddons(),
        // Get generic telemetry logs and filter locally
        api.request<any[]>("/admin/audit-logs", { method: "GET" }).catch(() => [])
      ]);
      
      setTenants(tData || []);
      setModules(mData || []);
      setPlans(pData || []);
      setAddons(aData || []);
      setLogs(lData || []);
    } catch (err) {
      console.error("Failed to load ecosystem data:", err);
      showToast("Could not load SaaS cluster configurations.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Load selected tenant's override configurations
  const handleSelectTenant = async (tenant: any) => {
    setSelectedTenant(tenant);
    setLoadingProfile(true);
    try {
      const profile = await api.fetchTenantSubscription(tenant.id);
      setSubscriptionProfile(profile);

      // Re-map Feature Overrides
      const featMap: Record<string, "ENABLED" | "DISABLED" | "DEFAULT"> = {};
      if (profile?.feature_overrides) {
        profile.feature_overrides.forEach((fo: any) => {
          featMap[fo.feature_id] = fo.override_status;
        });
      }
      setLocalFeatures(featMap);

      // Re-map Limit Overrides
      const limMap: Record<string, number> = {};
      if (profile?.limit_overrides) {
        profile.limit_overrides.forEach((lo: any) => {
          limMap[lo.limit_key] = lo.override_value;
        });
      }
      setLocalLimits(limMap);

      // Re-map Addons assigned
      const addonList: string[] = [];
      if (profile?.addons) {
        profile.addons.forEach((ad: any) => {
          addonList.push(ad.addon_id);
        });
      }
      setLocalAddons(addonList);

      // Re-map Billing Custom Limits
      if (profile?.billing_override) {
        setLocalBilling({
          custom_monthly_fee: profile.billing_override.custom_monthly_fee?.toString() || "",
          custom_annual_fee: profile.billing_override.custom_annual_fee?.toString() || "",
          custom_discount_percentage: profile.billing_override.custom_discount_percentage?.toString() || "0",
          special_contract_notes: profile.billing_override.special_contract_notes || ""
        });
      } else {
        setLocalBilling({
          custom_monthly_fee: "",
          custom_annual_fee: "",
          custom_discount_percentage: "0",
          special_contract_notes: ""
        });
      }
    } catch (err) {
      console.error("Failed to fetch tenant subscription profile:", err);
      showToast("Failed to load specific override mappings.", "error");
    } finally {
      setLoadingProfile(false);
    }
  };

  // Assign standard 14-day trial or standard custom licensing plans
  const handleApplyStarterTrial = async () => {
    if (!selectedTenant) return;
    const starterPlan = plans.find(p => p.plan_code === "STARTER" || p.name?.toUpperCase().includes("STARTER"));
    const planId = starterPlan?.id || plans[0]?.id;
    if (!planId) {
      showToast("No Standard plan available to trigger trial allocation.", "error");
      return;
    }
    setLoadingProfile(true);
    try {
      const res = await api.assignTenantPlan(selectedTenant.id, {
        plan_id: planId,
        billing_period: "MONTHLY",
        trial_days: 14
      });
      if (res.success) {
        showToast("Standard 14-day starter trial successfully allocated.", "success");
        // Reload profile
        await handleSelectTenant(selectedTenant);
      } else {
        showToast(res.message || "Could not allocate standard trial.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Subscription trial provisioning failure.", "error");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleAssignSelectedPlan = async () => {
    if (!selectedTenant) return;
    if (!assignPlanId) {
      showToast("Please select a target plan to assign.", "error");
      return;
    }
    setLoadingProfile(true);
    try {
      const res = await api.assignTenantPlan(selectedTenant.id, {
        plan_id: assignPlanId,
        billing_period: assignBillingPeriod,
        trial_days: assignTrialDays > 0 ? assignTrialDays : null
      });
      if (res.success) {
        showToast("Tenant licensing profile updated successfully.", "success");
        // Reset local input states
        setAssignPlanId("");
        setAssignTrialDays(0);
        // Reload profile
        await handleSelectTenant(selectedTenant);
      } else {
        showToast(res.message || "Failed to update tenant subscription.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Database level subscription linkage error.", "error");
    } finally {
      setLoadingProfile(false);
    }
  };

  // Feature actions
  const toggleFeatureOverride = (featId: string, status: "ENABLED" | "DISABLED" | "DEFAULT") => {
    setLocalFeatures(prev => {
      const next = { ...prev };
      if (status === "DEFAULT") {
        delete next[featId];
      } else {
        next[featId] = status;
      }
      return next;
    });
  };

  // Limit actions
  const handleLimitChange = (key: string, baselineVal: number, change: number) => {
    setLocalLimits(prev => {
      const currentVal = prev[key] !== undefined ? prev[key] : baselineVal;
      const newVal = Math.max(0, currentVal + change);
      return { ...prev, [key]: newVal };
    });
  };

  const handleLimitReset = (key: string) => {
    setLocalLimits(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const setLimitDirectValue = (key: string, valStr: string) => {
    const val = parseInt(valStr);
    if (!isNaN(val) && val >= 0) {
      setLocalLimits(prev => ({ ...prev, [key]: val }));
    } else if (valStr === "") {
      setLocalLimits(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Addon toggles
  const handleToggleAddon = (addonId: string) => {
    setLocalAddons(prev => {
      if (prev.includes(addonId)) {
        return prev.filter(id => id !== addonId);
      } else {
        return [...prev, addonId];
      }
    });
  };

  // Save changes to Postgres
  const handleSaveChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTenant) return;

    try {
      setSaving(true);
      
      // Build Payload to match server.ts overrides endpoint signature:
      // limit_overrides => Record<string, number | null>
      // feature_overrides => Record<string, 'ENABLED' | 'DISABLED'>
      // addons => string[]
      // billing_override => Object
      const payload = {
        limit_overrides: localLimits,
        feature_overrides: localFeatures,
        addons: localAddons,
        billing_override: {
          custom_monthly_fee: localBilling.custom_monthly_fee ? parseFloat(localBilling.custom_monthly_fee) : null,
          custom_annual_fee: localBilling.custom_annual_fee ? parseFloat(localBilling.custom_annual_fee) : null,
          custom_discount_percentage: parseFloat(localBilling.custom_discount_percentage) || 0.00,
          special_contract_notes: localBilling.special_contract_notes || null
        }
      };

      const res = await api.saveTenantOverrides(selectedTenant.id, payload);
      showToast("Tenant override settings updated successfully!", "success");
      
      // Reload profile to reflect newly saved values
      await handleSelectTenant(selectedTenant);
      
      // Refresh audit logs
      const freshLogs = await api.request<any[]>("/admin/audit-logs", { method: "GET" }).catch(() => []);
      setLogs(freshLogs || []);

    } catch (err: any) {
      console.error(err);
      showToast("Could not save settings. Please verify inputs.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Filter tenants
  const filteredTenants = tenants.filter(t => {
    const searchLow = searchQuery.toLowerCase();
    const codeMatches = (t.tenant_code || t.code || "").toLowerCase().includes(searchLow);
    const nameMatches = (t.name || "").toLowerCase().includes(searchLow);
    const domainMatches = (t.domain || "").toLowerCase().includes(searchLow);
    
    const matchesSearch = codeMatches || nameMatches || domainMatches;
    const matchesFilter = planFilter === "ALL" || (t.plan || "").toUpperCase() === planFilter.toUpperCase();

    return matchesSearch && matchesFilter;
  });

  // Filter Logs by Selected Tenant ID/Code
  const filteredLogs = logs.filter(l => {
    if (!selectedTenant) return false;
    const tCode = (selectedTenant.tenant_code || selectedTenant.code || "").toLowerCase();
    if (!tCode) return false;
    return (l.details && l.details.toLowerCase().includes(tCode)) || 
           (l.target && l.target.toLowerCase().includes(tCode)) ||
           (l.details && l.details.toLowerCase().includes("tenantoverride")) ||
           (l.action && l.action.includes("OVERRIDE"));
  });

  // Common limits default baseline mapping logic based on plans code or defaults
  const getLimitsBaselines = () => {
    const defaultBaselines: Record<string, number> = {
      projectsLimit: 5,
      layoutsLimit: 10,
      plotsLimit: 200,
      usersLimit: 3,
      fileStorageGb: 5,
    };

    if (!subscriptionProfile?.plan?.planLimits || !Array.isArray(subscriptionProfile.plan.planLimits)) return defaultBaselines;

    const baselines = { ...defaultBaselines };
    subscriptionProfile.plan.planLimits.forEach((pl: any) => {
      // Map limits matching limit_key
      if (pl.limit_key === "projectsLimit" || pl.limit_key === "projects") baselines.projectsLimit = pl.limit_value;
      if (pl.limit_key === "layoutsLimit" || pl.limit_key === "layouts") baselines.layoutsLimit = pl.limit_value;
      if (pl.limit_key === "plotsLimit" || pl.limit_key === "plots") baselines.plotsLimit = pl.limit_value;
      if (pl.limit_key === "usersLimit" || pl.limit_key === "users") baselines.usersLimit = pl.limit_value;
      if (pl.limit_key === "fileStorageGb" || pl.limit_key === "storageLimitGb" || pl.limit_key === "storage") {
        baselines.fileStorageGb = pl.limit_value;
      }
    });

    return baselines;
  };

  const baselines = getLimitsBaselines();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start font-sans">
      
      {/* SECTION A: TENANT SELECTION PANEL (Left side) */}
      <div className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5 mb-1">
            <Users className="w-4 h-4 text-indigo-650" />
            Workspace Directory
          </h2>
          <p className="text-[11px] text-slate-450 leading-relaxed font-sans mt-0.5">
            Query and filter system instances to toggle customized permission vectors.
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Filter by name, domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
            />
          </div>

          <div className="flex gap-1.5">
            {["ALL", "STARTER", "GROWTH", "ENTERPRISE"].map((filter) => (
              <button
                key={filter}
                onClick={() => setPlanFilter(filter)}
                className={`flex-1 text-[10px] font-bold py-1 px-1.5 rounded-lg border uppercase transition-all ${
                  planFilter === filter 
                    ? "bg-indigo-650 border-indigo-650 text-white" 
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Tenant list */}
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 text-center text-slate-450 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
              <span>Fetching cluster node registry...</span>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="py-8 text-center text-slate-450 border border-dashed border-slate-200 rounded-xl">
              <span className="text-xs">No active matching instances found.</span>
            </div>
          ) : (
            filteredTenants.map((tenant) => {
              const worksAsSelected = selectedTenant?.id === tenant.id;
              return (
                <button
                  key={tenant.id}
                  onClick={() => handleSelectTenant(tenant)}
                  className={`w-full text-left p-3.5 rounded-xl border flex flex-col gap-2 transition-all ${
                    worksAsSelected 
                      ? "border-indigo-600 bg-indigo-50/50 shadow-xs" 
                      : "border-slate-150 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5 w-full">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs font-sans leading-tight">
                        {tenant.name}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-450 mt-0.5">
                        {tenant.domain}
                      </p>
                    </div>

                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                      tenant.status === "ACTIVE" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                      tenant.status === "TRIAL" ? "bg-amber-50 border-amber-200 text-amber-800" :
                      tenant.status === "SUSPENDED" ? "bg-red-50 border-red-200 text-red-800" :
                      "bg-slate-50 border-slate-200 text-slate-700"
                    }`}>
                      {tenant.status || "UNKNOWN"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100/70 pt-2 w-full">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      Plan: <strong className="font-extrabold text-slate-700">{tenant.plan || "Starter"}</strong>
                    </span>
                    <span className="text-[9px] font-mono">
                      No: {tenant.tenant_code || tenant.code}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* OVERRIDES CONTROL CENTER (Right side) */}
      <div className="xl:col-span-8 flex flex-col gap-6">

        <AnimatePresence mode="wait">
          {!selectedTenant ? (
            // BLANK PLACEHOLDER WIDGET
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-4 shadow-3xs flex flex-col items-center justify-center min-h-[500px]"
            >
              <div className="w-16 h-16 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-center text-slate-350 shadow-3xs">
                <Sliders className="w-8 h-8 text-indigo-650" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Awaiting Tenant Node Selection
                </h3>
                <p className="text-xs text-slate-450 leading-relaxed font-sans">
                  Choose a workspace authority registry from the directory on the left. This will initialize the real-time configuration matrices, limit overrides, assigned addons catalog, and custom contract billing details directly from PostgreSQL.
                </p>
              </div>
            </motion.div>
          ) : loadingProfile ? (
            // LOADING SHIM
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center space-y-3 min-h-[500px] flex flex-col items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-650" />
              <p className="text-xs text-slate-500">Retrieving subscription override registers...</p>
            </div>
          ) : (
            // REAL TAB OVERRIDE MANAGEMENT CONTENT
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              
              {/* Tenant Meta Info Header card */}
              <div className="bg-gradient-to-r from-indigo-700 to-slate-900 border border-indigo-950 rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
                  <Sliders className="w-48 h-48" />
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded font-extrabold border border-indigo-400/20">
                        Global SaaS Overrides Panel
                      </span>
                      <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded font-extrabold border uppercase ${
                        selectedTenant.status === 'ACTIVE' ? 'bg-emerald-500/30 text-emerald-200 border-emerald-500/20' : 'bg-amber-500/30 text-amber-200 border-amber-500/20'
                      }`}>
                        {selectedTenant.status || "ACTIVE"}
                      </span>
                    </div>
                    <h2 className="text-base font-extrabold uppercase mt-1 leading-tight font-sans">
                      {selectedTenant.name}
                    </h2>
                    <p className="text-xs text-indigo-100 font-mono flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                      Domain Tunnel: <strong>{selectedTenant.domain}</strong>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 font-mono text-[11px] bg-white/5 border border-white/10 p-3 rounded-xl min-w-[200px]">
                    <div className="flex justify-between w-full">
                      <span className="text-indigo-200">License Tier:</span>
                      <span className="font-bold text-white uppercase">{subscriptionProfile?.plan?.name || "STARTER TRIAL"}</span>
                    </div>
                    <div className="flex justify-between w-full">
                      <span className="text-indigo-200">Expiry Date:</span>
                      <span className="font-bold text-light flex items-center gap-1 text-white">
                        <Calendar className="w-3 h-3 text-indigo-300 shrink-0" />
                        {subscriptionProfile?.subscription_expiry_date || "2026-07-01"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* OVERRIDES SECTIONS GROUPED */}
              {subscriptionProfile?.has_subscription === false ? (
                // NO ACTIVE SUBSCRIPTION SPECIAL WIDGET WITH ACTIONS: Assign Plan, Apply Trial, Close
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4 shadow-3xs">
                    <div className="p-3 bg-amber-100 rounded-xl text-amber-800 shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-amber-950 uppercase">
                        No active subscription assigned
                      </h3>
                      <p className="text-xs text-amber-800 leading-relaxed font-sans">
                        This tenant workspace node is registered but does not currently possess an active licensing subscription. Please choose to automatically apply a standard 14-day starter trial or manually specify and assign a custom license tier below.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* OPTION 1: QUICK STARTER TRIAL */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="w-10 h-10 bg-indigo-50 border border-indigo-150 rounded-xl flex items-center justify-center text-indigo-650">
                          <Zap className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase">Apply Standard Starter Trial</h4>
                        <p className="text-[11px] text-slate-450 leading-relaxed">
                          Provision standard Starter features, limits, and system configurations for a 14-day evaluation period.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleApplyStarterTrial}
                        className="w-full bg-indigo-650 hover:bg-indigo-755 text-white py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 mt-4 cursor-pointer border-0"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Apply 14-Day Trial
                      </button>
                    </div>

                    {/* OPTION 2: ASSIGN PLAN */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
                      <div className="space-y-1.5">
                        <div className="w-10 h-10 bg-emerald-50 border border-emerald-150 rounded-xl flex items-center justify-center text-emerald-800">
                          <Check className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase">Assign License Tier</h4>
                        <p className="text-[11px] text-slate-450 leading-relaxed">
                          Select one of the standard licensing catalog plans to establish a custom paid subscription immediately.
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Select Plan</label>
                          <select
                            value={assignPlanId}
                            onChange={(e) => setAssignPlanId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                          >
                            <option value="">-- Choose Plan --</option>
                            {plans.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (₹{p.monthly_price}/mo)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Billing Period</label>
                            <select
                              value={assignBillingPeriod}
                              onChange={(e) => setAssignBillingPeriod(e.target.value as any)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                            >
                              <option value="MONTHLY">Monthly</option>
                              <option value="YEARLY">Yearly</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Trial Days (Optional)</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={assignTrialDays || ""}
                              onChange={(e) => setAssignTrialDays(parseInt(e.target.value) || 0)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAssignSelectedPlan}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 mt-2 cursor-pointer border-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Assign Active Plan
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CLOSE FOOTER ACTIONS */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-3xs">
                    <span className="text-[11px] text-slate-500 font-sans">
                      Deselect this workspace node to return to the cluster registry interface.
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTenant(null)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 py-1.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer border-0"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveChanges} className="space-y-6">

                {/* SECTION B: FEATURE OVERRIDES */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                        <Settings className="w-4 h-4 text-indigo-650" />
                        Feature Flag Overrides
                      </h3>
                      <p className="text-[11px] text-slate-450 mt-1 leading-normal font-sans">
                        Explicitly force inclusion or exclusion vectors of modules.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {modules.map((m) => {
                      const mFeatures = m.features || [];
                      if (mFeatures.length === 0) return null;

                      return (
                        <div key={m.id} className="space-y-2 border-b border-slate-100/60 pb-4 last:border-0 last:pb-0">
                          <h4 className="text-[10px] font-bold text-indigo-900 bg-indigo-50/50 px-2.5 py-1 rounded-md border border-indigo-100 uppercase tracking-widest inline-block font-mono">
                            {m.name} ({m.code})
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1.5">
                            {mFeatures.map((f: any) => {
                              const overValue = localFeatures[f.id] || "DEFAULT";
                              
                              // Check if feature is default enabled in plan feature list
                              const planHasAccess = subscriptionProfile?.plan?.planFeatures?.some((pf: any) => pf.feature_id === f.id);
                              const baselineText = planHasAccess ? "ENABLED" : "DISABLED";

                              return (
                                <div key={f.id} className="p-3 border border-slate-150 rounded-xl bg-slate-50/50 flex flex-col justify-between gap-3 hover:border-slate-205 transition-all">
                                  <div className="space-y-1">
                                    <h5 className="font-bold text-slate-800 text-xs flex items-center justify-between gap-1 leading-normal font-sans">
                                      <span>{f.name}</span>
                                      <span className="text-[9px] font-mono text-slate-400">
                                        {f.code}
                                      </span>
                                    </h5>
                                    <p className="text-[10px] text-slate-450 leading-relaxed font-sans mt-0.5">
                                      {f.description || "No specific system documentation configured."}
                                    </p>
                                  </div>

                                  <div className="flex items-center justify-between bg-white border border-slate-200/80 p-2 rounded-lg text-[10px] font-mono">
                                    <span className="text-slate-450 shrink-0">
                                      Plan: <strong className={`font-extrabold ${planHasAccess ? 'text-indigo-650' : 'text-slate-505'}`}>{baselineText}</strong>
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => toggleFeatureOverride(f.id, "ENABLED")}
                                        className={`px-2 py-1 rounded font-bold transition-all border ${
                                          overValue === "ENABLED" 
                                            ? "bg-emerald-600 border-emerald-600 text-white shadow-3xs" 
                                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                        }`}
                                      >
                                        FORCE ENABLE
                                      </button>
                                      
                                      <button
                                        type="button"
                                        onClick={() => toggleFeatureOverride(f.id, "DISABLED")}
                                        className={`px-2 py-1 rounded font-bold transition-all border ${
                                          overValue === "DISABLED" 
                                            ? "bg-red-655 bg-red-650 border-red-650 text-white shadow-3xs" 
                                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                        }`}
                                      >
                                        FORCE DISABLE
                                      </button>

                                      {overValue !== "DEFAULT" && (
                                        <button
                                          type="button"
                                          onClick={() => toggleFeatureOverride(f.id, "DEFAULT")}
                                          className="p-1 text-[9px] text-slate-500 hover:text-indigo-600 font-sans font-bold"
                                        >
                                          RESET
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION C: LIMIT OVERRIDES */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-650" />
                      Usage Limit Overrides
                    </h3>
                    <p className="text-[11px] text-slate-450 mt-1 leading-normal font-sans">
                      Raise or scale the hard quotas of inventory entities allocated beneath this tenant subscription.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: "projectsLimit", label: "Projects Limit Count", icon: Sliders },
                      { key: "layoutsLimit", label: "Layouts Limit Count", icon: Sliders },
                      { key: "plotsLimit", label: "Plots Limit Count", icon: Sliders },
                      { key: "usersLimit", label: "Authorized Users Limit", icon: Users },
                      { key: "fileStorageGb", label: "Max File Storage (GB)", icon: FileText },
                    ].map((lim) => {
                      const baselineVal = baselines[lim.key] || 0;
                      const hasOver = localLimits[lim.key] !== undefined;
                      const activeVal = hasOver ? localLimits[lim.key] : baselineVal;

                      return (
                        <div key={lim.key} className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 flex flex-col justify-between gap-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-slate-850 text-xs font-sans">
                                {lim.label}
                              </h4>
                              <p className="text-[10px] text-slate-450 mt-0.5">
                                Plan Baseline: <strong className="font-bold text-slate-700">{baselineVal === -1 ? "Unlimited" : baselineVal}</strong>
                              </p>
                            </div>

                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              hasOver 
                                ? "bg-amber-50 border-amber-200 text-amber-800 font-bold" 
                                : "bg-slate-100 border-slate-200 text-slate-500"
                            }`}>
                              {hasOver ? "Overridden" : "Default"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleLimitChange(lim.key, baselineVal, -5)}
                              className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 active:scale-95"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <input 
                              type="number"
                              value={activeVal}
                              onChange={(e) => setLimitDirectValue(lim.key, e.target.value)}
                              className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-center font-mono font-bold text-xs text-slate-800 focus:outline-none"
                            />

                            <button
                              type="button"
                              onClick={() => handleLimitChange(lim.key, baselineVal, 5)}
                              className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            {hasOver && (
                              <button
                                type="button"
                                onClick={() => handleLimitReset(lim.key)}
                                className="text-[9px] font-bold text-indigo-650 hover:underline px-1 shrink-0"
                              >
                                RESET
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION D: ADDON ASSIGNMENT */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-indigo-650" />
                      Addon Package Assignment
                    </h3>
                    <p className="text-[11px] text-slate-450 mt-1 leading-normal font-sans">
                      Select additional system modules and integrations loaded dynamically inside other tenant nodes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {addons.length === 0 ? (
                      <div className="md:col-span-2 py-4 text-center text-slate-500 bg-slate-50 border border-dashed rounded-lg">
                        <span className="text-xs">No SaaS addons found in database.</span>
                      </div>
                    ) : (
                      addons.map((addon) => {
                        const isAssigned = localAddons.includes(addon.id);
                        return (
                          <div 
                            key={addon.id} 
                            onClick={() => handleToggleAddon(addon.id)}
                            className={`p-3.5 border rounded-xl cursor-pointer transition-all flex items-start gap-3 select-none ${
                              isAssigned 
                                ? "border-indigo-600 bg-indigo-50/20" 
                                : "border-slate-150 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-md border mt-0.5 flex items-center justify-center transition-all ${
                              isAssigned 
                                ? "bg-indigo-650 border-indigo-650 text-white" 
                                : "bg-white border-slate-300"
                            }`}>
                              {isAssigned && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>

                            <div className="flex-1 space-y-0.5">
                              <div className="flex justify-between items-baseline gap-1">
                                <h4 className="font-extrabold text-slate-800 text-xs">
                                  {addon.name}
                                </h4>
                                <span className="text-[10px] font-mono text-indigo-650 font-bold shrink-0">
                                  ₹{addon.monthly_price || "0"}/mo
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-sans leading-relaxed">
                                {addon.description || "Optional utility enhancement module."}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* SECTION E: CUSTOM BILLING */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-indigo-650" />
                      Custom Billing Overrides
                    </h3>
                    <p className="text-[11px] text-slate-450 mt-1 leading-normal font-sans">
                      Establish unique contractual fee parameters and custom discounts overriding base tier catalog matrices.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-650 mb-1">Custom Monthly Fee (₹)</label>
                      <input 
                        type="number"
                        placeholder={subscriptionProfile?.plan?.monthly_price ? `Base: ₹${subscriptionProfile.plan.monthly_price}` : "e.g. 15000"}
                        value={localBilling.custom_monthly_fee}
                        onChange={(e) => setLocalBilling({ ...localBilling, custom_monthly_fee: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-505 font-mono text-slate-750"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-650 mb-1">Custom Annual Fee (₹)</label>
                      <input 
                        type="number"
                        placeholder={subscriptionProfile?.plan?.yearly_price ? `Base: ₹${subscriptionProfile.plan.yearly_price}` : "e.g. 150000"}
                        value={localBilling.custom_annual_fee}
                        onChange={(e) => setLocalBilling({ ...localBilling, custom_annual_fee: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-505 font-mono text-slate-750"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-650 mb-1">Custom Discount (%)</label>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        placeholder="e.g. 15"
                        value={localBilling.custom_discount_percentage}
                        onChange={(e) => setLocalBilling({ ...localBilling, custom_discount_percentage: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-505 font-mono text-slate-750"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-650 mb-1">Special Contract Notes & SLA Accords</label>
                    <textarea 
                      rows={3}
                      placeholder="Input custom contract stipulations, special grace periods, or notes on specific enterprise exceptions..."
                      value={localBilling.special_contract_notes}
                      onChange={(e) => setLocalBilling({ ...localBilling, special_contract_notes: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-505 text-slate-750"
                    />
                  </div>
                </div>

                {/* ACTION PERSISTENCE BAR */}
                <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-3xs">
                  <div className="flex items-center gap-2.5">
                    <Info className="w-5 h-5 text-indigo-550 shrink-0" />
                    <p className="text-[11px] text-slate-550 leading-normal font-sans">
                      Saving updates the parameters inside PostgreSQL of BhoomiOne and stamps a new audit entry.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto bg-indigo-650 hover:bg-indigo-755 text-white py-2 px-6 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-all active:scale-98 cursor-pointer"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sliders className="w-4 h-4" />}
                    <span>Publish Overrides Plane</span>
                  </button>
                </div>

                {/* SECTION F: AUDIT PANEL (Filter by Tenant) */}
                <div className="bg-slate-900 border border-slate-950 rounded-2xl p-5 text-slate-200 font-mono shadow-md">
                  <div className="border-b border-slate-800 pb-3 flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-100 uppercase flex items-center gap-1.5 font-sans">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        Specific Tenant Override Auditing
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1 font-sans">
                        Filtered audit trails of database updates executed on this active tenant subsystem.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1 text-[11px]">
                    {filteredLogs.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        <span className="text-xs font-sans">No recent override audit trails recorded for this node.</span>
                      </div>
                    ) : (
                      filteredLogs.map((log) => (
                        <div key={log.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1">
                          <div className="flex justify-between items-center text-slate-400 text-[10px] pb-1 border-b border-slate-900/50">
                            <span className="font-bold text-indigo-400">{log.action || "MUTATION"}</span>
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-200 mt-0.5 leading-normal">{log.details}</p>
                          <p className="text-[10px] text-slate-500">Operator Email: {log.operator || "system-administrator"}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </form>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
