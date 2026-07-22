<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key checks for clean seed execution
        DB::statement('TRUNCATE TABLE tenant_users CASCADE');
        DB::statement('TRUNCATE TABLE user_roles CASCADE');
        DB::statement('TRUNCATE TABLE role_permissions CASCADE');
        DB::statement('TRUNCATE TABLE permissions CASCADE');
        DB::statement('TRUNCATE TABLE roles CASCADE');
        DB::statement('TRUNCATE TABLE users CASCADE');
        DB::statement('TRUNCATE TABLE tenant_domains CASCADE');
        DB::statement('TRUNCATE TABLE tenants CASCADE');

        // 1. Seed DEFAULT TENANTS
        $tenant1Id = '11111111-1111-4111-8111-111111111111';
        $tenant2Id = '22222222-2222-4222-8222-222222222222';

        DB::table('tenants')->insert([
            [
                'id' => $tenant1Id,
                'tenant_code' => 'dev-01',
                'company_name' => 'Bhoomi Developer Corp',
                'status' => 'ACTIVE',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => $tenant2Id,
                'tenant_code' => 'dev-02',
                'company_name' => 'Horizon Estates Ltd',
                'status' => 'ACTIVE',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        DB::table('tenant_domains')->insert([
            [
                'id' => (string) Str::uuid(),
                'tenant_id' => $tenant1Id,
                'domain_name' => 'dev01.bhoomione.com',
                'is_primary' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::uuid(),
                'tenant_id' => $tenant2Id,
                'domain_name' => 'dev02.bhoomione.com',
                'is_primary' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // 2. Seed DEFAULT USERS
        $adminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
        $oldAdminId = '99999999-9999-4999-8999-999999999999';
        $supportId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
        $ownerId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
        $customerId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

        // standard hashes
        $passwordHash = Hash::make('password123');
        $adminPasswordHash = Hash::make('AdminPassword123!');

        DB::table('users')->insert([
            [
                'id' => $adminId,
                'name' => 'Platform Admin User',
                'email' => 'admin@bhoomione.com',
                'phone' => '+919000000001',
                'password_hash' => $passwordHash,
                'status' => 'ACTIVE',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => $oldAdminId,
                'name' => 'Platform Super Administrator',
                'email' => 'admin@bhoomione.in',
                'phone' => '+919999999999',
                'password_hash' => $adminPasswordHash,
                'status' => 'ACTIVE',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => $supportId,
                'name' => 'Platform Support User',
                'email' => 'support@bhoomione.com',
                'phone' => '+919000000002',
                'password_hash' => $passwordHash,
                'status' => 'ACTIVE',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => $ownerId,
                'name' => 'Developer Owner User',
                'email' => 'owner@developer1.com',
                'phone' => '+919000000003',
                'password_hash' => $passwordHash,
                'status' => 'ACTIVE',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => $customerId,
                'name' => 'Customer User',
                'email' => 'customer@bhoomione.com',
                'phone' => '+919000000004',
                'password_hash' => $passwordHash,
                'status' => 'ACTIVE',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // 3. Seed DEFAULT ROLES & PERMISSIONS via Canonical Registry
        $canonicalPerms = \App\Console\Commands\RbacSyncPermissionsCommand::$canonicalPermissions;
        $roleTemplates = \App\Console\Commands\RbacSyncPermissionsCommand::$roleTemplates;

        $roleIds = [];
        foreach ($roleTemplates as $code => $data) {
            $id = (string) Str::uuid();
            DB::table('roles')->insert([
                'id' => $id,
                'code' => $code,
                'name' => $data['name'],
                'scope' => $data['scope'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $roleIds[$code] = $id;
        }

        $permIds = [];
        foreach ($canonicalPerms as $code => $data) {
            $id = (string) Str::uuid();
            DB::table('permissions')->insert([
                'id' => $id,
                'code' => $code,
                'name' => $data['name'],
                'module' => $data['module'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $permIds[$code] = $id;
        }

        // 4. Seed Role-Permission Mappings
        foreach ($roleTemplates as $roleCode => $data) {
            $roleId = $roleIds[$roleCode] ?? null;
            if (!$roleId) continue;

            $assignedCodes = $data['permissions'];
            if ($assignedCodes === '*') {
                $assignedCodes = array_keys($canonicalPerms);
            }

            foreach ($assignedCodes as $pCode) {
                if (isset($permIds[$pCode])) {
                    DB::table('role_permissions')->insert([
                        'role_id' => $roleId,
                        'permission_id' => $permIds[$pCode],
                    ]);
                }
            }
        }


        // 6. Assign Users to Roles
        // Platform Admin assignment in GLOBAL context
        DB::table('user_roles')->insert([
            [
                'user_id' => $adminId,
                'role_id' => $roleIds['PLATFORM_ADMIN'],
            ],
            [
                'user_id' => $oldAdminId,
                'role_id' => $roleIds['PLATFORM_ADMIN'],
            ]
        ]);

        // Platform Support assignment in GLOBAL context
        DB::table('user_roles')->insert([
            'user_id' => $supportId,
            'role_id' => $roleIds['PLATFORM_SUPPORT'],
        ]);

        // Developer Owner multi-tenant assignment testing
        // owner gets DEVELOPER_OWNER role in Dev-01 tenant
        DB::table('tenant_users')->insert([
            'tenant_id' => $tenant1Id,
            'user_id' => $ownerId,
            'role_id' => $roleIds['DEVELOPER_OWNER'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // owner gets DEVELOPER_ADMIN role in Dev-02 tenant (multi-tenancy role support proof!)
        DB::table('tenant_users')->insert([
            'tenant_id' => $tenant2Id,
            'user_id' => $ownerId,
            'role_id' => $roleIds['DEVELOPER_ADMIN'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Customer user gets CUSTOMER role in Dev-01 tenant
        DB::table('tenant_users')->insert([
            'tenant_id' => $tenant1Id,
            'user_id' => $customerId,
            'role_id' => $roleIds['CUSTOMER'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
