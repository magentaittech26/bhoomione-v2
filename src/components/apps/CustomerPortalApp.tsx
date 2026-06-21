import React, { useState } from "react";
import { 
  User, 
  MapPin, 
  FileCheck, 
  CreditCard, 
  ShieldCheck, 
  Compass, 
  ArrowRight, 
  Download, 
  LogIn, 
  Mail, 
  Lock,
  Building2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  LogOut
} from "lucide-react";

interface CustomerPortalAppProps {
  tenantCode: string | null;
}

export default function CustomerPortalApp({ tenantCode }: CustomerPortalAppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"inventory" | "documents" | "ledger">("inventory");

  // Simulated authenticated customer database
  const customerProfile = {
    name: "Arjun Devgowda",
    email: "arjun@villas.in",
    tenantName: "Bhoomi Realty Developers",
    allocatedPlots: [
      { id: "plot-101", number: "P-101", sector: "Block A Meadows", area: "1,200 SQFT", facing: "NORTH", roadWidth: "40 FT", status: "FULLY_PAID", registeredDate: "2025-02-14", cost: "$49,000" }
    ],
    documentsChecklist: [
      { id: "doc-1", name: "RERA Allocation Letter", status: "APPROVED", date: "2025-02-15" },
      { id: "doc-2", name: "Sale Deed Agreement (Draft)", status: "PENDING_VERIFICATION", date: "2025-04-10" },
      { id: "doc-3", name: "Surveyor Field NOC", status: "APPROVED", date: "2025-03-01" },
      { id: "doc-4", name: "NOC for High-tension Line Corridor", status: "APPROVED", date: "2025-03-02" }
    ],
    payments: [
      { id: "pay-01", amount: "$5,000", type: "Booking Deposit", date: "2025-01-10", status: "CLEARED" },
      { id: "pay-02", amount: "$44,000", type: "Primary Consideration", date: "2025-02-14", status: "CLEARED" }
    ]
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError("");

    setTimeout(() => {
      if (username.toLowerCase().includes("@villas.in") || username === "customer") {
        setIsAuthenticated(true);
      } else {
        setError("Invalid customer registry token or password.");
      }
      setLoading(false);
    }, 1000);
  };

  const handlePreFill = () => {
    setUsername("arjun@villas.in");
    setPassword("customerpass123");
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans" id="customer-portal-root">
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto py-20 px-4 space-y-6">
          <div className="bg-white border border-slate-205 rounded-2xl shadow-lg p-8 space-y-6" id="customer-login-card">
            <div className="flex justify-center" id="customer-icon">
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl">
                <User className="w-6 h-6" />
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-[10px] uppercase font-mono tracking-widest text-rose-600 font-extrabold">Homebuyer Portal</p>
              <h2 className="text-xl font-bold text-slate-900">Buyer Workspace</h2>
              <p className="text-xs text-slate-500">
                Authorized Cluster: <span className="font-mono font-bold text-indigo-650 bg-indigo-50 px-1.5 py-0.2 rounded">{tenantCode || "bhoomi-alpha"}</span>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handlePreFill}
              className="w-full p-3 bg-zinc-50 border border-slate-200 hover:bg-zinc-100 rounded-xl text-left flex items-center justify-between text-xs transition-colors"
            >
              <div>
                <p className="font-semibold text-rose-700 tracking-wider uppercase text-[10px] mb-0.5 animate-pulse">Seed Buyer Credentials</p>
                <p className="font-mono text-slate-600">arjun@villas.in / customerpass123</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <form onSubmit={handleLogin} className="space-y-4" id="customer-login-form">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Buyer Registry Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-450">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input 
                    type="email"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-350 rounded-xl text-sm focus:outline-none"
                    placeholder="e.g. arjun@villas.in"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Security PIN/Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-450">
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
                className="w-full bg-slate-900 hover:bg-slate-850 text-white font-semibold text-xs py-3 rounded-xl transition-colors cursor-pointer"
              >
                {loading ? "Decrypting secure files..." : "Authorize Buyer Sandbox"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto p-6 space-y-6" id="customer-dashboard">
          {/* Header Customer Profile Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active Account Ledger Validated</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Welcome, <span className="text-zinc-100">{customerProfile.name}</span>
              </h1>
              <p className="text-xs text-slate-400 max-w-xl">
                Homebuyer Workspace. Review allocated subdivision parcels, complete Surveyor NOC checklists, and inspect financial tax receipts of paid lots.
              </p>
            </div>

            <button 
              onClick={() => setIsAuthenticated(false)}
              className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>

          {/* Tab Navigation Menu */}
          <div className="flex border-b border-indigo-100" id="customer-portal-navigation">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "inventory"
                  ? "border-indigo-650 text-indigo-700 bg-white shadow-xs rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-indigo-650 hover:bg-slate-100/50"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Allocated Plots & Parcels
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "documents"
                  ? "border-indigo-650 text-indigo-700 bg-white shadow-xs rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-indigo-650 hover:bg-slate-100/50"
              }`}
            >
              <FileCheck className="w-4 h-4" />
              Legal Clearances & NOCs
            </button>
            <button
              onClick={() => setActiveTab("ledger")}
              className={`px-5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "ledger"
                  ? "border-indigo-650 text-indigo-700 bg-white shadow-xs rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-indigo-650 hover:bg-slate-100/50"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Payments & Ledger Logs
            </button>
          </div>

          {/* Render Active Tab Screen */}
          <div className="min-h-[40vh]">
            {activeTab === "inventory" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs animate-fadeIn">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-650" />
                    Allocated Land Holdings
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Your verified plot allocations mapped in our centralized GIS registers.
                  </p>
                </div>

                {customerProfile.allocatedPlots.map(plot => (
                  <div key={plot.id} className="border border-slate-200 p-6 rounded-2xl bg-slate-50/50 space-y-5">
                    <div className="flex md:flex-row flex-col justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
                      <div>
                        <span className="text-[10px] uppercase font-mono bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-extrabold tracking-wider border border-indigo-150">
                          Primary Allocation
                        </span>
                        <p className="text-xl font-extrabold text-slate-905 mt-1.5">Plot Parcel: {plot.number}</p>
                      </div>
                      <span className="text-xs bg-emerald-50 text-emerald-805 border border-emerald-100 px-3 py-1 rounded-full font-bold">
                        {plot.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
                      <div className="space-y-1">
                        <p className="text-slate-400 uppercase text-[9px] font-bold tracking-widest">Constructive Area</p>
                        <p className="text-slate-800 font-extrabold text-sm">{plot.area}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 uppercase text-[9px] font-bold tracking-widest">Dimension & Width</p>
                        <p className="text-slate-800 font-extrabold text-sm">{plot.roadWidth} x {plot.facing}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 uppercase text-[9px] font-bold tracking-widest">Register Handshake</p>
                        <p className="text-slate-800 font-extrabold text-sm">{plot.registeredDate}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 uppercase text-[9px] font-bold tracking-widest">Original Value</p>
                        <p className="text-slate-800 font-mono font-extrabold text-sm text-indigo-705">{plot.cost}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
                      <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                        <Compass className="w-4 h-4 text-slate-400" />
                        Boundary coordinates verified
                      </span>
                      <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-emerald-800">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        Ready for constructive blueprints
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "documents" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs animate-fadeIn">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-650" />
                    Government Clearances & Surveyor NOCs
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Regulatory certificate status mapped dynamically below.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customerProfile.documentsChecklist.map(doc => (
                    <div key={doc.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900">{doc.name}</p>
                        <p className="text-[10px] text-slate-450 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-350" />
                          Validated at {doc.date}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                        doc.status === "APPROVED" 
                          ? "bg-emerald-50 text-emerald-850 border-emerald-150" 
                          : "bg-amber-50 text-amber-850 border-amber-150"
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 bg-indigo-50/20 p-4 border border-indigo-100 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-800">Need immediate surveyor field reassessment?</p>
                    <p className="text-[11px] text-slate-500">Submit requests directly to our multi-tenant engineer panel.</p>
                  </div>
                  <button 
                    onClick={() => alert("Surveyor re-inspection request has been logged.")}
                    className="bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  >
                    Request Survey
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "ledger" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-rose-600" />
                      Paid Transactions & Accounts Registry
                    </h3>
                    <p className="text-xs text-slate-405 mt-1">
                      Cleared transactions logged directly on tenant centralized banks.
                    </p>
                  </div>
                  <button 
                    onClick={() => alert("Simulated financial ledger audit package downloaded.")}
                    className="bg-slate-900 hover:bg-slate-850 text-white text-[11px] font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Audit Statement PDF
                  </button>
                </div>

                <div className="space-y-3">
                  {customerProfile.payments.map(pay => (
                    <div key={pay.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{pay.type}</span>
                          <span className="font-mono text-[9px] uppercase tracking-wider bg-slate-200 px-1.5 py-0.2 rounded font-bold text-slate-650">{pay.id}</span>
                        </div>
                        <p className="text-[10px] text-slate-450">Transaction logged: {pay.date}</p>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t border-dashed border-slate-200 mt-2 pt-2 md:border-none md:mt-0 md:pt-0">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-slate-400 text-right">Amount Paid</p>
                          <p className="text-base font-extrabold text-emerald-700 font-mono">{pay.amount}</p>
                        </div>
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {pay.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
