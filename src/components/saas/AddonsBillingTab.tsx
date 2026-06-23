import React, { useState } from "react";
import { 
  Plus, Check, Trash2, Edit3, Shield, Layers, Layout, Map, Sliders, DollarSign, X, AlertTriangle, Play 
} from "lucide-react";
import { PlotBillingSlab, AddonCatalogItem } from "./SaasTypes.ts";

interface AddonsBillingTabProps {
  slabs: PlotBillingSlab[];
  addons: AddonCatalogItem[];
  onAddSlab: (slab: PlotBillingSlab) => void;
  onUpdateSlab: (id: string, updates: Partial<PlotBillingSlab>) => void;
  onDeleteSlab: (id: string) => void;
  onAddAddon: (addon: AddonCatalogItem) => void;
  onUpdateAddon: (code: string, updates: Partial<AddonCatalogItem>) => void;
  defaultTab?: "slabs" | "addons";
}

export default function AddonsBillingTab({
  slabs,
  addons,
  onAddSlab,
  onUpdateSlab,
  onDeleteSlab,
  onAddAddon,
  onUpdateAddon,
  defaultTab
}: AddonsBillingTabProps) {
  const [activeTab, setActiveTab] = useState<"slabs" | "addons">(defaultTab || "slabs");

  React.useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);
  const [showAddSlab, setShowAddSlab] = useState(false);
  const [showAddAddon, setShowAddAddon] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Forms state
  const [newSlab, setNewSlab] = useState({
    minPlots: 1, maxPlots: 50, monthlyPrice: 20, yearlyPrice: 200
  });

  const [newAddon, setNewAddon] = useState({
    name: "", code: "", monthlyPrice: 40, yearlyPrice: 400, description: ""
  });

  const handleCreateSlabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const min = Number(newSlab.minPlots);
    const max = Number(newSlab.maxPlots);
    if (min < 0 || max <= min) {
      setFormError("Plot thresholds are invalid. Maximum plots bound must exceed minimum plots boundary.");
      return;
    }

    onAddSlab({
      id: `slab_${Date.now()}`,
      minPlots: min,
      maxPlots: max,
      monthlyPrice: Number(newSlab.monthlyPrice),
      yearlyPrice: Number(newSlab.yearlyPrice),
      status: "ACTIVE"
    });

    setShowAddSlab(false);
    setNewSlab({ minPlots: 1, maxPlots: 50, monthlyPrice: 20, yearlyPrice: 200 });
  };

  const handleCreateAddonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newAddon.name || !newAddon.code) return;

    const codeUpper = newAddon.code.toUpperCase().trim().replace(/\s+/g, "_");
    if (addons.some(a => a.code === codeUpper)) {
      setFormError(`Addon code [${codeUpper}] already used inside catalog database.`);
      return;
    }

    onAddAddon({
      name: newAddon.name,
      code: codeUpper,
      monthlyPrice: Number(newAddon.monthlyPrice),
      yearlyPrice: Number(newAddon.yearlyPrice),
      status: "ACTIVE",
      description: newAddon.description
    });

    setShowAddAddon(false);
    setNewAddon({ name: "", code: "", monthlyPrice: 40, yearlyPrice: 400, description: "" });
  };

  return (
    <div className="space-y-6" id="addons-billing-tab-container">
      
      {activeTab === "slabs" ? (
        <div className="space-y-4 font-sans" id="slab-settings-view">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="space-y-0.5">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Plot-Capacity Billing Engine</h3>
              <p className="text-[11px] text-slate-500">Configure recurring transaction premiums applied proportionally based on the volume of physical plot records managed by tenant workspaces.</p>
            </div>
            <button
              onClick={() => { setFormError(null); setShowAddSlab(true); }}
              className="bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Slab Template
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-650">
                <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-bold text-center">
                  <tr>
                    <th className="px-5 py-3 text-left">Plot capacity scale range</th>
                    <th className="px-5 py-3">Monthly addition premium</th>
                    <th className="px-5 py-3">Yearly addition premium</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Operational Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-center">
                  {slabs.map(s => (
                    <tr key={s.id} className="hover:bg-slate-55/40 text-slate-800">
                      <td className="px-5 py-4 text-left font-sans font-bold text-slate-900">
                        ⚡ {s.minPlots} &mdash; {s.maxPlots === 99999 ? "500+ (Unlimited)" : `${s.maxPlots}`} plots
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center items-center gap-1">
                          <span className="text-slate-400 font-sans">₹</span>
                          <input 
                            type="number"
                            value={s.monthlyPrice}
                            onChange={(e) => onUpdateSlab(s.id, { monthlyPrice: Number(e.target.value) })}
                            className="w-20 bg-slate-50 border border-slate-200 rounded p-1 font-bold font-mono text-slate-800 text-center text-xs focus:bg-white focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center items-center gap-1">
                          <span className="text-slate-400 font-sans">₹</span>
                          <input 
                            type="number"
                            value={s.yearlyPrice}
                            onChange={(e) => onUpdateSlab(s.id, { yearlyPrice: Number(e.target.value) })}
                            className="w-20 bg-slate-50 border border-slate-200 rounded p-1 font-bold font-mono text-slate-800 text-center text-xs focus:bg-white focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => onUpdateSlab(s.id, { status: s.status === "ACTIVE" ? "DISABLED" : "ACTIVE" })}
                          className={`inline-block text-[9.5px] px-2 py-0.5 rounded-full font-bold font-sans ${
                            s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-red-50 text-red-800 border"
                          }`}
                        >
                          {s.status}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right font-sans">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => onUpdateSlab(s.id, {})}
                            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-805 rounded px-2 py-1 text-[10px] font-bold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Confirm deletion of this dynamic capacity tier slab?")) {
                                onDeleteSlab(s.id);
                              }
                            }}
                            className="text-red-650 hover:text-red-850 hover:underline text-[10px] font-bold border border-slate-200 rounded px-2 py-1"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4" id="addon-catalog-view">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="space-y-0.5">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Add-on Features Catalog</h3>
              <p className="text-[11px] text-slate-500">Provide modular extra-quota parameters, WhatsApp channels, or CAD/DXF parsers as billable addon switches.</p>
            </div>
            <button
              onClick={() => { setFormError(null); setShowAddAddon(true); }}
              className="bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Add-on Feature
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
            {addons.map(a => (
              <div key={a.code} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-xs hover:border-slate-350 transition-all">
                <div className="space-y-2">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-905">{a.name}</h4>
                      <p className="text-[9.5px] font-mono text-indigo-600 font-bold uppercase tracking-wider">code: {a.code}</p>
                    </div>
                    <button
                      onClick={() => onUpdateAddon(a.code, { status: a.status === "ACTIVE" ? "DISABLED" : "ACTIVE" })}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        a.status === "ACTIVE" ? "bg-emerald-50 text-emerald-805" : "bg-red-50 text-red-805"
                      }`}
                    >
                      {a.status}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">{a.description}</p>
                </div>

                 <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs gap-3">
                   <div className="flex gap-3">
                     <div>
                       <span className="text-[9px] text-slate-400 font-bold uppercase block">Monthly Fees (₹)</span>
                       <input 
                         type="number"
                         value={a.monthlyPrice}
                         onChange={(e) => onUpdateAddon(a.code, { monthlyPrice: Number(e.target.value) })}
                         className="w-16 bg-slate-50 border border-slate-200 rounded p-1 font-bold font-mono text-slate-800 text-center text-xs"
                       />
                     </div>
                     <div>
                       <span className="text-[9px] text-slate-400 font-bold uppercase block">Yearly Fees (₹)</span>
                       <input 
                         type="number"
                         value={a.yearlyPrice}
                         onChange={(e) => onUpdateAddon(a.code, { yearlyPrice: Number(e.target.value) })}
                         className="w-16 bg-slate-50 border border-slate-200 rounded p-1 font-bold font-mono text-slate-800 text-center text-xs"
                       />
                     </div>
                   </div>

                   <button
                     onClick={() => onUpdateAddon(a.code, {})} // Trigger save
                     className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg px-2.5 py-1.5 text-[10px] font-sans flex items-center gap-1 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                   >
                     <Check className="w-3 h-3" />
                     Save Add-on
                   </button>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Slab Dialog */}
      {showAddSlab && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 font-sans">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1">Add Billing Slab Capacity</h3>
              <button onClick={() => setShowAddSlab(false)} className="text-slate-400 hover:text-slate-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-155 text-red-650 rounded-lg text-xs flex items-center gap-1.5 font-sans">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSlabSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Minimum Plots</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={newSlab.minPlots}
                    onChange={(e) => setNewSlab({ ...newSlab, minPlots: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Maximum Plots</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={newSlab.maxPlots}
                    onChange={(e) => setNewSlab({ ...newSlab, maxPlots: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Monthly Cost (₹)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={newSlab.monthlyPrice}
                    onChange={(e) => setNewSlab({ ...newSlab, monthlyPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Yearly Cost (₹)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={newSlab.yearlyPrice}
                    onChange={(e) => setNewSlab({ ...newSlab, yearlyPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowAddSlab(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold">
                  Close
                </button>
                <button type="submit" className="flex-1 bg-indigo-650 hover:bg-indigo-750 text-white py-2.5 rounded-xl font-bold shadow-sm">
                  Catalog Slab Range
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Addon Dialog */}
      {showAddAddon && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 font-sans">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1">Register Custom Add-on Feature</h3>
              <button onClick={() => setShowAddAddon(false)} className="text-slate-400 hover:text-slate-950">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-155 text-red-650 rounded-lg text-xs flex items-center gap-1.5 font-sans">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAddonSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Addon Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Automated Twilio Telephony notifications"
                  value={newAddon.name}
                  onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Addon Code (unique)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. TWILIO_NOTIFY"
                    value={newAddon.code}
                    onChange={(e) => setNewAddon({ ...newAddon, code: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
                    className="col-span-2 w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Monthly Cost (₹)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={newAddon.monthlyPrice}
                    onChange={(e) => setNewAddon({ ...newAddon, monthlyPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Yearly Cost (₹)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={newAddon.yearlyPrice}
                    onChange={(e) => setNewAddon({ ...newAddon, yearlyPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Add-on Description</label>
                <textarea 
                  required
                  placeholder="Explain specialized resources, integrations, or quota limits expanded by this add-on package..."
                  value={newAddon.description}
                  onChange={(e) => setNewAddon({ ...newAddon, description: e.target.value })}
                  className="w-full h-16 bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowAddAddon(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold">
                  Close
                </button>
                <button type="submit" className="flex-1 bg-indigo-650 hover:bg-indigo-750 text-white py-2.5 rounded-xl font-bold shadow-sm">
                  Register Add-on
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
