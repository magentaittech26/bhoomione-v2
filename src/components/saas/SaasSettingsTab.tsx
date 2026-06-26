import React, { useState, useEffect } from "react";
import { 
  Globe, Shield, CreditCard, Mail, HardDrive, Sliders, Server, 
  Save, AlertCircle, RefreshCw, CheckCircle2, Info, Building2, Phone, FileText, Lock
} from "lucide-react";
import { api } from "../../lib/api";

interface Setting {
  id?: string;
  settingGroup: string;
  settingKey: string;
  settingValue: string | null;
  settingType: string;
  isPublic: boolean;
}

interface SaasSettingsTabProps {
  onShowToast: (message: string, type: "success" | "error") => void;
}

const SETTING_GROUPS = [
  { id: "GENERAL", label: "General Settings", icon: Sliders, description: "Manage basic platform branding and corporate contact profiles." },
  { id: "DOMAINS", label: "Domain & Routing", icon: Globe, description: "Configure hostname pattern resolutions and reverse proxy rules." },
  { id: "BILLING", label: "Billing & Invoicing", icon: CreditCard, description: "Set default currencies, tax slab computations, and subscription grace windows." },
  { id: "NOTIFICATIONS", label: "Notifications & Alerts", icon: Mail, description: "Assign default WhatsApp, SMS, and SMTP service providers." },
  { id: "SECURITY", label: "Security & MFA", icon: Shield, description: "Establish strict password complexities, session timeouts, and audit logging lifespans." },
  { id: "STORAGE", label: "Storage & Uploads", icon: HardDrive, description: "Manage default disk spaces and file parsing threshold boundaries." },
  { id: "ADVANCED", label: "Advanced Technical Info", icon: Server, description: "Monitor cluster ingress nodes, container ports, and reverse proxy protocols." },
];

export const SaasSettingsTab: React.FC<SaasSettingsTabProps> = ({ onShowToast }) => {
  const [activeGroup, setActiveGroup] = useState<string>("GENERAL");
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchSaasSettings();
      // Ensure camelCase fields are parsed cleanly (if database returned snake_case due to different drivers)
      const formatted = data.map((item: any) => ({
        id: item.id,
        settingGroup: item.settingGroup || item.setting_group || "GENERAL",
        settingKey: item.settingKey || item.setting_key || "",
        settingValue: item.settingValue !== undefined ? item.settingValue : (item.setting_value !== undefined ? item.setting_value : null),
        settingType: item.settingType || item.setting_type || "string",
        isPublic: item.isPublic !== undefined ? !!item.isPublic : (item.is_public !== undefined ? !!item.is_public : false)
      }));
      setSettings(formatted);
    } catch (err: any) {
      console.error("Failed to load settings:", err);
      setError("Failed to retrieve platform settings from the secure database.");
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key: string, val: string) => {
    setSettings(prev => prev.map(s => {
      if (s.settingKey === key) {
        return { ...s, settingValue: val };
      }
      return s;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Map to payload matching Laravel model keys
      const payload = settings.map(s => ({
        setting_group: s.settingGroup,
        setting_key: s.settingKey,
        setting_value: s.settingValue,
        setting_type: s.settingType,
        is_public: s.isPublic
      }));
      await api.saveSaasSettings(payload);
      onShowToast("SaaS platform configuration saved and replicated successfully.", "success");
      loadSettings();
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      onShowToast(err.message || "Failed to commit settings changes to the database.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Filter settings for currently active group
  const filteredSettings = settings.filter(s => s.settingGroup === activeGroup);

  const getSettingLabelAndIcon = (key: string) => {
    switch(key) {
      // General
      case "platform_name": return { label: "Platform Branding Name", placeholder: "e.g., BhoomiOne", icon: Sliders };
      case "support_email": return { label: "System Support Email Address", placeholder: "e.g., support@bhoomione.in", icon: Mail };
      case "support_phone": return { label: "System Support Phone Line", placeholder: "e.g., +91 98765 43210", icon: Phone };
      case "company_name": return { label: "Registered Corporate Entity", placeholder: "e.g., BhoomiOne Technologies Pvt Ltd", icon: Building2 };
      case "gst_number": return { label: "GST Identification Number (GSTIN)", placeholder: "e.g., 29AAAAA1111A1Z1", icon: FileText };
      case "address": return { label: "Registered Corporate Address", placeholder: "Full corporate address details", icon: Building2 };
      // Domains
      case "base_domain": return { label: "Core Workspace Base Domain", placeholder: "e.g., bhoomione.in", icon: Globe };
      case "admin_domain": return { label: "Super Admin Supervision Domain", placeholder: "e.g., admin.bhoomione.in", icon: Lock };
      case "marketplace_domain": return { label: "Townships Open Marketplace Domain", placeholder: "e.g., market.bhoomione.in", icon: Globe };
      case "customer_portal_pattern": return { label: "Customer Portal Route Schema Pattern", placeholder: "e.g., {{tenant}}.bhoomione.in/portal", icon: Globe };
      case "agent_portal_pattern": return { label: "Agent Portal Route Schema Pattern", placeholder: "e.g., {{tenant}}.bhoomione.in/agent", icon: Globe };
      case "custom_domain_policy": return { label: "Custom Domain Mapping SSL Policy", placeholder: "e.g., REWRITE_SSL_CNAME", icon: Shield };
      // Billing
      case "currency": return { label: "System Base Transaction Currency Code", placeholder: "e.g., INR", icon: CreditCard };
      case "gst_percentage": return { label: "Default Service GST percentage (%)", placeholder: "18", icon: CreditCard };
      case "invoice_prefix": return { label: "Automated Invoice Prefix Code", placeholder: "BO-INV-", icon: FileText };
      case "default_trial_days": return { label: "Default Trial Span (Days)", placeholder: "14", icon: Sliders };
      case "grace_period_days": return { label: "Payment Overdue Grace Extension (Days)", placeholder: "7", icon: Sliders };
      case "auto_suspend_after_due_days": return { label: "Auto Suspend Workspace After (Days Overdue)", placeholder: "5", icon: Sliders };
      case "auto_expire_after_days": return { label: "Auto Archive Cancelled Workspaces After (Days)", placeholder: "30", icon: Sliders };
      // Notifications
      case "email_provider": return { label: "Primary SMTP/Email Gateway Engine", placeholder: "e.g., SES, SendGrid", icon: Mail };
      case "whatsapp_provider": return { label: "Primary WhatsApp Business API Gateway", placeholder: "e.g., Twilio", icon: Phone };
      case "sms_provider": return { label: "Primary Transactional SMS Provider", placeholder: "e.g., Twilio, Plivo", icon: Phone };
      case "reminder_days_before_renewal": return { label: "First Renewal Reminder Alert (Days Before Due)", placeholder: "7", icon: Sliders };
      // Security
      case "session_timeout": return { label: "Idle Administrator Session Expiry (Minutes)", placeholder: "120", icon: Sliders };
      case "password_policy": return { label: "Minimum Passphrase Policy Grade", placeholder: "STRONG", icon: Shield };
      case "mfa_required": return { label: "Enforce Multi-Factor Authentication (MFA)", placeholder: "false", icon: Lock };
      case "audit_retention_days": return { label: "System Compliance Logs Retention Span (Days)", placeholder: "365", icon: FileText };
      // Storage
      case "default_storage_gb": return { label: "Default Plan Disk Allocation Quota (GB)", placeholder: "10", icon: HardDrive };
      case "max_upload_size_mb": return { label: "Max Raw File Attachment Multi-part Limit (MB)", placeholder: "100", icon: HardDrive };
      case "dxf_upload_limit_mb": return { label: "Heavy AutoCAD DXF Parser Upload Limits (MB)", placeholder: "50", icon: HardDrive };
      case "image_upload_limit_mb": return { label: "Layout Layout Overlay Image Limit (MB)", placeholder: "20", icon: HardDrive };

      default: return { label: key.replace(/_/g, " ").toUpperCase(), placeholder: "", icon: Sliders };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 bg-white border border-slate-200 rounded-2xl shadow-3xs" id="settings-loading-view">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500 font-sans tracking-wide">Retrieving secure platform configuration keys...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start font-sans" id="saas-platform-settings-grid">
      {/* 1. LEFT SIDEBAR NAVIGATION GROUPS */}
      <div className="lg:col-span-1 space-y-1.5" id="settings-sidebar-nav">
        {SETTING_GROUPS.map(g => {
          const Icon = g.icon;
          const isActive = activeGroup === g.id;
          return (
            <button
              key={g.id}
              onClick={() => setActiveGroup(g.id)}
              className={`w-full text-left p-4 rounded-xl flex items-center gap-3.5 transition-all duration-150 cursor-pointer border ${
                isActive 
                  ? "bg-indigo-600 border-indigo-700 text-white shadow-md font-extrabold" 
                  : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-normal uppercase tracking-wider">{g.label}</p>
                <p className={`text-[10px] truncate mt-0.5 ${isActive ? "text-indigo-200" : "text-slate-400"}`}>{g.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. RIGHT FORM EDITOR VIEW */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-3xs overflow-hidden" id="settings-editor-container">
        
        {/* Header summary of current group */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              {SETTING_GROUPS.find(g => g.id === activeGroup)?.label}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {SETTING_GROUPS.find(g => g.id === activeGroup)?.description}
            </p>
          </div>
          {activeGroup !== "ADVANCED" && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "Replicating..." : "Save Settings"}</span>
            </button>
          )}
        </div>

        {/* Content Panel */}
        <div className="p-6" id="settings-fields-area">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs font-bold text-red-900">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeGroup === "ADVANCED" ? (
            /* TECHNICAL GATEWAY INFRASTRUCTURE INFO SCREEN */
            <div className="space-y-6" id="advanced-ingress-view">
              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 flex items-start gap-4 text-xs">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-amber-950 uppercase tracking-wide">Developer & System Admin Console Area</h4>
                  <p className="text-amber-800 leading-normal">
                    This technical gateway telemetry area details live ingress routing ports and Nginx proxy setups. Modifying container configurations manually is restricted to maintain locked sandbox encapsulation rules.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs mb-3 uppercase tracking-wider">Workspace Ingress Protocol</h4>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs leading-relaxed text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Strict cluster tenant sandboxing</span>
                      <span className="text-emerald-700 font-bold uppercase text-[9px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Active Enforced</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Dynamic sub-domain DNS schemas</span>
                      <span className="text-emerald-700 font-bold uppercase text-[9px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Active Enforced</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Automated SSL Handshake CNAME mappings</span>
                      <span className="text-emerald-700 font-bold uppercase text-[9px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Live Active</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs mb-3 uppercase tracking-wider">Proxy Node Bindings</h4>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900">Sandbox Reverse Proxy</p>
                      <p className="text-slate-500 leading-normal">
                        All incoming traffic binds directly to host <code className="font-mono bg-slate-200 text-slate-700 px-1 py-0.5 rounded">0.0.0.0</code> on core listening container ingress port <code className="font-mono bg-slate-200 text-slate-700 px-1 py-0.5 rounded">3000</code>.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex items-center gap-2 text-slate-400 font-mono text-[10px]">
                      <Server className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>BhoomiOne Core Proxy Daemon v5.21 (Staging-01)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* DYNAMIC FORM ROW GENERATION */
            <div className="space-y-6">
              {filteredSettings.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-medium text-xs">
                  No configuration keys have been initialized for this group.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredSettings.map(s => {
                    const info = getSettingLabelAndIcon(s.settingKey);
                    const RowIcon = info.icon;

                    return (
                      <div key={s.settingKey} className="p-4 bg-slate-50/50 border border-slate-100 hover:border-slate-200 rounded-xl transition-all space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2.5 mb-2.5">
                            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-650 shrink-0">
                              <RowIcon className="w-3.5 h-3.5" />
                            </div>
                            <label className="block text-xs font-bold text-slate-750 uppercase tracking-wide">
                              {info.label}
                            </label>
                          </div>

                          {s.settingType === "boolean" ? (
                            <div className="flex items-center gap-3 mt-1.5">
                              <input 
                                type="checkbox"
                                id={`check-${s.settingKey}`}
                                checked={s.settingValue === "true" || s.settingValue === "1"}
                                onChange={(e) => handleValueChange(s.settingKey, e.target.checked ? "true" : "false")}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                              />
                              <span className="text-xs text-slate-600">
                                {s.settingValue === "true" || s.settingValue === "1" ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                          ) : (
                            <input 
                              type={s.settingType === "number" ? "number" : "text"}
                              value={s.settingValue || ""}
                              onChange={(e) => handleValueChange(s.settingKey, e.target.value)}
                              placeholder={info.placeholder}
                              className="w-full px-3.5 py-2 border border-slate-200 bg-white hover:border-slate-350 focus:border-indigo-500 text-xs rounded-lg transition-all focus:ring-1 focus:ring-indigo-500/10 font-sans outline-hidden text-slate-800"
                            />
                          )}
                        </div>

                        <div className="pt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-mono tracking-tight select-none">
                          <span>Key: {s.settingKey}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider ${s.isPublic ? "bg-teal-50 text-teal-700 border border-teal-100" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                            {s.isPublic ? "Public API" : "Secure Server"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom notification */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/40 p-4 rounded-xl text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span>Always save each tab category individually before switching groups to prevent losing uncommitted edits.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
