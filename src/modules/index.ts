import { BhoomiModuleRegistry } from "./spatial-core/registry/index.ts";
import { BoundaryModule } from "./boundary/module.ts";
import { RoadsModule } from "./roads/module.ts";
import { ParksModule } from "./parks/module.ts";
import { AmenitiesModule } from "./amenities/module.ts";
import { UtilitiesModule } from "./utilities/module.ts";
import { PlotsModule } from "./plots/module.ts";

export { BhoomiModuleRegistry } from "./spatial-core/registry/index.ts";
export type { BhoomiModuleDefinition } from "./spatial-core/contracts/module.ts";

// Pre-register all available BhoomiOne modules
const registry = BhoomiModuleRegistry.getInstance();

try {
  registry.register(BoundaryModule);
  registry.register(RoadsModule);
  registry.register(ParksModule);
  registry.register(AmenitiesModule);
  registry.register(UtilitiesModule);
  registry.register(PlotsModule);
} catch (e) {
  console.warn("Pre-registration warning (could be duplicate hot reloading trigger):", e);
}

/**
 * Global helper to check if a module is licensed & enabled
 */
export function isModuleActive(moduleId: string): boolean {
  return BhoomiModuleRegistry.getInstance().isModuleActive(moduleId);
}

/**
 * Checks if a specific entitlement (SaaS plan item) is owned by the tenant
 */
export function hasEntitlement(entitlement: string): boolean {
  return BhoomiModuleRegistry.getInstance().hasEntitlement(entitlement);
}
