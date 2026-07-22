# BhoomiOne V3 — Permission Cache Architecture

## 1. Overview
To prevent database query overhead on every authenticated request, user permissions are cached using Laravel's Cache subsystem.

## 2. Cache Strategy
- **Key Format**: `rbac:user_perms:{userId}:tenant:{tenantId|none}`
- **TTL**: 3600 seconds (1 hour).
- **Resolver**: `PermissionService::getUserPermissions($userId, $tenantId)` uses `Cache::remember()`.

## 3. Real-Time Invalidation Triggers
Whenever any of the following actions occur, cache is invalidated immediately via `PermissionService::clearUserPermissionCache()` or `clearAllPermissionCache()`:
- Role assignment to user (`assignGlobalRole`, `assignTenantRole`)
- Role removal from user (`removeGlobalRole`, `removeTenantRole`)
- Execution of `php artisan rbac:sync-permissions`
- Custom role permission mapping updates
