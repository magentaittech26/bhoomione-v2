import { BhoomiModuleDefinition } from "../spatial-core/contracts/module.ts";

export const BoundaryModule: BhoomiModuleDefinition = {
  id: "mod-boundary",
  name: "Boundary Planning",
  code: "BND",
  version: "3.0.0",
  description: "Plot boundaries, site limit calculations, and vertex coordination engine.",
  category: "SELLABLE",
  dependencies: ["maps.workspace"],
  permissions: ["boundary.view", "boundary.edit"],
  toolbarTools: ["boundary"],
  geometryTypes: ["POLYGON"],
  inspectorPanels: ["BOUNDARY_ATTRS"],
  layerDefinitions: ["BOUNDARY"],
  validationRules: ["BOUNDARY_GAP_CHECK", "BOUNDARY_OVERLAP_CHECK"],
  searchProviders: ["BOUNDARY_NAME", "UNIQUE_CODE"],
  serializers: ["GEOJSON_SERIALIZER"],
  minimumPlan: "LITE",
  entitlementKey: "maps.boundary",
  lifecycleHooks: {
    onRegister: () => console.log("BhoomiOne Boundary Module registered."),
    onEnable: () => console.log("BhoomiOne Boundary Module enabled."),
    onDisable: () => console.log("BhoomiOne Boundary Module disabled.")
  }
};
