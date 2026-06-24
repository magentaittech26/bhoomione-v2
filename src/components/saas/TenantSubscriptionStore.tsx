import React, { useState, useEffect } from "react";
import api from "../../lib/api.ts";
import { 
  Award, 
  Check, 
  Zap, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  ShoppingCart, 
  RefreshCw, 
  XCircle,
  HelpCircle,
  ChevronRight,
  Info
} from "lucide-react";

interface TenantSubscriptionStoreProps {
  onRefreshTriggered?: () => void;
}

export default function TenantSubscriptionStore({ onRefreshTriggered }: TenantSubscriptionStoreProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [summary, setSummary] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, plansData, addonsData] = await Promise.all([
        api.fetchMySubscriptionSummary(),
        api.fetchMyPlansCatalog(),
        api.fetchMyAddonsCatalog(),
      ]);
      setSummary(sumData);
      setPlans(plansData);
      setAddons(addonsData);
    } catch (err: any) {
      console.error("Error loading subscription store:", err);
      setError(err.message || "Failed to load subscription specifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpgradePlan = async (planId: string, planName: string) => {
    setActionLoading(`plan-${planId}`);
    setError(null);
    setSuccessMsg(null);
    try {
      const updatedSummary = await api.upgradeMyPlan(planId);
      setSummary(updatedSummary);
      setSuccessMsg(`Successfully upgraded to ${planName}! All feature configurations and usage limits are rebuilt dynamically.`);
      if (onRefreshTriggered) onRefreshTriggered();
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to upgrade subscription plan.");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePurchaseAddon = async (addonId: string, addonName: string) => {
    setActionLoading(`addon-buy-${addonId}`);
    setError(null);
    setSuccessMsg(null);
    try {
      const updatedSummary = await api.purchaseMyAddon(addonId);
      setSummary(updatedSummary);
      setSuccessMsg(`Successfully purchased add-on: ${addonName}! Limits and UI capabilities have been instantly recalculated.`);
      if (onRefreshTriggered) onRefreshTriggered();
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to purchase add-on package.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAddon = async (addonId: string, addonName: string) => {
    setActionLoading(`addon-remove-${addonId}`);
    setError(null);
    setSuccessMsg(null);
    try {
      const updatedSummary = await api.removeMyAddon(addonId);
      setSummary(updatedSummary);
      setSuccessMsg(`Successfully removed add-on: ${addonName}. Extra quotas and features have been detached.`);
      if (onRefreshTriggered) onRefreshTriggered();
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to deactivate add-on package.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3 min-h-[300px]">
        <RefreshCw className="w-8 h-8 text-indigo-650 animate-spin" />
        <p className="text-xs text-slate-500 font-medium font-sans">Compiling live subscription and quota matrices...</p>
      </div>
    );
  }

  const activePlanId = summary?.plan_id;
  const activePlanCode = summary?.plan_code || "STARTER";
  const activePlanName = summary?.plan_name || "Starter Plan";
  const activeAddonIds = summary?.active_addons?.map((a: any) => a.id) || [];

  return (
    <div className="space-y-6" id="tenant-subscription-store">
      
      {/* Alert Banner System */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-150 text-red-800 rounded-xl flex items-start gap-2.5 text-xs animate-fadeIn">
          <XCircle className="w-4 h-4 text-red-650 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <p className="font-bold">Transaction Declined</p>
            <p className="text-red-750 font-mono leading-normal">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-xl flex items-start gap-2.5 text-xs animate-fadeIn">
          <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <p className="font-bold">Database Synchronized</p>
            <p className="text-emerald-750 leading-normal font-medium">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Grid of Store Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Plans & Add-ons Store */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SaaS Core Plans Selection */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">License Subscription Plans</h3>
              </div>
              <p className="text-[11px] text-slate-500">
                Choose a plan to serve as your primary commercial baseline. Upgrading expands base limits dynamically.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {plans.map((p) => {
                const isCurrent = p.id === activePlanId || p.plan_code === activePlanCode;
                const isLoading = actionLoading === `plan-${p.id}`;

                return (
                  <div 
                    key={p.id} 
                    className={`border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                      isCurrent 
                        ? "border-indigo-600 bg-indigo-50/20 shadow-xs" 
                        : "border-slate-200 bg-white hover:border-slate-350"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase">{p.name}</h4>
                          <p className="text-[9.5px] font-mono text-slate-400 font-bold">code: {p.plan_code}</p>
                        </div>
                        {isCurrent ? (
                          <span className="bg-indigo-650 text-white font-extrabold text-[8.5px] px-2.5 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            Current Baseline
                          </span>
                        ) : (
                          <span className="text-slate-900 font-extrabold text-xs">
                            ₹{Number(p.monthly_price).toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">/mo</span>
                          </span>
                        )}
                      </div>

                      <p className="text-[11.5px] text-slate-500 leading-normal">{p.description}</p>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100 font-mono text-[10px] text-slate-500">
                        <div className="flex justify-between">
                          <span>Max Projects:</span>
                          <span className="font-bold text-slate-800">{p.projects_limit === -1 ? "Unlimited" : p.projects_limit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max Layouts:</span>
                          <span className="font-bold text-slate-800">{p.layouts_limit === -1 ? "Unlimited" : p.layouts_limit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max Plots:</span>
                          <span className="font-bold text-slate-800">{p.plots_limit === -1 ? "Unlimited" : p.plots_limit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Authorized Users:</span>
                          <span className="font-bold text-slate-800">{p.users_limit === -1 ? "Unlimited" : p.users_limit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Disk Storage:</span>
                          <span className="font-bold text-slate-800">{p.storage_limit_gb} GB</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100">
                      {isCurrent ? (
                        <button 
                          disabled 
                          className="w-full bg-slate-100 text-slate-400 py-2 rounded-xl text-xs font-bold cursor-not-allowed"
                        >
                          Selected Plan
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpgradePlan(p.id, p.name)}
                          disabled={actionLoading !== null}
                          className="w-full bg-slate-900 hover:bg-black text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {isLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Zap className="w-3.5 h-3.5" />
                          )}
                          Switch to {p.name}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add-ons Marketplace Store */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">A-La-Carte Add-ons Store</h3>
              </div>
              <p className="text-[11px] text-slate-500">
                Purchase modular feature switches or incremental quota blocks directly without upgrading your whole baseline tier.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {addons.filter(a => a.status === "ACTIVE").map((a) => {
                const isPurchased = activeAddonIds.includes(a.id);
                const isBuying = actionLoading === `addon-buy-${a.id}`;
                const isRemoving = actionLoading === `addon-remove-${a.id}`;

                let typeLabel = "FEATURE";
                let capBadge = "";
                if (a.addon_type === "CAPACITY") {
                  typeLabel = "Quota Increment";
                  capBadge = `+${a.limit_increment} ${a.limit_key}`;
                } else if (a.addon_type === "SERVICE") {
                  typeLabel = "SLA Service Option";
                } else {
                  typeLabel = "Granular Feature";
                  capBadge = `Grants: ${a.feature_code}`;
                }

                return (
                  <div 
                    key={a.id}
                    className={`border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                      isPurchased 
                        ? "border-emerald-500 bg-emerald-50/10 shadow-xs" 
                        : "border-slate-200 bg-white hover:border-slate-350"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-slate-905">{a.name}</h4>
                          <span className="text-[9.5px] font-mono text-indigo-600 font-bold uppercase block tracking-wider mt-0.5">code: {a.code}</span>
                        </div>
                        {isPurchased && (
                          <span className="bg-emerald-600 text-white font-extrabold text-[8.5px] px-2.5 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1 shrink-0">
                            <Check className="w-2.5 h-2.5" />
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <span className="bg-indigo-50 text-indigo-700 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                          {typeLabel}
                        </span>
                        {capBadge && (
                          <span className="bg-amber-50 text-amber-850 border border-amber-100 text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded">
                            {capBadge}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 leading-normal">{a.description}</p>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-400 font-bold font-sans text-[10px]">RATE:</span>
                        <div className="text-right">
                          {a.oneTimePrice && Number(a.oneTimePrice) > 0 ? (
                            <span className="font-bold text-slate-800">₹{Number(a.oneTimePrice).toLocaleString()} <span className="text-[9px] font-normal text-slate-400 font-sans">one-time</span></span>
                          ) : (
                            <span className="font-bold text-slate-800">₹{Number(a.monthlyPrice).toLocaleString()} <span className="text-[9px] font-normal text-slate-400 font-sans">/mo</span></span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100">
                      {isPurchased ? (
                        <button
                          onClick={() => handleRemoveAddon(a.id, a.name)}
                          disabled={actionLoading !== null}
                          className="w-full bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {isRemoving ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          Deactivate Package
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePurchaseAddon(a.id, a.name)}
                          disabled={actionLoading !== null}
                          className="w-full bg-slate-900 hover:bg-black text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {isBuying ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShoppingCart className="w-3.5 h-3.5" />
                          )}
                          Buy & Activate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right 1 Column: Active Subscription Diagnostics & Metrics */}
        <div className="space-y-6">
          
          {/* Active Baseline Status */}
          <div className="bg-white border border-slate-250 rounded-2xl p-6 space-y-4 shadow-sm border-t-4 border-t-indigo-650">
            <h4 className="text-xs font-extrabold text-slate-905 uppercase tracking-wider">Baseline License State</h4>
            
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                <p className="text-[9px] text-slate-450 uppercase font-bold tracking-wider">Current Account Plan</p>
                <p className="text-sm font-extrabold text-slate-900">{activePlanName}</p>
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>Status: <strong className="text-emerald-700">Active</strong></span>
                  <span>Code: <strong>{activePlanCode}</strong></span>
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 rounded-xl">
                <p className="text-[9px] text-emerald-850 uppercase font-extrabold tracking-wider">Remaining Plot Capacity</p>
                <p className="text-lg font-black tracking-tight font-sans text-emerald-950">
                  {summary?.remaining_plot_capacity === -1 ? "Unlimited" : `${summary?.remaining_plot_capacity} Plots`}
                </p>
                <p className="text-[10px] text-emerald-700 leading-normal mt-0.5">
                  Plots remaining before extra capacity slab modules or upgrades are required.
                </p>
              </div>
            </div>
          </div>

          {/* Quota Limits Utilization Progress */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <h4 className="text-xs font-extrabold text-slate-905 uppercase tracking-wider">Quota Limits Utilization</h4>
            
            <div className="space-y-4 pt-1">
              {/* Projects Limit */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Projects Workspace</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {summary?.usages?.projects_count} / {summary?.limits?.projectsLimit === -1 ? "∞" : summary?.limits?.projectsLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: summary?.limits?.projectsLimit === -1 
                        ? "5%" 
                        : `${Math.min(100, (summary?.usages?.projects_count / summary?.limits?.projectsLimit) * 100)}%` 
                    }}
                  />
                </div>
              </div>

              {/* Layouts Limit */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Layout Canvas Designs</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {summary?.usages?.layouts_count} / {summary?.limits?.layoutsLimit === -1 ? "∞" : summary?.limits?.layoutsLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: summary?.limits?.layoutsLimit === -1 
                        ? "5%" 
                        : `${Math.min(100, (summary?.usages?.layouts_count / summary?.limits?.layoutsLimit) * 100)}%` 
                    }}
                  />
                </div>
              </div>

              {/* Plots Limit */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Registered Sub-Plots</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {summary?.usages?.plots_count} / {summary?.limits?.plotsLimit === -1 ? "∞" : summary?.limits?.plotsLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: summary?.limits?.plotsLimit === -1 
                        ? "5%" 
                        : `${Math.min(100, (summary?.usages?.plots_count / summary?.limits?.plotsLimit) * 100)}%` 
                    }}
                  />
                </div>
              </div>

              {/* Users Limit */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">Team Seats License</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {summary?.usages?.users_count} / {summary?.limits?.usersLimit === -1 ? "∞" : summary?.limits?.usersLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: summary?.limits?.usersLimit === -1 
                        ? "5%" 
                        : `${Math.min(100, (summary?.usages?.users_count / summary?.limits?.usersLimit) * 100)}%` 
                    }}
                  />
                </div>
              </div>

              {/* Storage Limit */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">CAD Document Storage</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {summary?.usages?.storage_gb} GB / {summary?.limits?.storageLimitGb} GB
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (summary?.usages?.storage_gb / summary?.limits?.storageLimitGb) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recalculated Feature Activations Badge Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <h4 className="text-xs font-extrabold text-slate-905 uppercase tracking-wider">Recalculated Feature Activations</h4>
            <p className="text-[10.5px] text-slate-400 leading-normal">
              Below are the active SaaS features authorized for your tenant session, recalculated from active plans, purchased add-on flags, and specific overrides.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1" id="store-enabled-features">
              {summary?.enabled_features?.length > 0 ? (
                summary.enabled_features.map((feat: string) => (
                  <span 
                    key={feat}
                    className="bg-indigo-50 border border-indigo-100 text-indigo-705 text-[10px] font-mono px-2.5 py-1 rounded-md font-semibold shrink-0"
                  >
                    {feat}
                  </span>
                ))
              ) : (
                <div className="text-[11px] text-slate-400 p-3 bg-slate-50 border border-slate-150 rounded-xl text-center w-full">
                  No core features enabled on this tier.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
