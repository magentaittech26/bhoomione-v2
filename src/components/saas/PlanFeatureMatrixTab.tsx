import React, { useState } from "react";
import { 
  Plus, Check, Trash2, Edit3, Shield, Box, Zap, Settings, Info, Copy, Sliders, DollarSign, RefreshCw, X, AlertTriangle, HelpCircle
} from "lucide-react";
import { SubscriptionPlan, SaasFeature, PlanLimits } from "./SaasTypes.ts";

interface PlanFeatureMatrixTabProps {
  plans: SubscriptionPlan[];
  features: SaasFeature[];
  planLimits: Record<string, PlanLimits>;
  matrix: Record<string, Record<string, "ENABLED" | "DISABLED" | "ADDON" | "ENTERPRISE">>;
  onAddPlan: (plan: SubscriptionPlan, limits: PlanLimits, matrixSettings: Record<string, "ENABLED" | "DISABLED" | "ADDON" | "ENTERPRISE">) => void;
  onUpdatePlan: (code: string, updates: Partial<SubscriptionPlan>) => void;
  onUpdatePlanLimit: (planCode: string, limitKey: keyof PlanLimits, value: number) => void;
  onUpdateMatrixCell: (planCode: string, featCode: string, value: "ENABLED" | "DISABLED" | "ADDON" | "ENTERPRISE") => void;
  onSavePlan?: (code: string) => void;
  onSaveFeatureMatrix?: () => void;
  onSaveUsageLimits?: () => void;
  defaultTab?: "tiers" | "matrix" | "limits";
}

export default function PlanFeatureMatrixTab({
  plans,
  features,
  planLimits,
  matrix,
  onAddPlan,
  onUpdatePlan,
  onUpdatePlanLimit,
  onUpdateMatrixCell,
  onSavePlan,
  onSaveFeatureMatrix,
  onSaveUsageLimits,
  defaultTab
}: PlanFeatureMatrixTabProps) {
  const [activePlanSub, setActivePlanSub] = useState<"tiers" | "matrix" | "limits">(defaultTab || "matrix");

  React.useEffect(() => {
    if (defaultTab) {
      setActivePlanSub(defaultTab);
    }
  }, [defaultTab]);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [newPlan, setNewPlan] = useState({
    name: "", code: "", monthlyPrice: 99, yearlyPrice: 990, trialDays: 14, sortOrder: 5
  });

  const handleCreatePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newPlan.name || !newPlan.code) return;

    const codeUpper = newPlan.code.toUpperCase().trim();
    if (plans.some(p => p.code === codeUpper)) {
      setFormError(`Plan Code [${codeUpper}] already exists in core billing configuration templates.`);
      return;
    }

    const defaultLimits: PlanLimits = {
      projectsLimit: 5, layoutsLimit: 15, plotsLimit: 250, customersLimit: 1000, usersLimit: 5,
      agentsLimit: 2, storageLimitGb: 5, documentsLimit: 1000, dxfFilesLimit: 2, marketplaceListingsLimit: 5,
      apiCallsLimit: 5000, whatsAppMessagesLimit: 100, aiCreditsLimit: 50
    };

    const initialMatrixSettings: Record<string, "ENABLED" | "DISABLED" | "ADDON" | "ENTERPRISE"> = {};
    features.forEach(f => {
      initialMatrixSettings[f.code] = "ENABLED";
    });

    onAddPlan(
      {
        name: newPlan.name,
        code: codeUpper,
        monthlyPrice: Number(newPlan.monthlyPrice),
        yearlyPrice: Number(newPlan.yearlyPrice),
        trialDays: Number(newPlan.trialDays),
        status: "ACTIVE",
        sortOrder: Number(newPlan.sortOrder)
      },
      defaultLimits,
      initialMatrixSettings
    );

    setShowAddPlan(false);
    setNewPlan({ name: "", code: "", monthlyPrice: 99, yearlyPrice: 990, trialDays: 14, sortOrder: 5 });
  };

  const handleClonePlan = (sourcePlan: SubscriptionPlan) => {
    const sourceLimits = planLimits[sourcePlan.code] || {
      projectsLimit: 5, layoutsLimit: 15, plotsLimit: 250, customersLimit: 1000, usersLimit: 5,
      agentsLimit: 2, storageLimitGb: 5, documentsLimit: 1050, dxfFilesLimit: 2, marketplaceListingsLimit: 5,
      apiCallsLimit: 5000, whatsAppMessagesLimit: 100, aiCreditsLimit: 50
    };

    const initialMatrixSettings: Record<string, "ENABLED" | "DISABLED" | "ADDON" | "ENTERPRISE"> = {};
    features.forEach(f => {
      initialMatrixSettings[f.code] = matrix[sourcePlan.code]?.[f.code] || "DISABLED";
    });

    onAddPlan(
      {
        name: `${sourcePlan.name} (Copy)`,
        code: `${sourcePlan.code}_COPY`,
        monthlyPrice: sourcePlan.monthlyPrice + 20,
        yearlyPrice: sourcePlan.yearlyPrice + 200,
        trialDays: sourcePlan.trialDays,
        status: "ACTIVE",
        sortOrder: sourcePlan.sortOrder + 1
      },
      sourceLimits,
      initialMatrixSettings
    );

    alert(`Plan '${sourcePlan.name}' successfully cloned to new tier template: '${sourcePlan.name} (Copy)'.`);
  };

  return (
    <div className="space-y-6" id="plan-feature-matrix-tab">
      
      {activePlanSub === "matrix" && (
        <div className="space-y-4" id="matrix-grid-view">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 gap-4 flex-wrap">
            <div className="space-y-0.5">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Plan Feature Matrix Grid</h3>
              <p className="text-[11px] text-slate-500">Enable, disable, or gate access controls across core billing plans using granular variables in real-time.</p>
            </div>
            {onSaveFeatureMatrix && (
              <button
                onClick={() => onSaveFeatureMatrix()}
                className="bg-emerald-650 hover:bg-emerald-750 text-white rounded-lg px-4 py-2 text-xs font-bold font-sans flex items-center gap-1.5 shadow-xs transition-all whitespace-nowrap cursor-pointer"
              >
                <Check className="w-4 h-4 text-white" />
                Save Feature Matrix
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600 border-collapse">
                <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-bold text-center">
                  <tr>
                    <th className="px-5 py-4 text-left min-w-[200px]">Product Feature</th>
                    {plans.map(p => (
                      <th key={p.code} className="px-3 py-4 font-extrabold border-l border-slate-100">
                        <p className="text-slate-900">{p.name}</p>
                        <p className="text-[8px] text-slate-400 lowercase italic font-semibold">{p.code}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {features.map(f => (
                    <tr key={f.code} className="hover:bg-slate-50/50 group/row transition-all">
                      <td className="px-5 py-3 text-left relative group">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 text-xs">{f.name}</span>
                            <span className="cursor-help text-slate-350 hover:text-slate-600 transition-colors" title={f.description || "Grants dynamic functional switches inside tenant systems."}>
                              <Info className="w-3.5 h-3.5" />
                            </span>
                          </div>
                          <p className="text-[9.5px] font-mono text-indigo-650 font-bold uppercase tracking-wider">code: {f.code} • group: {f.group}</p>
                          {f.description && (
                            <p className="text-[10px] text-slate-400 leading-normal max-w-sm">{f.description}</p>
                          )}
                        </div>
                      </td>
                      {plans.map((p, pIndex) => {
                        const planCodeUpper = p.code.toUpperCase();
                        const featCodeUpper = f.code.toUpperCase();
                        
                        const planKey = Object.keys(matrix).find(k => k.toUpperCase() === planCodeUpper) || p.code;
                        const planFeatures = matrix[planKey] || {};
                        
                        const featKey = Object.keys(planFeatures).find(k => k.toUpperCase() === featCodeUpper) || f.code;
                        const rawVal = planFeatures[featKey];
                        
                        let cellVal: "ENABLED" | "DISABLED" | "ADDON" | "ENTERPRISE" = "DISABLED";
                        if (rawVal) {
                          const upperVal = String(rawVal).toUpperCase();
                          if (upperVal === "ENABLED" || upperVal === "TRUE" || (rawVal as any) === true) {
                            cellVal = "ENABLED";
                          } else if (upperVal === "ADDON" || upperVal === "ADD_ON") {
                            cellVal = "ADDON";
                          } else if (upperVal === "ENTERPRISE") {
                            cellVal = "ENTERPRISE";
                          }
                        }

                        // Determine inheritance
                        let isInherited = false;
                        if (pIndex > 0) {
                          // Check if any previous tier has it enabled
                          for (let i = 0; i < pIndex; i++) {
                            const prevPlan = plans[i];
                            const prevKey = Object.keys(matrix).find(k => k.toUpperCase() === prevPlan.code.toUpperCase()) || prevPlan.code;
                            const prevFeatures = matrix[prevKey] || {};
                            const prevFeatKey = Object.keys(prevFeatures).find(k => k.toUpperCase() === featCodeUpper) || f.code;
                            const prevVal = prevFeatures[prevFeatKey];
                            if ((prevVal as any) === "ENABLED" || (prevVal as any) === "TRUE" || (prevVal as any) === true) {
                              isInherited = true;
                              break;
                            }
                          }
                        }

                        // Determine gate lock warning
                        const isPremiumGated = (featCodeUpper.includes("DXF") || featCodeUpper.includes("MAP") || featCodeUpper.includes("AI") || featCodeUpper.includes("API")) && 
                                               (p.code.toLowerCase() === "starter" || p.code.toLowerCase() === "growth") && 
                                               cellVal === "DISABLED";

                        return (
                          <td key={p.code} className="px-3 py-4 text-center border-l border-slate-100 font-sans align-middle">
                            <div className="flex flex-col items-center gap-1.5">
                              <select
                                value={cellVal}
                                onChange={(e) => onUpdateMatrixCell(p.code, f.code, e.target.value as any)}
                                className={`p-1.5 rounded-lg text-[10px] font-black border focus:outline-none cursor-pointer text-center w-full max-w-[125px] transition-all ${
                                  cellVal === "ENABLED" ? "bg-emerald-50 text-emerald-800 border-emerald-150" :
                                  cellVal === "DISABLED" ? "bg-red-50 text-red-800 border-red-150" :
                                  cellVal === "ADDON" ? "bg-indigo-50 text-indigo-850 border-indigo-150" : "bg-amber-50 text-amber-850 border-amber-150"
                                }`}
                              >
                                <option value="ENABLED">✓ Enabled</option>
                                <option value="DISABLED">❌ Disabled</option>
                                <option value="ADDON">🔌 Add-on Only</option>
                                <option value="ENTERPRISE">🏢 Enterprise Only</option>
                              </select>

                              {/* Rich visual helper signals */}
                              {cellVal === "ENABLED" && isInherited && (
                                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded leading-none">
                                  ✓ Inherited
                                </span>
                              )}

                              {isPremiumGated && (
                                <span className="text-[9px] text-amber-650 font-bold bg-amber-50 px-1 py-0.5 rounded flex items-center gap-0.5 leading-none">
                                  🔒 Premium Gated
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activePlanSub === "limits" && (
        <div className="space-y-4" id="limits-matrix-view">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 gap-4 flex-wrap">
            <div className="space-y-0.5">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Usage Limits Configuration</h3>
              <p className="text-[11px] text-slate-500">Edit numeric capabilities and cloud allocations assigned globally to subscriptions template.</p>
            </div>
            {onSaveUsageLimits && (
              <button
                onClick={() => onSaveUsageLimits()}
                className="bg-emerald-650 hover:bg-emerald-750 text-white rounded-lg px-4 py-2 text-xs font-bold font-sans flex items-center gap-1.5 shadow-xs transition-all whitespace-nowrap cursor-pointer"
              >
                <Check className="w-4 h-4 text-white" />
                Save Usage Limits
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-655 font-sans">
                <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-bold text-center">
                  <tr>
                    <th className="px-5 py-4 text-left min-w-[200px]">Limit Scope Field</th>
                    {plans.map(p => (
                      <th key={p.code} className="px-4 py-4 font-bold border-l border-slate-100 text-slate-800">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { key: "projectsLimit", label: "Max township projects", step: 1 },
                    { key: "layoutsLimit", label: "Max subdiv sector layouts", step: 1 },
                    { key: "plotsLimit", label: "Max physical plots ledger", step: 10 },
                    { key: "customersLimit", label: "Max client contact records", step: 50 },
                    { key: "usersLimit", label: "Max authorized login members", step: 1 },
                    { key: "agentsLimit", label: "Max active broker agents", step: 1 },
                    { key: "storageLimitGb", label: "Assigned storage quota (GB)", step: 5 },
                    { key: "documentsLimit", label: "Max CAD documents catalog", step: 100 },
                    { key: "dxfFilesLimit", label: "Max importable DXF diagrams", step: 1 },
                    { key: "marketplaceListingsLimit", label: "Max public property listings", step: 5 },
                    { key: "apiCallsLimit", label: "Max gateway API queries / mo", step: 1000 },
                    { key: "whatsAppMessagesLimit", label: "Max automated WhatsApp / mo", step: 100 },
                    { key: "aiCreditsLimit", label: "Max AI evaluation credits / mo", step: 50 }
                  ].map(limit => (
                    <tr key={limit.key} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 text-left font-semibold text-slate-800">
                        {limit.label}
                      </td>
                      {plans.map(p => {
                        const currentVal = planLimits[p.code]?.[limit.key as keyof PlanLimits];
                        const displayVal = (currentVal === undefined || currentVal === null || currentVal === 0) ? "" : currentVal;
                        return (
                          <td key={p.code} className="px-4 py-3 border-l border-slate-100">
                            <input 
                              type="number"
                              value={displayVal}
                              placeholder="Not configured"
                              onChange={(e) => {
                                const val = e.target.value === "" ? 0 : Number(e.target.value);
                                onUpdatePlanLimit(p.code, limit.key as keyof PlanLimits, val);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-center text-xs font-mono font-bold focus:bg-white focus:outline-none"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activePlanSub === "tiers" && (
        <div className="space-y-6" id="tiers-master-view">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 flex-wrap gap-4">
            <div className="space-y-0.5">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Plan Master Configurations</h3>
              <p className="text-[11px] text-slate-500">Configure global template tiers pricing, trial durations, and sort orders dynamically without code changes.</p>
            </div>
            <button
              onClick={() => { setFormError(null); setShowAddPlan(true); }}
              className="bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg px-4 py-2 text-xs font-bold font-sans flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              Configure Plan Package
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map(p => {
              // Descriptive text mappings based on stable lookup codes
              let planDesc = "Enterprise tier package with configurable variables and standard schema limits.";
              if (p.code === "STARTER") {
                planDesc = "Ideal for growing agencies and local developer hubs seeking automated plot inventory databases.";
              } else if (p.code === "GROWTH") {
                planDesc = "Powerhouse package with extended CAD parser uploads and customer CRM lead pipelines.";
              } else if (p.code === "PROFESSIONAL") {
                planDesc = "Full-spectrum enterprise control with multiple sub-sector layouts and commission scorecards.";
              } else if (p.code === "ENTERPRISE") {
                planDesc = "Unlimited scale and SLA support layers optimized for multi-state real estate conglomerates.";
              }

              // Extract dynamic baseline limits assigned to this plan
              const limitsObj = (planLimits[p.code] || {
                projectsLimit: 0, layoutsLimit: 0, plotsLimit: 0, usersLimit: 0, storageLimitGb: 0
              }) as any;

              // Extract enabled features
              const enabledFeatures = features.filter(f => {
                const planMatrix = matrix[p.code] || {};
                const val = planMatrix[f.code];
                return (val as any) === "ENABLED" || (val as any) === "TRUE" || (val as any) === true;
              });

              return (
                <div key={p.code} className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md hover:border-slate-350 transition-all space-y-5">
                  <div className="space-y-4">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-md font-black text-slate-900">{p.name}</h4>
                          <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full ${
                            p.status === "ACTIVE" 
                              ? "bg-emerald-50 text-emerald-850 border border-emerald-150" 
                              : "bg-red-50 text-red-800 border border-red-150"
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">plan_code: {p.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-indigo-950 font-mono">₹{p.monthlyPrice.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">per month</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-655 leading-relaxed font-sans">{planDesc}</p>

                    {/* Inline Config Inputs */}
                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-3.5">
                      <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Dynamic Pricing Adjustments</p>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[9px] text-slate-450 font-bold uppercase mb-1">Monthly fee (₹)</label>
                          <input 
                            type="number"
                            value={p.monthlyPrice}
                            onChange={(e) => onUpdatePlan(p.code, { monthlyPrice: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold font-mono text-slate-800 focus:outline-none focus:border-indigo-400 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-455 font-bold uppercase mb-1">Yearly fee (₹)</label>
                          <input 
                            type="number"
                            value={p.yearlyPrice}
                            onChange={(e) => onUpdatePlan(p.code, { yearlyPrice: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold font-mono text-slate-800 focus:outline-none focus:border-indigo-400 transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[9px] text-slate-455 font-bold uppercase mb-1">Trial duration (days)</label>
                          <input 
                            type="number"
                            value={p.trialDays}
                            onChange={(e) => onUpdatePlan(p.code, { trialDays: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold font-mono text-slate-800 focus:outline-none focus:border-indigo-400 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-455 font-bold uppercase mb-1">Sort order position</label>
                          <input 
                            type="number"
                            value={p.sortOrder}
                            onChange={(e) => onUpdatePlan(p.code, { sortOrder: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold font-mono text-slate-800 focus:outline-none focus:border-indigo-400 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Allocated Limits (Database-driven) */}
                    <div className="space-y-1.5 font-sans">
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Allocated Capacity Limits</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
                        <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-center">
                          <p className="text-[8px] text-slate-400 font-bold uppercase">Projects</p>
                          <p className="text-xs font-bold text-slate-850">{limitsObj.projectsLimit}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-center">
                          <p className="text-[8px] text-slate-400 font-bold uppercase">Layouts</p>
                          <p className="text-xs font-bold text-slate-850">{limitsObj.layoutsLimit}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-center">
                          <p className="text-[8px] text-slate-400 font-bold uppercase">Plots</p>
                          <p className="text-xs font-bold text-slate-850">{limitsObj.plotsLimit}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-center">
                          <p className="text-[8px] text-slate-400 font-bold uppercase">Users</p>
                          <p className="text-xs font-bold text-slate-850">{limitsObj.usersLimit}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-center">
                          <p className="text-[8px] text-slate-400 font-bold uppercase">Storage</p>
                          <p className="text-xs font-bold text-slate-850">{limitsObj.storageLimitGb} GB</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-2 rounded-lg text-center">
                          <p className="text-[8px] text-slate-400 font-bold uppercase">API limit</p>
                          <p className="text-xs font-bold text-slate-850">{limitsObj.apiCallsLimit || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Included Features (Database-driven) */}
                    <div className="space-y-2 font-sans">
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Included Features Matrix</p>
                      <div className="flex flex-wrap gap-1.5">
                        {enabledFeatures.length > 0 ? (
                          enabledFeatures.slice(0, 5).map(f => (
                            <span key={f.code} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-900 border border-indigo-100/60 rounded px-1.5 py-0.5 text-[9px] font-bold">
                              <Check className="w-2.5 h-2.5 text-indigo-600" />
                              {f.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400">No active capabilities enabled in matrix.</span>
                        )}
                        {enabledFeatures.length > 5 && (
                          <span className="inline-block text-[9px] text-slate-400 font-bold self-center">
                            +{enabledFeatures.length - 5} more features
                          </span>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => onUpdatePlan(p.code, { status: p.status === "ACTIVE" ? "DISABLED" : "ACTIVE" })}
                        className="text-xs font-bold text-slate-550 hover:text-red-650 hover:underline transition-all cursor-pointer"
                      >
                        {p.status === "ACTIVE" ? "Archive" : "Re-activate"}
                      </button>

                      <button
                        onClick={() => handleClonePlan(p)}
                        className="text-xs font-bold text-indigo-650 hover:text-indigo-850 hover:underline flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Clone Plan
                      </button>
                    </div>

                    {onSavePlan && (
                      <button
                        onClick={() => onSavePlan(p.code)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg px-3 py-1.5 text-xs font-sans flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Save Changes
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Configure Plan Dialog */}
      {showAddPlan && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">Configure Plan Package</h3>
              <button onClick={() => setShowAddPlan(false)} className="text-slate-400 hover:text-slate-950 animate-fadeIn">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-155 text-red-650 rounded-lg text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePlanSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Plan Package Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Scale Growth Tier"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Plan Code (unique uppercase)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. SCALE_GROWTH"
                    value={newPlan.code}
                    onChange={(e) => setNewPlan({ ...newPlan, code: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs font-mono tracking-wider focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Display Sort Order</label>
                  <input 
                    type="number" 
                    required
                    value={newPlan.sortOrder}
                    onChange={(e) => setNewPlan({ ...newPlan, sortOrder: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Monthly Cost (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={newPlan.monthlyPrice}
                    onChange={(e) => setNewPlan({ ...newPlan, monthlyPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Yearly Cost (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={newPlan.yearlyPrice}
                    onChange={(e) => setNewPlan({ ...newPlan, yearlyPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Evaluation Period</label>
                  <input 
                    type="number" 
                    required
                    value={newPlan.trialDays}
                    onChange={(e) => setNewPlan({ ...newPlan, trialDays: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowAddPlan(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold">
                  Close
                </button>
                <button type="submit" className="flex-1 bg-indigo-650 hover:bg-indigo-750 text-white py-2.5 rounded-xl font-bold shadow-sm">
                  Register Plan Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
