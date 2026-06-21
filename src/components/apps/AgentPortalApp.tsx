import React, { useState } from "react";
import { 
  Compass, 
  Search, 
  MapPin, 
  Activity, 
  FileCheck, 
  Users, 
  Plus, 
  LogIn, 
  Mail, 
  Lock, 
  ArrowRight,
  Sparkles,
  ClipboardList,
  Flame,
  CheckCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Sliders,
  LogOut
} from "lucide-react";

interface AgentPortalAppProps {
  tenantCode: string | null;
}

export default function AgentPortalApp({ tenantCode }: AgentPortalAppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("bhoomi_agent_auth") === "true";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"catalog" | "leads" | "commissions">("catalog");

  // Marketing Lead datasets & sales commission counters
  const [leads, setLeads] = useState([
    { id: "lead-01", name: "Rahan Malhotra", phone: "+91 91234 56780", interested_plot: "P-101", status: "HOT_LEAD", note: "Requested surveyor field clearance maps." },
    { id: "lead-02", name: "Deepak Sengupta", phone: "+91 99887 76655", interested_plot: "P-114", status: "CONTACTED", note: "Checking RERA approval credentials." },
    { id: "lead-03", name: "Ananya Iyer", phone: "+91 98877 66554", interested_plot: "P-120", status: "RESERVED", note: "Sent booking deposit receipt link." }
  ]);

  const [plots, setPlots] = useState([
    { id: "p-101", number: "P-101", area: "1,200 SQFT", cost: "$49,000", status: "AVAILABLE", block: "A Meadows" },
    { id: "p-102", number: "P-102", area: "1,500 SQFT", cost: "$62,000", status: "AVAILABLE", block: "A Meadows" },
    { id: "p-103", number: "P-103", area: "2,400 SQFT", cost: "$98,000", status: "RESERVED", block: "B Ridge" },
    { id: "p-104", number: "P-104", area: "1,200 SQFT", cost: "$49,000", status: "SOLD", block: "A Meadows" },
    { id: "p-105", number: "P-105", area: "4,000 SQFT", cost: "$160,000", status: "AVAILABLE", block: "C Estates" }
  ]);

  const handleHoldPlot = (number: string) => {
    setPlots(plots.map(p => {
      if (p.number === number) {
        const newStatus = p.status === "AVAILABLE" ? "RESERVED" : "AVAILABLE";
        
        // Append lead audit trail
        if (newStatus === "RESERVED") {
          const timestamp = new Date().toLocaleTimeString();
          setLeads([
            { id: `lead-${Math.floor(Math.random() * 900) + 100}`, name: "Subdivision Hold", phone: "System Hold Token", interested_plot: number, status: "RESERVED", note: `Manual 48-hour holds logged by agent at ${timestamp}` },
            ...leads
          ]);
        }
        
        return { ...p, status: newStatus };
      }
      return p;
    }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");

    setTimeout(() => {
      if (email.toLowerCase().includes("@agents.in") || email === "agent") {
        setIsAuthenticated(true);
        localStorage.setItem("bhoomi_agent_auth", "true");
      } else {
        setError("Invalid credentials. Enter agent credentials to proceed.");
      }
      setLoading(false);
    }, 1000);
  };

  const handlePreFill = () => {
    setEmail("sarah@agents.in");
    setPassword("agentpass123");
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-850 font-sans" id="agent-portal-root">
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto py-20 px-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8 space-y-6" id="agent-login-card">
            <div className="flex justify-center" id="agent-icon">
              <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-[10px] uppercase font-mono tracking-widest text-indigo-700 font-extrabold">Broker Portal</p>
              <h2 className="text-xl font-bold text-slate-900">Agent Workspace</h2>
              <p className="text-xs text-slate-500">
                Tenant Cluster: <span className="font-mono font-bold text-indigo-650 bg-indigo-50 px-1.5 py-0.2 rounded">{tenantCode || "bhoomi-alpha"}</span>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-650 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handlePreFill}
              className="w-full p-3 bg-zinc-50 border border-slate-200 hover:bg-zinc-100 rounded-xl text-left flex items-center justify-between text-xs transition-colors"
            >
              <div>
                <p className="font-semibold text-indigo-700 tracking-wider uppercase text-[10px] mb-0.5 animate-pulse">Seed Broker Credentials</p>
                <p className="font-mono text-slate-600">sarah@agents.in / agentpass123</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <form onSubmit={handleLogin} className="space-y-4" id="agent-login-form">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Agent Registry Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-350 rounded-xl text-sm focus:outline-none"
                    placeholder="e.g. sarah@agents.in"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-350 rounded-xl text-sm focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-3 rounded-xl transition-colors cursor-pointer"
              >
                {loading ? "Verifying agent credentials..." : "Authorize Broker Workspace"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-6 space-y-6" id="agent-dashboard">
          {/* Header Agent Dashboard Hero */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 font-extrabold" />
                <span>Broker Privilege Token: Verified</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Broker Sales Console
              </h1>
              <p className="text-xs text-slate-400 max-w-xl">
                Collaborative Broker dashboard. View real-time plots list, add tentative 48-hour holds for clients, and evaluate sales commission progression.
              </p>
            </div>

            <button 
              onClick={() => {
                setIsAuthenticated(false);
                localStorage.removeItem("bhoomi_agent_auth");
                // Clear any other session tokens as well to sanitize fully
                sessionStorage.removeItem("bhoomi_access_token");
                sessionStorage.removeItem("bhoomi_refresh_token");
                sessionStorage.removeItem("bhoomi_user_profile");
                localStorage.removeItem("bhoomi_access_token");
                localStorage.removeItem("bhoomi_refresh_token");
                localStorage.removeItem("bhoomi_user_profile");
              }}
              className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm shadow-indigo-100"
              id="agent-logout-btn"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>

          {/* Tab Navigation Menu */}
          <div className="flex border-b border-indigo-100 flex-wrap" id="agent-portal-navigation">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "catalog"
                  ? "border-indigo-650 text-indigo-700 bg-white shadow-xs rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-indigo-650 hover:bg-slate-100/50"
              }`}
            >
              <Compass className="w-4 h-4" />
              Live Plots Catalog Matrix
            </button>
            <button
              onClick={() => setActiveTab("leads")}
              className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "leads"
                  ? "border-indigo-650 text-indigo-700 bg-white shadow-xs rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-indigo-650 hover:bg-slate-100/50"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Buyer Lead Logs
            </button>
            <button
              onClick={() => setActiveTab("commissions")}
              className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "commissions"
                  ? "border-indigo-650 text-indigo-700 bg-white shadow-xs rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-indigo-650 hover:bg-slate-100/50"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Commission Progress Target
            </button>
          </div>

          {/* Render Active Tab Screen */}
          <div className="min-h-[40vh]">
            {activeTab === "catalog" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs animate-fadeIn" id="agent-tab-catalog">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Compass className="w-5 h-5 text-indigo-650" />
                    Live Subdivision Plots Real-time Matrix
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select any available plot below to add an immediate 48-hour client hold. Holds sync dynamically in background logs.
                  </p>
                </div>

                <div className="border border-slate-150 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left text-slate-650">
                    <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Plot Code</th>
                        <th className="px-4 py-3">Subdivision Block</th>
                        <th className="px-4 py-3 font-mono">Dimensions</th>
                        <th className="px-4 py-3 text-right">Pricing</th>
                        <th className="px-4 py-3 text-center">Catalog Status</th>
                        <th className="px-4 py-3 text-right">Hold Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {plots.map(plot => (
                        <tr key={plot.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono font-bold text-indigo-905">{plot.number}</td>
                          <td className="px-4 py-3 font-semibold text-slate-550">{plot.block}</td>
                          <td className="px-4 py-3 font-mono text-slate-500">{plot.area}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-705">{plot.cost}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full ${
                              plot.status === "AVAILABLE" 
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                                : plot.status === "RESERVED"
                                ? "bg-amber-50 text-amber-800 border border-amber-100 animate-pulse"
                                : "bg-red-50 text-red-800 border border-red-100"
                            }`}>
                              {plot.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {plot.status !== "SOLD" ? (
                              <button
                                onClick={() => handleHoldPlot(plot.number)}
                                className={`p-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer transition-all border ${
                                  plot.status === "RESERVED"
                                    ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                                    : "bg-slate-900 hover:bg-slate-800 text-white border-slate-900"
                                }`}
                              >
                                {plot.status === "RESERVED" ? "Release Hold" : "Add Hold"}
                              </button>
                            ) : (
                              <span className="text-[10.5px] font-semibold text-slate-400 italic">Pre-allocated</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "leads" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs animate-fadeIn animate-duration-150" id="agent-tab-leads">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-indigo-650" />
                    Interactive Customer Leads
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage active lead notes and plot inquiries. Adding holds in the live matrix appends records here.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leads.map(lead => (
                    <div key={lead.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3 hover:bg-indigo-50/20 transition-colors">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900 text-xs">{lead.name}</h4>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            lead.status === "HOT_LEAD" 
                              ? "bg-rose-50 text-rose-800 border border-rose-100" 
                              : lead.status === "RESERVED"
                              ? "bg-amber-50 text-amber-850 border border-amber-100"
                              : "bg-slate-900 text-white"
                          }`}>
                            {lead.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-550 leading-relaxed font-sans">{lead.note}</p>
                      </div>

                      <div className="pt-2 border-t border-dashed border-slate-200 text-[10.5px] font-mono text-slate-405 flex items-center justify-between">
                        <span>Target: <strong className="text-indigo-650 font-bold">{lead.interested_plot}</strong></span>
                        <span>{lead.phone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "commissions" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs animate-fadeIn" id="agent-tab-commissions">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-605" />
                    Broker Performance & Commission Pools
                  </h3>
                  <p className="text-xs text-slate-404 mt-1">
                    Visual tracker measuring monthly targets and direct 4% commissions.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 md:col-span-2">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">Commission Pool (4% Base Rate)</span>
                      <p className="text-4xl font-extrabold text-emerald-700 font-mono mt-0.5">$12,400</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>Registration Target Achievement</span>
                        <span>65% Complete</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: "65%" }}></div>
                      </div>
                      <p className="text-[10px] text-slate-450">Completed 3 active registrations out of 5 monthly milestones.</p>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Sandbox Rule Info</h4>
                      <p className="text-[11px] text-slate-500 leading-normal mt-1.5 font-sans">
                        Broker hold allocations automatically lapse after 48 hours to preserve real-time catalog integrity across dynamic customer subdomains.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-indigo-705 font-semibold bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>SLA Compliance Handshake Valid</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
