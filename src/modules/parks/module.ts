import { BhoomiModuleDefinition } from "../spatial-core/contracts/module.ts";

export const ParksModule: BhoomiModuleDefinition = {
  id: "mod-parks",
  name: "Parks & Open Spaces",
  code: "PKS",
  version: "3.0.0",
  description: "Green buffers, community parks, landscape zoning, and environmental indexes.",
  category: "SELLABLE",
  dependencies: ["maps.workspace", "maps.boundary"],
  permissions: ["parks.view", "parks.manage"],
  toolbarTools: ["park"],
  geometryTypes: ["POLYGON"],
  inspectorPanels: ["PARK_ATTRS"],
  layerDefinitions: ["PARK"],
  validationRules: ["PARK_BUFFER_ZONING_CHECK", "PARK_INTERSECTION_CHECK"],
  searchProviders: ["PARK_NAME", "PARK_TYPE"],
  serializers: ["GEOJSON_SERIALIZER"],
  minimumPlan: "GROWTH",
  entitlementKey: "maps.parks",
  lifecycleHooks: {
    onRegister: () => console.log("BhoomiOne Parks Module registered."),
    onEnable: () => console.log("BhoomiOne Parks Module enabled."),
    onDisable: () => console.log("BhoomiOne Parks Module disabled.")
  }
};
