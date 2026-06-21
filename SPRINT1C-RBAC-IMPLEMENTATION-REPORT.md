# SPRINT 1C: ROLE-BASED ACCESS CONTROL (RBAC) IMPLEMENTATION REPORT

## 1. Executive Summary
BhoomiOne V2 platform’s Role-Based Access Control (RBAC) architecture has been fully frozen and converted to Laravel 12. Security configurations, privilege sets, scopes, and context mappings are entirely database-driven, resolving dynamic permissions in real-time from relations without hardcoded role strings in handlers.

This sprint’s layout ensures clean multi-tenant memberships and per-tenant role assignments with seamless compatibility across our Node.js/Express sandboxed prototype gateway.

---

## 2. Implemented Database Schema & Migrations

Below are the migrations created in `/backend-api/database/migrations/`:

### A. Core RBAC Base Tables (`2026_06_19_000003_create_rbac_tables.php`)
1. **`roles` Table**:
   - `id` (UUID Primary Key)
   - `code` (VARCHAR Unique System Identifier, e.g., `PLATFORM_ADMIN`, `SALES_MANAGER`)
   - `name` (VARCHAR Natural Language Label)
   - `scope` (VARCHAR, either `GLOBAL` or `TENANT` context)
   - Timestamps

2. **`permissions` Table**:
   - `id` (UUID Primary Key)
   - `code` (VARCHAR Unique dot-notation Identifier, e.g., `users.view`, `tenants.manage`)
   - `name` (VARCHAR Natural Language Purpose)
   - `module` (VARCHAR Area Segment, e.g., `identity`, `sales`, `gis`)
   - Timestamps

### B. Dynamic Relation Mapping Tables
3. **`role_permissions` (Pivot join mapping table)**:
   - Composite Primary Key on `(role_id, permission_id)`
   - Foreign keys with `ON DELETE CASCADE` binding roles to granular permissions.

4. **`user_roles` (Global scope roles)**:
   - Composite Primary Key on `(user_id, role_id)` for platform-level roles (`PLATFORM_ADMIN`, `PLATFORM_SUPPORT`).

5. **`tenant_users` (Multi-tenant membership scope role assignment)**:
   - Composite Primary Key on `(tenant_id, user_id)`
   - Maps users to distinct roles on a **per-tenant** basis.
   - Foreign keys to tenants, users, and roles table (uses `ON DELETE RESTRICT` for roles to ensure structural safety).

---

## 3. Laravel Models & Relationships

All models reside under `/backend-api/app/Models/` with UUID key binding:

1. **`Permission` Model (`Permission.php`)**:
   - Represents privilege units in dot-notation formatting.
   - Defines `belongsToMany` relationship to `Role` via pivot `role_permissions`.

2. **`Role` Model (`Role.php`)**:
   - Represents scoped role descriptors.
   - Defines `belongsToMany` relationship to `Permission` via pivot `role_permissions`.
   - Defines `hasMany` relationship mapping user memberships inside `TenantUser` contexts.

3. **`User` Model (`User.php`)**:
   - Added core authorization check `hasPermission(string $permissionCode, ?string $tenantId = null): bool`.
   - Dynamically checks if the user has direct global user roles (if `$tenantId` is null) or queries specific `tenant_users` mappings (if `$tenantId` matches active workspace boundaries). This guarantees that a user can have different roles on separate developer tenants.

---

## 4. Seeders & Core Configurations

The `RoleAndPermissionSeeder.php` pre-populates all standard entities into active persistent tables:

### A. Seeded Default Roles (10)
1. **`PLATFORM_ADMIN`**: Global Platform Admin (Full systems authority)
2. **`PLATFORM_SUPPORT`**: Platform Support CSR
3. **`DEVELOPER_OWNER`**: Tenant Account Owner
4. **`DEVELOPER_ADMIN`**: Tenant Workspace Administrator
5. **`FINANCE_MANAGER`**: Tenant Accountant & Ledger auditor
6. **`PROJECT_MANAGER`**: Tenant Land Architect & Designer
7. **`SALES_MANAGER`**: Tenant Booking Superintendent
8. **`SALES_EXECUTIVE`**: Tenant Booking Liaison
9. **`AGENT`**: External Broker agent
10. **`CUSTOMER`**: Buyer profiles

### B. Seeded Permission Codes (32)
The permission codes are fully standardized in a granular `module.action` structure:
- **`users` namespace**: `users.view`, `users.create`, `users.update`, `users.delete`
- **`roles` namespace**: `roles.view`, `roles.manage`
- **`permissions` namespace**: `permissions.view`, `permissions.manage`
- **`tenants` namespace**: `tenants.view`, `tenants.manage`
- **`subscriptions` namespace**: `subscriptions.view`, `subscriptions.manage`
- **`audit` namespace**: `audit.view`
- **`kyc` namespace**: `kyc.review`
- **`marketplace` namespace**: `marketplace.publish`, `marketplace.unpublish`
- **`maps` namespace**: `maps.upload`, `maps.view`
- **`projects` namespace**: `projects.view`, `projects.manage`
- **`layouts` namespace**: `layouts.view`, `layouts.manage`
- **`plots` namespace**: `plots.view`, `plots.manage`
- **`bookings` namespace**: `bookings.view`, `bookings.manage`
- **`collections` namespace**: `collections.view`, `collections.manage`
- **`customers` namespace**: `customers.view`, `customers.manage`
- **`agents` namespace**: `agents.view`, `agents.manage`

### C. Seeded Mapped Matrix
Pivot relationship entries link standard roles directly to the necessary combinations of permissions (e.g., `PLATFORM_ADMIN` is mapped to all 32 permissions, and `CUSTOMER` is restricted only to `bookings.view`, `collections.view`, and `projects.view`).

---

## 5. RBAC Authorization Middlewares

1. **`PermissionRequirementMiddleware` (`PermissionRequirementMiddleware.php`)**:
   - Secures route clusters dynamically.
   - Inspects active parsed JWT sub-claims from the requested headers (`Authorization: Bearer <token>`).
   - Retrieves active scopes (tenant context, if parsed) and invokes `User::hasPermission($code, $tenantId)` to authorize incoming actions.
   - Throws clear standard HTTP `403 Access Denied` responses if privileges are insufficient.

---

## 6. Verification & Sandbox Integration
The live sandboxed developer workspace has been updated to mirror this structure with absolute visual feedback in the viewport:
- **Default Profiles Seeded**:
  - `admin@bhoomione.com` (Mapped to platform-scoped `PLATFORM_ADMIN`) -> has access to Fetch Audit Logs, Provision Tenants, and Tenant Users.
  - `support@bhoomione.com` (Mapped to platform-scoped `PLATFORM_SUPPORT`) -> restricted to view queries.
  - `owner@developer1.com` -> configured with multi-tenant membership:
    - **Tenant 1 (`dev-01`)**: Has `DEVELOPER_OWNER` role (full workspace authority).
    - **Tenant 2 (`dev-02`)**: Has `DEVELOPER_ADMIN` role (no billing access, limited management capabilities).
  - `customer@bhoomione.com` (Mapped to tenant `dev-01` with `CUSTOMER` role) -> denied access to all administrative endpoints.
- **Dynamic Profile Payloads**: Authentication payloads from the server (handled in Laravel and mirrored in Express sandbox routes) automatically append the matching user `permissions` list to session objects.
- **Interactive Simulator**: The front-end now features a live **Middle-ware Interceptor Simulator** with responsive output logs, verifying real database-driven validation on endpoints dynamically.
