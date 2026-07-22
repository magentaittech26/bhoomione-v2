# BhoomiOne V3 — RBAC Architecture Specification

## 1. Executive Summary
This document specifies the Role-Based Access Control (RBAC) architecture for BhoomiOne V3.
The authoritative RBAC system is hosted entirely inside the **Laravel 12 production backend** (`backend-api`).

## 2. Core Principles
1. **Server-Authoritative Enforcement**: The Laravel backend is the single source of truth for authorization. All API routes are protected by `PermissionRequirementMiddleware`.
2. **Global vs. Tenant Security Scope**:
   - `GLOBAL` Scope: Platform-wide administrative roles (`PLATFORM_ADMIN`, `PLATFORM_SUPPORT`).
   - `TENANT` Scope: Organization/workspace roles (`DEVELOPER_OWNER`, `DEVELOPER_ADMIN`, `PROJECT_MANAGER`, `SALES_MANAGER`, `SURVEYOR`, `READ_ONLY_USER`, `CUSTOMER`).
3. **Fine-Grained Permissions**: Permissions follow dot-notation (`<module>.<submodule>.<action>`).
4. **Cached Evaluation with Real-time Invalidation**: User permission sets are cached with a 1-hour TTL and actively invalidated whenever role assignments change.

## 3. Database Schema Layout
```
+---------------+       +------------------+       +-----------------+
|     roles     |----<--| role_permissions |--->---|   permissions   |
+---------------+       +------------------+       +-----------------+
  ^           ^                                      ^
  |           |                                      |
  |           +---------------------+                |
  | (GLOBAL)                        | (TENANT)       |
+---------------+       +------------------+         |
|  user_roles   |       |   tenant_users   |         |
+---------------+       +------------------+         |
        |                         |                  |
        v                         v                  |
+----------------------------------------------------+
|                       users                        |
+----------------------------------------------------+
```

## 4. Key Components
- **`PermissionRequirementMiddleware`**: Evaluates `user->hasPermission($code, $tenantId)` on incoming HTTP requests.
- **`PermissionService`**: Merges global and tenant-level permissions, handles caching, super admin override, and cache flushing.
- **`rbac:sync-permissions`**: Artisan command to safely synchronize canonical permissions and standard role templates without data loss.
- **`rbac:audit`**: Artisan command to verify database integrity, orphan records, and unassigned users.

## 5. Middleware Sequence
```
Client Request -> Bearer JWT -> PermissionRequirementMiddleware
                                   |
                                   v
                             JwtTokenService::verifyAccessToken()
                                   |
                                   v
                             User::find($userId)
                                   |
                                   v
                             user->hasPermission($code, $tenantId)
                                   |
                          +--------+--------+
                          |                 |
                       [Allowed]       [Forbidden]
                          |                 |
                          v                 v
                   Controller Action     HTTP 403
```
