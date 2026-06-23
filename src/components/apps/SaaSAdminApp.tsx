import React, { useState, useEffect } from "react";
import api from "../../lib/api.ts";
import AdminLogin from "../AdminLogin.tsx";
import { UserProfile } from "../../types/auth.ts";
import { 
  ShieldAlert, Database, Users, Activity, TrendingUp, Server, Plus, Check, RefreshCw, Globe, Settings, CreditCard, Layers, LogOut, Sliders, Terminal, Clock, AlertTriangle, ToggleLeft, ToggleRight, Trash2, Edit3, Shield, Box, Zap, DollarSign, Calendar, SlidersHorizontal, Info, Play, CheckCircle, X, LayoutDashboard
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
    | "plan-feature-matrix"
    | "usage-limits"
    | "plot-billing"
    | "addons"
    | "global-parameters"
    | "feature-catalog"
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
  const [modules, setModules] = useState<SaasModule[]>([
    { name: "SaaS Admin Core", code: "SAAS_ADMIN", group: "System", description: "Global multi-tenant supervisory console and DNS cluster config.", status: "ACTIVE", isCore: true, isBillable: false, sortOrder: 1, defaultFeatureAccess: [] },
    { name: "Tenant Workspace", code: "TENANT_WORKSPACE", group: "System", description: "Self-service tenant environment routing framework.", status: "ACTIVE", isCore: true, isBillable: false, sortOrder: 2, defaultFeatureAccess: [] },
    { name: "Projects Catalog", code: "PROJECTS", group: "Core Planning", description: "Design, catalog, track, and administer township real estate projects.", status: "ACTIVE", isCore: false, isBillable: true, sortOrder: 3, defaultFeatureAccess: [] },
    { name: "Layout Subdivisions", code: "LAYOUTS", group: "Core Planning", description: "Phased land parcel plans and sector map zoning layouts.", status: "ACTIVE", isCore: false, isBillable: true, sortOrder: 4, defaultFeatureAccess: [] },
    { name: "Plot Parcels Registry", code: "PLOTS", group: "Core Planning", description: "Individual tract plots inventory ledger catalog with custom attributes.", status: "ACTIVE", isCore: false, isBillable: true, sortOrder: 5, defaultFeatureAccess: [] },
    { name: "Customer Management", code: "CUSTOMERS", group: "CRM", description: "All-inclusive lead nurturing, contact profiles, and buyer records.", status: "ACTIVE", isCore: false, isBillable: true, sortOrder: 6, defaultFeatureAccess: [] },
    { name: "Agent Workspace", code: "AGENTS", group: "CRM", description: "Broker network controls, dynamic agent performance, and metrics.", status: "ACTIVE", isCore: false, isBillable: true, sortOrder: 7, defaultFeatureAccess: [] },
    { name: "Interactive Map", code: "INTERACTIVE_MAP", group: "Integrations", description: "Realtime SVG CAD mapper with plot reservation visual indicators.", status: "ACTIVE", isCore: false, isBillable: true, sortOrder: 8, defaultFeatureAccess: [] },
    { name: "DXF Engine Parser", code: "DXF_ENGINE", group: "Integrations", description: "Heavy CAD drawing parser to translate design diagrams into databases.", status: "ACTIVE", isCore: false, isBillable: true, sortOrder: 9, defaultFeatureAccess: [] },
    { name: "WhatsApp Integrations", code: "WHATSAPP", group: "Integrations", description: "Automated direct trigger alerts on user reservation checkouts.", status: "ACTIVE", isCore: false, isBillable: true, sortOrder: 10, defaultFeatureAccess: [] }
  ]);

  // Feature Catalog
  const [features, setFeatures] = useState<SaasFeature[]>([
    { name: "Township projects catalog", code: "PROJECTS", moduleCode: "PROJECTS", group: "Core Planning", description: "Create and scale township planning models.", status: "ACTIVE", defaultEnabled: true },
    { name: "Subdivision planning tool", code: "LAYOUTS", moduleCode: "LAYOUTS", group: "Core Planning", description: "Zoned sector plans and division lines.", status: "ACTIVE", defaultEnabled: true },
    { name: "Physical lot registers", code: "PLOTS", moduleCode: "PLOTS", group: "Core Planning", description: "Assign coordinates, lot numbers and PLC rates.", status: "ACTIVE", defaultEnabled: true },
    { name: "Buyer records logs", code: "CUSTOMERS", moduleCode: "CUSTOMERS", group: "CRM", description: "Manage customer profiles and reservation ledgers.", status: "ACTIVE", defaultEnabled: true },
    { name: "Broker agent scorecard", code: "AGENTS", moduleCode: "AGENTS", group: "CRM", description: "Keep logs on external broker sales targets and payouts.", status: "ACTIVE", defaultEnabled: true },
    { name: "DXF CAD Drawing upload", code: "DXF_UPLOAD", moduleCode: "DXF_ENGINE", group: "Integrations", description: "Render canvas lots directly out of dynamic .dxf blueprints.", status: "ACTIVE", defaultEnabled: true },
    { name: "Interactive property layouts", code: "MAP_INTERACTION", moduleCode: "INTERACTIVE_MAP", group: "Integrations", description: "Visual parcel lockups on mapping widgets.", status: "ACTIVE", defaultEnabled: true },
    { name: "Automated reservation alerts", code: "WHATSAPP_TRIGGERS", moduleCode: "WHATSAPP", group: "Integrations", description: "Automatic WhatsApp broadcast warnings on payment locks.", status: "ACTIVE", defaultEnabled: true },
    { name: "Custom API client keys", code: "API_ACCESS", moduleCode: "SAAS_ADMIN", group: "System", description: "Export telemetry datasets to external ERP software.", status: "ACTIVE", defaultEnabled: true }
  ]);

  // Subscription Plans
  const [plans, setPlans] = useState<SubscriptionPlan[]>([
    { name: "Starter Package", code: "STARTER", monthlyPrice: 99, yearlyPrice: 990, trialDays: 14, status: "ACTIVE", sortOrder: 1 },
    { name: "Growth Engine", code: "GROWTH", monthlyPrice: 249, yearlyPrice: 2490, trialDays: 14, status: "ACTIVE", sortOrder: 2 },
    { name: "Professional Plus", code: "PROFESSIONAL", monthlyPrice: 499, yearlyPrice: 4990, trialDays: 30, status: "ACTIVE", sortOrder: 3 },
    { name: "Enterprise Custom", code: "ENTERPRISE", monthlyPrice: 999, yearlyPrice: 9990, trialDays: 30, status: "ACTIVE", sortOrder: 4 }
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
    { id: "slab_1", minPlots: 1, maxPlots: 50, monthlyPrice: 15, yearlyPrice: 150, status: "ACTIVE" },
    { id: "slab_2", minPlots: 51, maxPlots: 200, monthlyPrice: 40, yearlyPrice: 400, status: "ACTIVE" },
    { id: "slab_3", minPlots: 201, maxPlots: 500, monthlyPrice: 75, yearlyPrice: 750, status: "ACTIVE" },
    { id: "slab_4", minPlots: 501, maxPlots: 99999, monthlyPrice: 150, yearlyPrice: 1500, status: "ACTIVE" }
  ]);

  // Add-ons
  const [addons, setAddons] = useState<AddonCatalogItem[]>([
    { name: "Interactive Township Map", code: "INTERACTIVE_MAP_ADDON", monthlyPrice: 35, yearlyPrice: 350, status: "ACTIVE", description: "Enables customers to pick and book township plot positions on customized canvas overlays." },
    { name: "Heavy DXF Upload Parser", code: "DXF_ENGINE_ADDON", monthlyPrice: 50, yearlyPrice: 500, status: "ACTIVE", description: "Batch load AutoCAD .dxf configurations dynamically straight to individual tables." },
    { name: "WhatsApp checkout triggers", code: "WHATSAPP_ADDON", monthlyPrice: 20, yearlyPrice: 200, status: "ACTIVE", description: "Configure custom template alerts notifying buyers about broker updates." },
    { name: "Custom Domain Mapping SSL", code: "CUSTOM_DOMAIN_ADDON", monthlyPrice: 15, yearlyPrice: 150, status: "ACTIVE", description: "Proxy workspace containers onto localized web addresses securely." }
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

      const [modulesData, plansData, addonsData, slabsData] = await Promise.all([
        api.fetchSaasModules(),
        api.fetchSaasPlans(),
        api.fetchSaasAddons(),
        api.fetchSaasSlabs()
      ]);

      if (modulesData) setModules(modulesData);

      // Flatten saas_features nested in modules Data
      const allFeatures: SaasFeature[] = [];
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
              defaultEnabled: f.defaultEnabled
            });
          });
        }
      });
      if (allFeatures.length > 0) {
        setFeatures(allFeatures);
      }

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
        status: sObj.status
      });
      showToast("Plot capacity slab status updated!", "success");
      await loadSaasConfig();
    } catch (err) {
      console.error("Failed to update plot billing slab:", err);
      showToast("Failed to update dynamic capacity slab.", "error");
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
            { id: "audit-logs", label: "Audit Logs", icon: Terminal },
            { id: "global-parameters", label: "Settings", icon: Settings },
          ].map(t => {
            const Icon = t.icon;
            // Map active state properly to handle both top-level and inner-tabs
            const isSelected = activeTab === t.id || 
              (t.id === "subscription-center" && ["plan-master", "plan-feature-matrix", "usage-limits", "plot-billing", "addons"].includes(activeTab)) ||
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
                 ["plan-master", "plan-feature-matrix", "usage-limits", "plot-billing", "addons"].includes(activeTab) ? "Subscription Center" :
                 ["module-registry", "feature-catalog"].includes(activeTab) ? "Module Registry" :
                 activeTab === "tenant-overrides" ? "Tenant Overrides overrides" :
                 activeTab === "audit-logs" ? "Telemetry Audit Logs" : "System Settings"}
              </span>
            </div>
            <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mt-0.5" id="header-main-title">
              {activeTab === "mrr-dashboard" ? "Revenue & Operations Analytics Dashboard" :
               activeTab === "tenant-registry" ? "Active Tenant Workspace Clusters" :
               ["plan-master", "plan-feature-matrix", "usage-limits", "plot-billing", "addons"].includes(activeTab) ? "Global Subscription Center / Pricing Packages" :
               ["module-registry", "feature-catalog"].includes(activeTab) ? "Platform Module Registry & Features Catalog" :
               activeTab === "tenant-overrides" ? "Dynamic Tenant Overrides Plan Manager" :
               activeTab === "audit-logs" ? "Telemetry Ingress Audit Logs Streams" : "DNS & Network Settings"}
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
          {["plan-master", "plan-feature-matrix", "usage-limits", "plot-billing", "addons"].includes(activeTab) && (
            <div className="flex border-b border-slate-200 overflow-x-auto gap-1 bg-white p-2 rounded-xl border mb-6 shadow-3xs shrink-0">
              {[
                { id: "plan-master", label: "Plans", icon: DollarSign },
                { id: "plan-feature-matrix", label: "Feature Matrix", icon: SlidersHorizontal },
                { id: "usage-limits", label: "Usage Limits", icon: Sliders },
                { id: "plot-billing", label: "Plot Billing", icon: Layers },
                { id: "addons", label: "Add-ons", icon: Shield }
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
        
        {activeTab === "tenant-registry" && (
          <div className="space-y-6" id="saas-tab-clusters">
            
            {/* Real stats row synced with persistent data calculations */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-1">
                <p className="text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Workspace Clusters</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-slate-900">{tenants.length}</p>
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-[10px] text-slate-500">Live matched domain networks</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-1">
                <p className="text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Dynamic Subscribed Add-ons</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-slate-905">
                    {Object.values(tenantSubscriptions).reduce((sum, s) => sum + s.addOnCodes.length, 0)}
                  </p>
                  <Shield className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-[10px] text-slate-500">Self-service integrations assigned</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-1">
                <p className="text-[10px] uppercase text-slate-400 font-extrabold tracking-wider">Current Licensing MRR</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-slate-900">
                    ${(() => {
                      let total = 0;
                      Object.values(tenantSubscriptions).forEach(sub => {
                        if (sub.status === "ACTIVE" || sub.status === "TRIAL") {
                          const plan = plans.find(p => p.code === sub.currentPlanCode);
                          if (plan) total += plan.monthlyPrice;
                          sub.addOnCodes.forEach(acode => {
                            const add = addons.find(a => a.code === acode);
                            if (add) total += add.monthlyPrice;
                          });
                        }
                      });
                      return total.toLocaleString();
                    })()} / mo
                  </p>
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-[10px] text-slate-500">Aggregate platform subscription receipts</p>
              </div>
            </div>

            {/* Clusters table list */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Tenant Workspace Clusters</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Control workspace configurations, customize usage limits, configure overrides or change subscription packages live.
                  </p>
                </div>
                <button 
                  onClick={loadTenants}
                  disabled={loadingTenants}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingTenants ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {tenantsError && (
                <div className="p-4 bg-red-50 border border-red-150 rounded-xl flex items-center gap-3 text-red-750 text-xs">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">Failed to fetch subdomain database records</p>
                    <p className="text-[11px] text-slate-500">{tenantsError}</p>
                  </div>
                  <button onClick={loadTenants} className="bg-red-100 hover:bg-red-200 text-red-800 font-bold px-3 py-1.5 rounded-lg">
                    Retry Synchronization
                  </button>
                </div>
              )}

              {loadingTenants && (
                <div className="space-y-3 py-4 animate-pulse">
                  <div className="h-8 bg-slate-100 rounded-lg w-full" />
                  <div className="h-10 bg-slate-50 rounded-lg w-full" />
                  <div className="h-10 bg-slate-50 rounded-lg w-full" />
                </div>
              )}

              {!loadingTenants && !tenantsError && tenants.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3 font-sans">
                  <Globe className="w-6 h-6 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-semibold text-slate-900">No active tenant databases resolved</h3>
                  <p className="text-xs text-slate-500">Run Provision Workspace to set up database schemas.</p>
                </div>
              )}

              {/* Dynamic synchronized clusters list */}
              {!loadingTenants && !tenantsError && tenants.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-650">
                    <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="px-5 py-3">Tenant Name & Workspace</th>
                        <th className="px-5 py-3">Inbound DNS Mapping</th>
                        <th className="px-5 py-3 text-center">Active Add-ons</th>
                        <th className="px-5 py-3 text-center">Active Price Tier</th>
                        <th className="px-5 py-3 text-center">Calculated MRR</th>
                        <th className="px-5 py-3 text-center">Workspace Status</th>
                        <th className="px-5 py-3 text-right">Licensing Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tenants.map(t => {
                        const currentPlan = getSubbedPlanForTenant(t.code, t.plan || "GROWTH");
                        const sub = tenantSubscriptions[t.code];
                        const countAddons = sub ? sub.addOnCodes.length : 0;
                        const finalStatus = getSubbedStatusForTenant(t.code, t.status || "ACTIVE");

                        // Addon contribution rate
                        let totalCost = 0;
                        const planObj = plans.find(p => p.code === currentPlan);
                        if (planObj) totalCost += planObj.monthlyPrice;
                        if (sub) {
                          sub.addOnCodes.forEach(code => {
                            const add = addons.find(a => a.code === code);
                            if (add) totalCost += add.monthlyPrice;
                          });
                        }

                        return (
                          <tr key={t.id} className="hover:bg-slate-50/50 font-sans">
                            <td className="px-5 py-4">
                              <div>
                                <p className="text-xs font-bold text-slate-950">{t.name}</p>
                                <p className="text-[10px] text-indigo-600 font-semibold font-mono uppercase mt-0.5">ns: {t.code}</p>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-[11px] font-mono">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-150 select-all">
                                {t.code}.bhoomione.in
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                                countAddons > 0 ? "bg-emerald-50 text-emerald-805 border" : "bg-slate-50 text-slate-400"
                              }`}>
                                {countAddons > 0 ? `✓ ${countAddons} Add-on` : "None"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center font-bold">
                              <span className="bg-slate-900 text-white font-mono rounded px-1.5 py-0.5 text-[10px] border">
                                {currentPlan}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center font-mono font-extrabold text-emerald-705">
                              ${totalCost}/mo
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                finalStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-805 border border-emerald-150" :
                                finalStatus === "TRIAL" ? "bg-indigo-50 text-indigo-805 border border-indigo-150" :
                                "bg-red-50 text-red-805 border border-red-150"
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${finalStatus === "ACTIVE" || finalStatus === "TRIAL" ? "bg-emerald-505 bg-emerald-500" : "bg-red-500"}`} />
                                {finalStatus}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => setSelectedTenantSub(t)}
                                className="bg-slate-950 hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 justify-end ml-auto transition-all cursor-pointer border border-transparent shadow-2xs"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                Custom Sub
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase 1E Plan Master */}
        {activeTab === "plan-master" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fadeIn">
            <PlanFeatureMatrixTab 
              defaultTab="tiers"
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

        {/* Phase 1E Plan Feature Matrix */}
        {activeTab === "plan-feature-matrix" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fadeIn">
            <PlanFeatureMatrixTab 
              defaultTab="matrix"
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

        {/* Phase 1E Usage Limits */}
        {activeTab === "usage-limits" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fadeIn">
            <PlanFeatureMatrixTab 
              defaultTab="limits"
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

        {/* Phase 1E Module Registry Directory */}
        {activeTab === "module-registry" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fadeIn">
            <ModuleRegistryTab 
              defaultTab="modules"
              modules={modules}
              features={features}
              onAddModule={handleAddModule}
              onUpdateModule={handleUpdateModule}
              onAddFeature={handleAddFeature}
              onUpdateFeature={handleUpdateFeature}
            />
          </div>
        )}

        {/* Phase 1E Feature Catalog */}
        {activeTab === "feature-catalog" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fadeIn">
            <ModuleRegistryTab 
              defaultTab="features"
              modules={modules}
              features={features}
              onAddModule={handleAddModule}
              onUpdateModule={handleUpdateModule}
              onAddFeature={handleAddFeature}
              onUpdateFeature={handleUpdateFeature}
            />
          </div>
        )}

        {/* Phase 1E Plot Billing */}
        {activeTab === "plot-billing" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fadeIn font-sans">
            <AddonsBillingTab 
              defaultTab="slabs"
              slabs={slabs}
              addons={addons}
              onAddSlab={handleAddSlab}
              onUpdateSlab={handleUpdateSlab}
              onDeleteSlab={(id) => setSlabs(slabs.filter(s => s.id !== id))}
              onAddAddon={handleAddAddon}
              onUpdateAddon={handleUpdateAddon}
            />
          </div>
        )}

        {/* Phase 1E Add-ons */}
        {activeTab === "addons" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-fadeIn font-sans font-sans">
            <AddonsBillingTab 
              defaultTab="addons"
              slabs={slabs}
              addons={addons}
              onAddSlab={handleAddSlab}
              onUpdateSlab={handleUpdateSlab}
              onDeleteSlab={(id) => setSlabs(slabs.filter(s => s.id !== id))}
              onAddAddon={handleAddAddon}
              onUpdateAddon={handleUpdateAddon}
            />
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs" id="saas-tab-logs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-150">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase">Telemetry Audit Log Streams</h2>
                <p className="text-xs text-slate-500 mt-0.5">Raw telemetry records from system gateways.</p>
              </div>
              <button 
                onClick={loadAuditLogs}
                disabled={loadingLogs}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                Refresh Logs
              </button>
            </div>

            {logsError && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs shadow-sm font-sans">
                <p className="font-semibold">Telemetry extraction neglected</p>
                <p className="text-red-655 mt-0.5">{logsError}</p>
              </div>
            )}

            {loadingLogs && (
              <div className="space-y-3 py-4 animate-pulse">
                <div className="h-10 bg-slate-105 rounded-lg w-full" />
                <div className="h-10 bg-slate-105 rounded-lg w-full" />
              </div>
            )}

            {!loadingLogs && !logsError && auditLogs.length === 0 && (
              <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <Terminal className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">No stream logs cached.</p>
              </div>
            )}

            {!loadingLogs && !logsError && auditLogs.length > 0 && (
              <div className="space-y-3 font-mono text-[11px]">
                {auditLogs.map(l => (
                  <div key={l.id} className="p-4 bg-slate-905 bg-slate-900 text-slate-200 border border-slate-950 rounded-xl space-y-2">
                    <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-1">
                      <span className="font-bold text-indigo-400">{l.action}</span>
                      <span className="flex items-center gap-1 text-[10px]">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(l.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-100 font-sans text-xs">{l.details || `Triggered action: ${l.action}`}</p>
                    <p className="text-[10px] text-slate-500">operator: {l.operator} • target: {l.target}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Global configuration params */}
        {activeTab === "global-parameters" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs" id="saas-tab-settings font-sans">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase">Global DNS Parameters</h2>
              <p className="text-xs text-slate-500 mt-1">Configure global hostname resolution policies and API gateway ports.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-750 font-sans">
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Workspace Routing Protocol</h4>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Strict cluster domain names mapping</span>
                      <span className="text-emerald-700 font-bold uppercase text-[9px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Active Enforced</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Dynamic automated Nginx DNS schemas</span>
                      <span className="text-emerald-700 font-bold uppercase text-[9px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Active Enforced</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Base Cluster Quotas</h4>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-500">Multi-tenant limits policy</span>
                      <span className="font-bold text-slate-850">Subscription Enforced</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-slate-500">Plot list table sizes boundary</span>
                      <span className="font-bold text-slate-850">Dynamic Overridable</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Gateway Ingress Port Nodes</h4>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-xs">Sandbox Networking Connection</p>
                    <p className="text-slate-500 leading-normal text-xs text-slate-650">
                      The supervisor container matches ingress bindings to IP address <strong className="font-mono text-slate-705">0.0.0.0</strong> corresponding to port <strong className="font-mono text-slate-750">3000</strong>. This secures single-source proxies perfectly.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
                    <Server className="w-4 h-4 text-slate-550" />
                    <span>BhoomiOne Proxy Core Node 3.5.21V</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
