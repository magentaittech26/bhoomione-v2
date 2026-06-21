# BhoomiOne V2: Sprint 1C - Database-Driven RBAC Technical Specification

**Document Identification**: SPRINT1C-RBAC-TECHNICAL-SPEC  
**Authoritative Scope**: Laravel-Native Multi-Tenant Role-Based Access Control (RBAC) Engine  
**Version**: 1.0  
**Target Framework**: Laravel 12.x + PostgreSQL 16+  
**Status**: Pending Review (Do Not Implement Code Until Approved)  

---

## 1. Core Architectural Paradigm

Modern enterprise Multi-Tenant applications often fall victim to hardcoded role verification checks (e.g., `if ($user->hasRole('PLATFORM_ADMIN'))`), which introduces rigid architectural coupling and limits long-term maintainability. 

BhoomiOne V2 resolves this by enforcing a **strictly database-driven, capability-based RBAC engine**. 
- Codebases and middlewares must reference **Permissions** (granular, action-specific keywords representing business capabilities), whereas **Roles** remain pure database-driven grouping logical containers.
- The RBAC module is designed as an isolated, reusable service layer that separates platform management from developer ERP workspaces, adapting queries dynamically based on the active tenancy boundary.

```
                  +-----------------------+
                  |    Global Context     |
                  +-----------+-----------+
                              |
                              v
                   [user_roles join table]
                              |
                              v
                  +-----------+-----------+
                  |      Global Roles     |
                  +-----------+-----------+
                              |
                              v
                +-------------+-------------+
                |   User (Central Registry) |
                +-------------+-------------+
                              |
                              v
                   [tenant_users join table]
                              |
                              v
                  +-----------+-----------+
                  |     Tenant Roles      |
                  +-----------+-----------+
                              |
                              v
                  +-----------+-----------+
                  |    Tenant Context     |
                  |     (X-Tenant-ID)     |
                  +-----------------------+
```

---

## 2. Dynamic Tenancy-Aware Security Scopes

A single user identity can operate simultaneously or selectively across different domains:
1. **Global Security Context**: Operating at the platform-control level (e.g., platform administration, global billing, tech-support auditing).
2. **Tenant Security Context**: Operating within a closed workspace environment (e.g., developer real-estate portal, site billing, sales executive flows).

### 2.1 Resolution Logic
During request processing, the dynamic RBAC engine evaluates permissions by assessing the active security container:

- **If NO Tenant ID resides on the request container (Global-Control Boundary)**:
  The user's assigned permissions are evaluated through the global relation:
  `users` $\rightarrow$ `user_roles` $\rightarrow$ `roles` $\rightarrow$ `role_permissions` $\rightarrow$ `permissions`.
  *Only roles with `scope = 'GLOBAL'` are qualified.*

- **If a Tenant ID is dynamically resolved (Tenant ERP Boundary)**:
  The user's assigned permissions are evaluated through the tenant-specific mapping table:
  `users` $\rightarrow$ `tenant_users` (for a specific `tenant_id`) $\rightarrow$ `roles` $\rightarrow$ `role_permissions` $\rightarrow$ `permissions`.
  *Only roles with `scope = 'TENANT'` are qualified within this active workspace.*

---

## 3. Mandatory Default Roles & Permissions Matrix

To support multi-module security partitioning without hardcoding individual user types, the database is seeded with **8 default roles** partitioned across **4 distinct functional modules** (`identity`, `platform`, `billing`, `audit`):

| Role Code | Authorization Scope | Target Users | Intended Administrative Boundaries |
| :--- | :--- | :--- | :--- |
| **`PLATFORM_ADMIN`** | `GLOBAL` | Platform Administrators | Ultimate physical and logical authority over the BhoomiOne platform. |
| **`PLATFORM_SUPPORT`** | `GLOBAL` | CSR / Support Engineers | Read-only configuration auditing, ticket traces, read customer metrics. |
| **`DEVELOPER_OWNER`** | `TENANT` | Workspace Proprietor / Owner | Full control inside their tenant workspace, database, team sizing, subscription. |
| **`DEVELOPER_ADMIN`** | `TENANT` | Developers/Tenant Admins | User boarding, system settings, mapping configurations within a tenant. |
| **`SALES_MANAGER`** | `TENANT` | Sales Executive Leads | Manage team sales pipelines, assign client segments, audit sales performance. |
| **`SALES_EXECUTIVE`** | `TENANT` | Sales Agents / Execs | View records assigned to self, lodge transaction entries within a workspace. |
| **`AGENT`** | `TENANT` | External Brokers | List external inventory records and query broker statuses. |
| **`CUSTOMER`** | `TENANT` | Client Profiles | Query own bookings, view ledger statements, track profile approvals. |

### 3.1 Seeding Map (Permissions Definition Matrix)

To implement granular, capability-based security, the system registers the following explicit permissions:

#### Module: `identity` (Core Profile Handshakes)
- `identity:profile:read` – Read account parameters and current role metadata.
- `identity:profile:write` – Modify owned personal contact parameters.
- `identity:users:invite` – Send workspace onboarding and login invites.
- `identity:users:manage` – Deactivate, suspend, or change users within a defined boundary.

#### Module: `platform` (Control Plane Orchestration)
- `platform:tenants:create` – Initialize and provision new tenant workspaces.
- `platform:tenants:write` – Edit tenant configuration and limits.
- `platform:tenants:read` – Audit tenant lists, health, and server matrices.
- `platform:support:login` – Impersonate or enter tenant ERPs for maintenance.

#### Module: `billing` (Subscriptions & Ledgers)
- `billing:plans:manage` – Create subscription templates, matrices, and transaction thresholds.
- `billing:invoice:read` – Audit ledger registers, receipts, and outstanding accounts.
- `billing:invoice:write` – Initiate adjustment transactions and issue billing overrides.

#### Module: `audit` (Immutability Logs)
- `audit:logs:read` – Access real-time event tables, audit records, and security telemetry.
- `audit:security:write` – Clear logs or configure webhook push targets (Restricted strictly to Platform Admins).

### 3.2 Permission Map Association Grid

| Role / Permission Code | `PLATFORM_ADMIN` | `PLATFORM_SUPPORT` | `DEVELOPER_OWNER` | `DEVELOPER_ADMIN` | `SALES_MANAGER` | `SALES_EXECUTIVE` | `AGENT` | `CUSTOMER` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`identity:profile:read`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| **`identity:profile:write`** | ✔ | ❌ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| **`identity:users:invite`**| ✔ | ❌ | ✔ | ✔ | ✔ | ❌ | ❌ | ❌ |
| **`identity:users:manage`**| ✔ | ❌ | ✔ | ✔ | ❌ | ❌ | ❌ | ❌ |
| **`platform:tenants:create`**| ✔ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`platform:tenants:write`** | ✔ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`platform:tenants:read`**  | ✔ | ✔ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`platform:support:login`** | ✔ | ✔ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`billing:plans:manage`**  | ✔ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`billing:invoice:read`**   | ✔ | ✔ | ✔ | ✔ | ✔ | ❌ | ❌ | ✔ |
| **`billing:invoice:write`**  | ✔ | ❌ | ✔ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`audit:logs:read`**        | ✔ | ✔ | ✔ | ✔ | ❌ | ❌ | ❌ | ❌ |
| **`audit:security:write`**   | ✔ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Laravel Schema & Entity Definitions

To maintain strict alignment with the existing database schema, the system will use the following migration patterns to generate the tables as defined in `schema_sprint1.sql` (if they do not already exist, or are loaded via an updated seeder baseline).

### 4.1 Database Pivot Schema Updates
Standard join relations are explicitly generated via Laravel 12 migrations to guarantee clean physical constraint cascades:

```php
// Example: Creating roles & permissions mapping
Schema::create('role_permissions', function (Blueprint $table) {
    $table->uuid('role_id')->index();
    $table->uuid('permission_id')->index();
    
    $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
    $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
    
    $table->primary(['role_id', 'permission_id']);
});
```

---

## 5. Eloquent Relationship Design Spec

### 5.1 Role Model (`app/Models/Role.php`)
- **`permissions()`**: `BelongsToMany` relation mapping to `Permission`.
- **`globalUsers()`**: `BelongsToMany` relation mapping to `User` through `user_roles` pivot.
- **`tenantUsers()`**: `BelongsToMany` relation mapping to `User` through `tenant_users` pivot, extracting metadata pivot factors.

### 5.2 Permission Model (`app/Models/Permission.php`)
- **`roles()`**: `BelongsToMany` relation mapping back to `Role`.

### 5.3 User Model Security Interface Extensions (`app/Models/User.php`)
The User model is augmented with unified, context-aware RBAC methods that dynamically look up permissions based on the request's tenancy status:

```php
/**
 * Assert if user possesses a specific permission code in the active security perimeter.
 *
 * @param string $permissionCode Unique identifier (e.g. 'identity:users:manage')
 * @param string|null $tenantId UUID, if working inside a Tenant workspace frame.
 * @return bool
 */
public function hasPermission(string $permissionCode, ?string $tenantId = null): bool
{
    // If working under a Tenant context
    if ($tenantId !== null) {
        return DB::table('tenant_users')
            ->join('role_permissions', 'tenant_users.role_id', '=', 'role_permissions.role_id')
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->where('tenant_users.user_id', $this->id)
            ->where('tenant_users.tenant_id', $tenantId)
            ->where('permissions.code', $permissionCode)
            ->exists();
    }

    // Fallback: Check global platform admin role allocations
    return DB::table('user_roles')
        ->join('role_permissions', 'user_roles.role_id', '=', 'role_permissions.role_id')
        ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
        ->where('user_roles.user_id', $this->id)
        ->where('permissions.code', $permissionCode)
        ->exists();
}
```

---

## 6. Tenancy-Aware RBAC Middleware (`App\Http\Middleware\PermissionRequirementMiddleware`)

### 6.1 Authentication Header and Decryption Process
1. **Extraction**: The middleware retrieves the bearer JWT token from the authorization header.
2. **Context Resolution**: The middleware retrieves the resolved tenant object initialized on the request context by the `TenantResolverMiddleware` (using `X-Tenant-ID` or Hostname parameters).
3. **Identity Verification**: It decodes and verifies the core JWT parameters against the system signing secrets using the `JwtTokenService` API.
4. **Resolution**: If the token contains a `tenantId` claim, it must match the resolved request context.

### 6.2 Permission Evaluation Algorithm

```
Incoming Request ----> [TenantResolverMiddleware] ---> sets 'resolvedTenant'
                               |
                               v
               [PermissionRequirementMiddleware]
                               |
                               v
                     JWT Auth Validation
                               |
            +------------------+------------------+
            |                                     |
    [Has resolvedTenant]                [No resolvedTenant]
            |                                     |
            v                                     v
 Evaluate tenant-scoped roles            Evaluate global roles
   inside `tenant_users`                   inside `user_roles`
            |                                     |
            +------------------+------------------+
                               |
                               v
                 Are credentials active?
                               |
            +------------------+------------------+
            | Yes                                 | No
            v                                     v
       Allow Next                            403 Unauthorized
```

### 6.3 Standard 401 & 403 Response Layout
To prevent security leaks, all unauthorized calls bypass redirects and yield clean JSON responses:

- **401 Unauthorized**:
  ```json
  {
    "error": "Access token is invalid, revoked, or expired."
  }
  ```
- **403 Forbidden**:
  ```json
  {
    "error": "Forbidden. Insufficient permissions to execute the requested action."
  }
  ```

---

## 7. Service Layer Interfaces

### 7.1 RoleService (`app/Services/RoleService.php`)
Encapsulates administrative actions on role definitions, ensuring high audit integrity:
- `assignGlobalRole(string $userId, string $roleCode): bool`
- `assignTenantRole(string $userId, string $tenantId, string $roleCode): bool`
- `removeGlobalRole(string $userId, string $roleCode): bool`
- `removeTenantRole(string $userId, string $tenantId, string $roleCode): bool`

### 7.2 PermissionService (`app/Services/PermissionService.php`)
Provides query boundaries for system performance analysis:
- `getPermissionsByRole(string $roleCode): array`
- `getUserPermissions(string $userId, ?string $tenantId = null): array`

---

## 8. Seeding Strategy and Core User Allocations

To allow seamless platform validation, the seeders will pre-populate the database with the core default roles and permissions. It will also bind the default user profiles created during Sprint 1B to their respective security permissions:

1. **`PLATFORM_ADMIN_USER`** (`admin@bhoomione.com`) $\rightarrow$ Assigned to **`PLATFORM_ADMIN`** globally.
2. **`PLATFORM_SUPPORT_USER`** (`support@bhoomione.com`) $\rightarrow$ Assigned to **`PLATFORM_SUPPORT`** globally.
3. **`TENANT_OWNER_USER`** (`owner@developer1.com`) $\rightarrow$ Assigned to **`DEVELOPER_OWNER`** in Tenant workspace `DEV-01`.
4. **`CUSTOMER_USER`** (`customer@bhoomione.com`) $\rightarrow$ Assigned to **`CUSTOMER`** in Tenant workspace `DEV-01`.

---

## 9. Next Steps and Review Trigger

The code implementation for Sprint 1C is frozen until the V2 Architectural Board reviews and signs off on this specification document. 

Once approved, implementation will proceed systematically:
1. Generate the role, permission, and linkage database migrations.
2. Create Eloquent model wrappers with native pivot constraints.
3. Wire the context-aware RBAC middlewares and services.
4. Populate data states via `RoleAndPermissionSeeder`.
5. Conduct structural and pipeline validation checks.
