import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { 
  Megaphone, Plus, Trash2, Calendar, RefreshCw, CheckCircle2, 
  AlertCircle, Sparkles, Check, X, CreditCard, ChevronRight, BarChart3, 
  Search, Users, ShoppingBag, Building2, HelpCircle, Download, FileText, 
  LineChart as LineChartIcon, Eye, ArrowUpRight, ShieldCheck, TrendingUp,
  Target, Coins, Percent, Clock, MapPin, Edit3, Save, Info
} from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";

// Supported Campaign Types as requested by the user
export type CampaignType = 
  | "MARKETPLACE"
  | "FEATURED_BUILDER"
  | "FEATURED_PROJECT"
  | "HOMEPAGE_BANNER"
  | "EMAIL"
  | "WHATSAPP"
  | "PUSH"
  | "LEAD";

export interface ActiveCampaign {
  id: string;
  name: string;
  type: CampaignType;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "DRAFT";
  startDate: string;
  endDate: string;
  spend: number;
  revenue: number;
  leads: number;
  conversions: number;
  targetAudience?: string;
  timezone: string;
}

interface ActiveCampaignsConsoleProps {
  onShowToast: (message: string, type: "success" | "error") => void;
}

const COLORS = ["#4f46e5", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#ef4444"];

const INITIAL_CAMPAIGNS: ActiveCampaign[] = [
  {
    id: "CAMP-M1",
    name: "Monsoon Premium Theme Expo",
    type: "MARKETPLACE",
    status: "ACTIVE",
    startDate: "2026-06-01",
    endDate: "2026-07-15",
    spend: 45000,
    revenue: 185000,
    leads: 320,
    conversions: 98,
    targetAudience: "Niche Theme Creators & Custom Portal Tenants",
    timezone: "Asia/Kolkata"
  },
  {
    id: "CAMP-FB1",
    name: "Royal Meadows Builders Spotlight",
    type: "FEATURED_BUILDER",
    status: "ACTIVE",
    startDate: "2026-05-15",
    endDate: "2026-12-31",
    spend: 120000,
    revenue: 850000,
    leads: 450,
    conversions: 12,
    targetAudience: "Premium Villa & Gated Community Developers",
    timezone: "Asia/Kolkata"
  },
  {
    id: "CAMP-FP1",
    name: "Central Park Smart City Launch",
    type: "FEATURED_PROJECT",
    status: "ACTIVE",
    startDate: "2026-06-10",
    endDate: "2026-08-10",
    spend: 200000,
    revenue: 1500000,
    leads: 890,
    conversions: 24,
    targetAudience: "High Net Worth Plot Investors",
    timezone: "Asia/Kolkata"
  },
  {
    id: "CAMP-HB1",
    name: "Home Loan Festive Wave Hero Banner",
    type: "FEATURED_PROJECT",
    status: "ACTIVE",
    startDate: "2026-06-15",
    endDate: "2026-07-31",
    spend: 15000,
    revenue: 65000,
    leads: 1200,
    conversions: 180,
    targetAudience: "All Visiting Desktop Users looking for Home Loans",
    timezone: "Asia/Kolkata"
  },
  {
    id: "CAMP-EM1",
    name: "Enterprise Core Tier Upgrade Blast",
    type: "EMAIL",
    status: "COMPLETED",
    startDate: "2026-03-01",
    endDate: "2026-03-15",
    spend: 8000,
    revenue: 95000,
    leads: 2500,
    conversions: 110,
    targetAudience: "Free & Basic Tier Tenants active > 6 Months",
    timezone: "Asia/Kolkata"
  },
  {
    id: "CAMP-WA1",
    name: "Broker Circle Direct Onboarding",
    type: "WHATSAPP",
    status: "ACTIVE",
    startDate: "2026-05-01",
    endDate: "2026-07-31",
    spend: 120000,
    revenue: 1100000,
    leads: 600,
    conversions: 85,
    targetAudience: "RERA-certified Real Estate Consultants & Brokers",
    timezone: "Asia/Kolkata"
  },
  {
    id: "CAMP-PC1",
    name: "Plot Price Drop Push Notification Alert",
    type: "PUSH",
    status: "PAUSED",
    startDate: "2026-06-20",
    endDate: "2026-06-25",
    spend: 3500,
    revenue: 28000,
    leads: 4500,
    conversions: 62,
    targetAudience: "Users with Saved Plots in Wishlist (Mobile App)",
    timezone: "Asia/Kolkata"
  },
  {
    id: "CAMP-LD1",
    name: "Karnataka RERA Compliance Summit Leads",
    type: "LEAD",
    status: "ACTIVE",
    startDate: "2026-06-18",
    endDate: "2026-07-18",
    spend: 75000,
    revenue: 420000,
    leads: 180,
    conversions: 8,
    targetAudience: "Legal consultants and large developer aggregates",
    timezone: "Asia/Kolkata"
  }
];

export const ActiveCampaignsConsole: React.FC<ActiveCampaignsConsoleProps> = ({ onShowToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<"campaigns" | "roi" | "analytics" | "docs">("campaigns");
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.fetchCampaigns();
      // Map API fields if case or formatting is different
      const mapped = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type as CampaignType,
        status: item.status as ActiveCampaign["status"],
        startDate: item.startDate,
        endDate: item.endDate,
        spend: Number(item.spend) || 0,
        revenue: Number(item.revenue) || 0,
        leads: Number(item.leads) || 0,
        conversions: Number(item.conversions) || 0,
        targetAudience: item.targetAudience,
        timezone: item.timezone
      }));
      setCampaigns(mapped);
    } catch (err: any) {
      onShowToast("Failed to load active marketing campaigns: " + (err.message || err), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create Campaign Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCamp, setNewCamp] = useState<{
    name: string;
    type: CampaignType;
    spend: number;
    startDate: string;
    endDate: string;
    targetAudience: string;
    status: ActiveCampaign["status"];
    timezone: string;
  }>({
    name: "",
    type: "MARKETPLACE",
    spend: 10000,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "2026-12-31",
    targetAudience: "",
    status: "ACTIVE",
    timezone: "Asia/Kolkata"
  });

  // Edit Campaign State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<ActiveCampaign | null>(null);

  // ROI Calculator Playground State
  const [roiSpend, setRoiSpend] = useState<number>(50000);
  const [roiExpectedLeads, setRoiExpectedLeads] = useState<number>(500);
  const [roiConvRate, setRoiConvRate] = useState<number>(5); // 5% conversion rate
  const [roiValuePerConv, setRoiValuePerConv] = useState<number>(15000);

  const getCampaignTypeLabel = (type: CampaignType) => {
    switch (type) {
      case "MARKETPLACE": return "Marketplace Expo";
      case "FEATURED_BUILDER": return "Featured Builder";
      case "FEATURED_PROJECT": return "Featured Project";
      case "HOMEPAGE_BANNER": return "Homepage Banner Highlight";
      case "EMAIL": return "Email Marketing Blast";
      case "WHATSAPP": return "WhatsApp Instant Campaign";
      case "PUSH": return "Push Notification Flash";
      case "LEAD": return "Lead Acquisition Funnel";
      default: return "SaaS Promotion";
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamp.name.trim()) {
      onShowToast("Campaign name is required.", "error");
      return;
    }

    try {
      const res = await api.saveCampaign({
        name: newCamp.name.trim(),
        type: newCamp.type,
        status: newCamp.status,
        startDate: newCamp.startDate,
        endDate: newCamp.endDate,
        spend: Number(newCamp.spend) || 0,
        revenue: 0,
        leads: 0,
        conversions: 0,
        targetAudience: newCamp.targetAudience.trim() || "All Portal Visitors",
        timezone: newCamp.timezone
      });

      if (res.success) {
        onShowToast(`Campaign '${newCamp.name}' successfully scheduled & activated.`, "success");
        loadData();
        setShowCreateModal(false);
        setNewCamp({
          name: "",
          type: "MARKETPLACE",
          spend: 10000,
          startDate: new Date().toISOString().split("T")[0],
          endDate: "2026-12-31",
          targetAudience: "",
          status: "ACTIVE",
          timezone: "Asia/Kolkata"
        });
      }
    } catch (err: any) {
      onShowToast("Failed to create campaign: " + (err.message || err), "error");
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    try {
      const res = await api.deleteCampaign(id);
      if (res.success) {
        onShowToast(`Campaign '${name}' removed from live registers.`, "success");
        loadData();
      }
    } catch (err: any) {
      onShowToast("Failed to delete campaign: " + (err.message || err), "error");
    }
  };

  const handleStartEditing = (c: ActiveCampaign) => {
    setEditingId(c.id);
    setEditValues({ ...c });
  };

  const handleSaveEdit = async () => {
    if (!editValues) return;
    if (!editValues.name.trim()) {
      onShowToast("Campaign name cannot be blank.", "error");
      return;
    }

    try {
      const res = await api.saveCampaign({
        id: editValues.id,
        name: editValues.name.trim(),
        type: editValues.type,
        status: editValues.status,
        startDate: editValues.startDate,
        endDate: editValues.endDate,
        spend: Number(editValues.spend) || 0,
        revenue: Number(editValues.revenue) || 0,
        leads: Number(editValues.leads) || 0,
        conversions: Number(editValues.conversions) || 0,
        targetAudience: editValues.targetAudience || "",
        timezone: editValues.timezone
      });

      if (res.success) {
        onShowToast(`Campaign configurations updated successfully.`, "success");
        loadData();
        setEditingId(null);
        setEditValues(null);
      }
    } catch (err: any) {
      onShowToast("Failed to update campaign: " + (err.message || err), "error");
    }
  };

  const toggleCampaignStatus = async (id: string, current: ActiveCampaign["status"]) => {
    const nextStatus: ActiveCampaign["status"] = 
      current === "ACTIVE" ? "PAUSED" : current === "PAUSED" ? "ACTIVE" : "ACTIVE";

    const item = campaigns.find(c => c.id === id);
    if (!item) return;

    try {
      const res = await api.saveCampaign({
        id: item.id,
        name: item.name,
        type: item.type,
        status: nextStatus,
        startDate: item.startDate,
        endDate: item.endDate,
        spend: item.spend,
        revenue: item.revenue,
        leads: item.leads,
        conversions: item.conversions,
        targetAudience: item.targetAudience,
        timezone: item.timezone
      });

      if (res.success) {
        onShowToast(`Campaign status shifted to ${nextStatus}.`, "success");
        loadData();
      }
    } catch (err: any) {
      onShowToast("Failed to shift campaign status: " + (err.message || err), "error");
    }
  };

  // Calculations for dashboard
  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          getCampaignTypeLabel(c.type).toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.targetAudience && c.targetAudience.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === "ALL" || c.type === typeFilter;
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const netProfit = totalRevenue - totalSpend;
  const overallROI = totalSpend > 0 ? (netProfit / totalSpend) * 100 : 0;
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const averageConversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;

  // ROI Calculator Calculations
  const calculatedProjectedLeads = Number(roiExpectedLeads) || 0;
  const calculatedProjectedConversions = Math.round((calculatedProjectedLeads * (Number(roiConvRate) || 0)) / 100);
  const calculatedProjectedRevenue = calculatedProjectedConversions * (Number(roiValuePerConv) || 0);
  const calculatedProjectedNetProfit = calculatedProjectedRevenue - (Number(roiSpend) || 0);
  const calculatedProjectedROI = roiSpend > 0 ? (calculatedProjectedNetProfit / Number(roiSpend)) * 100 : 0;
  const calculatedCPL = calculatedProjectedLeads > 0 ? (Number(roiSpend) / calculatedProjectedLeads) : 0;

  // Visual metrics by category
  const spendByChannelData = [
    { name: "Marketplace", value: campaigns.filter(c => c.type === "MARKETPLACE").reduce((s, c) => s + c.spend, 0) },
    { name: "Featured Builder", value: campaigns.filter(c => c.type === "FEATURED_BUILDER").reduce((s, c) => s + c.spend, 0) },
    { name: "Featured Project", value: campaigns.filter(c => c.type === "FEATURED_PROJECT").reduce((s, c) => s + c.spend, 0) },
    { name: "Homepage Banner", value: campaigns.filter(c => c.type === "HOMEPAGE_BANNER").reduce((s, c) => s + c.spend, 0) },
    { name: "Email Campaign", value: campaigns.filter(c => c.type === "EMAIL").reduce((s, c) => s + c.spend, 0) },
    { name: "WhatsApp Campaign", value: campaigns.filter(c => c.type === "WHATSAPP").reduce((s, c) => s + c.spend, 0) },
    { name: "Push Campaign", value: campaigns.filter(c => c.type === "PUSH").reduce((s, c) => s + c.spend, 0) },
    { name: "Lead Campaign", value: campaigns.filter(c => c.type === "LEAD").reduce((s, c) => s + c.spend, 0) },
  ].filter(d => d.value > 0);

  const performanceByChannelData = [
    { name: "Marketplace", Spend: campaigns.filter(c => c.type === "MARKETPLACE").reduce((s, c) => s + c.spend, 0), Revenue: campaigns.filter(c => c.type === "MARKETPLACE").reduce((s, c) => s + c.revenue, 0) },
    { name: "Featured Builder", Spend: campaigns.filter(c => c.type === "FEATURED_BUILDER").reduce((s, c) => s + c.spend, 0), Revenue: campaigns.filter(c => c.type === "FEATURED_BUILDER").reduce((s, c) => s + c.revenue, 0) },
    { name: "Featured Project", Spend: campaigns.filter(c => c.type === "FEATURED_PROJECT").reduce((s, c) => s + c.spend, 0), Revenue: campaigns.filter(c => c.type === "FEATURED_PROJECT").reduce((s, c) => s + c.revenue, 0) },
    { name: "Homepage Banner", Spend: campaigns.filter(c => c.type === "HOMEPAGE_BANNER").reduce((s, c) => s + c.spend, 0), Revenue: campaigns.filter(c => c.type === "HOMEPAGE_BANNER").reduce((s, c) => s + c.revenue, 0) },
    { name: "Email", Spend: campaigns.filter(c => c.type === "EMAIL").reduce((s, c) => s + c.spend, 0), Revenue: campaigns.filter(c => c.type === "EMAIL").reduce((s, c) => s + c.revenue, 0) },
    { name: "WhatsApp", Spend: campaigns.filter(c => c.type === "WHATSAPP").reduce((s, c) => s + c.spend, 0), Revenue: campaigns.filter(c => c.type === "WHATSAPP").reduce((s, c) => s + c.revenue, 0) },
    { name: "Push Alert", Spend: campaigns.filter(c => c.type === "PUSH").reduce((s, c) => s + c.spend, 0), Revenue: campaigns.filter(c => c.type === "PUSH").reduce((s, c) => s + c.revenue, 0) },
    { name: "Lead Summit", Spend: campaigns.filter(c => c.type === "LEAD").reduce((s, c) => s + c.spend, 0), Revenue: campaigns.filter(c => c.type === "LEAD").reduce((s, c) => s + c.revenue, 0) },
  ];

  return (
    <div className="space-y-6" id="active-campaigns-console-root">
      
      {/* Central Header Frame */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-indigo-950 text-white rounded-3xl p-6 shadow-md gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-300" />
            <h4 className="text-sm font-black uppercase tracking-wider text-white">Active Marketing Campaigns & Promotions</h4>
          </div>
          <p className="text-xs text-indigo-200/80 max-w-xl leading-relaxed">
            Provision promotional spaces, schedule featured slots, and launch omni-channel triggers. Real-time conversion insights and direct return-on-investment (ROI) computations on central advertising nodes.
          </p>
        </div>
        <div className="flex items-center gap-4 border-l border-indigo-700/55 pl-6 shrink-0 h-12">
          <div className="text-center">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block">Consolidated Revenue</span>
            <span className="text-lg font-black text-white">₹{totalRevenue.toLocaleString()}</span>
          </div>
          <div className="text-center ml-4">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block">Net ROI</span>
            <span className={`text-lg font-black ${overallROI >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
              +{overallROI.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Primary Sub-Tabs Layout */}
      <div className="flex border-b border-slate-200 gap-1.5 overflow-x-auto select-none pb-px" id="campaigns-console-tabs-row">
        <button 
          onClick={() => setActiveSubTab("campaigns")}
          className={`px-4.5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === "campaigns" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Active Registry</span>
        </button>
        <button 
          onClick={() => setActiveSubTab("roi")}
          className={`px-4.5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === "roi" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>ROI Calculator Playground</span>
        </button>
        <button 
          onClick={() => setActiveSubTab("analytics")}
          className={`px-4.5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === "analytics" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Interactive Analytics</span>
        </button>
        <button 
          onClick={() => setActiveSubTab("docs")}
          className={`px-4.5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === "docs" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Framework Documentation</span>
        </button>
      </div>

      {/* SUB-TAB 1: Active Registry Table */}
      {activeSubTab === "campaigns" && (
        <div className="space-y-4 animate-fade-in" id="campaign-registry-subtab">
          
          {/* Controls Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Search promo name, category, target..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 text-xs rounded-xl outline-hidden text-slate-800 font-medium"
                />
              </div>

              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded-xl outline-hidden text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="MARKETPLACE">Marketplace Expo</option>
                <option value="FEATURED_BUILDER">Featured Builder</option>
                <option value="FEATURED_PROJECT">Featured Project</option>
                <option value="HOMEPAGE_BANNER">Homepage Banner</option>
                <option value="EMAIL">Email Campaign</option>
                <option value="WHATSAPP">WhatsApp Campaign</option>
                <option value="PUSH">Push Campaign</option>
                <option value="LEAD">Lead Funnel</option>
              </select>

              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-semibold rounded-xl outline-hidden text-slate-700 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>

            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs w-full md:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Launch New Campaign</span>
            </button>
          </div>

          {/* Table Element */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-3xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[9px] font-extrabold select-none">
                    <th className="p-4">Campaign Name</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Timeframe & Timezone</th>
                    <th className="p-4">Budget / Spend</th>
                    <th className="p-4">Leads / Conv.</th>
                    <th className="p-4">ROI & Conversion Rate</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-semibold">
                        No promotional campaigns match your filter. Start one above!
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map((c) => {
                      const isEditing = editingId === c.id;
                      const calculatedROI = c.spend > 0 ? ((c.revenue - c.spend) / c.spend) * 100 : 0;
                      const calculatedConv = c.leads > 0 ? (c.conversions / c.leads) * 100 : 0;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/30 transition-all">
                          {/* Name / Audience Block */}
                          <td className="p-4">
                            {isEditing ? (
                              <input 
                                type="text"
                                value={editValues?.name || ""}
                                onChange={(e) => setEditValues(editValues ? { ...editValues, name: e.target.value } : null)}
                                className="px-2 py-1 border border-slate-300 text-xs rounded-lg w-full font-semibold focus:border-indigo-500"
                              />
                            ) : (
                              <div className="space-y-0.5">
                                <span className="font-extrabold text-slate-800 text-[12px] block">
                                  {c.name}
                                </span>
                                <span className="text-[10px] text-slate-450 block font-medium">
                                  Target: {c.targetAudience || "General Matrix"}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Type */}
                          <td className="p-4">
                            {isEditing ? (
                              <select
                                value={editValues?.type}
                                onChange={(e) => setEditValues(editValues ? { ...editValues, type: e.target.value as CampaignType } : null)}
                                className="px-1.5 py-1 border border-slate-300 text-xs rounded-lg focus:border-indigo-500 cursor-pointer"
                              >
                                <option value="MARKETPLACE">Marketplace</option>
                                <option value="FEATURED_BUILDER">Featured Builder</option>
                                <option value="FEATURED_PROJECT">Featured Project</option>
                                <option value="HOMEPAGE_BANNER">Homepage Banner</option>
                                <option value="EMAIL">Email Campaign</option>
                                <option value="WHATSAPP">WhatsApp Campaign</option>
                                <option value="PUSH">Push Campaign</option>
                                <option value="LEAD">Lead Campaign</option>
                              </select>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-bold text-[9.5px]">
                                {c.type === "MARKETPLACE" && <ShoppingBag className="w-3 h-3 text-indigo-500" />}
                                {c.type === "FEATURED_BUILDER" && <Building2 className="w-3 h-3 text-emerald-500" />}
                                {c.type === "FEATURED_PROJECT" && <MapPin className="w-3 h-3 text-blue-500" />}
                                {c.type === "HOMEPAGE_BANNER" && <Sparkles className="w-3 h-3 text-amber-500" />}
                                {c.type === "EMAIL" && <RefreshCw className="w-3 h-3 text-purple-500 animate-spin-slow" />}
                                {c.type === "WHATSAPP" && <Megaphone className="w-3 h-3 text-teal-500" />}
                                {c.type === "PUSH" && <Clock className="w-3 h-3 text-rose-500" />}
                                {c.type === "LEAD" && <Target className="w-3 h-3 text-red-500" />}
                                <span>{getCampaignTypeLabel(c.type)}</span>
                              </span>
                            )}
                          </td>

                          {/* Schedule / Timezone */}
                          <td className="p-4 font-mono text-[10.5px]">
                            {isEditing ? (
                              <div className="space-y-1">
                                <input 
                                  type="date"
                                  value={editValues?.startDate || ""}
                                  onChange={(e) => setEditValues(editValues ? { ...editValues, startDate: e.target.value } : null)}
                                  className="px-1.5 py-0.5 border border-slate-300 text-[10.5px] rounded-lg w-full"
                                />
                                <input 
                                  type="date"
                                  value={editValues?.endDate || ""}
                                  onChange={(e) => setEditValues(editValues ? { ...editValues, endDate: e.target.value } : null)}
                                  className="px-1.5 py-0.5 border border-slate-300 text-[10.5px] rounded-lg w-full"
                                />
                              </div>
                            ) : (
                              <div className="space-y-0.5 text-slate-550">
                                <span className="block font-semibold">{c.startDate} to {c.endDate}</span>
                                <span className="text-[9px] text-indigo-500 font-sans block flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" /> Zone: {c.timezone}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Budget / Spend */}
                          <td className="p-4 font-mono font-bold text-[11px] text-slate-800">
                            {isEditing ? (
                              <input 
                                type="number"
                                value={editValues?.spend || 0}
                                onChange={(e) => setEditValues(editValues ? { ...editValues, spend: Number(e.target.value) } : null)}
                                className="px-2 py-1 border border-slate-300 text-xs rounded-lg w-24"
                              />
                            ) : (
                              <div className="space-y-0.5">
                                <span className="block">Spend: ₹{c.spend.toLocaleString()}</span>
                                <span className="text-[9.5px] text-slate-400 font-semibold block">Yielded: ₹{c.revenue.toLocaleString()}</span>
                              </div>
                            )}
                          </td>

                          {/* Leads / Conversions */}
                          <td className="p-4">
                            {isEditing ? (
                              <div className="space-y-1">
                                <input 
                                  type="number"
                                  placeholder="Leads"
                                  value={editValues?.leads || 0}
                                  onChange={(e) => setEditValues(editValues ? { ...editValues, leads: Number(e.target.value) } : null)}
                                  className="px-1.5 py-0.5 border border-slate-300 text-[11px] rounded-lg w-16"
                                />
                                <input 
                                  type="number"
                                  placeholder="Convs"
                                  value={editValues?.conversions || 0}
                                  onChange={(e) => setEditValues(editValues ? { ...editValues, conversions: Number(e.target.value) } : null)}
                                  className="px-1.5 py-0.5 border border-slate-300 text-[11px] rounded-lg w-16"
                                />
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="text-slate-700 font-bold font-mono">{c.leads} Leads</span>
                                <span className="text-[9.5px] text-indigo-600 block font-black font-mono">{c.conversions} Converted</span>
                              </div>
                            )}
                          </td>

                          {/* ROI / Conv % */}
                          <td className="p-4 font-semibold">
                            <div className="space-y-0.5">
                              <span className={`block font-extrabold ${calculatedROI >= 100 ? 'text-emerald-600' : 'text-slate-750'}`}>
                                ROI: +{calculatedROI.toFixed(1)}%
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                CVR: {calculatedConv.toFixed(1)}%
                              </span>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border inline-block ${
                              c.status === "ACTIVE" 
                                ? "bg-emerald-50 border-emerald-150 text-emerald-700"
                                : c.status === "PAUSED"
                                ? "bg-amber-50 border-amber-150 text-amber-700"
                                : c.status === "COMPLETED"
                                ? "bg-indigo-50 border-indigo-150 text-indigo-700"
                                : "bg-slate-50 border-slate-150 text-slate-500"
                            }`}>
                              {c.status}
                            </span>
                          </td>

                          {/* Action Items */}
                          <td className="p-4 text-center">
                            {isEditing ? (
                              <div className="flex items-center gap-1 justify-center">
                                <button
                                  onClick={handleSaveEdit}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded-md cursor-pointer"
                                  title="Save Changes"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditValues(null);
                                  }}
                                  className="bg-slate-200 hover:bg-slate-300 text-slate-600 p-1 rounded-md cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 justify-center">
                                <button
                                  onClick={() => toggleCampaignStatus(c.id, c.status)}
                                  className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-50 cursor-pointer"
                                  title={c.status === "ACTIVE" ? "Pause Campaign" : "Resume Campaign"}
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleStartEditing(c)}
                                  className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-50 cursor-pointer"
                                  title="Edit Fields"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCampaign(c.id, c.name)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-50 cursor-pointer"
                                  title="Delete Campaign"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Secure Scheduling disclaimer block */}
          <div className="bg-indigo-50/40 border border-indigo-150 rounded-2xl p-4 flex gap-3.5 items-start">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide">Autonomous Ad Rotation Scheduler</h5>
              <p className="text-[10.5px] text-slate-600 leading-relaxed">
                Featured slots and home page banners are managed with strict cron timelines synced to the native Asia/Kolkata timezone settings. Rotating triggers dynamically render active listings upon consumer handshakes, filtering out completed campaigns automatically.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: ROI Calculator Playground */}
      {activeSubTab === "roi" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" id="campaign-roi-playground">
          
          {/* Inputs Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div>
              <h5 className="text-[11.5px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>ROI Simulation parameters</span>
              </h5>
              <p className="text-[10px] text-slate-550 mt-1 leading-normal">
                Determine potential profit, conversion benchmarks, and cost parameters before funding promotional slots.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="space-y-1.5">
                <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block">Planned Campaign Spend (₹)</label>
                <input 
                  type="number"
                  value={roiSpend}
                  onChange={(e) => setRoiSpend(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg font-mono font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block">Expected Leads (Impressions to Clicks)</label>
                <input 
                  type="number"
                  value={roiExpectedLeads}
                  onChange={(e) => setRoiExpectedLeads(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg font-mono font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block">Expected Conversion Rate (%)</label>
                  <span className="text-xs font-bold text-indigo-600">{roiConvRate}%</span>
                </div>
                <input 
                  type="range"
                  min="0.1"
                  max="25"
                  step="0.1"
                  value={roiConvRate}
                  onChange={(e) => setRoiConvRate(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider block">Average Value Per Conversion (₹)</label>
                <input 
                  type="number"
                  value={roiValuePerConv}
                  onChange={(e) => setRoiValuePerConv(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg font-mono font-bold text-slate-800"
                />
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 space-y-1.5">
                <span className="text-[9.5px] font-extrabold uppercase text-indigo-700 tracking-wider block flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Cost Per Lead (CPL)</span>
                </span>
                <span className="text-base font-black text-slate-800 font-mono">
                  ₹{calculatedCPL.toFixed(1)}
                </span>
                <span className="text-[9px] text-slate-450 block">Ideal target threshold for real estate nodes is &lt; ₹500/lead.</span>
              </div>
            </div>
          </div>

          {/* Results Block */}
          <div className="md:col-span-2 space-y-4">
            
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-3xs">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">Simulated ROI Breakdown</span>
                </div>
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">Model: CVR-Pro-9</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl text-[10px]">
                <div>
                  <span className="text-slate-450 block font-semibold uppercase">Total Leads</span>
                  <span className="font-extrabold text-slate-700 font-mono">{calculatedProjectedLeads} clicks</span>
                </div>
                <div>
                  <span className="text-slate-450 block font-semibold uppercase">Conversions</span>
                  <span className="font-extrabold text-emerald-600 font-mono">{calculatedProjectedConversions} sales</span>
                </div>
                <div>
                  <span className="text-slate-450 block font-semibold uppercase">Est. Revenue</span>
                  <span className="font-mono font-extrabold text-slate-700">₹{calculatedProjectedRevenue.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-450 block font-semibold uppercase">Conversion Value</span>
                  <span className="font-mono font-extrabold text-indigo-600">₹{roiValuePerConv.toLocaleString()} / EA</span>
                </div>
              </div>

              {/* Dynamic Ledger Invoice Section */}
              <div className="space-y-2">
                <h6 className="text-[9.5px] font-extrabold uppercase text-slate-450 tracking-wider">Projected Investment Yield</h6>
                
                <div className="divide-y divide-slate-100 text-xs text-slate-600 font-medium font-mono">
                  <div className="flex justify-between py-2.5">
                    <span>Target Ad-Slab Cost:</span>
                    <span className="font-bold text-slate-800">₹{roiSpend.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between py-2.5">
                    <span>Projected Gross Yield:</span>
                    <span className="font-bold text-slate-800">₹{calculatedProjectedRevenue.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-2.5 text-emerald-600 font-bold bg-emerald-50/40 px-2 rounded">
                    <span>Net Campaign Profit:</span>
                    <span>₹{calculatedProjectedNetProfit.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between py-3 text-sm font-black text-slate-800 border-t border-slate-200">
                    <span className="font-sans">Projected ROI %:</span>
                    <span className="text-indigo-600 font-mono">+{calculatedProjectedROI.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons inside calculator */}
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[9.5px] text-slate-400">Values are computed dynamic projections and do not lock GST metrics.</span>
                <button
                  onClick={() => {
                    const tempCamp: ActiveCampaign = {
                      id: `CAMP-${Date.now()}`,
                      name: `Simulated Funnel Target ₹${Math.round(roiSpend/1000)}k`,
                      type: "LEAD",
                      status: "DRAFT",
                      startDate: new Date().toISOString().split("T")[0],
                      endDate: "2026-10-31",
                      spend: roiSpend,
                      revenue: calculatedProjectedRevenue,
                      leads: roiExpectedLeads,
                      conversions: calculatedProjectedConversions,
                      targetAudience: `Simulated Target CVR ${roiConvRate}%`,
                      timezone: "Asia/Kolkata"
                    };
                    setCampaigns([tempCamp, ...campaigns]);
                    onShowToast(`Simulation saved to registry as a DRAFT.`, "success");
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-3xs flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Commit to Registry Draft</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* SUB-TAB 3: Interactive Analytics */}
      {activeSubTab === "analytics" && (
        <div className="space-y-6 animate-fade-in" id="campaign-analytics-subtab">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-3xs">
              <div className="space-y-1">
                <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Campaign Outlay</p>
                <h4 className="text-xl font-black text-slate-800 tracking-tight">₹{totalSpend.toLocaleString()}</h4>
                <p className="text-[9px] text-slate-400">Across {campaigns.length} total channels</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-3xs">
              <div className="space-y-1">
                <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Gross Revenue</p>
                <h4 className="text-xl font-black text-emerald-600 tracking-tight">₹{totalRevenue.toLocaleString()}</h4>
                <p className="text-[9px] text-slate-400">Yielded to builders & store</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-3xs">
              <div className="space-y-1">
                <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Total Leads Acquired</p>
                <h4 className="text-xl font-black text-slate-800 tracking-tight">{totalLeads.toLocaleString()}</h4>
                <p className="text-[9px] text-indigo-500 font-semibold block">CVR Rate: {averageConversionRate.toFixed(1)}%</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-3xs">
              <div className="space-y-1">
                <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Active Promos</p>
                <h4 className="text-xl font-black text-slate-800 tracking-tight">
                  {campaigns.filter(c => c.status === "ACTIVE").length} Slots
                </h4>
                <p className="text-[9px] text-slate-400">Currently live & rotating</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Megaphone className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Outlay vs Yield comparative chart */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
              <div>
                <h5 className="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>Outlay vs. Direct Gross Revenue by Segment</span>
                </h5>
                <p className="text-[10px] text-slate-500">Compare funding vs yielded conversions across all requested Campaign Types.</p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceByChannelData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "rgba(255,255,255,0.96)", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "11px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "10.5px", paddingTop: "10px" }} />
                    <Bar dataKey="Spend" fill="#818cf8" radius={[4, 4, 0, 0]} name="Funding (₹)" />
                    <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Conversions Yielded (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Allocation pie chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs flex flex-col justify-between">
              <div>
                <h5 className="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-indigo-600" />
                  <span>Capital Allocation Distribution</span>
                </h5>
                <p className="text-[10px] text-slate-500">Review total budget share currently mapped inside marketing registers.</p>
              </div>

              {spendByChannelData.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">No spend metrics available.</div>
              ) : (
                <div className="h-56 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spendByChannelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {spendByChannelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Absolute Center stats */}
                  <div className="absolute text-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Total</span>
                    <span className="text-sm font-black text-slate-800 font-mono">₹{totalSpend.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Legend checklist */}
              <div className="grid grid-cols-2 gap-2 text-[9px] border-t border-slate-100 pt-3 mt-1.5">
                {spendByChannelData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-500 font-bold truncate block">{item.name}</span>
                  </div>
                ))}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* SUB-TAB 4: Framework Documentation */}
      {activeSubTab === "docs" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 animate-fade-in" id="campaign-documentation-subtab">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h5 className="text-sm font-black text-slate-800 uppercase tracking-wide">ACTIVE_CAMPAIGNS.md System Documentation</h5>
          </div>

          <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-4 text-slate-700">
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">1. Architecture Overview</h4>
              <p className="mt-1">
                The **Active Campaigns & Omnichannel Promotions Console** serves as BhoomiOne’s central configuration directory for administering promotional real estate highlights. It regulates rotating layouts, handles programmatic ad injections, tracks impressions, and generates continuous conversion statistics.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
              <h5 className="font-extrabold text-slate-800 uppercase text-[10.5px]">Supported Campaign Slots (The 8 Dimensions)</h5>
              <ul className="list-disc pl-5 space-y-1 text-slate-650">
                <li><strong>Marketplace (`MARKETPLACE`)</strong>: Spotlight top developer layouts and premium plugin slabs.</li>
                <li><strong>Featured Builder (`FEATURED_BUILDER`)</strong>: Premium corporate logo highlight slides displayed across visitor panels.</li>
                <li><strong>Featured Project (`FEATURED_PROJECT`)</strong>: Direct construction and plotting project spotlights to capture real-estate investors.</li>
                <li><strong>Homepage Banner (`HOMEPAGE_BANNER`)</strong>: Hero banners shown to visitors in specific timeframes.</li>
                <li><strong>Email Campaign (`EMAIL`)</strong>: Transactional promotion emails with dynamic tracking tokens.</li>
                <li><strong>WhatsApp Campaign (`WHATSAPP`)</strong>: Automated template push to brokers and agents.</li>
                <li><strong>Push Campaign (`PUSH`)</strong>: Mobile and web alert cards directed at saved wishlists.</li>
                <li><strong>Lead Campaign (`LEAD`)</strong>: Paid marketing lead funnels backed by strict Cost Per Lead analytics.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide mt-4">2. Programmatic Integration Handshake</h4>
              <p className="mt-1">
                When consumers access specific dashboard hubs or public frontpages, the backend service scans the Active Campaign register to filter valid, non-paused banners fitting the target geolocation or client.
              </p>
              <pre className="p-3 bg-slate-900 text-indigo-300 rounded-lg font-mono text-[10px] mt-2 block overflow-x-auto">
{`// Example handshake query requesting active home banner highlight
import { CampaignRouter } from "/server/services/campaigns";

const banner = await CampaignRouter.getActivePromotion({
  type: "HOMEPAGE_BANNER",
  tenantId: "T-8819",
  clientTimezone: "Asia/Kolkata"
});

if (banner) {
  renderHeroAdSlider({
    image: banner.heroAssetUrl,
    trackingToken: banner.id,
    targetUrl: banner.targetLandingPage
  });
}`}
              </pre>
            </div>

            <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-slate-400 text-[10px]">
              <span>BhoomiOne Promo Standards Framework v2.1</span>
              <span>Central Scheduling Active</span>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL DIALOG */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-3xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg shadow-xl space-y-5 animate-scale-up">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black uppercase text-indigo-950 tracking-wider flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-600" />
                <span>Launch Advertising Campaign</span>
              </h4>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs text-slate-700">
              
              <div className="space-y-1">
                <label className="font-extrabold text-slate-500 uppercase text-[9.5px] block">Campaign Title Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Monsoon Gated Community Promo"
                  value={newCamp.name}
                  onChange={(e) => setNewCamp({ ...newCamp, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-medium focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 uppercase text-[9.5px] block">Promotion Type Slot</label>
                  <select 
                    value={newCamp.type}
                    onChange={(e) => setNewCamp({ ...newCamp, type: e.target.value as CampaignType })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer bg-white"
                  >
                    <option value="MARKETPLACE">Marketplace Expo</option>
                    <option value="FEATURED_BUILDER">Featured Builder</option>
                    <option value="FEATURED_PROJECT">Featured Project</option>
                    <option value="HOMEPAGE_BANNER">Homepage Banner</option>
                    <option value="EMAIL">Email Campaign</option>
                    <option value="WHATSAPP">WhatsApp Campaign</option>
                    <option value="PUSH">Push Campaign</option>
                    <option value="LEAD">Lead Campaign</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 uppercase text-[9.5px] block">Budget Outlay (₹)</label>
                  <input 
                    type="number"
                    value={newCamp.spend}
                    onChange={(e) => setNewCamp({ ...newCamp, spend: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 uppercase text-[9.5px] block">Start Scheduling Date</label>
                  <input 
                    type="date"
                    required
                    value={newCamp.startDate}
                    onChange={(e) => setNewCamp({ ...newCamp, startDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 uppercase text-[9.5px] block">Expiry End Date</label>
                  <input 
                    type="date"
                    required
                    value={newCamp.endDate}
                    onChange={(e) => setNewCamp({ ...newCamp, endDate: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 uppercase text-[9.5px] block">Target Audience Segment</label>
                  <input 
                    type="text"
                    placeholder="e.g. Bangalore Plot buyers"
                    value={newCamp.targetAudience}
                    onChange={(e) => setNewCamp({ ...newCamp, targetAudience: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-500 uppercase text-[9.5px] block">Cron Timezone Lock</label>
                  <select 
                    value={newCamp.timezone}
                    onChange={(e) => setNewCamp({ ...newCamp, timezone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (UTC +5:30)</option>
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                    <option value="Asia/Dubai">Asia/Dubai (UTC +4:00)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer flex items-center gap-1.5 shadow-3xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Schedule Launch</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
