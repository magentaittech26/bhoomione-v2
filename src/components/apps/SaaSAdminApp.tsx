import React, { useState, useEffect } from "react";
import api from "../../lib/api.ts";
import AdminLogin from "../AdminLogin.tsx";
import { UserProfile } from "../../types/auth.ts";
import { 
  ShieldAlert, Database, Users, Activity, TrendingUp, Server, Plus, Check, RefreshCw, Globe, Settings, CreditCard, Layers, LogOut, Sliders, Terminal, Clock, AlertTriangle, ToggleLeft, ToggleRight, Trash2, Edit3, Shield, Box, Zap, DollarSign, Calendar, SlidersHorizontal, Info, Play, CheckCircle, X, LayoutDashboard, Tag, Star, Percent
} from "lucide-react";

// Modular Import
import { 
  SaasModule, SaasFeature, SubscriptionPlan, PlanLimits, PlotBillingSlab, AddonCatalogItem, TenantSubscription 
} from "../saas/SaasTypes.ts";
import TenantLifecycleDrawer from "../saas/TenantLifecycleDrawer.tsx";
import ModuleRegistryTab from "../saas/ModuleRegistryTab.tsx";
import PlanFeatureMatrixTab from "../saas/PlanFeatureMatrixTab.tsx";
import AddonsBillingTab from "../saas/AddonsBillingTab.tsx";
import MrrDashboardTab from "../saas/MrrDashboardTab.tsx";
import TenantManagementTab from "../saas/TenantManagementTab";
import TenantOverridesTab from "../saas/TenantOverridesTab.tsx";
import { SaasSettingsTab } from "../saas/SaasSettingsTab.tsx";
import AuditLogsTab from "../saas/AuditLogsTab.tsx";
import InvoiceConsole from "../saas/InvoiceConsole.tsx";
import { CoreMastersConsole } from "../saas/CoreMastersConsole.tsx";

export default function SaaSAdminApp() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Re-organized final navigation hierarchy
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "tenants"
    | "subscription-center"
    | "module-registry"
    | "tenant-overrides"
    | "audit-logs"
    | "settings"
    | "mrr-dashboard"
    | "tenant-registry"
    | "plan-master"
    | "addons"
    | "tenant-licenses"
    | "usage"
    | "billing"
    | "invoices"
    | "coupons"
    | "promotions"
    | "audit"
    | "feature-catalog"
    | "core-masters"
  >("mrr-dashboard");

  // Inner sub-views states to avoid horizontal cluttering
  const [activeSubscriptionSub, setActiveSubscriptionSub] = useState<"plans" | "matrix" | "limits" | "slabs" | "addons">("plans");
  const [activeModuleRegistrySub, setActiveModuleRegistrySub] = useState<"modules" | "features">("modules");

  // Dedicated states for the powerful Tenant Overrides view
  const [selectedOverrideTenantCode, setSelectedOverrideTenantCode] = useState<string>("");
  const [editFeatureOverrides, setEditFeatureOverrides] = useState<Record<string, "ENABLED" | "DISABLED" | "DEFAULT">>({});
  const [editLimitOverrides, setEditLimitOverrides] = useState<Partial<PlanLimits>>({});
  const [editAddonCodes, setEditAddonCodes] = useState<string[]>([]);
  const [isSavingOverrides, setIsSavingOverrides] = useState(false);
  const [overrideFormSuccess, setOverrideFormSuccess] = useState<string | null>(null);
  
  const [tenants, setTenants] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [loadingTenants, setLoadingTenants] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [tenantsError, setTenantsError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false); // for modal form submit
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const [showAddTenant, setShowAddTenant] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: "", code: "", plan: "GROWTH" });

  // Selected tenant for sidebar/drawer subscription customizing
  const [selectedTenantSub, setSelectedTenantSub] = useState<any | null>(null);

  // ==========================================
  // PHASE 1E - PERSISTENT STATE ENGINE (API-driven)
  // ==========================================
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // Local notification toast state (specifically designed to avoid unpermitted global window actions)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Module Registry
  const [modules, setModules] = useState<SaasModule[]>([]);

  // Feature Catalog
  const [features, setFeatures] = useState<SaasFeature[]>([]);

  // Subscription Plans
  const [plans, setPlans] = useState<SubscriptionPlan[]>([
    { name: "Starter Package", code: "STARTER", monthlyPrice: 15000, yearlyPrice: 150000, trialDays: 14, status: "ACTIVE", sortOrder: 1 },
    { name: "Growth Engine", code: "GROWTH", monthlyPrice: 25000, yearlyPrice: 250000, trialDays: 14, status: "ACTIVE", sortOrder: 2 },
    { name: "Professional Plus", code: "PROFESSIONAL", monthlyPrice: 50000, yearlyPrice: 500000, trialDays: 30, status: "ACTIVE", sortOrder: 3 },
    { name: "Enterprise Custom", code: "ENTERPRISE", monthlyPrice: 100000, yearlyPrice: 1000000, trialDays: 30, status: "ACTIVE", sortOrder: 4 }
  ]);

  // Plan general Baseline Limits
  const [planLimits, setPlanLimits] = useState<Record<string, PlanLimits>>({
    STARTER: { projectsLimit: 3, layoutsLimit: 5, plotsLimit: 150, customersLimit: 300, usersLimit: 5, agentsLimit: 2, storageLimitGb: 10, documentsLimit: 50, dxfFilesLimit: 1, marketplaceListingsLimit: 2, apiCallsLimit: 1000, whatsAppMessagesLimit: 100, aiCreditsLimit: 50 },
    GROWTH: { projectsLimit: 10, layoutsLimit: 20, plotsLimit: 500, customersLimit: 1000, usersLimit: 15, agentsLimit: 5, storageLimitGb: 25, documentsLimit: 250, dxfFilesLimit: 5, marketplaceListingsLimit: 10, apiCallsLimit: 5000, whatsAppMessagesLimit: 500, aiCreditsLimit: 150 },
    PROFESSIONAL: { projectsLimit: 30, layoutsLimit: 60, plotsLimit: 2000, customersLimit: 5000, usersLimit: 50, agentsLimit: 20, storageLimitGb: 100, documentsLimit: 1000, dxfFilesLimit: 20, marketplaceListingsLimit: 50, apiCallsLimit: 25000, whatsAppMessagesLimit: 2000, aiCreditsLimit: 500 },
    ENTERPRISE: { projectsLimit: 100, layoutsLimit: 200, plotsLimit: 10000, customersLimit: 20000, usersLimit: 200, agentsLimit: 100, storageLimitGb: 500, documentsLimit: 5000, dxfFilesLimit: 100, marketplaceListingsLimit: 200, apiCallsLimit: 100000, whatsAppMessagesLimit: 10000, aiCreditsLimit: 2000 }
  });

  // Plot Slabs
  const [slabs, setSlabs] = useState<PlotBillingSlab[]>([
    { id: "slab_1", minPlots: 1, maxPlots: 50, monthlyPrice: 1500, yearlyPrice: 15000, status: "ACTIVE" },
    { id: "slab_2", minPlots: 51, maxPlots: 200, monthlyPrice: 4000, yearlyPrice: 40000, status: "ACTIVE" },
    { id: "slab_3", minPlots: 201, maxPlots: 500, monthlyPrice: 7500, yearlyPrice: 75000, status: "ACTIVE" },
    { id: "slab_4", minPlots: 501, maxPlots: 99999, monthlyPrice: 15000, yearlyPrice: 150000, status: "ACTIVE" }
  ]);

  // Add-ons
  const [addons, setAddons] = useState<AddonCatalogItem[]>([
    { name: "Interactive Township Map", code: "INTERACTIVE_MAP_ADDON", monthlyPrice: 4500, yearlyPrice: 45000, status: "ACTIVE", description: "Enables customers to pick and book township plot positions on customized canvas overlays." },
    { name: "Heavy DXF Upload Parser", code: "DXF_ENGINE_ADDON", monthlyPrice: 3500, yearlyPrice: 35000, status: "ACTIVE", description: "Batch load AutoCAD .dxf configurations dynamically straight to individual tables." },
    { name: "WhatsApp checkout triggers", code: "WHATSAPP_ADDON", monthlyPrice: 1500, yearlyPrice: 15000, status: "ACTIVE", description: "Configure custom template alerts notifying buyers about broker updates." },
    { name: "Custom Domain Mapping SSL", code: "CUSTOM_DOMAIN_ADDON", monthlyPrice: 1000, yearlyPrice: 10000, status: "ACTIVE", description: "Proxy workspace containers onto localized web addresses securely." }
  ]);

  // Plan Feature Matrix Cells
  const [matrix, setMatrix] = useState<Record<string, Record<string, "ENABLED" | "DISABLED" | "ADDON" | "ENTERPRISE">>>({
    STARTER: { PROJECTS: "ENABLED", LAYOUTS: "ENABLED", PLOTS: "ENABLED", CUSTOMERS: "ENABLED", AGENTS: "DISABLED", DXF_UPLOAD: "ADDON", MAP_INTERACTION: "DISABLED", WHATSAPP_TRIGGERS: "DISABLED", API_ACCESS: "DISABLED" },
    GROWTH: { PROJECTS: "ENABLED", LAYOUTS: "ENABLED", PLOTS: "ENABLED", CUSTOMERS: "ENABLED", AGENTS: "ENABLED", DXF_UPLOAD: "ENABLED", MAP_INTERACTION: "ADDON", WHATSAPP_TRIGGERS: "ADDON", API_ACCESS: "DISABLED" },
    PROFESSIONAL: { PROJECTS: "ENABLED", LAYOUTS: "ENABLED", PLOTS: "ENABLED", CUSTOMERS: "ENABLED", AGENTS: "ENABLED", DXF_UPLOAD: "ENABLED", MAP_INTERACTION: "ENABLED", WHATSAPP_TRIGGERS: "ENABLED", API_ACCESS: "ENABLED" },
    ENTERPRISE: { PROJECTS: "ENABLED", LAYOUTS: "ENABLED", PLOTS: "ENABLED", CUSTOMERS: "ENABLED", AGENTS: "ENABLED", DXF_UPLOAD: "ENABLED", MAP_INTERACTION: "ENABLED", WHATSAPP_TRIGGERS: "ENABLED", API_ACCESS: "ENABLED" }
  });

  // Tenant Custom Subscriptions (bridges baseline plans & dynamic overrides catalog)
  const [tenantSubscriptions, setTenantSubscriptions] = useState<Record<string, TenantSubscription>>({});

  // Dynamic config loader pointing to standard Relational Postgres endpoints
  const loadSaasConfig = async (currentTenantsList?: any[]) => {
    setLoadingConfig(true);
    setConfigError(null);
    try {
      const targetTenants = currentTenantsList || tenants;

      const [modulesData, featuresData, plansData, addonsData, slabsData] = await Promise.all([
        api.fetchSaasModules(),
        api.fetchSaasFeatures().catch(() => []),
        api.fetchSaasPlans(),
        api.fetchSaasAddons(),
        api.fetchSaasSlabs()
      ]);

      if (modulesData) {
        const normalized = modulesData.map((m: any) => ({
          ...m,
          isCore: m.is_core !== undefined ? !!m.is_core : !!m.isCore,
          isBillable: m.is_billable !== undefined ? !!m.is_billable : !!m.isBillable,
        }));
        setModules(normalized);
      }

      // Flatten saas_features nested in modules Data, or use featuresData if present
      const allFeatures: SaasFeature[] = [];
      if (Array.isArray(featuresData) && featuresData.length > 0) {
        featuresData.forEach((f: any) => {
          const parentMod = modulesData?.find((m: any) => m.id === f.module_id);
          allFeatures.push({
            id: f.id,
            name: f.name,
            code: f.code,
            moduleCode: parentMod ? parentMod.code : (f.module?.code || f.module_code || ""),
            group: f.group,
            description: f.description,
            status: f.status,
            defaultEnabled: f.default_enabled !== undefined ? !!f.default_enabled : !!f.defaultEnabled
          });
        });
      } else if (modulesData) {
        modulesData.forEach((m: any) => {
          if (m.features) {
            m.features.forEach((f: any) => {
              allFeatures.push({
                id: f.id,
                name: f.name,
                code: f.code,
                moduleCode: m.code,
                group: f.group,
                description: f.description,
                status: f.status,
                defaultEnabled: f.default_enabled !== undefined ? !!f.default_enabled : !!f.defaultEnabled
              });
            });
          }
        });
      }
      setFeatures(allFeatures);

      // Populate plans, baseline planLimits, and planFeatureMatrix
      const planList: SubscriptionPlan[] = [];
      const planLimitsObj: Record<string, PlanLimits> = {};
      const matrixObj: Record<string, Record<string, any>> = {};

      plansData.forEach((p: any) => {
        const pCode = p.plan_code || p.code || "";
        planList.push({
          id: p.id,
          name: p.name,
          code: pCode,
          monthlyPrice: p.monthly_price !== undefined ? Number(p.monthly_price) : Number(p.monthlyPrice || 0),
          yearlyPrice: p.yearly_price !== undefined ? Number(p.yearly_price) : Number(p.yearlyPrice || 0),
          trialDays: p.trial_days !== undefined ? Number(p.trial_days) : Number(p.trialDays || 0),
          status: p.status || "ACTIVE",
          sortOrder: p.sort_order !== undefined ? Number(p.sort_order) : Number(p.sortOrder || 0)
        });

        // 1. Process limits relation (supports snake_camel hybrid)
        const limits: PlanLimits = {
          projectsLimit: 5, layoutsLimit: 15, plotsLimit: 250, customersLimit: 1000, usersLimit: 5,
          agentsLimit: 2, storageLimitGb: 5, documentsLimit: 1000, dxfFilesLimit: 2, marketplaceListingsLimit: 5,
          apiCallsLimit: 5000, whatsAppMessagesLimit: 100, aiCreditsLimit: 50
        };
        const rawLimList = p.plan_limits || p.planLimits || [];
        if (Array.isArray(rawLimList)) {
          rawLimList.forEach((lim: any) => {
            if (lim.limit_key) {
              limits[lim.limit_key as keyof PlanLimits] = Number(lim.limit_value || 0);
            }
          });
        }
        planLimitsObj[pCode] = limits;

        // 2. Process features relation
        const feats: Record<string, "ENABLED" | "DISABLED" | "ADDON" | "ENTERPRISE"> = {};
        allFeatures.forEach(f => {
          feats[f.code] = "DISABLED";
        });
        const rawFeatList = p.plan_features || p.planFeatures || [];
        if (Array.isArray(rawFeatList)) {
          rawFeatList.forEach((pf: any) => {
            const fCode = pf.feature?.code || pf.feature_code;
            if (fCode) {
              const level = pf.access_level || "ENABLED";
              feats[fCode] = level as any;
            }
          });
        }
        matrixObj[pCode] = feats;
      });

      if (planList.length > 0) setPlans(planList);
      setPlanLimits(planLimitsObj);
      setMatrix(matrixObj);

      if (addonsData && Array.isArray(addonsData)) {
        const parsedAddons = addonsData.map((a: any) => ({
          id: a.id,
          code: a.code,
          name: a.name,
          description: a.description,
          monthlyPrice: a.monthly_price !== undefined ? Number(a.monthly_price) : Number(a.monthlyPrice || 0),
          yearlyPrice: a.yearly_price !== undefined ? Number(a.yearly_price) : Number(a.yearlyPrice || 0),
          status: a.status || "ACTIVE"
        }));
        setAddons(parsedAddons);
      }

      if (slabsData && Array.isArray(slabsData)) {
        const parsedSlabs = slabsData.map((s: any) => ({
          id: s.id,
          minPlots: s.min_plots !== undefined ? Number(s.min_plots) : Number(s.minPlots || 0),
          maxPlots: s.max_plots !== undefined ? Number(s.max_plots) : Number(s.maxPlots || 0),
          monthlyPrice: s.monthly_price !== undefined ? Number(s.monthly_price) : Number(s.monthlyPrice || 0),
          yearlyPrice: s.yearly_price !== undefined ? Number(s.yearly_price) : Number(s.yearlyPrice || 0),
          status: s.status || "ACTIVE"
        }));
        setSlabs(parsedSlabs);
      }

      // Load specific tenant subscription status and overrides
      const tenantSubs: Record<string, TenantSubscription> = {};
      if (targetTenants && targetTenants.length > 0) {
        await Promise.all(
          targetTenants.map(async (t) => {
            try {
              const subData = await api.fetchTenantSubscription(t.id || t.code);
              if (subData) {
                const addonCodes = (subData.addons || []).map((a: any) => a.addon?.code || a.addon_id);
                
                const featureOverrides: Record<string, "ENABLED" | "DISABLED"> = {};
                (subData.feature_overrides || []).forEach((fo: any) => {
                  featureOverrides[fo.feature?.code || fo.feature_id] = fo.override_status;
                });

                const limitOverrides: Record<string, number> = {};
                (subData.limit_overrides || []).forEach((lo: any) => {
                  limitOverrides[lo.limit_key] = lo.override_value;
                });

                tenantSubs[t.code] = {
                  tenantId: subData.tenant_id || t.id,
                  tenantCode: t.code,
                  currentPlanCode: subData.plan?.plan_code || "GROWTH",
                  status: subData.status || "ACTIVE",
                  addOnCodes: addonCodes,
                  subscriptionStartDate: subData.subscription_start_date,
                  subscriptionExpiryDate: subData.subscription_expiry_date,
                  trialExpiryDate: subData.trial_expiry_date,
                  renewalDate: subData.renewal_date,
                  featureOverrides: featureOverrides,
                  limitOverrides: limitOverrides
                };
              }
            } catch (err) {
              console.error(`Error loading subscription for tenant ${t.code}:`, err);
            }
          })
        );
        setTenantSubscriptions(tenantSubs);
      }
    } catch (err: any) {
      console.error("loadSaasConfig error:", err);
      setConfigError(err.message || "Failed to load SaaS cluster parameters from relational database server.");
    } finally {
      setLoadingConfig(false);
      setIsInitializing(false);
    }
  };

  // Immediate UI local-state updates
  const handleAddPlan = async (newPlanObj: SubscriptionPlan, limits: PlanLimits, matrixSettings: Record<string, "ENABLED" | "DISABLED" | "ADDON" | "ENTERPRISE">) => {
    // Validation
    if (newPlanObj.monthlyPrice < 0 || newPlanObj.yearlyPrice < 0) {
      showToast("Prices cannot be negative values.", "error");
      return;
    }
    if (newPlanObj.trialDays < 0) {
      showToast("Trial days must be greater than or equal to 0.", "error");
      return;
    }
    if (!newPlanObj.code.trim()) {
      showToast("Plan code cannot be blank.", "error");
      return;
    }

    setPlans(prev => [...prev, newPlanObj]);
    setPlanLimits(prev => {
      const next = { ...prev };
      next[newPlanObj.code] = limits;
      return next;
    });
    setMatrix(prev => {
      const next = { ...prev };
      next[newPlanObj.code] = matrixSettings;
      return next;
    });

    try {
      const activeFeatureIds: string[] = [];
      Object.entries(matrixSettings).forEach(([featCode, status]) => {
        if (status === "ENABLED") {
          const matched = features.find(f => f.code.toUpperCase() === featCode.toUpperCase());
          if (matched) {
            activeFeatureIds.push(matched.id);
          }
        }
      });

      await api.saveSaasPlan({
        plan_code: newPlanObj.code,
        name: newPlanObj.name,
        monthly_price: newPlanObj.monthlyPrice,
        yearly_price: newPlanObj.yearlyPrice,
        trial_days: newPlanObj.trialDays,
        status: newPlanObj.status,
        sort_order: newPlanObj.sortOrder,
        limits,
        features: activeFeatureIds
      });
      showToast(`Plan template [${newPlanObj.name}] created and persistent in database!`, "success");
      await loadSaasConfig();
    } catch (err) {
      console.error("Failed to persist new SaaS plan relation:", err);
      showToast("Failed to save new plan in PostgreSQL. Check validation.", "error");
    }
  };

  const handleUpdatePlan = async (code: string, updates: Partial<SubscriptionPlan>) => {
    // Only update local state. The explicit "Save" button triggers save!
    const updatedPlans = plans.map(p => p.code === code ? { ...p, ...updates } : p);
    setPlans(updatedPlans);
  };

  const handleUpdatePlanLimit = async (planCode: string, limitKey: keyof PlanLimits, value: number) => {
    // Only update local state. The explicit "Save Limits" button triggers save!
    const nextLimits = { ...planLimits };
    if (!nextLimits[planCode]) nextLimits[planCode] = {} as any;
    nextLimits[planCode][limitKey] = value;
    setPlanLimits(nextLimits);
  };

  const handleUpdateMatrixCell = async (planCode: string, featCode: string, value: "ENABLED" | "DISABLED" | "ADDON" | "ENTERPRISE") => {
    // Only update local state. The explicit "Save Matrix" button triggers save!
    const nextMatrix = { ...matrix };
    if (!nextMatrix[planCode]) nextMatrix[planCode] = {};
    nextMatrix[planCode][featCode] = value;
    setMatrix(nextMatrix);
  };

  // Dedicated Save Actions
  const handleSavePlanCard = async (code: string) => {
    const planObj = plans.find(p => p.code === code);
    if (!planObj) return;

    if (planObj.monthlyPrice < 0 || planObj.yearlyPrice < 0) {
      showToast("Plan pricing values cannot be negative.", "error");
      return;
    }
    if (planObj.trialDays < 0) {
      showToast("Trial days must be 0 or more.", "error");
      return;
    }

    try {
      const limits = planLimits[code] || {};
      const planFeatures = matrix[code] || {};
      const activeFeatureIds: string[] = [];
      Object.entries(planFeatures).forEach(([featCode, status]) => {
        if (status === "ENABLED") {
          const matched = features.find(f => f.code.toUpperCase() === featCode.toUpperCase());
          if (matched) {
            activeFeatureIds.push(matched.id);
          }
        }
      });

      await api.saveSaasPlan({
        id: planObj.id,
        plan_code: planObj.code,
        name: planObj.name,
        monthly_price: planObj.monthlyPrice,
        yearly_price: planObj.yearlyPrice,
        trial_days: planObj.trialDays,
        status: planObj.status,
        sort_order: planObj.sortOrder,
        limits,
        features: activeFeatureIds
      });
      showToast(`Plan '${planObj.name}' details saved!`, "success");
      await loadSaasConfig();
    } catch (err: any) {
      console.error(err);
      showToast("Failed to save plan changes to PostgreSQL.", "error");
    }
  };

  const handleSaveFeatureMatrix = async () => {
    try {
      setLoadingConfig(true);
      for (const p of plans) {
        const pCode = p.code;
        const planFeatures = matrix[pCode] || {};
        const activeFeatureIds: string[] = [];
        Object.entries(planFeatures).forEach(([featCode, status]) => {
          if (status === "ENABLED") {
            const matched = features.find(f => f.code.toUpperCase() === featCode.toUpperCase());
            if (matched) {
              activeFeatureIds.push(matched.id);
            }
          }
        });

        await api.saveSaasPlan({
          id: p.id,
          plan_code: pCode,
          name: p.name,
          monthly_price: p.monthlyPrice,
          yearly_price: p.yearlyPrice,
          trial_days: p.trialDays,
          status: p.status,
          sort_order: p.sortOrder,
          limits: planLimits[pCode],
          features: activeFeatureIds
        });
      }
      showToast("Feature Matrix structure successfully persisted!", "success");
      await loadSaasConfig();
    } catch (err: any) {
      console.error(err);
      showToast("Failed to save corporate matrix configuration.", "error");
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSaveUsageLimits = async () => {
    let hasNegative = false;
    plans.forEach(p => {
      const limits = planLimits[p.code] || {};
      Object.entries(limits).forEach(([k, v]) => {
        if (Number(v) < 0) {
          hasNegative = true;
        }
      });
    });

    if (hasNegative) {
      showToast("Usage limits cannot have negative allocations.", "error");
      return;
    }

    try {
      setLoadingConfig(true);
      for (const p of plans) {
        const pCode = p.code;
        const limits = planLimits[pCode] || {};
        const planFeatures = matrix[pCode] || {};
        const activeFeatureIds: string[] = [];
        Object.entries(planFeatures).forEach(([featCode, status]) => {
          if (status === "ENABLED") {
            const matched = features.find(f => f.code.toUpperCase() === featCode.toUpperCase());
            if (matched) {
              activeFeatureIds.push(matched.id);
            }
          }
        });

        await api.saveSaasPlan({
          id: p.id,
          plan_code: pCode,
          name: p.name,
          monthly_price: p.monthlyPrice,
          yearly_price: p.yearlyPrice,
          trial_days: p.trialDays,
          status: p.status,
          sort_order: p.sortOrder,
          limits,
          features: activeFeatureIds
        });
      }
      showToast("All plan limits parsed and synchronized with server!", "success");
      await loadSaasConfig();
    } catch (err: any) {
      console.error(err);
      showToast("Failed to update general SaaS plan limits.", "error");
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleAddSlab = async (s: PlotBillingSlab) => {
    if (s.monthlyPrice < 0 || s.yearlyPrice < 0) {
      showToast("Plot slab prices cannot be negative.", "error");
      return;
    }
    if (s.minPlots < 1 || s.maxPlots <= s.minPlots) {
      showToast("Invalid slab range setup.", "error");
      return;
    }

    setSlabs(prev => [...prev, s]);
    try {
      await api.saveSaasSlab({
        min_plots: s.minPlots,
        max_plots: s.maxPlots,
        monthly_price: s.monthlyPrice,
        yearly_price: s.yearlyPrice,
        one_time_license_price: s.oneTimeLicensePrice || 0,
        amc_price: s.amcPrice || 0,
        sort_order: s.sortOrder || 0,
        status: s.status || "ACTIVE"
      });
      showToast(`Plot threshold slab [${s.minPlots}-${s.maxPlots}] created!`, "success");
      await loadSaasConfig();
    } catch (err) {
      console.error("Failed to persist plot billing slab:", err);
      showToast("Failed to save plot billing slab.", "error");
    }
  };

  const handleUpdateSlab = async (id: string, updates: Partial<PlotBillingSlab>) => {
    const updated = slabs.map(s => s.id === id ? { ...s, ...updates } : s);
    setSlabs(updated);
    const sObj = updated.find(s => s.id === id);
    if (!sObj) return;

    if (sObj.monthlyPrice < 0 || sObj.yearlyPrice < 0) {
      showToast("Slab price numbers cannot be negative.", "error");
      return;
    }

    try {
      await api.saveSaasSlab({
        id: sObj.id?.startsWith("slab_") ? undefined : sObj.id,
        min_plots: sObj.minPlots,
        max_plots: sObj.maxPlots,
        monthly_price: sObj.monthlyPrice,
        yearly_price: sObj.yearlyPrice,
        one_time_license_price: sObj.oneTimeLicensePrice || 0,
        amc_price: sObj.amcPrice || 0,
        sort_order: sObj.sortOrder || 0,
        status: sObj.status
      });
      showToast("Plot capacity slab status updated!", "success");
      await loadSaasConfig();
    } catch (err) {
      console.error("Failed to update plot billing slab:", err);
      showToast("Failed to update dynamic capacity slab.", "error");
    }
  };

  const handleDeleteSlab = async (id: string) => {
    if (id.startsWith("slab_")) {
      setSlabs(prev => prev.filter(s => s.id !== id));
      return;
    }
    if (!window.confirm("Confirm deletion of this dynamic capacity tier slab?")) {
      return;
    }
    try {
      await api.deleteSaasSlab(id);
      showToast("Plot capacity slab deleted successfully!", "success");
      await loadSaasConfig();
    } catch (err: any) {
      console.error("Failed to delete slab:", err);
      showToast(err.message || "Failed to delete capacity slab.", "error");
    }
  };

  const handleReorderSlabs = async (ids: string[]) => {
    try {
      await api.reorderSaasSlabs(ids);
      showToast("Plot billing slabs sequence updated!", "success");
      await loadSaasConfig();
    } catch (err) {
      console.error("Failed to reorder slabs:", err);
      showToast("Failed to save slabs reordering.", "error");
    }
  };

  const handleAddAddon = async (a: AddonCatalogItem) => {
    if (!a.code?.trim()) {
      showToast("Addon code cannot be blank.", "error");
      return;
    }
    if (a.monthlyPrice < 0 || a.yearlyPrice < 0) {
      showToast("Addon prices cannot be negative.", "error");
      return;
    }

    setAddons(prev => [...prev, a]);
    try {
      await api.saveSaasAddon({
        code: a.code,
        name: a.name,
        monthly_price: a.monthlyPrice,
        yearly_price: a.yearlyPrice,
        description: a.description,
        status: a.status || "ACTIVE"
      });
      showToast(`Addon [${a.name}] created successfully!`, "success");
      await loadSaasConfig();
    } catch (err) {
      console.error("Failed to persist billing addon:", err);
      showToast("Failed to create billing addon.", "error");
    }
  };

  const handleUpdateAddon = async (code: string, updates: Partial<AddonCatalogItem>) => {
    const updated = addons.map(a => a.code === code ? { ...a, ...updates } : a);
    setAddons(updated);
    const aObj = updated.find(a => a.code === code);
    if (!aObj) return;

    if (aObj.monthlyPrice < 0 || aObj.yearlyPrice < 0) {
      showToast("Addon prices cannot be negative.", "error");
      return;
    }

    try {
      await api.saveSaasAddon({
        id: aObj.id,
        code: aObj.code,
        name: aObj.name,
        monthly_price: aObj.monthlyPrice,
        yearly_price: aObj.yearlyPrice,
        description: aObj.description,
        status: aObj.status
      });
      showToast(`Addon [${aObj.name}] status updated!`, "success");
      await loadSaasConfig();
    } catch (err) {
      console.error("Failed to update billing addon:", err);
      showToast("Failed to update billing addon.", "error");
    }
  };

  const handleAddModule = async (mod: SaasModule) => {
    try {
      await api.saveSaasModule({
        code: mod.code,
        name: mod.name,
        group: mod.group,
        description: mod.description,
        status: mod.status,
        is_core: mod.isCore,
        is_billable: mod.isBillable,
        sort_order: mod.sortOrder
      });
      showToast(`Module '${mod.name}' successfully registered!`, "success");
      await loadSaasConfig();
    } catch (err) {
      console.error(err);
      showToast("Failed to register Module to Registry DB.", "error");
    }
  };

  const handleUpdateModule = async (code: string, updates: Partial<SaasModule>) => {
    const existing = modules.find(m => m.code === code);
    if (!existing) return;

    setModules(prev => prev.map(m => m.code === code ? { ...m, ...updates } : m));

    try {
      const payload = {
        id: existing.id,
        code: existing.code,
        name: updates.name !== undefined ? updates.name : existing.name,
        group: updates.group !== undefined ? updates.group : existing.group,
        description: updates.description !== undefined ? updates.description : existing.description,
        status: updates.status !== undefined ? updates.status : existing.status,
        is_core: updates.isCore !== undefined ? updates.isCore : existing.isCore,
        is_billable: updates.isBillable !== undefined ? updates.isBillable : existing.isBillable,
        sort_order: updates.sortOrder !== undefined ? updates.sortOrder : existing.sortOrder,
      };

      await api.saveSaasModule(payload);
      showToast(`Module '${existing.name}' settings saved!`, "success");
      await loadSaasConfig();
    } catch (err) {
      console.error(err);
      showToast("Failed to update module configuration in Registry DB.", "error");
    }
  };

  const handleAddFeature = async (feat: SaasFeature) => {
    const modObj = modules.find(m => m.code === feat.moduleCode);
    if (!modObj) {
      showToast("Target Module not found in active workspace context.", "error");
      return;
    }

    try {
      await api.saveSaasFeature({
        module_id: modObj.id,
        code: feat.code,
        name: feat.name,
        group: feat.group,
        description: feat.description,
        status: feat.status,
        default_enabled: feat.defaultEnabled
      });
      showToast(`Feature '${feat.name}' successfully cataloged!`, "success");
      await loadSaasConfig();
    } catch (err) {
      console.error(err);
      showToast("Failed to persist feature inside the catalog database.", "error");
    }
  };

  const handleUpdateFeature = async (code: string, updates: Partial<SaasFeature>) => {
    const existing = features.find(f => f.code === code);
    if (!existing) return;

    const modObj = modules.find(m => m.code === existing.moduleCode);
    if (!modObj) return;

    setFeatures(prev => prev.map(f => f.code === code ? { ...f, ...updates } : f));

    try {
      const payload = {
        id: existing.id,
        module_id: modObj.id,
        code: existing.code,
        name: updates.name !== undefined ? updates.name : existing.name,
        group: updates.group !== undefined ? updates.group : existing.group,
        description: updates.description !== undefined ? updates.description : existing.description,
        status: updates.status !== undefined ? updates.status : existing.status,
        default_enabled: updates.defaultEnabled !== undefined ? updates.defaultEnabled : existing.defaultEnabled,
      };

      await api.saveSaasFeature(payload);
      showToast(`Feature '${existing.name}' settings saved!`, "success");
      await loadSaasConfig();
    } catch (err) {
      console.error(err);
      showToast("Failed to update feature definition in backend Catalog.", "error");
    }
  };

  const handleUpdateSubscription = async (updatedSub: TenantSubscription) => {
    const next = { ...tenantSubscriptions };
    next[updatedSub.tenantCode] = updatedSub;
    setTenantSubscriptions(next);

    try {
      const tenant = tenants.find(t => t.code === updatedSub.tenantCode);
      if (!tenant) return;

      const planObj = plans.find(p => p.code === updatedSub.currentPlanCode);
      if (!planObj) return;

      const addonIds: string[] = [];
      updatedSub.addOnCodes.forEach(code => {
        const match = addons.find(a => a.code === code);
        if (match && match.id) addonIds.push(match.id);
      });

      const fOverrides: Record<string, string> = {};
      Object.entries(updatedSub.featureOverrides).forEach(([code, status]) => {
        const match = features.find(f => f.code === code);
        if (match && match.id && status !== "DEFAULT") {
          fOverrides[match.id] = status;
        }
      });

      await api.assignTenantPlan(tenant.id || tenant.code, {
        plan_id: planObj.id,
        start_date: updatedSub.subscriptionStartDate,
        status: updatedSub.status,
        trial_days: updatedSub.trialExpiryDate ? 14 : undefined
      });

      await api.saveTenantOverrides(tenant.id || tenant.code, {
        addons: addonIds,
        limit_overrides: updatedSub.limitOverrides,
        feature_overrides: fOverrides
      });
    } catch (err) {
      console.error("Failed to persist custom subscription overrides:", err);
    }
  };

  // Sync basic loaded Tenants list with deep subscriptions map
  useEffect(() => {
    if (tenants.length > 0) {
      const updatedSubs = { ...tenantSubscriptions };
      let updated = false;
      
      tenants.forEach(t => {
        if (!updatedSubs[t.code]) {
          updatedSubs[t.code] = {
            tenantId: t.id || `tenant_${t.code}`,
            tenantCode: t.code,
            currentPlanCode: t.plan || "GROWTH",
            status: (t.status === "ACTIVE" ? "ACTIVE" : "SUSPENDED") as any,
            addOnCodes: [],
            subscriptionStartDate: new Date().toISOString().split('T')[0],
            subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
            trialExpiryDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
            renewalDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
            featureOverrides: {},
            limitOverrides: {}
          };
          updated = true;
        }
      });

      if (updated) {
        setTenantSubscriptions(updatedSubs);
      }
    }
  }, [tenants]);

  // Sync selected override tenant subscription into local edit states
  useEffect(() => {
    const sub = selectedOverrideTenantCode ? tenantSubscriptions[selectedOverrideTenantCode] : null;
    if (sub) {
      setEditFeatureOverrides(sub.featureOverrides || {});
      setEditLimitOverrides(sub.limitOverrides || {});
      setEditAddonCodes(sub.addOnCodes || []);
    } else {
      setEditFeatureOverrides({});
      setEditLimitOverrides({});
      setEditAddonCodes([]);
    }
    setOverrideFormSuccess(null);
  }, [selectedOverrideTenantCode, tenantSubscriptions]);

  // Sync back state properties from subscriptions overrides to general tenants list
  const getSubbedPlanForTenant = (tenantCode: string, fallback: string) => {
    const sub = tenantSubscriptions[tenantCode];
    return sub ? sub.currentPlanCode : fallback;
  };

  const getSubbedStatusForTenant = (tenantCode: string, fallback: string) => {
    const sub = tenantSubscriptions[tenantCode];
    return sub ? sub.status : fallback;
  };

  // ==========================================
  // DISCOVERY SERVICES SYNC LOGIC
  // ==========================================
  
  useEffect(() => {
    const user = api.getCurrentUser();
    if (user && user.role === "admin") {
      setCurrentUser(user);
    }
  }, []);

  const loadTenants = async () => {
    setLoadingTenants(true);
    setTenantsError(null);
    try {
      const data = await api.fetchAdminTenants();
      setTenants(data);
      return data;
    } catch (err: any) {
      setTenantsError(err.message || "Failed to load tenant clusters from database server.");
      return [];
    } finally {
      setLoadingTenants(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    setLogsError(null);
    try {
      const data = await api.fetchAdminAuditLogs();
      setAuditLogs(data);
    } catch (err: any) {
      setLogsError(err.message || "Failed to load ingress audit logs from admin endpoint.");
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSaveTenantOverrides = async () => {
    if (!selectedOverrideTenantCode) return;
    const sub = tenantSubscriptions[selectedOverrideTenantCode];
    if (!sub) return;

    setIsSavingOverrides(true);
    setOverrideFormSuccess(null);
    try {
      const payload = {
        featureOverrides: editFeatureOverrides,
        limitOverrides: editLimitOverrides,
        addOnCodes: editAddonCodes
      };

      const tenant = tenants.find(t => t.code === selectedOverrideTenantCode);
      const targetId = tenant?.id || sub.tenantId || selectedOverrideTenantCode;
      
      const res = await api.saveTenantOverrides(targetId, payload);
      
      if (res && res.success) {
        const nextSubs = { ...tenantSubscriptions };
        nextSubs[selectedOverrideTenantCode] = {
          ...sub,
          featureOverrides: editFeatureOverrides,
          limitOverrides: editLimitOverrides,
          addOnCodes: editAddonCodes
        };
        setTenantSubscriptions(nextSubs);
        setOverrideFormSuccess("Workspace subscription overrides saved successfully to PostgreSQL database.");
        await loadTenants();
        await loadAuditLogs();
      } else {
        throw new Error("Failed to persist subscription modifications.");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred while transmitting credentials to API.");
    } finally {
      setIsSavingOverrides(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      (async () => {
        const fetchedTenants = await loadTenants();
        loadAuditLogs();
        await loadSaasConfig(fetchedTenants);
      })();
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // safe bypass
    }
    setCurrentUser(null);
    setTenants([]);
    setAuditLogs([]);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.code) return;

    setLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const payload = {
        name: newTenant.name,
        code: newTenant.code.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"),
        plan: newTenant.plan
      };

      const res = await api.createAdminTenant(payload);
      
      if (res && res.tenant) {
        setSubmitSuccess(`Tenant namespace '${payload.code}' was successfully provisioned in the database!`);
        
        // Register default Subscription metadata as well
        const freshSub: TenantSubscription = {
          tenantId: res.tenant.id || `tenant_${payload.code}`,
          tenantCode: payload.code,
          currentPlanCode: payload.plan,
          status: "ACTIVE",
          addOnCodes: [],
          subscriptionStartDate: new Date().toISOString().split('T')[0],
          subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
          trialExpiryDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
          renewalDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
          featureOverrides: {},
          limitOverrides: {}
        };

        const updatedSubs = { ...tenantSubscriptions };
        updatedSubs[payload.code] = freshSub;
        setTenantSubscriptions(updatedSubs);

        // Reload lists to coordinate mapping
        await loadTenants();
        await loadAuditLogs();

        setTimeout(() => {
          setShowAddTenant(false);
          setNewTenant({ name: "", code: "", plan: "GROWTH" });
          setSubmitSuccess(null);
        }, 1200);
      } else {
        throw new Error("Unexpected response structure from tenant provision authority.");
      }
    } catch (err: any) {
      setSubmitError(err.message || "Failed to finalize database schema mapping registry.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-slate-50 min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <AdminLogin 
            onLoginSuccess={handleLoginSuccess}
            onForgotPassword={() => alert("Simulation module reset request. Use standard admin credentials to sign in.")}
          />
        </div>
      </div>
    );
  }

  // Retrieve selected tenant subscription info
  const selectedTenantSubscription = selectedTenantSub ? tenantSubscriptions[selectedTenantSub.code] : null;

  return (
    <div className="bg-slate-100 min-h-screen text-slate-805 font-sans flex flex-col md:flex-row" id="saas-admin-supervision-suite">
      
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0 border-r border-slate-950 md:sticky md:top-0 md:h-screen" id="saas-sidebar-navigation">
        {/* Sidebar Brand Header */}
        <div className="p-6 border-b border-slate-850 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white rounded-lg p-1.5 shadow-sm">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm leading-tight tracking-wider uppercase">BhoomiOne</h1>
              <p className="text-[10px] text-indigo-400 font-bold font-mono tracking-wider">SAAS CONTROL PANEL</p>
            </div>
          </div>
        </div>

        {/* Navigation Items (Left sidebar vertical layout) */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto" id="saas-sidebar-nav-items">
          {[
            { id: "mrr-dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "tenant-registry", label: "Workspace Tenants", icon: Users },
            { id: "subscription-center", label: "Subscription Center", icon: CreditCard },
            { id: "module-registry", label: "Module Registry", icon: Box },
            { id: "tenant-overrides", label: "Tenant Overrides", icon: Sliders },
            { id: "core-masters", label: "Core Masters", icon: Database },
            { id: "audit-logs", label: "Audit Logs", icon: Terminal },
            { id: "settings", label: "Settings", icon: Settings },
          ].map(t => {
            const Icon = t.icon;
            // Map active state properly to handle both top-level and inner-tabs
            const isSelected = activeTab === t.id || 
              (t.id === "subscription-center" && ["plan-master", "addons", "tenant-licenses", "usage", "invoices", "audit"].includes(activeTab)) ||
              (t.id === "module-registry" && ["module-registry", "feature-catalog"].includes(activeTab));

            return (
              <button
                key={t.id}
                onClick={() => {
                  if (t.id === "subscription-center") {
                    setActiveTab("plan-master");
                  } else if (t.id === "module-registry") {
                    setActiveTab("module-registry");
                  } else {
                    setActiveTab(t.id as any);
                  }
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                  isSelected 
                    ? "bg-indigo-600 text-white shadow-md font-extrabold" 
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile section at bottom of sidebar */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40 font-sans">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-850 text-slate-350 flex items-center justify-center font-bold text-xs uppercase border border-slate-700">
              {currentUser.name ? currentUser.name[0] : "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">{currentUser.name}</p>
              <p className="text-[9px] text-indigo-400 font-mono uppercase font-bold truncate">ADMINISTRATOR</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-red-900/30 hover:text-red-400 text-slate-300 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700 hover:border-red-900/20 shadow-xs"
            id="saas-admin-logout-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. RIGHT MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0" id="saas-main-viewport">
        
        {/* Top bar with Breadcrumbs / Header action buttons */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-10 shadow-3xs">
          <div>
            <div className="flex items-center gap-1 text-[10px] text-slate-450 font-bold uppercase tracking-wider font-mono">
              <span>SaaS Control Panel</span>
              <span>/</span>
              <span className="text-slate-655 font-sans font-bold">
                {activeTab === "mrr-dashboard" ? "Dashboard" :
                 activeTab === "tenant-registry" ? "Workspace Tenants" :
                 ["plan-master", "addons", "tenant-licenses", "usage", "invoices", "audit"].includes(activeTab) ? "Subscription Center" :
                 ["module-registry", "feature-catalog"].includes(activeTab) ? "Module Registry" :
                 activeTab === "tenant-overrides" ? "Tenant Overrides overrides" :
                 activeTab === "audit-logs" ? "Telemetry Audit Logs" : "System Settings"}
              </span>
            </div>
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mt-0.5" id="header-main-title">
              {activeTab === "mrr-dashboard" ? "Revenue & Operations Analytics Dashboard" :
               activeTab === "tenant-registry" ? "Active Tenant Workspace Clusters" :
               ["plan-master", "addons", "tenant-licenses", "usage", "invoices", "audit"].includes(activeTab) ? "Global Subscription Center / Pricing Packages" :
               ["module-registry", "feature-catalog"].includes(activeTab) ? "Platform Module Registry & Features Catalog" :
               activeTab === "tenant-overrides" ? "Dynamic Tenant Overrides Plan Manager" :
               activeTab === "audit-logs" ? "Telemetry Ingress Audit Logs Streams" : 
               activeTab === "settings" ? "SaaS Platform Configuration & Settings" : "System Settings"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setSubmitError(null);
                setSubmitSuccess(null);
                setShowAddTenant(true);
              }}
              className="bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm animate-pulse"
              id="provision-tenant-init-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Provision Workspace</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY SCROLL CONTAINER */}
        <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">

          {/* INNER TABS FOR SUBSCRIPTION CENTER */}
          {["plan-master", "addons", "tenant-licenses", "usage", "invoices", "audit"].includes(activeTab) && (
            <div className="flex border-b border-slate-200 overflow-x-auto gap-1 bg-white p-2 rounded-xl border mb-6 shadow-3xs shrink-0">
              {[
                { id: "plan-master", label: "Plans", icon: DollarSign },
                { id: "addons", label: "Add-ons", icon: Shield },
                { id: "tenant-licenses", label: "Tenant Licenses", icon: Users },
                { id: "usage", label: "Usage", icon: Activity },
                { id: "invoices", label: "Invoices", icon: Info },
                { id: "audit", label: "Audit", icon: Terminal }
              ].map(sub => {
                const isActive = activeTab === sub.id;
                const Icon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveTab(sub.id as any)}
                    className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                      isActive 
                        ? "bg-slate-950 text-white shadow-xs font-extrabold" 
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* INNER TABS FOR MODULE REGISTRY */}
          {["module-registry", "feature-catalog"].includes(activeTab) && (
            <div className="flex border-b border-slate-200 overflow-x-auto gap-1 bg-white p-2 rounded-xl border mb-6 shadow-3xs shrink-0">
              {[
                { id: "module-registry", label: "Modules Directory", icon: Box },
                { id: "feature-catalog", label: "Feature Catalog", icon: Zap }
              ].map(sub => {
                const isActive = activeTab === sub.id;
                const Icon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveTab(sub.id as any)}
                    className={`px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5 rounded-lg whitespace-nowrap cursor-pointer ${
                      isActive 
                        ? "bg-slate-950 text-white shadow-xs font-extrabold" 
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Viewport content */}
        
        {/* Module Registry Tab */}
        {["module-registry", "feature-catalog"].includes(activeTab) && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fadeIn font-sans">
            <ModuleRegistryTab 
              modules={modules}
              features={features}
              plans={plans}
              addons={addons}
              matrix={matrix}
              isLoading={loadingConfig}
              error={configError}
              onAddModule={handleAddModule}
              onUpdateModule={handleUpdateModule}
              onAddFeature={handleAddFeature}
              onUpdateFeature={handleUpdateFeature}
              defaultTab={activeTab === "module-registry" ? "modules" : "features"}
            />
          </div>
        )}

        {activeTab === "tenant-registry" && (
          <TenantManagementTab showToast={showToast} />
        )}

        {activeTab === "tenant-overrides" && (
          <TenantOverridesTab showToast={showToast} />
        )}

        {/* Plans */}
        {activeTab === "plan-master" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fadeIn">
            <PlanFeatureMatrixTab 
              plans={plans}
              features={features}
              planLimits={planLimits}
              matrix={matrix}
              onAddPlan={handleAddPlan}
              onUpdatePlan={handleUpdatePlan}
              onUpdatePlanLimit={handleUpdatePlanLimit}
              onUpdateMatrixCell={handleUpdateMatrixCell}
              onSavePlan={handleSavePlanCard}
              onSaveFeatureMatrix={handleSaveFeatureMatrix}
              onSaveUsageLimits={handleSaveUsageLimits}
            />
          </div>
        )}

        {/* Add-ons */}
        {activeTab === "addons" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fadeIn font-sans">
            <AddonsBillingTab 
              defaultTab="addons"
              slabs={slabs}
              addons={addons}
              onAddSlab={handleAddSlab}
              onUpdateSlab={handleUpdateSlab}
              onDeleteSlab={handleDeleteSlab}
              onReorderSlabs={handleReorderSlabs}
              onAddAddon={handleAddAddon}
              onUpdateAddon={handleUpdateAddon}
            />
          </div>
        )}

        {/* Tenant Licenses */}
        {activeTab === "tenant-licenses" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fadeIn font-sans">
            <TenantManagementTab showToast={showToast} initialSubTab="directory" />
          </div>
        )}

        {/* Usage */}
        {activeTab === "usage" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fadeIn font-sans space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Dynamic Ecosystem Resource Usage</h3>
                <p className="text-[11px] text-slate-500">Live aggregate compute resources, file storage volumes, and gateway API counters.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Total Storage Used", val: "148.5 GB", cap: "of 500 GB total allocation", color: "text-indigo-600" },
                { label: "Active Project Workspaces", val: "1,240 Nodes", cap: "94% average health", color: "text-emerald-600" },
                { label: "Gateway API Calls (30d)", val: "2.48M Calls", cap: "Peak 150 requests/sec", color: "text-amber-600" },
                { label: "Total Plots Database Size", val: "482,900 Plots", cap: "GIS synchronizer active", color: "text-violet-600" }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50/50 p-4 border border-slate-150 rounded-xl space-y-1">
                  <p className="text-[10px] text-slate-450 uppercase font-extrabold tracking-wider">{item.label}</p>
                  <p className={`text-lg font-black font-mono ${item.color}`}>{item.val}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{item.cap}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-5 border border-slate-205 rounded-xl space-y-3">
              <h4 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider">Ecosystem Resource Usage Ledger</h4>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left text-slate-600 bg-white rounded-lg border border-slate-200">
                  <thead className="bg-slate-50 font-bold text-slate-550 text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3">Resource Type / Name</th>
                      <th className="p-3 text-center">Resource Code</th>
                      <th className="p-3">Metric Type</th>
                      <th className="p-3 text-right">Monthly Usage</th>
                      <th className="p-3 text-right">Yearly Usage</th>
                      <th className="p-3 text-right">Lifetime Usage</th>
                      <th className="p-3 text-center" style={{ width: "160px" }}>% of Plan Limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-sans">
                    {[
                      {
                        name: "GIS Map Layout Storage Node",
                        code: "RES-STR-01",
                        metricType: "File Bytes (S3 Compatible)",
                        monthly: "18.5 GB",
                        yearly: "192.4 GB",
                        lifetime: "412.8 GB",
                        pct: 82,
                        pctColor: "bg-indigo-600"
                      },
                      {
                        name: "Google Maps Platform Directions API",
                        code: "RES-API-GM",
                        metricType: "HTTP External Queries",
                        monthly: "45,200 Hits",
                        yearly: "512,000 Hits",
                        lifetime: "1,248,000 Hits",
                        pct: 45,
                        pctColor: "bg-amber-500"
                      },
                      {
                        name: "Tenant GIS Plots Databases",
                        code: "RES-DB-PLT",
                        metricType: "PostgreSQL Database Rows",
                        monthly: "12,400 Rows",
                        yearly: "148,000 Rows",
                        lifetime: "482,900 Rows",
                        pct: 96,
                        pctColor: "bg-rose-500"
                      },
                      {
                        name: "Active Dedicated Cluster Nodes",
                        code: "RES-NODE-TNT",
                        metricType: "Orchestrated Docker Pods",
                        monthly: "12 Pods",
                        yearly: "18 Pods",
                        lifetime: "25 Pods",
                        pct: 60,
                        pctColor: "bg-emerald-600"
                      },
                      {
                        name: "Auto-CAD DXF File Translators",
                        code: "RES-CAD-DXF",
                        metricType: "Vector Processing Hours",
                        monthly: "120 Hours",
                        yearly: "1,140 Hours",
                        lifetime: "3,180 Hours",
                        pct: 75,
                        pctColor: "bg-violet-600"
                      }
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-extrabold text-slate-800">{row.name}</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-500">{row.code}</td>
                        <td className="p-3 text-slate-500 font-semibold">{row.metricType}</td>
                        <td className="p-3 text-right font-mono font-bold text-indigo-650">{row.monthly}</td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-700">{row.yearly}</td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-700">{row.lifetime}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <span className="font-mono font-bold text-[10px] text-slate-600">{row.pct}%</span>
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className={`${row.pctColor} rounded-full h-1.5`} style={{ width: `${row.pct}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}



        {/* Invoices */}
        {activeTab === "invoices" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fadeIn font-sans space-y-6">
            <InvoiceConsole tenants={tenants} onShowToast={showToast} />
          </div>
        )}



        {/* Audit */}
        {activeTab === "audit" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fadeIn">
            <AuditLogsTab onShowToast={showToast} />
          </div>
        )}

        {/* Phase 1E Real-time aggregated supercharged MRR Analytics */}
        {activeTab === "mrr-dashboard" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fadeIn font-sans">
            <div className="border-b border-slate-100 pb-3 mb-5">
              <h2 className="text-sm font-bold text-slate-900 uppercase">Enterprise Revenue Analytics</h2>
              <p className="text-xs text-slate-500 mt-1">Real-time analytical graphs, billing projections and workspace MRR multipliers.</p>
            </div>
            
            <MrrDashboardTab 
              tenants={tenants}
              subscriptions={Object.values(tenantSubscriptions)}
              plans={plans}
              addons={addons}
            />
          </div>
        )}

        {/* Original Ingress Trail Stream Telemetry */}
        {activeTab === "audit-logs" && (
          <AuditLogsTab onShowToast={showToast} />
        )}

        {/* Core Masters Administration Dashboard */}
        {activeTab === "core-masters" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fadeIn">
            <CoreMastersConsole onShowToast={showToast} />
          </div>
        )}

        {/* Global configuration params */}
        {activeTab === "settings" && (
          <SaasSettingsTab 
            onShowToast={showToast} 
            slabs={slabs}
            addons={addons}
            onAddSlab={handleAddSlab}
            onUpdateSlab={handleUpdateSlab}
            onDeleteSlab={handleDeleteSlab}
            onReorderSlabs={handleReorderSlabs}
          />
        )}


        </div>

        {/* Floating Toast Notification overlay */}
        {toast && (
          <div className="fixed bottom-8 right-8 z-[9999] transition-all max-w-sm duration-300">
            <div className={`rounded-xl px-4 py-3.5 shadow-2xl border flex items-center gap-2.5 text-xs font-bold font-sans ${
              toast.type === "success" ? "border-emerald-500 bg-emerald-50 text-emerald-900" :
              toast.type === "error" ? "border-red-500 bg-red-50 text-red-900" :
              "border-indigo-500 bg-indigo-50 text-indigo-900"
            }`}>
              {toast.type === "success" ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-550 shrink-0" />}
              <span className="flex-1 text-slate-800">{toast.message}</span>
            </div>
          </div>
        )}
      </main>

      {/* Dynamic Workspace Slide Over / Drawer customizer */}
      {selectedTenantSub && selectedTenantSubscription && (
        <TenantLifecycleDrawer 
          tenant={selectedTenantSub}
          subscription={selectedTenantSubscription}
          plans={plans}
          addons={addons}
          features={features}
          planLimits={planLimits}
          onClose={() => setSelectedTenantSub(null)}
          onUpdateSubscription={handleUpdateSubscription}
          onLifecycleAction={async (action) => {
            const next = { ...tenantSubscriptions };
            const sub = next[selectedTenantSub.code];
            if (!sub) return;

            if (action === "SUSPEND") {
              if (window.confirm(`Suspend workspace container '${selectedTenantSub.name}' and pause access tunnels?`)) {
                sub.status = "SUSPENDED";
                setTenantSubscriptions(next);
                await handleUpdateSubscription(sub);
                alert("Tenant cluster suspended successfully.");
              }
            } else if (action === "REACTIVATE") {
              if (window.confirm(`Reactivate workspace '${selectedTenantSub.name}' and restore proxy vectors?`)) {
                sub.status = "ACTIVE";
                setTenantSubscriptions(next);
                await handleUpdateSubscription(sub);
                alert("Tenant cluster reactivated successfully.");
              }
            } else if (action === "ARCHIVE") {
              if (window.confirm(`Warning: Archiving '${selectedTenantSub.name}' routes cold-stores database schemas permanantly. Proceed?`)) {
                sub.status = "ARCHIVED";
                setTenantSubscriptions(next);
                await handleUpdateSubscription(sub);
                alert("Tenant cluster archived successfully.");
              }
            }
          }}
        />
      )}

      {/* Add Domain Workspace Modal */}
      {showAddTenant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4" id="provision-tenant-modal">
            <h2 className="text-[15px] font-extrabold text-slate-900 uppercase">Provision Tenant Domain</h2>
            <p className="text-xs text-slate-500 leading-normal">
              Register an isolated subdomain template scheme. Base tables, security hashes and storage volumes adapt dynamically.
            </p>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-650 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-805 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-4" id="provision-tenant-form">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company/Authority Name</label>
                <input 
                  type="text"
                  required
                  disabled={loading}
                  placeholder="e.g. Sobha Planners Ltd"
                  value={newTenant.name}
                  onChange={(e) => {
                    const cleanCode = e.target.value.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-");
                    setNewTenant({ ...newTenant, name: e.target.value, code: cleanCode });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:outline-none"
                  id="provision-comp-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Domain Namespace / Subdomain</label>
                <div className="flex items-center gap-1">
                  <input 
                    type="text"
                    required
                    disabled={loading}
                    placeholder="e.g. sobha"
                    value={newTenant.code}
                    onChange={(e) => {
                      const strictCode = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                      setNewTenant({ ...newTenant, code: strictCode });
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono"
                    id="provision-code-input"
                  />
                  <span className="text-xs text-slate-400 font-bold font-mono">.bhoomione.in</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subscription License Tier</label>
                <select
                  disabled={loading}
                  value={newTenant.plan}
                  onChange={(e) => setNewTenant({ ...newTenant, plan: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none"
                  id="provision-plan-select"
                >
                  {plans.map(p => (
                    <option key={p.code} value={p.code}>{p.name} (₹{p.monthlyPrice}/mo)</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => setShowAddTenant(false)}
                  className="flex-1 bg-slate-100 rounded-lg text-slate-755 font-bold text-xs py-2.5 disabled:opacity-50"
                >
                  Close
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-650 hover:bg-indigo-750 text-white rounded-lg font-bold text-xs py-2.5 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Provision Node</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
