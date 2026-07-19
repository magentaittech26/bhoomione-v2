import { WorkspaceTool } from "../../../components/MapWorkspace/types.ts";

export interface BhoomiModuleDefinition {
  id: string;
  name: string;
  code: string;
  version: string;
  description: string;
  category: "CORE" | "SELLABLE" | "ADDON";
  dependencies: string[];
  optionalDependencies?: string[];
  permissions: string[];
  routes?: string[];
  navigationItems?: Array<{
    id: string;
    label: string;
    icon: string;
    path: string;
  }>;
  toolbarTools?: WorkspaceTool[];
  drawingTools?: string[];
  geometryTypes?: string[];
  inspectorPanels?: string[];
  layerDefinitions?: string[];
  validationRules?: string[];
  searchProviders?: string[];
  serializers?: string[];
  settingsSchema?: any;
  usageMetrics?: string[];
  featureFlags?: string[];
  lifecycleHooks?: {
    onRegister?: () => void;
    onEnable?: () => void;
    onDisable?: () => void;
  };
  minimumPlan?: "LITE" | "GROWTH" | "ENTERPRISE" | "SCALE";
  entitlementKey: string;
}
