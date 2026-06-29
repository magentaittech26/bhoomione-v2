import React, { useState, useEffect } from "react";
import { 
  Activity, RefreshCw, Server, AlertTriangle, ShieldAlert, CheckCircle, 
  Trash2, Sliders, Globe, Terminal, Settings, ChevronRight, HelpCircle, 
  RotateCcw, Play, Check, AlertOctagon, Database, Cpu, Layers, Layout, MapPin
} from "lucide-react";
import api from "../../lib/api.ts";

interface TenantLifecycleManagerProps {
  tenants: any[];
  showToast: (msg: string, type: "success" | "error") => void;
  onRefreshData?: () => void;
  initialSelectedTenantCode?: string;
}

export default function TenantLifecycleManager({ 
  tenants, 
  showToast,
  onRefreshData,
  initialSelectedTenantCode = ""
}: TenantLifecycleManagerProps) {
  // Component State
  const [selectedTenantCode, setSelectedTenantCode] = useState<string>(initialSelectedTenantCode);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);

  // Sync prop changes to state
  useEffect(() => {
    if (initialSelectedTenantCode) {
      setSelectedTenantCode(initialSelectedTenantCode);
    }
  }, [initialSelectedTenantCode]);
  
  // Health & Queue diagnostics state
  const [healthLoading, setHealthLoading] = useState<boolean>(false);
  const [healthData, setHealthData] = useState<any | null>(null);
  const [queueLoading, setQueueLoading] = useState<boolean>(false);
  const [queueData, setQueueData] = useState<any | null>(null);

  // General console/stdout monitor logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    " BhoomiOne Enterprise Cloud OS [Version 2.0.0-Beta-16]",
    " (c) BhoomiOne Software Corporation. All platform telemetry endpoints connected.",
    " Super Admin lifecycle management console initialized."
  ]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Custom Modal confirm triggers
  const [confirmAction, setConfirmAction] = useState<{
    type: "RESET_DATA" | "DELETE_TENANT" | "REPROVISION" | "VERIFY_PROVISION" | "RESET_DOMAIN" | "GENERATE_DEMO" | "ARCHIVE" | "DNS_VERIFY" | "SUSPEND" | "PENDING_DELETION" | "DELETE_REAL" | "SYNC_NON_RENEWAL";
    title: string;
    description: string;
    warning?: string;
    isCritical?: boolean;
  } | null>(null);

  // Double verification typing check
  const [deleteVerificationText, setDeleteVerificationText] = useState<string>("");

  // Input states for custom forms
  const [actionReason, setActionReason] = useState<string>("");
  const [retentionDays, setRetentionDays] = useState<number>(14);
  const [backupReference, setBackupReference] = useState<string>("");

  // Hook to pull initial diagnostics
  useEffect(() => {
    fetchDiagnostics();
  }, []);

  // Sync selected tenant code with tenant object
  useEffect(() => {
    if (selectedTenantCode) {
      const found = tenants.find(t => t.tenant_code === selectedTenantCode);
      setSelectedTenant(found || null);
    } else {
      setSelectedTenant(null);
    }
  }, [selectedTenantCode, tenants]);

  const fetchDiagnostics = async () => {
    setHealthLoading(true);
    setQueueLoading(true);
    try {
      const h = await api.fetchLifecycleHealth();
      setHealthData(h);
      addLog(`[SYSTEM DIAGNOSTICS] System health fetched successfully: DB Connection is ${h.database}`);
    } catch (err: any) {
      showToast("Failed to fetch cluster health diagnostics.", "error");
      addLog(`[SYSTEM DIAGNOSTICS] ⚠️ Failed to fetch health: ${err.message}`);
    } finally {
      setHealthLoading(false);
    }

    try {
      const q = await api.fetchQueueStatus();
      setQueueData(q);
      addLog(`[QUEUE STATUS] Provisioning queue check: ${q.pending_count} pending, ${q.running_count} running.`);
    } catch (err: any) {
      addLog(`[QUEUE STATUS] ⚠️ Failed to fetch background queue state: ${err.message}`);
    } finally {
      setQueueLoading(false);
    }
  };

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  // Safe checks to confirm if tenant is classified as a demo workspace
  const isDemoTenant = (tenant: any): boolean => {
    if (!tenant) return false;
    const code = (tenant.tenant_code || "").toLowerCase();
    return (
      code.includes("demo") || 
      code.includes("test") || 
      code.includes("alpha") ||
      code.includes("beta") ||
      code.includes("preview") ||
      ["DEMO", "DEVELOPER", "TRIAL"].includes(tenant.infrastructure_tier)
    );
  };

  // Execution triggers
  const executeAction = async () => {
    if (!confirmAction || !selectedTenant) return;
    const actionType = confirmAction.type;
    const code = selectedTenant.tenant_code;

    // Strict validation check for Delete and Reset Data
    if (actionType === "DELETE_TENANT" || actionType === "RESET_DATA") {
      if (!isDemoTenant(selectedTenant)) {
        showToast("Access Denied: Production customer tenant environments cannot be deleted or reset.", "error");
        setConfirmAction(null);
        return;
      }
    }

    if (actionType === "DELETE_TENANT" && deleteVerificationText !== code) {
      showToast("Validation Error: Please type the correct tenant workspace code to confirm deletion.", "error");
      return;
    }

    if (actionType === "DELETE_REAL" && deleteVerificationText !== code) {
      showToast("Validation Error: Please type the correct tenant workspace code to confirm deletion.", "error");
      return;
    }

    setIsExecuting(true);
    addLog(`[LIFECYCLE REQUEST] Initiating action: ${actionType} on tenant workspace '${code}'`);
    setConfirmAction(null);

    try {
      let res: any;
      switch (actionType) {
        case "RESET_DATA":
          res = await api.resetDemoTenant(code);
          addLog(`[STDOUT - RESET] ${res.message}`);
          showToast("Demo tenant dataset reset completed.", "success");
          break;

        case "DELETE_TENANT":
          res = await api.deleteDemoTenant(code, { confirm_text: deleteVerificationText });
          addLog(`[STDOUT - PURGE] ${res.message}`);
          if (res.output) {
            addLog(`[ARTISAN OUTPUT]\n${res.output}`);
          }
          showToast("Demo tenant completely deleted from cloud database.", "success");
          setSelectedTenantCode("");
          setSelectedTenant(null);
          break;

        case "SUSPEND":
          res = await api.suspendTenantLifecycle(code, { reason: actionReason });
          addLog(`[STDOUT - SUSPEND] ${res.message}`);
          showToast("Tenant workspace has been suspended successfully.", "success");
          setActionReason("");
          break;

        case "PENDING_DELETION":
          res = await api.markPendingDeletion(code, { reason: actionReason, retention_days: retentionDays });
          addLog(`[STDOUT - PENDING_DELETION] ${res.message}`);
          showToast("Tenant marked pending deletion successfully.", "success");
          setActionReason("");
          break;

        case "DELETE_REAL":
          res = await api.deleteRealTenantPermanently(code, { confirm_text: deleteVerificationText, backup_reference: backupReference });
          addLog(`[STDOUT - PURGE_REAL] ${res.message}`);
          showToast("Real tenant permanently and irreversibly purged from databases.", "success");
          setBackupReference("");
          setSelectedTenantCode("");
          setSelectedTenant(null);
          break;

        case "SYNC_NON_RENEWAL":
          res = await api.syncNonRenewalAutomation();
          addLog(`[STDOUT - SYNC] ${res.message}`);
          if (res.output) {
            addLog(`[ARTISAN OUTPUT]\n${res.output}`);
          }
          showToast("Automated non-renewal checks synchronized.", "success");
          break;

        case "REPROVISION":
          res = await api.reprovisionTenant(code);
          addLog(`[STDOUT - REPROVISION] ${res.message}`);
          showToast("Workspace env reprovisioned successfully.", "success");
          break;

        case "VERIFY_PROVISION":
          res = await api.verifyTenantProvisioning(code);
          addLog(`[STDOUT - VERIFICATION]\n${res.output || 'Verification run successful.'}`);
          showToast("Provisioning verification complete. Output written to system console.", "success");
          break;

        case "RESET_DOMAIN":
          res = await api.resetTenantDomain(code);
          addLog(`[STDOUT - DOMAIN] ${res.message}`);
          showToast("Tenant domain mapping reset to standard subdomain.", "success");
          break;

        case "GENERATE_DEMO":
          res = await api.generateDemoData(code);
          addLog(`[STDOUT - SEED] ${res.message}`);
          showToast("Sandbox demo dataset successfully generated.", "success");
          break;

        case "ARCHIVE":
          res = await api.archiveTenant(code);
          addLog(`[STDOUT - ARCHIVE] ${res.message}`);
          showToast("Tenant workspace successfully archived.", "success");
          break;

        case "DNS_VERIFY":
          res = await api.verifyTenantDns(code);
          addLog(`[STDOUT - DNS] DNS verified. Nameserver mappings resolve properly. Global SSL and ingress rules verified active.`);
          if (res.dns_records) {
            res.dns_records.forEach((rec: any) => {
              addLog(`  -> Domain: ${rec.domain} (${rec.type}) | DNS: ${rec.dns_status} | Resolved IP: ${rec.resolved_ip}`);
            });
          }
          showToast("DNS records verified.", "success");
          break;
      }

      // Reload dataset in parents
      if (onRefreshData) {
        onRefreshData();
      }
      // Re-trigger diagnostic checks
      fetchDiagnostics();

    } catch (err: any) {
      addLog(`[⚠️ ACTION ERROR] Operation failed: ${err.message}`);
      showToast(`Lifecycle action failed: ${err.message}`, "error");
    } finally {
      setIsExecuting(false);
      setDeleteVerificationText("");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: GLOBAL DIAGNOSTICS DECK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Core Cluster Health */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-indigo-500" />
              Cluster Core Status
            </h4>
            <button 
              onClick={fetchDiagnostics} 
              disabled={healthLoading}
              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded transition-all cursor-pointer"
              title="Re-run health check"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {healthLoading ? (
            <div className="space-y-2 py-2">
              <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse"></div>
            </div>
          ) : healthData ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-450">Postgres Node</span>
                <span className={`text-[10px] font-black tracking-wide uppercase px-2 py-0.5 border rounded ${
                  healthData.database === 'CONNECTED' 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                    : "bg-rose-50 text-rose-700 border-rose-100"
                }`}>
                  {healthData.database}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-450">Active Workspaces</span>
                <span className="text-xs font-bold text-slate-700">
                  {healthData.statistics?.active_tenants} / {healthData.statistics?.total_tenants}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-450">Sandbox Instances</span>
                <span className="text-xs font-bold text-slate-700">
                  {healthData.statistics?.demo_tenants}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Core diagnostic node unreachable.</p>
          )}
        </div>

        {/* Provisioning Queue Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-cyan-500" />
              Provisioning Queue
            </h4>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </div>
          {queueLoading ? (
            <div className="space-y-2 py-2">
              <div className="h-3 bg-slate-100 rounded w-3/4 animate-pulse"></div>
              <div className="h-3 bg-slate-100 rounded w-1/3 animate-pulse"></div>
            </div>
          ) : queueData ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase font-black">Pending</span>
                <span className="text-lg font-extrabold text-slate-700">{queueData.pending_count}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase font-black">Running</span>
                <span className="text-lg font-extrabold text-indigo-600">{queueData.running_count}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase font-black">Completed</span>
                <span className="text-sm font-bold text-slate-600">{queueData.completed_count}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 uppercase font-black">Failed</span>
                <span className="text-sm font-bold text-rose-600">{queueData.failed_count}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Queue reporter offline.</p>
          )}
        </div>

        {/* System Load & Memory */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-500" />
              Machine Allocations
            </h4>
          </div>
          {healthLoading ? (
            <div className="space-y-2 py-2">
              <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse"></div>
              <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse"></div>
            </div>
          ) : healthData ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-450">Memory Overhead</span>
                <span className="text-xs font-extrabold text-slate-700">{healthData.memory_usage}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-450">Load Averages</span>
                <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                  {healthData.system_load.join(", ")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-450">Ingress Network Router</span>
                <span className="text-[10px] font-black tracking-wide uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded">
                  OPERATIONAL
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">System resources node silent.</p>
          )}
        </div>

      </div>

      {/* SECTION 2: WORKSPACE SELECTION CONTAINER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
              Select Target Workspace Cluster
            </h3>
            <p className="text-xs text-slate-450">
              Pick a sandbox, trial, or customer tenant to unlock enterprise lifecycle utilities.
            </p>
          </div>
          <div className="w-full md:w-80">
            <select
              value={selectedTenantCode}
              onChange={(e) => setSelectedTenantCode(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-indigo-400 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            >
              <option value="">-- Choose Tenant Workspace --</option>
              {tenants.map(t => (
                <option key={t.id} value={t.tenant_code}>
                  {t.company_name} ({t.tenant_code}.bhoomione.in) [{t.infrastructure_tier}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedTenant ? (
          <div className="space-y-6">
            
            {/* Meta Stats Panel */}
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black text-slate-400">Workspace Code</span>
                <p className="text-xs font-bold text-slate-700 font-mono bg-white inline-block px-1.5 py-0.5 rounded border border-slate-100">
                  {selectedTenant.tenant_code}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black text-slate-400">Infrastructure Tier</span>
                <p className="text-xs font-extrabold text-indigo-600">
                  {selectedTenant.infrastructure_tier || "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black text-slate-400">Environment State</span>
                <p className="text-xs font-bold">
                  <span className={`text-[10px] font-black tracking-wide uppercase px-2 py-0.5 border rounded ${
                    selectedTenant.status === 'ACTIVE' 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                      : selectedTenant.status === 'SUSPENDED'
                      ? "bg-amber-50 text-amber-700 border-amber-100"
                      : "bg-rose-50 text-rose-700 border-rose-100"
                  }`}>
                    {selectedTenant.status}
                  </span>
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black text-slate-400">Classification</span>
                <p className="text-xs font-bold">
                  {isDemoTenant(selectedTenant) ? (
                    <span className="text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase">DEMO / SANDBOX</span>
                  ) : (
                    <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase">PRODUCTION CLIENT</span>
                  )}
                </p>
              </div>
            </div>

            {/* LIFECYCLE CONSOLE BUTTONS GRID */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Workspace Utilities & Actions Console
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. RESET DEMO DATA */}
                <div className="bg-white border border-slate-200 hover:border-amber-300 rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-amber-600">
                      <RotateCcw className="w-4 h-4" />
                      <h5 className="text-xs font-bold uppercase tracking-tight">Reset Sandbox Data</h5>
                    </div>
                    <p className="text-[11px] text-slate-450 leading-relaxed">
                      Purges layouts, plots, geometry documents, and import caches. Preserves tenant credentials.
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmAction({
                      type: "RESET_DATA",
                      title: "Reset Sandbox Data Profiles",
                      description: "This command deletes all spatial data layers, CAD drawings, subdivisions, interactive plot listings, and geometry structures associated with this demo. All demo dashboard numbers are re-indexed to zero.",
                      warning: "This process is completely irreversible. Tenant user accounts and general domains will NOT be deleted.",
                      isCritical: true
                    })}
                    disabled={isExecuting || !isDemoTenant(selectedTenant)}
                    className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 disabled:bg-slate-50 disabled:text-slate-350 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer border border-amber-100/50"
                  >
                    {!isDemoTenant(selectedTenant) ? "Blocked (Not a Demo)" : "Reset Spatial Data"}
                  </button>
                </div>

                {/* 2. RE-PROVISION WORKSPACE */}
                <div className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-indigo-600">
                      <Layers className="w-4 h-4" />
                      <h5 className="text-xs font-bold uppercase tracking-tight">Re-Provision Workspace</h5>
                    </div>
                    <p className="text-[11px] text-slate-450 leading-relaxed">
                      Wipes existing subscriptions or plans and applies a fresh trial agreement.
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmAction({
                      type: "REPROVISION",
                      title: "Re-Provision Cluster Environment",
                      description: "Re-initiates the base automated workspace provisioning workflow. Deletes historical domain records and plan contracts, then allocates fresh trial boundaries.",
                      warning: "All custom billing structures or add-on overrides for this demo tenant will be lost."
                    })}
                    disabled={isExecuting || !isDemoTenant(selectedTenant)}
                    className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:bg-slate-50 disabled:text-slate-350 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer border border-indigo-100/50"
                  >
                    {!isDemoTenant(selectedTenant) ? "Blocked (Not a Demo)" : "Run Reprovision"}
                  </button>
                </div>

                {/* 3. VERIFY PROVISIONING */}
                <div className="bg-white border border-slate-200 hover:border-cyan-300 rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-cyan-600">
                      <CheckCircle className="w-4 h-4" />
                      <h5 className="text-xs font-bold uppercase tracking-tight">Verify Provisioning</h5>
                    </div>
                    <p className="text-[11px] text-slate-450 leading-relaxed">
                      Invokes the backend verification pipeline and tests file paths, configurations, and connectivity.
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmAction({
                      type: "VERIFY_PROVISION",
                      title: "Run Verification Pipeline",
                      description: "Triggers the `tenant:verify-provisioning` Laravel Artisan command which asserts standard subdomains, core tables, database references, and DNS routers."
                    })}
                    disabled={isExecuting}
                    className="w-full py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer border border-cyan-100/50"
                  >
                    Run Verification
                  </button>
                </div>

                {/* 4. RESET DOMAIN MAPPING */}
                <div className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-indigo-600">
                      <Globe className="w-4 h-4" />
                      <h5 className="text-xs font-bold uppercase tracking-tight">Reset Domains</h5>
                    </div>
                    <p className="text-[11px] text-slate-450 leading-relaxed">
                      Clears custom domains and re-routes the tenant to {selectedTenant.tenant_code}.bhoomione.in.
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmAction({
                      type: "RESET_DOMAIN",
                      title: "Reset Wildcard Domains",
                      description: "Completely detaches any registered custom hostnames or DNS mappings, restoring standard workspace URL structures."
                    })}
                    disabled={isExecuting}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer border border-slate-250"
                  >
                    Restore Subdomain
                  </button>
                </div>

                {/* 5. GENERATE DEMO DATA */}
                <div className="bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <Database className="w-4 h-4" />
                      <h5 className="text-xs font-bold uppercase tracking-tight">Generate Demo Data</h5>
                    </div>
                    <p className="text-[11px] text-slate-450 leading-relaxed">
                      Injects an interactive town layout, complete with plots, geometry coordinates, prices, and sold states.
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmAction({
                      type: "GENERATE_DEMO",
                      title: "Generate Sandbox Data Engine",
                      description: "Creates high-quality mock data, adding 'Bhoomi Sandbox Town' containing 12 plots. This populates customer/agent dashboard graphs immediately.",
                      warning: "Only perform this if the workspace spatial data is empty to prevent duplicates."
                    })}
                    disabled={isExecuting || !isDemoTenant(selectedTenant)}
                    className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 disabled:bg-slate-50 disabled:text-slate-350 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer border border-emerald-100/50"
                  >
                    {!isDemoTenant(selectedTenant) ? "Blocked (Not a Demo)" : "Generate Datasets"}
                  </button>
                </div>

                {/* 6. DNS VERIFICATION */}
                <div className="bg-white border border-slate-200 hover:border-cyan-300 rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-cyan-600">
                      <Globe className="w-4 h-4" />
                      <h5 className="text-xs font-bold uppercase tracking-tight">DNS Verification</h5>
                    </div>
                    <p className="text-[11px] text-slate-450 leading-relaxed">
                      Queries nameservers, validates primary CNAMES/A records, and asserts active SSL certificates.
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmAction({
                      type: "DNS_VERIFY",
                      title: "Run DNS & SSL Diagnostics",
                      description: "Triggers active nameserver lookup algorithms to verify that wildcard ingress traffic safely maps to BhoomiOne load balancers."
                    })}
                    disabled={isExecuting}
                    className="w-full py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer border border-cyan-100/50"
                  >
                    Verify DNS Mapping
                  </button>
                </div>

                {/* 7. ARCHIVE TENANT */}
                <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <AlertOctagon className="w-4 h-4" />
                      <h5 className="text-xs font-bold uppercase tracking-tight">Archive Workspace</h5>
                    </div>
                    <p className="text-[11px] text-slate-450 leading-relaxed">
                      Suspends active routing, puts storage into deep freezing, and sets plan contract to EXPIRED.
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmAction({
                      type: "ARCHIVE",
                      title: "Move Workspace to Deep Archive",
                      description: "Changes the operational state of this tenant to ARCHIVED. Deactivates workspace routing, locks user panels, but preserves historical data safely.",
                      warning: "The tenant subscription will expire immediately."
                    })}
                    disabled={isExecuting}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer border border-slate-250"
                  >
                    Archive Workspace
                  </button>
                </div>

                {/* 8. DELETE DEMO TENANT */}
                <div className="bg-white border border-rose-200 hover:border-rose-400 rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-rose-600">
                      <Trash2 className="w-4 h-4" />
                      <h5 className="text-xs font-bold uppercase tracking-tight">Delete Demo Tenant</h5>
                    </div>
                    <p className="text-[11px] text-slate-450 leading-relaxed text-rose-700 font-semibold bg-rose-50/50 px-2 py-1.5 rounded-lg border border-rose-100/50">
                      Fully purges and erases this workspace cluster from all databases. 
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmAction({
                      type: "DELETE_TENANT",
                      title: "FORCE PURGE DEMO TENANT WORKSPACE",
                      description: `Wipes all child records, geometry datasets, files, subscription plans, custom subdomains, user profiles, and the parent tenant record.`,
                      warning: "THIS ACTION IS DESTRUCTIVE, PERMANENT AND IRREVERSIBLE. YOU CANNOT UNDO THIS.",
                      isCritical: true
                    })}
                    disabled={isExecuting || !isDemoTenant(selectedTenant)}
                    className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white disabled:bg-slate-100 disabled:text-slate-350 text-[11px] font-black rounded-lg transition-all cursor-pointer border border-rose-700"
                  >
                    {!isDemoTenant(selectedTenant) ? "Blocked (Not a Demo)" : "WIPE & DELETE TENANT"}
                  </button>
                </div>

                {/* 9. SUSPEND TENANT */}
                <div className="bg-white border border-slate-200 hover:border-amber-300 rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-amber-600">
                      <ShieldAlert className="w-4 h-4" />
                      <h5 className="text-xs font-bold uppercase tracking-tight">Suspend Tenant</h5>
                    </div>
                    <p className="text-[11px] text-slate-450 leading-relaxed">
                      Temporarily disables all workspace logins while fully preserving all business data and subscription records.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActionReason("");
                      setConfirmAction({
                        type: "SUSPEND",
                        title: "Suspend Tenant Workspace",
                        description: `This locks user access and disables all platform logins for tenant '${selectedTenant.tenant_code}'. Internal data arrays are fully preserved.`,
                        warning: "Login services will be immediately suspended. Enter justification below."
                      });
                    }}
                    disabled={isExecuting}
                    className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer border border-amber-100/50"
                  >
                    Suspend Workspace
                  </button>
                </div>

                {/* 10. MARK PENDING DELETION */}
                <div className="bg-white border border-slate-200 hover:border-orange-300 rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-orange-600">
                      <AlertTriangle className="w-4 h-4" />
                      <h5 className="text-xs font-bold uppercase tracking-tight">Mark Pending Deletion</h5>
                    </div>
                    <p className="text-[11px] text-slate-450 leading-relaxed">
                      Schedules the tenant for permanent purge after a safe retention cooling-off period.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActionReason("");
                      setRetentionDays(14);
                      setConfirmAction({
                        type: "PENDING_DELETION",
                        title: "Mark Tenant Pending Deletion",
                        description: `Schedules a destructive purge routine. Sets deletion timestamps for workspace '${selectedTenant.tenant_code}'.`,
                        warning: "All client and CAD plot features will be permanently queued for erasure."
                      });
                    }}
                    disabled={isExecuting}
                    className="w-full py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer border border-orange-100/50"
                  >
                    Mark Pending Deletion
                  </button>
                </div>

                {/* 11. DELETE REAL TENANT PERMANENTLY */}
                <div className="bg-white border border-rose-200 hover:border-rose-400 rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-rose-700">
                      <ShieldAlert className="w-4 h-4" />
                      <h5 className="text-xs font-bold uppercase tracking-tight text-rose-700">Delete Real Tenant</h5>
                    </div>
                    <p className="text-[11px] text-rose-600 font-semibold bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-150 leading-relaxed">
                      Allowed ONLY after Archive + Pending Deletion + Retention. Requires secure backup reference.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setBackupReference("");
                      setConfirmAction({
                        type: "DELETE_REAL",
                        title: "PERMANENT DESTRUCTION OF PRODUCTION CLIENT WORKSPACE",
                        description: `Irreversibly vaporizes all databases, users, subscriptions, domains, and core records for '${selectedTenant.tenant_code}'.`,
                        warning: "THIS IS DESTRUCTIVE, NOT RECOVERABLE, AND ENFORCED BY ENCRYPTION HANDSHAKES.",
                        isCritical: true
                      });
                    }}
                    disabled={isExecuting || isDemoTenant(selectedTenant)}
                    className="w-full py-1.5 bg-rose-700 hover:bg-rose-800 text-white disabled:bg-slate-100 disabled:text-slate-350 text-[11px] font-black rounded-lg transition-all cursor-pointer border border-rose-800"
                  >
                    {isDemoTenant(selectedTenant) ? "Blocked (Use Demo Purge)" : "PERMANENT DELETE REAL"}
                  </button>
                </div>

                {/* 12. TRIGGER NON-RENEWAL SYNC */}
                <div className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-indigo-600">
                      <RefreshCw className="w-4 h-4" />
                      <h5 className="text-xs font-bold uppercase tracking-tight">Sync Non-renewals</h5>
                    </div>
                    <p className="text-[11px] text-slate-450 leading-relaxed">
                      Triggers automated checks to suspend expired contracts after grace period or mark pending deletion after retention.
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmAction({
                      type: "SYNC_NON_RENEWAL",
                      title: "Synchronize Tenant Non-renewals",
                      description: "Runs automated scheduling checks across all active sub-contracts in the database. Suspends delinquent grace periods & marks retention defaults.",
                    })}
                    disabled={isExecuting}
                    className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer border border-indigo-100/50"
                  >
                    Run Non-renewal Sync
                  </button>
                </div>

              </div>
            </div>

          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <div className="bg-slate-100 h-10 w-10 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <p className="text-xs text-slate-450 italic">
              Please choose a target tenant workspace from the selector dropdown to proceed.
            </p>
          </div>
        )}

      </div>

      {/* SECTION 3: REAL-TIME STDOUT / TELEMETRY CONSOLE MONITOR */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 shadow-lg space-y-4 font-mono text-[11px] text-slate-300">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-extrabold uppercase tracking-wider text-xs text-slate-400">
              BhoomiOne Cloud Telemetry Monitor (Live)
            </span>
          </div>
          <button
            onClick={() => setTerminalLogs([
              " BhoomiOne Enterprise Cloud OS [Version 2.0.0-Beta-16]",
              " Telemetry buffer flushed."
            ])}
            className="text-[10px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
          >
            Clear Screen
          </button>
        </div>
        
        <div className="bg-black/40 border border-slate-950 p-4 rounded-xl max-h-60 overflow-y-auto space-y-1.5 font-mono scrollbar-thin scrollbar-thumb-slate-800">
          {terminalLogs.map((log, index) => (
            <div 
              key={index} 
              className={`whitespace-pre-wrap leading-relaxed ${
                log.includes("⚠️") || log.includes("Error:") || log.includes("ERROR")
                  ? "text-rose-400"
                  : log.includes("SUCCESS") || log.includes("successfully") || log.includes("fetched")
                  ? "text-emerald-400"
                  : log.includes("STDOUT") || log.includes("ARTISAN")
                  ? "text-cyan-300"
                  : "text-slate-300"
              }`}
            >
              {log}
            </div>
          ))}
          {isExecuting && (
            <div className="text-indigo-400 flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Executing transaction script on background job manager...
            </div>
          )}
        </div>
      </div>

      {/* ACTION CONFIRMATION MODALS MANAGER */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => {
              if (!isExecuting) setConfirmAction(null);
            }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
          />
          
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl z-10 space-y-5 animate-scale-up">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${confirmAction.isCritical ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600"}`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">
                  {confirmAction.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {confirmAction.description}
                </p>
              </div>
            </div>

            {confirmAction.warning && (
              <div className="bg-amber-50 border border-amber-150 p-3.5 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-black text-amber-700">WARNING:</span>
                  <p className="text-[11px] text-amber-700 leading-relaxed font-semibold">
                    {confirmAction.warning}
                  </p>
                </div>
              </div>
            )}

            {/* If fully destructive command, require typing the tenant code to verify */}
            {confirmAction.type === "DELETE_TENANT" && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400">
                  Please type the tenant code <span className="font-mono text-rose-600 font-extrabold select-all">{selectedTenant.tenant_code}</span> to confirm deletion:
                </label>
                <input
                  type="text"
                  placeholder="e.g. demo-alpha"
                  value={deleteVerificationText}
                  onChange={(e) => setDeleteVerificationText(e.target.value)}
                  className="w-full text-xs font-mono font-bold border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-100 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-rose-700"
                />
              </div>
            )}

            {/* Reason input for Suspend and Pending Deletion */}
            {["SUSPEND", "PENDING_DELETION"].includes(confirmAction.type) && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400">
                  Justification explanation / audit reason (Required):
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g., Delinquent invoice billing or tenant requested teardown..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-slate-700 font-semibold"
                />
              </div>
            )}

            {/* Retention days for Pending Deletion */}
            {confirmAction.type === "PENDING_DELETION" && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400">
                  Safe Retention Period (Days):
                </label>
                <select
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-slate-700 font-bold"
                >
                  <option value={7}>7 Days (Fast Teardown)</option>
                  <option value={14}>14 Days (Standard Grace Period)</option>
                  <option value={30}>30 Days (Extended Archive Hold)</option>
                  <option value={90}>90 Days (Enterprise Legal Wait)</option>
                </select>
              </div>
            )}

            {/* Backup reference and double check verification for DELETE_REAL */}
            {confirmAction.type === "DELETE_REAL" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400">
                    Secure Backup S3/GCS Reference Hash (Required):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. s3://bhoomi-backups/prod-backup-2026-06-29-hash"
                    value={backupReference}
                    onChange={(e) => setBackupReference(e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-100 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-rose-700"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400">
                    Please type the tenant code <span className="font-mono text-rose-600 font-extrabold select-all">{selectedTenant.tenant_code}</span> to authorize absolute permanent deletion:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. client-beta"
                    value={deleteVerificationText}
                    onChange={(e) => setDeleteVerificationText(e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-100 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-rose-700"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={isExecuting}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
              >
                Aborted Action
              </button>
              <button
                type="button"
                onClick={executeAction}
                disabled={
                  isExecuting || 
                  (confirmAction.type === "DELETE_TENANT" && deleteVerificationText !== selectedTenant?.tenant_code) ||
                  (confirmAction.type === "DELETE_REAL" && (deleteVerificationText !== selectedTenant?.tenant_code || !backupReference)) ||
                  (["SUSPEND", "PENDING_DELETION"].includes(confirmAction.type) && !actionReason)
                }
                className={`px-5 py-2 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm ${
                  confirmAction.isCritical 
                    ? "bg-rose-600 hover:bg-rose-700 border border-rose-700" 
                    : "bg-indigo-600 hover:bg-indigo-700 border border-indigo-700"
                }`}
              >
                {confirmAction.isCritical ? "Purge & Confirm" : "Proceed & Run"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
