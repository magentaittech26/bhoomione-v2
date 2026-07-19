import { BhoomiModuleDefinition } from "../spatial-core/contracts/module.ts";

export const PlotsModule: BhoomiModuleDefinition = {
  id: "mod-plots",
  name: "Plot Inventory",
  code: "PLT",
  version: "3.0.0",
  description: "Subdivide site boundaries into residential, commercial, or industrial plots.",
  category: "SELLABLE",
  dependencies: ["maps.workspace", "maps.boundary"],
  permissions: ["plots.view", "plots.edit"],
  toolbarTools: ["plot"],
  geometryTypes: ["POLYGON"],
  inspectorPanels: ["PLOT_ATTRS"],
  layerDefinitions: ["PLOTS"],
  validationRules: ["PLOT_MIN_SIZE_CHECK", "PLOT_FRONTAGE_CHECK"],
  searchProviders: ["PLOT_NUMBER"],
  serializers: ["GEOJSON_SERIALIZER"],
  minimumPlan: "GROWTH",
  entitlementKey: "maps.plots",
  lifecycleHooks: {
    onRegister: () => console.log("BhoomiOne Plot Module registered."),
    onEnable: () => console.log("BhoomiOne Plot Module enabled."),
    onDisable: () => console.log("BhoomiOne Plot Module disabled.")
  }
};
