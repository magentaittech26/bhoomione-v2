import React, { useState, useEffect } from "react";
import { 
  Database, Plus, Search, Trash2, Edit3, Check, X, Sliders, 
  Map, MapPin, Globe, Compass, RefreshCw, AlertTriangle, HelpCircle, 
  ChevronRight, ToggleLeft, ToggleRight, List, Info, FileText
} from "lucide-react";
import { api } from "../../lib/api.ts";

interface CoreMastersConsoleProps {
  onShowToast: (message: string, type: "success" | "error" | "info") => void;
}

interface CoreMasterItem {
  id: number;
  uuid: string;
  master_type: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  sort_order: number;
  is_platform_scope: boolean;
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
}

const MASTER_GROUPS = [
  {
    id: "GEOGRAPHY",
    label: "Geography Master",
    icon: Globe,
    description: "Hierarchical location data (States, Districts, Taluks, Cities, Villages, PIN Codes)",
    types: []
  },
  {
    id: "REAL_ESTATE",
    label: "Real Estate Masters",
    icon: Compass,
    description: "Standard layout and project reference data",
    types: [
      { code: "PROJECT_TYPE", label: "Project Types" },
      { code: "PROJECT_STATUS", label: "Project Statuses" },
      { code: "APPROVAL_STATUS", label: "Approval Statuses" },
      { code: "LAND_USE", label: "Land Uses" },
      { code: "FACING", label: "Facings" },
      { code: "ROAD_WIDTH_PRESET", label: "Road Width Presets" },
      { code: "AREA_UNIT", label: "Area Units" }
    ]
  },
  {
    id: "COMPLIANCE",
    label: "Compliance Masters",
    icon: Sliders,
    description: "Legal and regulatory compliance references",
    types: [
      { code: "APPROVAL_AUTHORITY", label: "Approval Authorities" }
    ]
  },
  {
    id: "CRM",
    label: "CRM Masters",
    icon: Info,
    description: "Lead pipelines and customer lifecycle states",
    types: [
      { code: "LEAD_SOURCE", label: "Lead Sources" },
      { code: "CUSTOMER_STATUS", label: "Customer Statuses" }
    ]
  },
  {
    id: "BILLING",
    label: "Billing Masters",
    icon: FileText,
    description: "Invoicing and taxation reference codes",
    types: [
      { code: "GST_TYPE", label: "GST Types" },
      { code: "PAYMENT_METHOD", label: "Payment Methods" }
    ]
  },
  {
    id: "PLOT",
    label: "Plot Masters",
    icon: MapPin,
    description: "Attributes and characteristics of plot assets",
    types: [
      { code: "CORNER_PLOT", label: "Corner Plots" },
      { code: "PLC_TYPE", label: "Preferred Location Charge Types" }
    ]
  },
  {
    id: "DOCUMENT",
    label: "Document Masters",
    icon: List,
    description: "KYC and legal verification document templates",
    types: [
      { code: "DOCUMENT_TYPE", label: "Document Types" }
    ]
  }
];

export const CoreMastersConsole: React.FC<CoreMastersConsoleProps> = ({ onShowToast }) => {
  const [activeGroup, setActiveGroup] = useState<string>("REAL_ESTATE");
  const [selectedType, setSelectedType] = useState<string>("PROJECT_TYPE");
  
  // Masters list states
  const [masters, setMasters] = useState<CoreMasterItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [includeInactive, setIncludeInactive] = useState<boolean>(true);

  // Geography Explorer state
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [taluks, setTaluks] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [pincodes, setPincodes] = useState<any[]>([]);

  const [selState, setSelState] = useState<string>("");
  const [selDistrict, setSelDistrict] = useState<string>("");
  const [selTaluk, setSelTaluk] = useState<string>("");
  const [selCity, setSelCity] = useState<string>("");
  const [selVillage, setSelVillage] = useState<string>("");

  const [loadingGeo, setLoadingGeo] = useState<Record<string, boolean>>({});

  // CRUD Dialog state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [editingItem, setEditingItem] = useState<CoreMasterItem | null>(null);

  // Form states
  const [formMasterType, setFormMasterType] = useState<string>("");
  const [formCode, setFormCode] = useState<string>("");
  const [formName, setFormName] = useState<string>("");
  const [formDesc, setFormDesc] = useState<string>("");
  const [formSortOrder, setFormSortOrder] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<string>("ACTIVE");
  const [formIsPlatform, setFormIsPlatform] = useState<boolean>(true);

  // Initialize and load
  useEffect(() => {
    if (activeGroup === "GEOGRAPHY") {
      loadStates();
    } else {
      const groupObj = MASTER_GROUPS.find(g => g.id === activeGroup);
      if (groupObj && groupObj.types.length > 0) {
        // Ensure selected type matches the active group's types
        const typeExists = groupObj.types.some(t => t.code === selectedType);
        if (!typeExists) {
          setSelectedType(groupObj.types[0].code);
          loadMasters(groupObj.types[0].code);
        } else {
          loadMasters(selectedType);
        }
      }
    }
  }, [activeGroup, selectedType, includeInactive]);

  const loadMasters = async (typeCode: string) => {
    setLoading(true);
    try {
      const response = await api.fetchCoreMasters({
        type: typeCode,
        include_inactive: includeInactive
      });
      setMasters(response.data || []);
    } catch (err) {
      console.error(err);
      onShowToast("Failed to fetch core master records.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Geography Loader Helpers
  const loadStates = async () => {
    setLoadingGeo(prev => ({ ...prev, states: true }));
    try {
      const res = await api.fetchCoreGeographyStates();
      setStates(res.data || []);
      // Reset dependent selections
      setDistricts([]);
      setTaluks([]);
      setCities([]);
      setVillages([]);
      setPincodes([]);
      setSelState("");
      setSelDistrict("");
      setSelTaluk("");
      setSelCity("");
      setSelVillage("");
    } catch (err) {
      console.error(err);
      onShowToast("Failed to load geography states.", "error");
    } finally {
      setLoadingGeo(prev => ({ ...prev, states: false }));
    }
  };

  const handleStateSelect = async (stateId: string) => {
    setSelState(stateId);
    setSelDistrict("");
    setSelTaluk("");
    setSelCity("");
    setSelVillage("");
    setDistricts([]);
    setTaluks([]);
    setCities([]);
    setVillages([]);
    setPincodes([]);

    if (!stateId) return;

    setLoadingGeo(prev => ({ ...prev, districts: true }));
    try {
      const res = await api.fetchCoreGeographyDistricts(stateId);
      setDistricts(res.data || []);
    } catch (err) {
      console.error(err);
      onShowToast("Failed to load districts.", "error");
    } finally {
      setLoadingGeo(prev => ({ ...prev, districts: false }));
    }
  };

  const handleDistrictSelect = async (districtId: string) => {
    setSelDistrict(districtId);
    setSelTaluk("");
    setSelCity("");
    setSelVillage("");
    setTaluks([]);
    setCities([]);
    setVillages([]);
    setPincodes([]);

    if (!districtId) return;

    setLoadingGeo(prev => ({ ...prev, taluks: true, cities: true }));
    try {
      const [talukRes, cityRes] = await Promise.all([
        api.fetchCoreGeographyTaluks(districtId),
        api.fetchCoreGeographyCities(districtId)
      ]);
      setTaluks(talukRes.data || []);
      setCities(cityRes.data || []);
    } catch (err) {
      console.error(err);
      onShowToast("Failed to load taluks or cities.", "error");
    } finally {
      setLoadingGeo(prev => ({ ...prev, taluks: false, cities: false }));
    }
  };

  const handleTalukSelect = async (talukId: string) => {
    setSelTaluk(talukId);
    setSelVillage("");
    setVillages([]);
    setPincodes([]);

    if (!talukId) return;

    setLoadingGeo(prev => ({ ...prev, villages: true }));
    try {
      const res = await api.fetchCoreGeographyVillages(talukId);
      setVillages(res.data || []);
    } catch (err) {
      console.error(err);
      onShowToast("Failed to load villages.", "error");
    } finally {
      setLoadingGeo(prev => ({ ...prev, villages: false }));
    }
  };

  const handleCitySelect = async (cityId: string) => {
    setSelCity(cityId);
    setPincodes([]);

    if (!cityId) return;

    setLoadingGeo(prev => ({ ...prev, pincodes: true }));
    try {
      const res = await api.fetchCoreGeographyPincodes(cityId, undefined);
      setPincodes(res.data || []);
    } catch (err) {
      console.error(err);
      onShowToast("Failed to load city pincodes.", "error");
    } finally {
      setLoadingGeo(prev => ({ ...prev, pincodes: false }));
    }
  };

  const handleVillageSelect = async (villageId: string) => {
    setSelVillage(villageId);
    setPincodes([]);

    if (!villageId) return;

    setLoadingGeo(prev => ({ ...prev, pincodes: true }));
    try {
      const res = await api.fetchCoreGeographyPincodes(undefined, villageId);
      setPincodes(res.data || []);
    } catch (err) {
      console.error(err);
      onShowToast("Failed to load village pincodes.", "error");
    } finally {
      setLoadingGeo(prev => ({ ...prev, pincodes: false }));
    }
  };

  // CRUD Handlers
  const handleOpenCreate = () => {
    setModalMode("CREATE");
    setEditingItem(null);
    setFormMasterType(selectedType);
    setFormCode("");
    setFormName("");
    setFormDesc("");
    setFormSortOrder(masters.length + 1);
    setFormStatus("ACTIVE");
    setFormIsPlatform(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CoreMasterItem) => {
    setModalMode("EDIT");
    setEditingItem(item);
    setFormMasterType(item.master_type);
    setFormCode(item.code);
    setFormName(item.name);
    setFormDesc(item.description || "");
    setFormSortOrder(item.sort_order);
    setFormStatus(item.status);
    setFormIsPlatform(item.is_platform_scope);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formMasterType || !formCode || !formName) {
      onShowToast("Please fill in all required fields.", "error");
      return;
    }

    const payload = {
      master_type: formMasterType,
      code: formCode,
      name: formName,
      description: formDesc || null,
      sort_order: parseInt(String(formSortOrder), 10) || 0,
      status: formStatus,
      is_platform_scope: formIsPlatform
    };

    try {
      if (modalMode === "CREATE") {
        await api.createCoreMaster(payload);
        onShowToast(`Core master '${formName}' created successfully.`, "success");
      } else if (editingItem) {
        await api.updateCoreMaster(editingItem.uuid, payload);
        onShowToast(`Core master '${formName}' updated successfully.`, "success");
      }
      setIsModalOpen(false);
      loadMasters(selectedType);
    } catch (err: any) {
      console.error(err);
      const msg = err.error || "Failed to persist master record.";
      onShowToast(msg, "error");
    }
  };

  const handleDelete = async (item: CoreMasterItem) => {
    if (!window.confirm(`Are you sure you want to delete core master '${item.name}'?`)) {
      return;
    }

    try {
      await api.deleteCoreMaster(item.uuid);
      onShowToast(`Core master '${item.name}' deleted successfully.`, "success");
      loadMasters(selectedType);
    } catch (err) {
      console.error(err);
      onShowToast("Failed to delete core master record.", "error");
    }
  };

  // Filter list by search query
  const filteredMasters = masters.filter(m => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      (m.description && m.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Core Masters Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Centrally register and distribute reusable reference masters across all BhoomiOne system applications.
          </p>
        </div>

        {activeGroup !== "GEOGRAPHY" && (
          <button
            id="btn-create-core-master"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Master Record
          </button>
        )}
      </div>

      {/* Main Core Groups Sidebar & Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar Groups Navigation */}
        <div className="space-y-3 lg:col-span-1" id="core-masters-groups-sidebar">
          <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-2">Master Domains</p>
          <div className="space-y-1">
            {MASTER_GROUPS.map((group) => {
              const Icon = group.icon;
              const isActive = activeGroup === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => {
                    setActiveGroup(group.id);
                    if (group.types.length > 0) {
                      setSelectedType(group.types[0].code);
                    }
                  }}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all border ${
                    isActive 
                      ? "bg-indigo-50/70 border-indigo-200 text-indigo-900 shadow-xs" 
                      : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold">{group.label}</p>
                    <p className="text-[10px] text-slate-400 leading-normal">{group.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content panel */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* If GEOGRAPHY is Active */}
          {activeGroup === "GEOGRAPHY" ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Globe className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold text-slate-800 uppercase">Hierarchical Geography Explorer</h3>
              </div>

              {/* Cascade select dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* States Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>1. State / Province</span>
                    {loadingGeo.states && <span className="text-[9px] text-indigo-500 animate-pulse font-semibold">Loading...</span>}
                  </label>
                  <select
                    id="geo-state-select"
                    value={selState}
                    onChange={(e) => handleStateSelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Select State --</option>
                    {states.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                {/* Districts Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>2. District</span>
                    {loadingGeo.districts && <span className="text-[9px] text-indigo-500 animate-pulse font-semibold">Loading...</span>}
                  </label>
                  <select
                    id="geo-district-select"
                    value={selDistrict}
                    disabled={!selState}
                    onChange={(e) => handleDistrictSelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 disabled:opacity-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Select District --</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Taluk Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>3. Taluk / Tehsil</span>
                    {loadingGeo.taluks && <span className="text-[9px] text-indigo-500 animate-pulse font-semibold">Loading...</span>}
                  </label>
                  <select
                    id="geo-taluk-select"
                    value={selTaluk}
                    disabled={!selDistrict}
                    onChange={(e) => handleTalukSelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 disabled:opacity-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Select Taluk --</option>
                    {taluks.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Cities Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>4a. City / Town (Branch)</span>
                    {loadingGeo.cities && <span className="text-[9px] text-indigo-500 animate-pulse font-semibold">Loading...</span>}
                  </label>
                  <select
                    id="geo-city-select"
                    value={selCity}
                    disabled={!selDistrict}
                    onChange={(e) => handleCitySelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 disabled:opacity-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Select City/Town --</option>
                    {cities.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Villages Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>4b. Village / Locality</span>
                    {loadingGeo.villages && <span className="text-[9px] text-indigo-500 animate-pulse font-semibold">Loading...</span>}
                  </label>
                  <select
                    id="geo-village-select"
                    value={selVillage}
                    disabled={!selTaluk}
                    onChange={(e) => handleVillageSelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 disabled:opacity-50 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Select Village --</option>
                    {villages.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Resolved PIN codes */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-150">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  PIN Codes Associated ({pincodes.length})
                </div>
                {pincodes.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">No PIN codes loaded. Select a City/Town or Village to resolve active PIN codes.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {pincodes.map(p => (
                      <span key={p.id} className="inline-flex items-center px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-semibold text-slate-700 shadow-2xs font-mono">
                        {p.pincode}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Otherwise, Standard Core Masters management */
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              
              {/* Table header / Filter toolbar */}
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <select
                    id="core-master-type-select"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none shrink-0 shadow-2xs"
                  >
                    {MASTER_GROUPS.find(g => g.id === activeGroup)?.types.map(t => (
                      <option key={t.code} value={t.code}>{t.label}</option>
                    ))}
                  </select>

                  <label className="inline-flex items-center gap-1.5 cursor-pointer select-none pl-2">
                    <input
                      type="checkbox"
                      checked={includeInactive}
                      onChange={(e) => setIncludeInactive(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Show Inactive</span>
                  </label>
                </div>

                <div className="relative flex-1 max-w-xs self-end sm:self-auto">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search master record..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Master list items */}
              {loading ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                  <p className="text-xs font-medium">Fetching master elements...</p>
                </div>
              ) : filteredMasters.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-1 border-b border-slate-100">
                  <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No Master Records Found</p>
                  <p className="text-[10px] text-slate-400 max-w-sm mx-auto">There are no master data entries registered or matching your search within this category scope.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left" id="core-masters-data-table">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Sort</th>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Display Name</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Scope</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {filteredMasters.map((row) => (
                        <tr key={row.uuid} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-400">{row.sort_order}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 tracking-wide">{row.code}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">{row.name}</td>
                          <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={row.description || ""}>
                            {row.description || <span className="text-slate-300 italic">No description</span>}
                          </td>
                          <td className="py-3.5 px-4">
                            {row.is_platform_scope ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-100 uppercase">Platform</span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase">Tenant</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {row.status === "ACTIVE" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenEdit(row)}
                              title="Edit master item"
                              className="inline-flex items-center justify-center p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(row)}
                              title="Soft delete master item"
                              className="inline-flex items-center justify-center p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* CRUD Creation/Modification Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden font-sans animate-scaleUp">
            
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-500" />
                {modalMode === "CREATE" ? "New Core Master Item" : "Modify Core Master Item"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Category/Type */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Group / Type</label>
                  <select
                    value={formMasterType}
                    disabled={modalMode === "EDIT"}
                    onChange={(e) => setFormMasterType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 disabled:opacity-50 focus:outline-none"
                  >
                    {MASTER_GROUPS.flatMap(g => g.types).map(t => (
                      <option key={t.code} value={t.code}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Scope */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scope</label>
                  <select
                    value={formIsPlatform ? "PLATFORM" : "TENANT"}
                    onChange={(e) => setFormIsPlatform(e.target.value === "PLATFORM")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="PLATFORM">Global Platform</option>
                    <option value="TENANT">Tenant Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Code */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RES_VILLA"
                    value={formCode}
                    disabled={modalMode === "EDIT"}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 disabled:opacity-50 font-mono uppercase focus:outline-none"
                  />
                </div>

                {/* Sort Order */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort Order</label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Luxury Villa"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Provide reference details or purpose..."
                  value={formDesc}
                  rows={2}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none resize-none"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Publish Status</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="formStatus"
                      value="ACTIVE"
                      checked={formStatus === "ACTIVE"}
                      onChange={() => setFormStatus("ACTIVE")}
                      className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Active</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="radio"
                      name="formStatus"
                      value="INACTIVE"
                      checked={formStatus === "INACTIVE"}
                      onChange={() => setFormStatus("INACTIVE")}
                      className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
                >
                  {modalMode === "CREATE" ? "Create Record" : "Save Changes"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
