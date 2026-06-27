import React, { useState } from "react";
import { 
  Plus, Check, Trash2, Edit3, Shield, Box, Zap, Settings, Info, ToggleLeft, ToggleRight, AlertCircle, HelpCircle
} from "lucide-react";
import { SaasModule, SaasFeature } from "./SaasTypes.ts";

interface ModuleRegistryTabProps {
  modules: SaasModule[];
  features: SaasFeature[];
  plans?: any[];
  addons?: any[];
  matrix?: Record<string, Record<string, any>>;
  isLoading?: boolean;
  error?: string | null;
  onAddModule: (mod: SaasModule) => void;
  onUpdateModule: (code: string, updates: Partial<SaasModule>) => void;
  onAddFeature: (feat: SaasFeature) => void;
  onUpdateFeature: (code: string, updates: Partial<SaasFeature>) => void;
  defaultTab?: "modules" | "features";
}

export default function ModuleRegistryTab({
  modules,
  features,
  plans = [],
  addons = [],
  matrix = {},
  isLoading = false,
  error = null,
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

      {/* Diagnostics / Loader & Error Banners */}
      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium font-sans">Fetching Module Registry from PostgreSQL...</p>
        </div>
      )}

      {error && (
        <div className="p-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-3 font-sans">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <div className="space-y-1 text-left">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-red-800">Failed to load module registry</h4>
            <p className="text-[11px] text-red-650 leading-relaxed">{error}</p>
            <p className="text-[10px] text-red-500 font-mono">Verify Laravel backend is running and connected to PostgreSQL.</p>
          </div>
        </div>
      )}

      {!isLoading && !error && modules.length === 0 && (
        <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center max-w-md mx-auto space-y-4 font-sans shadow-2xs">
          <div className="bg-slate-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-slate-400 border border-slate-200">
            <Box className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">No modules found</h4>
            <p className="text-[11px] text-slate-500">Run SaasSubscriptionSeeder in the Laravel backend to populate initial modules and features from PostgreSQL.</p>
          </div>
          <div className="text-[10.5px] text-slate-650 font-mono bg-slate-100 p-3 rounded-lg border text-left space-y-1.5">
            <div className="text-slate-400">// Execute Seeder command:</div>
            <div className="text-indigo-750 font-extrabold select-all">php artisan db:seed --class=SaasSubscriptionSeeder</div>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      {!isLoading && !error && modules.length > 0 && (
        <>
          {activeCatalogSub === "modules" ? (
            <div className="space-y-4 font-sans animate-fadeIn" id="subtab-modules">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Module Registry Directory</h3>
                  <p className="text-[11px] text-slate-500">Every current and future BhoomiOne module must register here to auto-appear in Subscription Centers.</p>
                </div>
                <button
                  onClick={() => { setFormError(null); setShowAddMod(true); }}
                  className="bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg px-3 py-1.5 text-xs font-bold font-sans flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
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
                        <th className="px-5 py-4">Module Details</th>
                        <th className="px-5 py-4">Category</th>
                        <th className="px-5 py-4 text-center">Classification</th>
                        <th className="px-5 py-4 text-center">Features</th>
                        <th className="px-5 py-4">Used by Plans</th>
                        <th className="px-5 py-4">Used by Add-ons</th>
                        <th className="px-5 py-4 text-center">Version & Deps</th>
                        <th className="px-5 py-4 text-center">Enabled</th>
                        <th className="px-5 py-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {modules.map(m => {
                        const norm = m.code.toUpperCase();
                        let ver = "v1.0.0";
                        let deps = "Core System Hub";
                        
                        if (norm.includes("CRM") || norm.includes("LEAD")) {
                          ver = "v2.4.0";
                          deps = "Base Framework";
                        } else if (norm.includes("PLAN") || norm.includes("TOWNSHIP") || norm.includes("PLOT") || norm.includes("LAYOUT")) {
                          ver = "v2.0.1";
                          deps = "GIS Node, DXF Lib v2";
                        } else if (norm.includes("MAP") || norm.includes("CAD") || norm.includes("DXF")) {
                          ver = "v1.5.0";
                          deps = "GIS Spatial Renderer";
                        } else if (norm.includes("FINANCE") || norm.includes("BILL") || norm.includes("BOOK") || norm.includes("COLL")) {
                          ver = "v2.2.0";
                          deps = "INR Currency Core";
                        } else if (norm.includes("SYS") || norm.includes("PORTAL")) {
                          ver = "v1.1.2";
                          deps = "Audit Log, Auth";
                        }

                        const moduleFeats = features.filter(f => f.moduleCode === m.code);
                        const featCount = moduleFeats.length;

                        // Compute which plans use this module based on enabling any features inside it
                        const usingPlans = plans?.filter(p => {
                          const planFeats = matrix?.[p.code] || {};
                          return moduleFeats.some(f => planFeats[f.code] && planFeats[f.code] !== "DISABLED");
                        }).map(p => p.name) || [];

                        // Compute which add-ons use this module based on mapping feature codes
                        const usingAddons = addons?.filter(a => {
                          return a.feature_code && moduleFeats.some(f => f.code.toLowerCase() === a.feature_code.toLowerCase());
                        }).map(a => a.name) || [];

                        // System vs Core vs Optional classification
                        const isSystem = m.group === "System" || m.group === "System Infrastructure";
                        const classification = isSystem ? "SYSTEM" : (m.isCore ? "CORE" : "OPTIONAL");

                        return (
                          <tr key={m.code} className="hover:bg-slate-55/40">
                            {/* Module Name & Details */}
                            <td className="px-5 py-4">
                              <div className="space-y-1">
                                <p className="font-extrabold text-slate-900 text-xs">{m.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono font-semibold">{m.code}</p>
                                <p className="text-[10.5px] text-slate-500 leading-normal max-w-sm">{m.description || "No manual description provided for module components."}</p>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="px-5 py-4">
                              <span className="inline-flex bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase font-mono">
                                {m.group}
                              </span>
                            </td>

                            {/* Classification Type (System / Core / Optional) */}
                            <td className="px-5 py-4 text-center">
                              {classification === "SYSTEM" && (
                                <span className="inline-flex px-2 py-0.5 text-[9px] font-extrabold rounded-md bg-slate-950 text-white uppercase tracking-wider">
                                  🖥️ SYSTEM
                                </span>
                              )}
                              {classification === "CORE" && (
                                <span className="inline-flex px-2 py-0.5 text-[9px] font-bold rounded-md bg-indigo-50 text-indigo-800 border border-indigo-150 uppercase tracking-wider">
                                  📦 CORE
                                </span>
                              )}
                              {classification === "OPTIONAL" && (
                                <span className="inline-flex px-2 py-0.5 text-[9px] font-bold rounded-md bg-sky-50 text-sky-800 border border-sky-150 uppercase tracking-wider">
                                  ⚙️ OPTIONAL
                                </span>
                              )}
                            </td>

                            {/* Feature Count */}
                            <td className="px-5 py-4 text-center">
                              <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full font-bold border">
                                {featCount}
                              </span>
                            </td>

                            {/* Used by Plans */}
                            <td className="px-5 py-4">
                              {usingPlans.length === 0 ? (
                                <span className="text-[10.5px] text-slate-400 italic">None</span>
                              ) : (
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {usingPlans.map(pn => (
                                    <span key={pn} className="bg-indigo-50/50 border border-indigo-100 text-indigo-750 px-1.5 py-0.5 rounded text-[9.5px] font-bold">
                                      {pn}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Used by Add-ons */}
                            <td className="px-5 py-4">
                              {usingAddons.length === 0 ? (
                                <span className="text-[10.5px] text-slate-400 italic">None</span>
                              ) : (
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {usingAddons.map(an => (
                                    <span key={an} className="bg-amber-50 border border-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9.5px] font-bold">
                                      {an}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Version & Dependencies */}
                            <td className="px-5 py-4 text-center">
                              <div className="space-y-1">
                                <span className="font-mono text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-150 font-bold">
                                  {ver}
                                </span>
                                <p className="text-[9.5px] text-slate-400 font-mono leading-none">{deps}</p>
                              </div>
                            </td>

                            {/* Enabled Toggle Switch */}
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

                            {/* Status Indicator */}
                            <td className="px-5 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 text-[9.5px] px-2 py-0.5 rounded-full font-bold font-sans ${
                                m.status === "ACTIVE" 
                                  ? "bg-emerald-50 text-emerald-850 border border-emerald-150" 
                                  : "bg-red-50 text-red-850 border border-red-155"
                              }`}>
                                <span className={`w-1 h-1 rounded-full ${m.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                                {m.status}
                              </span>
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
            <div className="space-y-4 font-sans animate-fadeIn" id="subtab-features">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Dynamic Features Catalog</h3>
                  <p className="text-[11px] text-slate-500">Every single sub-route permission feature or module switch configured on the gateway platform registers here.</p>
                </div>
                <button
                  onClick={() => { setFormError(null); setShowAddFeat(true); }}
                  className="bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg px-3 py-1.5 text-xs font-bold font-sans flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Configure Feature
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-650">
                    <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-extrabold">
                      <tr>
                        <th className="px-5 py-4">Feature Details</th>
                        <th className="px-5 py-4">Parent Module</th>
                        <th className="px-5 py-4 text-center">Classification</th>
                        <th className="px-5 py-4 text-center">Default State</th>
                        <th className="px-5 py-4">Included in Plans</th>
                        <th className="px-5 py-4">Enabled by Add-ons</th>
                        <th className="px-5 py-4 text-center">Runtime Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {features.map(f => {
                        const parentMod = modules.find(m => m.code === f.moduleCode);
                        
                        // Plan usage
                        const featPlans = plans?.filter(p => {
                          const planFeats = matrix?.[p.code] || {};
                          return planFeats[f.code] && planFeats[f.code] !== "DISABLED";
                        }).map(p => p.name) || [];

                        // Addon usage
                        const featAddons = addons?.filter(a => {
                          return a.feature_code && a.feature_code.toLowerCase() === f.code.toLowerCase();
                        }).map(a => a.name) || [];

                        // Classification indicators
                        const isSystemFeature = f.group === "System" || parentMod?.group === "System" || parentMod?.isCore;
                        const isDeprecated = f.status !== "ACTIVE";

                        return (
                          <tr key={f.code} className="hover:bg-slate-55/40">
                            {/* Feature details */}
                            <td className="px-5 py-4 font-semibold text-slate-900">
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-950">{f.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono font-semibold">{f.code}</p>
                                <p className="text-[10.5px] text-slate-500 font-normal leading-relaxed max-w-sm">{f.description || "No manual description provided for feature toggles."}</p>
                              </div>
                            </td>

                            {/* Parent Module */}
                            <td className="px-5 py-4">
                              <div className="space-y-1">
                                <p className="text-xs font-extrabold text-indigo-650 font-mono leading-none">{f.moduleCode}</p>
                                <p className="text-[10px] text-slate-400 leading-none">{parentMod?.name || "Global Platform"}</p>
                              </div>
                            </td>

                            {/* Classification */}
                            <td className="px-5 py-4 text-center">
                              <div className="flex flex-col gap-1 items-center justify-center">
                                {isSystemFeature && (
                                  <span className="inline-flex px-1.5 py-0.5 text-[8.5px] font-extrabold rounded bg-slate-950 text-white uppercase tracking-wider">
                                    ⚙️ SYSTEM
                                  </span>
                                )}
                                {isDeprecated && (
                                  <span className="inline-flex px-1.5 py-0.5 text-[8.5px] font-extrabold rounded bg-red-55 text-red-800 border border-red-100 uppercase tracking-wider">
                                    ⚠️ DEPRECATED
                                  </span>
                                )}
                                {!isSystemFeature && !isDeprecated && (
                                  <span className="inline-flex px-1.5 py-0.5 text-[8.5px] font-bold rounded bg-slate-100 text-slate-600 uppercase">
                                    REGULAR
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Default State */}
                            <td className="px-5 py-4 text-center">
                              <button
                                onClick={() => onUpdateFeature(f.code, { defaultEnabled: !f.defaultEnabled })}
                                className={`text-[9.5px] inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-bold cursor-pointer transition-all ${
                                  f.defaultEnabled 
                                    ? "bg-indigo-50 text-indigo-850 border border-indigo-150" 
                                    : "bg-slate-100 text-slate-400 border border-slate-200"
                                }`}
                              >
                                {f.defaultEnabled ? "Enabled by Default" : "Disabled by Default"}
                              </button>
                            </td>

                            {/* Included in Plans */}
                            <td className="px-5 py-4">
                              {featPlans.length === 0 ? (
                                <span className="text-[10.5px] text-slate-400 italic">None</span>
                              ) : (
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {featPlans.map(pn => (
                                    <span key={pn} className="bg-indigo-50/50 border border-indigo-100 text-indigo-750 px-1.5 py-0.5 rounded text-[9.5px] font-bold">
                                      {pn}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Enabled by Add-ons */}
                            <td className="px-5 py-4">
                              {featAddons.length === 0 ? (
                                <span className="text-[10.5px] text-slate-400 italic">None</span>
                              ) : (
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {featAddons.map(an => (
                                    <span key={an} className="bg-amber-50 border border-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9.5px] font-bold">
                                      {an}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Runtime Status */}
                            <td className="px-5 py-4 text-center">
                              <button
                                onClick={() => onUpdateFeature(f.code, { status: f.status === "ACTIVE" ? "DISABLED" : "ACTIVE" })}
                                className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-all ${
                                  f.status === "ACTIVE" 
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-150" 
                                    : "bg-red-50 text-red-800 border border-red-155"
                                }`}
                              >
                                {f.status}
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
          )}
        </>
      )}

      {/* Register Module Dialog */}
      {showAddMod && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">Register Global SaaS Module</h3>
              <button onClick={() => setShowAddMod(false)} className="text-slate-400 hover:text-slate-950 cursor-pointer">
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
                  value={newMod.description || ""}
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
                <button type="button" onClick={() => setShowAddMod(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold cursor-pointer">
                  Close
                </button>
                <button type="submit" className="flex-1 bg-indigo-650 hover:bg-indigo-750 text-white py-2.5 rounded-xl font-bold shadow-sm cursor-pointer">
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">Configure Component Feature</h3>
              <button onClick={() => setShowAddFeat(false)} className="text-slate-400 hover:text-slate-950 cursor-pointer">
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
                  value={newFeat.description || ""}
                  onChange={(e) => setNewFeat({ ...newFeat, description: e.target.value })}
                  className="w-full h-16 bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 font-bold text-slate-700 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={newFeat.defaultEnabled}
                  onChange={(e) => setNewFeat({ ...newFeat, defaultEnabled: e.target.checked })}
                  className="w-4 h-4 text-indigo-650 cursor-pointer"
                />
                <span>Default Enable for Fresh Registries</span>
              </label>

              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowAddFeat(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold cursor-pointer">
                  Close
                </button>
                <button type="submit" className="flex-1 bg-indigo-650 hover:bg-indigo-750 text-white py-2.5 rounded-xl font-bold shadow-sm cursor-pointer">
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
