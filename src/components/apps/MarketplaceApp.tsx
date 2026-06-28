import React, { useState, useEffect } from "react";
import api from "../../lib/api.ts";
import { 
  Building2, 
  MapPin, 
  Layers, 
  Compass, 
  Search, 
  Filter, 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck, 
  Grid, 
  Home, 
  Mail, 
  Phone,
  Tag,
  Maximize2,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle,
  X,
  Star,
  Users,
  Check,
  Award
} from "lucide-react";

export default function MarketplaceApp() {
  const [activeTab, setActiveTab] = useState<"projects" | "developers">("projects");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("ALL");
  const [filterDeveloper, setFilterDeveloper] = useState("ALL");
  const [projects, setProjects] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [selectedDeveloper, setSelectedDeveloper] = useState<any | null>(null);

  // Lead Submission State
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadTarget, setLeadTarget] = useState<{
    tenantId: string;
    projectId?: string;
    projectName?: string;
    layoutId?: string;
    layoutName?: string;
    plotId?: string;
    plotNumber?: string;
  } | null>(null);
  
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    leadType: "Request Pricing" // Default lead intent type
  });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);

  // Filters for layout and plots inside detail view
  const [plotFacingFilter, setPlotFacingFilter] = useState("ALL");
  const [plotCornerFilter, setPlotCornerFilter] = useState("ALL"); // ALL, Yes, No
  const [plotStatusFilter, setPlotStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const projData = await api.fetchPublicProjects();
      setProjects(projData || []);

      const devData = await api.fetchPublicDevelopers();
      setDevelopers(devData || []);
    } catch (err) {
      console.error("Error fetching marketplace data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLeadModal = (
    tenantId: string, 
    projectId?: string, 
    projectName?: string, 
    layoutId?: string, 
    layoutName?: string, 
    plotId?: string, 
    plotNumber?: string,
    initialLeadType = "Request Pricing"
  ) => {
    setLeadTarget({ tenantId, projectId, projectName, layoutId, layoutName, plotId, plotNumber });
    setLeadForm({
      name: "",
      email: "",
      phone: "",
      message: plotNumber 
        ? `I am highly interested in purchasing Plot ${plotNumber} inside ${layoutName || projectName}. Please share pricing details.`
        : `I would like to request comprehensive details about ${projectName || "the developer profile"}.`,
      leadType: initialLeadType
    });
    setLeadSuccess(false);
    setLeadModalOpen(true);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadTarget) return;

    setLeadSubmitting(true);
    try {
      await api.submitPublicLead({
        tenant_id: leadTarget.tenantId,
        project_id: leadTarget.projectId,
        layout_id: leadTarget.layoutId,
        plot_id: leadTarget.plotId,
        lead_type: leadForm.leadType,
        name: leadForm.name,
        email: leadForm.email,
        phone: leadForm.phone,
        message: leadForm.message,
        metadata: {
          captured_intent: leadForm.leadType,
          device_viewport: "DESKTOP",
          session_referrer: "BhoomiOne Public Marketplace Portal"
        }
      });
      setLeadSuccess(true);
      // Refresh statistics silently if any
    } catch (err) {
      console.error("Lead submission error:", err);
      alert("Failed to submit lead. Please verify connection credentials.");
    } finally {
      setLeadSubmitting(false);
    }
  };

  const loadDeveloperDetail = async (slug: string) => {
    setLoading(true);
    try {
      const devDetail = await api.fetchPublicDeveloper(slug);
      setSelectedDeveloper(devDetail);
    } catch (err) {
      console.error("Error loading developer details:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetail = async (id: string) => {
    setLoading(true);
    try {
      const projDetail = await api.fetchPublicProject(id);
      setSelectedProject(projDetail);
    } catch (err) {
      console.error("Error loading project details:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter listings
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.developer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = filterLocation === "ALL" || p.location === filterLocation;
    const matchesDev = filterDeveloper === "ALL" || p.developer_name === filterDeveloper;

    return matchesSearch && matchesLocation && matchesDev;
  });

  const locationsList = Array.from(new Set(projects.map((p) => p.location)));
  const developersList = Array.from(new Set(projects.map((p) => p.developer_name)));

  // Featured and Latest classifications for Marketplace Home
  const featuredProjects = projects.filter((p) => p.is_featured);
  const latestProjects = projects.slice(0, 3); // top 3

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800" id="marketplace-root-container">
      {/* 1. Header Hero Panel */}
      <div 
        className="relative bg-slate-950 text-white py-16 px-6 text-center shadow-lg overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
        id="marketplace-jumbotron"
      >
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] uppercase font-bold tracking-widest font-mono">
            <Award className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Verified Developer Registry
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Discover Legit, RERA-Approved Land Plots & Subdivisions
          </h1>
          <p className="text-sm md:text-base text-slate-350 max-w-2xl mx-auto leading-relaxed">
            Directly connect with tier-1 developers. Access interactive CAD-layouts, verified RERA certificates, pricing indexes, and real-time site booking status.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Interactive Discovery Search Bar */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20 mb-8">
        <div className="bg-white rounded-2xl border border-slate-250 p-4 shadow-xl space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute inset-y-0 left-3 flex items-center text-slate-400 w-4 h-4 pointer-events-none mt-3" />
              <input
                type="text"
                placeholder="Search premium townships, RERA certificates, layouts, developers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-950"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">All Regions</option>
                {locationsList.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>

              <select
                value={filterDeveloper}
                onChange={(e) => setFilterDeveloper(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">All Developers</option>
                {developersList.map((dev) => (
                  <option key={dev} value={dev}>{dev}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterLocation("ALL");
                  setFilterDeveloper("ALL");
                }}
                className="px-3 py-2.5 text-slate-500 hover:text-slate-900 text-xs font-medium border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => {
              setActiveTab("projects");
              setSelectedProject(null);
              setSelectedDeveloper(null);
            }}
            className={`pb-3 px-6 text-xs font-bold border-b-2 tracking-wide uppercase transition-all ${
              activeTab === "projects" && !selectedProject && !selectedDeveloper
                ? "border-indigo-600 text-indigo-650"
                : "border-transparent text-slate-450 hover:text-slate-700"
            }`}
          >
            Townships & Projects
          </button>
          <button
            onClick={() => {
              setActiveTab("developers");
              setSelectedProject(null);
              setSelectedDeveloper(null);
            }}
            className={`pb-3 px-6 text-xs font-bold border-b-2 tracking-wide uppercase transition-all ${
              activeTab === "developers" && !selectedProject && !selectedDeveloper
                ? "border-indigo-600 text-indigo-650"
                : "border-transparent text-slate-450 hover:text-slate-700"
            }`}
          >
            Verified Developers ({developers.length})
          </button>
        </div>
      </div>

      {/* 3. Main Discovery Viewport */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-450 font-medium">Synchronizing validated land parcel registers...</p>
          </div>
        ) : (
          <>
            {/* VIEW A: PROJECT DETAIL VIEW */}
            {selectedProject && (
              <div className="space-y-6" id="project-detail-panel">
                {/* Back button */}
                <button
                  onClick={() => setSelectedProject(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Back to Marketplace
                </button>

                {/* Cover Banner */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="h-64 md:h-80 relative">
                    <img 
                      src={selectedProject.banner || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"}
                      alt={selectedProject.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-6">
                      <div className="text-white space-y-1 max-w-2xl">
                        <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {selectedProject.publishing_status || "Published"}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{selectedProject.name}</h2>
                        <div className="flex items-center gap-4 text-xs text-slate-300">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-400" />
                            {selectedProject.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-300" />
                            {selectedProject.developer_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-slate-100 bg-slate-50/50">
                    <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">RERA Certification</p>
                      <p className="text-xs font-mono font-bold text-slate-800 select-all">
                        {selectedProject.rera_number || "EXEMPTED / NOT APPLICABLE"}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Authority Approvals</p>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <p className="text-xs font-extrabold text-slate-800">{selectedProject.approval_status || "VERIFIED"}</p>
                      </div>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Development Authority</p>
                      <p className="text-xs font-bold text-slate-800">{selectedProject.approval_authority || "Town Planning Dept"}</p>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Project Views</p>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        <p className="text-xs font-extrabold text-slate-800">{selectedProject.views_count || 120} hits</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Core content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left columns */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Developer overview short info */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Project Overview</h3>
                      <p className="text-xs leading-relaxed text-slate-600">
                        {selectedProject.description || "Premium plotted residential layout structured under strict multi-tenant urban planning protocols. Built using legal land demarcation benchmarks and verified by local municipal bodies."}
                      </p>
                    </div>

                    {/* Master Layouts & Grid Section */}
                    <div className="space-y-4">
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-600" />
                        Available Subdivisions & Layout Plans ({selectedProject.layouts?.length || 0})
                      </h3>

                      {(!selectedProject.layouts || selectedProject.layouts.length === 0) ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-450">
                          No public layouts are currently visible on the marketplace for this project.
                        </div>
                      ) : (
                        selectedProject.layouts.map((lay: any) => (
                          <div key={lay.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-4">
                            <div className="bg-slate-50 px-5 py-4 border-b border-slate-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div>
                                <span className="bg-indigo-100 text-indigo-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1 block w-fit">
                                  {lay.visibility || "Public"} Layout Plan
                                </span>
                                <h4 className="text-sm font-extrabold text-slate-900">{lay.name} ({lay.code})</h4>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-450 block uppercase font-bold tracking-wider">Estimated Valuation</span>
                                <span className="text-xs font-extrabold text-emerald-700">{lay.price_range || "Contact for Valuation"}</span>
                              </div>
                            </div>

                            {/* Plots checklist Table */}
                            <div className="p-5 space-y-3">
                              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                <h5 className="text-xs font-bold text-slate-800">Physical Layout Plot Registry</h5>
                                <span className="text-[10px] text-slate-450">Filter plots or tap site map to query</span>
                              </div>

                              {/* Mini Plot Filters */}
                              <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-slate-600 bg-slate-50 p-2 rounded-xl">
                                <div className="flex items-center gap-1">
                                  <span>Facing:</span>
                                  <select 
                                    className="bg-white border rounded px-1.5 py-0.5 text-[10px]"
                                    value={plotFacingFilter}
                                    onChange={(e) => setPlotFacingFilter(e.target.value)}
                                  >
                                    <option value="ALL">All Directions</option>
                                    <option value="EAST">EAST</option>
                                    <option value="WEST">WEST</option>
                                    <option value="NORTH">NORTH</option>
                                    <option value="SOUTH">SOUTH</option>
                                    <option value="NORTHEAST">NORTHEAST</option>
                                  </select>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>Corner:</span>
                                  <select 
                                    className="bg-white border rounded px-1.5 py-0.5 text-[10px]"
                                    value={plotCornerFilter}
                                    onChange={(e) => setPlotCornerFilter(e.target.value)}
                                  >
                                    <option value="ALL">All Plots</option>
                                    <option value="Yes">Corner Plots Only</option>
                                    <option value="No">Standard Plots</option>
                                  </select>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span>Availability:</span>
                                  <select 
                                    className="bg-white border rounded px-1.5 py-0.5 text-[10px]"
                                    value={plotStatusFilter}
                                    onChange={(e) => setPlotStatusFilter(e.target.value)}
                                  >
                                    <option value="ALL">All Plots</option>
                                    <option value="AVAILABLE">Available</option>
                                    <option value="RESERVED">Reserved</option>
                                    <option value="SOLD">Sold</option>
                                  </select>
                                </div>
                              </div>

                              <div className="overflow-x-auto border border-slate-150 rounded-xl bg-white">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50 text-[9px] text-slate-450 uppercase font-bold tracking-wider border-b border-slate-150">
                                      <th className="py-2.5 px-4">Plot No.</th>
                                      <th className="py-2.5 px-4">Facing</th>
                                      <th className="py-2.5 px-4">Corner</th>
                                      <th className="py-2.5 px-4">Area Sizing</th>
                                      <th className="py-2.5 px-4">Standard Valuation</th>
                                      <th className="py-2.5 px-4 text-center">Status</th>
                                      <th className="py-2.5 px-4 text-right">Inquiry</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-700">
                                    {(lay.plots || [])
                                      .filter((pl: any) => {
                                        if (plotFacingFilter !== "ALL" && pl.facing !== plotFacingFilter) return false;
                                        if (plotCornerFilter === "Yes" && !pl.corner_plot) return false;
                                        if (plotCornerFilter === "No" && pl.corner_plot) return false;
                                        if (plotStatusFilter !== "ALL" && pl.booking_status !== plotStatusFilter && pl.status !== plotStatusFilter) return false;
                                        return true;
                                      })
                                      .map((pl: any) => (
                                        <tr key={pl.id} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="py-2 px-4 font-mono font-bold text-slate-900">{pl.plot_number}</td>
                                          <td className="py-2 px-4 font-mono text-[10px] text-slate-500">{pl.facing}</td>
                                          <td className="py-2 px-4">
                                            {pl.corner_plot ? (
                                              <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold px-1.5 py-0.2 rounded-full">CORNER</span>
                                            ) : (
                                              <span className="text-slate-400">-</span>
                                            )}
                                          </td>
                                          <td className="py-2 px-4 font-mono">{parseFloat(pl.area_value).toLocaleString()} Sq.Ft</td>
                                          <td className="py-2 px-4 text-emerald-800 font-extrabold font-mono">
                                            {pl.price && parseFloat(pl.price) > 0 
                                              ? `Rs. ${(parseFloat(pl.price) / 100000).toFixed(1)} Lakh`
                                              : "Contact for pricing"}
                                          </td>
                                          <td className="py-2 px-4 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                              (pl.booking_status || pl.status) === "AVAILABLE" 
                                                ? "bg-emerald-100 text-emerald-800" 
                                                : (pl.booking_status || pl.status) === "RESERVED"
                                                ? "bg-amber-100 text-amber-800"
                                                : "bg-slate-100 text-slate-500"
                                            }`}>
                                              {pl.booking_status || pl.status}
                                            </span>
                                          </td>
                                          <td className="py-2 px-4 text-right">
                                            <button
                                              onClick={() => handleOpenLeadModal(
                                                selectedProject.tenant_id, 
                                                selectedProject.id, 
                                                selectedProject.name, 
                                                lay.id, 
                                                lay.name, 
                                                pl.id, 
                                                pl.plot_number,
                                                "Request Pricing"
                                              )}
                                              disabled={(pl.booking_status || pl.status) === "SOLD"}
                                              className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                                                (pl.booking_status || pl.status) === "SOLD"
                                                  ? "bg-slate-100 text-slate-300 pointer-events-none"
                                                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
                                              }`}
                                            >
                                              Buy Quote
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    {(!lay.plots || lay.plots.length === 0) && (
                                      <tr>
                                        <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                                          No Plots currently registered in database for this layout.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Column - Booking Sidebar */}
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-900">Schedule Site Consultation</h3>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Lock in a digital slot coordinate block, book a private chauffeur-driven site tour, or arrange callback with developer specialists.
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleOpenLeadModal(
                            selectedProject.tenant_id, 
                            selectedProject.id, 
                            selectedProject.name, 
                            undefined, 
                            undefined, 
                            undefined, 
                            undefined,
                            "Book Site Visit"
                          )}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Calendar className="w-4 h-4 text-amber-400" />
                          Book Physical Site Visit
                        </button>
                        <button
                          onClick={() => handleOpenLeadModal(
                            selectedProject.tenant_id, 
                            selectedProject.id, 
                            selectedProject.name, 
                            undefined, 
                            undefined, 
                            undefined, 
                            undefined,
                            "Request Callback"
                          )}
                          className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Phone className="w-4 h-4 text-indigo-500" />
                          Arrange Technical Callback
                        </button>
                      </div>

                      <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex items-start gap-2 text-[10px] leading-relaxed text-indigo-900">
                        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <p>
                          <strong>SaaS CRM Integration:</strong> All callback queries submitted here immediately sync into the tenant's secure BhoomiOne CRM dashboard for tracking.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW B: DEVELOPER DETAIL VIEW */}
            {selectedDeveloper && (
              <div className="space-y-6" id="developer-detail-panel">
                {/* Back button */}
                <button
                  onClick={() => setSelectedDeveloper(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Back to Marketplace
                </button>

                {/* Cover profile header */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="h-44 md:h-56 bg-slate-900 relative">
                    {selectedDeveloper.developer?.cover_image ? (
                      <img 
                        src={selectedDeveloper.developer.cover_image}
                        alt="cover"
                        className="w-full h-full object-cover opacity-80"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-slate-900 to-indigo-950" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60" />
                  </div>
                  
                  <div className="p-6 relative -mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-20 h-20 bg-white p-1 rounded-2xl shadow-md border border-slate-200 overflow-hidden">
                        <img 
                          src={selectedDeveloper.developer?.logo || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=120&h=120&q=80"}
                          alt="logo"
                          className="w-full h-full object-contain rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                            {selectedDeveloper.developer?.company_name}
                          </h2>
                          {selectedDeveloper.developer?.verification_status === "VERIFIED" && (
                            <span className="bg-blue-100 text-blue-800 text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-blue-600" />
                              VERIFIED DEVELOPER
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{selectedDeveloper.developer?.office_address}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenLeadModal(
                        selectedDeveloper.developer?.tenant_id, 
                        undefined, 
                        undefined, 
                        undefined, 
                        undefined, 
                        undefined, 
                        undefined,
                        "Request Callback"
                      )}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors"
                    >
                      Connect with Developer Office
                    </button>
                  </div>

                  <div className="px-6 pb-6 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 text-xs font-medium text-slate-700">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Years in Business</span>
                      <span className="text-sm font-extrabold text-slate-900">{selectedDeveloper.developer?.years_in_business || 5} Years</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Completed Townships</span>
                      <span className="text-sm font-extrabold text-slate-900">{selectedDeveloper.developer?.completed_projects || 2} Communities</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Active Project Sites</span>
                      <span className="text-sm font-extrabold text-slate-900">{selectedDeveloper.developer?.active_projects || 1} Sites</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Platform Trust Score</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-extrabold text-slate-900">{selectedDeveloper.developer?.rating || "4.5"} / 5.0</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Developer description and publications */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Bio */}
                  <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-xs h-fit">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">Contact & Info</h3>
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">RERA License Number</span>
                        <span className="font-mono font-bold text-slate-800">{selectedDeveloper.developer?.rera_number || "NOT APPLICABLE"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Email Desk</span>
                        <span className="text-slate-800 font-bold flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {selectedDeveloper.developer?.email || "office@bhoomidevelopers.com"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Call Center Registry</span>
                        <span className="text-slate-800 font-bold flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {selectedDeveloper.developer?.phone || "+91 99999 11111"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Public Domain URL</span>
                        <a 
                          href={selectedDeveloper.developer?.website || "#"} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-indigo-650 hover:underline font-bold flex items-center gap-1.5 mt-0.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Visit Developer Website
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Published layout project listings */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
                      Active Publications By This Developer ({selectedDeveloper.projects?.length || 0})
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(selectedDeveloper.projects || []).map((p: any) => (
                        <div key={p.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                          <div className="p-4 space-y-2">
                            <span className="bg-slate-100 text-slate-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {p.publishing_status}
                            </span>
                            <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">{p.name}</h4>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-rose-500" />
                              {p.location}
                            </p>
                          </div>
                          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">{p.layouts?.length || 1} Available Layout Grid</span>
                            <button
                              onClick={() => loadProjectDetail(p.id)}
                              className="text-[10px] bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              Open Site Map
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {(!selectedDeveloper.projects || selectedDeveloper.projects.length === 0) && (
                        <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-450">
                          This developer has not published any plot layouts on the public board yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW C: STANDARD DISCOVERY DIRECTORIES */}
            {!selectedProject && !selectedDeveloper && (
              <>
                {/* Tab: PROJECTS */}
                {activeTab === "projects" && (
                  <div className="space-y-12">
                    {/* Featured Row */}
                    {featuredProjects.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-indigo-600" />
                          <h3 className="text-base font-extrabold tracking-tight text-slate-900 uppercase">
                            Featured Verified Townships
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {featuredProjects.map((proj) => (
                            <div 
                              key={proj.id} 
                              className="bg-white border-2 border-indigo-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row group"
                            >
                              <div className="md:w-1/2 h-48 md:h-auto overflow-hidden relative">
                                <img 
                                  src={proj.banner || "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80"}
                                  alt={proj.name}
                                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full tracking-wider uppercase shadow-xs">
                                  FEATURED
                                </div>
                              </div>
                              <div className="md:w-1/2 p-5 flex flex-col justify-between space-y-4">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                    <span>{proj.location}</span>
                                  </div>
                                  <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-650 transition-colors leading-tight line-clamp-1">
                                    {proj.name}
                                  </h4>
                                  <p className="text-xs text-slate-500 leading-normal line-clamp-3">
                                    {proj.description || "Eco-friendly premium plotting community verified under strict authority criteria."}
                                  </p>
                                </div>
                                <button
                                  onClick={() => loadProjectDetail(proj.id)}
                                  className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer w-fit"
                                >
                                  Analyze Site Grid
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Standard Grid */}
                    <div className="space-y-4">
                      <h3 className="text-base font-extrabold tracking-tight text-slate-900 uppercase">
                        All Available Subdivision Records ({filteredProjects.length})
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((proj) => (
                          <div 
                            key={proj.id} 
                            className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                          >
                            <div>
                              <div className="h-44 overflow-hidden relative">
                                <img 
                                  src={proj.banner || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80"}
                                  alt={proj.name}
                                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-3 left-3 bg-slate-900/90 text-white text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider backdrop-blur-xs">
                                  {proj.code}
                                </div>
                                {proj.is_featured && (
                                  <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded-full font-sans shadow-xs uppercase tracking-wider">
                                    FEATURED
                                  </div>
                                )}
                              </div>

                              <div className="p-5 space-y-2">
                                <div className="flex items-center gap-1 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                                  <MapPin className="w-3 h-3 text-rose-500" />
                                  <span>{proj.location}</span>
                                </div>
                                <h4 className="text-sm font-extrabold text-slate-900 leading-snug group-hover:text-indigo-650 transition-colors line-clamp-1">
                                  {proj.name}
                                </h4>
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                  {proj.description || "Premium plotted subdivision with vetted layouts and verified boundaries."}
                                </p>
                              </div>
                            </div>

                            <div className="p-5 pt-0">
                              <div className="pt-3 border-t border-slate-100 flex items-center justify-between mb-4 text-[10px]">
                                <div>
                                  <span className="text-slate-400 block uppercase font-bold mb-0.5">RERA Lic.</span>
                                  <span className="font-mono font-bold text-slate-700">{proj.rera_number || "REG. EXEMPTED"}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-slate-400 block uppercase font-bold mb-0.5 font-sans">Developer partners</span>
                                  <span className="font-bold text-slate-800">{proj.developer_name}</span>
                                </div>
                              </div>

                              <button
                                onClick={() => loadProjectDetail(proj.id)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <span>Analyze Layout Matrix</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {filteredProjects.length === 0 && (
                          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-sm font-bold text-slate-700">No townships currently meet your filter parameters.</p>
                            <p className="text-xs text-slate-450 max-w-md mx-auto">Try widening your search terms, selecting All Developers, or clearing the query string.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: DEVELOPERS */}
                {activeTab === "developers" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {developers.map((dev) => (
                      <div 
                        key={dev.id} 
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="w-14 h-14 p-1 bg-slate-50 border border-slate-150 rounded-xl shrink-0 overflow-hidden">
                              <img 
                                src={dev.logo || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=120&h=120&q=80"}
                                alt={dev.company_name}
                                className="w-full h-full object-contain rounded-lg"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">{dev.company_name}</h4>
                              <p className="text-[10px] text-slate-450 flex items-center gap-1 font-medium">
                                <MapPin className="w-3 h-3 text-rose-400" />
                                {dev.office_address}
                              </p>
                              {dev.verification_status === "VERIFIED" && (
                                <span className="bg-blue-50 text-blue-700 text-[8px] font-extrabold px-2 py-0.2 rounded-full tracking-wider uppercase border border-blue-150 inline-block">
                                  VERIFIED PARTNER
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 leading-normal line-clamp-3">
                            {dev.description || "Registered land developers partnering with BhoomiOne Enterprise networks."}
                          </p>

                          <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px] font-medium text-slate-500">
                            <div>
                              <span className="block font-bold text-slate-800">{dev.years_in_business || 5}+</span>
                              <span>Years</span>
                            </div>
                            <div>
                              <span className="block font-bold text-slate-800">{dev.completed_projects || 2}+</span>
                              <span>Completed</span>
                            </div>
                            <div>
                              <span className="block font-bold text-slate-800">{dev.active_projects || 1}</span>
                              <span>Active</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{dev.rating || "4.5"}</span>
                          </div>
                          <button
                            onClick={() => loadDeveloperDetail(dev.seo_slug)}
                            className="text-[10px] bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            View Bio & Sites
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {developers.length === 0 && (
                      <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
                        No verified real estate developer profiles are registered in central database.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* 4. CRM LEAD CAPTURE MODAL (Phase 2B compliant) */}
      {leadModalOpen && leadTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-150">
            <div className="bg-slate-950 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold tracking-tight">Lock in Buyer Registry Token</h3>
                <p className="text-[10px] text-slate-400 font-medium">BhoomiOne Direct-to-Developer Secure Tunnel</p>
              </div>
              <button 
                onClick={() => setLeadModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {leadSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-150">
                    <Check className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-extrabold text-slate-900">Lead Registry Confirmed!</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Your interest query has been securely hashed and transmitted directly into the tenant CRM systems. They will dial back shortly.
                    </p>
                  </div>
                  <button
                    onClick={() => setLeadModalOpen(false)}
                    className="mt-2 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl"
                  >
                    Close Viewport
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-3">
                  {/* Context Badge */}
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl space-y-1 text-[11px]">
                    <span className="text-[9px] uppercase font-bold text-indigo-400 block tracking-wider">Inquiry Target Context</span>
                    <p className="font-extrabold text-indigo-950">{leadTarget.projectName || "Verified Developer Corporate Office"}</p>
                    {leadTarget.plotNumber && (
                      <p className="text-[10px] text-slate-500">
                        Selected Asset Sizing: <span className="font-mono font-bold text-slate-800">Plot {leadTarget.plotNumber} ({leadTarget.layoutName})</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Your Intent Action</label>
                    <select
                      value={leadForm.leadType}
                      onChange={(e) => setLeadForm({ ...leadForm, leadType: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="Request Pricing">Request Pricing Catalog</option>
                      <option value="Book Site Visit">Schedule Physical Site Visit Tour</option>
                      <option value="Request Callback">Arrange Urgent Callback</option>
                      <option value="Ask Question">Submit General Clarification Query</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      placeholder="e.g. Shaurya Pratap"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Registry Email</label>
                      <input
                        type="email"
                        required
                        value={leadForm.email}
                        onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                        placeholder="e.g. shaurya@outlook.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Mobile Contact</label>
                      <input
                        type="tel"
                        required
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                        placeholder="e.g. +91 99999 88888"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-450 tracking-wider mb-1">Optional Message</label>
                    <textarea
                      value={leadForm.message}
                      onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs h-16 resize-none focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={leadSubmitting}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    {leadSubmitting ? "Locking down query..." : "Transmit Direct Inquiry"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
