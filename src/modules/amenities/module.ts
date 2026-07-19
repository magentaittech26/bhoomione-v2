import { BhoomiModuleDefinition } from "../spatial-core/contracts/module.ts";

export const AmenitiesModule: BhoomiModuleDefinition = {
  id: "mod-amenities",
  name: "Amenities Planning",
  code: "AMN",
  version: "3.0.0",
  description: "Community centers, commercial facilities, hospitals, and schools spatial placements.",
  category: "SELLABLE",
  dependencies: ["maps.workspace", "maps.boundary"],
  permissions: ["amenities.view", "amenities.manage"],
  toolbarTools: ["amenity"],
  geometryTypes: ["POINT", "POLYGON"],
  inspectorPanels: ["AMENITY_ATTRS"],
  layerDefinitions: ["AMENITIES", "CA"],
  validationRules: ["AMENITY_CAPACITY_CHECK", "AMENITY_MIN_DISTANCE_CHECK"],
  searchProviders: ["AMENITY_NAME", "AMENITY_TYPE"],
  serializers: ["GEOJSON_SERIALIZER"],
  minimumPlan: "ENTERPRISE",
  entitlementKey: "maps.amenities",
  lifecycleHooks: {
    onRegister: () => console.log("BhoomiOne Amenities Module registered."),
    onEnable: () => console.log("BhoomiOne Amenities Module enabled."),
    onDisable: () => console.log("BhoomiOne Amenities Module disabled.")
  }
};
