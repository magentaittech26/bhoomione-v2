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

        // 3. Seed DEFAULT ROLES
        $roles = [
            'PLATFORM_ADMIN' => ['name' => 'Platform Admin', 'scope' => 'GLOBAL'],
            'PLATFORM_SUPPORT' => ['name' => 'Platform Support', 'scope' => 'GLOBAL'],
            'DEVELOPER_OWNER' => ['name' => 'Developer Owner', 'scope' => 'TENANT'],
            'DEVELOPER_ADMIN' => ['name' => 'Developer Admin', 'scope' => 'TENANT'],
            'FINANCE_MANAGER' => ['name' => 'Finance Manager', 'scope' => 'TENANT'],
            'PROJECT_MANAGER' => ['name' => 'Project Manager', 'scope' => 'TENANT'],
            'SALES_MANAGER' => ['name' => 'Sales Manager', 'scope' => 'TENANT'],
            'SALES_EXECUTIVE' => ['name' => 'Sales Executive', 'scope' => 'TENANT'],
            'AGENT' => ['name' => 'External Broker Agent', 'scope' => 'TENANT'],
            'CUSTOMER' => ['name' => 'Customer Profile', 'scope' => 'TENANT'],
        ];

        $roleIds = [];
        foreach ($roles as $code => $data) {
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

        // 4. Seed DEFAULT PERMISSIONS
        $permissions = [
            // Core permissions
            'users.view' => ['name' => 'View users in current context workspace', 'module' => 'identity'],
            'users.create' => ['name' => 'Create and invite users', 'module' => 'identity'],
            'users.update' => ['name' => 'Modify user settings and metadata', 'module' => 'identity'],
            'users.delete' => ['name' => 'Deactivate and suspend users', 'module' => 'identity'],

            'roles.view' => ['name' => 'Query current role list and structure', 'module' => 'identity'],
            'roles.manage' => ['name' => 'Define system roles and assignments', 'module' => 'identity'],

            'permissions.view' => ['name' => 'Query permission profiles', 'module' => 'identity'],
            'permissions.manage' => ['name' => 'Link privileges and mappings', 'module' => 'identity'],

            'tenants.view' => ['name' => 'View workspace organizational assets', 'module' => 'platform'],
            'tenants.manage' => ['name' => 'Create and modify developer tenants', 'module' => 'platform'],

            'subscriptions.view' => ['name' => 'View plan and subscription invoices', 'module' => 'billing'],
            'subscriptions.manage' => ['name' => 'Purchase and modify tenant tiers', 'module' => 'billing'],

            'audit.view' => ['name' => 'Audit immutable system trail logs', 'module' => 'audit'],
            'kyc.review' => ['name' => 'Audit customer profile verifications', 'module' => 'platform'],

            'marketplace.publish' => ['name' => 'Publish and list lands on marketplace', 'module' => 'marketplace'],
            'marketplace.unpublish' => ['name' => 'Unpublish properties', 'module' => 'marketplace'],

            'maps.upload' => ['name' => 'Upload map layouts', 'module' => 'gis'],
            'maps.view' => ['name' => 'View GIS map features', 'module' => 'gis'],

            'projects.view' => ['name' => 'View developer projects', 'module' => 'projects'],
            'projects.manage' => ['name' => 'Create and design development schedules', 'module' => 'projects'],

            'layouts.view' => ['name' => 'View project layouts', 'module' => 'projects'],
            'layouts.manage' => ['name' => 'Manage project layouts and sectors', 'module' => 'projects'],

            'plots.view' => ['name' => 'View plots inside layouts', 'module' => 'projects'],
            'plots.manage' => ['name' => 'Edit plot dimensions and statuses', 'module' => 'projects'],

            'dxf.upload' => ['name' => 'Upload DXF geometry drawings', 'module' => 'gis'],
            'dxf.view' => ['name' => 'View uploaded DXF files and jobs', 'module' => 'gis'],
            'dxf.process' => ['name' => 'Trigger processing and layer mappings on DXF files', 'module' => 'gis'],

            'bookings.view' => ['name' => 'Query customer booking items', 'module' => 'sales'],
            'bookings.manage' => ['name' => 'Initiate draft booking bookings', 'module' => 'sales'],

            'collections.view' => ['name' => 'Inspect customer ledgers', 'module' => 'sales'],
            'collections.manage' => ['name' => 'Record payment collections', 'module' => 'sales'],

            'customers.view' => ['name' => 'Query customer files', 'module' => 'contacts'],
            'customers.manage' => ['name' => 'Onboard new potential customers', 'module' => 'contacts'],

            'agents.view' => ['name' => 'View broker registers', 'module' => 'contacts'],
            'agents.manage' => ['name' => 'Onboard external brokers and commissions', 'module' => 'contacts'],
        ];

        $permIds = [];
        foreach ($permissions as $code => $data) {
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

        // 5. Mappings for Role-Permissions (DB Matrix-driven)
        $mappings = [
            'PLATFORM_ADMIN' => [
                'users.view', 'users.create', 'users.update', 'users.delete',
                'roles.view', 'roles.manage', 'permissions.view', 'permissions.manage',
                'tenants.view', 'tenants.manage', 'subscriptions.view', 'subscriptions.manage',
                'audit.view', 'kyc.review', 'marketplace.publish', 'marketplace.unpublish',
                'maps.upload', 'maps.view', 'projects.view', 'projects.manage',
                'layouts.view', 'layouts.manage', 'plots.view', 'plots.manage',
                'bookings.view', 'bookings.manage', 'collections.view', 'collections.manage',
                'customers.view', 'customers.manage', 'agents.view', 'agents.manage',
                'dxf.upload', 'dxf.view', 'dxf.process'
            ],
            'PLATFORM_SUPPORT' => [
                'users.view', 'roles.view', 'permissions.view', 'tenants.view',
                'subscriptions.view', 'audit.view', 'kyc.review', 'maps.view',
                'projects.view', 'layouts.view', 'plots.view', 'bookings.view',
                'collections.view', 'customers.view', 'agents.view'
            ],
            'DEVELOPER_OWNER' => [
                'users.view', 'users.create', 'users.update', 'users.delete',
                'roles.view', 'roles.manage', 'permissions.view', 'tenants.view',
                'subscriptions.view', 'subscriptions.manage', 'audit.view',
                'marketplace.publish', 'marketplace.unpublish', 'maps.upload', 'maps.view',
                'projects.view', 'projects.manage', 'layouts.view', 'layouts.manage',
                'plots.view', 'plots.manage', 'bookings.view', 'bookings.manage',
                'collections.view', 'collections.manage', 'customers.view', 'customers.manage',
                'agents.view', 'agents.manage',
                'dxf.upload', 'dxf.view', 'dxf.process'
            ],
            'DEVELOPER_ADMIN' => [
                'users.view', 'users.create', 'users.update',
                'roles.view', 'permissions.view', 'tenants.view',
                'subscriptions.view', 'marketplace.publish', 'maps.upload', 'maps.view',
                'projects.view', 'projects.manage', 'layouts.view', 'layouts.manage',
                'plots.view', 'plots.manage', 'bookings.view', 'bookings.manage',
                'collections.view', 'customers.view', 'customers.manage',
                'dxf.upload', 'dxf.view', 'dxf.process'
            ],
            'FINANCE_MANAGER' => [
                'users.view', 'subscriptions.view', 'bookings.view',
                'collections.view', 'collections.manage', 'customers.view'
            ],
            'PROJECT_MANAGER' => [
                'users.view', 'maps.upload', 'maps.view',
                'projects.view', 'projects.manage', 'layouts.view', 'layouts.manage',
                'plots.view', 'plots.manage',
                'dxf.upload', 'dxf.view', 'dxf.process'
            ],
            'SALES_MANAGER' => [
                'users.view', 'bookings.view', 'bookings.manage',
                'collections.view', 'customers.view', 'customers.manage',
                'agents.view'
            ],
            'SALES_EXECUTIVE' => [
                'bookings.view', 'bookings.manage', 'customers.view', 'customers.manage'
            ],
            'AGENT' => [
                'marketplace.publish', 'projects.view', 'layouts.view', 'plots.view'
            ],
            'CUSTOMER' => [
                'bookings.view', 'collections.view', 'projects.view'
            ]
        ];

        foreach ($mappings as $roleCode => $pList) {
            $roleId = $roleIds[$roleCode];
            foreach ($pList as $pCode) {
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
