import React from "react";
import { 
  TrendingUp, Users, Shield, Server, CreditCard, Activity, IndianRupee, Cloud, BarChart, ArrowUpRight 
} from "lucide-react";
import { TenantSubscription, SubscriptionPlan, AddonCatalogItem } from "./SaasTypes.ts";
import { formatCurrency } from "../../lib/currency.ts";

interface MrrDashboardTabProps {
  tenants: any[];
  subscriptions: TenantSubscription[];
  plans: SubscriptionPlan[];
  addons: AddonCatalogItem[];
}

export default function MrrDashboardTab({
  tenants,
  subscriptions,
  plans,
  addons
}: MrrDashboardTabProps) {
  
  // Calculate aggregate metrics dynamically from live arrays
  const totalClustersCount = tenants.length;
  
  // Calculate status counts directly from current tenant subscriptions
  const activeCount = subscriptions.filter(s => s.status === "ACTIVE").length;
  const trialCount = subscriptions.filter(s => s.status === "TRIAL").length;
  const expiredCount = subscriptions.filter(s => s.status === "EXPIRED").length;
  const suspendedCount = subscriptions.filter(s => s.status === "SUSPENDED" || s.status === "ARCHIVED").length;

  // Calculate MRR/ARR contribution
  let subscriptionMRR = 0;
  let addonsMRR = 0;

  subscriptions.forEach(sub => {
    // Basic plan contribution
    const plan = plans.find(p => p.code === sub.currentPlanCode);
    if (plan && (sub.status === "ACTIVE" || sub.status === "TRIAL")) {
      subscriptionMRR += plan.monthlyPrice;
    }
    // Addon contribution
    if (sub.addOnCodes && Array.isArray(sub.addOnCodes)) {
      sub.addOnCodes.forEach(addonCode => {
        const addon = addons.find(a => a.code === addonCode);
        if (addon && (sub.status === "ACTIVE" || sub.status === "TRIAL")) {
          addonsMRR += addon.monthlyPrice;
        }
      });
    }
  });

  const totalMRR = subscriptionMRR + addonsMRR;
  const estimatedARR = totalMRR * 12;

  // Calculate Revenue by Plan
  const revenueByPlan = plans.map(p => {
    const activeSubsInPlan = subscriptions.filter(s => s.currentPlanCode === p.code && (s.status === "ACTIVE" || s.status === "TRIAL"));
    const count = activeSubsInPlan.length;
    const revenue = count * p.monthlyPrice;
    const percentage = totalMRR > 0 ? Math.round((revenue / totalMRR) * 100) : 0;
    return {
      ...p,
      count,
      revenue,
      percentage
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Storage calculation helpers
  const totalAssignedStorageGb = subscriptions.reduce((sum, s) => {
    return sum + (s.limitOverrides?.storageLimitGb || 10);
  }, 0);

  // Tenant Status Distribution helper
  const statuses = [
    { name: "Active Licenses", count: activeCount, color: "bg-emerald-500", textColor: "text-emerald-700" },
    { name: "Trial Periods", count: trialCount, color: "bg-indigo-500", textColor: "text-indigo-700" },
    { name: "Suspended / Archived", count: suspendedCount, color: "bg-amber-500", textColor: "text-amber-700" },
    { name: "Expired / Cancelled", count: expiredCount, color: "bg-slate-400", textColor: "text-slate-500" }
  ];

  return (
    <div className="space-y-6" id="mrr-dashboard-tab">
      
      {/* Top 4 high fidelity cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: MRR */}
        <div className="bg-slate-900 border border-slate-950 p-5 rounded-2xl text-white space-y-2 relative overflow-hidden shadow-sm" id="card-mrr">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Platform MRR (INR)</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-extrabold text-slate-50 font-mono tracking-tight">
              {formatCurrency(totalMRR)}/mo
            </h3>
            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Dynamic live license and addon ledger
            </p>
          </div>
          <div className="text-[10px] text-slate-500 font-mono pt-3 border-t border-slate-800">
            License MRR: {formatCurrency(subscriptionMRR)} • Addon MRR: {formatCurrency(addonsMRR)}
          </div>
        </div>

        {/* Card 2: ARR */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs" id="card-arr">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Projected ARR Contribution</span>
            <TrendingUp className="w-4 h-4 text-indigo-650" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {formatCurrency(estimatedARR)}/yr
            </h3>
            <p className="text-[11px] text-slate-500 leading-none">Estimated annual gateway contract values.</p>
          </div>
          <div className="text-[10px] text-slate-400 pt-3 border-t border-slate-100">
            Current subscription multiplier: 12.0x ARR/MRR ratio.
          </div>
        </div>

        {/* Card 3: Active Tenants */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs" id="card-tenants">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tenant Clusters</span>
            <Users className="w-4 h-4 text-indigo-650" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {activeCount} <span className="text-xs font-bold text-slate-400">/ {totalClustersCount} Active</span>
            </h3>
            <div className="flex gap-2 text-[10px] font-bold font-sans">
              <span className="text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded">TRIAL: {trialCount}</span>
              <span className="text-amber-650 bg-amber-50 px-1.5 py-0.5 rounded">SUSP: {suspendedCount}</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 pt-3 border-t border-slate-100">
            Total provisioned tenant subdomains: {totalClustersCount} accounts.
          </div>
        </div>

        {/* Card 4: Global Storage */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs" id="card-storage">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Global Cloud Storage</span>
            <Cloud className="w-4 h-4 text-indigo-650" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-400 tracking-tight h-8 flex items-center">
              Not configured
            </h3>
            <p className="text-[10px] text-slate-450 leading-none">Aggregate telemetry storage monitor</p>
          </div>
          <div className="text-[10px] text-slate-400 pt-3 border-t border-slate-100 flex justify-between">
            <span>Limit Assigned: {totalAssignedStorageGb} GB</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue by Plan Distribution Block */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4 lg:col-span-2" id="block-revenue-plan">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase">Revenue & Plan Contribution</h3>
            <p className="text-[11px] text-slate-500">Monthly revenue breakdown and percentage contribution of active price tiers.</p>
          </div>

          <div className="space-y-4">
            {revenueByPlan.map(item => (
              <div key={item.code} className="space-y-1">
                <div className="flex justify-between text-xs font-sans">
                  <span className="font-bold text-slate-800">
                    {item.name} ({item.code}) • <span className="text-slate-450 font-normal">{formatCurrency(item.monthlyPrice)}/mo</span>
                  </span>
                  <span className="font-mono text-slate-600 font-bold">
                    {item.count} active ({formatCurrency(item.revenue)}/mo • {item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100 flex">
                  <div 
                    className="bg-indigo-600 h-3 transition-all duration-500" 
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tenant Status Distribution Panel */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4" id="block-status-distribution">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase">Tenant Status Distribution</h3>
            <p className="text-[11px] text-slate-500">Live operational distribution of all workspace deployments.</p>
          </div>

          <div className="space-y-3.5 pt-1">
            {statuses.map((st, idx) => {
              const percentage = totalClustersCount > 0 ? Math.round((st.count / totalClustersCount) * 100) : 0;
              return (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${st.color}`} />
                    <span className="font-semibold text-slate-800">{st.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-600 font-bold">{st.count}</span>
                    <span className="text-slate-400 text-[10px]">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-450 text-center leading-relaxed font-sans">
            Operational status vectors synchronize automatically upon subscription lifecycle state transitions.
          </div>
        </div>

      </div>

    </div>
  );
}
