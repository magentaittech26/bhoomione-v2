import { BhoomiModuleDefinition } from "../spatial-core/contracts/module.ts";

export const RoadsModule: BhoomiModuleDefinition = {
  id: "mod-roads",
  name: "Road Planning",
  code: "RDS",
  version: "3.0.0",
  description: "Road alignment, access routes, slab thickness, and curb layout engine.",
  category: "SELLABLE",
  dependencies: ["maps.workspace", "maps.boundary"],
  permissions: ["roads.view", "roads.create", "roads.edit", "roads.delete", "roads.approve"],
  toolbarTools: ["road"],
  geometryTypes: ["POLYLINE"],
  inspectorPanels: ["ROAD_ATTRS"],
  layerDefinitions: ["ROADS"],
  validationRules: ["ROAD_INTERSECTION_NODE_CHECK", "ROAD_OUTSIDE_BOUNDARY_CHECK"],
  searchProviders: ["ROAD_NAME", "ROAD_CODE"],
  serializers: ["GEOJSON_SERIALIZER"],
  minimumPlan: "GROWTH",
  entitlementKey: "maps.roads",
  lifecycleHooks: {
    onRegister: () => console.log("BhoomiOne Road Module registered."),
    onEnable: () => console.log("BhoomiOne Road Module enabled."),
    onDisable: () => console.log("BhoomiOne Road Module disabled.")
  }
};
