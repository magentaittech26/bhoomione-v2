# BhoomiOne V3 – Default Resolution Engine Specification

The **Default Resolution Engine** is responsible for establishing fallback behaviors and context-specific defaults across all master data elements in the BhoomiOne platform. In multi-tenant environments with highly localized geographic operations, hardcoded defaults are insufficient. This engine resolves values dynamically based on a rigid priority hierarchy.

---

## 1. The Preference Hierarchy

Whenever a master record value (e.g., standard area measurement unit, road width format, or tax rate code) is requested within a given context, the engine resolves the target record ID by evaluating configurations from top to bottom:

$$\text{Resolved Value} = \text{User Preference} \succ \text{Project Default} \succ \text{Tenant Default} \succ \text{System Default}$$

```
   ┌─────────────────────────────────────────────────────────┐
   │ 1. User Preference (Local Browser / Session Cache)     │
   └───────────────────────────┬─────────────────────────────┘
                               │ (Not Set)
                               ▼
   ┌─────────────────────────────────────────────────────────┐
   │ 2. Project Default (Linked Project configuration)       │
   └───────────────────────────┬─────────────────────────────┘
                               │ (Not Set / Null)
                               ▼
   ┌─────────────────────────────────────────────────────────┐
   │ 3. Tenant Default (Organization settings panel)          │
   └───────────────────────────┬─────────────────────────────┘
                               │ (Not Set / Null)
                               ▼
   ┌─────────────────────────────────────────────────────────┐
   │ 4. System Default (Bootstrapped standard records)       │
   └─────────────────────────────────────────────────────────┘
```

---

## 2. Core Resolution Logic (TypeScript)

The following helper functions outline how the client application and backend microservices evaluate and resolve contextual settings dynamically.

```typescript
interface ResolutionContext {
  userId?: string;
  projectId?: string;
  tenantId?: string;
}

export async function resolveDefaultMasterRecord(
  masterCode: string,
  context: ResolutionContext,
  availableMasters: any[]
): Promise<any> {
  // Step 1: Check User Preference (Client-side / Session state)
  if (context.userId && typeof window !== "undefined") {
    const userPrefKey = `bhoomi_pref_${context.userId}_${masterCode}`;
    const cachedPrefId = localStorage.getItem(userPrefKey);
    if (cachedPrefId) {
      const match = availableMasters.find(m => m.id === cachedPrefId && m.is_active);
      if (match) return match;
    }
  }

  // Step 2: Check Project Default (Query the Project Record)
  if (context.projectId) {
    const project = await fetchProjectFromDbOrApi(context.projectId);
    if (project) {
      // e.g. project.default_unit_id
      const projectDefaultField = getProjectDefaultField(masterCode);
      const projectDefaultId = project[projectDefaultField];
      if (projectDefaultId) {
        const match = availableMasters.find(m => m.id === projectDefaultId && m.is_active);
        if (match) return match;
      }
    }
  }

  // Step 3: Check Tenant Default (Query Tenant settings)
  if (context.tenantId) {
    const tenantSettings = await fetchTenantSettingsFromDbOrApi(context.tenantId);
    if (tenantSettings) {
      const tenantDefaultField = getTenantDefaultField(masterCode);
      const tenantDefaultId = tenantSettings[tenantDefaultField];
      if (tenantDefaultId) {
        const match = availableMasters.find(m => m.id === tenantDefaultId && m.is_active);
        if (match) return match;
      }
    }
  }

  // Step 4: Fallback to System Default (Marked in Master Table as is_default = TRUE)
  const systemDefault = availableMasters.find(m => m.is_default && m.is_active);
  if (systemDefault) return systemDefault;

  // Step 5: Absolute Fallback (First active record)
  return availableMasters.find(m => m.is_active) || null;
}

function getProjectDefaultField(masterCode: string): string {
  const fields: Record<string, string> = {
    measurement_units: "default_unit_id",
    road_types: "default_road_type_id",
    plot_types: "default_plot_type_id"
  };
  return fields[masterCode] || "default_id";
}

function getTenantDefaultField(masterCode: string): string {
  const fields: Record<string, string> = {
    measurement_units: "default_measurement_unit_id",
    road_types: "default_road_type_id"
  };
  return fields[masterCode] || "default_id";
}
```

---

## 3. Administrative Override Guidelines
1.  **System Defaults Preservation**: Only platform-level administrators can toggle the `is_default` flag on global records (`tenant_id IS NULL`). Toggling a system default automatically removes the default status from the previous system record of the same category.
2.  **Cascading Updates**: If a tenant default is changed, any project that relies on the "Tenant Default" fallback is updated dynamically without needing individual database updates.
3.  **UI Feedback**: Whenever a default resolution takes place, the UI should display a subtle badge indicating the origin of the setting (e.g., `"Project Default"`, `"Tenant Default"`, or `"System Fallback"`).
