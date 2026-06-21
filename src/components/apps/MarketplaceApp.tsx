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
  Maximize2
} from "lucide-react";

export default function MarketplaceApp() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: "", email: "", phone: "", message: "" });

  // Luxury pre-populated offline mock database
  const mockProjects = [
    {
      id: "proj-1",
      name: "Bhoomi Serenity Meadows",
      code: "BSM-01",
      developer_name: "Bhoomi Builders Group",
      location: "Bengaluru East",
      status: "DEVELOPING",
      rera_number: "PRM/KA/RERA/1251/446/PR/230114/005612",
      approval_status: "APPROVED",
      approval_authority: "BDA (Bangalore Development Authority)",
      launch_date: "2025-01-15",
      possession_target_date: "2027-06-30",
      description: "A secure luxury plotted community featuring theme parks, fully loaded clubhouses, and sustainable rainwater recharge channels.",
      totalPlots: 124,
      availablePlots: 38,
      dimensions: "30x40, 40x60, 50x80",
      priceRange: "$49,000 - $160,000",
      banner: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "proj-2",
      name: "Bhoomi Heights Greenlands",
      code: "BHG-02",
      developer_name: "Apex Habitats",
      location: "Mysuru High-Tech Zone",
      status: "PLANNING",
      rera_number: "PRM/KA/RERA/1252/310/PR/240212/006124",
      approval_status: "APPROVED",
      approval_authority: "MUDA (Mysore Urban Development Authority)",
      launch_date: "2026-03-01",
      possession_target_date: "2028-12-31",
      description: "Premium eco-friendly layouts with smart-grid water systems, localized solar panels, and wide 45FT internal black-top roads.",
      totalPlots: 85,
      availablePlots: 62,
      dimensions: "30x50, 40x60",
      priceRange: "$35,000 - $95,000",
      banner: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "proj-3",
      name: "Bhoomi West Wood Ridge",
      code: "BWW-03",
      developer_name: "Vantage Land Developers",
      location: "Bengaluru West",
      status: "COMPLETED",
      rera_number: "PRM/KA/RERA/1251/310/PR/220510/004820",
      approval_status: "APPROVED",
      approval_authority: "BIAAPA (Bangalore International Airport Area)",
      launch_date: "2023-05-10",
      possession_target_date: "2025-05-01",
      description: "Nestled in pine reserves, these bespoke acreage estates feature independent water bores and dynamic legal land demarcations.",
      totalPlots: 45,
      availablePlots: 12,
      dimensions: "50x80, 100x120",
      priceRange: "$120,000 - $350,000",
      banner: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    }
  ];

  useEffect(() => {
    setLoading(true);
    api.fetchProjects()
      .then((data: any) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setProjects(data);
        } else {
          setProjects(mockProjects);
        }
      })
      .catch(() => {
        setProjects(mockProjects);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.email) return;
    setLoading(true);
    setTimeout(() => {
      setInquirySent(true);
      setLoading(false);
    }, 1000);
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = filterLocation === "ALL" || p.location.includes(filterLocation);
    const matchesType = filterType === "ALL" || p.status === filterType;
    return matchesSearch && matchesLocation && matchesType;
  });

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans" id="marketplace-landing">
      {/* Hero Header Jumbotron */}
      <div 
        className="relative bg-slate-955 text-white h-[360px] flex items-center justify-center text-center px-4"
        style={{
          backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
        id="marketplace-hero"
      >
        <div className="max-w-3xl space-y-4">
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 font-mono text-[10px] uppercase font-bold tracking-widest border border-amber-500/20 rounded-full">
            BhoomiOne Global Marketplace
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Premium Plotted Subdivisions & Architectural Land Listings
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Browse legally verified, RERA-approved plots, analyze master subdivisions maps, and directly connect with premium developers across prime high-growth sectors.
          </p>
        </div>
      </div>

      {/* Internal Interactive Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-30 mb-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-lg space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 w-4 h-4 pointer-events-none mt-3.5" />
              <input
                type="text"
                placeholder="Search premium layouts by name, developer, or subdivision code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1"
              >
                <option value="ALL">All Regions</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Mysuru">Mysuru</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1"
              >
                <option value="ALL">All Stages</option>
                <option value="DEVELOPING">Under Development</option>
                <option value="COMPLETED">Ready Possession</option>
                <option value="PLANNING">Pre-Launch / Planning</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Render */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Grid className="w-5 h-5 text-indigo-600" />
            Curated Land Subdivisions ({filteredProjects.length})
          </h2>
          <div className="text-xs text-slate-450 font-medium">
            Dynamic RERA Integration Enabled
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-450">Ingesting real-field geographic plans...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 space-y-3">
            <div className="text-slate-300 flex justify-center"><Building2 className="w-12 h-12" /></div>
            <p className="text-sm font-semibold text-slate-700">No projects match your current filters</p>
            <p className="text-xs text-slate-450 max-w-sm mx-auto">Try resetting your status criteria, modifying keyword queries, or searching other primary hubs.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((proj) => (
              <div 
                key={proj.id} 
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                <div className="h-44 overflow-hidden relative">
                  <img 
                    src={proj.banner || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80"}
                    alt={proj.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/90 text-white text-[10px] font-mono px-2 py-1 rounded font-bold uppercase tracking-wider backdrop-blur-xs">
                    {proj.code}
                  </div>
                  {proj.status && (
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full font-sans shadow-xs">
                      {proj.status}
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{proj.location}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug group-hover:text-indigo-650 transition-colors">
                      {proj.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {proj.description || "Premium plotted development ready for layout approval and GIS-tagged vector mapping."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Dimensions</p>
                      <p className="text-xs font-bold text-slate-900">{proj.dimensions || "Multiple Sizes"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Price Estimate</p>
                      <p className="text-xs font-extrabold text-emerald-700">{proj.priceRange || "Inquire for pricing"}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProject(proj);
                      setInquirySent(false);
                      setInquiryForm({ name: "", email: "", phone: "", message: `Interested in ${proj.name}` });
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Analyze Blueprint Layout</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100" id="project-details-modal">
            {/* Header / Banner */}
            <div className="h-60 relative">
              <img 
                src={selectedProject.banner} 
                alt={selectedProject.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex items-end p-6">
                <div className="text-white space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span>{selectedProject.location}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">{selectedProject.name}</h2>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-800 px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-colors"
              >
                Close
              </button>
            </div>

            {/* Content Core Body */}
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-705 uppercase tracking-wider">Subdivision Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-0.5">
                      <p className="text-slate-400 font-medium">Developer Partners</p>
                      <p className="text-slate-800 font-semibold">{selectedProject.developer_name}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-0.5">
                      <p className="text-slate-400 font-medium">RERA Registration</p>
                      <p className="text-slate-800 font-mono font-semibold text-[10px] select-all">{selectedProject.rera_number}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-0.5">
                      <p className="text-slate-400 font-medium font-semibold text-emerald-800">Approval Authority</p>
                      <p className="text-slate-800 font-semibold">{selectedProject.approval_authority}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-0.5">
                      <p className="text-slate-400 font-medium">Project Stage</p>
                      <p className="text-slate-800 font-semibold">{selectedProject.status}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-705 uppercase tracking-wider">Description</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {selectedProject.description} This plotted community has been curated with precision guidelines. Dynamic road networks, centralized drainage conduits, high-capacity underground electric ducts, and fiber lines are fully integrated at the site level. Digital SVG vector layers and automated plotting matrices are compiled to trace subdivisions.
                  </p>
                </div>

                {/* Simulated Visual Vector preview */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-705 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-indigo-600" />
                    Interactive Blueprint CAD Spec
                  </h3>
                  <div className="h-48 bg-slate-100 border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-10 flex flex-wrap gap-2 pointer-events-none p-2 leading-none">
                      {Array.from({ length: 48 }).map((_, i) => (
                        <div key={i} className="w-12 h-12 border border-slate-800 flex items-center justify-center font-mono text-[8px] color-slate-400">P-{100 + i}</div>
                      ))}
                    </div>
                    <div className="text-center space-y-1 relative z-10 transition-transform group-hover:scale-102">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-150 text-[10px] text-indigo-700 font-semibold">
                        <Maximize2 className="w-3 h-3" />
                        Interactive Viewport Ready
                      </span>
                      <p className="text-xs font-bold text-slate-800">Subdivision GIS Plot Layout Map</p>
                      <p className="text-[10px] text-slate-500 max-w-sm">
                        Purchase inquirers lock down individual plot coordinates and view physical dimensions using interactive SVG layers once workspace is complete.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inquiry Sidebar form */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4 h-fit">
                <h3 className="text-sm font-bold text-slate-900">Request Blueprint Catalog</h3>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Send your credentials directly to the developers desk to unlock pricing indexes, payment profiles, and master blueprints catalogs.
                </p>

                {inquirySent ? (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-4 rounded-xl text-center space-y-2">
                    <div className="text-emerald-650 flex justify-center"><ShieldCheck className="w-8 h-8" /></div>
                    <p className="font-bold">Inquiry Transmitted Successfully</p>
                    <p className="text-[11px] text-emerald-700">The developer partner team will verify your registry token and respond shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-3" id="inquiry-form-el">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Your Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={inquiryForm.name}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                        className="w-full bg-white border border-slate-250 rounded-lg p-2 text-xs focus:outline-none"
                        placeholder="e.g. Shaurya Pratap"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Email Registry</label>
                      <input 
                        type="email" 
                        required
                        value={inquiryForm.email}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                        className="w-full bg-white border border-slate-250 rounded-lg p-2 text-xs focus:outline-none"
                        placeholder="e.g. buyer@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Phone Number</label>
                      <input 
                        type="tel" 
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                        className="w-full bg-white border border-slate-250 rounded-lg p-2 text-xs focus:outline-none"
                        placeholder="e.g. +91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-1">Brief Query Message</label>
                      <textarea 
                        value={inquiryForm.message}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                        className="w-full bg-white border border-slate-250 rounded-lg p-2 text-xs focus:outline-none h-20 resize-none"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      {loading ? "Sending credentials..." : "Transmit catalog Request"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
