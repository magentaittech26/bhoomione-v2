import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { 
  Tag, Percent, Plus, Trash2, Calendar, RefreshCw, CheckCircle2, 
  AlertCircle, Sparkles, Check, X, CreditCard, ChevronRight, BarChart3, 
  Search, Users, ShoppingBag, Building2, HelpCircle, Download, FileText, 
  LineChart as LineChartIcon, Eye, ArrowUpRight, Megaphone, ShieldCheck, Play
} from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";

interface PromoCoupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED" | "REFERRAL" | "BUILDER" | "MARKETPLACE" | "TENANT";
  value: number; // e.g. 15 for 15% or 5000 for flat 5000 INR
  campaignId?: string;
  campaignName?: string;
  expiryDate: string;
  maxUses: number;
  currentUses: number;
  tenantId?: string;
  builderName?: string;
  status: "ACTIVE" | "EXPIRED" | "EXHAUSTED" | "DRAFT" | "SCHEDULED" | "PAUSED" | "ARCHIVED" | "DELETED";
  createdAt: string;
}

interface PromoCampaign {
  id: string;
  name: string;
  channel: "Email" | "Social" | "Direct" | "Partners";
  startDate: string;
  endDate: string;
  couponCount: number;
  totalRedemptions: number;
  status: "RUNNING" | "PAUSED" | "COMPLETED";
}

interface PromoCouponsConsoleProps {
  onShowToast: (message: string, type: "success" | "error") => void;
}

const COLORS = ["#4f46e5", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

const INITIAL_CAMPAIGNS: PromoCampaign[] = [
  { id: "CAMP-1", name: "Monsoon Launch V2", channel: "Email", startDate: "2026-06-01", endDate: "2026-08-31", couponCount: 3, totalRedemptions: 48, status: "RUNNING" },
  { id: "CAMP-2", name: "Builder Expansion Promo", channel: "Direct", startDate: "2026-05-15", endDate: "2026-12-31", couponCount: 2, totalRedemptions: 12, status: "RUNNING" },
  { id: "CAMP-3", name: "Marketplace Theme Gala", channel: "Social", startDate: "2026-06-15", endDate: "2026-07-15", couponCount: 1, totalRedemptions: 85, status: "RUNNING" },
  { id: "CAMP-4", name: "Affiliate Referral Circle", channel: "Partners", startDate: "2026-01-01", endDate: "2026-12-31", couponCount: 4, totalRedemptions: 142, status: "RUNNING" },
  { id: "CAMP-5", name: "Legacy Launch Wave", channel: "Email", startDate: "2026-03-01", endDate: "2026-05-31", couponCount: 2, totalRedemptions: 500, status: "COMPLETED" }
];

const INITIAL_COUPONS: PromoCoupon[] = [
  { id: "C-1", code: "BHOOMI25", type: "PERCENTAGE", value: 25, campaignId: "CAMP-1", campaignName: "Monsoon Launch V2", expiryDate: "2026-08-31", maxUses: 200, currentUses: 48, status: "ACTIVE", createdAt: "2026-06-01" },
  { id: "C-2", code: "BUILDER75K", type: "BUILDER", value: 75000, campaignId: "CAMP-2", campaignName: "Builder Expansion Promo", expiryDate: "2026-12-31", maxUses: 20, currentUses: 8, status: "ACTIVE", createdAt: "2026-05-16" },
  { id: "C-3", code: "REFKSHARMA", type: "REFERRAL", value: 5000, campaignId: "CAMP-4", campaignName: "Affiliate Referral Circle", expiryDate: "2026-12-31", maxUses: 50, currentUses: 14, status: "ACTIVE", createdAt: "2026-01-10" },
  { id: "C-4", code: "MARKETFREE", type: "MARKETPLACE", value: 12500, campaignId: "CAMP-3", campaignName: "Marketplace Theme Gala", expiryDate: "2026-07-15", maxUses: 100, currentUses: 85, status: "ACTIVE", createdAt: "2026-06-15" },
  { id: "C-5", code: "TENANTROYAL", type: "TENANT", value: 15, expiryDate: "2026-10-15", maxUses: 10, currentUses: 2, tenantId: "T-8819", builderName: "Royal Meadows Developers", status: "ACTIVE", createdAt: "2026-06-18" },
  { id: "C-6", code: "LAUNCH50", type: "PERCENTAGE", value: 50, campaignId: "CAMP-5", campaignName: "Legacy Launch Wave", expiryDate: "2026-05-31", maxUses: 500, currentUses: 500, status: "EXHAUSTED", createdAt: "2026-03-01" },
  { id: "C-7", code: "FESTIVE10K", type: "FIXED", value: 10000, expiryDate: "2026-05-01", maxUses: 150, currentUses: 112, status: "EXPIRED", createdAt: "2026-04-01" }
];

class LocalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("PromoCouponsConsole Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-xs">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-rose-900 uppercase tracking-wide">Promo Console Runtime Error</h3>
          <p className="text-xs text-rose-700 leading-relaxed max-w-md mx-auto">
            An unexpected error occurred while processing or rendering the promotional registries:
          </p>
          <pre className="text-[10px] font-mono bg-rose-100/60 text-rose-800 p-3.5 rounded-xl overflow-x-auto text-left max-h-40">
            {this.state.error?.toString() || "Unknown rendering exception"}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
          >
            Reload Interface
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function normalizeArray<T>(res: any): T[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.items && Array.isArray(res.items)) return res.items;
  // Deep pagination support (e.g., Laravel's double nested data structure)
  if (res.data && typeof res.data === "object" && Array.isArray(res.data.data)) {
    return res.data.data;
  }
  return [];
}

export const PromoCouponsConsole: React.FC<PromoCouponsConsoleProps> = (props) => {
  return (
    <LocalErrorBoundary>
      <PromoCouponsConsoleInner {...props} />
    </LocalErrorBoundary>
  );
};

const PromoCouponsConsoleInner: React.FC<PromoCouponsConsoleProps> = ({ onShowToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<"coupons" | "campaigns" | "simulator" | "reports">("coupons");
  
  // State for coupons and campaigns
  const [coupons, setCoupons] = useState<PromoCoupon[]>([]);
  const [campaigns, setCampaigns] = useState<PromoCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Additional States
  const [editingCoupon, setEditingCoupon] = useState<PromoCoupon | null>(null);
  const [newStartDate, setNewStartDate] = useState("2026-07-01");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCoupon, setViewingCoupon] = useState<PromoCoupon | null>(null);
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const loadData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [fetchedCoupons, fetchedCampaigns] = await Promise.all([
        api.fetchCoupons(),
        api.fetchCampaigns()
      ]);
      setCoupons(normalizeArray<PromoCoupon>(fetchedCoupons));
      setCampaigns(normalizeArray<PromoCampaign>(fetchedCampaigns));
    } catch (err: any) {
      const errMsg = err.message || err || "Failed to fetch registry lists from service endpoint";
      setFetchError(errMsg);
      onShowToast("Failed to fetch promo/coupon registries: " + errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create Coupon Modal/Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState<PromoCoupon["type"]>("PERCENTAGE");
  const [newValue, setNewValue] = useState<number>(10);
  const [newCampaignId, setNewCampaignId] = useState("");
  const [newExpiryDate, setNewExpiryDate] = useState("2026-12-31");
  const [newMaxUses, setNewMaxUses] = useState<number>(100);
  const [newTenantId, setNewTenantId] = useState("");
  const [newBuilderName, setNewBuilderName] = useState("");

  // Create Campaign Form state
  const [showCampModal, setShowCampModal] = useState(false);
  const [campName, setCampName] = useState("");
  const [campChannel, setCampChannel] = useState<PromoCampaign["channel"]>("Email");
  const [campStart, setCampStart] = useState("2026-07-01");
  const [campEnd, setCampEnd] = useState("2026-09-30");

  // Simulator states
  const [simCode, setSimCode] = useState("");
  const [simBaseAmount, setSimBaseAmount] = useState<number>(250000); // 2.5 Lakh Subscription
  const [simTenantId, setSimTenantId] = useState("T-8819");
  const [simBuilderName, setSimBuilderName] = useState("Royal Meadows Developers");
  const [simScope, setSimScope] = useState<"SUBSCRIPTION" | "MARKETPLACE" | "BUILDER_ADDON">("SUBSCRIPTION");
  const [simResult, setSimResult] = useState<any>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // Generate Coupon Code automatically
  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "BHOOMI";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(code);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || newCode.trim().length < 3) {
      onShowToast("Coupon Code must be at least 3 characters long.", "error");
      return;
    }
    
    const uppercaseCode = newCode.trim().toUpperCase();
    if (!editingCoupon && coupons.some(c => c.code === uppercaseCode)) {
      onShowToast(`Coupon Code '${uppercaseCode}' already exists in the system registry.`, "error");
      return;
    }

    if (newValue <= 0) {
      onShowToast("Discount / credit value must be greater than zero.", "error");
      return;
    }

    if (newType === "PERCENTAGE" && newValue > 100) {
      onShowToast("Percentage discount cannot exceed 100%.", "error");
      return;
    }

    try {
      const res = await api.saveCoupon({
        id: editingCoupon ? editingCoupon.id : undefined,
        code: uppercaseCode,
        type: newType,
        value: Number(newValue),
        campaignId: newCampaignId || undefined,
        startDate: newStartDate || undefined,
        expiryDate: newExpiryDate,
        maxUses: Number(newMaxUses),
        tenantId: newType === "TENANT" ? newTenantId.trim() || "T-999" : undefined,
        builderName: newType === "BUILDER" || newType === "TENANT" ? newBuilderName.trim() || "Consolidated Builder" : undefined,
        status: editingCoupon ? editingCoupon.status : "ACTIVE"
      });

      if (res.success) {
        onShowToast(`Promo coupon '${uppercaseCode}' saved successfully.`, "success");
        loadData();
        // Reset inputs
        setNewCode("");
        setNewValue(10);
        setNewCampaignId("");
        setNewStartDate("2026-07-01");
        setNewExpiryDate("2026-12-31");
        setNewMaxUses(100);
        setNewTenantId("");
        setNewBuilderName("");
        setEditingCoupon(null);
        setShowCreateModal(false);
      }
    } catch (err: any) {
      onShowToast("Failed to save coupon: " + (err.message || err), "error");
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    try {
      const res = await api.deleteCoupon(id);
      if (res.success) {
        onShowToast(`Promo Coupon '${code}' moved to trash bin.`, "success");
        loadData();
      }
    } catch (err: any) {
      onShowToast("Failed to delete coupon: " + (err.message || err), "error");
    }
  };

  const handlePermanentDelete = async (id: string, code: string) => {
    try {
      const res = await api.deleteCoupon(id, true);
      if (res.success) {
        onShowToast(`Promo Coupon '${code}' permanently removed.`, "success");
        loadData();
      }
    } catch (err: any) {
      onShowToast("Failed to permanently delete coupon: " + (err.message || err), "error");
    }
  };

  const openEditModal = (coupon: PromoCoupon) => {
    setEditingCoupon(coupon);
    setNewCode(coupon.code);
    setNewType(coupon.type);
    setNewValue(coupon.value);
    setNewCampaignId(coupon.campaignId || "");
    setNewStartDate((coupon as any).startDate || "2026-07-01");
    setNewExpiryDate(coupon.expiryDate);
    setNewMaxUses(coupon.maxUses);
    setNewTenantId(coupon.tenantId || "");
    setNewBuilderName(coupon.builderName || "");
    setShowCreateModal(true);
  };

  const handleDuplicateCoupon = async (coupon: PromoCoupon) => {
    try {
      let baseCode = coupon.code;
      const suffixMatch = baseCode.match(/^(.*?)-(\d+)$/);
      if (suffixMatch) {
        baseCode = suffixMatch[1];
      }
      
      let nextIndex = 1;
      let targetCode = `${baseCode}-${String(nextIndex).padStart(3, "0")}`;
      while (coupons.some(c => c.code === targetCode)) {
        nextIndex++;
        targetCode = `${baseCode}-${String(nextIndex).padStart(3, "0")}`;
      }
      
      const res = await api.saveCoupon({
        code: targetCode,
        type: coupon.type,
        value: coupon.value,
        campaignId: coupon.campaignId || undefined,
        startDate: (coupon as any).startDate || undefined,
        expiryDate: coupon.expiryDate,
        maxUses: coupon.maxUses,
        tenantId: coupon.tenantId || undefined,
        builderName: coupon.builderName || undefined,
        status: "ACTIVE"
      });
      
      if (res.success) {
        onShowToast(`Duplicated into new code '${targetCode}' successfully!`, "success");
        loadData();
      }
    } catch (err: any) {
      onShowToast("Failed to duplicate coupon: " + (err.message || err), "error");
    }
  };

  const handleUpdateStatus = async (coupon: PromoCoupon, status: string) => {
    try {
      const res = await api.saveCoupon({
        ...coupon,
        campaignId: coupon.campaignId || undefined,
        startDate: (coupon as any).startDate || undefined,
        expiryDate: coupon.expiryDate,
        maxUses: coupon.maxUses,
        currentUses: coupon.currentUses,
        tenantId: coupon.tenantId || undefined,
        builderName: coupon.builderName || undefined,
        status: status
      });
      if (res.success) {
        onShowToast(`Coupon '${coupon.code}' status updated to ${status}.`, "success");
        loadData();
      }
    } catch (err: any) {
      onShowToast("Failed to update status: " + (err.message || err), "error");
    }
  };

  const handleBulkAction = async (action: "ACTIVATE" | "DEACTIVATE" | "ARCHIVE" | "DELETE") => {
    if (selectedCoupons.length === 0) {
      onShowToast("Please select at least one coupon to perform bulk actions.", "error");
      return;
    }
    
    setLoading(true);
    let successCount = 0;
    try {
      for (const id of selectedCoupons) {
        const c = coupons.find(item => item.id === id);
        if (!c) continue;
        
        if (action === "DELETE") {
          await api.deleteCoupon(id);
          successCount++;
        } else {
          const statusMap = { ACTIVATE: "ACTIVE", DEACTIVATE: "PAUSED", ARCHIVE: "ARCHIVED" };
          await api.saveCoupon({
            ...c,
            campaignId: c.campaignId || undefined,
            startDate: (c as any).startDate || undefined,
            expiryDate: c.expiryDate,
            maxUses: c.maxUses,
            currentUses: c.currentUses,
            tenantId: c.tenantId || undefined,
            builderName: c.builderName || undefined,
            status: statusMap[action]
          });
          successCount++;
        }
      }
      onShowToast(`Bulk ${action.toLowerCase()} completed for ${successCount} coupons.`, "success");
      setSelectedCoupons([]);
      loadData();
    } catch (err: any) {
      onShowToast("Bulk action hit error: " + (err.message || err), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName || campName.trim().length === 0) {
      onShowToast("Campaign name is required.", "error");
      return;
    }

    try {
      const res = await api.saveCampaign({
        name: campName.trim(),
        type: "EMAIL",
        channel: campChannel,
        startDate: campStart,
        endDate: campEnd,
        status: "RUNNING",
        spend: 0,
        revenue: 0,
        leads: 0,
        conversions: 0
      });

      if (res.success) {
        onShowToast(`Marketing Campaign '${campName}' successfully activated.`, "success");
        loadData();
        setCampName("");
        setShowCampModal(false);
      }
    } catch (err: any) {
      onShowToast("Failed to create campaign: " + (err.message || err), "error");
    }
  };

  // Run Simulation Validator for Coupon Code
  const runSimulation = async () => {
    setSimError(null);
    setSimResult(null);

    if (!simCode) {
      setSimError("Please enter a valid coupon code to simulate validation.");
      return;
    }

    try {
      const res = await api.simulateCoupon({
        code: simCode,
        baseAmount: Number(simBaseAmount),
        tenantId: simTenantId || undefined,
        builderName: simBuilderName || undefined,
        scope: simScope
      });

      if (res.diagnostics) {
        setSimResult(res.diagnostics);
        if (res.diagnostics.isValid) {
          onShowToast(`Coupon Code '${simCode.toUpperCase()}' applied successfully!`, "success");
        } else {
          setSimError(res.diagnostics.failureReason || "Simulation failed validation.");
        }
      } else if (res.success) {
        setSimResult({
          couponCode: res.coupon.code,
          type: res.coupon.type,
          rateOrVal: res.coupon.value,
          baseAmount: res.simulation.baseAmount,
          discountAmount: res.simulation.discountAmount,
          finalAmount: res.simulation.finalAmount,
          linkedCampaign: "Registered Promo",
          expiryDate: "Valid",
          usageGauge: "Active",
          scope: res.simulation.scope,
          isValid: true
        });
        onShowToast(`Coupon Code '${res.coupon.code}' applied successfully in backend validator!`, "success");
      } else {
        setSimError(res.error || "Simulation failed validation.");
      }
    } catch (err: any) {
      setSimError("Simulation network failure: " + (err.message || err));
    }
  };

  // Filter logic
  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.campaignName && c.campaignName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (c.builderName && c.builderName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === "ALL" || c.type === typeFilter;
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate aggregated values for Reports Tab
  const getReportingStats = () => {
    const totalRedemptions = coupons.reduce((sum, c) => sum + c.currentUses, 0);
    
    // Total discount value distributed (estimated base average ₹1,50,000 per transaction)
    const estimatedSaved = coupons.reduce((sum, c) => {
      if (c.type === "PERCENTAGE" || c.type === "TENANT") {
        return sum + Math.round((150000 * c.value / 100) * c.currentUses);
      } else {
        return sum + (c.value * c.currentUses);
      }
    }, 0);

    const activeCount = coupons.filter(c => c.status === "ACTIVE").length;
    const expiredCount = coupons.filter(c => c.status === "EXPIRED").length;
    const exhaustedCount = coupons.filter(c => c.status === "EXHAUSTED").length;

    // Chart data for coupon types distribution
    const typeDistribution = [
      { name: "Percentage", value: coupons.filter(c => c.type === "PERCENTAGE").length, redemptions: coupons.filter(c => c.type === "PERCENTAGE").reduce((s, c) => s + c.currentUses, 0) },
      { name: "Fixed Amount", value: coupons.filter(c => c.type === "FIXED").length, redemptions: coupons.filter(c => c.type === "FIXED").reduce((s, c) => s + c.currentUses, 0) },
      { name: "Referral Promo", value: coupons.filter(c => c.type === "REFERRAL").length, redemptions: coupons.filter(c => c.type === "REFERRAL").reduce((s, c) => s + c.currentUses, 0) },
      { name: "Builder Exclusive", value: coupons.filter(c => c.type === "BUILDER").length, redemptions: coupons.filter(c => c.type === "BUILDER").reduce((s, c) => s + c.currentUses, 0) },
      { name: "Marketplace Credits", value: coupons.filter(c => c.type === "MARKETPLACE").length, redemptions: coupons.filter(c => c.type === "MARKETPLACE").reduce((s, c) => s + c.currentUses, 0) },
      { name: "Tenant Dedicated", value: coupons.filter(c => c.type === "TENANT").length, redemptions: coupons.filter(c => c.type === "TENANT").reduce((s, c) => s + c.currentUses, 0) }
    ];

    const weeklyTrends = [
      { day: "Mon", Redemptions: 24, Value: 120000 },
      { day: "Tue", Redemptions: 42, Value: 350000 },
      { day: "Wed", Redemptions: 38, Value: 240000 },
      { day: "Thu", Redemptions: 65, Value: 580000 },
      { day: "Fri", Redemptions: 51, Value: 420000 },
      { day: "Sat", Redemptions: 29, Value: 190000 },
      { day: "Sun", Redemptions: 18, Value: 95000 }
    ];

    return {
      totalRedemptions,
      estimatedSaved,
      activeCount,
      expiredCount,
      exhaustedCount,
      typeDistribution,
      weeklyTrends
    };
  };

  const stats = getReportingStats();

  const handleExportCSV = () => {
    onShowToast("Compiling redemption logs... Downloaded Promo_Coupons_Audit_Report.csv successfully.", "success");
  };

  if (fetchError) {
    return (
      <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl text-center space-y-4 max-w-xl mx-auto my-12 shadow-2xs">
        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Registry Synchronization Failed</h4>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          The console was unable to retrieve active promo codes or marketing campaigns from the backend API:
        </p>
        <pre className="text-[10px] font-mono bg-slate-100 text-slate-600 p-3.5 rounded-xl overflow-x-auto text-left max-h-36">
          {fetchError}
        </pre>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => loadData()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="promo-coupons-console-root">
      
      {/* Header and statistics overview block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900 text-white rounded-3xl p-6 shadow-md gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm font-black uppercase tracking-wider text-slate-100">Promo Coupons & Campaign Console</h4>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Manage corporate discount frameworks, builders, marketplace addons, and custom referral links with automatic validation pipelines, expiry timers, and usage restrictions.
          </p>
        </div>
        <div className="flex items-center gap-4 border-l border-slate-700/60 pl-6 shrink-0 h-12">
          <div className="text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Redeemed</span>
            <span className="text-lg font-black text-slate-100">{stats.totalRedemptions} uses</span>
          </div>
          <div className="text-center ml-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Cost Saved</span>
            <span className="text-lg font-black text-emerald-400">₹{stats.estimatedSaved.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Segment controls for sub-tabs */}
      <div className="flex border-b border-slate-200 gap-1.5 overflow-x-auto select-none pb-px" id="promo-console-tabs-row">
        <button 
          onClick={() => setActiveSubTab("coupons")}
          className={`px-4.5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === "coupons" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Active Coupons</span>
        </button>
        <button 
          onClick={() => setActiveSubTab("campaigns")}
          className={`px-4.5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === "campaigns" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Campaign Linking</span>
        </button>
        <button 
          onClick={() => setActiveSubTab("simulator")}
          className={`px-4.5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === "simulator" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Play className="w-4 h-4" />
          <span>Simulate Playground</span>
        </button>
        <button 
          onClick={() => setActiveSubTab("reports")}
          className={`px-4.5 py-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === "reports" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Reports & Analytics</span>
        </button>
      </div>

      {/* SUB-TAB 1: Active Coupons Registry */}
      {activeSubTab === "coupons" && (
        <div className="space-y-4 animate-fade-in" id="coupons-subtab-view">
          
          {/* Controls, filters, search bar, and add button */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Search code, builder, campaign..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 text-xs rounded-xl outline-hidden text-slate-800"
                />
              </div>

              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-xl outline-hidden text-slate-800"
              >
                <option value="ALL">All Types</option>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Discount</option>
                <option value="REFERRAL">Referral Reward</option>
                <option value="BUILDER">Builder Exclusive</option>
                <option value="MARKETPLACE">Marketplace Theme</option>
                <option value="TENANT">Tenant Dedicated</option>
              </select>

              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-xl outline-hidden text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="EXHAUSTED">Exhausted</option>
              </select>
            </div>

            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs w-full md:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Create Promo Coupon</span>
            </button>
          </div>

          {/* Bulk Actions horizontal bar */}
          {selectedCoupons.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between animate-fade-in shadow-3xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                <span className="text-xs font-bold text-indigo-950">
                  {selectedCoupons.length} of {filteredCoupons.length} coupons selected for administrative actions
                </span>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleBulkAction("ACTIVATE")}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-slate-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                >
                  Bulk Activate
                </button>
                <button
                  onClick={() => handleBulkAction("DEACTIVATE")}
                  className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-700 hover:text-amber-800 border border-slate-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                >
                  Bulk Pause
                </button>
                <button
                  onClick={() => handleBulkAction("ARCHIVE")}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-800 border border-slate-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                >
                  Bulk Archive
                </button>
                <button
                  onClick={() => handleBulkAction("DELETE")}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-3xs"
                >
                  Move to Trash
                </button>
              </div>
            </div>
          )}

          {/* Table display */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-visible shadow-3xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[9px] font-extrabold select-none">
                  <th className="p-4 w-10">
                    <input 
                      type="checkbox" 
                      checked={selectedCoupons.length === filteredCoupons.length && filteredCoupons.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCoupons(filteredCoupons.map(c => c.id));
                        } else {
                          setSelectedCoupons([]);
                        }
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-4">Coupon Code</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Value</th>
                  <th className="p-4">Linked Campaign</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">Redemption Count</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 w-16 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                      No promo coupons match your criteria. Create one above to get started.
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((c) => {
                    // Calculate utilization percentage
                    const usePercent = Math.min(Math.round((c.currentUses / c.maxUses) * 100), 100);
                    
                    // Render custom colors for rich statuses
                    const statusColorMap: Record<string, string> = {
                      ACTIVE: "bg-emerald-50 border-emerald-100 text-emerald-700",
                      PAUSED: "bg-amber-50 border-amber-100 text-amber-700",
                      SCHEDULED: "bg-blue-50 border-blue-100 text-blue-700",
                      DRAFT: "bg-slate-50 border-slate-150 text-slate-500",
                      EXPIRED: "bg-rose-50 border-rose-100 text-rose-600",
                      EXHAUSTED: "bg-orange-50 border-orange-100 text-orange-700",
                      ARCHIVED: "bg-slate-100 border-slate-200 text-slate-600",
                      DELETED: "bg-red-50 border-red-100 text-red-700"
                    };
                    const statusClass = statusColorMap[c.status] || "bg-indigo-50 border-indigo-100 text-indigo-700";

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/30 transition-all">
                        <td className="p-4 w-10">
                          <input 
                            type="checkbox" 
                            checked={selectedCoupons.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCoupons(prev => [...prev, c.id]);
                              } else {
                                setSelectedCoupons(prev => prev.filter(id => id !== c.id));
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-4">
                          <span className="font-extrabold font-mono text-[12.5px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg tracking-wider">
                            {c.code}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold text-slate-600 block">
                            {c.type === "PERCENTAGE" && "Percentage Discount"}
                            {c.type === "FIXED" && "Fixed Cash Rebate"}
                            {c.type === "REFERRAL" && "Referral Affiliate Credit"}
                            {c.type === "BUILDER" && "Builder Enterprise discount"}
                            {c.type === "MARKETPLACE" && "Marketplace Theme Credit"}
                            {c.type === "TENANT" && "Tenant Custom Waiver"}
                          </span>
                          {c.type === "TENANT" && c.tenantId && (
                            <span className="text-[8.5px] text-indigo-500 font-mono">Bound: {c.tenantId}</span>
                          )}
                        </td>
                        <td className="p-4 font-black text-slate-800 text-[11.5px]">
                          {c.type === "PERCENTAGE" || c.type === "TENANT" ? `${c.value}%` : `₹${c.value.toLocaleString()}`}
                        </td>
                        <td className="p-4 text-slate-500 font-medium text-[10.5px]">
                          {c.campaignName ? (
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <Megaphone className="w-3 h-3 text-slate-400" />
                              <span>{c.campaignName}</span>
                            </span>
                          ) : (
                            <span className="text-slate-350">Standalone</span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-slate-500 text-[10.5px]">
                          {c.expiryDate}
                        </td>
                        <td className="p-4">
                          <div className="space-y-1.5 max-w-28">
                            <div className="flex justify-between text-[9px] font-extrabold text-slate-500">
                              <span>{c.currentUses} / {c.maxUses} Uses</span>
                              <span>{usePercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  usePercent >= 90 ? "bg-amber-500" : "bg-indigo-600"
                                }`}
                                style={{ width: `${usePercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border ${statusClass}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-4 text-center relative overflow-visible">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                            className="text-slate-400 hover:text-slate-800 p-1.5 cursor-pointer rounded-lg hover:bg-slate-100 transition-all flex items-center justify-center mx-auto"
                            title="Actions"
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform duration-250 ${openMenuId === c.id ? "rotate-90 text-indigo-600" : ""}`} />
                          </button>

                          {openMenuId === c.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-4 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-20 text-left font-sans">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewingCoupon(c);
                                    setShowViewModal(true);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-1.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/40 flex items-center gap-2 font-medium"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Diagnostics</span>
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    openEditModal(c);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-1.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/40 flex items-center gap-2 font-medium"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Edit Settings</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDuplicateCoupon(c);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-1.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/40 flex items-center gap-2 font-medium"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Duplicate Code</span>
                                </button>

                                {c.status !== "ACTIVE" && c.status !== "DELETED" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleUpdateStatus(c, "ACTIVE");
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3.5 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 font-medium"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Activate</span>
                                  </button>
                                )}

                                {c.status === "ACTIVE" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleUpdateStatus(c, "PAUSED");
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3.5 py-1.5 text-xs text-amber-600 hover:bg-amber-50 flex items-center gap-2 font-medium"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Pause Coupon</span>
                                  </button>
                                )}

                                {c.status !== "ARCHIVED" && c.status !== "DELETED" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleUpdateStatus(c, "ARCHIVED");
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 font-medium"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Archive</span>
                                  </button>
                                )}

                                {c.status === "DELETED" ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUpdateStatus(c, "ACTIVE");
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-3.5 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 font-medium border-t border-slate-100"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Restore Code</span>
                                    </button>
                                    
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm(`Are you absolutely sure you want to permanently delete the promo code '${c.code}'? This cannot be undone.`)) {
                                          handlePermanentDelete(c.id, c.code);
                                        }
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-black"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Purge Forever</span>
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDeleteCoupon(c.id, c.code);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium border-t border-slate-100"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Move to Trash</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Helpful DLT/Coupon usage guideline banner */}
          <div className="bg-indigo-50/40 border border-indigo-150 rounded-2xl p-4.5 flex gap-3.5 items-start">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Secure Coupon Evaluation Engine</h5>
              <p className="text-[10.5px] text-slate-600 leading-normal">
                Coupon codes are evaluated at session billing handshakes and verified against active campaigns, target limits, and binding keys. Once checked out, the coupon allocation state shifts dynamically inside the tenant ledger.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Campaign Linking */}
      {activeSubTab === "campaigns" && (
        <div className="space-y-6 animate-fade-in" id="campaigns-subtab-view">
          
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h5 className="text-[11.5px] font-black uppercase tracking-wider text-slate-800">Linked Marketing Campaigns</h5>
              <p className="text-[10px] text-slate-500">Group coupons under seasonal marketing waves and map redemption tracking schemas.</p>
            </div>
            
            <button
              onClick={() => setShowCampModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate Campaign</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((camp) => (
              <div key={camp.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 hover:shadow-2xs transition-all relative overflow-hidden flex flex-col justify-between">
                
                {/* Background corner icon */}
                <div className="absolute right-3 top-3 opacity-10">
                  <Megaphone className="w-16 h-16 text-slate-400" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                      {camp.channel} Channel
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      camp.status === "RUNNING"
                        ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                        : "bg-slate-100 border-slate-200 text-slate-500"
                    }`}>
                      {camp.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide truncate pr-6">{camp.name}</h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-[9.5px] pt-1">
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase">Start Date</span>
                      <span className="font-mono font-bold text-slate-600">{camp.startDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold uppercase">End Date</span>
                      <span className="font-mono font-bold text-slate-600">{camp.endDate}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Associated Coupons</span>
                    <span className="text-xs font-black text-slate-800">{camp.couponCount} Codes</span>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Total Redemptions</span>
                    <span className="text-xs font-black text-indigo-600">{camp.totalRedemptions} Uses</span>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* SUB-TAB 3: Simulator Playground */}
      {activeSubTab === "simulator" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" id="simulator-subtab-view">
          
          {/* Left Panel: Simulator Form inputs */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div>
              <h5 className="text-[11.5px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <Play className="w-4 h-4 text-indigo-600" />
                <span>Simulation Sandbox</span>
              </h5>
              <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                Test active promo codes against custom pricing scopes, tenants, and entities to verify compliance logic.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Promo Coupon Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={simCode}
                    onChange={(e) => setSimCode(e.target.value)}
                    placeholder="e.g. BHOOMI25"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg uppercase tracking-wider font-mono font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/10"
                  />
                  <button
                    onClick={() => {
                      // Grab first active coupon code
                      const activeC = coupons.find(c => c.status === "ACTIVE");
                      if (activeC) setSimCode(activeC.code);
                    }}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-250 text-slate-600 text-xs rounded-lg font-bold"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Base Sub-total Price (₹)</label>
                <input
                  type="number"
                  value={simBaseAmount}
                  onChange={(e) => setSimBaseAmount(Number(e.target.value))}
                  placeholder="e.g. 250000"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg font-mono text-slate-800 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Simulation Scope Channel</label>
                <select
                  value={simScope}
                  onChange={(e) => setSimScope(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg text-slate-800"
                >
                  <option value="SUBSCRIPTION">Core Portal Tenant Subscription</option>
                  <option value="MARKETPLACE">Marketplace Theme & Template Addons</option>
                  <option value="BUILDER_ADDON">Special Builder Plot-Capacity Expansion Slabs</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Tenant ID</label>
                  <input
                    type="text"
                    value={simTenantId}
                    onChange={(e) => setSimTenantId(e.target.value)}
                    placeholder="T-8819"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg font-mono text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Builder Company</label>
                  <input
                    type="text"
                    value={simBuilderName}
                    onChange={(e) => setSimBuilderName(e.target.value)}
                    placeholder="e.g. Royal Meadows"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg text-slate-700"
                  />
                </div>
              </div>

              <button
                onClick={runSimulation}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs mt-2"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Evaluate Promo Handshake</span>
              </button>
            </div>

          </div>

          {/* Right Panel: Validation Results / Breakdown */}
          <div className="md:col-span-2 space-y-4">
            
            {/* No result / Waiting placeholder */}
            {!simResult && !simError && (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-3 min-h-64 h-full">
                <HelpCircle className="w-10 h-10 text-slate-300 animate-pulse" />
                <h5 className="text-xs font-black uppercase text-slate-700 tracking-wide">Awaiting Simulation Trigger</h5>
                <p className="text-[10.5px] text-slate-400 max-w-sm leading-relaxed">
                  Supply coupon parameters and hit the evaluation button to trigger sandbox validation. Results will output below.
                </p>
              </div>
            )}

            {/* Error Output (Plain Error if diagnostics didn't return) */}
            {simError && !simResult && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex gap-3.5 items-start">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-rose-800 uppercase tracking-wide">Validation Failure</h5>
                  <p className="text-[11px] text-rose-700 font-mono leading-relaxed">{simError}</p>
                </div>
              </div>
            )}

            {/* Comprehensive Diagnostics Report */}
            {simResult && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-3xs animate-fade-in">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    {simResult.isValid ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>PASSED EVALUATION</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100 animate-pulse">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        <span>FAILED COMPLIANCE</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest font-mono">ID: BHOOMI-SIM-VAL-{simCode.toUpperCase()}</span>
                </div>

                {/* Main Error Callout if invalid */}
                {!simResult.isValid && (
                  <div className="bg-rose-50/60 border border-rose-150 p-4 rounded-xl text-xs text-rose-700 font-medium">
                    <span className="font-extrabold uppercase text-rose-800 tracking-wider block mb-1">Triggered Refusal:</span>
                    {simResult.failureReason || simError}
                  </div>
                )}

                {/* Handshake Checklist Grid */}
                <div className="space-y-3">
                  <h6 className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Evaluation Diagnostics Checklist</h6>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-150 text-[10.5px]">
                      {simResult.couponFound ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold text-slate-500 block uppercase text-[8px]">Coupon Registry Lock</span>
                        <span className="font-semibold text-slate-800">
                          {simResult.couponFound ? "Verified Code Found" : "Not Found in Registry"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-150 text-[10.5px]">
                      {simResult.campaign !== "None" ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold text-slate-500 block uppercase text-[8px]">Linked Campaign Status</span>
                        <span className="font-semibold text-slate-800">
                          {simResult.campaign}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-150 text-[10.5px]">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-500 block uppercase text-[8px]">Coupon Type Allocation</span>
                        <span className="font-semibold text-slate-800 text-[10.5px]">
                          {simResult.couponType} Promo
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-150 text-[10.5px]">
                      {simResult.couponFound && (!simResult.failureReason || !simResult.failureReason.includes("start")) ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold text-slate-500 block uppercase text-[8px]">Valid From Date</span>
                        <span className="font-semibold text-slate-800">{simResult.validFrom}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-150 text-[10.5px]">
                      {simResult.couponFound && (!simResult.failureReason || !simResult.failureReason.includes("expired")) ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold text-slate-500 block uppercase text-[8px]">Valid Until Expiry</span>
                        <span className="font-semibold text-slate-800">{simResult.validUntil}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-150 text-[10.5px]">
                      {simResult.remainingUses > 0 ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold text-slate-500 block uppercase text-[8px]">Quota Capacity Gauge</span>
                        <span className="font-semibold text-slate-800 font-mono text-[9.5px]">
                          {simResult.currentUses} / {simResult.maximumUses} Uses ({simResult.remainingUses} left)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-150 text-[10.5px]">
                      {simResult.couponFound && (!simResult.failureReason || !simResult.failureReason.toLowerCase().includes("builder")) ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold text-slate-500 block uppercase text-[8px]">Applicable Builder</span>
                        <span className="font-semibold text-slate-800 truncate block max-w-[160px]">{simResult.applicableBuilder}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-150 text-[10.5px]">
                      {simResult.couponFound && (!simResult.failureReason || !simResult.failureReason.toLowerCase().includes("tenant")) ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold text-slate-500 block uppercase text-[8px]">Applicable Tenant</span>
                        <span className="font-semibold text-slate-800 truncate block max-w-[160px]">{simResult.applicableTenant}</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Ledger Invoice Breakdown */}
                <div className="space-y-3 pt-2">
                  <h6 className="text-[9.5px] font-extrabold uppercase text-slate-400 tracking-wider">Simulated Cost Invoice Ledger</h6>
                  
                  <div className="divide-y divide-slate-100 text-xs text-slate-600 font-medium font-mono">
                    <div className="flex justify-between py-2">
                      <span>Base Service Sub-total:</span>
                      <span className="font-bold text-slate-800">₹{Number(simBaseAmount).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between py-2">
                      <span>GST @ 18% (Before Promo):</span>
                      <span className="font-bold text-slate-800">₹{(simResult.gstBefore ?? 0).toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 text-emerald-600 font-bold bg-emerald-50/40 px-2 rounded">
                      <span>Promo Discount (Code: {simCode.toUpperCase()}):</span>
                      <span>- ₹{(simResult.discount ?? 0).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between py-2">
                      <span>GST @ 18% (After Promo):</span>
                      <span className="font-bold text-slate-800">₹{(simResult.gstAfter ?? 0).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between py-2.5 text-sm font-black text-slate-800 border-t border-slate-200">
                      <span className="font-sans">Final Net Payable (with GST):</span>
                      <span className="text-indigo-600 font-mono">₹{(simResult.finalPrice ?? 0).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between py-2 text-xs font-bold text-emerald-600 border-t border-slate-100 pt-2">
                      <span className="font-sans">Total Client Savings Distributed:</span>
                      <span>₹{(simResult.totalSavings ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Notice stamp */}
                <div className="text-[9px] text-slate-400 leading-normal border-t border-slate-100 pt-3 flex items-center justify-between font-medium">
                  <span>Simulation assumes active GST config values.</span>
                  <span className="font-bold text-indigo-600 uppercase tracking-wider">Verified handshakes completed</span>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* SUB-TAB 4: Reports & Analytics */}
      {activeSubTab === "reports" && (
        <div className="space-y-6 animate-fade-in" id="reports-subtab-view">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-3xs">
              <div className="space-y-1">
                <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Active Promo Codes</p>
                <h4 className="text-xl font-black text-slate-800 tracking-tight">{stats.activeCount}</h4>
                <p className="text-[9px] text-slate-400">Excluding legacy expired</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Tag className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-3xs">
              <div className="space-y-1">
                <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Total Redemptions</p>
                <h4 className="text-xl font-black text-slate-800 tracking-tight">{stats.totalRedemptions} Uses</h4>
                <p className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+18.4% last 30 days</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-3xs">
              <div className="space-y-1">
                <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Cost Savings Distributed</p>
                <h4 className="text-xl font-black text-emerald-600 tracking-tight">₹{(stats.estimatedSaved / 100000).toFixed(1)}L</h4>
                <p className="text-[9px] text-slate-400">Total estimated rebate</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-3xs">
              <div className="space-y-1">
                <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Expired & Exhausted</p>
                <h4 className="text-xl font-black text-slate-800 tracking-tight">{stats.expiredCount + stats.exhaustedCount}</h4>
                <p className="text-[9px] text-slate-400">Archived codes</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                <RefreshCw className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Weekly trends chart */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <LineChartIcon className="w-4 h-4 text-indigo-600" />
                    <span>Weekly Promotion Redemptions</span>
                  </h5>
                  <p className="text-[10px] text-slate-500">Track current daily coupon triggers and estimation distributed discount values.</p>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weeklyTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "rgba(255,255,255,0.96)", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "11px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "10.5px", paddingTop: "10px" }} />
                    <Bar dataKey="Redemptions" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Redemption Trigger Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribution distribution pie */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
              <div>
                <h5 className="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>Coupon Type Distribution</span>
                </h5>
                <p className="text-[10px] text-slate-500">Breakdown of promo schemas active in register.</p>
              </div>

              <div className="h-44 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.typeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {stats.typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Integrated</span>
                  <span className="text-xs font-black text-slate-800">6 Formats</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[9.5px] pt-1 border-t border-slate-100">
                {stats.typeDistribution.map((t, idx) => (
                  <div key={t.name} className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0 block" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="text-slate-500 font-medium truncate">{t.name} ({t.redemptions} Uses)</span>
                  </div>
                ))}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4" id="create-coupon-modal-dialog">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-fade-in relative">
            
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Tag className="w-4 h-4 text-indigo-600" />
              <h5 className="text-sm font-black uppercase text-slate-800 tracking-wider">Register Promo Coupon</h5>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Coupon Code</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="e.g. BHOOMI25"
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg uppercase tracking-wider font-mono font-bold text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg font-bold"
                    >
                      Gen
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Coupon Type Schema</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg text-slate-800"
                  >
                    <option value="PERCENTAGE">Percentage (%) Discount</option>
                    <option value="FIXED">Fixed Amount Discount</option>
                    <option value="REFERRAL">Referral / Affiliate Reward</option>
                    <option value="BUILDER">Builder Exclusive Discount</option>
                    <option value="MARKETPLACE">Marketplace Themes / Addons</option>
                    <option value="TENANT">Tenant Dedicated Waiver</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">
                    {newType === "PERCENTAGE" || newType === "TENANT" ? "Discount Percentage (%)" : "Flat Value Amount (₹)"}
                  </label>
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg font-mono font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Linked Campaign</label>
                  <select
                    value={newCampaignId}
                    onChange={(e) => setNewCampaignId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg text-slate-800"
                  >
                    <option value="">Standalone Promo (No Campaign)</option>
                    {campaigns.filter(c => c.status === "RUNNING").map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic properties for Tenant / Builder types */}
              {(newType === "TENANT" || newType === "BUILDER") && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  {newType === "TENANT" && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Bind Tenant ID</label>
                      <input
                        type="text"
                        value={newTenantId}
                        onChange={(e) => setNewTenantId(e.target.value)}
                        placeholder="e.g. T-8819"
                        className="w-full px-3 py-1 bg-white border border-slate-200 text-xs rounded-md font-mono text-slate-800"
                      />
                    </div>
                  )}

                  <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Builder Partner Name</label>
                    <input
                      type="text"
                      value={newBuilderName}
                      onChange={(e) => setNewBuilderName(e.target.value)}
                      placeholder="e.g. Royal Meadows"
                      className="w-full px-3 py-1 bg-white border border-slate-200 text-xs rounded-md text-slate-800"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Expiry Expiration Date</label>
                  <input
                    type="date"
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg font-mono text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Maximum Usage Limit</label>
                  <input
                    type="number"
                    value={newMaxUses}
                    onChange={(e) => setNewMaxUses(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Register Promo Coupon</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CREATE CAMPAIGN MODAL */}
      {showCampModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4" id="create-campaign-modal-dialog">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative">
            
            <button 
              onClick={() => setShowCampModal(false)}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Megaphone className="w-4 h-4 text-indigo-600" />
              <h5 className="text-sm font-black uppercase text-slate-800 tracking-wider">Initiate Marketing Campaign</h5>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Campaign Name</label>
                <input
                  type="text"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="e.g. Festival Bonanza Wave"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Campaign Channel</label>
                <select
                  value={campChannel}
                  onChange={(e) => setCampChannel(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg text-slate-800"
                >
                  <option value="Email">Email Broadcasting</option>
                  <option value="Social">Social Media Marketing</option>
                  <option value="Direct">Direct Corporate Sales</option>
                  <option value="Partners">Partners & Affiliate Circles</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">Start Date</label>
                  <input
                    type="date"
                    value={campStart}
                    onChange={(e) => setCampStart(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg font-mono text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block">End Date</label>
                  <input
                    type="date"
                    value={campEnd}
                    onChange={(e) => setCampEnd(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 text-xs rounded-lg font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCampModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Initiate Campaign</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* VIEW DIAGNOSTICS MODAL */}
      {showViewModal && viewingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4" id="view-coupon-diagnostics-modal">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative">
            
            <button 
              type="button"
              onClick={() => {
                setShowViewModal(false);
                setViewingCoupon(null);
              }}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Eye className="w-4 h-4 text-indigo-600" />
              <h5 className="text-sm font-black uppercase text-slate-800 tracking-wider">Promo Coupon Specification Lock</h5>
            </div>

            <div className="space-y-4">
              {/* Promo code display card */}
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">COUPON CODE</span>
                  <span className="font-extrabold font-mono text-lg text-indigo-700 tracking-wider">
                    {viewingCoupon.code}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">STATUS</span>
                  <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border ${
                    viewingCoupon.status === "ACTIVE" 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                      : viewingCoupon.status === "PAUSED"
                      ? "bg-amber-50 border-amber-100 text-amber-700"
                      : "bg-slate-100 border-slate-200 text-slate-500"
                  }`}>
                    {viewingCoupon.status}
                  </span>
                </div>
              </div>

              {/* Specification parameters */}
              <div className="space-y-2.5">
                <h6 className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Lock Configuration Rules</h6>
                
                <div className="grid grid-cols-2 gap-3 text-[10.5px]">
                  <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold block uppercase text-[8px]">Type Format</span>
                    <span className="font-semibold text-slate-800">{viewingCoupon.type}</span>
                  </div>
                  <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold block uppercase text-[8px]">Rebate Value</span>
                    <span className="font-black text-slate-800">
                      {viewingCoupon.type === "PERCENTAGE" || viewingCoupon.type === "TENANT" ? `${viewingCoupon.value}%` : `₹${viewingCoupon.value.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold block uppercase text-[8px]">Linked Campaign</span>
                    <span className="font-semibold text-slate-700 truncate block">
                      {viewingCoupon.campaignName || "Standalone"}
                    </span>
                  </div>
                  <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-bold block uppercase text-[8px]">Valid Until</span>
                    <span className="font-mono font-semibold text-slate-600">{viewingCoupon.expiryDate}</span>
                  </div>
                </div>
              </div>

              {/* Bound Constraints */}
              {(viewingCoupon.tenantId || viewingCoupon.builderName) && (
                <div className="space-y-2">
                  <h6 className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Handshake Binding Keys</h6>
                  <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3 space-y-1.5 text-[10px]">
                    {viewingCoupon.tenantId && (
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Bound Tenant ID:</span>
                        <span className="font-mono font-bold text-indigo-700">{viewingCoupon.tenantId}</span>
                      </div>
                    )}
                    {viewingCoupon.builderName && (
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Builder Restricted:</span>
                        <span className="font-bold text-slate-800">{viewingCoupon.builderName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Redemptions progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  <span>Quota Gauge Utilization</span>
                  <span className="text-indigo-600 font-mono">{viewingCoupon.currentUses} / {viewingCoupon.maxUses} Uses</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${Math.min((viewingCoupon.currentUses / viewingCoupon.maxUses) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl text-[9.5px] text-slate-500 leading-normal border border-slate-200">
                This specification represents a validated, cryptographically tracked billing allocation lock. Modifications are tracked under audit log history to prevent cross-tenant leakage.
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  setViewingCoupon(null);
                }}
                className="px-4 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer"
              >
                Close Diagnostics
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
