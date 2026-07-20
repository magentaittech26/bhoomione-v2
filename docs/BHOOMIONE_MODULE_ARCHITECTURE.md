# BhoomiOne Module Architecture

BhoomiOne is architected as a modular, enterprise-grade SaaS spatial planning platform. This document defines the module registration registry, contracts, lifecycle hook triggers, and the integration points across the client-side CAD engine and UI layers.

---

## 1. Architectural Strategy

The platform allows tenants to subscribe to specific commercial plans and modular features. To support independent licensing and deployment, all spatial features are encapsulated inside formal, self-contained **BhoomiOne Modules**. 

No tool, validation rule, inspector tab, or viewport rendering layer should ever be hardcoded; instead, they are requested dynamically from the centralized **BhoomiModuleRegistry**.

### Key Tenets:
1. **Decoupled Registration**: All modular engines are registered at application bootstrap.
2. **Entitlement Isolation**: Licensing and active entitlements (SaaS billing flags) dictate whether a module is active.
3. **No Redesign / Frozen UI Layout**: The visual UX is completely frozen; modularity operates behind the scenes dynamically filtering existing panels and viewport layers.

---

## 2. Core Contracts & Types

Located in `src/modules/spatial-core/contracts/module.ts`, the `BhoomiModuleDefinition` interface specifies how modules register metadata, capabilities, and lifecycle hooks:

```typescript
export interface BhoomiModuleLifecycleHooks {
  onRegister?: () => void;
  onEnable?: () => void;
  onDisable?: () => void;
}

export interface BhoomiModuleDefinition {
  id: string;             // Unique identifier (e.g. "mod-roads")
  name: string;           // Human-readable name
  group: "core" | "spatial" | "utilities" | "commercial";
  entitlementKey: string; // SaaS database license key (e.g. "maps.roads")
  dependencies: string[]; // List of other module entitlement keys
  version: string;
  lifecycleHooks?: BhoomiModuleLifecycleHooks;
}
```

---

## 3. The Central Module Registry

The `BhoomiModuleRegistry` operates as a thread-safe singleton, serving as the central authority for module state, entitlements, and lifecycle transitions:

```typescript
export class BhoomiModuleRegistry {
  private static instance: BhoomiModuleRegistry;
  private modules: Map<string, BhoomiModuleDefinition> = new Map();
  private tenantEntitlements: Set<string> = new Set();
  private disabledModules: Set<string> = new Set();

  public static getInstance(): BhoomiModuleRegistry {
    if (!BhoomiModuleRegistry.instance) {
      BhoomiModuleRegistry.instance = new BhoomiModuleRegistry();
    }
    return BhoomiModuleRegistry.instance;
  }

  public register(module: BhoomiModuleDefinition): void;
  public setEntitlements(keys: string[]): void;
  public isModuleActive(id: string): boolean;
}
```

---

## 4. Lifecycle Integration & Engine Hooks

Modules can react to state changes (e.g., subscription upgrades or administrative toggles) through lifecycle hooks:
* **onRegister**: Triggered during application bootstrapping when the module registers.
* **onEnable**: Executed when a previously disabled module is enabled (manually or by license renewal).
* **onDisable**: Executed when a module is locked out, freeing resources or resetting active tools.

---

## 5. UI & Viewport CAD Engine Integration

### A. Toolbar & Hotkeys
* Hides module buttons when corresponding licensing isn't met.
* Disables keyboard shortcuts (e.g., `B`, `R`, `P`, `G`, `A`, `U`) through centralized checks, redirecting the user back to standard Select Tool mode.

### B. Viewport & Layers Render Cycle
* The `CanvasViewportEngine` runs checks during layout drawing to bypass disabled layers entirely, preventing unauthorized asset rendering.

### C. Validation Suite
* Dynamic bypass filters inside `runValidationSuite` ensure that rules associated with unlicensed features are not processed, conserving compute resources.

---

## 6. Backend Authorization & Sprint 6B Security Hardening

To satisfy production-security compliance, frontend visibility is not considered authorization. Every persistent operation targeting the Plot Module must be validated on the backend.

### A. Core Security Verification Strategy (`verifyPlotAccess`)
All CAD import, layout, asset management, and plot mutation endpoints utilize the centralized, relation-aware `verifyPlotAccess` gateway:
1. **Subscription Enforcement**: Validates that the active tenant has an `ACTIVE` or `TRIAL` subscription status and that the expiration timestamp has not passed.
2. **Feature Entitlements**: Ensures the tenant's current subscription plan permits the `maps.plots` entitlement (`PLOTS` feature is `ENABLED`).
3. **Cross-Tenant Context Isolation**: Dynamically resolves and matches relationship boundaries (Plot -> Layout -> Project -> Tenant) to prevent parameter tampering or cross-tenant UUID injection. Any access mismatch fails closed and returns `404 Not Found`.

### B. Dynamic Permission Resolution
The backend dynamically intercepts request payloads to deduce high-severity operations:
* **plots.split**: Escalated when `dimensions_metadata` contains `split_from_plot_id`.
* **plots.merge**: Escalated when `dimensions_metadata` contains `merged_from_plot_ids`.
* **plots.renumber**: Escalated when a PUT request attempts to change the `plot_number` field.

### C. Commercial Plot Lifecycle Integrity
Commercial plots are strictly restricted to `DRAFT`, `VALIDATED`, and `APPROVED` statuses. Transitioning commercial plots to consumer states (e.g., `BOOKED`, `SOLD`, `CANCELLED`) is hard-blocked at the database and API level.

### D. Production Environment QA Simulation Locking
To safeguard production releases:
* The interactive QA Simulation panel is completely hidden and compiled out of client views when `VITE_ENABLE_QA_SIMULATION !== "true"`.
* Bypasses written in the browser console cannot compromise security because the backend does not rely on frontend-simulated roles or entitlements.

