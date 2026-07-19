# BhoomiOne Module Development Standard

To ensure maintainability, code quality, and strict commercial encapsulation, all future developer additions to the BhoomiOne GIS and layout workspace must adhere to this standard.

---

## 1. Directory Structure

Every module must be self-contained in its own directory under `src/modules/`:

```text
src/modules/
  ├── spatial-core/        <-- Central registry and base contracts
  ├── boundary/            <-- Perimeter Boundary module
  ├── roads/               <-- Roads network module
  └── [new-module-name]/   <-- Your new module directory
        ├── module.ts      <-- Module Definition file (implements BhoomiModuleDefinition)
        └── ...            <-- Module-specific components/hooks (optional)
```

---

## 2. Module Definition Code Template

The `module.ts` file must export a single, immutable, non-const `BhoomiModuleDefinition` configuration object:

```typescript
import { BhoomiModuleDefinition } from "../spatial-core/contracts/module.ts";

export const MyNewModule: BhoomiModuleDefinition = {
  id: "mod-my-feature",
  name: "Advanced Analytics Engine",
  group: "spatial",
  entitlementKey: "maps.analytics",
  dependencies: ["maps.workspace"],
  version: "1.0.0",
  lifecycleHooks: {
    onRegister: () => {
      console.log("Advanced Analytics Engine Registered successfully.");
    },
    onEnable: () => {
      console.log("Advanced Analytics is now ACTIVE and available in workspace.");
    },
    onDisable: () => {
      console.log("Advanced Analytics disabled. Cleaning up analytics buffers.");
    }
  }
};
```

---

## 3. Global Boot Registration

Your module **MUST** be pre-registered during application bootstrap. Add your module import and registry call inside `src/modules/index.ts`:

```typescript
import { MyNewModule } from "./[new-module-name]/module.ts";

// Inside the registry.register block:
try {
  registry.register(BoundaryModule);
  registry.register(RoadsModule);
  registry.register(ParksModule);
  registry.register(AmenitiesModule);
  registry.register(UtilitiesModule);
  registry.register(PlotsModule);
  registry.register(MyNewModule); // <-- Register your new module here
} catch (e) {
  console.warn("Pre-registration warning:", e);
}
```

---

## 4. UI & Canvas Coding Safeguard Mandates

When writing drawing engines, inspector panels, toolbar items, or validation algorithms, hardcoding is strictly forbidden. Apply the following checks:

### A. React UI Guards
Wrap component sections or lists with the reactive `isModuleActive` helper:
```typescript
import { isModuleActive } from "../../modules/index.ts";

{isModuleActive("mod-my-feature") && (
  <button onClick={handleMyFeatureAction}>
    Run Analytics
  </button>
)}
```

### B. Canvas Rendering Loop Filters
Verify module availability before drawing geometry layers:
```typescript
if (!isModuleActive("mod-my-feature")) {
  return; // Early exit, do not render or clear canvas buffers
}
```

### C. Backend & Input Validation Filtering
Ensure validation steps are conditionally run based on active module states:
```typescript
if (isModuleActive("mod-my-feature")) {
  const customWarnings = runAnalyticsValidations(objects);
  warnings.push(...customWarnings);
}
```
---
By keeping all features decoupled, we maintain code cleanliness and robust commercializability!
