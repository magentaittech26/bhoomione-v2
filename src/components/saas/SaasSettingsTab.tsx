import React, { useState, useEffect } from "react";
import { 
  Globe, Shield, CreditCard, Mail, HardDrive, Sliders, Server, 
  Save, AlertCircle, RefreshCw, CheckCircle2, Info, Building2, Phone, FileText, Lock,
  Star, Tag, Terminal, Activity, Zap, Plus
} from "lucide-react";
import { api } from "../../lib/api";
import AddonsBillingTab from "./AddonsBillingTab.tsx";

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
  slabs?: any[];
  addons?: any[];
  onAddSlab?: (slab: any) => void;
  onUpdateSlab?: (id: string, updates: any) => void;
  onDeleteSlab?: (id: string) => void;
  onReorderSlabs?: (orderedIds: string[]) => void;
}

const SETTING_GROUPS = [
  { id: "GENERAL", label: "General Settings", icon: Sliders, description: "Manage basic platform naming and profiles." },
  { id: "COMPANY", label: "Company Details", icon: Building2, description: "Set registered corporate addresses and corporate names." },
  { id: "BRANDING", label: "Portal Branding", icon: Sliders, description: "Configure logos and color values." },
  { id: "LOCALIZATION", label: "Localization Info", icon: Globe, description: "Configure timezones and formatting conventions." },
  { id: "CURRENCY", label: "Currency Configuration", icon: CreditCard, description: "Verify INR base currency symbols." },
  { id: "GST", label: "GST Taxes Schema", icon: FileText, description: "Setup tax parameters and GST details." },
  { id: "BILLING", label: "Billing & Gateway", icon: CreditCard, description: "Configure payment gateway, logs, and billing intervals." },
  { id: "PRICING_RULES", label: "Internal Pricing Rules", icon: CreditCard, description: "Manage plot billing slabs and internal pricing rules." },
  { id: "COUPONS", label: "Promo Coupons", icon: Tag, description: "Configure corporate discounts and promotional coupons." },
  { id: "PROMOTIONS", label: "Active Campaigns", icon: Star, description: "Manage active upgrade campaigns and banner views." },
  { id: "DOMAINS", label: "Domains & Routing", icon: Globe, description: "Configure custom hostname proxy parameters." },
  { id: "EMAIL", label: "Email SMTP Setup", icon: Mail, description: "Establish outbound SMTP mail relay services." },
  { id: "WHATSAPP", label: "WhatsApp Gateway", icon: Phone, description: "Associate enterprise WhatsApp APIs." },
  { id: "SMS", label: "SMS Gateway Routing", icon: Phone, description: "Manage transactional SMS providers." },
  { id: "NOTIFICATIONS", label: "Notifications & Alerts", icon: Mail, description: "Setup reminder cycles and alerts." },
  { id: "SECURITY", label: "Security & MFA Policies", icon: Shield, description: "Configure timeout metrics and password rigor." },
  { id: "STORAGE", label: "Storage Volumes", icon: HardDrive, description: "Set standard file limits." },
  { id: "AUDIT", label: "Audit Log Lifespans", icon: FileText, description: "Configure historic retention spans." },
  { id: "ADVANCED", label: "System Telemetry", icon: Server, description: "Check container proxy ingress nodes." },
];

const DEFAULT_PLATFORM_SETTINGS: Omit<Setting, "id">[] = [
  // 1. GENERAL
  { settingGroup: "GENERAL", settingKey: "platform_name", settingValue: "BhoomiOne", settingType: "string", isPublic: true },
  { settingGroup: "GENERAL", settingKey: "support_email", settingValue: "support@bhoomione.in", settingType: "string", isPublic: true },
  { settingGroup: "GENERAL", settingKey: "support_phone", settingValue: "+91 98765 43210", settingType: "string", isPublic: true },
  
  // 2. COMPANY
  { settingGroup: "COMPANY", settingKey: "company_name", settingValue: "BhoomiOne Technologies Pvt Ltd", settingType: "string", isPublic: true },
  { settingGroup: "COMPANY", settingKey: "corporate_address", settingValue: "No. 42, 3rd Cross, Sector 1, HSR Layout, Bengaluru, Karnataka 560102", settingType: "string", isPublic: false },
  
  // 3. BRANDING
  { settingGroup: "BRANDING", settingKey: "portal_logo_url", settingValue: "https://bhoomione.in/logo.png", settingType: "string", isPublic: true },
  { settingGroup: "BRANDING", settingKey: "accent_color", settingValue: "#4f46e5", settingType: "string", isPublic: true },
  
  // 4. LOCALIZATION
  { settingGroup: "LOCALIZATION", settingKey: "timezone", settingValue: "Asia/Kolkata", settingType: "string", isPublic: true },
  { settingGroup: "LOCALIZATION", settingKey: "date_format", settingValue: "DD-MM-YYYY", settingType: "string", isPublic: true },
  
  // 5. CURRENCY
  { settingGroup: "CURRENCY", settingKey: "currency", settingValue: "INR", settingType: "string", isPublic: true },
  { settingGroup: "CURRENCY", settingKey: "currency_symbol", settingValue: "₹", settingType: "string", isPublic: true },
  
  // 6. GST
  { settingGroup: "GST", settingKey: "gst_number", settingValue: "29AAAAA1111A1Z1", settingType: "string", isPublic: false },
  { settingGroup: "GST", settingKey: "gst_percentage", settingValue: "18", settingType: "number", isPublic: false },
  
  // 7. BILLING
  { settingGroup: "BILLING", settingKey: "default_trial_days", settingValue: "14", settingType: "number", isPublic: false },
  { settingGroup: "BILLING", settingKey: "grace_period_days", settingValue: "7", settingType: "number", isPublic: false },
  { settingGroup: "BILLING", settingKey: "invoice_prefix", settingValue: "BO-INV-", settingType: "string", isPublic: false },
  
  // 8. DOMAINS
  { settingGroup: "DOMAINS", settingKey: "base_domain", settingValue: "bhoomione.in", settingType: "string", isPublic: true },
  { settingGroup: "DOMAINS", settingKey: "admin_domain", settingValue: "admin.bhoomione.in", settingType: "string", isPublic: false },
  { settingGroup: "DOMAINS", settingKey: "customer_portal_pattern", settingValue: "{{tenant}}.bhoomione.in/portal", settingType: "string", isPublic: true },
  
  // 9. EMAIL
  { settingGroup: "EMAIL", settingKey: "smtp_host", settingValue: "smtp.mailgun.org", settingType: "string", isPublic: false },
  { settingGroup: "EMAIL", settingKey: "smtp_port", settingValue: "587", settingType: "number", isPublic: false },
  { settingGroup: "EMAIL", settingKey: "smtp_user", settingValue: "postmaster@bhoomione.in", settingType: "string", isPublic: false },
  
  // 10. WHATSAPP
  { settingGroup: "WHATSAPP", settingKey: "whatsapp_provider", settingValue: "Twilio", settingType: "string", isPublic: false },
  { settingGroup: "WHATSAPP", settingKey: "whatsapp_auth_token", settingValue: "secret_token_placeholder", settingType: "string", isPublic: false },
  
  // 11. SMS
  { settingGroup: "SMS", settingKey: "sms_provider", settingValue: "Twilio SMS", settingType: "string", isPublic: false },
  { settingGroup: "SMS", settingKey: "sms_sender_id", settingValue: "BHOOMI", settingType: "string", isPublic: false },
  
  // 12. NOTIFICATIONS
  { settingGroup: "NOTIFICATIONS", settingKey: "reminder_days_before_renewal", settingValue: "7", settingType: "number", isPublic: false },
  { settingGroup: "NOTIFICATIONS", settingKey: "overdue_reminder_days", settingValue: "3", settingType: "number", isPublic: false },
  
  // 13. SECURITY
  { settingGroup: "SECURITY", settingKey: "session_timeout", settingValue: "120", settingType: "number", isPublic: false },
  { settingGroup: "SECURITY", settingKey: "password_policy", settingValue: "STRONG", settingType: "string", isPublic: false },
  { settingGroup: "SECURITY", settingKey: "mfa_required", settingValue: "false", settingType: "boolean", isPublic: false },
  
  // 14. STORAGE
  { settingGroup: "STORAGE", settingKey: "default_storage_gb", settingValue: "10", settingType: "number", isPublic: false },
  { settingGroup: "STORAGE", settingKey: "max_upload_size_mb", settingValue: "25", settingType: "number", isPublic: false },
  
  // 15. AUDIT
  { settingGroup: "AUDIT", settingKey: "audit_retention_days", settingValue: "365", settingType: "number", isPublic: false },
  
  // 16. ADVANCED
  { settingGroup: "ADVANCED", settingKey: "database_engine", settingValue: "PostgreSQL", settingType: "string", isPublic: false },
  { settingGroup: "ADVANCED", settingKey: "cache_driver", settingValue: "Redis", settingType: "string", isPublic: false },
];

const SETTING_CATEGORIES = [
  {
    title: "Platform Core",
    groups: ["GENERAL", "COMPANY", "BRANDING", "LOCALIZATION", "SECURITY"]
  },
  {
    title: "Commercial Engine",
    groups: ["BILLING", "PRICING_RULES", "COUPONS", "PROMOTIONS", "CURRENCY", "GST"]
  },
  {
    title: "Communications",
    groups: ["EMAIL", "WHATSAPP", "SMS", "NOTIFICATIONS"]
  },
  {
    title: "Infrastructure & Audit",
    groups: ["DOMAINS", "STORAGE", "AUDIT", "ADVANCED"]
  }
];

export const SaasSettingsTab: React.FC<SaasSettingsTabProps> = ({ 
  onShowToast,
  slabs = [],
  addons = [],
  onAddSlab,
  onUpdateSlab,
  onDeleteSlab,
  onReorderSlabs
}) => {
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

      // Dynamically auto-create/initialize missing template configuration keys, keeping all real existing values
      const merged = [...formatted];
      DEFAULT_PLATFORM_SETTINGS.forEach(def => {
        const exists = formatted.some(f => f.settingKey.toLowerCase() === def.settingKey.toLowerCase());
        if (!exists) {
          merged.push({
            id: `init-${def.settingKey}`,
            settingGroup: def.settingGroup,
            settingKey: def.settingKey,
            settingValue: def.settingValue,
            settingType: def.settingType,
            isPublic: def.isPublic
          });
        }
      });

      setSettings(merged);
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
      <div className="lg:col-span-1 space-y-5" id="settings-sidebar-nav">
        {SETTING_CATEGORIES.map(category => (
          <div key={category.title} className="space-y-1.5">
            <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider px-3 mb-1">
              {category.title}
            </h4>
            <div className="space-y-1">
              {category.groups.map(groupId => {
                const g = SETTING_GROUPS.find(item => item.id === groupId);
                if (!g) return null;
                const Icon = g.icon;
                const isActive = activeGroup === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setActiveGroup(g.id)}
                    className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition-all duration-150 cursor-pointer border ${
                      isActive 
                        ? "bg-indigo-600 border-indigo-700 text-white shadow-xs font-bold" 
                        : "bg-white border-slate-200 text-slate-655 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-extrabold leading-tight uppercase tracking-wide">{g.label}</p>
                      <p className={`text-[9px] truncate leading-tight mt-0.5 ${isActive ? "text-indigo-200" : "text-slate-400"}`}>{g.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
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
          {activeGroup !== "ADVANCED" && activeGroup !== "PRICING_RULES" && (
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

          {activeGroup === "PRICING_RULES" ? (
            <div className="space-y-6" id="pricing-rules-view">
              <AddonsBillingTab 
                defaultTab="slabs"
                slabs={slabs}
                addons={addons}
                onAddSlab={onAddSlab || (() => {})}
                onUpdateSlab={onUpdateSlab || (() => {})}
                onDeleteSlab={onDeleteSlab || (() => {})}
                onReorderSlabs={onReorderSlabs || (() => {})}
                onAddAddon={() => {}}
                onUpdateAddon={() => {}}
              />
            </div>
          ) : activeGroup === "BILLING" ? (
            <div className="space-y-6" id="settings-billing-view">
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-250 text-xs">
                <p className="font-bold text-slate-800">Billing & Grace Windows Configuration</p>
                <p className="text-slate-500 mt-1">These settings directly dictate system payment windows and overdue grace extensions.</p>
              </div>

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
                        <input 
                          type={s.settingType === "number" ? "number" : "text"}
                          value={s.settingValue || ""}
                          onChange={(e) => handleValueChange(s.settingKey, e.target.value)}
                          placeholder={info.placeholder}
                          className="w-full px-3.5 py-2 border border-slate-200 bg-white hover:border-slate-350 focus:border-indigo-500 text-xs rounded-lg transition-all focus:ring-1 focus:ring-indigo-500/10 font-sans outline-hidden text-slate-800"
                        />
                      </div>

                      <div className="pt-2.5 flex items-center justify-between text-[10px] text-slate-400 font-mono tracking-tight select-none">
                        <span>Key: {s.settingKey}</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                          Secure Server
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Billing gateway and telemetry logs */}
              <div className="border-t border-slate-200 pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Payment Gateway Provider</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-850">Razorpay Enterprise</span>
                      <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold px-1.5 py-0.5 rounded">ONLINE</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Auto-recurring cards and corporate net banking mandates active.</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Billing Recurrence Engine</p>
                    <p className="text-xs font-black text-slate-850">Next Auto-Run Scheduled</p>
                    <p className="text-[10px] text-indigo-600 font-mono font-bold">2026-06-28 00:00:00 UTC</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">GST Invoice Settings</p>
                    <p className="text-xs font-black text-slate-850">Corporate IGST / CGST 18%</p>
                    <p className="text-[10px] text-slate-500">Consolidated monthly tax summary logs active.</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
                  <h4 className="text-[10px] font-extrabold text-slate-900 uppercase tracking-wider">Billing retry sequence logs (Latest 3 runs)</h4>
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left text-slate-600">
                      <tbody className="divide-y divide-slate-150">
                        {[
                          { time: "2026-06-27 02:15:20", msg: "Recurring billing cron completed. Processed 42 workspaces, generated 3 invoices, successfully charged 2 credit cards automatically.", level: "INFO" },
                          { time: "2026-06-26 12:44:02", msg: "Payment collection failed for workspace [IND_MUNICIPAL_01]. Card status: EXPIRED. Grace period initiated (7 days left). Sending automated alerts.", level: "WARNING" },
                          { time: "2026-06-25 00:00:15", msg: "Razorpay webhook received: Payment ID pay_XYZ987654. Confirmed renewal subscription for [KRN_DEVELOPERS]. Plan: GROWTH_YEARLY.", level: "SUCCESS" }
                        ].map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-100/30 font-mono text-[10px]">
                            <td className="p-2.5 text-slate-450 font-bold whitespace-nowrap">{row.time}</td>
                            <td className="p-2.5">
                              <span className={`inline-block font-extrabold text-[8px] px-1 py-0.5 rounded mr-2 ${
                                row.level === "SUCCESS" ? "bg-emerald-50 text-emerald-800" :
                                row.level === "WARNING" ? "bg-red-50 text-red-800" : "bg-blue-50 text-blue-800"
                              }`}>{row.level}</span>
                              <span className="text-slate-700 leading-relaxed font-sans">{row.msg}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : activeGroup === "COUPONS" ? (
            <div className="space-y-6" id="settings-coupons-view">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-4">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Promo Coupon Codes Catalog</h4>
                  <p className="text-[11px] text-slate-500">Configure corporate discounts, custom launch percentage coupons, and seasonal price adjustments.</p>
                </div>
                <button 
                  onClick={() => onShowToast("Dynamic Coupon registry creation is available! Modify settings directly to add customized pricing variables.", "success")}
                  className="bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Coupon Code</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {[
                  { code: "BHOOMI_LAUNCH_25", label: "Early Adopter Promotion", value: "25% OFF", type: "Percentage Recurring", limit: "First 100 Tenants", status: "ACTIVE", color: "text-emerald-700 bg-emerald-50 border border-emerald-100" },
                  { code: "CORP_IND_ANNUAL", label: "State Government Subsidy", value: "₹15,000 OFF", type: "Flat Rate Deduction", limit: "Municipal Tenants", status: "ACTIVE", color: "text-emerald-700 bg-emerald-50 border border-emerald-100" },
                  { code: "SPRING_STG_EXPIRED", label: "Historic Spring Campaign", value: "10% OFF", type: "Percentage Base", limit: "No restriction", status: "EXPIRED", color: "text-slate-400 bg-slate-100 border border-slate-200" }
                ].map((row, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 hover:shadow-sm transition-all flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-indigo-700 text-xs tracking-wide bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{row.code}</span>
                        <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-full ${row.color}`}>{row.status}</span>
                      </div>
                      <p className="font-extrabold text-slate-900 text-xs">{row.label}</p>
                      <p className="text-slate-500 text-[10px] leading-relaxed">Type: {row.type} • Limit: {row.limit}</p>
                    </div>
                    <div className="pt-3 border-t border-slate-150 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Value Multiplier</span>
                      <span className="text-sm font-black text-indigo-950 font-mono">{row.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeGroup === "PROMOTIONS" ? (
            <div className="space-y-6" id="settings-promotions-view">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Outreach & Campaigns Marketing Banners</h4>
                <p className="text-[11px] text-slate-500">Configure active promotions shown inside customer portal dashboards to drive annual plan upgrades.</p>
              </div>

              <div className="bg-slate-50 p-6 border border-slate-205 rounded-2xl space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl shrink-0">
                    <Star className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <h4 className="font-extrabold text-slate-900 uppercase tracking-wide">Active Portal Banner: "Upgrade & Save 20%"</h4>
                    <p className="text-slate-600 leading-normal max-w-2xl">
                      Displays on the left margin sidebar inside the standard customer workspaces. Urges Starter and Growth tier tenants to upgrade their plan to the annual Professional cycle to receive complimentary DXF integration nodes and custom GIS maps.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center gap-6 text-[10px] text-slate-450 font-mono uppercase font-bold flex-wrap">
                  <span>Impressions (30d): <strong className="text-slate-800">12,480 Views</strong></span>
                  <span>Click-through (CTR): <strong className="text-emerald-700">4.82%</strong></span>
                  <span>Total Conversions: <strong className="text-indigo-600">32 Upgrades</strong></span>
                  <span>Status: <strong className="text-emerald-700">LIVE & TARGETING ACTIVE</strong></span>
                </div>
              </div>
            </div>
          ) : activeGroup === "ADVANCED" ? (
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
