import React, { useState, useEffect } from "react";
import { 
  RefreshCw, Terminal, Search, Calendar, ChevronLeft, ChevronRight, 
  Eye, Sliders, X, Database, User, Shield, Info, Clock, CheckCircle2,
  AlertCircle, Server, Table, List, Globe, Laptop
} from "lucide-react";
import { api } from "../../lib/api";

interface AuditLog {
  id: string;
  action: string;
  target: string;
  operator: string;
  details: string;
  timestamp: string;
  entity_name?: string;
  entity_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
}

interface AuditLogsTabProps {
  onShowToast: (message: string, type: "success" | "error") => void;
}

const COMMON_ACTIONS = [
  "LOGIN_SUCCESS",
  "SUBSCRIPTION_CHANGE_SUCCESS",
  "PLAN_CHANGED",
  "ADDON_ASSIGNED",
  "MODULE_UPDATE_SUCCESS",
  "FEATURE_UPDATE_SUCCESS",
  "SETTINGS_UPDATE_SUCCESS",
  "SLAB_UPDATE_SUCCESS",
  "TENANT_PROVISIONED",
  "TENANT_SUSPENDED",
  "TENANT_RESUMED",
  "PLATFORM_SETTINGS_SAVE_SUCCESS",
  "SUBSCRIPTION_OVERRIDES_UPDATE"
];

export default function AuditLogsTab({ onShowToast }: AuditLogsTabProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter form states
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [operatorSearch, setOperatorSearch] = useState<string>("");
  const [targetSearch, setTargetSearch] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [hideNoise, setHideNoise] = useState<boolean>(true);
  
  // Pagination and Limit states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [lastPage, setLastPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(25);

  // Detail Drawer state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, limit]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pass filters to our robust Laravel API
      const params = {
        action: selectedAction || undefined,
        operator: operatorSearch || undefined,
        target: targetSearch || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        hide_noise: hideNoise,
        limit: limit,
        page: currentPage
      };

      const response = await api.fetchAdminAuditLogs(params);
      
      // Support both array response and standard paginated response from backend
      if (response && response.data !== undefined) {
        setLogs(response.data);
        setTotalItems(response.total || response.data.length);
        setLastPage(response.last_page || 1);
      } else if (Array.isArray(response)) {
        setLogs(response);
        setTotalItems(response.length);
        setLastPage(1);
      } else {
        setLogs([]);
        setTotalItems(0);
        setLastPage(1);
      }
    } catch (err: any) {
      console.error("Failed to fetch audit logs:", err);
      setError("Failed to extract system telemetry audit logs from database gateway.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSelectedAction("");
    setOperatorSearch("");
    setTargetSearch("");
    setDateFrom("");
    setDateTo("");
    setHideNoise(true);
    setCurrentPage(1);
    // Use a small timeout to let states clear before calling API
    setTimeout(() => {
      fetchLogs();
    }, 50);
  };

  // Helper to categorize log dates into Today, Yesterday, or Older
  const groupLogsByDate = (logsList: AuditLog[]) => {
    const today: AuditLog[] = [];
    const yesterday: AuditLog[] = [];
    const older: AuditLog[] = [];

    const now = new Date();
    const todayStr = now.toDateString();
    
    const yesterdayDate = new Date();
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterdayStr = yesterdayDate.toDateString();

    logsList.forEach(log => {
      const logDate = new Date(log.timestamp);
      const logDateStr = logDate.toDateString();

      if (logDateStr === todayStr) {
        today.push(log);
      } else if (logDateStr === yesterdayStr) {
        yesterday.push(log);
      } else {
        older.push(log);
      }
    });

    return { today, yesterday, older };
  };

  const { today, yesterday, older } = groupLogsByDate(logs);

  const getActionStyles = (action: string) => {
    if (action.includes("PROVISIONED") || action.includes("SUCCESS")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    }
    if (action.includes("SUSPENDED") || action.includes("EXPIRED")) {
      return "bg-amber-50 text-amber-700 border-amber-100";
    }
    if (action.includes("CHANGED") || action.includes("UPDATE") || action.includes("ASSIGNED") || action.includes("OVERRIDES")) {
      return "bg-indigo-50 text-indigo-700 border-indigo-100";
    }
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6 font-sans" id="audit-logs-tab">
      
      {/* 1. COMPREHENSIVE FILTER BAR PANEL */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5" id="logs-filter-panel">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Advanced Telemetry Search Filters</h3>
        </div>

        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          
          {/* Action Search */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Action Code Type</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 bg-white text-xs rounded-lg text-slate-750 font-medium"
            >
              <option value="">All Actions</option>
              {COMMON_ACTIONS.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {/* Operator Search */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Operator (User Email)</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g., admin@bhoomione.in"
                value={operatorSearch}
                onChange={(e) => setOperatorSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-white text-xs rounded-lg text-slate-750 outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Target/Tenant Search */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Target Workspace / Client</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g., SYSTEM or tenant1"
                value={targetSearch}
                onChange={(e) => setTargetSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-white text-xs rounded-lg text-slate-750 outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Limit settings */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Logs count per page</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 bg-white text-xs rounded-lg text-slate-750 font-medium"
            >
              <option value={10}>10 records</option>
              <option value={25}>25 records (Default)</option>
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
            </select>
          </div>

          {/* Date From */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Date From</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-white text-xs rounded-lg text-slate-750"
              />
            </div>
          </div>

          {/* Date To */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Date To</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-white text-xs rounded-lg text-slate-750"
              />
            </div>
          </div>

          {/* Hide Noise Toggle Switch */}
          <div className="flex items-center gap-2.5 bg-white border border-slate-200 p-2.5 rounded-lg select-none">
            <input
              type="checkbox"
              id="noise-toggle-checkbox"
              checked={hideNoise}
              onChange={(e) => setHideNoise(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
            />
            <label htmlFor="noise-toggle-checkbox" className="text-xs font-bold text-slate-600 cursor-pointer uppercase tracking-tight">
              Hide system noise (TOKEN_REFRESH)
            </label>
          </div>

          {/* Button actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-1/2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Apply Search
            </button>
          </div>

        </form>
      </div>

      {/* 2. MAIN LOG CONTENT TABLE SECTION */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-3xs" id="logs-table-container">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Dynamic Activity Logs List</h2>
            <p className="text-[11px] text-slate-450">Displaying {totalItems} telemetric actions found according to current parameters.</p>
          </div>
          <button 
            onClick={fetchLogs}
            disabled={loading}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </button>
        </div>

        {error && (
          <div className="m-5 p-4 bg-red-50 border border-red-150 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-extrabold text-red-950 uppercase">Error Loading Telemetry Logs</p>
              <p className="text-xs text-red-800 font-sans">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-500 font-bold font-sans">Decoding ledger streaming keys...</p>
          </div>
        ) : !error && logs.length === 0 ? (
          <div className="p-16 text-center border-dashed border-2 border-slate-100 m-5 rounded-2xl">
            <Terminal className="w-8 h-8 text-slate-350 mx-auto mb-3" />
            <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">No stream logs cached.</p>
            <p className="text-[11px] text-slate-450 mt-1 font-sans">No records found matching current query parameters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            
            {/* GROUP DISPLAY SECTIONS */}
            {[
              { title: "Today's Telemetry Stream", items: today },
              { title: "Yesterday's Telemetry Stream", items: yesterday },
              { title: "Older Telemetry Records", items: older }
            ].map((group, groupIdx) => {
              if (group.items.length === 0) return null;
              return (
                <div key={groupIdx} className="space-y-0">
                  <div className="px-5 py-2.5 bg-slate-100/50 border-y border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    {group.title} ({group.items.length} records)
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider font-mono border-b border-slate-100">
                          <th className="px-5 py-3 w-28">Timestamp</th>
                          <th className="px-5 py-3 w-56">Action Executed</th>
                          <th className="px-5 py-3 w-48">Operator</th>
                          <th className="px-5 py-3 w-32">Target/Scope</th>
                          <th className="px-5 py-3">Details / Entity</th>
                          <th className="px-5 py-3 text-right w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {group.items.map(l => (
                          <tr 
                            key={l.id} 
                            onClick={() => setSelectedLog(l)}
                            className="hover:bg-slate-50/75 transition-all duration-150 cursor-pointer group"
                          >
                            <td className="px-5 py-3.5 font-mono text-slate-450 text-[11px]">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border font-mono tracking-tight ${getActionStyles(l.action)}`}>
                                {l.action}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-700 font-medium">
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[160px]" title={l.operator}>{l.operator}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 font-bold font-mono">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${l.target === 'SYSTEM' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                                {l.target}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-600 font-sans max-w-sm truncate" title={l.details}>
                              {l.details}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLog(l);
                                }}
                                className="inline-flex items-center gap-1 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-[10px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer shadow-3xs"
                              >
                                <Eye className="w-3 h-3" />
                                Inspect
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

          </div>
        )}

        {/* PAGINATION PANEL FOOTER */}
        {!loading && !error && totalItems > 0 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50" id="logs-pagination-footer">
            <span className="text-xs text-slate-500 font-medium font-sans">
              Showing page <strong className="font-extrabold text-slate-800">{currentPage}</strong> of <strong className="font-extrabold text-slate-800">{lastPage}</strong> (Total: {totalItems} logs)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-3xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, lastPage))}
                disabled={currentPage === lastPage}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 p-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-3xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. LOG INSPECT DETAIL DRAWER MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 animate-fadeIn" id="log-inspect-modal">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between animate-slideLeft font-sans">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-mono uppercase tracking-wider select-none">
                  Telemetry Payload Analyzer
                </span>
                <h3 className="text-xs font-extrabold text-slate-950 uppercase tracking-wide flex items-center gap-2 mt-1">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  Inspect: {selectedLog.action}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {/* Telemetry Core Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Executed By (Operator)</span>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {selectedLog.operator}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Target Domain / Subdomain</span>
                  <p className="text-xs font-bold text-indigo-700 flex items-center gap-1.5 font-mono">
                    <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    {selectedLog.target}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Exact Timestamp</span>
                  <p className="text-xs font-medium text-slate-750 flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Gateway Client IP Address</span>
                  <p className="text-xs font-medium text-slate-750 flex items-center gap-1.5 font-mono">
                    <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {selectedLog.ip_address || "127.0.0.1 (Internal Proxy)"}
                  </p>
                </div>
              </div>

              {/* Action Narrative Details */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Standard Event Log Narrative</span>
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs font-medium text-indigo-950 font-sans leading-relaxed">
                  {selectedLog.details}
                </div>
              </div>

              {/* Dynamic Metadata Diffs section (new_values vs old_values) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Payload Changes State Diff</h4>
                </div>

                {selectedLog.new_values ? (
                  <div className="space-y-4">
                    {/* Displaying original and transformed payload side by side or as single formatted block */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">State Transformation Parameters (payload)</span>
                      <div className="p-4 bg-slate-900 border border-slate-950 rounded-xl overflow-x-auto shadow-inner">
                        <pre className="text-[10px] font-mono text-emerald-450 leading-relaxed text-left text-white whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.new_values, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {selectedLog.old_values && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Previous baseline variables (before change)</span>
                        <div className="p-4 bg-slate-900 border border-slate-950 rounded-xl overflow-x-auto shadow-inner">
                          <pre className="text-[10px] font-mono text-slate-400 leading-relaxed text-left whitespace-pre-wrap">
                            {JSON.stringify(selectedLog.old_values, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-sans">
                    No state-transformation data payload is stored for access-related operations.
                  </div>
                )}
              </div>

              {/* User Agent telemetry */}
              {selectedLog.user_agent && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Client Browser User-Agent Header</span>
                  <p className="text-[10px] font-mono text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border leading-relaxed break-all">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}

            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 text-right">
              <button 
                onClick={() => setSelectedLog(null)}
                className="bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
