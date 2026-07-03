import React, { useState, useEffect } from "react";
import { 
  Percent, FileText, Plus, Trash2, Edit2, Calculator, TrendingUp, Calendar, 
  Building2, RefreshCw, CheckCircle2, AlertCircle, Info, MapPin, Sparkles, 
  TrendingDown, Check, X, CreditCard, ChevronRight, BarChart3, Database
} from "lucide-react";
import { api } from "../../lib/api";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

interface TaxRule {
  id?: string;
  tenant_id: string | null;
  tenant_name?: string;
  tax_type: "CGST" | "SGST" | "IGST" | "TDS" | "STAMP_DUTY" | "REGISTRATION" | "OTHER";
  name: string;
  rate_percentage: number;
  state_code: string;
  effective_from: string;
  is_active: boolean;
  created_at?: string;
  effective_to?: string | null;
  is_default?: boolean;
  builder_name?: string | null;
  amount_type?: "percentage" | "fixed";
  fixed_amount?: number;
}

interface TaxTransaction {
  id: string;
  tenant_id: string;
  tenant_name?: string;
  invoice_number: string;
  customer_name: string;
  state_code: string;
  base_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  tds_amount: number;
  stamp_duty_amount: number;
  registration_charges: number;
  other_charges: number;
  total_tax_amount: number;
  total_invoice_amount: number;
  created_at: string;
}

interface EnterpriseTaxConsoleProps {
  onShowToast: (message: string, type: "success" | "error") => void;
}

const INDIAN_STATES = [
  { code: "ALL", name: "ALL States (Interstate / Default)" },
  { code: "KA", name: "Karnataka" },
  { code: "MH", name: "Maharashtra" },
  { code: "HR", name: "Haryana" },
  { code: "DL", name: "Delhi" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TS", name: "Telangana" },
  { code: "AP", name: "Andhra Pradesh" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "GJ", name: "Gujarat" }
];

const TAX_TYPES = [
  { value: "CGST", label: "CGST (Central GST)" },
  { value: "SGST", label: "SGST (State GST)" },
  { value: "IGST", label: "IGST (Integrated GST)" },
  { value: "TDS", label: "TDS (Tax Deducted at Source - Sec 194IA)" },
  { value: "STAMP_DUTY", label: "Stamp Duty (State levy on transfer)" },
  { value: "REGISTRATION", label: "Registration Charges" },
  { value: "OTHER", label: "Other Configurable Surcharges" }
];

const COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export const EnterpriseTaxConsole: React.FC<EnterpriseTaxConsoleProps> = ({ onShowToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<"rules" | "calculator" | "ledger" | "analytics">("rules");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [ledger, setLedger] = useState<TaxTransaction[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Filter/Select state
  const [stateFilter, setStateFilter] = useState<string>("ALL");
  const [builderFilter, setBuilderFilter] = useState<string>("ALL");

  // Rule Form state
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<Partial<TaxRule> | null>(null);

  // Calculator inputs
  const [calcBaseAmount, setCalcBaseAmount] = useState<number>(5000000); // 50 Lakhs Default
  const [calcCustomerState, setCalcCustomerState] = useState<string>("KA");
  const [calcBuilderState, setCalcBuilderState] = useState<string>("KA");
  const [calcTenantId, setCalcTenantId] = useState<string>("11111111-1111-4111-8111-111111111111"); // Bhoomi Developer Corp ID
  const [calcResults, setCalcResults] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState<boolean>(false);

  // Invoice generator inputs
  const [invoicePrefix, setInvoicePrefix] = useState<string>("BHOOMI-INV-");
  const [invoiceNumberSuffix, setInvoiceNumberSuffix] = useState<number>(101);
  const [customerName, setCustomerName] = useState<string>("Deepak Gowda");
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<boolean>(false);

  useEffect(() => {
    loadTaxConsoleData();
  }, []);

  const loadTaxConsoleData = async () => {
    setLoading(true);
    try {
      const rData = await api.fetchTaxRules();
      setRules(rData);

      const reportData = await api.fetchTaxReports();
      setAnalytics(reportData);
      if (reportData && reportData.transactions) {
        setLedger(reportData.transactions);
      }
    } catch (err: any) {
      console.error("Error loading tax configurations:", err);
      onShowToast("Failed to retrieve tax schemas and statistics.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Trigger calculator preview automatically when parameters shift
  useEffect(() => {
    if (activeSubTab === "calculator") {
      triggerCalculation();
    }
  }, [calcBaseAmount, calcCustomerState, calcBuilderState, calcTenantId, activeSubTab]);

  const triggerCalculation = async () => {
    if (!calcBaseAmount || calcBaseAmount <= 0) return;
    setCalcLoading(true);
    try {
      const res = await api.calculateTax({
        baseAmount: calcBaseAmount,
        customerState: calcCustomerState,
        builderState: calcBuilderState,
        tenantId: calcTenantId !== "NONE" ? calcTenantId : undefined
      });
      if (res.success) {
        setCalcResults(res.breakdown);
      }
    } catch (err) {
      console.error("Calculation failed:", err);
    } finally {
      setCalcLoading(false);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule?.tax_type || !editingRule?.name || !editingRule?.state_code) {
      onShowToast("Please enter all required tax rule properties.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: editingRule.id,
        tenantId: editingRule.tenant_id || null,
        taxType: editingRule.tax_type,
        name: editingRule.name,
        ratePercentage: Number(editingRule.rate_percentage || 0),
        stateCode: editingRule.state_code,
        effectiveFrom: editingRule.effective_from || new Date().toISOString().split("T")[0],
        isActive: editingRule.is_active !== undefined ? !!editingRule.is_active : true,
        effectiveTo: editingRule.effective_to || null,
        isDefault: editingRule.is_default !== undefined ? !!editingRule.is_default : false,
        builderName: editingRule.builder_name || null,
        amountType: editingRule.amount_type || "percentage",
        fixedAmount: editingRule.fixed_amount !== undefined ? Number(editingRule.fixed_amount) : 0,
      };

      const res = await api.saveTaxRule(payload);
      if (res.success) {
        onShowToast(editingRule.id ? "Tax rule revised successfully." : "New state tax rule registered.", "success");
        setShowRuleModal(false);
        setEditingRule(null);
        await loadTaxConsoleData();
      }
    } catch (err: any) {
      console.error("Failed to save tax rule:", err);
      onShowToast(err.message || "Failed to commit tax rule changes.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this state-wise tax rule? Current integrations using this profile will rollback to default settings.")) return;
    try {
      const res = await api.deleteTaxRule(id);
      if (res.success) {
        onShowToast("Tax rule removed successfully.", "success");
        await loadTaxConsoleData();
      }
    } catch (err) {
      console.error("Delete failed:", err);
      onShowToast("Failed to delete tax rule.", "error");
    }
  };

  const handleGenerateInvoice = async () => {
    if (!calcResults) return;
    setIsGeneratingInvoice(true);
    try {
      const finalInvoiceNumber = `${invoicePrefix}${invoiceNumberSuffix}`;
      
      const payload = {
        tenantId: calcTenantId !== "NONE" ? calcTenantId : "11111111-1111-4111-8111-111111111111",
        invoiceNumber: finalInvoiceNumber,
        customerName: customerName,
        stateCode: calcCustomerState,
        baseAmount: calcResults.baseAmount,
        cgstAmount: calcResults.taxes.find((t: any) => t.type === "CGST")?.amount || 0,
        sgstAmount: calcResults.taxes.find((t: any) => t.type === "SGST")?.amount || 0,
        igstAmount: calcResults.taxes.find((t: any) => t.type === "IGST")?.amount || 0,
        tdsAmount: calcResults.taxes.find((t: any) => t.type === "TDS")?.amount || 0,
        stampDutyAmount: calcResults.taxes.find((t: any) => t.type === "STAMP_DUTY")?.amount || 0,
        registrationCharges: calcResults.taxes.find((t: any) => t.type === "REGISTRATION")?.amount || 0,
        otherCharges: calcResults.taxes.find((t: any) => t.type === "OTHER")?.amount || 0,
        totalTaxAmount: calcResults.totalTaxAmount,
        totalInvoiceAmount: calcResults.totalInvoiceAmount
      };

      const res = await api.recordTaxInvoice(payload);
      if (res.success) {
        onShowToast(`Invoice ${finalInvoiceNumber} with tax breakdown compiled and recorded!`, "success");
        setInvoiceNumberSuffix(prev => prev + 1);
        await loadTaxConsoleData();
        setActiveSubTab("ledger"); // switch to ledger logs to see it
      }
    } catch (err) {
      console.error("Failed to generate tax invoice:", err);
      onShowToast("Invoice integration error.", "error");
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const getRuleRowStyle = (rule: TaxRule) => {
    if (rule.tenant_id) return "bg-indigo-50/40 hover:bg-indigo-50 border-l-4 border-indigo-500";
    return "bg-white hover:bg-slate-50";
  };

  // Filtered Rules
  const filteredRules = rules.filter(r => {
    const matchesState = stateFilter === "ALL" || r.state_code === stateFilter;
    const matchesBuilder = builderFilter === "ALL" 
      || (builderFilter === "OVERRIDE" && r.tenant_id !== null)
      || (builderFilter === "DEFAULT" && r.tenant_id === null);
    return matchesState && matchesBuilder;
  });

  return (
    <div className="space-y-6" id="enterprise-tax-console">
      {/* Header Info Panel */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-4 select-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 text-[9px] font-black tracking-widest uppercase border border-indigo-500/30 px-2 py-0.5 rounded-full">Compliance Module v2.4</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black tracking-widest uppercase border border-emerald-500/30 px-2 py-0.5 rounded-full">Real-time sync</span>
          </div>
          <h2 className="text-lg font-black tracking-tight uppercase">Enterprise GST & Tax Configuration Console</h2>
          <p className="text-xs text-indigo-200 leading-relaxed max-w-2xl">
            Administer state-wise tax bands, builder override concessions, stamp duties, and registration charges dynamically. Supports automated multi-state tax splitting and compliance logging.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadTaxConsoleData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer text-indigo-300"
            title="Refresh database telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button 
            onClick={() => {
              setEditingRule({
                tenant_id: null,
                tax_type: "CGST",
                name: "",
                rate_percentage: 0,
                state_code: "ALL",
                effective_from: new Date().toISOString().split("T")[0],
                effective_to: "",
                is_active: true,
                is_default: false,
                builder_name: "",
                amount_type: "percentage",
                fixed_amount: 0
              });
              setShowRuleModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-500 shadow-lg shadow-indigo-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>New Tax Rule</span>
          </button>
        </div>
      </div>

      {/* Primary Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-1 select-none">
        <button 
          onClick={() => setActiveSubTab("rules")}
          className={`px-5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === "rules" ? "border-indigo-600 text-indigo-600 font-black" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>GST Rules Engine</span>
        </button>
        <button 
          onClick={() => setActiveSubTab("calculator")}
          className={`px-5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === "calculator" ? "border-indigo-600 text-indigo-600 font-black" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Real-time Calculator</span>
        </button>
        <button 
          onClick={() => setActiveSubTab("ledger")}
          className={`px-5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === "ledger" ? "border-indigo-600 text-indigo-600 font-black" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Compliance Ledger</span>
        </button>
        <button 
          onClick={() => setActiveSubTab("analytics")}
          className={`px-5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === "analytics" ? "border-indigo-600 text-indigo-600 font-black" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Compliance Reports</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-slate-50 border border-slate-200 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-black uppercase text-indigo-950 tracking-wider">Retrieving centralized tax parameters...</p>
          <p className="text-[11px] text-slate-400">Pristine relational PostgreSQL matrices mapping state laws, stamp duties and builder waivers...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB 1: RULES ENGINE */}
          {activeSubTab === "rules" && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex flex-wrap gap-3">
                  {/* State selection */}
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Filter State Region</label>
                    <select
                      value={stateFilter}
                      onChange={(e) => setStateFilter(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold text-slate-700 outline-hidden focus:border-indigo-500"
                    >
                      <option value="ALL">Show All States</option>
                      {INDIAN_STATES.map(s => (
                        <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Builder selection override */}
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Rule Type Category</label>
                    <select
                      value={builderFilter}
                      onChange={(e) => setBuilderFilter(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold text-slate-700 outline-hidden focus:border-indigo-500"
                    >
                      <option value="ALL">All Rule Levels</option>
                      <option value="DEFAULT">Platform Defaults Only</option>
                      <option value="OVERRIDE">Builder-Specific Overrides Only</option>
                    </select>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-500">
                  Showing <strong className="text-slate-800">{filteredRules.length}</strong> rule bands of total {rules.length} system rules.
                </div>
              </div>

              {/* Rules Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
                <table className="w-full text-left text-xs text-slate-650">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-450 tracking-wider border-b border-slate-200 select-none">
                    <tr>
                      <th className="p-4">Tax Target</th>
                      <th className="p-4">Rule Name</th>
                      <th className="p-4">Rate (%)</th>
                      <th className="p-4">Scope / State</th>
                      <th className="p-4">Profile Origin</th>
                      <th className="p-4">Effective Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRules.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-slate-450 italic">
                          No state-wise tax rules matching current query filters registered yet.
                        </td>
                      </tr>
                    ) : (
                      filteredRules.map(r => (
                        <tr key={r.id} className={`${getRuleRowStyle(r)} transition-all`}>
                          <td className="p-4">
                            <span className={`inline-block font-black text-[9px] px-2 py-0.5 rounded tracking-wider ${
                              r.tax_type === "CGST" || r.tax_type === "SGST" || r.tax_type === "IGST"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                                : r.tax_type === "TDS"
                                ? "bg-amber-50 text-amber-800 border border-amber-100"
                                : r.tax_type === "STAMP_DUTY"
                                ? "bg-purple-50 text-purple-800 border border-purple-100"
                                : r.tax_type === "REGISTRATION"
                                ? "bg-cyan-50 text-cyan-800 border border-cyan-100"
                                : "bg-slate-50 text-slate-800 border border-slate-200"
                            }`}>
                              {r.tax_type}
                            </span>
                          </td>
                          <td className="p-4 font-extrabold text-slate-850">
                            {r.name}
                          </td>
                           <td className="p-4 font-mono font-black text-slate-900 text-sm">
                            {r.amount_type === "fixed" ? (
                              <span>₹{Number(r.fixed_amount || 0).toLocaleString("en-IN")}</span>
                            ) : (
                              <span>{Number(r.rate_percentage).toFixed(2)}%</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-bold text-slate-700">
                                {r.state_code === "ALL" ? "All States (Default)" : INDIAN_STATES.find(s => s.code === r.state_code)?.name || r.state_code}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            {r.tenant_id ? (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded self-start flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  <span>Builder Override</span>
                                </span>
                                <span className="text-[9px] text-slate-450 mt-1 max-w-[150px] truncate">
                                  {r.builder_name || r.tenant_name || "Bhoomi Dev Corp"}
                                </span>
                              </div>
                            ) : r.builder_name ? (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-150 px-1.5 py-0.5 rounded self-start flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  <span>Global Override</span>
                                </span>
                                <span className="text-[9px] text-slate-450 mt-1 max-w-[150px] truncate">
                                  {r.builder_name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded flex items-center gap-1 self-start select-none">
                                <Database className="w-3 h-3" />
                                <span>Platform Global</span>
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-slate-500 text-[11px] space-y-0.5">
                            <div>
                              <span className="text-slate-400">From: </span>
                              {r.effective_from ? new Date(r.effective_from).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "Immediate"}
                            </div>
                            {r.effective_to && (
                              <div className="text-slate-450">
                                <span className="text-slate-400">To: </span>
                                {new Date(r.effective_to).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              r.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-150" : "bg-slate-100 text-slate-400 border border-slate-200"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${r.is_active ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                              <span>{r.is_active ? "Active" : "Archived"}</span>
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingRule({
                                    ...r,
                                    rate_percentage: Number(r.rate_percentage),
                                    effective_from: r.effective_from ? r.effective_from.substring(0, 10) : "",
                                    effective_to: r.effective_to ? r.effective_to.substring(0, 10) : "",
                                    is_default: !!r.is_default,
                                    builder_name: r.builder_name || "",
                                    amount_type: r.amount_type || "percentage",
                                    fixed_amount: r.fixed_amount !== undefined ? Number(r.fixed_amount) : 0
                                  });
                                  setShowRuleModal(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-650 rounded-lg cursor-pointer"
                                title="Edit rule attributes"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => r.id && handleDeleteRule(r.id)}
                                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded-lg cursor-pointer"
                                title="Remove tax rule permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: TAX CALCULATOR PREVIEW */}
          {activeSubTab === "calculator" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Input Form parameters */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">Compliance Calculator Setup</h4>
                    <p className="text-[10px] text-slate-450">Simulate complex multi-state and builder override math instantly.</p>
                  </div>
                </div>

                {/* Base Transaction Cost */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Base Land / Plot Transaction Value (INR)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-slate-400 text-xs">₹</span>
                    <input 
                      type="number"
                      value={calcBaseAmount}
                      onChange={(e) => setCalcBaseAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2 border border-slate-250 rounded-xl bg-white hover:border-slate-350 focus:border-indigo-500 text-xs font-black text-slate-800 transition-all outline-hidden"
                    />
                  </div>
                  <div className="flex justify-between text-[10.5px] font-mono text-slate-400">
                    <span>Lakhs: {(calcBaseAmount / 100000).toFixed(2)} L</span>
                    <span>Crores: {(calcBaseAmount / 10000000).toFixed(4)} Cr</span>
                  </div>
                </div>

                {/* Origin vs Destination Selection */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Origin */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">Builder State (Origin)</label>
                    <select
                      value={calcBuilderState}
                      onChange={(e) => setCalcBuilderState(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-250 rounded-xl bg-white text-xs font-bold text-slate-750 outline-hidden"
                    >
                      <option value="KA">Karnataka (KA)</option>
                      <option value="MH">Maharashtra (MH)</option>
                      <option value="HR">Haryana (HR)</option>
                      <option value="DL">Delhi (DL)</option>
                    </select>
                  </div>

                  {/* Destination */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">Customer State (Zoning)</label>
                    <select
                      value={calcCustomerState}
                      onChange={(e) => setCalcCustomerState(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-250 rounded-xl bg-white text-xs font-bold text-slate-750 outline-hidden"
                    >
                      <option value="KA">Karnataka (KA)</option>
                      <option value="MH">Maharashtra (MH)</option>
                      <option value="HR">Haryana (HR)</option>
                      <option value="DL">Delhi (DL)</option>
                      <option value="TN">Tamil Nadu (TN)</option>
                    </select>
                  </div>
                </div>

                {/* Builder Select profile (for overrides) */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">Active Developer Overrides</label>
                  <select
                    value={calcTenantId}
                    onChange={(e) => setCalcTenantId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl bg-white text-xs font-bold text-indigo-950 outline-hidden"
                  >
                    <option value="NONE">No Overrides (Standard Platform Rates)</option>
                    <option value="11111111-1111-4111-8111-111111111111">Bhoomi Developer Corp (Concessional Override Active)</option>
                    <option value="22222222-2222-4222-8222-222222222222">Horizon Estates Ltd</option>
                  </select>
                </div>

                {/* Sub-Card: Invoice generation options */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3 pt-3">
                  <div className="flex items-center gap-1 text-[10px] font-black text-indigo-900 uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Compile Tax Compliant Invoice</span>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-bold uppercase text-slate-400 tracking-wider block">Customer Full Name</label>
                    <input 
                      type="text" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="E.g., Deepak Gowda"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-850"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8.5px] font-bold uppercase text-slate-400 tracking-wider block">Invoice Prefix</label>
                      <input 
                        type="text" 
                        value={invoicePrefix}
                        onChange={(e) => setInvoicePrefix(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-850 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] font-bold uppercase text-slate-400 tracking-wider block">Invoice ID Suffix</label>
                      <input 
                        type="number" 
                        value={invoiceNumberSuffix}
                        onChange={(e) => setInvoiceNumberSuffix(Number(e.target.value))}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-850 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateInvoice}
                    disabled={isGeneratingInvoice || !calcResults}
                    className="w-full bg-indigo-650 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-[11px] font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none"
                  >
                    {isGeneratingInvoice ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CreditCard className="w-3.5 h-3.5" />
                    )}
                    <span>Generate & Record Invoice</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Calculations Preview Breakdown */}
              <div className="lg:col-span-7 bg-slate-50 border border-slate-250 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">Dynamic Splitting Analysis</h4>
                    <p className="text-[10px] text-slate-450">Normalized breakdown mapping state boundaries.</p>
                  </div>
                  {calcResults?.isInterstate ? (
                    <span className="text-[8.5px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full select-none">
                      ⚠️ IGST / Interstate Active
                    </span>
                  ) : (
                    <span className="text-[8.5px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full select-none">
                      ✅ CGST + SGST Dual Split Active
                    </span>
                  )}
                </div>

                {calcLoading ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                    <p className="text-xs">Re-calculating taxation split parameters...</p>
                  </div>
                ) : calcResults ? (
                  <div className="space-y-4">
                    {/* Primary Big Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[9px] font-bold uppercase text-slate-400">Aggregated Taxes</span>
                        <p className="text-lg font-black text-slate-950 font-mono">₹{calcResults.totalTaxAmount.toLocaleString("en-IN")}</p>
                        <span className="text-[9px] text-slate-500 font-sans block">Effective tax rate: {((calcResults.totalTaxAmount / calcResults.baseAmount)*100).toFixed(2)}%</span>
                      </div>
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
                        <span className="text-[9px] font-bold uppercase text-slate-400">Total Billable Invoice</span>
                        <p className="text-lg font-black text-indigo-700 font-mono">₹{calcResults.totalInvoiceAmount.toLocaleString("en-IN")}</p>
                        <span className="text-[9px] text-slate-500 font-sans block">Base: ₹{calcResults.baseAmount.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Table-like band breakdown */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-450">
                        <span>Tax Breakdown Component</span>
                        <span>Band Rate</span>
                        <span className="text-right">Tax Charged</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {calcResults.taxes.map((t: any) => {
                          const hasRate = t.rate > 0;
                          return (
                            <div 
                              key={t.type} 
                              className={`p-3 flex justify-between items-center text-xs ${
                                !hasRate ? "opacity-35 hover:opacity-100 transition-opacity bg-slate-50/50" : ""
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-800">{t.name}</p>
                                <p className="text-[9.5px] text-slate-450 font-mono uppercase">{t.type}</p>
                              </div>
                              <span className="font-mono font-bold text-slate-600 bg-slate-100 border border-slate-150 px-1.5 py-0.5 rounded text-[10.5px]">
                                {t.rate.toFixed(2)}%
                              </span>
                              <span className="font-mono font-black text-slate-850">
                                ₹{t.amount.toLocaleString("en-IN")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Checker Alert for Concession Override */}
                    {calcTenantId !== "NONE" && (
                      <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl flex items-start gap-2.5 text-[11px] text-indigo-900 leading-normal">
                        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <strong className="block font-black uppercase text-[10px] tracking-wide text-indigo-950">Builder overrides applied!</strong>
                          <span>
                            Tax profile successfully identified special waivers for Bhoomi Developer Corp in Karnataka. Concession stamp duties and registration waivers have overridden the system defaults.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 italic">
                    Enter transaction values to populate live dynamic preview calculation graphs.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: LEDGER HISTORICAL LOGS */}
          {activeSubTab === "ledger" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <p className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Dynamic Compliance Invoicing Ledger (Latest 100)</p>
                <span className="text-xs text-slate-500">
                  Total integrated volume: <strong className="text-slate-800 font-mono">₹{ledger.reduce((acc, l) => acc + Number(l.base_amount), 0).toLocaleString("en-IN")}</strong>
                </span>
              </div>

              {ledger.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-450 italic">
                  No tax invoices have been integrated or calculated in this sandboxed environment yet. Try using the Calculator tab!
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
                  <table className="w-full text-left text-xs text-slate-650">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-450 tracking-wider border-b border-slate-200 select-none">
                      <tr>
                        <th className="p-3.5">Invoice #</th>
                        <th className="p-3.5">Customer Name</th>
                        <th className="p-3.5">State</th>
                        <th className="p-3.5">Base Land Cost</th>
                        <th className="p-3.5">CGST/SGST/IGST</th>
                        <th className="p-3.5">TDS (1%)</th>
                        <th className="p-3.5">Stamp & Reg Charges</th>
                        <th className="p-3.5">Total Tax</th>
                        <th className="p-3.5">Billable Total</th>
                        <th className="p-3.5">Date Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {ledger.map(l => {
                        const hasIGST = Number(l.igst_amount) > 0;
                        return (
                          <tr key={l.id} className="hover:bg-slate-50/50">
                            <td className="p-3.5 font-black text-indigo-700 font-mono uppercase tracking-wide">
                              {l.invoice_number}
                            </td>
                            <td className="p-3.5 font-extrabold text-slate-800">
                              {l.customer_name}
                            </td>
                            <td className="p-3.5 font-black text-[10px] text-slate-700 font-mono">
                              {l.state_code}
                            </td>
                            <td className="p-3.5 font-mono font-bold text-slate-800">
                              ₹{Number(l.base_amount).toLocaleString("en-IN")}
                            </td>
                            <td className="p-3.5 font-mono text-[11px]">
                              {hasIGST ? (
                                <span className="text-amber-700 bg-amber-50 border border-amber-150 px-1 py-0.5 rounded text-[9.5px]">
                                  IGST: ₹{Number(l.igst_amount).toLocaleString("en-IN")}
                                </span>
                              ) : (
                                <div className="space-y-0.5">
                                  <p className="text-emerald-700">CGST: ₹{Number(l.cgst_amount).toLocaleString("en-IN")}</p>
                                  <p className="text-emerald-700">SGST: ₹{Number(l.sgst_amount).toLocaleString("en-IN")}</p>
                                </div>
                              )}
                            </td>
                            <td className="p-3.5 font-mono text-amber-800 text-[11px]">
                              ₹{Number(l.tds_amount).toLocaleString("en-IN")}
                            </td>
                            <td className="p-3.5 font-mono text-slate-500 text-[11px] space-y-0.5">
                              <p>Stamp: ₹{Number(l.stamp_duty_amount).toLocaleString("en-IN")}</p>
                              <p>Reg: ₹{Number(l.registration_charges).toLocaleString("en-IN")}</p>
                            </td>
                            <td className="p-3.5 font-mono font-black text-slate-900">
                              ₹{Number(l.total_tax_amount).toLocaleString("en-IN")}
                            </td>
                            <td className="p-3.5 font-mono font-black text-indigo-850 bg-indigo-50/30">
                              ₹{Number(l.total_invoice_amount).toLocaleString("en-IN")}
                            </td>
                            <td className="p-3.5 text-[10px] text-slate-450 font-mono">
                              {l.created_at ? new Date(l.created_at).toLocaleString("en-IN", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "N/A"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMPLIANCE REPORTS */}
          {activeSubTab === "analytics" && (
            <div className="space-y-6">
              
              {/* Aggregated Total summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Registered Sales</span>
                  <p className="text-xl font-black text-slate-900 font-mono">
                    ₹{ledger.reduce((acc, l) => acc + Number(l.base_amount), 0).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    <span>Real-time Compliance Sync</span>
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">CGST + SGST Ledger</span>
                  <p className="text-xl font-black text-emerald-800 font-mono">
                    ₹{ledger.reduce((acc, l) => acc + Number(l.cgst_amount) + Number(l.sgst_amount), 0).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium">Mapped from regional dual-tax states</p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">IGST Split Ledger</span>
                  <p className="text-xl font-black text-amber-800 font-mono">
                    ₹{ledger.reduce((acc, l) => acc + Number(l.igst_amount), 0).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium">Out-of-state customer registries</p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">TDS + Stamp Duty + Fees</span>
                  <p className="text-xl font-black text-indigo-700 font-mono">
                    ₹{ledger.reduce((acc, l) => acc + Number(l.tds_amount) + Number(l.stamp_duty_amount) + Number(l.registration_charges) + Number(l.other_charges), 0).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium">Under Section 194IA and State Acts</p>
                </div>
              </div>

              {/* Recharts Graphical reports */}
              {analytics ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* State-wise Tax Breakdown Chart */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">Tax Collections Grouped by State</h4>
                      <p className="text-[10px] text-slate-450">Consolidated CGST, SGST, IGST and stamp levies across operating regions.</p>
                    </div>
                    
                    <div className="h-64">
                      {analytics.stateSummary?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.stateSummary.map((s: any) => ({
                            state: s.state_code,
                            Tax: Number(s.total_tax),
                            BaseSales: Number(s.total_base)
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="state" stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`]} />
                            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                            <Bar dataKey="Tax" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Compliance Taxes" />
                            <Bar dataKey="BaseSales" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Base land value" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">No region-wise metadata recorded.</div>
                      )}
                    </div>
                  </div>

                  {/* Monthly Collections Trend */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">Monthly Tax Volume Performance</h4>
                      <p className="text-[10px] text-slate-450">Chronological trend analysis tracking statutory liabilities.</p>
                    </div>

                    <div className="h-64">
                      {analytics.monthlySummary?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.monthlySummary.map((m: any) => ({
                            month: m.month,
                            TaxAmount: Number(m.total_tax)
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`]} />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            <Bar dataKey="TaxAmount" fill="#10b981" radius={[4, 4, 0, 0]} name="Statutory Liability (INR)" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400 italic">No chronological trends recorded yet.</div>
                      )}
                    </div>
                  </div>

                </div>
              ) : null}

              {/* Bottom statutory legal footnote */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-550 leading-relaxed select-none">
                <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-800 font-extrabold uppercase text-[10px] tracking-wider mb-0.5">Statutory Audit Compliance Disclaimer</strong>
                  <span>
                    This tax log ledger complies with GST Acts, Section 194IA of the Income Tax Act 1961 (TDS on immovable properties exceeding ₹50 Lakhs), and respective State Stamp Acts. The percentages and calculations are fully normalized and extracted dynamically from relational tables. No values are hardcoded in the codebase.
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 5. ADD/EDIT RULE MODEL DIALOG */}
      {showRuleModal && editingRule && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-sans">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-indigo-600" />
                <span>{editingRule.id ? "Edit statutory tax rule" : "Register new state tax rule"}</span>
              </h3>
              <button 
                onClick={() => {
                  setShowRuleModal(false);
                  setEditingRule(null);
                }}
                className="text-slate-400 hover:text-slate-650 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveRule} className="p-5 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Tax Type selection */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">Tax bands category</label>
                  <select
                    value={editingRule.tax_type || "CGST"}
                    onChange={(e) => setEditingRule(prev => ({ ...prev, tax_type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl bg-white text-xs font-bold text-slate-750 outline-hidden"
                  >
                    {TAX_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* State Region */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">Zoning state region</label>
                  <select
                    value={editingRule.state_code || "ALL"}
                    onChange={(e) => setEditingRule(prev => ({ ...prev, state_code: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl bg-white text-xs font-bold text-slate-750 outline-hidden"
                  >
                    {INDIAN_STATES.map(s => (
                      <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                {/* Rule Name */}
                <div className="col-span-2 space-y-1">
                  <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">Rule Label / Tax Description</label>
                  <input 
                    type="text"
                    value={editingRule.name || ""}
                    onChange={(e) => setEditingRule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="E.g., Karnataka SGST, Custom Concession Stamp Levy"
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs outline-hidden font-bold"
                    required
                  />
                </div>

                {/* Rate Percentage / Fixed Amount input */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">Tax Levy Calculation Type</label>
                  <select
                    value={editingRule.amount_type || "percentage"}
                    onChange={(e) => setEditingRule(prev => ({ ...prev, amount_type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl bg-white text-xs font-bold text-slate-750 outline-hidden"
                  >
                    <option value="percentage">Percentage-based (%)</option>
                    <option value="fixed">Fixed Levy Amount (₹)</option>
                  </select>
                </div>

                {editingRule.amount_type === "fixed" ? (
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">Fixed Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">₹</span>
                      <input 
                        type="number"
                        step="1"
                        value={editingRule.fixed_amount !== undefined ? editingRule.fixed_amount : 0}
                        onChange={(e) => setEditingRule(prev => ({ ...prev, fixed_amount: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs outline-hidden font-mono font-bold"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">Rate percentage (%)</label>
                    <div className="relative">
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono">%</span>
                      <input 
                        type="number"
                        step="0.01"
                        value={editingRule.rate_percentage !== undefined ? editingRule.rate_percentage : 0}
                        onChange={(e) => setEditingRule(prev => ({ ...prev, rate_percentage: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs outline-hidden font-mono font-bold"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Effective From Date */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">Effective start date</label>
                  <input 
                    type="date"
                    value={editingRule.effective_from || ""}
                    onChange={(e) => setEditingRule(prev => ({ ...prev, effective_from: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs outline-hidden font-mono font-bold"
                  />
                </div>

                {/* Effective To Date */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">Effective expiry date (optional)</label>
                  <input 
                    type="date"
                    value={editingRule.effective_to || ""}
                    onChange={(e) => setEditingRule(prev => ({ ...prev, effective_to: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs outline-hidden font-mono font-bold"
                  />
                </div>

                {/* Tenant / Builder Scope */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">Builder Scope Override</label>
                  <select
                    value={editingRule.tenant_id || ""}
                    onChange={(e) => setEditingRule(prev => ({ ...prev, tenant_id: e.target.value === "" ? null : e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl bg-white text-xs font-bold text-slate-750 outline-hidden"
                  >
                    <option value="">Global default (All builders)</option>
                    <option value="11111111-1111-4111-8111-111111111111">Bhoomi Developer Corp (dev-01)</option>
                    <option value="22222222-2222-4222-8222-222222222222">Horizon Estates Ltd (dev-02)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider block">Builder Name Label</label>
                  <input 
                    type="text"
                    value={editingRule.builder_name || ""}
                    onChange={(e) => setEditingRule(prev => ({ ...prev, builder_name: e.target.value }))}
                    placeholder="E.g., Prestige, DLF, Godrej"
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs outline-hidden font-bold"
                  />
                </div>

                {/* Active Status Check */}
                <div className="col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      id="rule-active-state"
                      checked={editingRule.is_active !== undefined ? !!editingRule.is_active : true}
                      onChange={(e) => setEditingRule(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="rule-active-state" className="font-extrabold text-slate-800 cursor-pointer select-none">
                      Enable and enforce this tax rate immediately
                    </label>
                  </div>
                  <div className="flex items-center gap-3 border-t border-slate-200/60 pt-2">
                    <input 
                      type="checkbox"
                      id="rule-default-state"
                      checked={editingRule.is_default !== undefined ? !!editingRule.is_default : false}
                      onChange={(e) => setEditingRule(prev => ({ ...prev, is_default: e.target.checked }))}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="rule-default-state" className="font-extrabold text-slate-800 cursor-pointer select-none">
                      Mark as tenant-level fallback / default rule
                    </label>
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-150 flex justify-end gap-2 text-xs">
                <button 
                  type="button"
                  onClick={() => {
                    setShowRuleModal(false);
                    setEditingRule(null);
                  }}
                  className="px-4 py-2 border border-slate-250 hover:bg-slate-100 rounded-xl text-slate-650 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/15"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Config</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
