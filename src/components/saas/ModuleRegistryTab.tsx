import React, { useState } from "react";
import { 
  Plus, Check, Trash2, Edit3, Shield, Box, Zap, Settings, Info, ToggleLeft, ToggleRight, AlertCircle, HelpCircle
} from "lucide-react";
import { SaasModule, SaasFeature } from "./SaasTypes.ts";

interface ModuleRegistryTabProps {
  modules: SaasModule[];
  features: SaasFeature[];
  onAddModule: (mod: SaasModule) => void;
  onUpdateModule: (code: string, updates: Partial<SaasModule>) => void;
  onAddFeature: (feat: SaasFeature) => void;
  onUpdateFeature: (code: string, updates: Partial<SaasFeature>) => void;
  defaultTab?: "modules" | "features";
}

export default function ModuleRegistryTab({
  modules,
  features,
  onAddModule,
  onUpdateModule,
  onAddFeature,
  onUpdateFeature,
  defaultTab
}: ModuleRegistryTabProps) {
  const [activeCatalogSub, setActiveCatalogSub] = useState<"modules" | "features">(defaultTab || "modules");
  
  React.useEffect(() => {
    if (defaultTab) {
      setActiveCatalogSub(defaultTab);
    }
  }, [defaultTab]);
  
  // Modals / forms state
  const [showAddMod, setShowAddMod] = useState(false);
  const [newMod, setNewMod] = useState<SaasModule>({
    name: "", code: "", group: "CRM", description: "", status: "ACTIVE", isCore: false, isBillable: true, defaultFeatureAccess: [], sortOrder: 10
  });

  const [showAddFeat, setShowAddFeat] = useState(false);
  const [newFeat, setNewFeat] = useState<SaasFeature>({
    name: "", code: "", moduleCode: "", group: "CRM", description: "", status: "ACTIVE", defaultEnabled: true
  });

  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateModuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newMod.name || !newMod.code) return;

    if (modules.some(m => m.code === newMod.code.toUpperCase())) {
      setFormError(`Module Code [${newMod.code}] already exists in Registry database.`);
      return;
    }

    onAddModule({
      ...newMod,
      code: newMod.code.toUpperCase()
    });

    setShowAddMod(false);
    setNewMod({
      name: "", code: "", group: "CRM", description: "", status: "ACTIVE", isCore: false, isBillable: true, defaultFeatureAccess: [], sortOrder: 10
    });
  };

  const handleCreateFeatureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newFeat.name || !newFeat.code || !newFeat.moduleCode) return;

    if (features.some(f => f.code === newFeat.code.toUpperCase())) {
      setFormError(`Feature Code [${newFeat.code}] already mapped under a separate Module.`);
      return;
    }

    onAddFeature({
      ...newFeat,
      code: newFeat.code.toUpperCase()
    });

    setShowAddFeat(false);
    setNewFeat({
      name: "", code: "", moduleCode: "", group: "CRM", description: "", status: "ACTIVE", defaultEnabled: true
    });
  };

  return (
    <div className="space-y-6" id="module-registry-tab-root">
      
      {/* Sub tabs hierarchy */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveCatalogSub("modules")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 font-sans flex items-center gap-1.5 transition-all ${
            activeCatalogSub === "modules" 
              ? "border-slate-900 text-slate-900 font-extrabold bg-slate-50 rounded-t-lg" 
              : "border-transparent text-slate-400 hover:text-slate-800"
          }`}
        >
          <Box className="w-3.5 h-3.5 text-indigo-650" />
          Module Registry Directory ({modules.length})
        </button>
        <button
          onClick={() => setActiveCatalogSub("features")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 font-sans flex items-center gap-1.5 transition-all ${
            activeCatalogSub === "features" 
              ? "border-slate-900 text-slate-900 font-extrabold bg-slate-50 rounded-t-lg" 
              : "border-transparent text-slate-400 hover:text-slate-800"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          Dynamic Features Catalog ({features.length})
        </button>
      </div>

      {activeCatalogSub === "modules" ? (
        <div className="space-y-4" id="subtab-modules">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="space-y-0.5">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Module Registry Directory</h3>
              <p className="text-[11px] text-slate-500">Every current and future BhoomiOne module must register here to auto-appear in Subscription Centers.</p>
            </div>
            <button
              onClick={() => { setFormError(null); setShowAddMod(true); }}
              className="bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg px-3 py-1.5 text-xs font-bold font-sans flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Module
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-650">
                <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-extrabold">
                  <tr>
                    <th className="px-5 py-4">Module</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4 text-center">Billable</th>
                    <th className="px-5 py-4 text-center">Enabled</th>
                    <th className="px-5 py-4 text-center">Core</th>
                    <th className="px-5 py-4 text-center">Version</th>
                    <th className="px-5 py-4">Dependencies</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modules.map(m => {
                    // Resolve dynamic module specifications based on stable lookup codes
                    const norm = m.code.toUpperCase();
                    let ver = "v1.0.0";
                    let deps = "Core System Hub";
                    
                    if (norm.includes("CRM") || norm.includes("LEAD")) {
                      ver = "v2.4.0";
                      deps = "Base Framework Component";
                    } else if (norm.includes("PLAN") || norm.includes("TOWNSHIP") || norm.includes("PLOT")) {
                      ver = "v2.0.1";
                      deps = "GIS Node, DXF Lib v2";
                    } else if (norm.includes("MAP") || norm.includes("CAD")) {
                      ver = "v1.5.0";
                      deps = "GIS Spatial Renderer";
                    } else if (norm.includes("FINANCE") || norm.includes("BILL")) {
                      ver = "v2.2.0";
                      deps = "INR Currency Core";
                    } else if (norm.includes("SYS") || norm.includes("PORTAL")) {
                      ver = "v1.1.2";
                      deps = "Audit Log, Auth Schema";
                    }

                    return (
                      <tr key={m.code} className="hover:bg-slate-50/50">
                        {/* Module (Name & Code) */}
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs">{m.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{m.code}</p>
                            <p className="text-[10.5px] text-slate-500 mt-1 leading-normal max-w-sm">{m.description || "No manual description provided for module components."}</p>
                          </div>
                        </td>

                        {/* Category (Group) */}
                        <td className="px-5 py-4">
                          <span className="inline-flex bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase font-sans">
                            {m.group}
                          </span>
                        </td>

                        {/* Billable */}
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-bold rounded ${
                            m.isBillable 
                              ? "bg-amber-50 text-amber-800 border border-amber-100" 
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {m.isBillable ? "⚡ Billable" : "Free Core"}
                          </span>
                        </td>

                        {/* Enabled (Toggle Switch) */}
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => onUpdateModule(m.code, { status: m.status === "ACTIVE" ? "DISABLED" : "ACTIVE" })}
                            className="focus:outline-none hover:opacity-85 transition-all cursor-pointer align-middle inline-block"
                            title={m.status === "ACTIVE" ? "Click to Disable Module" : "Click to Enable Module"}
                          >
                            {m.status === "ACTIVE" ? (
                              <ToggleRight className="w-8 h-8 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="w-8 h-8 text-slate-300" />
                            )}
                          </button>
                        </td>

                        {/* Core (IsCore Flag) */}
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-bold rounded ${
                            m.isCore 
                              ? "bg-indigo-50 text-indigo-800 border border-indigo-150" 
                              : "bg-slate-50 text-slate-400 border border-slate-100"
                          }`}>
                            {m.isCore ? "CORE" : "ADD-ON"}
                          </span>
                        </td>

                        {/* Version */}
                        <td className="px-5 py-4 text-center">
                          <span className="font-mono text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-150 font-bold">
                            {ver}
                          </span>
                        </td>

                        {/* Dependencies */}
                        <td className="px-5 py-4 text-slate-550 font-mono text-[9.5px]">
                          {deps}
                        </td>

                        {/* Status (Runtime indicator) */}
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded-full font-bold font-sans ${
                            m.status === "ACTIVE" 
                              ? "bg-emerald-50 text-emerald-850 border border-emerald-150" 
                              : "bg-red-50 text-red-800 border border-red-150"
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${m.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                            {m.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => onUpdateModule(m.code, { isCore: !m.isCore })}
                            className="text-[10px] text-indigo-600 hover:text-indigo-805 hover:underline font-extrabold cursor-pointer whitespace-nowrap"
                          >
                            Toggle Core
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4" id="subtab-features">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="space-y-0.5">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Dynamic Features Catalog</h3>
              <p className="text-[11px] text-slate-500">Every single sub-route permission feature or module switch configured on the gateway platform registers here.</p>
            </div>
            <button
              onClick={() => { setFormError(null); setShowAddFeat(true); }}
              className="bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg px-3 py-1.5 text-xs font-bold font-sans flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Configure Feature
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-650">
                <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-bold">
                  <tr>
                    <th className="px-5 py-3">Feature Detail</th>
                    <th className="px-5 py-3">Parent Module Code</th>
                    <th className="px-5 py-3">Sub-Group</th>
                    <th className="px-5 py-3 text-center">Default Access</th>
                    <th className="px-5 py-3 text-center">Runtime Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {features.map(f => (
                    <tr key={f.code} className="hover:bg-slate-55/40">
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        <div>
                          <p className="text-xs font-bold text-slate-950">{f.name}</p>
                          <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">{f.code}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-indigo-650">
                        {f.moduleCode}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-slate-500 font-medium">{f.group}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => onUpdateFeature(f.code, { defaultEnabled: !f.defaultEnabled })}
                          className={`text-[10px] inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-bold ${
                            f.defaultEnabled ? "bg-indigo-50 text-indigo-805" : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {f.defaultEnabled ? "Enabled by Default" : "Disabled by Default"}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => onUpdateFeature(f.code, { status: f.status === "ACTIVE" ? "DISABLED" : "ACTIVE" })}
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                            f.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                          }`}
                        >
                          {f.status}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Register Module Dialog */}
      {showAddMod && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">Register Global SaaS Module</h3>
              <button onClick={() => setShowAddMod(false)} className="text-slate-400 hover:text-slate-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-155 text-red-650 rounded-lg text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateModuleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Module Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Interactive Township Maps"
                  value={newMod.name}
                  onChange={(e) => setNewMod({ ...newMod, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Module Code (unique)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. MAP_ENGINE"
                    value={newMod.code}
                    onChange={(e) => setNewMod({ ...newMod, code: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs font-mono tracking-wider focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Module Group</label>
                  <select
                    value={newMod.group}
                    onChange={(e) => setNewMod({ ...newMod, group: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:outline-none"
                  >
                    <option value="System">System Infrastructure</option>
                    <option value="Core Planning">Core Planning</option>
                    <option value="CRM">Lead & CRM CRM</option>
                    <option value="Finance">Finance Ledger</option>
                    <option value="Integrations">Custom Integrations</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Module Description</label>
                <textarea 
                  placeholder="Explain high-level workflows enabled by this system component..."
                  value={newMod.description}
                  onChange={(e) => setNewMod({ ...newMod, description: e.target.value })}
                  className="w-full h-16 bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 font-bold text-slate-700">
                  <input 
                    type="checkbox"
                    checked={newMod.isCore}
                    onChange={(e) => setNewMod({ ...newMod, isCore: e.target.checked })}
                    className="w-4 h-4 text-indigo-650"
                  />
                  <span>Is Core Module</span>
                </label>

                <label className="flex items-center gap-2 font-bold text-slate-700">
                  <input 
                    type="checkbox"
                    checked={newMod.isBillable}
                    onChange={(e) => setNewMod({ ...newMod, isBillable: e.target.checked })}
                    className="w-4 h-4 text-indigo-650"
                  />
                  <span>Is Billable License</span>
                </label>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowAddMod(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold">
                  Close
                </button>
                <button type="submit" className="flex-1 bg-indigo-650 hover:bg-indigo-750 text-white py-2.5 rounded-xl font-bold shadow-sm">
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configure Feature Dialog */}
      {showAddFeat && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">Configure Component Feature</h3>
              <button onClick={() => setShowAddFeat(false)} className="text-slate-400 hover:text-slate-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-155 text-red-650 rounded-lg text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateFeatureSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Feature Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Upload township CAD layout (.DXF)"
                  value={newFeat.name}
                  onChange={(e) => setNewFeat({ ...newFeat, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Feature Code (unique)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. DXF_UPLOAD"
                    value={newFeat.code}
                    onChange={(e) => setNewFeat({ ...newFeat, code: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs font-mono tracking-wider focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Parent Module Association</label>
                  <select
                    value={newFeat.moduleCode}
                    onChange={(e) => {
                      const sel = modules.find(m => m.code === e.target.value);
                      setNewFeat({ ...newFeat, moduleCode: e.target.value, group: sel ? sel.group : "Core Planning" });
                    }}
                    required
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:outline-none"
                  >
                    <option value="">Select Associative Module...</option>
                    {modules.map(m => (
                      <option key={m.code} value={m.code}>[{m.code}] {m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Feature Description</label>
                <textarea 
                  placeholder="Describe functional scopes activated by this feature toggle permission..."
                  value={newFeat.description}
                  onChange={(e) => setNewFeat({ ...newFeat, description: e.target.value })}
                  className="w-full h-16 bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700">
                <input 
                  type="checkbox"
                  checked={newFeat.defaultEnabled}
                  onChange={(e) => setNewFeat({ ...newFeat, defaultEnabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-650"
                />
                <span>Default Enable for Fresh Registries</span>
              </label>

              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowAddFeat(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold">
                  Close
                </button>
                <button type="submit" className="flex-1 bg-indigo-650 hover:bg-indigo-750 text-white py-2.5 rounded-xl font-bold shadow-sm">
                  Catalog Feature
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Inline close icon helper
const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
