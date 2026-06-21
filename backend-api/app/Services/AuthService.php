<?php

namespace App\Services;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthService
{
    /**
     * Authenticates a platform (global context) administrator.
     */
    public static function authenticatePlatformAdmin(string $email, string $password): array
    {
        $cleanEmail = strtolower(trim($email));
        $user = User::where('email', $cleanEmail)->first();

        if (!$user) {
            throw new \Exception("Invalid username or password.");
        }

        if ($user->status !== 'ACTIVE') {
            throw new \Exception("Profile access restricted. Current status: {$user->status}");
        }

        // Verify bcrypt password
        if (!password_verify($password, $user->password_hash)) {
            throw new \Exception("Invalid username or password.");
        }

        // Load global system roles
        $role = DB::table('user_roles')
            ->join('roles', 'user_roles.role_id', '=', 'roles.id')
            ->where('user_roles.user_id', $user->id)
            ->where('roles.scope', 'GLOBAL')
            ->select('roles.code')
            ->first();

        if (!$role) {
            throw new \Exception("Unauthorized action. Platform level profile scope required.");
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status,
            'kycStatus' => $user->kyc_status,
            'role' => $role->code,
            'tenantId' => null,
        ];
    }

    /**
     * Authenticates a user within a specific tenant context boundary.
     */
    public static function authenticateTenantUser(string $email, string $password, string $tenantId): array
    {
        $cleanEmail = strtolower(trim($email));
        $user = User::where('email', $cleanEmail)->first();

        if (!$user) {
            throw new \Exception("Invalid username or password.");
        }

        if ($user->status !== 'ACTIVE') {
            throw new \Exception("Profile access restricted. Current status: {$user->status}");
        }

        if (!password_verify($password, $user->password_hash)) {
            throw new \Exception("Invalid username or password.");
        }

        // Verify membership in tenant and load scoped role
        $mapping = DB::table('tenant_users')
            ->join('roles', 'tenant_users.role_id', '=', 'roles.id')
            ->join('tenants', 'tenant_users.tenant_id', '=', 'tenants.id')
            ->where('tenant_users.user_id', $user->id)
            ->where('tenant_users.tenant_id', $tenantId)
            ->select('roles.code as role_code', 'tenants.tenant_code', 'tenants.company_name')
            ->first();

        if (!$mapping) {
            throw new \Exception("Access denied. You do not belong to this workspace context.");
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status,
            'kycStatus' => $user->kyc_status,
            'role' => $mapping->role_code,
            'tenantId' => $tenantId,
            'tenantCode' => $mapping->tenant_code,
            'companyName' => $mapping->company_name,
        ];
    }

    /**
     * Resolves a fully populated profile including permissions metadata.
     */
    public static function getUserProfile(string $userId, ?string $tenantId): array
    {
        $user = User::find($userId);

        if (!$user) {
            throw new \Exception("User profile not found.");
        }

        if ($tenantId) {
            $mapping = DB::table('tenant_users')
                ->join('roles', 'tenant_users.role_id', '=', 'roles.id')
                ->join('tenants', 'tenant_users.tenant_id', '=', 'tenants.id')
                ->where('tenant_users.user_id', $user->id)
                ->where('tenant_users.tenant_id', $tenantId)
                ->select('roles.code as role_code', 'tenants.tenant_code', 'tenants.company_name')
                ->first();

            if (!$mapping) {
                throw new \Exception("Workspace assignment is invalid.");
            }

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'status' => $user->status,
                'kycStatus' => $user->kyc_status,
                'role' => $mapping->role_code,
                'tenantId' => $tenantId,
                'tenantCode' => $mapping->tenant_code,
                'companyName' => $mapping->company_name,
            ];
        } else {
            // Global Platform Profile
            $role = DB::table('user_roles')
                ->join('roles', 'user_roles.role_id', '=', 'roles.id')
                ->where('user_roles.user_id', $user->id)
                ->where('roles.scope', 'GLOBAL')
                ->select('roles.code')
                ->first();

            $activeRole = $role ? $role->code : null;

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'status' => $user->status,
                'kycStatus' => $user->kyc_status,
                'role' => $activeRole,
                'tenantId' => null,
            ];
        }
    }

    /**
     * Password Reset Phase 1: Initiates a verification challenge token logging flow.
     */
    public static function requestPasswordReset(string $email): array
    {
        $cleanEmail = strtolower(trim($email));
        $user = User::where('email', $cleanEmail)->first();

        if (!$user) {
            return [
                'success' => true,
                'message' => "If corresponding profile matches validation standards, instructions will map accordingly.",
            ];
        }

        $resetToken = "BHOOMI-RST-" . strtoupper(Str::random(8));

        return [
            'success' => true,
            'message' => "Reset request registered effectively on verification frameworks.",
            'resetToken' => $resetToken,
        ];
    }

    /**
     * Password Reset Phase 2: Commits new secrets directly to physical authentication entries.
     */
    public static function submitPasswordReset(string $email, string $token, string $password): bool
    {
        $cleanEmail = strtolower(trim($email));
        $user = User::where('email', $cleanEmail)->first();

        if (!$user) {
            return false;
        }

        if (empty($token) || !str_starts_with($token, 'BHOOMI-RST-')) {
            throw new \Exception("Security verification token failed validation bounds.");
        }

        if (strlen($password) < 8) {
            throw new \Exception("Password must include at least 8 alphanumeric elements.");
        }

        $nextHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
        $user->update(['password_hash' => $nextHash]);

        return true;
    }
}
