import React, { useState, useEffect } from "react";
import { 
  Globe, Shield, CreditCard, Mail, HardDrive, Sliders, Server, 
  Save, AlertCircle, RefreshCw, CheckCircle2, Info, Building2, Phone, FileText, Lock,
  Star, Tag, Terminal, Activity, Zap, Plus, Play, Send, Check, X, Key
} from "lucide-react";
import { api } from "../../lib/api";
import { EnterpriseTaxConsole } from "./EnterpriseTaxConsole";
import { EmailServiceConsole } from "./EmailServiceConsole";
import { NotificationEngineConsole } from "./NotificationEngineConsole";
import { PromoCouponsConsole } from "./PromoCouponsConsole";
import { ActiveCampaignsConsole } from "./ActiveCampaignsConsole";

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
  { id: "GST", label: "GST & Tax Configuration", icon: FileText, description: "Manage central GST, TDS, stamp duties, and builder overrides." },
  { id: "BILLING", label: "Billing & Gateway", icon: CreditCard, description: "Configure payment gateways, test credentials, and logs." },
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
    groups: ["BILLING", "COUPONS", "PROMOTIONS", "CURRENCY", "GST"]
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
}) => {
  const [activeGroup, setActiveGroup] = useState<string>("GENERAL");
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Gateway related state
  const [gateways, setGateways] = useState<any[]>([]);
  const [activeGatewayCode, setActiveGatewayCode] = useState<string>("RAZORPAY");
  const [paymentLogs, setPaymentLogs] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [subTab, setSubTab] = useState<"gateways" | "transactions" | "webhooks">("gateways");
  const [gatewaysLoading, setGatewaysLoading] = useState<boolean>(false);

  // Modal simulation inputs
  const [showTestPaymentModal, setShowTestPaymentModal] = useState<boolean>(false);
  const [testAmount, setTestAmount] = useState<number>(2490);
  const [testEmail, setTestEmail] = useState<string>("owner@developer1.com");
  
  const [showWebhookModal, setShowWebhookModal] = useState<boolean>(false);
  const [webhookEvent, setWebhookEvent] = useState<string>("payment.authorized");
  const [webhookPayload, setWebhookPayload] = useState<string>('{"event": "payment.authorized", "id": "pay_test_99"}');

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeGroup === "BILLING") {
      loadGatewaysData();
    }
  }, [activeGroup]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchSaasSettings();
      const formatted = data.map((item: any) => ({
        id: item.id,
        settingGroup: item.settingGroup || item.setting_group || "GENERAL",
        settingKey: item.settingKey || item.setting_key || "",
        settingValue: item.settingValue !== undefined ? item.settingValue : (item.setting_value !== undefined ? item.setting_value : null),
        settingType: item.settingType || item.setting_type || "string",
        isPublic: item.isPublic !== undefined ? !!item.isPublic : (item.is_public !== undefined ? !!item.is_public : false)
      }));

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

  const loadGatewaysData = async () => {
    setGatewaysLoading(true);
    try {
      const gList = await api.fetchGateways();
      setGateways(gList);
      
      const pLogs = await api.fetchPaymentLogs();
      setPaymentLogs(pLogs);
      
      const wLogs = await api.fetchWebhookLogs();
      setWebhookLogs(wLogs);
    } catch (err) {
      console.error("Failed to load gateway details:", err);
    } finally {
      setGatewaysLoading(false);
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

  // Gateway Field Changes
  const handleGatewayFieldChange = (field: string, value: any) => {
    setGateways(prev => prev.map(g => {
      if (g.gatewayCode === activeGatewayCode) {
        return { ...g, [field]: value };
      }
      return g;
    }));
  };

  const handleSaveGateways = async () => {
    setSaving(true);
    try {
      await api.saveGateways(gateways);
      onShowToast("Payment gateways configuration saved successfully.", "success");
      await loadGatewaysData();
    } catch (err: any) {
      onShowToast(err.message || "Failed to save payment gateway settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (code: string) => {
    try {
      const res = await api.testConnection(code);
      if (res.success) {
        onShowToast(res.message, "success");
      } else {
        onShowToast(res.message, "error");
      }
      await loadGatewaysData();
    } catch (err: any) {
      onShowToast(err.message || "Failed to test credentials.", "error");
    }
  };

  const handleExecuteTestPayment = async () => {
    try {
      const res = await api.testPayment(activeGatewayCode, testAmount, testEmail);
      if (res.success) {
        onShowToast(res.message, "success");
        setShowTestPaymentModal(false);
      } else {
        onShowToast(res.message, "error");
      }
      await loadGatewaysData();
    } catch (err: any) {
      onShowToast(err.message || "Failed to submit test charge.", "error");
    }
  };

  const handleSimulateWebhook = async () => {
    try {
      const res = await api.webhookVerify(activeGatewayCode, webhookEvent, webhookPayload);
      if (res.success) {
        onShowToast(res.message, "success");
        setShowWebhookModal(false);
      } else {
        onShowToast(res.message, "error");
      }
      await loadGatewaysData();
    } catch (err: any) {
      onShowToast(err.message || "Failed to dispatch test webhook.", "error");
    }
  };

  const handleRetryPayment = async (id: string) => {
    try {
      const res = await api.retryPayment(id);
      onShowToast(res.message, "success");
      await loadGatewaysData();
    } catch (err: any) {
      onShowToast(err.message || "Failed to clear transaction error.", "error");
    }
  };

  // Filter settings for currently active group
  const filteredSettings = settings.filter(s => s.settingGroup === activeGroup);

  const getSettingLabelAndIcon = (key: string) => {
    switch(key) {
      case "platform_name": return { label: "Platform Branding Name", placeholder: "e.g., BhoomiOne", icon: Sliders };
      case "support_email": return { label: "System Support Email Address", placeholder: "e.g., support@bhoomione.in", icon: Mail };
      case "support_phone": return { label: "System Support Phone Line", placeholder: "e.g., +91 98765 43210", icon: Phone };
      case "company_name": return { label: "Registered Corporate Entity", placeholder: "e.g., BhoomiOne Technologies Pvt Ltd", icon: Building2 };
      case "gst_number": return { label: "GST Identification Number (GSTIN)", placeholder: "e.g., 29AAAAA1111A1Z1", icon: FileText };
      case "corporate_address": return { label: "Registered Corporate Address", placeholder: "Full corporate address details", icon: Building2 };
      case "base_domain": return { label: "Core Workspace Base Domain", placeholder: "e.g., bhoomione.in", icon: Globe };
      case "admin_domain": return { label: "Super Admin Supervision Domain", placeholder: "e.g., admin.bhoomione.in", icon: Lock };
      case "customer_portal_pattern": return { label: "Customer Portal Route Schema Pattern", placeholder: "e.g., {{tenant}}.bhoomione.in/portal", icon: Globe };
      case "currency": return { label: "System Base Transaction Currency Code", placeholder: "e.g., INR", icon: CreditCard };
      case "currency_symbol": return { label: "Currency Prefix Symbol", placeholder: "e.g., ₹", icon: CreditCard };
      case "gst_percentage": return { label: "Default Service GST percentage (%)", placeholder: "18", icon: CreditCard };
      case "invoice_prefix": return { label: "Automated Invoice Prefix Code", placeholder: "BO-INV-", icon: FileText };
      case "default_trial_days": return { label: "Default Trial Span (Days)", placeholder: "14", icon: Sliders };
      case "grace_period_days": return { label: "Payment Overdue Grace Extension (Days)", placeholder: "7", icon: Sliders };
      case "smtp_host": return { label: "Primary SMTP Relaying Host", placeholder: "e.g., smtp.mailgun.org", icon: Mail };
      case "smtp_port": return { label: "SMTP Communication Port", placeholder: "e.g., 587", icon: Mail };
      case "smtp_user": return { label: "SMTP Username Access ID", placeholder: "postmaster@bhoomione.in", icon: Mail };
      case "whatsapp_provider": return { label: "Primary WhatsApp Business API Gateway", placeholder: "e.g., Twilio", icon: Phone };
      case "whatsapp_auth_token": return { label: "WhatsApp Token Signature Key", placeholder: "Authentication token key", icon: Lock };
      case "sms_provider": return { label: "Primary Transactional SMS Provider", placeholder: "e.g., Twilio, Plivo", icon: Phone };
      case "sms_sender_id": return { label: "SMS Broadcast Sender Identification (6 chars)", placeholder: "BHOOMI", icon: Phone };
      case "reminder_days_before_renewal": return { label: "First Renewal Reminder Alert (Days Before Due)", placeholder: "7", icon: Sliders };
      case "overdue_reminder_days": return { label: "Overdue Reminder Frequency (Days)", placeholder: "3", icon: Sliders };
      case "session_timeout": return { label: "Idle Administrator Session Expiry (Minutes)", placeholder: "120", icon: Sliders };
      case "password_policy": return { label: "Minimum Passphrase Policy Grade", placeholder: "STRONG", icon: Shield };
      case "mfa_required": return { label: "Enforce Multi-Factor Authentication (MFA)", placeholder: "false", icon: Lock };
      case "audit_retention_days": return { label: "System Compliance Logs Retention Span (Days)", placeholder: "365", icon: FileText };
      case "default_storage_gb": return { label: "Default Plan Disk Allocation Quota (GB)", placeholder: "10", icon: HardDrive };
      case "max_upload_size_mb": return { label: "Max Raw File Attachment Multi-part Limit (MB)", placeholder: "100", icon: HardDrive };
      case "database_engine": return { label: "Target SaaS Relational Database", placeholder: "PostgreSQL", icon: Server };
      case "cache_driver": return { label: "SaaS Caching Microservice", placeholder: "Redis", icon: Server };
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

  const activeGateway = gateways.find(g => g.gatewayCode === activeGatewayCode) || gateways[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start font-sans animate-fade-in" id="saas-platform-settings-grid">
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
                        : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
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
          {activeGroup !== "ADVANCED" && activeGroup !== "BILLING" && activeGroup !== "GST" && activeGroup !== "EMAIL" && activeGroup !== "NOTIFICATIONS" && activeGroup !== "WHATSAPP" && activeGroup !== "SMS" && activeGroup !== "COUPONS" && activeGroup !== "PROMOTIONS" && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
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

          {activeGroup === "GST" ? (
            <EnterpriseTaxConsole onShowToast={onShowToast} />
          ) : activeGroup === "EMAIL" ? (
            <EmailServiceConsole onShowToast={onShowToast} />
          ) : activeGroup === "COUPONS" ? (
            <PromoCouponsConsole onShowToast={onShowToast} />
          ) : activeGroup === "PROMOTIONS" ? (
            <ActiveCampaignsConsole onShowToast={onShowToast} />
          ) : (activeGroup === "NOTIFICATIONS" || activeGroup === "WHATSAPP" || activeGroup === "SMS") ? (
            <NotificationEngineConsole onShowToast={onShowToast} />
          ) : activeGroup === "BILLING" ? (
            <div className="space-y-6" id="settings-billing-view">
              {/* SUB-TABS TO TOGGLE GATEWAY SETUP vs LOGS */}
              <div className="flex border-b border-slate-200 gap-1 select-none">
                <button 
                  onClick={() => setSubTab("gateways")}
                  className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wide border-b-2 transition-all cursor-pointer ${
                    subTab === "gateways" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Gateway Configurations
                </button>
                <button 
                  onClick={() => setSubTab("transactions")}
                  className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wide border-b-2 transition-all cursor-pointer ${
                    subTab === "transactions" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Transaction Logs
                </button>
                <button 
                  onClick={() => setSubTab("webhooks")}
                  className={`px-4 py-2 text-xs font-extrabold uppercase tracking-wide border-b-2 transition-all cursor-pointer ${
                    subTab === "webhooks" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Webhook Verifications
                </button>
              </div>

              {gatewaysLoading ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                  <p className="text-[11px] font-bold text-slate-500">Loading live gateway telemetry...</p>
                </div>
              ) : subTab === "gateways" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  
                  {/* Left Gateways list */}
                  <div className="md:col-span-1 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gateway Registry</p>
                    <div className="space-y-1.5">
                      {gateways.map(g => {
                        const isSel = activeGatewayCode === g.gatewayCode;
                        return (
                          <button
                            key={g.gatewayCode}
                            onClick={() => setActiveGatewayCode(g.gatewayCode)}
                            className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                              isSel 
                                ? "bg-slate-55 border-indigo-200 ring-2 ring-indigo-500/10" 
                                : "bg-white border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">{g.name}</p>
                              <p className="text-[9px] font-mono text-slate-400 mt-0.5">{g.gatewayCode}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {g.isDefault && (
                                <span className="text-[7.5px] font-black uppercase bg-indigo-50 border border-indigo-200 text-indigo-750 px-1 py-0.5 rounded">Default</span>
                              )}
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                                g.isEnabled ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-400 border border-slate-200"
                              }`}>
                                {g.isEnabled ? "Enabled" : "Off"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Gateway Config Form */}
                  {activeGateway ? (
                    <div className="md:col-span-2 space-y-5 bg-slate-50/50 p-5 border border-slate-200 rounded-2xl">
                      
                      {/* Active Gateway Heading */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200">
                        <div>
                          <h4 className="text-sm font-extrabold text-indigo-950 uppercase tracking-wider">{activeGateway.name} Credentials</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">Define sandbox/production environments and API credentials securely.</p>
                        </div>
                        <span className={`text-[9px] font-black border uppercase px-2 py-0.5 rounded-full ${
                          activeGateway.status === 'ACTIVE' ? "bg-emerald-50 border-emerald-200 text-emerald-850" : "bg-amber-50 border-amber-200 text-amber-850"
                        }`}>
                          Health: {activeGateway.status}
                        </span>
                      </div>

                      {/* Config Form Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Enabled Switch */}
                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Activation State</label>
                          <div className="flex items-center gap-3 pt-1">
                            <input 
                              type="checkbox" 
                              checked={activeGateway.isEnabled}
                              onChange={(e) => handleGatewayFieldChange("isEnabled", e.target.checked)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                            />
                            <span className="font-extrabold text-slate-800">{activeGateway.isEnabled ? "Enabled & Live" : "Deactivated"}</span>
                          </div>
                        </div>

                        {/* Sandbox / Production */}
                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Execution Mode</label>
                          <select
                            value={activeGateway.environment}
                            onChange={(e) => handleGatewayFieldChange("environment", e.target.value)}
                            className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs text-slate-800 outline-hidden font-bold"
                          >
                            <option value="SANDBOX">SANDBOX (Sandbox/Test)</option>
                            <option value="PRODUCTION">PRODUCTION (Production)</option>
                          </select>
                        </div>

                        {/* API Key */}
                        {activeGateway.gatewayCode !== "MANUAL" && activeGateway.gatewayCode !== "BANK_TRANSFER" && (
                          <>
                            <div className="md:col-span-2 p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                              <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block flex items-center gap-1">
                                <Key className="w-3.5 h-3.5 text-slate-400" />
                                <span>API Client Key</span>
                              </label>
                              <input 
                                type="text"
                                value={activeGateway.apiKey || ""}
                                onChange={(e) => handleGatewayFieldChange("apiKey", e.target.value)}
                                placeholder="rzp_test_..."
                                className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded font-mono text-xs text-slate-800 outline-hidden"
                              />
                            </div>

                            {/* Secret Key */}
                            <div className="md:col-span-2 p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                              <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block flex items-center gap-1">
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                <span>API Secret Key</span>
                              </label>
                              <input 
                                type="password"
                                value={activeGateway.secretKey || ""}
                                onChange={(e) => handleGatewayFieldChange("secretKey", e.target.value)}
                                placeholder="••••••••••••••••••••••••"
                                className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded font-mono text-xs text-slate-800 outline-hidden"
                              />
                            </div>

                            {/* Webhook Secret */}
                            <div className="md:col-span-2 p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                              <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block flex items-center gap-1">
                                <Globe className="w-3.5 h-3.5 text-slate-400" />
                                <span>Webhook Verification Secret Signature</span>
                              </label>
                              <input 
                                type="text"
                                value={activeGateway.webhookSecret || ""}
                                onChange={(e) => handleGatewayFieldChange("webhookSecret", e.target.value)}
                                placeholder="whsec_..."
                                className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded font-mono text-xs text-slate-800 outline-hidden"
                              />
                            </div>
                          </>
                        )}

                        {/* Base Currency */}
                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Default Currency Code</label>
                          <select
                            value={activeGateway.currency}
                            onChange={(e) => handleGatewayFieldChange("currency", e.target.value)}
                            className="w-full mt-1 px-2.5 py-1.5 border border-slate-200 rounded bg-white text-xs text-slate-800 outline-hidden font-bold"
                          >
                            <option value="INR">INR (₹)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                          </select>
                        </div>

                        {/* Set Default */}
                        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Priority Rank</label>
                          <div className="flex items-center gap-3 pt-1">
                            <input 
                              type="checkbox" 
                              checked={activeGateway.isDefault}
                              onChange={(e) => {
                                // Clear default from others, set to active
                                setGateways(prev => prev.map(g => ({
                                  ...g,
                                  isDefault: g.gatewayCode === activeGatewayCode ? e.target.checked : false
                                })));
                              }}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                            />
                            <span className="font-extrabold text-slate-800">{activeGateway.isDefault ? "Primary Default Gateway" : "Fallback Secondary"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons bar */}
                      <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-2.5 justify-between">
                        <button
                          onClick={handleSaveGateways}
                          disabled={saving}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          <span>Save Config</span>
                        </button>

                        <div className="flex gap-2">
                          {activeGateway.gatewayCode !== "MANUAL" && activeGateway.gatewayCode !== "BANK_TRANSFER" && (
                            <>
                              <button
                                onClick={() => handleTestConnection(activeGateway.gatewayCode)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border border-slate-300"
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                <span>Test Connection</span>
                              </button>
                              <button
                                onClick={() => {
                                  setTestAmount(2490);
                                  setShowTestPaymentModal(true);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border border-slate-300"
                              >
                                <Play className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Test Charge</span>
                              </button>
                              <button
                                onClick={() => {
                                  setWebhookEvent("payment.authorized");
                                  setWebhookPayload(JSON.stringify({ event: "payment.authorized", amount: 249000, id: "pay_test_" + Math.floor(Math.random()*1000) }));
                                  setShowWebhookModal(true);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border border-slate-300"
                              >
                                <Send className="w-3.5 h-3.5 text-teal-500" />
                                <span>Simulate Webhook</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                    </div>
                  ) : null}

                </div>
              ) : subTab === "transactions" ? (
                /* TRANSACTION LOGS LIST */
                <div className="space-y-3" id="payment-logs-view">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Historical Transactions Ledger (Latest 100)</p>
                    <button 
                      onClick={loadGatewaysData}
                      className="text-[10px] text-indigo-600 hover:text-indigo-850 font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {paymentLogs.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-sans">
                      No transactions have been logged in this sandbox environment yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200 select-none">
                          <tr>
                            <th className="p-3">Gateway</th>
                            <th className="p-3">Transaction ID</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Customer Email</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Timestamp</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paymentLogs.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-extrabold text-slate-800">{l.gatewayName}</td>
                              <td className="p-3 font-mono text-[11px] text-slate-500">{l.transactionId || "N/A"}</td>
                              <td className="p-3 font-mono font-bold text-slate-800">{l.currency} {l.amount?.toFixed(2)}</td>
                              <td className="p-3 text-slate-600">{l.customerEmail}</td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  <span className={`inline-block text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    l.status === 'SUCCESS' ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-red-50 text-red-800 border border-red-100"
                                  }`}>
                                    {l.status}
                                  </span>
                                  {l.errorMessage && (
                                    <p className="text-[9px] text-red-500 font-sans leading-tight font-medium max-w-xs">{l.errorMessage}</p>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-[10px] text-slate-450 font-mono">
                                {l.createdAt ? new Date(l.createdAt).toLocaleString() : "N/A"}
                              </td>
                              <td className="p-3 text-right">
                                {l.status === 'FAILED' && (
                                  <button
                                    onClick={() => handleRetryPayment(l.id)}
                                    className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-750 text-[9.5px] font-black uppercase px-2 py-1 rounded transition-all cursor-pointer"
                                  >
                                    Retry Charge
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              ) : (
                /* WEBHOOK LOGS LIST */
                <div className="space-y-3" id="webhook-logs-view">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Dynamic Webhook Receipts Logs (Latest 100)</p>
                    <button 
                      onClick={loadGatewaysData}
                      className="text-[10px] text-indigo-600 hover:text-indigo-850 font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {webhookLogs.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-sans">
                      No webhooks have been captured in this sandbox session yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-200 select-none">
                          <tr>
                            <th className="p-3">Gateway</th>
                            <th className="p-3">Event Type</th>
                            <th className="p-3">Payload Data Summary</th>
                            <th className="p-3">Verification</th>
                            <th className="p-3">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {webhookLogs.map(w => (
                            <tr key={w.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-extrabold text-slate-800">{w.gatewayName}</td>
                              <td className="p-3 font-mono text-[11px] text-indigo-700">{w.eventType}</td>
                              <td className="p-3 font-mono text-[10.5px] text-slate-500 truncate max-w-xs">
                                {w.payload}
                              </td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  <span className={`inline-block text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    w.status === 'VERIFIED' || w.status === 'PROCESSED' 
                                      ? "bg-emerald-50 text-emerald-850 border border-emerald-100" 
                                      : "bg-red-50 text-red-850 border border-red-100"
                                  }`}>
                                    {w.status}
                                  </span>
                                  {w.errorMessage && (
                                    <p className="text-[9px] text-red-500 font-sans leading-tight font-medium max-w-xs">{w.errorMessage}</p>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-[10px] text-slate-450 font-mono">
                                {w.createdAt ? new Date(w.createdAt).toLocaleString() : "N/A"}
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
          ) : (
            /* GENERAL DYNAMIC FORM ROW GENERATION */
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

      {/* 3. TEST CHARGE SIMULATOR MODAL */}
      {showTestPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden font-sans">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Test Payment Gateway Simulation</h3>
              <button 
                onClick={() => setShowTestPaymentModal(false)}
                className="text-slate-400 hover:text-slate-650 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4 text-xs text-slate-700">
              <p className="leading-relaxed">This simulates creating a real-time card or net banking payment payload over secure production sockets.</p>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Target Gateway</label>
                <p className="font-extrabold text-slate-800 bg-slate-100 border p-2.5 rounded-lg uppercase tracking-wider text-[11px]">{activeGateway.name} ({activeGateway.environment})</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Billing Charge Amount ({activeGateway.currency})</label>
                <input 
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs outline-hidden"
                />
                <p className="text-[9px] text-slate-400 italic">Amounts greater than or equal to 1,000,000 simulate transaction limit failures.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Customer Billing Email</label>
                <input 
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="customer@bhoomione.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs outline-hidden"
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-150 bg-slate-55 flex justify-end gap-2 text-xs">
              <button 
                onClick={() => setShowTestPaymentModal(false)}
                className="px-3.5 py-1.5 border border-slate-250 hover:bg-slate-100 rounded text-slate-655 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleExecuteTestPayment}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulate Charge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SIMULATE WEBHOOK MODAL */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-sans">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Simulate REST Webhook Webhook Payload</h3>
              <button 
                onClick={() => setShowWebhookModal(false)}
                className="text-slate-400 hover:text-slate-650 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4 text-xs text-slate-700">
              <p className="leading-relaxed">This simulates a live server-to-server HTTP webhook payload post sent directly to platform listener routes.</p>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Origin Gateway</label>
                <p className="font-extrabold text-slate-800 bg-slate-100 border p-2.5 rounded-lg uppercase tracking-wider text-[11px]">{activeGateway.name}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">Webhook Callback Event Type</label>
                <input 
                  type="text"
                  value={webhookEvent}
                  onChange={(e) => setWebhookEvent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs outline-hidden font-mono text-indigo-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">JSON Payload Body</label>
                <textarea 
                  value={webhookPayload}
                  rows={4}
                  onChange={(e) => setWebhookPayload(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs outline-hidden font-mono text-[11px] text-slate-600 bg-slate-50"
                />
                <p className="text-[9px] text-slate-400 italic">Adding the word "fail" or "invalid" into the payload body simulates verification failures.</p>
              </div>
            </div>

            <div className="p-5 border-t border-slate-150 bg-slate-55 flex justify-end gap-2 text-xs">
              <button 
                onClick={() => setShowWebhookModal(false)}
                className="px-3.5 py-1.5 border border-slate-250 hover:bg-slate-100 rounded text-slate-655 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSimulateWebhook}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Callback</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
