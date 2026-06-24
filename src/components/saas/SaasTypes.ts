export interface SaasModule {
  id?: string;
  name: string;
  code: string;
  group: string;
  description: string;
  status: "ACTIVE" | "DISABLED";
  isCore: boolean;
  isBillable: boolean;
  defaultFeatureAccess: string[];
  sortOrder: number;
  tierRequirement?: "ALL" | "GROWTH_PLUS" | "PROFESSIONAL_PLUS" | "ENTERPRISE_ONLY";
}

export interface SaasFeature {
  id?: string;
  name: string;
  code: string;
  moduleCode: string;
  group: string;
  description: string;
  status: "ACTIVE" | "DISABLED";
  defaultEnabled: boolean;
}

export interface SubscriptionPlan {
  id?: string;
  name: string;
  code: string;
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
  status: "ACTIVE" | "DISABLED";
  sortOrder: number;
}

export interface PlanLimits {
  projectsLimit: number; // -1 for unlimited
  layoutsLimit: number;
  plotsLimit: number;
  customersLimit: number;
  usersLimit: number;
  agentsLimit: number;
  storageLimitGb: number;
  documentsLimit: number;
  dxfFilesLimit: number;
  marketplaceListingsLimit: number;
  apiCallsLimit: number;
  whatsAppMessagesLimit: number;
  aiCreditsLimit: number;
}

export interface PlotBillingSlab {
  id?: string;
  minPlots: number;
  maxPlots: number;
  monthlyPrice: number;
  yearlyPrice: number;
  oneTimeLicensePrice?: number;
  amcPrice?: number;
  sortOrder?: number;
  status: "ACTIVE" | "DISABLED";
}

export interface AddonCatalogItem {
  id?: string;
  name: string;
  code: string;
  monthlyPrice: number;
  yearlyPrice: number;
  oneTimePrice?: number;
  status: "ACTIVE" | "DISABLED";
  description: string;
  addon_type?: "FEATURE" | "CAPACITY" | "SERVICE";
  feature_code?: string;
  limit_key?: string;
  limit_increment?: number;
}

export interface TenantSubscription {
  tenantId: string;
  tenantCode: string;
  currentPlanCode: string;
  status: "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED" | "ARCHIVED";
  addOnCodes: string[];
  subscriptionStartDate: string;
  subscriptionExpiryDate: string;
  trialExpiryDate: string;
  renewalDate: string;
  featureOverrides: Record<string, "ENABLED" | "DISABLED" | "DEFAULT">;
  limitOverrides: Partial<PlanLimits>;
}
