<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PermissionService
{
    /**
     * Retrieve all permissions associated with a specific role code.
     */
    public static function getPermissionsByRole(string $roleCode): array
    {
        return DB::table('roles')
            ->join('role_permissions', 'roles.id', '=', 'role_permissions.role_id')
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->where('roles.code', $roleCode)
            ->pluck('permissions.code')
            ->toArray();
    }

    /**
     * Retrieve list of permission codes dynamically in effect for user based on security boundary context.
     */
    public static function getUserPermissions(string $userId, ?string $tenantId = null): array
    {
        if ($tenantId !== null) {
            // Evaluates tenant workspace mapping
            return DB::table('tenant_users')
                ->join('role_permissions', 'tenant_users.role_id', '=', 'role_permissions.role_id')
                ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
                ->where('tenant_users.user_id', $userId)
                ->where('tenant_users.tenant_id', $tenantId)
                ->pluck('permissions.code')
                ->unique()
                ->toArray();
        }

        // Resolves global platform level roles permissions
        return DB::table('user_roles')
            ->join('role_permissions', 'user_roles.role_id', '=', 'role_permissions.role_id')
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->where('user_roles.user_id', $userId)
            ->pluck('permissions.code')
            ->unique()
            ->toArray();
    }
}
