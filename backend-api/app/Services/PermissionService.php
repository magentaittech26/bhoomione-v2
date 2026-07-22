<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class PermissionService
{
    private const CACHE_TTL_SECONDS = 3600; // 1 hour TTL with active invalidation

    /**
     * Retrieve all permissions associated with a specific role code.
     */
    public static function getPermissionsByRole(string $roleCode): array
    {
        return Cache::remember("rbac:role_perms:{$roleCode}", self::CACHE_TTL_SECONDS, function () use ($roleCode) {
            return DB::table('roles')
                ->join('role_permissions', 'roles.id', '=', 'role_permissions.role_id')
                ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
                ->where('roles.code', $roleCode)
                ->pluck('permissions.code')
                ->toArray();
        });
    }

    /**
     * Retrieve list of permission codes dynamically in effect for user based on security boundary context.
     * Merges global platform roles and tenant workspace roles, with super admin overrides.
     */
    public static function getUserPermissions(string $userId, ?string $tenantId = null): array
    {
        $cacheKey = "rbac:user_perms:{$userId}:tenant:" . ($tenantId ?? 'none');

        return Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($userId, $tenantId) {
            // 1. Check if user has global PLATFORM_ADMIN or DEVELOPER_OWNER role
            $isSuperAdmin = DB::table('user_roles')
                ->join('roles', 'user_roles.role_id', '=', 'roles.id')
                ->where('user_roles.user_id', $userId)
                ->whereIn('roles.code', ['PLATFORM_ADMIN'])
                ->exists();

            if ($isSuperAdmin) {
                return DB::table('permissions')->pluck('code')->toArray();
            }

            // 2. Fetch tenant-scoped permissions
            $tenantPerms = [];
            if ($tenantId !== null) {
                $tenantPerms = DB::table('tenant_users')
                    ->join('role_permissions', 'tenant_users.role_id', '=', 'role_permissions.role_id')
                    ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
                    ->where('tenant_users.user_id', $userId)
                    ->where('tenant_users.tenant_id', $tenantId)
                    ->pluck('permissions.code')
                    ->toArray();
            } else {
                // If tenantId is null, resolve permissions from ALL tenant memberships as fallback
                $tenantPerms = DB::table('tenant_users')
                    ->join('role_permissions', 'tenant_users.role_id', '=', 'role_permissions.role_id')
                    ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
                    ->where('tenant_users.user_id', $userId)
                    ->pluck('permissions.code')
                    ->toArray();
            }

            // 3. Fetch global platform roles permissions
            $globalPerms = DB::table('user_roles')
                ->join('role_permissions', 'user_roles.role_id', '=', 'role_permissions.role_id')
                ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
                ->where('user_roles.user_id', $userId)
                ->pluck('permissions.code')
                ->toArray();

            return array_values(array_unique(array_merge($tenantPerms, $globalPerms)));
        });
    }

    /**
     * Clear permission cache for a specific user.
     */
    public static function clearUserPermissionCache(string $userId, ?string $tenantId = null): void
    {
        Cache::forget("rbac:user_perms:{$userId}:tenant:" . ($tenantId ?? 'none'));
        Cache::forget("rbac:user_perms:{$userId}:tenant:none");
    }

    /**
     * Flush all RBAC permission caches across the application.
     */
    public static function clearAllPermissionCache(): void
    {
        Cache::flush();
    }
}

