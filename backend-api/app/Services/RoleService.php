<?php

namespace App\Services;

use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\DB;
use App\Services\AuditLogService;
use Illuminate\Support\Str;

class RoleService
{
    /**
     * Assigns a role to a user in the GLOBAL scope.
     */
    public static function assignGlobalRole(string $userId, string $roleCode): bool
    {
        $user = User::find($userId);
        $role = Role::where('code', $roleCode)->where('scope', 'GLOBAL')->first();

        if (!$user || !$role) {
            return false;
        }

        // Use insertOrIgnore or direct DB insert to bypass duplicates
        DB::table('user_roles')->insertOrIgnore([
            'user_id' => $user->id,
            'role_id' => $role->id,
        ]);

        AuditLogService::log([
            'tenantId' => null,
            'userId' => null, // Operator user should be supplied or log as security system action
            'entityName' => 'users',
            'entityId' => $user->id,
            'action' => 'ROLE_ASSIGN_GLOBAL',
            'newValues' => ['role_code' => $roleCode],
        ]);

        return true;
    }

    /**
     * Assigns a role within a specific TENANT workspace boundaries.
     */
    public static function assignTenantRole(string $userId, string $tenantId, string $roleCode): bool
    {
        $user = User::find($userId);
        $role = Role::where('code', $roleCode)->where('scope', 'TENANT')->first();

        if (!$user || !$role) {
            return false;
        }

        // In tenant_users table, the PK is (tenant_id, user_id).
        // Since a user can only have one role per tenant (based on PK layout), we update or insert.
        DB::table('tenant_users')->updateOrInsert(
            ['tenant_id' => $tenantId, 'user_id' => $user->id],
            ['role_id' => $role->id, 'updated_at' => now(), 'created_at' => now()]
        );

        AuditLogService::log([
            'tenantId' => $tenantId,
            'userId' => null,
            'entityName' => 'users',
            'entityId' => $user->id,
            'action' => 'ROLE_ASSIGN_TENANT',
            'newValues' => ['role_code' => $roleCode],
        ]);

        return true;
    }

    /**
     * Removes a globally scoped role assignments from a user identity.
     */
    public static function removeGlobalRole(string $userId, string $roleCode): bool
    {
        $user = User::find($userId);
        $role = Role::where('code', $roleCode)->where('scope', 'GLOBAL')->first();

        if (!$user || !$role) {
            return false;
        }

        $deleted = DB::table('user_roles')
            ->where('user_id', $user->id)
            ->where('role_id', $role->id)
            ->delete();

        if ($deleted) {
            AuditLogService::log([
                'tenantId' => null,
                'userId' => null,
                'entityName' => 'users',
                'entityId' => $user->id,
                'action' => 'ROLE_REMOVE_GLOBAL',
                'oldValues' => ['role_code' => $roleCode],
            ]);
            return true;
        }

        return false;
    }

    /**
     * Removes a role assignments from user inside specific tenant systems.
     */
    public static function removeTenantRole(string $userId, string $tenantId, string $roleCode): bool
    {
        $user = User::find($userId);
        $role = Role::where('code', $roleCode)->where('scope', 'TENANT')->first();

        if (!$user || !$role) {
            return false;
        }

        $deleted = DB::table('tenant_users')
            ->where('tenant_id', $tenantId)
            ->where('user_id', $user->id)
            ->where('role_id', $role->id)
            ->delete();

        if ($deleted) {
            AuditLogService::log([
                'tenantId' => $tenantId,
                'userId' => null,
                'entityName' => 'users',
                'entityId' => $user->id,
                'action' => 'ROLE_REMOVE_TENANT',
                'oldValues' => ['role_code' => $roleCode],
            ]);
            return true;
        }

        return false;
    }
}
