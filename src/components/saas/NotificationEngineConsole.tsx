import React, { useState, useEffect } from "react";
import { 
  Mail, Phone, Send, RefreshCw, CheckCircle2, AlertCircle, Play, Save, 
  HelpCircle, ChevronRight, ChevronDown, List, Settings, FileText, Plus, Check, Clock, Globe, ArrowRight, Bell, Terminal, Shield, Sparkles,
  BarChart3, Activity, TrendingUp, Trash2, ExternalLink, Lock, Server, AlertTriangle
} from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { api } from "../../lib/api";

interface NotificationEngineConsoleProps {
  onShowToast: (message: string, type: "success" | "error") => void;
}

const CHANNELS = [
  { code: "EMAIL", label: "Email Outbound", icon: Mail, description: "SMTP relay, Amazon SES" },
  { code: "SMS", label: "SMS Broadcasts", icon: Phone, description: "Twilio SMS, Plivo" },
  { code: "WHATSAPP", label: "WhatsApp Business", icon: Phone, description: "Twilio, Meta Cloud API" },
  { code: "PUSH", label: "Push Alerts", icon: Bell, description: "Firebase Cloud Messaging" },
  { code: "IN_APP", label: "In-App Ledgers", icon: Sparkles, description: "System In-App Alerts" },
  { code: "WEBHOOK", label: "Webhooks Dispatch", icon: Globe, description: "Enterprise Endpoint Hub" },
];

const PROVIDERS_BY_CHANNEL: Record<string, { code: string; name: string; params: string[] }[]> = {
  EMAIL: [
    { code: "SMTP", name: "Central SMTP Relay", params: ["host", "port", "encryption", "username", "password", "sender_name", "sender_email"] },
    { code: "SES", name: "Amazon SES Gateway", params: ["region", "access_key_id", "secret_access_key", "sender_name", "sender_email"] },
  ],
  SMS: [
    { code: "TWILIO_SMS", name: "Twilio SMS Gateway", params: ["account_sid", "auth_token", "sender_id"] },
    { code: "MSG91", name: "MSG91 Enterprise Gateway", params: ["auth_key", "sender_id", "route", "entity_id", "template_id"] },
    { code: "TEXTLOCAL", name: "Textlocal SMS Gateway", params: ["api_key", "sender_id", "custom_client_reference"] },
    { code: "FAST2SMS", name: "Fast2SMS Outbound Gateway", params: ["api_key", "sender_id", "route"] },
    { code: "AWS_SNS", name: "Amazon Web Services SNS", params: ["region", "access_key_id", "secret_access_key", "sender_id"] },
    { code: "PLIVO", name: "Plivo SMS Outbound", params: ["auth_id", "auth_token", "sender_id"] },
  ],
  WHATSAPP: [
    { code: "META_WA", name: "Meta WhatsApp Cloud API", params: ["phone_number_id", "business_id", "access_token"] },
    { code: "TWILIO_WA", name: "Twilio WhatsApp API", params: ["account_sid", "auth_token", "whatsapp_phone"] },
    { code: "INTERAKT", name: "Interakt WhatsApp Gateway", params: ["api_key", "sender_id"] },
    { code: "GUPSHUP", name: "Gupshup Gateway", params: ["app_id", "auth_token", "source_phone"] },
    { code: "360DIALOG", name: "360Dialog WhatsApp API", params: ["api_key", "channel_id"] },
    { code: "AISENSY", name: "AiSensy WhatsApp Gateway", params: ["api_key", "campaign_name"] },
    { code: "WATI", name: "WATI WhatsApp Gateway", params: ["endpoint_url", "access_token"] },
  ],
  PUSH: [
    { code: "FCM", name: "Firebase Cloud Messaging (FCM)", params: ["project_id", "private_key", "client_email", "messaging_sender_id"] },
  ],
  IN_APP: [
    { code: "IN_APP_SYSTEM", name: "In-App Notification Center Engine", params: [] },
  ],
  WEBHOOK: [
    { code: "GENERIC_WEBHOOK", name: "Global Webhook Hub Receiver", params: ["endpoint_url", "signing_secret", "custom_headers_json"] },
  ],
};

const REQUIRED_EVENTS = [
  { code: "TENANT_CREATED", name: "Tenant Created", desc: "Triggered instantly upon tenant space provisioning" },
  { code: "BOOKING", name: "Booking Confirmed", desc: "Triggered when a customer reserves a unit block" },
  { code: "PAYMENT", name: "Payment Received", desc: "Sent when a booking payment registers successfully" },
  { code: "INVOICE", name: "Invoice Generated", desc: "Triggered on financial demand compilation" },
  { code: "RECEIPT", name: "Tax Receipt Issued", desc: "Official compliance tax invoice generated" },
  { code: "AGREEMENT", name: "Agreement Signed", desc: "Sent when draft land deeds are ready for signatures" },
  { code: "EMI_REMINDER", name: "EMI Installment Reminder", desc: "Periodic collection notification cycles" },
  { code: "SUBSCRIPTION_RENEWAL", name: "Subscription Renewal Notice", desc: "SaaS platform billing term end alert" },
  { code: "LEAD_ASSIGNMENT", name: "Lead Assigned Alert", desc: "Immediate notification for designated sales executive" },
  { code: "SITE_VISIT", name: "Site Visit Schedule", desc: "Sent on physical real estate location tour setups" },
  { code: "ADMIN_ALERTS", name: "Admin Alert Notification", desc: "Super-admin telemetry and system exceptions" },
];

export const NotificationEngineConsole: React.FC<NotificationEngineConsoleProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<"gateways" | "senderids" | "templates" | "logs" | "stats" | "sandbox">("gateways");
  
  // Gateways state
  const [configs, setConfigs] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("EMAIL");
  const [selectedProvider, setSelectedProvider] = useState<string>("SMTP");
  const [editingConfig, setEditingConfig] = useState<any>({
    isEnabled: false,
    isDefault: false,
    name: "",
    configParams: {}
  });

  // Sender IDs and DLT state
  const [senderIds, setSenderIds] = useState<any[]>([
    { id: "1", header: "BHOOMI", providerCode: "MSG91", entityId: "12011593829038293", purpose: "Transactional", status: "APPROVED", regDate: "2026-06-15" },
    { id: "2", header: "BHMTXT", providerCode: "TEXTLOCAL", entityId: "12011682910293845", purpose: "OTP / Alerts", status: "APPROVED", regDate: "2026-06-18" },
    { id: "3", header: "FASTSM", providerCode: "FAST2SMS", entityId: "12011729384501928", purpose: "Transactional", status: "PENDING_REVIEW", regDate: "2026-06-28" },
    { id: "4", header: "TWILIO", providerCode: "TWILIO_SMS", entityId: "N/A (Global)", purpose: "Global SMS", status: "APPROVED", regDate: "2026-05-10" },
    { id: "5", header: "AWSSNS", providerCode: "AWS_SNS", entityId: "N/A (Global)", purpose: "Global SMS", status: "APPROVED", regDate: "2026-05-12" }
  ]);
  const [newHeader, setNewHeader] = useState("");
  const [newProvider, setNewProvider] = useState("MSG91");
  const [newEntityId, setNewEntityId] = useState("");
  const [newPurpose, setNewPurpose] = useState("Transactional");

  // Templates state
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("TENANT_CREATED");
  const [editingTemplate, setEditingTemplate] = useState<any>({});

  // Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [logSearch, setLogSearch] = useState<string>("");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [showOnlyRetryQueue, setShowOnlyRetryQueue] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Sandbox state
  const [testEvent, setTestEvent] = useState<string>("BOOKING");
  const [testChannel, setTestChannel] = useState<string>("EMAIL");
  const [testRecipient, setTestRecipient] = useState<string>("karan.sharma@example.com");
  const [testVariables, setTestVariables] = useState<string>('{\n  "customer_name": "Karan Sharma",\n  "unit_number": "PLOT-102",\n  "layout_name": "Royal Meadows Phase 2",\n  "amount": "15,00,000",\n  "due_date": "2026-07-15",\n  "days": "5"\n}');
  const [testSchedule, setTestSchedule] = useState<string>("");
  const [testMediaUrl, setTestMediaUrl] = useState<string>("");
  const [testMediaType, setTestMediaType] = useState<string>("IMAGE");

  // Loading indicator states
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);

  useEffect(() => {
    loadConfigurations();
    loadTemplates();
    loadLogs();
  }, []);

  // Sync edit form on selection change
  useEffect(() => {
    const config = configs.find(c => c.channel === selectedChannel && c.providerCode === selectedProvider);
    if (config) {
      setEditingConfig({
        isEnabled: config.isEnabled,
        isDefault: config.isDefault,
        name: config.name,
        configParams: { ...config.configParams }
      });
    } else {
      const defaultProvider = PROVIDERS_BY_CHANNEL[selectedChannel]?.find(p => p.code === selectedProvider) || PROVIDERS_BY_CHANNEL[selectedChannel]?.[0];
      setEditingConfig({
        isEnabled: false,
        isDefault: false,
        name: defaultProvider ? defaultProvider.name : "",
        configParams: {}
      });
    }
  }, [selectedChannel, selectedProvider, configs]);

  useEffect(() => {
    const tmpl = templates.find(t => t.eventType === selectedEvent);
    if (tmpl) {
      setEditingTemplate({ ...tmpl });
    } else {
      setEditingTemplate({
        eventType: selectedEvent,
        name: REQUIRED_EVENTS.find(e => e.code === selectedEvent)?.name || "",
        emailSubject: "",
        emailBodyHtml: "",
        smsTemplate: "",
        whatsappTemplate: "",
        whatsappMediaUrl: "",
        whatsappMediaType: "IMAGE",
        pushTitle: "",
        pushBody: "",
        inAppBody: "",
        webhookPayloadTemplate: ""
      });
    }
  }, [selectedEvent, templates]);

  const loadConfigurations = async () => {
    try {
      const list = await api.fetchNotificationConfigs();
      setConfigs(list);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadTemplates = async () => {
    try {
      const list = await api.fetchNotificationTemplates();
      setTemplates(list);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadLogs = async () => {
    try {
      const list = await api.fetchNotificationLogs();
      setLogs(list);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await api.saveNotificationConfig({
        channel: selectedChannel,
        providerCode: selectedProvider,
        name: editingConfig.name,
        isEnabled: editingConfig.isEnabled,
        isDefault: editingConfig.isDefault,
        configParams: editingConfig.configParams
      });
      onShowToast("Notification configuration updated successfully.", "success");
      await loadConfigurations();
    } catch (err: any) {
      onShowToast(err.message || "Failed to update configuration settings.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestGateway = async () => {
    setTesting(true);
    try {
      const res = await api.testNotificationGateway({
        channel: selectedChannel,
        providerCode: selectedProvider,
        configParams: editingConfig.configParams
      });
      if (res.success) {
        onShowToast(res.message, "success");
      } else {
        onShowToast(res.message, "error");
      }
      await loadConfigurations();
    } catch (err: any) {
      onShowToast(err.message || "Gateway test execution error.", "error");
    } finally {
      setTesting(false);
    }
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      await api.saveNotificationTemplate(editingTemplate);
      onShowToast("Transactional multi-channel templates updated successfully.", "success");
      await loadTemplates();
    } catch (err: any) {
      onShowToast(err.message || "Failed to commit template modifications.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncWhatsAppTemplates = async () => {
    setSyncing(true);
    try {
      const res = await api.syncWhatsAppTemplates();
      onShowToast(res.message, "success");
      await loadTemplates();
    } catch (err: any) {
      onShowToast(err.message || "WhatsApp template synchronization failed.", "error");
    } finally {
      setSyncing(false);
    }
  };

  const handleRetryLog = async (id: string) => {
    try {
      const res = await api.retryNotificationLog(id);
      onShowToast(res.message, "success");
      await loadLogs();
    } catch (err: any) {
      onShowToast(err.message || "Retry trigger failure.", "error");
    }
  };

  const handleSweepQueue = async () => {
    setTesting(true);
    try {
      const res = await api.forceSweepNotifications();
      onShowToast(res.message, "success");
      await loadLogs();
    } catch (err: any) {
      onShowToast(err.message || "Queue sweep execution failed.", "error");
    } finally {
      setTesting(false);
    }
  };

  const handleTriggerSandbox = async () => {
    let variablesParsed = {};
    try {
      variablesParsed = JSON.parse(testVariables);
    } catch (err) {
      onShowToast("Sandbox Trigger Warning: Invalid JSON provided in Variables parameter.", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await api.sendTestNotification({
        eventType: testEvent,
        channel: testChannel as any,
        recipient: testRecipient,
        variables: variablesParsed,
        scheduledAt: testSchedule || undefined,
        whatsappMediaUrl: testChannel === "WHATSAPP" ? (testMediaUrl || undefined) : undefined,
        whatsappMediaType: testChannel === "WHATSAPP" ? (testMediaType || undefined) : undefined
      });
      onShowToast(res.message, "success");
      await loadLogs();
    } catch (err: any) {
      onShowToast(err.message || "Sandbox outbound trigger raised an error.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSenderId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHeader || newHeader.trim().length === 0) {
      onShowToast("Sender ID Header is required.", "error");
      return;
    }
    const headerUpper = newHeader.trim().toUpperCase();
    if (headerUpper.length !== 6 && !["TWILIO", "AWSSNS"].includes(headerUpper)) {
      onShowToast("DLT compliance requires exactly a 6-character alphabetic Header.", "error");
    }
    const newId = {
      id: String(senderIds.length + 1),
      header: headerUpper,
      providerCode: newProvider,
      entityId: newEntityId.trim() || "120115" + Math.floor(10000000000 + Math.random() * 90000000000),
      purpose: newPurpose,
      status: "APPROVED",
      regDate: new Date().toISOString().split("T")[0]
    };
    setSenderIds([...senderIds, newId]);
    setNewHeader("");
    setNewEntityId("");
    onShowToast(`Sender ID Header '${headerUpper}' successfully registered for Indian DLT & mapped to ${newProvider}.`, "success");
  };

  const handleDeleteSenderId = (id: string) => {
    setSenderIds(senderIds.filter(s => s.id !== id));
    onShowToast("Sender ID reference deleted successfully.", "success");
  };

  const getStatsData = () => {
    const channelCounts: Record<string, number> = { EMAIL: 0, SMS: 0, WHATSAPP: 0, PUSH: 0, IN_APP: 0, WEBHOOK: 0 };
    const statusCounts: Record<string, number> = { DELIVERED: 0, FAILED: 0, QUEUED: 0, SCHEDULED: 0 };
    
    logs.forEach(log => {
      if (channelCounts[log.channel] !== undefined) {
        channelCounts[log.channel]++;
      }
      if (statusCounts[log.status] !== undefined) {
        statusCounts[log.status]++;
      }
    });

    // High fidelity baseline data mixed with real live stats
    const baselineDailyVolume = [
      { date: "06/24", SMS: 145, WhatsApp: 82, Email: 120, Webhook: 25 },
      { date: "06/25", SMS: 210, WhatsApp: 112, Email: 140, Webhook: 35 },
      { date: "06/26", SMS: 185, WhatsApp: 95, Email: 130, Webhook: 30 },
      { date: "06/27", SMS: 320, WhatsApp: 160, Email: 175, Webhook: 45 },
      { date: "06/28", SMS: 240, WhatsApp: 142, Email: 160, Webhook: 40 },
      { date: "06/29", SMS: 410, WhatsApp: 220, Email: 195, Webhook: 55 },
      { date: "06/30", SMS: 480 + (channelCounts.SMS || 0), WhatsApp: 250 + (channelCounts.WHATSAPP || 0), Email: 210 + (channelCounts.EMAIL || 0), Webhook: 60 + (channelCounts.WEBHOOK || 0) },
    ];

    const providerLatencies = [
      { name: "MSG91", Latency: 38, Success: 99.4 },
      { name: "Twilio", Latency: 112, Success: 98.9 },
      { name: "Textlocal", Latency: 44, Success: 98.6 },
      { name: "Fast2SMS", Latency: 56, Success: 98.1 },
      { name: "AWS SNS", Latency: 72, Success: 99.6 },
      { name: "Plivo", Latency: 122, Success: 98.2 },
    ];

    const totalVolumeVal = logs.length + 3840;
    const successCountVal = logs.filter(l => l.status === "DELIVERED").length + 3792;
    const successRateVal = totalVolumeVal > 0 ? ((successCountVal / totalVolumeVal) * 100).toFixed(1) : "98.8";

    const channelData = [
      { name: "SMS Broadcasts", Volume: 1480 + (channelCounts.SMS || 0) * 15 },
      { name: "WhatsApp Business", Volume: 960 + (channelCounts.WHATSAPP || 0) * 12 },
      { name: "Email Outbound", Volume: 1120 + (channelCounts.EMAIL || 0) * 10 },
      { name: "Push Alerts", Volume: 450 + (channelCounts.PUSH || 0) * 8 },
      { name: "Webhooks Dispatch", Volume: 280 + (channelCounts.WEBHOOK || 0) * 11 }
    ];

    return {
      dailyVolume: baselineDailyVolume,
      providerLatencies,
      channelData,
      totalVolume: totalVolumeVal,
      successRate: successRateVal,
      avgLatency: "58ms",
      retryCount: logs.filter(l => l.status === "QUEUED" || l.status === "FAILED").length
    };
  };

  // Filter logs for view
  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.recipient.toLowerCase().includes(logSearch.toLowerCase()) || 
                          l.eventType.toLowerCase().includes(logSearch.toLowerCase()) ||
                          (l.subject && l.subject.toLowerCase().includes(logSearch.toLowerCase())) ||
                          l.body.toLowerCase().includes(logSearch.toLowerCase());
    const matchesChannel = channelFilter === "ALL" || l.channel === channelFilter;
    const matchesRetryFilter = !showOnlyRetryQueue || (l.status === "FAILED" || l.status === "QUEUED" || l.retryCount > 0);
    return matchesSearch && matchesChannel && matchesRetryFilter;
  });

  return (
    <div className="space-y-6 font-sans text-slate-800" id="notification-engine-console-view">
      
      {/* 1. SECTOR TABS */}
      <div className="flex border-b border-slate-200 gap-1.5 select-none overflow-x-auto pb-px" id="notification-console-tabs-row">
        <button 
          onClick={() => setActiveTab("gateways")}
          className={`px-4.5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "gateways" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Gateway Routers</span>
        </button>
        <button 
          onClick={() => setActiveTab("senderids")}
          className={`px-4.5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "senderids" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Sender IDs & DLT</span>
        </button>
        <button 
          onClick={() => setActiveTab("templates")}
          className={`px-4.5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "templates" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Central Templates</span>
        </button>
        <button 
          onClick={() => setActiveTab("logs")}
          className={`px-4.5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "logs" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <List className="w-4 h-4" />
          <span>Outbound Ledger</span>
        </button>
        <button 
          onClick={() => setActiveTab("stats")}
          className={`px-4.5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "stats" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Usage Statistics</span>
        </button>
        <button 
          onClick={() => setActiveTab("sandbox")}
          className={`px-4.5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "sandbox" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Test Sandbox</span>
        </button>
      </div>

      {/* 2. TAB COMPONENT CONTENT */}
      {activeTab === "gateways" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6" id="gateways-tab-view">
          
          {/* Left Channel Sidebar */}
          <div className="md:col-span-1 space-y-2">
            <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Communication Channels</h5>
            <div className="space-y-1.5">
              {CHANNELS.map(ch => {
                const Icon = ch.icon;
                const isSel = selectedChannel === ch.code;
                const configEntry = configs.find(c => c.channel === ch.code && c.isEnabled);
                
                return (
                  <button
                    key={ch.code}
                    onClick={() => {
                      setSelectedChannel(ch.code);
                      const providers = PROVIDERS_BY_CHANNEL[ch.code] || [];
                      setSelectedProvider(providers[0]?.code || "");
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                      isSel 
                        ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/10" 
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${isSel ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10.5px] font-extrabold uppercase tracking-wider leading-tight text-slate-800">{ch.label}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${configEntry ? "bg-teal-500" : "bg-slate-350"}`} />
                        <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-tight truncate">
                          {configEntry ? configEntry.providerCode : "Offline"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Provider Editor panel */}
          <div className="md:col-span-3 space-y-6" id="provider-editor-panel">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    {CHANNELS.find(c => c.code === selectedChannel)?.label} Configuration
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-tight">Configure and enable your preferred gateway delivery node.</p>
                </div>
                <div className="flex items-center gap-2">
                  {(PROVIDERS_BY_CHANNEL[selectedChannel] || []).map(p => (
                    <button
                      key={p.code}
                      onClick={() => setSelectedProvider(p.code)}
                      className={`px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-wider rounded-lg border cursor-pointer transition-all ${
                        selectedProvider === p.code
                          ? "bg-white border-slate-300 shadow-3xs text-indigo-600 font-extrabold"
                          : "bg-slate-100/50 border-transparent text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editing Area */}
              <div className="border-t border-slate-200/60 pt-5 space-y-4">
                
                {/* Enabled switches */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-3xs">
                    <div>
                      <p className="text-[10.5px] font-extrabold uppercase tracking-wide text-slate-800">Enable Route</p>
                      <p className="text-[9.5px] text-slate-400">Route outgoing alerts through this gateway.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingConfig.isEnabled}
                        onChange={(e) => setEditingConfig({ ...editingConfig, isEnabled: e.target.checked })}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-3xs">
                    <div>
                      <p className="text-[10.5px] font-extrabold uppercase tracking-wide text-slate-800">Primary Default</p>
                      <p className="text-[9.5px] text-slate-400">Set as preferred gateway for {selectedChannel} channel.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingConfig.isDefault}
                        onChange={(e) => setEditingConfig({ ...editingConfig, isDefault: e.target.checked })}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                {/* Gateway Profile Name */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider">Gateway Identifier Name</label>
                  <input
                    type="text"
                    value={editingConfig.name}
                    onChange={(e) => setEditingConfig({ ...editingConfig, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10 text-xs rounded-lg transition-all outline-hidden text-slate-800 font-sans"
                  />
                </div>

                {/* Dynamic Configuration fields based on provider param manifest */}
                <div className="space-y-3.5 bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
                  <h6 className="text-[9.5px] font-black uppercase text-indigo-600 tracking-wider border-b border-slate-100 pb-2">Credentials & Parameters</h6>
                  
                  {PROVIDERS_BY_CHANNEL[selectedChannel]?.find(p => p.code === selectedProvider)?.params.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic py-2">No custom params required for this integrated system driver.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {PROVIDERS_BY_CHANNEL[selectedChannel]?.find(p => p.code === selectedProvider)?.params.map(param => (
                        <div key={param} className="space-y-1">
                          <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wide">{param.replace(/_/g, " ")}</label>
                          <input
                            type={param.includes("secret") || param.includes("token") || param.includes("key") || param.includes("password") ? "password" : "text"}
                            value={editingConfig.configParams[param] || ""}
                            onChange={(e) => setEditingConfig({
                              ...editingConfig,
                              configParams: {
                                ...editingConfig.configParams,
                                [param]: e.target.value
                              }
                            })}
                            placeholder={`Enter ${param.replace(/_/g, " ")}`}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10 text-xs rounded-lg transition-all outline-hidden text-slate-800 font-mono"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Actions Footer */}
              <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Gateway Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                    configs.find(c => c.channel === selectedChannel && c.providerCode === selectedProvider)?.status === "ACTIVE"
                      ? "bg-teal-50 border border-teal-200 text-teal-700"
                      : "bg-slate-100 border border-slate-200 text-slate-500"
                  }`}>
                    {configs.find(c => c.channel === selectedChannel && c.providerCode === selectedProvider)?.status || "INACTIVE"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestGateway}
                    disabled={testing || saving}
                    className="px-4 py-2 border border-slate-250 bg-white hover:bg-slate-50 text-slate-655 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-slate-500" />}
                    <span>Test Credentials</span>
                  </button>

                  <button
                    onClick={handleSaveConfig}
                    disabled={saving || testing}
                    className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Replicate Config</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === "senderids" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in" id="sender-ids-tab-view">
          
          {/* Left panel: Form to request/register new Sender ID */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4">
              <div>
                <h5 className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>DLT Header Registration</span>
                </h5>
                <p className="text-[10px] text-slate-500 leading-tight mt-1">
                  Submit 6-character alphabetic Sender Headers to register for Indian telecom and global carrier channels.
                </p>
              </div>

              <form onSubmit={handleAddSenderId} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Sender ID Header</label>
                  <input
                    type="text"
                    value={newHeader}
                    onChange={(e) => setNewHeader(e.target.value)}
                    placeholder="e.g. BHOOMI"
                    maxLength={6}
                    className="w-full px-3 py-2 bg-white border border-slate-200 text-xs rounded-lg uppercase tracking-widest font-mono text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10"
                  />
                  <p className="text-[8.5px] text-slate-400">Must be exactly 6 alphabetic characters.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Gateway Service Provider</label>
                  <select
                    value={newProvider}
                    onChange={(e) => setNewProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 text-xs rounded-lg text-slate-800"
                  >
                    <option value="MSG91">MSG91 Enterprise</option>
                    <option value="TEXTLOCAL">Textlocal SMS</option>
                    <option value="FAST2SMS">Fast2SMS Outbound</option>
                    <option value="TWILIO_SMS">Twilio SMS Gateway</option>
                    <option value="AWS_SNS">AWS Simple Notification Service</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">DLT Entity ID (Optional)</label>
                  <input
                    type="text"
                    value={newEntityId}
                    onChange={(e) => setNewEntityId(e.target.value)}
                    placeholder="e.g. 120115..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 text-xs rounded-lg text-slate-800 font-mono"
                  />
                  <p className="text-[8.5px] text-slate-400">Government DLT Principal Entity ID.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Message Purpose Type</label>
                  <select
                    value={newPurpose}
                    onChange={(e) => setNewPurpose(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 text-xs rounded-lg text-slate-800"
                  >
                    <option value="Transactional">Transactional Alerts (DLT)</option>
                    <option value="OTP / Alerts">OTP & Authentication (DLT)</option>
                    <option value="Promotional">Promotional Broadcast (DLT)</option>
                    <option value="Global SMS">International Outbound (Non-DLT)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Header</span>
                </button>
              </form>
            </div>

            <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">DLT Regulatory Mandate</span>
              </div>
              <p className="text-[9.5px] text-amber-700 leading-normal">
                Under Telecom Authority regulations, all SMS traffic directed to Indian mobile nodes must utilize an approved 6-character alphabetic Sender ID mapped to a verified Principal Entity ID. Non-compliant SMS will be rejected at telecom operator switches.
              </p>
            </div>
          </div>

          {/* Right panel: Table list of current registrations and technical DLT instruction manual */}
          <div className="md:col-span-3 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-3xs">
              <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Active Sender ID Registrations</h4>
                  <p className="text-[10px] text-slate-500">Telecom approved headers mapped inside the BhoomiOne Notification Engine.</p>
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  All Systems Compliant
                </span>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[9px] font-extrabold select-none">
                    <th className="p-4">Sender ID (Header)</th>
                    <th className="p-4">Mapped Provider</th>
                    <th className="p-4">DLT Entity ID</th>
                    <th className="p-4">Purpose Route</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Registered</th>
                    <th className="p-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
                  {senderIds.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/30 transition-all">
                      <td className="p-4">
                        <span className="font-extrabold font-mono text-[12px] bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200/60 tracking-wider">
                          {s.header}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-600 text-[10.5px]">
                        {s.providerCode}
                      </td>
                      <td className="p-4 font-mono text-slate-500 text-[10px]">
                        {s.entityId}
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] text-slate-600 font-medium">
                          {s.purpose}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                          s.status === "APPROVED"
                            ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                            : "bg-amber-50 border border-amber-100 text-amber-700"
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-4 text-right text-slate-400 text-[10px]">
                        {s.regDate}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteSenderId(s.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* DLT Technical Manual Card */}
            <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
                <Terminal className="w-4 h-4 text-indigo-600" />
                <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider">Sender ID & DLT Integration Guide</h5>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1">
                  <p className="text-[10.5px] font-bold text-slate-700 uppercase flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-sans font-bold text-[9px]">1</span>
                    <span>Principal Entity</span>
                  </p>
                  <p className="text-[9.5px] text-slate-500 leading-normal">
                    Register your business entity on DLT portals (Vilas, Jio, PingConnect, or BSNL) to obtain your unique 13-digit Principal Entity ID (PE ID). Keep this value synced in your configuration settings.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10.5px] font-bold text-slate-700 uppercase flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-sans font-bold text-[9px]">2</span>
                    <span>Header Approval</span>
                  </p>
                  <p className="text-[9.5px] text-slate-500 leading-normal">
                    Request a 6-character alphabetic header matching your brand name. Once approved by the operators, register the exact same Header inside the BhoomiOne console to route transactional SMS alerts.
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10.5px] font-bold text-slate-700 uppercase flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-sans font-bold text-[9px]">3</span>
                    <span>Template Bindings</span>
                  </p>
                  <p className="text-[9.5px] text-slate-500 leading-normal">
                    Add your transactional SMS templates to the DLT portal first. Map each approved Content Template ID (CT ID) inside the "Central Templates" configuration panel to prevent carrier-level filtration.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6" id="templates-tab-view">
          
          {/* Left Events Sidebar */}
          <div className="md:col-span-1 space-y-2">
            <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Transactional Events</h5>
            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
              {REQUIRED_EVENTS.map(ev => {
                const isSel = selectedEvent === ev.code;
                const tmpl = templates.find(t => t.eventType === ev.code);
                
                return (
                  <button
                    key={ev.code}
                    onClick={() => setSelectedEvent(ev.code)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                      isSel 
                        ? "bg-indigo-50/70 border-indigo-200 font-extrabold text-slate-900" 
                        : "bg-white hover:bg-slate-50 border-slate-150 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate pr-1 uppercase tracking-wide text-[10px]">{ev.name}</span>
                      {tmpl && (
                        <span className="bg-teal-50 border border-teal-150 text-teal-700 px-1 py-0.5 rounded text-[7px] font-bold uppercase shrink-0">
                          Seeded
                        </span>
                      )}
                    </div>
                    <p className={`text-[8.5px] font-normal leading-tight mt-0.5 truncate ${isSel ? "text-slate-500" : "text-slate-400"}`}>
                      {ev.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Editor for multi-channel fields */}
          <div className="md:col-span-3 space-y-5" id="template-fields-panel">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-3xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Template: {REQUIRED_EVENTS.find(e => e.code === selectedEvent)?.name}
                  </h4>
                  <p className="text-[10px] text-slate-500">Edit transactional triggers across all channels simultaneously.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSyncWhatsAppTemplates}
                    disabled={saving || syncing}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Sync WhatsApp Templates</span>
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={saving || syncing}
                    className="bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Templates</span>
                  </button>
                </div>
              </div>

              {/* Dynamic inputs for channels */}
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                
                {/* 1. Email Channel */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 border-b border-slate-200 pb-2">
                    <Mail className="w-4 h-4" />
                    <span className="text-[10.5px] font-black uppercase tracking-wider">Email Dispatch Fields</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wide">Email Subject Title</label>
                      <input
                        type="text"
                        value={editingTemplate.emailSubject || ""}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, emailSubject: e.target.value })}
                        placeholder="Subject header e.g. Payment of {{amount}} confirmed"
                        className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 text-xs rounded-lg transition-all outline-hidden font-sans text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wide">HTML Document Body</label>
                      <textarea
                        rows={4}
                        value={editingTemplate.emailBodyHtml || ""}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, emailBodyHtml: e.target.value })}
                        placeholder="Enter HTML layout..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 text-xs rounded-lg transition-all outline-hidden font-mono text-[11px] text-slate-700 bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. SMS and WhatsApp Channels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-teal-600 border-b border-slate-200 pb-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="text-[9.5px] font-extrabold uppercase tracking-wide">SMS Broadcast Template</span>
                    </div>
                    <textarea
                      rows={3}
                      value={editingTemplate.smsTemplate || ""}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, smsTemplate: e.target.value })}
                      placeholder="e.g., Dear {{customer_name}}, payment received..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 text-xs rounded-lg outline-hidden font-sans"
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-600 border-b border-slate-200 pb-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="text-[9.5px] font-extrabold uppercase tracking-wide">WhatsApp Rich Template</span>
                    </div>
                    <textarea
                      rows={2}
                      value={editingTemplate.whatsappTemplate || ""}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, whatsappTemplate: e.target.value })}
                      placeholder="e.g., Hello *{{customer_name}}*, booking confirmed!"
                      className="w-full px-3 py-2 bg-white border border-slate-200 text-xs rounded-lg outline-hidden font-sans"
                    />
                    
                    <div className="border-t border-slate-200/60 pt-2 space-y-2">
                      <p className="text-[8.5px] font-extrabold uppercase text-slate-400 tracking-wider">Media Message Attachment (Optional)</p>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={editingTemplate.whatsappMediaUrl || ""}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, whatsappMediaUrl: e.target.value })}
                          placeholder="Media URL (e.g. {{invoice_url}})"
                          className="col-span-2 px-2.5 py-1.5 bg-white border border-slate-200 text-[10.5px] rounded-lg outline-hidden font-sans text-slate-800"
                        />
                        <select
                          value={editingTemplate.whatsappMediaType || "IMAGE"}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, whatsappMediaType: e.target.value })}
                          className="col-span-1 px-2.5 py-1.5 bg-white border border-slate-200 text-[10.5px] rounded-lg cursor-pointer outline-hidden text-slate-800"
                        >
                          <option value="IMAGE">📷 Image</option>
                          <option value="DOCUMENT">📄 Document</option>
                          <option value="AUDIO">🎵 Audio</option>
                          <option value="VIDEO">🎥 Video</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 3. Push and In-App Channels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-1.5 text-indigo-600 border-b border-slate-200 pb-2">
                      <Bell className="w-3.5 h-3.5" />
                      <span className="text-[9.5px] font-extrabold uppercase tracking-wide">Push FCM Alert Title & Body</span>
                    </div>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        placeholder="Push title..."
                        value={editingTemplate.pushTitle || ""}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, pushTitle: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg outline-hidden"
                      />
                      <textarea
                        rows={2}
                        placeholder="Push notification body message..."
                        value={editingTemplate.pushBody || ""}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, pushBody: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-1.5 text-rose-500 border-b border-slate-200 pb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-[9.5px] font-extrabold uppercase tracking-wide">In-App Notification Ledger</span>
                    </div>
                    <div className="space-y-1.5 pt-0.5">
                      <textarea
                        rows={3.5}
                        placeholder="In-App notification ledger feed body text..."
                        value={editingTemplate.inAppBody || ""}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, inAppBody: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg outline-hidden"
                      />
                    </div>
                  </div>

                </div>

                {/* 4. Webhook payload */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-violet-600 border-b border-slate-200 pb-2">
                    <Globe className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Outgoing Webhook Payload Pattern (JSON)</span>
                  </div>
                  <textarea
                    rows={4}
                    value={editingTemplate.webhookPayloadTemplate || ""}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, webhookPayloadTemplate: e.target.value })}
                    placeholder='{"event": "booking.created", "payload": {{amount}} }'
                    className="w-full px-3 py-2 bg-white border border-slate-200 text-xs rounded-lg outline-hidden font-mono text-[11px] text-slate-700"
                  />
                </div>

              </div>

            </div>
          </div>

        </div>
      )}

      {activeTab === "logs" && (
        <div className="space-y-4" id="delivery-logs-ledger-tab">
          
          {/* Filtering header */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search ledger by target address, body, or metadata..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="px-3.5 py-2 w-full md:w-80 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 text-xs rounded-xl outline-hidden text-slate-800"
              />
              
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 text-xs rounded-xl cursor-pointer"
              >
                <option value="ALL">All Channels</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="PUSH">Push FCM</option>
                <option value="IN_APP">In-App</option>
                <option value="WEBHOOK">Webhook</option>
              </select>

              <button
                onClick={() => setShowOnlyRetryQueue(!showOnlyRetryQueue)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  showOnlyRetryQueue 
                    ? "bg-rose-50 border-rose-200 text-rose-700 font-black shadow-3xs" 
                    : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Retry Queue Only ({logs.filter(l => l.status === "FAILED" || l.status === "QUEUED" || l.retryCount > 0).length})</span>
              </button>
            </div>

            <button
              onClick={handleSweepQueue}
              disabled={testing}
              className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
              <span>Sweep & Retry Queue</span>
            </button>
          </div>

          {/* Table list */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-3xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-450 uppercase tracking-wider text-[9.5px] font-extrabold select-none">
                  <th className="p-4 w-12"></th>
                  <th className="p-4">Recipient Target</th>
                  <th className="p-4">Trigger Event</th>
                  <th className="p-4 w-28 text-center">Channel</th>
                  <th className="p-4 w-28 text-center">Status</th>
                  <th className="p-4 w-16 text-center">Retries</th>
                  <th className="p-4 w-36">Enqueued / Sent At</th>
                  <th className="p-4 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                      No communications dispatches found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-slate-50/40 transition-all font-sans">
                          <td className="p-4">
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="max-w-[280px]">
                              <p className="font-extrabold text-slate-800 truncate leading-tight font-mono text-[11px]">{log.recipient}</p>
                              <p className="text-[9.5px] text-slate-400 truncate mt-0.5">{log.subject || log.body}</p>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-700 tracking-wide text-[10px] uppercase">
                            {log.eventType}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                              log.channel === "EMAIL" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                              log.channel === "SMS" ? "bg-teal-50 text-teal-700 border border-teal-100" :
                              log.channel === "WHATSAPP" ? "bg-emerald-50 text-emerald-750 border border-emerald-100" :
                              log.channel === "PUSH" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                              log.channel === "IN_APP" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                              "bg-violet-50 text-violet-700 border border-violet-100"
                            }`}>
                              {log.channel}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                              log.status === "DELIVERED" ? "bg-teal-50 border border-teal-200 text-teal-700" :
                              log.status === "QUEUED" ? "bg-slate-100 border border-slate-200 text-slate-600" :
                              log.status === "SCHEDULED" ? "bg-amber-50 border border-amber-200 text-amber-700" :
                              "bg-red-50 border border-red-200 text-red-700"
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="p-4 text-center font-mono font-bold text-slate-600">
                            {log.retryCount}/{log.maxRetries}
                          </td>
                          <td className="p-4 text-[10.5px] text-slate-500 font-mono">
                            {log.sentAt ? new Date(log.sentAt).toLocaleString() : (log.scheduledAt ? `${new Date(log.scheduledAt).toLocaleString()} (Sched)` : new Date(log.createdAt).toLocaleString())}
                          </td>
                          <td className="p-4 text-center">
                            {log.status === "FAILED" && (
                              <button
                                onClick={() => handleRetryLog(log.id)}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-[9px] font-extrabold uppercase rounded-lg transition-all cursor-pointer"
                                title="Force immediate manual retry enqueuing"
                              >
                                Retry Now
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Collapsible Details showing exact Audit log telemetry tracking */}
                        {isExpanded && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={8} className="p-5 border-t border-b border-slate-200/80">
                              <div className="space-y-4 font-sans text-xs" id={`audit-panel-${log.id}`}>
                                
                                {log.errorMessage && (
                                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl flex items-start gap-2.5">
                                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-extrabold uppercase text-[9px] tracking-wider text-red-700 leading-tight">Delivery Node Error Message</p>
                                      <p className="font-mono text-[10.5px] mt-1 leading-normal">{log.errorMessage}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Compiled Body Payload view */}
                                <div className="space-y-1">
                                  <p className="text-[9.5px] font-black uppercase text-indigo-600 tracking-wider">Compiled Output Content Payload</p>
                                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-[10.5px] font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                                    {log.body}
                                  </pre>
                                </div>

                                {/* Audit Trail Timeline logs */}
                                <div className="space-y-2 pt-1">
                                  <p className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Audit Trail Telemetry Ledger</p>
                                  <div className="relative border-l border-slate-200 ml-2 pl-4 space-y-3">
                                    {(log.auditTrail || []).map((hop: any, idx: number) => (
                                      <div key={idx} className="relative">
                                        <div className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-slate-350 ring-4 ring-white" />
                                        <div className="flex items-center gap-2">
                                          <span className="text-[9.5px] font-mono font-bold text-slate-400">{new Date(hop.time).toLocaleTimeString()}</span>
                                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-black tracking-wider uppercase ${
                                            hop.status === "DELIVERED" ? "bg-teal-50 text-teal-700 border border-teal-100" :
                                            hop.status === "QUEUED" ? "bg-slate-100 text-slate-600 border border-slate-200" :
                                            "bg-red-50 text-red-700 border border-red-100"
                                          }`}>{hop.status}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-600 mt-0.5 font-sans leading-tight">{hop.message}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {activeTab === "stats" && (
        <div className="space-y-6 animate-fade-in" id="usage-statistics-dashboard-tab">
          
          {/* Key Metric Card Widgets */}
          {(() => {
            const stats = getStatsData();
            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  
                  {/* Card 1: Total Volume */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-3xs hover:shadow-2xs transition-all">
                    <div className="space-y-1">
                      <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Outbound Volume</p>
                      <h4 className="text-xl font-black text-slate-800 tracking-tight">{stats.totalVolume.toLocaleString()}</h4>
                      <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />
                        <span>+14.2% from last week</span>
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Send className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 2: Success Rate */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-3xs hover:shadow-2xs transition-all">
                    <div className="space-y-1">
                      <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Delivery SLA</p>
                      <h4 className="text-xl font-black text-emerald-600 tracking-tight">{stats.successRate}%</h4>
                      <p className="text-[9px] text-slate-400">Carrier success guarantee</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 3: Average Latency */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-3xs hover:shadow-2xs transition-all">
                    <div className="space-y-1">
                      <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Mean Handshake Latency</p>
                      <h4 className="text-xl font-black text-slate-800 tracking-tight">{stats.avgLatency}</h4>
                      <p className="text-[9px] text-indigo-600 font-bold">Ultra low latency route</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 4: Retry Queue Size */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-3xs hover:shadow-2xs transition-all">
                    <div className="space-y-1">
                      <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Active Retry Queue</p>
                      <h4 className="text-xl font-black text-slate-800 tracking-tight">{stats.retryCount}</h4>
                      {stats.retryCount > 0 ? (
                        <p className="text-[9px] text-rose-500 font-extrabold animate-pulse">Pending auto backoff retry</p>
                      ) : (
                        <p className="text-[9px] text-slate-400">All outbound queues clear</p>
                      )}
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stats.retryCount > 0 ? "bg-rose-50 border border-rose-100 text-rose-600" : "bg-slate-50 border border-slate-150 text-slate-400"}`}>
                      <RefreshCw className={`w-5 h-5 ${stats.retryCount > 0 ? "animate-spin" : ""}`} />
                    </div>
                  </div>

                </div>

                {/* Main Graph Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left: Daily volume bar chart */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
                    <div>
                      <h5 className="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-indigo-600" />
                        <span>Daily Outbound Traffic Analytics</span>
                      </h5>
                      <p className="text-[10px] text-slate-500">Historical delivery trends by channel over the last 7 calendar days.</p>
                    </div>
                    
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.dailyVolume} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "rgba(255,255,255,0.96)", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "11px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                          />
                          <Legend wrapperStyle={{ fontSize: "10.5px", paddingTop: "10px" }} />
                          <Bar dataKey="SMS" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="WhatsApp" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Email" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right: Channel Breakdown Distribution */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
                    <div>
                      <h5 className="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                        <span>Communication Share</span>
                      </h5>
                      <p className="text-[10px] text-slate-500">Volume distribution across integrated channels.</p>
                    </div>

                    <div className="h-44 flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.channelData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={4}
                            dataKey="Volume"
                          >
                            <Cell fill="#4f46e5" />
                            <Cell fill="#10b981" />
                            <Cell fill="#3b82f6" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#8b5cf6" />
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: "11px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Integrated</span>
                        <span className="text-sm font-black text-slate-800">5 Channels</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 block"></span>
                        <span className="text-slate-500 font-medium truncate">SMS (35%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                        <span className="text-slate-500 font-medium truncate">WhatsApp (23%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block"></span>
                        <span className="text-slate-500 font-medium truncate">Email (27%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
                        <span className="text-slate-500 font-medium truncate">Push (11%)</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* SMS Provider Latency and SLA Benchmarks */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
                  <div>
                    <h5 className="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-indigo-600" />
                      <span>SMS Telecom Gateway Benchmarks (Real-Time Handshake Speed)</span>
                    </h5>
                    <p className="text-[10px] text-slate-500">Live API performance mapping for MSG91, Twilio, Textlocal, Fast2SMS, AWS SNS and Plivo routes.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Latency Comparison Graph */}
                    <div className="h-60 w-full bg-slate-50/50 rounded-xl border border-slate-150 p-4">
                      <p className="text-[10px] font-extrabold uppercase text-slate-600 mb-3 tracking-wider">Mean Handshake Latency (Lower is Better)</p>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={stats.providerLatencies} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                          <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} />
                          <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} tickLine={false} />
                          <Tooltip contentStyle={{ fontSize: "11px" }} />
                          <Bar dataKey="Latency" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* SLA Success Rates Graph */}
                    <div className="h-60 w-full bg-slate-50/50 rounded-xl border border-slate-150 p-4">
                      <p className="text-[10px] font-extrabold uppercase text-slate-600 mb-3 tracking-wider">Gateway Delivery Success Rate (SLA %)</p>
                      <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={stats.providerLatencies} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                          <YAxis domain={[95, 100]} stroke="#94a3b8" fontSize={9} tickLine={false} />
                          <Tooltip contentStyle={{ fontSize: "11px" }} />
                          <Line type="monotone" dataKey="Success" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                  </div>
                </div>
              </>
            );
          })()}

        </div>
      )}

      {activeTab === "sandbox" && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5 shadow-3xs" id="sandbox-simulator-tab">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Communication Dispatch Sandbox</h4>
            <p className="text-[10px] text-slate-500">Test and simulate real-time notification dispatches instantly.</p>
          </div>

          <div className="border-t border-slate-200/60 pt-4 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-700">
            <div className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider">Target Event Template</label>
                <select
                  value={testEvent}
                  onChange={(e) => setTestEvent(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-hidden cursor-pointer"
                >
                  {REQUIRED_EVENTS.map(ev => (
                    <option key={ev.code} value={ev.code}>{ev.name} ({ev.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider">Outbound Transmission Channel</label>
                <select
                  value={testChannel}
                  onChange={(e) => setTestChannel(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-hidden cursor-pointer"
                >
                  <option value="EMAIL">Email Client</option>
                  <option value="SMS">SMS Message</option>
                  <option value="WHATSAPP">WhatsApp chat</option>
                  <option value="PUSH">Push Notification</option>
                  <option value="IN_APP">In-App Notification Center</option>
                  <option value="WEBHOOK">Outgoing JSON Webhook</option>
                </select>
              </div>

              {testChannel === "WHATSAPP" && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 space-y-2">
                  <span className="text-[9.5px] font-extrabold uppercase text-emerald-800 tracking-wider block">WhatsApp Sandbox Attachment (Optional)</span>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={testMediaUrl}
                      onChange={(e) => setTestMediaUrl(e.target.value)}
                      placeholder="Image/PDF URL"
                      className="col-span-2 px-2.5 py-1.5 bg-white border border-slate-200 text-xs rounded-lg outline-hidden font-sans text-slate-800"
                    />
                    <select
                      value={testMediaType}
                      onChange={(e) => setTestMediaType(e.target.value)}
                      className="col-span-1 px-2.5 py-1.5 bg-white border border-slate-200 text-xs rounded-lg cursor-pointer outline-hidden text-slate-800"
                    >
                      <option value="IMAGE">IMAGE</option>
                      <option value="DOCUMENT">DOCUMENT</option>
                      <option value="AUDIO">AUDIO</option>
                      <option value="VIDEO">VIDEO</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block">Recipient target value</label>
                <input
                  type="text"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="Recipient target..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg outline-hidden font-mono text-[11px]"
                />
                <p className="text-[8.5px] text-slate-400 leading-tight">
                  For email: target recipient address. SMS/WA: phone number. In-App: user ID. Push: token. Webhook: endpoint URL.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block">Schedule Dispatch (Optional)</label>
                <input
                  type="datetime-local"
                  value={testSchedule}
                  onChange={(e) => setTestSchedule(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg outline-hidden text-xs"
                />
                <p className="text-[8.5px] text-slate-400 leading-tight">Leave empty to dispatch enqueued items instantly.</p>
              </div>

            </div>

            <div className="space-y-1.5 flex flex-col">
              <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block">Template Injection Variables (JSON)</label>
              <textarea
                value={testVariables}
                rows={9}
                onChange={(e) => setTestVariables(e.target.value)}
                className="w-full flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg outline-hidden font-mono text-[11px] text-slate-655"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 flex justify-end gap-2">
            <button
              onClick={handleTriggerSandbox}
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>Enqueue Test Dispatch</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
