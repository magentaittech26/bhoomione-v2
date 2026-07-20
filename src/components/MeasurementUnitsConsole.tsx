import React, { useState, useEffect } from "react";
import { useMeasurementUnits } from "../hooks/useMeasurementUnits.ts";
import { MeasurementUnitService } from "../lib/MeasurementUnitService.ts";
import { MeasurementUnit } from "../types/measurement-unit.ts";
import { UserProfile } from "../types/auth.ts";
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  Table as TableIcon, 
  Download, 
  Trash2, 
  Edit3, 
  ToggleLeft, 
  ToggleRight, 
  RefreshCw, 
  Scale, 
  Globe2, 
  FileJson, 
  FileSpreadsheet, 
  AlertTriangle,
  X,
  Check,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MeasurementUnitsConsoleProps {
  user: UserProfile;
}

export default function MeasurementUnitsConsole({ user }: MeasurementUnitsConsoleProps) {
  const { units, loading, error, refresh } = useMeasurementUnits({ refresh: false });
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"card" | "grid">("card");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<MeasurementUnit | null>(null);
  const [formData, setFormData] = useState<Partial<MeasurementUnit>>({
    code: "",
    name: "",
    display_name: "",
    symbol: "",
    short_code: "",
    measurement_type: "Area",
    conversion_factor: 1.0,
    base_unit: "SQFT",
    precision: 2,
    decimal_places: 2,
    display_order: 0,
    is_metric: false,
    is_default: false,
    is_system: false,
    is_active: true,
    country_code: "",
    state_code: "",
    tenant_override_allowed: true,
    description: ""
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Drawer state
  const [drawerUnit, setDrawerUnit] = useState<MeasurementUnit | null>(null);

  // RBAC permissions helper
  const roleUpper = user.role ? user.role.toUpperCase() : "";
  const hasWriteAccess = ["DEVELOPER_OWNER", "DEVELOPER_ADMIN", "PLATFORM_ADMIN", "TENANT_OWNER", "TENANT_ADMIN", "OWNER", "ADMIN"].includes(roleUpper);

  // Live filter results
  const filteredUnits = units.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.code.toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name && u.display_name.toLowerCase().includes(search.toLowerCase())) ||
      (u.symbol && u.symbol.toLowerCase().includes(search.toLowerCase()));
    
    const matchesType = filterType === "all" || u.measurement_type === filterType;
    
    const matchesActive = 
      filterActive === "all" || 
      (filterActive === "active" && u.is_active) || 
      (filterActive === "inactive" && !u.is_active);

    return matchesSearch && matchesType && matchesActive;
  });

  // Export options
  const exportToJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredUnits, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `BhoomiOne_MeasurementUnits_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportToCSV = () => {
    const headers = [
      "ID", "Code", "Name", "Display Name", "Symbol", "Short Code", "Type", 
      "Conversion Factor", "Base Unit", "Precision", "Decimal Places", "Order", 
      "Is Metric", "Is Default", "Is System", "Is Active", "Country", "State", "Description"
    ];

    const rows = filteredUnits.map(u => [
      u.id,
      u.code,
      u.name,
      u.display_name || u.name,
      u.symbol || "",
      u.short_code || u.code,
      u.measurement_type || "Area",
      u.conversion_factor,
      u.base_unit || "SQFT",
      u.precision || 2,
      u.decimal_places || 2,
      u.display_order || 0,
      u.is_metric ? "TRUE" : "FALSE",
      u.is_default ? "TRUE" : "FALSE",
      u.is_system ? "TRUE" : "FALSE",
      u.is_active ? "TRUE" : "FALSE",
      u.country_code || "",
      u.state_code || "",
      u.description || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `BhoomiOne_MeasurementUnits_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Toggle active state
  const handleToggleActive = async (unit: MeasurementUnit) => {
    if (!hasWriteAccess) return;
    try {
      await MeasurementUnitService.update(unit.id, { is_active: !unit.is_active });
      refresh();
    } catch (err: any) {
      console.error("Failed to toggle active state:", err);
    }
  };

  // Soft delete unit
  const handleDeleteUnit = async (id: string) => {
    if (!hasWriteAccess) return;
    if (!window.confirm("Are you sure you want to soft-delete this measurement unit? This will revoke it platform-wide.")) return;
    try {
      await MeasurementUnitService.delete(id);
      refresh();
    } catch (err: any) {
      console.error("Failed to soft-delete measurement unit:", err);
    }
  };

  // Open create modal
  const handleOpenCreate = () => {
    setSelectedUnit(null);
    setFormData({
      code: "",
      name: "",
      display_name: "",
      symbol: "",
      short_code: "",
      measurement_type: "Area",
      conversion_factor: 1.0,
      base_unit: "SQFT",
      precision: 2,
      decimal_places: 2,
      display_order: 0,
      is_metric: false,
      is_default: false,
      is_system: false,
      is_active: true,
      country_code: "",
      state_code: "",
      tenant_override_allowed: true,
      description: ""
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (unit: MeasurementUnit) => {
    setSelectedUnit(unit);
    setFormData({
      ...unit,
      country_code: unit.country_code || "",
      state_code: unit.state_code || "",
      description: unit.description || ""
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Form submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasWriteAccess) return;
    
    // Live validation
    if (!formData.code || !formData.code.trim()) {
      setFormError("Validation Error: Code is required.");
      return;
    }
    if (!formData.name || !formData.name.trim()) {
      setFormError("Validation Error: Name is required.");
      return;
    }
    if (formData.conversion_factor === undefined || isNaN(Number(formData.conversion_factor)) || Number(formData.conversion_factor) <= 0) {
      setFormError("Validation Error: Conversion Factor must be a positive number.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (selectedUnit) {
        await MeasurementUnitService.update(selectedUnit.id, formData);
      } else {
        await MeasurementUnitService.create(formData);
      }
      setIsModalOpen(false);
      refresh();
    } catch (err: any) {
      setFormError(err.message || "Failed to save measurement unit. Please verify code is unique.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" id="measurement-units-console">
      {/* Upper Title and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200/85 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-mono font-bold uppercase mb-2">
            <Scale className="w-3.5 h-3.5" />
            <span>Platform Master Data Management</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
            Measurement Units Registry
          </h2>
          <p className="text-xs text-slate-500 max-w-xl mt-1">
            System-wide standards governing land measurement units, decimal places, and automatic mathematical area conversion multipliers.
          </p>
        </div>

        {hasWriteAccess && (
          <button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
            id="create-unit-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Create Master Unit</span>
          </button>
        )}
      </div>

      {/* Filter and View Toggles Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, symbol..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
            id="search-units-input"
          />
        </div>

        {/* Multi Filters and view controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent font-medium focus:outline-none text-[11px] cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="Area">Area</option>
              <option value="Length">Length</option>
              <option value="Volume">Volume</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="bg-transparent font-medium focus:outline-none text-[11px] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <button
            onClick={refresh}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition-all cursor-pointer"
            title="Reload Registry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Export Actions dropdown/buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={exportToCSV}
              className="p-1.5 text-slate-650 hover:text-slate-900 hover:bg-white rounded-lg transition-all text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              title="Export CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              onClick={exportToJSON}
              className="p-1.5 text-slate-650 hover:text-slate-900 hover:bg-white rounded-lg transition-all text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              title="Export JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">JSON</span>
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex bg-slate-100 p-0.5 border border-slate-200 rounded-xl">
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-lg cursor-pointer transition-all ${viewMode === "card" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-400 hover:text-slate-650"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg cursor-pointer transition-all ${viewMode === "grid" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-400 hover:text-slate-650"}`}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Registry View */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-xs flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-mono">Querying multi-tenant database registry...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center text-rose-800 space-y-2">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <h4 className="text-sm font-bold">Failed to load Measurement Standards</h4>
          <p className="text-xs max-w-md mx-auto">{error}</p>
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-500 shadow-xs space-y-3">
          <Scale className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-800 font-sans">No Units Match Selection</h4>
          <p className="text-xs max-w-sm mx-auto leading-relaxed">
            Modify search constraints or create a new Standard Measurement Unit definition to populate the platform subsystem.
          </p>
        </div>
      ) : viewMode === "card" ? (
        // Grid Card Layout
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="units-card-view">
          {filteredUnits.map((u) => (
            <motion.div
              key={u.id}
              layoutId={`card-${u.id}`}
              className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all relative overflow-hidden flex flex-col justify-between ${
                u.is_active ? "border-slate-200" : "border-slate-200 bg-slate-50/50 opacity-75"
              }`}
            >
              {/* Top Banner details */}
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded-lg">
                      {u.code}
                    </span>
                    {u.is_default && (
                      <span className="bg-emerald-50 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-emerald-200">
                        Default
                      </span>
                    )}
                    {u.is_system && (
                      <span className="bg-blue-50 text-blue-800 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-blue-200">
                        System
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{u.name}</h3>
                  {u.display_name && u.display_name !== u.name && (
                    <p className="text-[11px] text-slate-500">{u.display_name}</p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xl font-bold text-slate-850 block font-mono">{u.symbol || "—"}</span>
                  <span className="text-[10px] text-slate-400 font-mono tracking-wider block">{u.short_code || u.code}</span>
                </div>
              </div>

              {/* Conversion values */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 mb-4 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Measurement Type:</span>
                  <span className="font-semibold text-slate-800">{u.measurement_type || "Area"}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Conversion to {u.base_unit || "SQFT"}:</span>
                  <span className="font-bold text-slate-900">{Number(u.conversion_factor).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Decimal Places:</span>
                  <span className="font-semibold text-slate-700">{u.decimal_places ?? 2}</span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                {/* Active Toggle status */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleActive(u)}
                    disabled={!hasWriteAccess}
                    className={`transition-colors cursor-pointer disabled:opacity-50 ${u.is_active ? "text-emerald-600 hover:text-emerald-700" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    {u.is_active ? (
                      <ToggleRight className="w-7 h-7" />
                    ) : (
                      <ToggleLeft className="w-7 h-7" />
                    )}
                  </button>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {u.is_active ? "Active" : "Deactivated"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDrawerUnit(u)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                    title="View details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {hasWriteAccess && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                        title="Edit Definition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUnit(u.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                        title="Soft Delete Standard"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        // Grid Table View
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs" id="units-table-view">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-450 border-b border-slate-200 font-semibold uppercase tracking-wider font-mono">
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Standard Name</th>
                  <th className="px-5 py-3.5">Symbol</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5 text-right">Conversion Factor (SQFT)</th>
                  <th className="px-5 py-3.5 text-center">Decimals</th>
                  <th className="px-5 py-3.5 text-center">System</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredUnits.map((u) => (
                  <tr 
                    key={u.id}
                    className={`hover:bg-slate-50/50 transition-colors ${u.is_active ? "" : "bg-slate-50/20 text-slate-450 opacity-75"}`}
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{u.code}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      <div>
                        {u.name}
                        {u.is_default && (
                          <span className="ml-2 inline-flex bg-emerald-50 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded-full font-bold font-mono">DEFAULT</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">{u.symbol || "—"}</td>
                    <td className="px-5 py-3.5 text-slate-500">{u.measurement_type || "Area"}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                      {Number(u.conversion_factor).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono text-slate-600">{u.decimal_places ?? 2}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold ${u.is_system ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                        {u.is_system ? "System" : "Tenant"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${u.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDrawerUnit(u)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {hasWriteAccess && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUnit(u.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="unit-modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedUnit ? `Edit Unit: ${selectedUnit.code}` : "Create Standard Measurement Unit"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
                </button>
              </div>

              {/* Form container */}
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs" id="unit-form">
                {formError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium leading-relaxed">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Unique Unit Code *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      disabled={!!selectedUnit}
                      placeholder="e.g. SQFT"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Standard Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value, display_name: formData.display_name ? formData.display_name : e.target.value })}
                      placeholder="e.g. Square Feet"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Display Name</label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="e.g. Square Feet"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Symbol</label>
                      <input
                        type="text"
                        value={formData.symbol}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                        placeholder="e.g. sqft"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Short Code</label>
                      <input
                        type="text"
                        value={formData.short_code}
                        onChange={(e) => setFormData({ ...formData, short_code: e.target.value })}
                        placeholder="e.g. SQFT"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Measurement Type</label>
                    <select
                      value={formData.measurement_type}
                      onChange={(e) => setFormData({ ...formData, measurement_type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                    >
                      <option value="Area">Area</option>
                      <option value="Length">Length</option>
                      <option value="Volume">Volume</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Conversion Factor (To SQFT) *</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.conversion_factor}
                      onChange={(e) => setFormData({ ...formData, conversion_factor: Number(e.target.value) })}
                      placeholder="e.g. 1.0"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Precision</label>
                    <input
                      type="number"
                      value={formData.precision}
                      onChange={(e) => setFormData({ ...formData, precision: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Decimals</label>
                    <input
                      type="number"
                      value={formData.decimal_places}
                      onChange={(e) => setFormData({ ...formData, decimal_places: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Display Order</label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Country Code</label>
                    <input
                      type="text"
                      value={formData.country_code}
                      onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                      placeholder="e.g. IN"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">State Code</label>
                    <input
                      type="text"
                      value={formData.state_code}
                      onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                      placeholder="e.g. KA"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_metric}
                      onChange={(e) => setFormData({ ...formData, is_metric: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-700">Is Metric System</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-700">System Default Unit</span>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Standard Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide standard documentation details for this geographic measurement module..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white h-20 resize-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-150 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {isSubmitting ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{selectedUnit ? "Save Changes" : "Create Definition"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Drawer overlay */}
      <AnimatePresence>
        {drawerUnit && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex justify-end z-50" id="unit-drawer-overlay">
            <motion.div
              initial={{ x: "100%", opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white max-w-md w-full h-full shadow-2xl border-l border-slate-250 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase font-mono tracking-wider">Unit Specifications</h3>
                </div>
                <button
                  onClick={() => setDrawerUnit(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Specifications Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                <div className="space-y-1 text-center py-4 bg-slate-50 border border-slate-150 rounded-2xl">
                  <p className="text-[26px] font-extrabold text-slate-900 font-mono tracking-tight">{drawerUnit.symbol || "—"}</p>
                  <p className="font-semibold text-slate-750 uppercase tracking-widest text-[10px]">{drawerUnit.name}</p>
                  <p className="font-mono text-slate-400 text-[10px]">ID: {drawerUnit.id}</p>
                </div>

                <div className="space-y-3.5">
                  <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider text-[10px]">Multi-tenant Metadata</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Unique Code</span>
                      <span className="font-mono font-bold text-slate-800">{drawerUnit.code}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Measurement Type</span>
                      <span className="font-semibold text-slate-800">{drawerUnit.measurement_type || "Area"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Conversion Ratio</span>
                      <span className="font-mono font-bold text-slate-900">{Number(drawerUnit.conversion_factor).toLocaleString()}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Base Scale Unit</span>
                      <span className="font-mono font-semibold text-slate-800">{drawerUnit.base_unit || "SQFT"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Decimals</span>
                      <span className="font-mono font-semibold text-slate-800">{drawerUnit.decimal_places ?? 2}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Precision</span>
                      <span className="font-mono font-semibold text-slate-800">{drawerUnit.precision ?? 2}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Display Order</span>
                      <span className="font-mono font-semibold text-slate-800">{drawerUnit.display_order ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5 pt-2">
                  <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider text-[10px]">Governance Policy</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Is Metric System</span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${drawerUnit.is_metric ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {drawerUnit.is_metric ? "METRIC" : "IMPERIAL"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Platform Standard</span>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${drawerUnit.is_system ? "bg-indigo-50 text-indigo-700" : "bg-purple-50 text-purple-700"}`}>
                        {drawerUnit.is_system ? "SYSTEM MASTER" : "TENANT CUSTOM"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Tenant Override</span>
                      <span className="font-semibold text-slate-700">
                        {drawerUnit.tenant_override_allowed ? "Allowed" : "Forbidden"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 block font-semibold text-[10px] uppercase">Country &amp; State scope</span>
                      <span className="font-mono font-semibold text-slate-755 flex items-center gap-1 text-slate-700">
                        <Globe2 className="w-3.5 h-3.5 text-slate-400" />
                        {drawerUnit.country_code || "IN"}-{drawerUnit.state_code || "ALL"}
                      </span>
                    </div>
                  </div>
                </div>

                {drawerUnit.description && (
                  <div className="space-y-2 pt-2">
                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider text-[10px]">Standard Documentation</h4>
                    <p className="text-slate-600 bg-slate-50/70 border border-slate-150 p-3 rounded-xl leading-relaxed text-xs">
                      {drawerUnit.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-slate-150 bg-slate-50 flex gap-3">
                <button
                  onClick={() => setDrawerUnit(null)}
                  className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer text-center"
                >
                  Close Specification
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
