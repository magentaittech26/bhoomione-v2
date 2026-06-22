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
      
      {/* Sub menu tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActivePlanSub("matrix")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 font-sans flex items-center gap-1.5 transition-all ${
            activePlanSub === "matrix" 
              ? "border-slate-900 text-slate-900 font-extrabold bg-slate-50 rounded-t-lg" 
              : "border-transparent text-slate-400 hover:text-slate-800"
          }`}
        >
          <Box className="w-3.5 h-3.5 text-indigo-650" />
          Plan Feature Matrix Grid
        </button>
        <button
          onClick={() => setActivePlanSub("limits")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 font-sans flex items-center gap-1.5 transition-all ${
            activePlanSub === "limits" 
              ? "border-slate-900 text-slate-900 font-extrabold bg-slate-50 rounded-t-lg" 
              : "border-transparent text-slate-400 hover:text-slate-800"
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-650" />
          Usage Limits Engine
        </button>
        <button
          onClick={() => setActivePlanSub("tiers")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 font-sans flex items-center gap-1.5 transition-all ${
            activePlanSub === "tiers" 
              ? "border-slate-900 text-slate-900 font-extrabold bg-slate-50 rounded-t-lg" 
              : "border-transparent text-slate-400 hover:text-slate-800"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-indigo-650" />
          Plan Master Packages
        </button>
      </div>

      {activePlanSub === "matrix" && (
        <div className="space-y-4" id="matrix-grid-view">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="space-y-0.5">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Plan Feature Matrix Grid</h3>
              <p className="text-[11px] text-slate-500">Enable, disable, or gate access controls across core billing plans using granular variables in real-time.</p>
            </div>
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
                    <tr key={f.code} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 text-left">
                        <div>
                          <p className="font-bold text-slate-800">{f.name}</p>
                          <p className="text-[9px] text-slate-400 font-mono">Permission: {f.code} • Group: {f.group}</p>
                        </div>
                      </td>
                      {plans.map(p => {
                        const cellVal = matrix[p.code]?.[f.code] || "DISABLED";
                        return (
                          <td key={p.code} className="px-3 py-3 text-center border-l border-slate-100">
                            <select
                              value={cellVal}
                              onChange={(e) => onUpdateMatrixCell(p.code, f.code, e.target.value as any)}
                              className={`p-1.5 rounded-lg text-[10px] font-bold border focus:outline-none cursor-pointer text-center w-full max-w-[130px] ${
                                cellVal === "ENABLED" ? "bg-emerald-50 text-emerald-800 border-emerald-150" :
                                cellVal === "DISABLED" ? "bg-red-50 text-red-800 border-red-150" :
                                cellVal === "ADDON" ? "bg-indigo-50 text-indigo-805 border-indigo-150" : "bg-amber-50 text-amber-805 border-amber-150"
                              }`}
                            >
                              <option value="ENABLED">✓ Enabled</option>
                              <option value="DISABLED">❌ Disabled</option>
                              <option value="ADDON">🔌 Add-on Only</option>
                              <option value="ENTERPRISE">🏢 Enterprise Only</option>
                            </select>
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
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="space-y-0.5">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Usage Limits Configuration</h3>
              <p className="text-[11px] text-slate-500">Edit numeric capabilities and cloud allocations assigned globally to subscriptions template. Real-time updates.</p>
            </div>
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
                        const currentVal = planLimits[p.code]?.[limit.key as keyof PlanLimits] ?? 0;
                        return (
                          <td key={p.code} className="px-4 py-3 border-l border-slate-100">
                            <input 
                              type="number"
                              value={currentVal}
                              onChange={(e) => onUpdatePlanLimit(p.code, limit.key as keyof PlanLimits, Number(e.target.value))}
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
        <div className="space-y-4" id="tiers-master-view">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="space-y-0.5">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Plan Master Configurations</h3>
              <p className="text-[11px] text-slate-500">Configure global template tiers pricing, trial durations, and sort orders dynamically without code changes.</p>
            </div>
            <button
              onClick={() => { setFormError(null); setShowAddPlan(true); }}
              className="bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg px-3 py-1.5 text-xs font-bold font-sans flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Configure Plan Package
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(p => (
              <div key={p.code} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-xs hover:border-slate-350 transition-all">
                <div className="space-y-3">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-905">{p.name}</h4>
                      <p className="text-[10px] font-mono text-slate-400">plan_code: {p.code}</p>
                    </div>
                    <span className={`inline-block px-1.5 py-0.5 text-[9px] rounded font-bold ${
                      p.status === "ACTIVE" 
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                        : "bg-red-50 text-red-00"
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Monthly fee</p>
                      <input 
                        type="number"
                        value={p.monthlyPrice}
                        onChange={(e) => onUpdatePlan(p.code, { monthlyPrice: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 font-bold font-mono text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Yearly fee</p>
                      <input 
                        type="number"
                        value={p.yearlyPrice}
                        onChange={(e) => onUpdatePlan(p.code, { yearlyPrice: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 font-bold font-mono text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Evaluation/trial days</p>
                      <input 
                        type="number"
                        value={p.trialDays}
                        onChange={(e) => onUpdatePlan(p.code, { trialDays: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 font-bold font-mono text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Display sort order</p>
                      <input 
                        type="number"
                        value={p.sortOrder}
                        onChange={(e) => onUpdatePlan(p.code, { sortOrder: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 font-bold font-mono text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <button
                    onClick={() => onUpdatePlan(p.code, { status: p.status === "ACTIVE" ? "DISABLED" : "ACTIVE" })}
                    className="text-xs font-bold text-slate-650 hover:text-slate-950 hover:underline transition-all"
                  >
                    Set {p.status === "ACTIVE" ? "Inactive" : "Active"}
                  </button>

                  <button
                    onClick={() => handleClonePlan(p)}
                    className="text-xs font-bold text-indigo-650 hover:text-indigo-850 hover:underline flex items-center gap-1 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Clone Template Structure
                  </button>
                </div>
              </div>
            ))}
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
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Monthly Cost ($)</label>
                  <input 
                    type="number" 
                    required
                    value={newPlan.monthlyPrice}
                    onChange={(e) => setNewPlan({ ...newPlan, monthlyPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Yearly Cost ($)</label>
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
