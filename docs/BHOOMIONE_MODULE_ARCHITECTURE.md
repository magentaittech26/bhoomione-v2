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
