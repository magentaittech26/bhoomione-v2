# BhoomiOne Module Dependencies

To maintain platform stability, BhoomiOne's Module Registry implements a structural, compile-time and runtime dependency resolution check.

No dependent module may be activated if its declared prerequisite modules are unlicensed or disabled.

---

## 1. Dependency Resolution Matrix

| Module ID | Module Name | Entitlement Key | Prerequisites | Description |
| :--- | :--- | :--- | :--- | :--- |
| `mod-boundary` | Boundary Engine | `maps.boundary` | `maps.workspace` | Master boundary acts as the container coordinates provider for all objects. |
| `mod-roads` | Road Engine | `maps.roads` | `maps.workspace` | Base spatial network engine. |
| `mod-parks` | Park Engine | `maps.parks` | `maps.workspace` | Depends on workspace rendering nodes. |
| `mod-amenities` | Amenity Engine | `maps.amenities` | `maps.workspace`, `maps.roads` | Amenities depend on the Road Engine to validate entrance road frontage access. |
| `mod-utilities` | Utility Engine | `maps.utilities` | `maps.workspace` | Underground utilities lines. |
| `mod-plots` | Plots Engine | `maps.plots` | `maps.workspace`, `maps.roads` | Plots require Roads to compute facing directions and corner classifications. |

---

## 2. Enforcement Logic

During active checks (`isModuleActive`), the registry recursively resolves dependencies using the following routine:

```typescript
  public isModuleActive(id: string): boolean {
    const mod = this.modules.get(id);
    if (!mod) return false;

    // 1. License Check
    const hasLicense = this.hasEntitlement(mod.entitlementKey);
    // 2. Administrative Status Check
    const isNotDisabled = !this.disabledModules.has(id);
    
    // 3. Recursive Dependency Resolution
    if (hasLicense && isNotDisabled) {
      for (const dep of mod.dependencies) {
        if (dep === "maps.workspace") continue;
        const depMod = Array.from(this.modules.values()).find(m => m.entitlementKey === dep);
        if (depMod && !this.isModuleActive(depMod.id)) {
          return false; // Prerequisite module is missing or inactive
        }
      }
      return true;
    }
    return false;
  }
```

---

## 3. Failure Resolution & Safety
If a dependency check fails:
* **UI Suppression**: Drawing buttons for the dependent module are automatically hidden.
* **Cad Filtering**: Drawing layers are bypassed.
* **Graceful Degradation**: Users are alerted in the toolbars and status logs that certain prerequisites (such as licensing or activation) are unfulfilled, prompting them to upgrade or enable prerequisite packages in the Tenant Subscription Store.
