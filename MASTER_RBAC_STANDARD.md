# BhoomiOne V3 – Master RBAC Standard

Security and isolation are primary tenants of the BhoomiOne platform. Every Master Data Management (MDM) module inherits a fine-grained, standardized Role-Based Access Control (RBAC) permission structure. Authorization logic must be handled uniformly at the gateway layer—never duplicated in individual modules.

---

## 1. Unified Permission Structure

Every master module (where `<module>` is the snake_case code of the master, e.g., `measurement_units`, `road_types`, `plot_types`) automatically receives this standard matrix of permissions:

| Permission String | Description | Operational Scope |
| :--- | :--- | :--- |
| `masters.<module>.view` | View the master data grid, lookup list, and record details. | Read-Only |
| `masters.<module>.create` | Insert new master records. | Write (Create) |
| `masters.<module>.edit` | Update field values, order, and metadata. | Write (Update) |
| `masters.<module>.delete` | Soft delete a record. | Write (Soft Delete) |
| `masters.<module>.activate` | Toggle the active/inactive status of records. | Write (Status Toggle) |
| `masters.<module>.export` | Download master records as CSV or JSON format. | Read-Only (Bulk) |
| `masters.<module>.import` | Upload bulk records via CSV or JSON formats. | Write (Bulk Create) |

---

## 2. Global Role Enforcements

The BhoomiOne platform maps standard user roles to these master permissions automatically. Tenants cannot alter system role mappings, but they can adjust custom tenant roles via the SaaS control panel:

### System Roles (Platform Level)
*   **SYSTEM_ADMIN / DEVELOPER_OWNER**: Full administrative control across all master databases. Can bypass tenant locks and edit core system defaults (`is_system = TRUE`).
*   **PLATFORM_ADMIN**: Can view and modify global masters, but cannot alter protected system units unless explicit permission is assigned.

### Tenant Roles (Workspace Level)
*   **TENANT_OWNER / TENANT_ADMIN**: Has full access (`view`, `create`, `edit`, `delete`, `activate`, `export`, `import`) over tenant-specific master records. Can override system records if `tenant_override_allowed` is enabled.
*   **PROJECT_MANAGER**: Has `view` and `export` permissions. Cannot create or delete masters but can choose project-specific defaults.
*   **FIELD_AGENT / SURVEYOR**: Has `view` permissions only. Cannot alter any master configuration.

---

## 3. Centralized Permission Interceptor

Authorization must be verified upstream before invoking module route controllers. The backend utilizes a central Express middleware interceptor rather than writing custom check functions inside endpoints:

```typescript
// server/middleware/auth.ts
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./types.ts";

export function guardMasterPermission(permission: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role?.toUpperCase();
    
    // 1. Platform & System Admins bypass all master guards
    if (["DEVELOPER_OWNER", "DEVELOPER_ADMIN", "PLATFORM_ADMIN"].includes(role)) {
      return next();
    }
    
    // 2. Resolve database connection pool
    const db = getPool();
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;
    
    if (!userId || !tenantId) {
      return res.status(401).json({ error: "Unauthorized. Missing tenancy context." });
    }
    
    try {
      const permQuery = await db.query(
        `SELECT COUNT(*) as count
         FROM tenant_users tu
         JOIN role_permissions rp ON tu.role_id = rp.role_id
         JOIN permissions p ON rp.permission_id = p.id
         WHERE tu.user_id = $1 AND tu.tenant_id = $2 AND p.code = $3`,
        [userId, tenantId, permission]
      );
      
      const hasAccess = parseInt(permQuery.rows[0]?.count || "0", 10) > 0;
      if (hasAccess) {
        return next();
      }
    } catch (err) {
      console.error("RBAC Middleware Error:", err);
      return res.status(500).json({ error: "Failed to authenticate RBAC bounds." });
    }
    
    return res.status(403).json({ error: `Forbidden. Missing permission: ${permission}` });
  };
}
```

---

## 4. Client-Side Authorization Guarantees
The React frontend console must query user permissions before rendering UI elements:
*   If a user lacks `masters.<module>.create`, the "Create New" button is completely removed from the DOM.
*   If a user lacks `masters.<module>.delete` or `masters.<module>.activate`, the corresponding context-menu and action-bar triggers are hidden or disabled.
