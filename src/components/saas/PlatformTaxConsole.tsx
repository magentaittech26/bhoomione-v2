import React, { useState, useEffect } from "react";
import { 
  Building2, Percent, FileText, CheckCircle2, AlertCircle, RefreshCw, Save, Info, ArrowRight, Receipt, HelpCircle
} from "lucide-react";
import { api } from "../../lib/api";

interface PlatformTaxConsoleProps {
  onShowToast: (message: string, type: "success" | "error") => void;
}

// Local Error Boundary for PlatformTaxConsole
export class PlatformTaxErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("PlatformTaxConsole Render Crash caught by Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl space-y-4" id="platform-tax-crash-boundary">
          <div className="flex items-center gap-3 text-rose-800">
            <AlertCircle className="w-6 h-6 text-rose-600" />
            <h3 className="font-bold text-base font-sans">Platform Tax Console Component Error</h3>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed font-sans">
            An unexpected error occurred within the Platform Tax & Invoice Configuration view. The main SaaS Control Panel remains fully active.
          </p>
          <div className="bg-white p-3 rounded border border-rose-100 font-mono text-[10px] text-slate-600 overflow-x-auto max-h-32">
            {this.state.error?.toString()}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-all cursor-pointer"
          >
            Attempt Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const PlatformTaxConsole: React.FC<PlatformTaxConsoleProps> = ({ onShowToast }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [companyName, setCompanyName] = useState<string>("BhoomiOne Technologies Pvt Ltd");
  const [gstin, setGstin] = useState<string>("29AAAAA1111A1Z1");
  const [pan, setPan] = useState<string>("ABCDE1234F");
  const [cin, setCin] = useState<string>("U72200KA2023PTC123456");
  const [registeredState, setRegisteredState] = useState<string>("KA");
  const [registeredAddress, setRegisteredAddress] = useState<string>("No. 42, 3rd Cross, Sector 1, HSR Layout, Bengaluru, Karnataka 560102");

  const [gstEnabled, setGstEnabled] = useState<boolean>(true);
  const [cgstPercentage, setCgstPercentage] = useState<number>(9);
  const [sgstPercentage, setSgstPercentage] = useState<number>(9);
  const [igstPercentage, setIgstPercentage] = useState<number>(18);
  const [reverseCharge, setReverseCharge] = useState<boolean>(false);
  const [sacCode, setSacCode] = useState<string>("997331");
  const [hsnCode, setHsnCode] = useState<string>("8524");

  const [invoicePrefix, setInvoicePrefix] = useState<string>("BO-INV-");
  const [creditNotePrefix, setCreditNotePrefix] = useState<string>("BO-CN-");
  const [debitNotePrefix, setDebitNotePrefix] = useState<string>("BO-DN-");

  const [applyGstSaas, setApplyGstSaas] = useState<boolean>(true);
  const [applyGstAddons, setApplyGstAddons] = useState<boolean>(true);
  const [applyGstMarketplace, setApplyGstMarketplace] = useState<boolean>(true);
  const [applyGstFeatured, setApplyGstFeatured] = useState<boolean>(true);
  const [applyGstAmc, setApplyGstAmc] = useState<boolean>(true);
  const [applyGstSupport, setApplyGstSupport] = useState<boolean>(true);

  // Invoice Preview inputs
  const [previewPlanPrice, setPreviewPlanPrice] = useState<number>(25000); // 25k plan
  const [previewAddonPrice, setPreviewAddonPrice] = useState<number>(5000); // 5k add-on
  const [previewCustomerState, setPreviewCustomerState] = useState<string>("KA");

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchSaasSettings();
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format from SaaS settings API.");
      }

      const getSettingValue = (key: string, def: string): string => {
        const item = data.find((s: any) => {
          const sKey = s.settingKey || s.setting_key || "";
          return sKey.toLowerCase() === key.toLowerCase();
        });
        if (item) {
          const val = item.settingValue !== undefined ? item.settingValue : item.setting_value;
          return val !== null && val !== undefined ? String(val) : def;
        }
        return def;
      };

      // Map values
      setCompanyName(getSettingValue("company_name", "BhoomiOne Technologies Pvt Ltd"));
      setGstin(getSettingValue("gst_number", "29AAAAA1111A1Z1"));
      setPan(getSettingValue("pan_number", "ABCDE1234F"));
      setCin(getSettingValue("cin_number", "U72200KA2023PTC123456"));
      setRegisteredState(getSettingValue("registered_state", "KA"));
      setRegisteredAddress(getSettingValue("corporate_address", "No. 42, 3rd Cross, Sector 1, HSR Layout, Bengaluru, Karnataka 560102"));

      setGstEnabled(getSettingValue("gst_enabled", "true") === "true");
      setCgstPercentage(Number(getSettingValue("cgst_percentage", "9")));
      setSgstPercentage(Number(getSettingValue("sgst_percentage", "9")));
      setIgstPercentage(Number(getSettingValue("igst_percentage", "18")));
      setReverseCharge(getSettingValue("reverse_charge_enabled", "false") === "true");
      setSacCode(getSettingValue("sac_code", "997331"));
      setHsnCode(getSettingValue("hsn_code", "8524"));

      setInvoicePrefix(getSettingValue("invoice_prefix", "BO-INV-"));
      setCreditNotePrefix(getSettingValue("credit_note_prefix", "BO-CN-"));
      setDebitNotePrefix(getSettingValue("debit_note_prefix", "BO-DN-"));

      setApplyGstSaas(getSettingValue("apply_gst_saas", "true") === "true");
      setApplyGstAddons(getSettingValue("apply_gst_addons", "true") === "true");
      setApplyGstMarketplace(getSettingValue("apply_gst_marketplace", "true") === "true");
      setApplyGstFeatured(getSettingValue("apply_gst_featured", "true") === "true");
      setApplyGstAmc(getSettingValue("apply_gst_amc", "true") === "true");
      setApplyGstSupport(getSettingValue("apply_gst_support", "true") === "true");

    } catch (err: any) {
      console.error("Failed to load platform settings inside Console:", err);
      setError("Failed to fetch platform tax settings. Please verify server connectivity.");
    } finally {
      setLoading(false);
    }
  };

  const saveSettingsData = async () => {
    setSaving(true);
    try {
      // Fetch full settings list so we don't wipe out other groups
      const allSettings = await api.fetchSaasSettings();
      const updatedKeys: Record<string, { group: string; val: string; isPublic: boolean }> = {
        company_name: { group: "COMPANY", val: companyName, isPublic: true },
        corporate_address: { group: "COMPANY", val: registeredAddress, isPublic: false },
        pan_number: { group: "COMPANY", val: pan, isPublic: false },
        cin_number: { group: "COMPANY", val: cin, isPublic: false },
        registered_state: { group: "COMPANY", val: registeredState, isPublic: true },

        gst_number: { group: "GST", val: gstin, isPublic: false },
        gst_enabled: { group: "GST", val: String(gstEnabled), isPublic: false },
        cgst_percentage: { group: "GST", val: String(cgstPercentage), isPublic: false },
        sgst_percentage: { group: "GST", val: String(sgstPercentage), isPublic: false },
        igst_percentage: { group: "GST", val: String(igstPercentage), isPublic: false },
        reverse_charge_enabled: { group: "GST", val: String(reverseCharge), isPublic: false },
        sac_code: { group: "GST", val: sacCode, isPublic: false },
        hsn_code: { group: "GST", val: hsnCode, isPublic: false },

        invoice_prefix: { group: "BILLING", val: invoicePrefix, isPublic: false },
        credit_note_prefix: { group: "BILLING", val: creditNotePrefix, isPublic: false },
        debit_note_prefix: { group: "BILLING", val: debitNotePrefix, isPublic: false },

        apply_gst_saas: { group: "GST", val: String(applyGstSaas), isPublic: false },
        apply_gst_addons: { group: "GST", val: String(applyGstAddons), isPublic: false },
        apply_gst_marketplace: { group: "GST", val: String(applyGstMarketplace), isPublic: false },
        apply_gst_featured: { group: "GST", val: String(applyGstFeatured), isPublic: false },
        apply_gst_amc: { group: "GST", val: String(applyGstAmc), isPublic: false },
        apply_gst_support: { group: "GST", val: String(applyGstSupport), isPublic: false },
      };

      // Build payload
      const mergedPayload = [...allSettings];
      Object.entries(updatedKeys).forEach(([key, conf]) => {
        const index = mergedPayload.findIndex((s: any) => {
          const sKey = s.settingKey || s.setting_key || "";
          return sKey.toLowerCase() === key.toLowerCase();
        });

        if (index > -1) {
          mergedPayload[index] = {
            ...mergedPayload[index],
            setting_group: conf.group,
            setting_key: key,
            setting_value: conf.val,
            is_public: conf.isPublic
          };
        } else {
          mergedPayload.push({
            setting_group: conf.group,
            setting_key: key,
            setting_value: conf.val,
            setting_type: "string",
            is_public: conf.isPublic
          });
        }
      });

      // Prepare payload to API format
      const finalPayload = mergedPayload.map((s: any) => ({
        setting_group: s.settingGroup || s.setting_group || "GENERAL",
        setting_key: s.settingKey || s.setting_key || "",
        setting_value: s.settingValue !== undefined ? s.settingValue : (s.setting_value !== undefined ? s.setting_value : null),
        setting_type: s.settingType || s.setting_type || "string",
        is_public: s.isPublic !== undefined ? !!s.isPublic : (s.is_public !== undefined ? !!s.is_public : false)
      }));

      await api.saveSaasSettings(finalPayload);
      onShowToast("Platform tax and invoice settings saved successfully.", "success");
      await loadSettingsData();
    } catch (err: any) {
      console.error("Failed to save platform settings:", err);
      onShowToast(err.message || "Failed to commit settings changes.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Dynamic preview calculation
  const isInterstate = previewCustomerState !== registeredState;
  const subtotal = Number(previewPlanPrice) + Number(previewAddonPrice);
  
  let previewCgstRate = 0;
  let previewSgstRate = 0;
  let previewIgstRate = 0;

  if (gstEnabled) {
    if (isInterstate) {
      previewIgstRate = igstPercentage;
    } else {
      previewCgstRate = cgstPercentage;
      previewSgstRate = sgstPercentage;
    }
  }

  const cgstAmount = Number((subtotal * (previewCgstRate / 100)).toFixed(2));
  const sgstAmount = Number((subtotal * (previewSgstRate / 100)).toFixed(2));
  const igstAmount = Number((subtotal * (previewIgstRate / 100)).toFixed(2));
  const totalTax = Number((cgstAmount + sgstAmount + igstAmount).toFixed(2));
  const totalAmount = Number((subtotal + totalTax).toFixed(2));

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-3 bg-white border border-slate-100 rounded-2xl" id="platform-tax-loader">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <span className="text-xs text-slate-500 font-medium font-sans">Loading Secure Platform Tax Registry...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl space-y-4" id="platform-tax-error-view">
        <div className="flex items-center gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <h3 className="font-bold text-sm font-sans">{error}</h3>
        </div>
        <button
          onClick={loadSettingsData}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="platform-tax-console">
      {/* Informative Header Box */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3" id="platform-tax-header-info">
        <Receipt className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-900 font-sans">SaaS Administrative Billing Authority</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
            Configure BhoomiOne's commercial identity and taxation profiles used strictly for corporate invoice generation. 
            All builder project taxes, state rules, and land development levies belong to the tenant-specific workspace.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Columns - Form Configurations */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1: Company Profile */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs" id="section-company-details">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Platform Company Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Legal Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:border-indigo-500 outline-none"
                  placeholder="e.g. BhoomiOne Technologies Pvt Ltd"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-mono text-slate-800 uppercase focus:border-indigo-500 outline-none"
                    placeholder="e.g. 29AAAAA1111A1Z1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Corporate PAN</label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-mono text-slate-800 uppercase focus:border-indigo-500 outline-none"
                    placeholder="e.g. ABCDE1234F"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Corporate CIN (Optional)</label>
                <input
                  type="text"
                  value={cin}
                  onChange={(e) => setCin(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-mono text-slate-800 uppercase focus:border-indigo-500 outline-none"
                  placeholder="e.g. U72200KA2023PTC123456"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Registered State Code</label>
                <select
                  value={registeredState}
                  onChange={(e) => setRegisteredState(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:border-indigo-500 outline-none font-medium"
                >
                  <option value="KA">Karnataka (KA)</option>
                  <option value="MH">Maharashtra (MH)</option>
                  <option value="DL">Delhi (DL)</option>
                  <option value="HR">Haryana (HR)</option>
                  <option value="TN">Tamil Nadu (TN)</option>
                  <option value="TS">Telangana (TS)</option>
                  <option value="AP">Andhra Pradesh (AP)</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-semibold text-slate-500">Registered Address</label>
                <textarea
                  value={registeredAddress}
                  onChange={(e) => setRegisteredAddress(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 focus:border-indigo-500 outline-none h-16 resize-none"
                  placeholder="Full physical registered address of the SaaS operator"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Platform Billing */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs" id="section-billing-rules">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Percent className="w-3.5 h-3.5" />
              <span>Platform Billing & Tax Rules</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 font-sans">Default GST Assessment</span>
                  <p className="text-[10px] text-slate-400 font-sans">Automatically charge GST on invoices</p>
                </div>
                <input
                  type="checkbox"
                  checked={gstEnabled}
                  onChange={(e) => setGstEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 font-sans">Reverse Charge Enforcement</span>
                  <p className="text-[10px] text-slate-400 font-sans">Apply GST reverse charge rules</p>
                </div>
                <input
                  type="checkbox"
                  checked={reverseCharge}
                  onChange={(e) => setReverseCharge(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              {gstEnabled && (
                <div className="grid grid-cols-3 gap-2 md:col-span-2 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/50">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-950 font-sans">CGST (%)</label>
                    <input
                      type="number"
                      value={cgstPercentage}
                      onChange={(e) => setCgstPercentage(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs border border-indigo-200/60 rounded-lg p-2 bg-white text-indigo-900 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-950 font-sans">SGST (%)</label>
                    <input
                      type="number"
                      value={sgstPercentage}
                      onChange={(e) => setSgstPercentage(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs border border-indigo-200/60 rounded-lg p-2 bg-white text-indigo-900 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-950 font-sans">IGST (%)</label>
                    <input
                      type="number"
                      value={igstPercentage}
                      onChange={(e) => setIgstPercentage(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs border border-indigo-200/60 rounded-lg p-2 bg-white text-indigo-900 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">SaaS SAC Code (Accounting Code)</label>
                <input
                  type="text"
                  value={sacCode}
                  onChange={(e) => setSacCode(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 outline-none font-mono"
                  placeholder="e.g. 997331"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">HSN Code (Equipment Sales)</label>
                <input
                  type="text"
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 outline-none font-mono"
                  placeholder="e.g. 8524"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Platform Invoice Prefixes */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs" id="section-prefixes">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Platform Invoice Prefixes</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Invoice Prefix</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 font-mono outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Credit Note Prefix</label>
                <input
                  type="text"
                  value={creditNotePrefix}
                  onChange={(e) => setCreditNotePrefix(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 font-mono outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500">Debit Note Prefix</label>
                <input
                  type="text"
                  value={debitNotePrefix}
                  onChange={(e) => setDebitNotePrefix(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white text-slate-800 font-mono outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Subscription Billing Tax Options */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs" id="section-enforcements">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Percent className="w-3.5 h-3.5" />
              <span>SaaS Subscription Billing Tax Rules</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">Specify which revenue services should automatically apply the designated GST rate during SaaS billing cycles.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={applyGstSaas}
                  onChange={(e) => setApplyGstSaas(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium">SaaS Subscription</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={applyGstAddons}
                  onChange={(e) => setApplyGstAddons(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium">Add-on Modules</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={applyGstMarketplace}
                  onChange={(e) => setApplyGstMarketplace(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium">Marketplace Fees</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={applyGstFeatured}
                  onChange={(e) => setApplyGstFeatured(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium">Featured Listings</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={applyGstAmc}
                  onChange={(e) => setApplyGstAmc(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium">Annual Maintenance</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={applyGstSupport}
                  onChange={(e) => setApplyGstSupport(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium">Support Plans</span>
              </label>
            </div>
          </div>

        </div>

        {/* Right Column - Live Invoice Preview */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-lg border border-slate-800 space-y-4" id="section-invoice-preview font-sans">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Real-time Invoice preview</span>
            </h3>

            {/* Simulated input adjustments */}
            <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Preview SaaS Plan Price (₹)</label>
                <input
                  type="number"
                  value={previewPlanPrice}
                  onChange={(e) => setPreviewPlanPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded p-2 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Preview Add-on Cost (₹)</label>
                <input
                  type="number"
                  value={previewAddonPrice}
                  onChange={(e) => setPreviewAddonPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded p-2 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Simulate Builder Customer State</label>
                <select
                  value={previewCustomerState}
                  onChange={(e) => setPreviewCustomerState(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded p-2 text-xs"
                >
                  <option value="KA">Karnataka (KA)</option>
                  <option value="MH">Maharashtra (MH)</option>
                  <option value="DL">Delhi (DL)</option>
                  <option value="HR">Haryana (HR)</option>
                  <option value="KL">Kerala (KL)</option>
                </select>
              </div>
            </div>

            {/* Rendering of Simulated Invoice Document */}
            <div className="bg-white text-slate-900 rounded-xl p-4 space-y-4 border border-slate-200" id="live-doc-frame">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">TAX INVOICE</span>
                  <p className="text-xs font-extrabold text-slate-800">{invoicePrefix}2026-0001</p>
                  <p className="text-[9px] text-slate-400">Date: {new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-[10px] font-bold text-indigo-650 font-sans">{companyName}</span>
                  <p className="text-[8px] text-slate-500 font-mono">GSTIN: {gstin}</p>
                  <p className="text-[8px] text-slate-400 font-mono">SAC: {sacCode}</p>
                </div>
              </div>

              <div className="space-y-1 text-[10px] leading-relaxed">
                <p className="font-bold text-slate-700">Billing to Customer State: <span className="font-mono">{previewCustomerState}</span></p>
                <p className="text-slate-400 text-[9px]">Scope: SaaS Platform Subscription License Fee</p>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Base SaaS Plan Fee</span>
                  <span className="font-medium text-slate-800">₹{previewPlanPrice.toLocaleString("en-IN")}</span>
                </div>
                {previewAddonPrice > 0 && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Add-on Module Provision</span>
                    <span className="font-medium text-slate-800">₹{previewAddonPrice.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="border-t border-slate-100/70 pt-2 flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 font-semibold">Subtotal</span>
                  <span className="font-bold text-slate-800">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>

                <div className="bg-slate-50/70 p-2 rounded-lg border border-slate-100 space-y-1 text-[10px]">
                  <div className="flex justify-between text-slate-600 font-mono">
                    <span>GST Applicability</span>
                    <span className="font-semibold">{isInterstate ? "IGST (Inter-state)" : "CGST + SGST (Intra-state)"}</span>
                  </div>
                  {!isInterstate ? (
                    <>
                      <div className="flex justify-between text-slate-500 font-mono">
                        <span>CGST ({previewCgstRate}%)</span>
                        <span>₹{cgstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-mono">
                        <span>SGST ({previewSgstRate}%)</span>
                        <span>₹{sgstAmount.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-500 font-mono">
                      <span>IGST ({previewIgstRate}%)</span>
                      <span>₹{igstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {totalTax === 0 && (
                    <div className="text-[9px] text-rose-500 italic font-medium">GST is disabled or exempted for this preview.</div>
                  )}
                </div>

                <div className="border-t border-slate-200/80 pt-2 flex justify-between items-center text-xs">
                  <span className="font-black text-slate-900 uppercase">Grand Total</span>
                  <span className="font-black text-indigo-700 text-sm">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="border-t border-slate-100/60 pt-2 text-center text-[8px] text-slate-400">
                This is a dynamic invoice configuration preview reflecting active coefficients.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Trigger Button */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-5 mt-4" id="platform-tax-action-row">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
          <span>Configuring changes directly replicates coefficients on SaaS billing pipelines.</span>
        </div>
        <button
          onClick={saveSettingsData}
          disabled={saving}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          id="btn-save-platform-tax"
        >
          {saving ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saving Configuration...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Platform Tax Configuration</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
