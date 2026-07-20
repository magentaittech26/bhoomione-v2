# BhoomiOne V3 – Master Dependency Engine Specification

The **Master Dependency Engine** is the referential safeguard of the BhoomiOne system. It prevents the accidental deletion or deactivation of core master records (such as measurement units, land use types, or approval status codes) that are actively referenced by downstream transactional tables (projects, layouts, plots, budgets, pricing lists, or layout geometric nodes).

---

## 1. Engine Core Flow

The engine operates as a bidirectional check system:

```
[User triggers Deletion / Deactivation]
                   │
                   ▼
  [Query Database Reference Schema]
  ├── Scan standard foreign keys
  └── Scan JSONB metadata paths
                   │
                   ▼
  [Determine Usage Count (N)]
                   │
         ┌─────────┴─────────┐
         │ (N > 0)           │ (N == 0)
         ▼                   ▼
[Block Action & Render]   [Permit Action]
[Visual Usage Summary ]   [Soft Delete  ]
                          [Log Audit    ]
```

---

## 2. Server-Side Reference Check

Before deleting or deactivating a master record, the backend service scans all known tables that possess a foreign key to the master. This check must happen programmatically before attempting a database `UPDATE` to return human-readable metadata, rather than relying solely on raw SQL constraint failures.

### Check Protocol (TypeScript Boilerplate)
```typescript
interface DependencyCheckResult {
  isSafe: boolean;
  totalReferences: number;
  breakdown: {
    tableName: string;
    label: string;
    count: number;
    sampleEntities: Array<{ id: string; name: string }>;
  }[];
}

export async function checkMasterDependencies(
  masterCode: string,
  recordId: string
): Promise<DependencyCheckResult> {
  const db = getPool();
  const breakdown: DependencyCheckResult["breakdown"] = [];
  
  // Define dependency registry for 'measurement_units' as reference
  const dependencySchemaMap: Record<string, Array<{ table: string; field: string; label: string; nameField: string }>> = {
    measurement_units: [
      { table: "projects", field: "default_unit_id", label: "Projects", nameField: "name" },
      { table: "layouts", field: "total_area_unit_id", label: "Layouts", nameField: "layout_name" },
      { table: "plots", field: "measurement_unit_id", label: "Plots", nameField: "plot_number" }
    ]
  };

  const schemas = dependencySchemaMap[masterCode] || [];
  let totalReferences = 0;

  for (const schema of schemas) {
    const query = `
      SELECT id, ${schema.nameField} as name 
      FROM ${schema.table} 
      WHERE ${schema.field} = $1 AND (deleted_at IS NULL OR deleted_at IS NOT DEFINED)
      LIMIT 5
    `;
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM ${schema.table} 
      WHERE ${schema.field} = $1 AND (deleted_at IS NULL OR deleted_at IS NOT DEFINED)
    `;

    const [rowsRes, countRes] = await Promise.all([
      db.query(query, [recordId]),
      db.query(countQuery, [recordId])
    ]);

    const count = parseInt(countRes.rows[0]?.count || "0", 10);
    if (count > 0) {
      totalReferences += count;
      breakdown.push({
        tableName: schema.table,
        label: schema.label,
        count: count,
        sampleEntities: rowsRes.rows
      });
    }
  }

  return {
    isSafe: totalReferences === 0,
    totalReferences,
    breakdown
  };
}
```

---

## 3. User Experience & Interface Rules

### A. The Dependency Viewer Modal
If a user attempts to delete a record with active references, the system **MUST NOT** throw a generic DB error popup. Instead, it must show an elegant, educational **Dependency Summary Modal**:

1.  **Block Banner**: An amber/red alert block explaining that the action is blocked because the record is active.
2.  **Usage breakdown**: A clean list showing exactly where it is used (e.g., `"Used by 14 plots inside 'Silicon Valley Phase 2'"`, `"Used as default unit in 2 projects"`).
3.  **Remediation Action**: Provides a clear call-to-action button allowing users to edit those projects/plots or re-assign their measurement units before proceeding.

### B. Prevention of State Invalidation
*   **Active Status Toggle**: Even if a user cannot delete a record, they may want to deactivate it. Deactivation is also guarded: if a unit is currently set as the default unit of an active project, deactivation is blocked until the project default is switched.
