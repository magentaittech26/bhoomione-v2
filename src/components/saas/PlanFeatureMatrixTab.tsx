import React, { useState } from "react";
import { 
  Plus, Check, Trash2, Edit3, Shield, Box, Zap, Settings, Info, Copy, Sliders, DollarSign, RefreshCw, X, AlertTriangle, HelpCircle, Search, Sparkles, Tag, Users, Activity, CreditCard
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
  const [activePlanSub, setActivePlanSub] = useState<"tiers" | "matrix" | "limits">(defaultTab || "tiers");

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

  // Advanced 4-Tab Plan Editor Modal states
  const [activeEditPlan, setActiveEditPlan] = useState<SubscriptionPlan | null>(null);
  const [editorTab, setEditorTab] = useState<"general" | "pricing" | "limits" | "features">("general");
  const [featureSearchTerm, setFeatureSearchTerm] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [newLimitKey, setNewLimitKey] = useState("");
  const [newLimitValue, setNewLimitValue] = useState<number>(0);

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
                <div key={p.code} className={`bg-white border rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all space-y-6 relative overflow-hidden ${
                  p.isRecommended ? "border-amber-400 ring-2 ring-amber-400/20" : "border-slate-200"
                }`}>
                  {p.isRecommended && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-bl-xl flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-3 h-3 text-slate-950 shrink-0 fill-slate-950" />
                      <span>Most Popular</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Header Name & Badges */}
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="text-base font-black text-slate-950">{p.name}</h4>
                        <span className={`px-2 py-0.5 text-[8.5px] font-extrabold rounded-full tracking-wider uppercase ${
                          p.status === "ACTIVE" 
                            ? "bg-emerald-50 text-emerald-850 border border-emerald-150" 
                            : "bg-red-50 text-red-800 border border-red-150"
                        }`}>
                          {p.status}
                        </span>
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-[8.5px] font-bold rounded-full tracking-wider uppercase flex items-center gap-1">
                          {p.visibility === "PRIVATE" ? "🔒 Private Link" : p.visibility === "INTERNAL" ? "🏢 Internal Staff" : "🌍 Public"}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-1">Template Code: {p.code}</p>
                    </div>

                    <p className="text-xs text-slate-550 leading-relaxed font-sans">{p.description || planDesc}</p>

                    {/* Commercial Pricing Grid */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Commercial Pricing Structure</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-indigo-50/45 border border-indigo-100 p-2.5 rounded-xl">
                          <p className="text-[9px] text-indigo-650 font-bold uppercase tracking-wider">Monthly Recurring</p>
                          <p className="text-sm font-black text-indigo-950 font-mono mt-0.5">₹{p.monthlyPrice.toLocaleString()}</p>
                        </div>
                        <div className="bg-emerald-50/45 border border-emerald-100 p-2.5 rounded-xl">
                          <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">Yearly Recurring</p>
                          <p className="text-sm font-black text-emerald-950 font-mono mt-0.5">₹{p.yearlyPrice.toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl">
                          <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">One-Time License</p>
                          <p className="text-sm font-black text-slate-800 font-mono mt-0.5">₹{(p.oneTimeLicenseFee || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl">
                          <p className="text-[9px] text-slate-455 font-bold uppercase tracking-wider">Annual Maintenance (AMC)</p>
                          <p className="text-sm font-black text-slate-800 font-mono mt-0.5">₹{(p.amcFee || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Resource Caps Limits (Database-driven) */}
                    <div className="space-y-2 font-sans">
                      <p className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Allocated Capacity Limits</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
                        <div className="bg-slate-50 border border-slate-150 p-2 rounded-xl text-center">
                          <p className="text-[8.5px] text-slate-400 font-bold uppercase">Max Projects</p>
                          <p className="text-[11px] font-black text-slate-850">{limitsObj.projectsLimit === -1 ? "Unlimited" : limitsObj.projectsLimit}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-150 p-2 rounded-xl text-center">
                          <p className="text-[8.5px] text-slate-400 font-bold uppercase">Max Layouts</p>
                          <p className="text-[11px] font-black text-slate-850">{limitsObj.layoutsLimit}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-150 p-2 rounded-xl text-center">
                          <p className="text-[8.5px] text-slate-400 font-bold uppercase">Max Plots</p>
                          <p className="text-[11px] font-black text-slate-850">{limitsObj.plotsLimit}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-150 p-2 rounded-xl text-center">
                          <p className="text-[8.5px] text-slate-400 font-bold uppercase">Max Users</p>
                          <p className="text-[11px] font-black text-slate-850">{limitsObj.usersLimit}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-150 p-2 rounded-xl text-center">
                          <p className="text-[8.5px] text-slate-400 font-bold uppercase">Disk Storage</p>
                          <p className="text-[11px] font-black text-slate-850">{limitsObj.storageLimitGb} GB</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-150 p-2 rounded-xl text-center">
                          <p className="text-[8.5px] text-slate-400 font-bold uppercase">Trial evaluation</p>
                          <p className="text-[11px] font-black text-slate-850">{p.trialDays} Days</p>
                        </div>
                      </div>
                    </div>

                    {/* Included Features (Database-driven) */}
                    <div className="space-y-2 font-sans">
                      <p className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Included Feature Swappables</p>
                      <div className="flex flex-wrap gap-1.5">
                        {enabledFeatures.length > 0 ? (
                          enabledFeatures.slice(0, 5).map(f => (
                            <span key={f.code} className="inline-flex items-center gap-1 bg-indigo-50/70 text-indigo-950 border border-indigo-100 rounded px-2 py-0.5 text-[9px] font-bold">
                              <Check className="w-2.5 h-2.5 text-indigo-650 shrink-0" />
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

                      <button
                        type="button"
                        onClick={() => {
                          setActiveEditPlan(p);
                          setEditorTab("general");
                        }}
                        className="text-xs font-bold text-amber-650 hover:text-amber-850 hover:underline flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Full Plan
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

      {/* Advanced 4-Tab Plan Editor Modal */}
      {activeEditPlan && (() => {
        const p = plans.find(plan => plan.code === activeEditPlan.code) || activeEditPlan;
        const limitsForPlan = planLimits[p.code] || {
          projectsLimit: 0, layoutsLimit: 0, plotsLimit: 0, usersLimit: 0, storageLimitGb: 0
        };

        // Group features by category/group
        const groupedFeatures: Record<string, SaasFeature[]> = {};
        features.forEach(f => {
          const groupName = f.group || "Core Platform";
          if (!groupedFeatures[groupName]) {
            groupedFeatures[groupName] = [];
          }
          groupedFeatures[groupName].push(f);
        });

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full h-[90vh] md:h-[80vh] flex flex-col shadow-2xl border border-slate-200 animate-scaleUp overflow-hidden font-sans">
              
              {/* Header */}
              <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black tracking-tight">Advanced Plan Configuration Editor</h3>
                    <span className="text-[10px] uppercase font-mono font-bold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded border border-indigo-500/20">
                      {p.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-355">Configure enterprise credentials, pricing metrics, resource caps, and access matrices.</p>
                </div>
                <button 
                  onClick={() => setActiveEditPlan(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sub-navigation Tabs */}
              <div className="flex border-b border-slate-200 bg-slate-50 px-6 py-2 shrink-0 gap-1 overflow-x-auto">
                {[
                  { id: "general", label: "General Config", icon: Settings },
                  { id: "pricing", label: "Pricing & GST", icon: CreditCard },
                  { id: "limits", label: "Capacity Limits", icon: Sliders },
                  { id: "features", label: "Enabled Features", icon: Shield }
                ].map(tab => {
                  const isActive = editorTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setEditorTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        isActive 
                          ? "bg-white text-indigo-700 shadow-3xs border border-slate-200" 
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Tab Content Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-650">
                
                {/* GENERAL TAB */}
                {editorTab === "general" && (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-2xl text-[11px] text-amber-800 leading-normal">
                      Configure base product naming structures, customer visibility parameters, and system rendering badges.
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Plan Display Name</label>
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => onUpdatePlan(p.code, { name: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:bg-white focus:border-indigo-400 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Plan Lookup Code</label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={p.code}
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Description</label>
                      <textarea
                        rows={3}
                        value={p.description || ""}
                        onChange={(e) => onUpdatePlan(p.code, { description: e.target.value })}
                        placeholder="Describe the plan benefits and target audience..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-sans focus:bg-white focus:border-indigo-400 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Internal Notes (Administrative)</label>
                      <textarea
                        rows={2}
                        value={p.internalNotes || ""}
                        onChange={(e) => onUpdatePlan(p.code, { internalNotes: e.target.value })}
                        placeholder="Internal notes for administrators, custom pricing rules contract notes, or audit trail details..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-sans focus:bg-white focus:border-indigo-400 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Status</label>
                        <select
                          value={p.status}
                          onChange={(e) => onUpdatePlan(p.code, { status: e.target.value as any })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:bg-white focus:outline-none"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="DISABLED">DISABLED</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Theme Color (Hex/Class)</label>
                        <input
                          type="text"
                          value={p.color || ""}
                          onChange={(e) => onUpdatePlan(p.code, { color: e.target.value })}
                          placeholder="e.g. #4f46e5"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Sort Order Position</label>
                        <input
                          type="number"
                          value={p.sortOrder}
                          onChange={(e) => onUpdatePlan(p.code, { sortOrder: Number(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-150">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-bold uppercase text-slate-550 tracking-wider">Recommended Badge</label>
                          <input
                            type="checkbox"
                            checked={!!p.isRecommended}
                            onChange={(e) => onUpdatePlan(p.code, { isRecommended: e.target.checked })}
                            className="w-4 h-4 rounded text-indigo-650 cursor-pointer"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400">Highlights this plan as 'Most Popular' on customer checkout screens.</p>
                      </div>

                      <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-150 flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-4">
                          <label className="block text-[10px] font-bold uppercase text-slate-550 tracking-wider">Visibility Level</label>
                          <select
                            value={p.visibility || "PUBLIC"}
                            onChange={(e) => onUpdatePlan(p.code, { visibility: e.target.value as any })}
                            className="bg-white border border-slate-200 rounded p-1 text-[10px] font-bold focus:outline-none"
                          >
                            <option value="PUBLIC">🌍 Public</option>
                            <option value="PRIVATE">🔒 Private Link</option>
                            <option value="INTERNAL">🏢 Internal Only</option>
                          </select>
                        </div>
                        <p className="text-[10px] text-slate-400">Restricts checkouts to corporate or internal staff workspaces.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PRICING TAB */}
                {editorTab === "pricing" && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl text-[11px] text-indigo-850 leading-normal">
                      Configure base monthly, yearly, and one-time licensing fees. Establish tax metrics and GST behaviour.
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Monthly Recurring Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                          <input
                            type="number"
                            value={p.monthlyPrice}
                            onChange={(e) => onUpdatePlan(p.code, { monthlyPrice: Number(e.target.value) })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-7 text-xs font-black font-mono focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Yearly Recurring Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                          <input
                            type="number"
                            value={p.yearlyPrice}
                            onChange={(e) => onUpdatePlan(p.code, { yearlyPrice: Number(e.target.value) })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-7 text-xs font-black font-mono focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">One-Time License Fee (Optional)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                          <input
                            type="number"
                            value={p.oneTimeLicenseFee || 0}
                            onChange={(e) => onUpdatePlan(p.code, { oneTimeLicenseFee: Number(e.target.value) })}
                            placeholder="e.g. 50000"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-7 text-xs font-black font-mono focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Annual Maintenance (AMC Fee)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                          <input
                            type="number"
                            value={p.amcFee || 0}
                            onChange={(e) => onUpdatePlan(p.code, { amcFee: Number(e.target.value) })}
                            placeholder="e.g. 15000"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-7 text-xs font-black font-mono focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Trial Evaluation (Days)</label>
                        <input
                          type="number"
                          value={p.trialDays}
                          onChange={(e) => onUpdatePlan(p.code, { trialDays: Number(e.target.value) })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-black font-mono focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider">Base Currency</label>
                        <select
                          value={p.currency || "INR"}
                          onChange={(e) => onUpdatePlan(p.code, { currency: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:bg-white focus:outline-none"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider font-sans">GST Behaviour Schema</label>
                        <select
                          value={p.gstBehavior || "INCLUSIVE"}
                          onChange={(e) => onUpdatePlan(p.code, { gstBehavior: e.target.value as any })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:bg-white focus:outline-none"
                        >
                          <option value="INCLUSIVE">INCLUSIVE (18% Included)</option>
                          <option value="EXCLUSIVE">EXCLUSIVE (18% Extra)</option>
                          <option value="EXEMPT">EXEMPT (No Taxes)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider font-sans">Renewal Behaviour</label>
                        <select
                          value={p.renewalBehavior || "AUTO_RENEW"}
                          onChange={(e) => onUpdatePlan(p.code, { renewalBehavior: e.target.value as any })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:bg-white focus:outline-none"
                        >
                          <option value="AUTO_RENEW">🔄 Auto-Renew via credit card / auto-debit</option>
                          <option value="MANUAL_INVOICE">📄 Manual offline invoice settlement & check</option>
                          <option value="TERMINATE">🛑 Auto-terminate at period end (No Renewal)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider font-sans">Overdue Grace Period (Days)</label>
                        <input
                          type="number"
                          value={p.gracePeriodDays || 7}
                          onChange={(e) => onUpdatePlan(p.code, { gracePeriodDays: Number(e.target.value) })}
                          placeholder="7"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-black font-mono focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* LIMITS TAB */}
                {editorTab === "limits" && (
                  <div className="space-y-4">
                    <div className="bg-teal-50/50 border border-teal-200/50 p-4 rounded-2xl text-[11px] text-teal-800 leading-normal flex justify-between items-center">
                      <div>
                        Assign dynamic numerical threshold parameters and system caps.
                        <strong className="block mt-0.5 text-teal-900">Any dynamic key added here is automatically supported!</strong>
                      </div>
                    </div>

                    {/* Add Custom Limit Sub-Form */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex gap-3 items-end">
                      <div className="flex-1 space-y-1">
                        <label className="block text-[9px] font-bold uppercase text-slate-450">Custom Limit Parameter Key</label>
                        <input
                          type="text"
                          value={newLimitKey}
                          onChange={(e) => setNewLimitKey(e.target.value.replace(/\s+/g, ""))}
                          placeholder="e.g. max_bookings"
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                      <div className="w-[120px] space-y-1">
                        <label className="block text-[9px] font-bold uppercase text-slate-450">Value limit</label>
                        <input
                          type="number"
                          value={newLimitValue}
                          onChange={(e) => setNewLimitValue(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newLimitKey.trim()) return;
                          onUpdatePlanLimit(p.code, newLimitKey as any, newLimitValue);
                          setNewLimitKey("");
                          setNewLimitValue(0);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg p-2 px-3 text-xs font-bold h-[35px] cursor-pointer"
                      >
                        Add Parameter
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-[300px] overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-bold">
                          <tr>
                            <th className="p-3">Limit Dimension / Key</th>
                            <th className="p-3 text-center w-[150px]">Allowed Bound</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {Object.entries(limitsForPlan).map(([key, val]) => {
                            // Map well-known keys to friendly names
                            const labelsMap: Record<string, string> = {
                              projectsLimit: "🏢 Total Projects Limit",
                              layoutsLimit: "📐 Subdiv Sector Layouts",
                              plotsLimit: "🗺️ Max Plot Ledger Count",
                              customersLimit: "👥 Customers CRM Records",
                              usersLimit: "👤 Authorized User Logins",
                              agentsLimit: "💼 Active Broker Agents",
                              storageLimitGb: "☁️ Assigned Cloud Storage (GB)",
                              documentsLimit: "📄 CAD Documents Catalog",
                              dxfFilesLimit: "⚙️ DXF Imports Allowed",
                              marketplaceListingsLimit: "🌐 Marketplace Listings",
                              apiCallsLimit: "⚡ API Gateway Requests / mo",
                              whatsAppMessagesLimit: "💬 WhatsApp Notifications / mo",
                              aiCreditsLimit: "🤖 AI Evaluation Credits"
                            };
                            return (
                              <tr key={key} className="hover:bg-slate-50/50">
                                <td className="p-3">
                                  <span className="font-extrabold text-slate-800 block">{labelsMap[key] || key}</span>
                                  <span className="text-[9.5px] text-slate-400 font-mono">key: {key}</span>
                                </td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    value={val === undefined || val === null ? "" : val}
                                    onChange={(e) => onUpdatePlanLimit(p.code, key as any, e.target.value === "" ? 0 : Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-center font-mono font-bold focus:bg-white focus:outline-none"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* FEATURES TAB */}
                {editorTab === "features" && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-2xl text-[11px] text-indigo-800 flex justify-between items-center gap-4 flex-wrap">
                      <div className="leading-normal">
                        Toggle functional access switches assigned to this plan.
                        <span className="block text-slate-450 font-bold">Enabled features are accessible by active workspace subscription handshakes.</span>
                      </div>
                      
                      <div className="relative max-w-[220px] w-full">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search modules & features..."
                          value={featureSearchTerm}
                          onChange={(e) => setFeatureSearchTerm(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg pl-8 p-1.5 text-xs focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                      {Object.entries(groupedFeatures).map(([groupName, groupFeaturesList]) => {
                        // Filter features in this group based on search term
                        const filteredList = groupFeaturesList.filter(f => 
                          f.name.toLowerCase().includes(featureSearchTerm.toLowerCase()) || 
                          f.code.toLowerCase().includes(featureSearchTerm.toLowerCase()) ||
                          (f.description && f.description.toLowerCase().includes(featureSearchTerm.toLowerCase()))
                        );

                        if (filteredList.length === 0) return null;
                        const isCollapsed = !!collapsedGroups[groupName];

                        return (
                          <div key={groupName} className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-2.5">
                            <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                              <h4 className="text-[10px] font-extrabold text-slate-550 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                {groupName}
                              </h4>
                              <button
                                type="button"
                                onClick={() => setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }))}
                                className="text-[10px] text-indigo-650 hover:text-indigo-800 font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                              >
                                {isCollapsed ? "Expand Group [ + ]" : "Collapse Group [ − ]"}
                              </button>
                            </div>

                            {!isCollapsed && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {filteredList.map((f) => {
                                  const isChecked = matrix[p.code]?.[f.code] === "ENABLED";
                                  
                                  // Inheritance detection
                                  let isInherited = false;
                                  const planIndex = plans.findIndex(plan => plan.code === p.code);
                                  if (planIndex > 0) {
                                    for (let i = 0; i < planIndex; i++) {
                                      if (matrix[plans[i].code]?.[f.code] === "ENABLED") {
                                        isInherited = true;
                                        break;
                                      }
                                    }
                                  }

                                  return (
                                    <div key={f.code} className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-150 shadow-3xs">
                                      <input
                                        type="checkbox"
                                        id={`feat-modal-${p.code}-${f.code}`}
                                        checked={isChecked}
                                        onChange={(e) => {
                                          onUpdateMatrixCell(p.code, f.code, e.target.checked ? "ENABLED" : "DISABLED");
                                        }}
                                        className="w-4 h-4 rounded text-indigo-650 cursor-pointer mt-0.5"
                                      />
                                      <div className="space-y-0.5 flex-1 min-w-0">
                                        <label htmlFor={`feat-modal-${p.code}-${f.code}`} className="font-extrabold text-slate-900 cursor-pointer block select-none">
                                          {f.name}
                                        </label>
                                        <p className="text-[9px] text-slate-400 font-mono select-none">code: {f.code}</p>
                                        {f.description && (
                                          <p className="text-[9.5px] text-slate-500 leading-normal select-none">{f.description}</p>
                                        )}
                                        
                                        <div className="flex gap-1.5 pt-1.5">
                                          {isInherited && (
                                            <span className="text-[8.5px] bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold px-1.5 py-0.5 rounded leading-none flex items-center gap-0.5">
                                              ✓ Inherited
                                            </span>
                                          )}
                                          {isChecked && (
                                            <span className="text-[8.5px] bg-indigo-50 text-indigo-800 border border-indigo-100 font-bold px-1.5 py-0.5 rounded leading-none flex items-center gap-0.5">
                                              🔌 Enabled
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              {/* Actions Footer */}
              <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setActiveEditPlan(null)}
                  className="bg-white border border-slate-250 text-slate-700 py-2 px-4 rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-100"
                >
                  Close & Discard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSavePlan) {
                      onSavePlan(p.code);
                    }
                    setActiveEditPlan(null);
                  }}
                  className="bg-indigo-650 hover:bg-indigo-750 text-white py-2 px-5 rounded-xl font-bold text-xs shadow-md cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Save Plan & Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
