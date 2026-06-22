import React, { useState } from "react";
import { 
  X, Shield, CreditCard, Sliders, Calendar, AlertTriangle, Check, Play, Ban, Trash2, HelpCircle 
} from "lucide-react";
import { 
  TenantSubscription, SubscriptionPlan, PlanLimits, AddonCatalogItem, SaasFeature 
} from "./SaasTypes.ts";

interface TenantLifecycleDrawerProps {
  tenant: any;
  subscription: TenantSubscription;
  plans: SubscriptionPlan[];
  addons: AddonCatalogItem[];
  features: SaasFeature[];
  planLimits: Record<string, PlanLimits>;
  onClose: () => void;
  onUpdateSubscription: (sub: TenantSubscription) => void;
  onLifecycleAction: (action: "SUSPEND" | "REACTIVATE" | "ARCHIVE" | "EXTEND_TRIAL") => void;
}

export default function TenantLifecycleDrawer({
  tenant,
  subscription,
  plans,
  addons,
  features,
  planLimits,
  onClose,
  onUpdateSubscription,
  onLifecycleAction
}: TenantLifecycleDrawerProps) {
  const [activeSubTab, setActiveSubTab] = useState<"plans" | "addons" | "limits" | "overrides" | "lifecycle">("plans");
  const [selectedPlanCode, setSelectedPlanCode] = useState(subscription.currentPlanCode);
  const [trialDaysToAdd, setTrialDaysToAdd] = useState(14);
  
  // Update state helper
  const updateSub = (updates: Partial<TenantSubscription>) => {
    onUpdateSubscription({
      ...subscription,
      ...updates
    });
  };

  const handleToggleAddon = (addonCode: string) => {
    const active = subscription.addOnCodes.includes(addonCode);
    const newAddons = active 
      ? subscription.addOnCodes.filter(c => c !== addonCode) 
      : [...subscription.addOnCodes, addonCode];
    updateSub({ addOnCodes: newAddons });
  };

  const handleToggleOverride = (featCode: string, value: "ENABLED" | "DISABLED" | "DEFAULT") => {
    const nextOverrides = { ...subscription.featureOverrides };
    nextOverrides[featCode] = value;
    updateSub({ featureOverrides: nextOverrides });
  };

  const handleLimitChange = (key: keyof PlanLimits, val: number) => {
    const nextLimits = { ...subscription.limitOverrides };
    nextLimits[key] = val;
    updateSub({ limitOverrides: nextLimits });
  };

  const handleSavePlanChange = () => {
    if (window.confirm(`Are you sure you want to transition tenant '${tenant.name}' to the ${selectedPlanCode} subscription tier? all baseline usage limits will adapt instantly.`)) {
      updateSub({ currentPlanCode: selectedPlanCode });
      alert(`Subscription tier updated to ${selectedPlanCode} successfully!`);
    }
  };

  const handleExtendTrialAction = () => {
    if (window.confirm(`Authorize trial period extension by adding ${trialDaysToAdd} additional days?`)) {
      const currentExpiry = new Date(subscription.trialExpiryDate || new Date());
      currentExpiry.setDate(currentExpiry.getDate() + Number(trialDaysToAdd));
      const newDateStr = currentExpiry.toISOString().split('T')[0];
      updateSub({ trialExpiryDate: newDateStr, subscriptionExpiryDate: newDateStr });
      alert(`Trial timeframe successfully extended to ${newDateStr}!`);
    }
  };

  // Retrieve current active limits (combining plan defaults + overrides)
  const currentPlanLimits = planLimits[subscription.currentPlanCode] || {
    projectsLimit: 3, layoutsLimit: 10, plotsLimit: 150, customersLimit: 500, usersLimit: 10, agentsLimit: 5,
    storageLimitGb: 10, documentsLimit: 5000, dxfFilesLimit: 5, marketplaceListingsLimit: 10, apiCallsLimit: 1000, whatsAppMessagesLimit: 100, aiCreditsLimit: 50
  };

  const getLimitVal = (key: keyof PlanLimits) => {
    if (subscription.limitOverrides[key] !== undefined) {
      return subscription.limitOverrides[key] as number;
    }
    return currentPlanLimits[key];
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end">
      <div className="bg-white w-full max-w-xl h-full flex flex-col shadow-2xl animate-slideOver overflow-hidden" id="lifecycle-drawer-root">
        
        {/* Header */}
        <div className="p-6 bg-slate-950 text-white flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider ${
                subscription.status === "ACTIVE" ? "bg-emerald-500/25 text-emerald-400 border border-emerald-500/20" :
                subscription.status === "TRIAL" ? "bg-indigo-500/25 text-indigo-400 border border-indigo-500/20" :
                subscription.status === "SUSPENDED" ? "bg-red-500/25 text-red-400 border border-red-500/20" : "bg-slate-700 text-slate-300"
              }`}>
                {subscription.status}
              </span>
              <p className="text-[11px] font-mono text-indigo-400 font-semibold uppercase">Workspace Supervisor</p>
            </div>
            <h3 className="text-base font-bold text-slate-50 leading-none">{tenant.name}</h3>
            <p className="text-[10px] text-slate-400 font-mono">domain: {tenant.code}.bhoomione.in</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace navigation sub-menu */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4">
          {[
            { id: "plans", label: "Plan & Trial", icon: CreditCard },
            { id: "addons", label: "Active Add-ons", icon: Shield },
            { id: "limits", label: "Usage Limits", icon: Sliders },
            { id: "overrides", label: "Overrides", icon: Sliders },
            { id: "lifecycle", label: "Lifecycle actions", icon: AlertTriangle }
          ].map(b => {
            const Icon = b.icon;
            return (
              <button
                key={b.id}
                onClick={() => setActiveSubTab(b.id as any)}
                className={`py-3 px-3 text-[11px] font-bold border-b-2 font-sans flex items-center gap-1.5 transition-all ${
                  activeSubTab === b.id 
                    ? "border-slate-900 text-slate-900 font-extrabold" 
                    : "border-transparent text-slate-400 hover:text-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {b.label}
              </button>
            );
          })}
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeSubTab === "plans" && (
            <div className="space-y-5" id="drawer-tab-plans">
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Change plan tier</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Toggle client between default available pricing plans. Baseline limits update automatically, and any active overrides remain preserved.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {plans.map(p => (
                    <button
                      key={p.code}
                      onClick={() => setSelectedPlanCode(p.code)}
                      className={`p-3 text-left rounded-xl border text-xs flex flex-col justify-between transition-all ${
                        selectedPlanCode === p.code 
                          ? "ring-2 ring-slate-950 border-slate-950 bg-slate-950/5" 
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="font-bold text-slate-900">{p.name} ({p.code})</span>
                      <span className="text-[10px] text-slate-500 mt-1">${p.monthlyPrice}/mo</span>
                    </button>
                  ))}
                </div>
                {selectedPlanCode !== subscription.currentPlanCode && (
                  <button
                    onClick={handleSavePlanChange}
                    className="w-full bg-slate-900 text-white font-bold text-xs py-2 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
                  >
                    Confirm Plan Transition
                  </button>
                )}
              </div>

              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Extend Sandbox / Trial Period
                </h4>
                <p className="text-[11px] text-indigo-950/80 leading-normal">
                  Grant temporal extensions for evaluation accounts. This updates both the trial expiry date and subscription limits cutoff timers.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input 
                      type="number"
                      min="1"
                      max="180"
                      value={trialDaysToAdd}
                      onChange={(e) => setTrialDaysToAdd(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                      placeholder="Days to append"
                    />
                  </div>
                  <button
                    onClick={handleExtendTrialAction}
                    className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                  >
                    Extend Trial Timeframe
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Current Trial Expires: <span className="font-bold text-slate-650">{subscription.trialExpiryDate || "No Active Trial"}</span>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "addons" && (
            <div className="space-y-4" id="drawer-tab-addons">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase">Subscribed Custom Add-ons</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Tenant-specific add-ons assigned directly to this workgroup container. Add-on monthly prices accumulate in MRR projections.
                </p>
              </div>

              <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden">
                {addons.map(a => {
                  const isActive = subscription.addOnCodes.includes(a.code);
                  return (
                    <div key={a.code} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                      <div className="space-y-0.5 max-w-[70%]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{a.name}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono font-bold">${a.monthlyPrice}/mo</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{a.description}</p>
                      </div>
                      <button
                        onClick={() => handleToggleAddon(a.code)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          isActive 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100" 
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {isActive ? "✓ Assigned" : "+ Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSubTab === "limits" && (
            <div className="space-y-5" id="drawer-tab-limits">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase">Interactive Limits Override</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Configure custom resource allocation bounds for this tenant cluster workspace without adapting their general plan tier. Set value to `99999` for unlimited parameters.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                {[
                  { key: "projectsLimit", label: "Max township projects", min: 1, max: 100 },
                  { key: "layoutsLimit", label: "Max subdiv sector layouts", min: 1, max: 200 },
                  { key: "plotsLimit", label: "Max physical plots ledger", min: 10, max: 5000 },
                  { key: "customersLimit", label: "Max client contact records", min: 10, max: 50000 },
                  { key: "usersLimit", label: "Max authorized login members", min: 1, max: 100 },
                  { key: "storageLimitGb", label: "Assigned storage quota (GB)", min: 1, max: 1000 },
                  { key: "documentsLimit", label: "Max CAD documents catalog", min: 50, max: 10000 },
                  { key: "dxfFilesLimit", label: "Max importable DXF diagrams", min: 1, max: 100 }
                ].map(item => {
                  const val = getLimitVal(item.key as any);
                  const isOverridden = subscription.limitOverrides[item.key as any] !== undefined;
                  return (
                    <div key={item.key} className="space-y-1 bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800">{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          {isOverridden && (
                            <button
                              onClick={() => {
                                const next = { ...subscription.limitOverrides };
                                delete next[item.key as any];
                                updateSub({ limitOverrides: next });
                              }}
                              className="text-[9px] text-red-650 hover:underline font-bold"
                            >
                              Reset
                            </button>
                          )}
                          <span className={`font-mono font-bold ${isOverridden ? 'text-indigo-650' : 'text-slate-500'}`}>
                            {val}
                          </span>
                        </div>
                      </div>
                      <input 
                        type="range"
                        min={item.min}
                        max={item.max}
                        value={val}
                        onChange={(e) => handleLimitChange(item.key as any, Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSubTab === "overrides" && (
            <div className="space-y-4" id="drawer-tab-overrides">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase">Tenant Feature Overrides</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Grant or revoke granular module features for this specific account. Access dynamically resolves as: `Plan Default` + `Assigned Add-on` + `Direct Override`.
                </p>
              </div>

              <div className="space-y-2.5 bg-slate-50 border border-slate-200 p-4 rounded-xl max-h-[400px] overflow-y-auto">
                {features.map(f => {
                  const state = subscription.featureOverrides[f.code] || "DEFAULT";
                  return (
                    <div key={f.code} className="bg-white p-3 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">{f.name}</span>
                        <span className="text-[9px] font-mono text-slate-400">Code: {f.code}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        {[
                          { val: "DEFAULT", label: "Default" },
                          { val: "ENABLED", label: "Force Access" },
                          { val: "DISABLED", label: "Revoke Access" }
                        ].map(opt => (
                          <button
                            key={opt.val}
                            onClick={() => handleToggleOverride(f.code, opt.val as any)}
                            className={`px-2 py-1 rounded text-[9px] font-bold tracking-wide transition-all ${
                              state === opt.val 
                                ? "bg-slate-950 text-white shadow-xs" 
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSubTab === "lifecycle" && (
            <div className="space-y-5" id="drawer-tab-lifecycle">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase">Tenant Lifecycle State Actions</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Toggle critical platform operating states with multi-tenant isolation guarantees.
                </p>
              </div>

              <div className="space-y-3">
                {subscription.status !== "SUSPENDED" ? (
                  <div className="p-4 bg-red-50 border border-red-150 rounded-xl space-y-2 flex flex-col justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-red-950 uppercase tracking-wide">Suspend tenancy workspace</h5>
                      <p className="text-[11px] text-red-900/80 leading-normal">
                        Instantly revokes workspace routing and terminates all login handshakes across this tenant domain cluster.
                      </p>
                    </div>
                    <button
                      onClick={() => onLifecycleAction("SUSPEND")}
                      className="bg-red-650 hover:bg-red-750 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm"
                    >
                      Suspend Active Cluster
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-xl space-y-2 flex flex-col justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-emerald-955 uppercase tracking-wide">Reactivate Suspended Tenant</h5>
                      <p className="text-[11px] text-emerald-900/80 leading-normal">
                        Re-establishes routing nodes, enabling teams to sign back in and preserve historic operational data.
                      </p>
                    </div>
                    <button
                      onClick={() => onLifecycleAction("REACTIVATE")}
                      className="bg-emerald-650 hover:bg-emerald-750 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm"
                    >
                      Reactivate Workspace Cluster
                    </button>
                  </div>
                )}

                <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-2 flex flex-col justify-between text-slate-100">
                  <div>
                    <h5 className="text-xs font-bold text-slate-50 uppercase tracking-wide">Archive Cluster Environment</h5>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Puts tenancy into cold storage status. Database clusters remain intact, but completely isolated from online routing vectors.
                    </p>
                  </div>
                  <button
                    disabled={subscription.status === "ARCHIVED"}
                    onClick={() => onLifecycleAction("ARCHIVE")}
                    className="bg-slate-800 disabled:opacity-40 hover:bg-slate-750 text-white font-bold text-xs py-2 px-4 rounded-lg"
                  >
                    {subscription.status === "ARCHIVED" ? "Already Archived" : "Archive Workspace Now"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Dynamic MRR contribution</span>
            <span className="text-sm font-extrabold text-emerald-700 font-mono">
              ${(() => {
                let planPrice = plans.find(p => p.code === subscription.currentPlanCode)?.monthlyPrice || 0;
                let addOnPrice = subscription.addOnCodes.reduce((sum, code) => {
                  return sum + (addons.find(a => a.code === code)?.monthlyPrice || 0);
                }, 0);
                return planPrice + addOnPrice;
              })()}/mo
            </span>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-950 text-white font-bold text-xs py-2 px-6 rounded-lg transition-colors cursor-pointer"
          >
            Finished configuration
          </button>
        </div>

      </div>
    </div>
  );
}
