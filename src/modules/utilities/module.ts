import { BhoomiModuleDefinition } from "../spatial-core/contracts/module.ts";

export const UtilitiesModule: BhoomiModuleDefinition = {
  id: "mod-utilities",
  name: "Utility Network Planning",
  code: "UTL",
  version: "3.0.0",
  description: "Electrical HT/LT overhead routes, sewer, storm, and water supply pipeline networks.",
  category: "SELLABLE",
  dependencies: ["maps.workspace", "maps.boundary"],
  permissions: ["utilities.view", "utilities.manage", "utilities.approve"],
  toolbarTools: ["utility"],
  geometryTypes: ["POINT", "POLYLINE"],
  inspectorPanels: ["UTILITY_ATTRS"],
  layerDefinitions: ["UTILITIES"],
  validationRules: ["UTILITY_DISCONNECTED_SEGMENTS_CHECK", "UTILITY_CROSS_NETWORK_CHECK"],
  searchProviders: ["UTILITY_NAME", "UTILITY_CODE", "NETWORK_TYPE", "UTILITY_TYPE"],
  serializers: ["GEOJSON_SERIALIZER", "SHP_SERIALIZER"],
  minimumPlan: "ENTERPRISE",
  entitlementKey: "maps.utilities",
  lifecycleHooks: {
    onRegister: () => console.log("BhoomiOne Utilities Module registered."),
    onEnable: () => console.log("BhoomiOne Utilities Module enabled."),
    onDisable: () => console.log("BhoomiOne Utilities Module disabled.")
  }
};
