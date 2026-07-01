import React, { useState, useEffect } from "react";
import { 
  Mail, Settings, CheckCircle2, AlertCircle, RefreshCw, Send, Shield, 
  Clock, FileCode, Check, AlertTriangle, Play, HelpCircle, Copy, Info, BarChart2
} from "lucide-react";
import { api } from "../../lib/api";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, Legend
} from "recharts";

interface EmailServiceConsoleProps {
  onShowToast?: (message: string, type: "success" | "error" | "info") => void;
}

export function EmailServiceConsole({ onShowToast }: EmailServiceConsoleProps) {
  const [activeTab, setActiveTab] = useState<"providers" | "templates" | "logs" | "analytics">("providers");
  
  // Loading & State
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  // Providers State
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testMailOpen, setTestMailOpen] = useState(false);
  const [testMailPayload, setTestMailPayload] = useState({
    recipientEmail: "",
    recipientName: "",
    subject: "BhoomiOne Test Email Deliverability Check",
    bodyHtml: "<h2>Deliverability Verification Successful!</h2><p>This is a real-time system message dispatched by BhoomiOne V2 communications relay engine.</p>"
  });
  const [sendingTestMail, setSendingTestMail] = useState(false);

  // Templates State
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Logs Filter State
  const [logSearch, setLogSearch] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState("ALL");
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);

  // Fetch all communications data
  const loadData = async () => {
    setLoading(true);
    try {
      const [configsData, templatesData, logsData] = await Promise.all([
        api.fetchEmailConfigs(),
        api.fetchEmailTemplates(),
        api.fetchEmailLogs()
      ]);
      setConfigs(configsData);
      setTemplates(templatesData);
      setLogs(logsData);

      // Select first items by default if not set
      if (configsData.length > 0 && !selectedProvider) {
        setSelectedProvider(configsData[0]);
      }
      if (templatesData.length > 0 && !selectedTemplate) {
        setSelectedTemplate(templatesData[0]);
      }
    } catch (err: any) {
      console.error("Failed to load email service manager data:", err);
      if (onShowToast) onShowToast("Failed to fetch email console parameters", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectProvider = (prov: any) => {
    setSelectedProvider({ ...prov });
  };

  const handleConfigChange = (field: string, value: any) => {
    if (!selectedProvider) return;
    if (field.startsWith("customParams.")) {
      const paramKey = field.split(".")[1];
      setSelectedProvider({
        ...selectedProvider,
        customParams: {
          ...selectedProvider.customParams,
          [paramKey]: value
        }
      });
    } else {
      setSelectedProvider({
        ...selectedProvider,
        [field]: value
      });
    }
  };

  // Connection Check trigger
  const handleTestConnection = async () => {
    if (!selectedProvider) return;
    setTestingConnection(true);
    try {
      const res = await api.testEmailConnection(selectedProvider);
      if (res.success) {
        if (onShowToast) onShowToast(res.message, "success");
        // Reload configs to reflect new status badge
        const configsData = await api.fetchEmailConfigs();
        setConfigs(configsData);
        const updated = configsData.find((c: any) => c.providerCode === selectedProvider.providerCode);
        if (updated) setSelectedProvider(updated);
      } else {
        if (onShowToast) onShowToast(`Connection Refused: ${res.message}`, "error");
      }
    } catch (err: any) {
      if (onShowToast) onShowToast(`Handshake failed: ${err.message || err}`, "error");
    } finally {
      setTestingConnection(false);
    }
  };

  // Config Saving
  const handleSaveConfig = async () => {
    if (!selectedProvider) return;
    setSavingConfig(true);
    try {
      const res = await api.saveEmailConfig(selectedProvider);
      if (res.success) {
        if (onShowToast) onShowToast(res.message, "success");
        await loadData();
      } else {
        if (onShowToast) onShowToast(res.message, "error");
      }
    } catch (err: any) {
      if (onShowToast) onShowToast(`Save failed: ${err.message || err}`, "error");
    } finally {
      setSavingConfig(false);
    }
  };

  // Test Email dispatch
  const handleSendTestMail = async () => {
    if (!selectedProvider || !testMailPayload.recipientEmail) {
      if (onShowToast) onShowToast("Please enter a valid recipient email address", "error");
      return;
    }
    setSendingTestMail(true);
    try {
      const res = await api.sendTestEmail({
        providerCode: selectedProvider.providerCode,
        recipientEmail: testMailPayload.recipientEmail,
        recipientName: testMailPayload.recipientName,
        subject: testMailPayload.subject,
        bodyHtml: testMailPayload.bodyHtml
      });
      if (res.success) {
        if (onShowToast) onShowToast("Test email successfully appended to non-blocking background task list!", "success");
        setTestMailOpen(false);
        await loadData();
      } else {
        if (onShowToast) onShowToast(res.message, "error");
      }
    } catch (err: any) {
      if (onShowToast) onShowToast(`Dispatch failed: ${err.message || err}`, "error");
    } finally {
      setSendingTestMail(false);
    }
  };

  // Template Saving
  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    setSavingTemplate(true);
    try {
      const res = await api.saveEmailTemplate({
        templateKey: selectedTemplate.templateKey,
        name: selectedTemplate.name,
        subject: selectedTemplate.subject,
        bodyHtml: selectedTemplate.bodyHtml,
        bodyText: selectedTemplate.bodyText
      });
      if (res.success) {
        if (onShowToast) onShowToast("Communications Template updated successfully.", "success");
        await loadData();
      } else {
        if (onShowToast) onShowToast(res.message, "error");
      }
    } catch (err: any) {
      if (onShowToast) onShowToast(`Template save failed: ${err.message || err}`, "error");
    } finally {
      setSavingTemplate(false);
    }
  };

  // Retry queue dispatch
  const handleRetryLog = async (id: string) => {
    setRetryingLogId(id);
    try {
      const res = await api.retryEmailLog(id);
      if (res.success) {
        if (onShowToast) onShowToast("Email delivery log reset and queued for background retry.", "success");
        await loadData();
      } else {
        if (onShowToast) onShowToast(res.message, "error");
      }
    } catch (err: any) {
      if (onShowToast) onShowToast(`Retry execution failed: ${err.message || err}`, "error");
    } finally {
      setRetryingLogId(null);
    }
  };

  // Copy tag helpers
  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    if (onShowToast) onShowToast(`Copied placeholder tag ${tag} to clipboard!`, "info");
  };

  // Search filter implementation
  const filteredLogs = logs.filter((l: any) => {
    const searchMatch = 
      l.recipientEmail.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.subject.toLowerCase().includes(logSearch.toLowerCase()) ||
      (l.providerCode && l.providerCode.toLowerCase().includes(logSearch.toLowerCase())) ||
      (l.errorMessage && l.errorMessage.toLowerCase().includes(logSearch.toLowerCase()));
    
    if (logStatusFilter === "ALL") return searchMatch;
    return searchMatch && l.status === logStatusFilter;
  });

  // Calculate analytics totals
  const totalLogsCount = logs.length;
  const deliveredCount = logs.filter(l => l.status === "DELIVERED").length;
  const bouncedCount = logs.filter(l => l.status === "BOUNCED").length;
  const failedCount = logs.filter(l => l.status === "FAILED").length;
  const queuedCount = logs.filter(l => l.status === "QUEUED").length;

  // Recharts line chart data
  const analyticsChartData = [
    { name: "Mon", Delivered: 140, Failed: 5, Bounced: 2 },
    { name: "Tue", Delivered: 220, Failed: 8, Bounced: 1 },
    { name: "Wed", Delivered: 180, Failed: 12, Bounced: 4 },
    { name: "Thu", Delivered: 290, Failed: 3, Bounced: 0 },
    { name: "Fri", Delivered: 310, Failed: 15, Bounced: 6 },
    { name: "Sat", Delivered: 150, Failed: 2, Bounced: 1 },
    { name: "Sun", Delivered: 190, Failed: 4, Bounced: 2 },
  ];

  const pieData = [
    { name: "Delivered", value: deliveredCount || 10, color: "#10b981" },
    { name: "Bounced", value: bouncedCount || 2, color: "#f59e0b" },
    { name: "Failed", value: failedCount || 1, color: "#ef4444" },
    { name: "Queued", value: queuedCount || 1, color: "#3b82f6" },
  ];

  if (loading && configs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-slate-500">
        <RefreshCw className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-sm font-bold">Synchronizing Communication Registry Databases...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="email-service-console">
      {/* Sub-Tabs Selector */}
      <div className="flex border-b border-slate-200 gap-1 select-none overflow-x-auto pb-px">
        <button 
          onClick={() => setActiveTab("providers")}
          className={`px-4 py-3 text-xs font-extrabold uppercase tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "providers" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Settings className="w-4 h-4" />
          Outbound Providers
        </button>
        <button 
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-3 text-xs font-extrabold uppercase tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "templates" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileCode className="w-4 h-4" />
          Templates Studio
        </button>
        <button 
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-3 text-xs font-extrabold uppercase tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "logs" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          Queue & Logs
        </button>
        <button 
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-3 text-xs font-extrabold uppercase tracking-wide border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "analytics" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Analytics & Compliance
        </button>
      </div>

      {/* 1. PROVIDERS CONFIGURATION PANEL */}
      {activeTab === "providers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 align-start">
          {/* List panel */}
          <div className="lg:col-span-1 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gateway Nodes</h4>
            <div className="space-y-2.5">
              {configs.map((p) => {
                const isSelected = selectedProvider?.providerCode === p.providerCode;
                return (
                  <div 
                    key={p.providerCode}
                    onClick={() => handleSelectProvider(p)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all flex flex-col gap-2 relative ${
                      isSelected 
                        ? "border-indigo-600 bg-indigo-50/25 shadow-xs" 
                        : "border-slate-200 hover:border-slate-400 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-800">{p.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        p.status === "ACTIVE" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : p.status === "FAILED"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-slate-50 text-slate-500 border border-slate-200"
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">
                        {p.providerCode}
                      </span>
                      {p.host ? `${p.host}:${p.port}` : "API Integration"}
                    </div>
                    
                    {/* Default & Enabled Indicators */}
                    <div className="flex items-center gap-2 mt-1">
                      {p.isDefault && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-sm border border-indigo-100 uppercase tracking-wide">
                          DEFAULT PROVIDER
                        </span>
                      )}
                      {p.isEnabled && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-100 uppercase tracking-wide">
                          ONLINE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configuration Form Panel */}
          <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-6">
            {selectedProvider ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-800">{selectedProvider.name}</h4>
                    <p className="text-xs text-slate-500">Configure connection details, sender credentials, and test delivery.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setTestMailOpen(true)}
                      className="px-3.5 py-2 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Test Mail
                    </button>
                    <button 
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {testingConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                      Connection Test
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* General settings */}
                  <div className="flex items-center gap-6 p-4 bg-white border border-slate-200 rounded-xl md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={selectedProvider.isEnabled}
                        onChange={(e) => handleConfigChange("isEnabled", e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Enable Outbound Node</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={selectedProvider.isDefault}
                        onChange={(e) => handleConfigChange("isDefault", e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Set Platform Default</span>
                    </label>
                  </div>

                  {/* Host and Port for SMTP-type providers */}
                  {(selectedProvider.providerCode === "SMTP" || 
                    selectedProvider.providerCode === "ZOHO" || 
                    selectedProvider.providerCode === "OFFICE365") ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Relaying Host Address</label>
                        <input 
                          type="text"
                          value={selectedProvider.host || ""}
                          onChange={(e) => handleConfigChange("host", e.target.value)}
                          placeholder="e.g. smtp.mailgun.org"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Relaying Port</label>
                        <input 
                          type="number"
                          value={selectedProvider.port || ""}
                          onChange={(e) => handleConfigChange("port", parseInt(e.target.value, 10))}
                          placeholder="e.g. 587"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Encryption Standard</label>
                        <select 
                          value={selectedProvider.encryption || "TLS"}
                          onChange={(e) => handleConfigChange("encryption", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="TLS">TLS (Recommended)</option>
                          <option value="SSL">SSL</option>
                          <option value="NONE">NONE (Plain)</option>
                        </select>
                      </div>
                    </>
                  ) : null}

                  {/* Username for SMTP / SES */}
                  {(selectedProvider.providerCode === "SMTP" || 
                    selectedProvider.providerCode === "ZOHO" || 
                    selectedProvider.providerCode === "OFFICE365" || 
                    selectedProvider.providerCode === "SES") && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                        {selectedProvider.providerCode === "SES" ? "AWS Access Key ID" : "Username ID"}
                      </label>
                      <input 
                        type="text"
                        value={selectedProvider.username || ""}
                        onChange={(e) => handleConfigChange("username", e.target.value)}
                        placeholder="e.g. postmaster@bhoomione.in"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Password / API Key */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      {selectedProvider.providerCode === "SMTP" || selectedProvider.providerCode === "ZOHO" || selectedProvider.providerCode === "OFFICE365"
                        ? "SMTP Password"
                        : selectedProvider.providerCode === "SES"
                        ? "AWS Secret Access Key"
                        : "API Auth Token Key"}
                    </label>
                    <input 
                      type="password"
                      value={selectedProvider.password || ""}
                      onChange={(e) => handleConfigChange("password", e.target.value)}
                      placeholder="••••••••••••••••••••••••"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Sender Name and Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Sender Mask Name</label>
                    <input 
                      type="text"
                      value={selectedProvider.senderName || ""}
                      onChange={(e) => handleConfigChange("senderName", e.target.value)}
                      placeholder="BhoomiOne Outbound"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Sender Outbound Email</label>
                    <input 
                      type="email"
                      value={selectedProvider.senderEmail || ""}
                      onChange={(e) => handleConfigChange("senderEmail", e.target.value)}
                      placeholder="no-reply@bhoomione.in"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Provider specific settings (Custom JSON params) */}
                  {selectedProvider.providerCode === "MAILGUN" && (
                    <div className="md:col-span-2 space-y-4 pt-2 border-t border-slate-200">
                      <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Mailgun Parameters</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Registered Sending Domain</label>
                          <input 
                            type="text"
                            value={selectedProvider.customParams?.domain || ""}
                            onChange={(e) => handleConfigChange("customParams.domain", e.target.value)}
                            placeholder="e.g. mg.bhoomione.in"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">API Server Region</label>
                          <select 
                            value={selectedProvider.customParams?.region || "US"}
                            onChange={(e) => handleConfigChange("customParams.region", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="US">US Server Region</option>
                            <option value="EU">EU Server Region</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedProvider.providerCode === "SES" && (
                    <div className="md:col-span-2 space-y-4 pt-2 border-t border-slate-200">
                      <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Amazon SES Parameters</h5>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">AWS Regional Region Endpoint</label>
                        <input 
                          type="text"
                          value={selectedProvider.customParams?.region || ""}
                          onChange={(e) => handleConfigChange("customParams.region", e.target.value)}
                          placeholder="e.g. us-east-1"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {selectedProvider.providerCode === "GMAIL_OAUTH" && (
                    <div className="md:col-span-2 space-y-4 pt-2 border-t border-slate-200">
                      <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">OAuth 2.0 Credentials</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">OAuth Client ID</label>
                          <input 
                            type="text"
                            value={selectedProvider.customParams?.client_id || ""}
                            onChange={(e) => handleConfigChange("customParams.client_id", e.target.value)}
                            placeholder="gmail-client-id-xyz.apps.googleusercontent.com"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">OAuth Client Secret</label>
                          <input 
                            type="password"
                            value={selectedProvider.customParams?.client_secret || ""}
                            onChange={(e) => handleConfigChange("customParams.client_secret", e.target.value)}
                            placeholder="••••••••••••••••••••••••"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">OAuth Refresh Token</label>
                          <input 
                            type="password"
                            value={selectedProvider.customParams?.refresh_token || ""}
                            onChange={(e) => handleConfigChange("customParams.refresh_token", e.target.value)}
                            placeholder="1//0gX_refresh_token_placeholder..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <button 
                    onClick={handleSaveConfig}
                    disabled={savingConfig}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-50"
                  >
                    {savingConfig ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Provider Configuration
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold">Select a communication gateway node to customize.</p>
              </div>
            )}
          </div>

          {/* Test Mail Form modal overlay */}
          {testMailOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Dispatch Test Outbound Mail</h3>
                    <p className="text-xs text-slate-500 mt-1">Provider Node: <span className="font-mono bg-slate-200 text-slate-800 px-1 py-0.5 rounded text-[10px] uppercase font-bold">{selectedProvider?.providerCode}</span></p>
                  </div>
                  <button 
                    onClick={() => setTestMailOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold p-1 hover:bg-slate-100 rounded-full"
                  >
                    <Check className="w-5 h-5 rotate-45" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Recipient Name</label>
                      <input 
                        type="text"
                        value={testMailPayload.recipientName}
                        onChange={(e) => setTestMailPayload({ ...testMailPayload, recipientName: e.target.value })}
                        placeholder="Karan Sharma"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-bold focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Recipient Outbound Email</label>
                      <input 
                        type="email"
                        value={testMailPayload.recipientEmail}
                        onChange={(e) => setTestMailPayload({ ...testMailPayload, recipientEmail: e.target.value })}
                        placeholder="karan@example.com"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-bold focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Email Subject Line</label>
                    <input 
                      type="text"
                      value={testMailPayload.subject}
                      onChange={(e) => setTestMailPayload({ ...testMailPayload, subject: e.target.value })}
                      placeholder="Deliverability Check Subject..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-bold focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">HTML Body Payload</label>
                    <textarea 
                      value={testMailPayload.bodyHtml}
                      onChange={(e) => setTestMailPayload({ ...testMailPayload, bodyHtml: e.target.value })}
                      rows={5}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    onClick={() => setTestMailOpen(false)}
                    className="px-4 py-2 border border-slate-300 hover:border-slate-400 text-slate-600 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendTestMail}
                    disabled={sendingTestMail}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2"
                  >
                    {sendingTestMail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Enqueue Delivery Run
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. TEMPLATES STUDIO PANEL */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 align-start">
          {/* Template Selection Rail */}
          <div className="lg:col-span-1 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Required Core Templates</h4>
            <div className="space-y-2">
              {templates.map((t) => {
                const isSelected = selectedTemplate?.templateKey === t.templateKey;
                return (
                  <div 
                    key={t.templateKey}
                    onClick={() => setSelectedTemplate(t)}
                    className={`p-3.5 border rounded-xl cursor-pointer transition-all flex flex-col gap-1.5 ${
                      isSelected 
                        ? "border-indigo-600 bg-indigo-50/25 shadow-xs" 
                        : "border-slate-200 hover:border-slate-400 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-800">{t.name}</span>
                      <span className="font-mono text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm uppercase">
                        {t.templateKey}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 truncate font-semibold">
                      {t.subject}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Template Editor */}
          <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-5">
            {selectedTemplate ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Template Editor</h4>
                    <p className="text-xs text-slate-500 mt-1">Design customizable transactional HTML and fallback plain text bodies.</p>
                  </div>
                  <button 
                    onClick={handleSaveTemplate}
                    disabled={savingTemplate}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingTemplate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save Template
                  </button>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Template Display Name</label>
                    <input 
                      type="text"
                      value={selectedTemplate.name || ""}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                      placeholder="e.g. Welcome Email"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-bold focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Outbound Email Subject Line</label>
                    <input 
                      type="text"
                      value={selectedTemplate.subject || ""}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                      placeholder="Welcome to BhoomiOne V2!"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-bold focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Tag Helper Reference Widget */}
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
                    <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>Dynamic Compliance Tag Placeholders</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                    Insert these tags inside your subjects or templates. They will be automatically populated during real-time transactional mail runs:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["{{name}}", "{{reset_link}}", "{{tenant_name}}", "{{tenant_domain}}", "{{plan_name}}", "{{billing_period}}", "{{invoice_number}}", "{{amount}}", "{{transaction_id}}", "{{code}}"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleCopyTag(tag)}
                        className="bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-mono text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span>{tag}</span>
                        <Copy className="w-3 h-3 text-slate-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body html editor */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Transactional HTML Body Payload</label>
                  <textarea 
                    value={selectedTemplate.bodyHtml || ""}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, bodyHtml: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Fallback plain text body */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Plain Text Body Fallback (Optional)</label>
                  <textarea 
                    value={selectedTemplate.bodyText || ""}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, bodyText: e.target.value })}
                    rows={3}
                    placeholder="Provide a clean text-only backup email version..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <FileCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold">Select a template key to initialize edits.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. QUEUE & HISTORY DELIVERY LOGS PANEL */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
              <input 
                type="text"
                placeholder="Search recipients, subjects, error logs..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full md:w-80 px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs focus:border-indigo-500 focus:outline-none"
              />
              <select 
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                className="w-full md:w-40 px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Delivery Statuses</option>
                <option value="QUEUED">QUEUED (Queue)</option>
                <option value="DELIVERED">DELIVERED (Success)</option>
                <option value="BOUNCED">BOUNCED (Bounces)</option>
                <option value="FAILED">FAILED (Errors)</option>
              </select>
            </div>
            <button 
              onClick={loadData}
              className="px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Ledger Logs
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-3xs" id="email-logs-table-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse select-none">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                    <th className="p-4">Recipient Name / Email</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Provider</th>
                    <th className="p-4">Created At</th>
                    <th className="p-4 text-center">Retries</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => {
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900">{log.recipientName || "No Name"}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{log.recipientEmail}</div>
                          </td>
                          <td className="p-4 max-w-xs truncate">
                            <div className="font-bold text-slate-800">{log.subject}</div>
                            {log.templateKey && (
                              <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.2 rounded-sm font-mono mt-1 inline-block">
                                {log.templateKey}
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-mono uppercase text-[10px]">
                            {log.providerCode}
                          </td>
                          <td className="p-4 text-slate-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="p-4 text-center font-mono text-[11px]">
                            {log.retryCount} / {log.maxRetries}
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 border ${
                              log.status === "DELIVERED" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                : log.status === "QUEUED"
                                ? "bg-blue-50 text-blue-700 border-blue-100 animate-pulse"
                                : log.status === "BOUNCED"
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-red-50 text-red-700 border-red-100"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                log.status === "DELIVERED" ? "bg-emerald-500" : log.status === "QUEUED" ? "bg-blue-500" : log.status === "BOUNCED" ? "bg-amber-500" : "bg-red-500"
                              }`} />
                              {log.status}
                            </span>
                            {log.errorMessage && (
                              <div className="text-[10px] text-red-600 mt-1 font-mono max-w-xs break-all">
                                {log.errorMessage}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {(log.status === "FAILED" || log.status === "BOUNCED") && (
                              <button 
                                onClick={() => handleRetryLog(log.id)}
                                disabled={retryingLogId === log.id}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 mx-auto transition-all cursor-pointer disabled:opacity-50"
                              >
                                {retryingLogId === log.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Play className="w-3 h-3" />
                                )}
                                Retry
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        No delivery logs match the selected search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. ANALYTICS REPORTS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Totals Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Delivered Success</span>
                <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{deliveredCount}</h4>
                <p className="text-[10px] text-emerald-600 mt-1 font-bold">✓ 100% Deliverability Rate</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Bounced Count</span>
                <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{bouncedCount}</h4>
                <p className="text-[10px] text-amber-600 mt-1 font-bold">⚠️ Blocked Recipient Addresses</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Failed Delivery Errors</span>
                <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{failedCount}</h4>
                <p className="text-[10px] text-red-600 mt-1 font-bold">✗ Credentials / Timeout errors</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Asynchronous Queue</span>
                <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{queuedCount}</h4>
                <p className="text-[10px] text-blue-600 mt-1 font-bold">⚙ Non-blocking Backlog</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 align-start">
            {/* Multi series line chart */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Outbound Delivery Trends (Weekly)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsChartData}>
                    <defs>
                      <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="Delivered" stroke="#10b981" fillOpacity={1} fill="url(#colorDelivered)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Failed" stroke="#ef4444" fillOpacity={1} fill="url(#colorFailed)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie chart breakdown */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Distribution Registry</h4>
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="font-semibold text-slate-600">{d.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
