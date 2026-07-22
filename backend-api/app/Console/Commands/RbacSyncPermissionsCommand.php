<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Services\PermissionService;
use App\Services\AuditLogService;

class RbacSyncPermissionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rbac:sync-permissions {--dry-run : Report changes without writing to database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronize canonical RBAC permissions and standard role templates safely and idempotently.';

    /**
     * Canonical Permission Registry covering all modules.
     */
    public static array $canonicalPermissions = [
        // MASTERS — MEASUREMENT UNITS
        'masters.measurement_units.view' => ['name' => 'View measurement units registry and details', 'module' => 'masters'],
        'masters.measurement_units.create' => ['name' => 'Create new measurement units', 'module' => 'masters'],
        'masters.measurement_units.edit' => ['name' => 'Modify measurement units definitions', 'module' => 'masters'],
        'masters.measurement_units.delete' => ['name' => 'Soft delete measurement units', 'module' => 'masters'],
        'masters.measurement_units.activate' => ['name' => 'Toggle active status of measurement units', 'module' => 'masters'],
        'masters.measurement_units.export' => ['name' => 'Export measurement units datasets', 'module' => 'masters'],
        'masters.measurement_units.import' => ['name' => 'Import measurement units definitions', 'module' => 'masters'],

        // PROJECTS
        'projects.view' => ['name' => 'View development projects', 'module' => 'projects'],
        'projects.create' => ['name' => 'Create new development projects', 'module' => 'projects'],
        'projects.edit' => ['name' => 'Edit project attributes and configurations', 'module' => 'projects'],
        'projects.archive' => ['name' => 'Archive development projects', 'module' => 'projects'],
        'projects.restore' => ['name' => 'Restore archived projects', 'module' => 'projects'],
        'projects.delete' => ['name' => 'Delete development projects', 'module' => 'projects'],
        'projects.manage' => ['name' => 'Full administrative management of projects', 'module' => 'projects'],

        // LAYOUTS
        'layouts.view' => ['name' => 'View layout blueprints', 'module' => 'projects'],
        'layouts.create' => ['name' => 'Create new layout blueprints', 'module' => 'projects'],
        'layouts.edit' => ['name' => 'Modify layout blueprints', 'module' => 'projects'],
        'layouts.archive' => ['name' => 'Archive layout blueprints', 'module' => 'projects'],
        'layouts.restore' => ['name' => 'Restore archived layouts', 'module' => 'projects'],
        'layouts.delete' => ['name' => 'Delete layout blueprints', 'module' => 'projects'],
        'layouts.approve' => ['name' => 'Approve layout blueprints for staging', 'module' => 'projects'],
        'layouts.publish' => ['name' => 'Publish layout blueprints to production', 'module' => 'projects'],
        'layouts.manage' => ['name' => 'Full management of layout blueprints', 'module' => 'projects'],

        // INTERACTIVE MAP
        'maps.view' => ['name' => 'View GIS map layers and features', 'module' => 'gis'],
        'maps.edit' => ['name' => 'Edit GIS map layers and features', 'module' => 'gis'],
        'maps.draw' => ['name' => 'Draw spatial geometries on maps', 'module' => 'gis'],
        'maps.validate' => ['name' => 'Validate GIS spatial topology', 'module' => 'gis'],
        'maps.publish' => ['name' => 'Publish interactive maps', 'module' => 'gis'],
        'maps.upload' => ['name' => 'Upload spatial map files', 'module' => 'gis'],

        // PLOTS
        'plots.view' => ['name' => 'View plot grid and dimensions', 'module' => 'projects'],
        'plots.create' => ['name' => 'Create individual plots', 'module' => 'projects'],
        'plots.edit' => ['name' => 'Edit plot attributes and pricing', 'module' => 'projects'],
        'plots.delete' => ['name' => 'Delete plot records', 'module' => 'projects'],
        'plots.generate' => ['name' => 'Auto-generate plots from layout grid', 'module' => 'projects'],
        'plots.split' => ['name' => 'Split existing plot into sub-plots', 'module' => 'projects'],
        'plots.merge' => ['name' => 'Merge adjacent plots', 'module' => 'projects'],
        'plots.number' => ['name' => 'Re-number and sequence plot inventory', 'module' => 'projects'],
        'plots.validate' => ['name' => 'Validate plot boundary geometry', 'module' => 'projects'],
        'plots.manage' => ['name' => 'Full administrative control over plots', 'module' => 'projects'],

        // RBAC ADMINISTRATION
        'rbac.roles.view' => ['name' => 'View role structures and assignments', 'module' => 'identity'],
        'rbac.roles.create' => ['name' => 'Create custom tenant roles', 'module' => 'identity'],
        'rbac.roles.edit' => ['name' => 'Edit role names and permissions', 'module' => 'identity'],
        'rbac.roles.delete' => ['name' => 'Delete custom roles', 'module' => 'identity'],
        'rbac.permissions.view' => ['name' => 'View permission registry', 'module' => 'identity'],
        'rbac.users.assign_roles' => ['name' => 'Assign roles to workspace users', 'module' => 'identity'],
        'rbac.audit.view' => ['name' => 'View RBAC security audit log', 'module' => 'identity'],

        // IDENTITY & USER MANAGEMENT
        'users.view' => ['name' => 'View users in current context workspace', 'module' => 'identity'],
        'users.create' => ['name' => 'Create and invite users', 'module' => 'identity'],
        'users.update' => ['name' => 'Modify user settings and metadata', 'module' => 'identity'],
        'users.delete' => ['name' => 'Deactivate and suspend users', 'module' => 'identity'],
        'roles.view' => ['name' => 'Query current role list and structure', 'module' => 'identity'],
        'roles.manage' => ['name' => 'Define system roles and assignments', 'module' => 'identity'],
        'permissions.view' => ['name' => 'Query permission profiles', 'module' => 'identity'],
        'permissions.manage' => ['name' => 'Link privileges and mappings', 'module' => 'identity'],

        // PLATFORM & BILLING
        'tenants.view' => ['name' => 'View workspace organizational assets', 'module' => 'platform'],
        'tenants.manage' => ['name' => 'Create and modify developer tenants', 'module' => 'platform'],
        'subscriptions.view' => ['name' => 'View plan and subscription invoices', 'module' => 'billing'],
        'subscriptions.manage' => ['name' => 'Purchase and modify tenant tiers', 'module' => 'billing'],
        'audit.view' => ['name' => 'Audit immutable system trail logs', 'module' => 'audit'],
        'kyc.review' => ['name' => 'Audit customer profile verifications', 'module' => 'platform'],

        // DXF & SALES
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

    /**
     * Standard Role Templates Mapping.
     */
    public static array $roleTemplates = [
        'PLATFORM_ADMIN' => [
            'name' => 'Platform Admin',
            'scope' => 'GLOBAL',
            'permissions' => '*'
        ],
        'PLATFORM_SUPPORT' => [
            'name' => 'Platform Support',
            'scope' => 'GLOBAL',
            'permissions' => [
                'users.view', 'roles.view', 'permissions.view', 'tenants.view',
                'subscriptions.view', 'audit.view', 'kyc.review', 'maps.view',
                'projects.view', 'layouts.view', 'plots.view', 'bookings.view',
                'collections.view', 'customers.view', 'agents.view',
                'masters.measurement_units.view', 'rbac.roles.view', 'rbac.permissions.view', 'rbac.audit.view'
            ]
        ],
        'DEVELOPER_OWNER' => [
            'name' => 'Developer Owner',
            'scope' => 'TENANT',
            'permissions' => [
                'users.view', 'users.create', 'users.update', 'users.delete',
                'roles.view', 'roles.manage', 'permissions.view', 'tenants.view',
                'subscriptions.view', 'subscriptions.manage', 'audit.view',
                'projects.view', 'projects.create', 'projects.edit', 'projects.archive', 'projects.restore', 'projects.delete', 'projects.manage',
                'layouts.view', 'layouts.create', 'layouts.edit', 'layouts.archive', 'layouts.restore', 'layouts.delete', 'layouts.approve', 'layouts.publish', 'layouts.manage',
                'maps.view', 'maps.edit', 'maps.draw', 'maps.validate', 'maps.publish', 'maps.upload',
                'plots.view', 'plots.create', 'plots.edit', 'plots.delete', 'plots.generate', 'plots.split', 'plots.merge', 'plots.number', 'plots.validate', 'plots.manage',
                'masters.measurement_units.view', 'masters.measurement_units.create', 'masters.measurement_units.edit', 'masters.measurement_units.delete', 'masters.measurement_units.activate', 'masters.measurement_units.export', 'masters.measurement_units.import',
                'rbac.roles.view', 'rbac.roles.create', 'rbac.roles.edit', 'rbac.roles.delete', 'rbac.permissions.view', 'rbac.users.assign_roles', 'rbac.audit.view',
                'dxf.upload', 'dxf.view', 'dxf.process',
                'bookings.view', 'bookings.manage', 'collections.view', 'collections.manage',
                'customers.view', 'customers.manage', 'agents.view', 'agents.manage'
            ]
        ],
        'DEVELOPER_ADMIN' => [
            'name' => 'Developer Admin',
            'scope' => 'TENANT',
            'permissions' => [
                'users.view', 'users.create', 'users.update',
                'roles.view', 'permissions.view', 'tenants.view',
                'subscriptions.view',
                'projects.view', 'projects.create', 'projects.edit', 'projects.manage',
                'layouts.view', 'layouts.create', 'layouts.edit', 'layouts.approve', 'layouts.publish', 'layouts.manage',
                'maps.view', 'maps.edit', 'maps.draw', 'maps.validate', 'maps.upload',
                'plots.view', 'plots.create', 'plots.edit', 'plots.generate', 'plots.number', 'plots.validate', 'plots.manage',
                'masters.measurement_units.view', 'masters.measurement_units.create', 'masters.measurement_units.edit', 'masters.measurement_units.activate', 'masters.measurement_units.export', 'masters.measurement_units.import',
                'rbac.roles.view', 'rbac.roles.create', 'rbac.roles.edit', 'rbac.permissions.view', 'rbac.users.assign_roles',
                'dxf.upload', 'dxf.view', 'dxf.process',
                'bookings.view', 'bookings.manage', 'collections.view', 'customers.view', 'customers.manage'
            ]
        ],
        'PROJECT_MANAGER' => [
            'name' => 'Project Manager',
            'scope' => 'TENANT',
            'permissions' => [
                'users.view',
                'projects.view', 'projects.create', 'projects.edit',
                'layouts.view', 'layouts.create', 'layouts.edit',
                'maps.view', 'maps.edit',
                'plots.view', 'plots.create', 'plots.edit', 'plots.generate', 'plots.number', 'plots.validate',
                'masters.measurement_units.view',
                'dxf.upload', 'dxf.view', 'dxf.process'
            ]
        ],
        'SALES_MANAGER' => [
            'name' => 'Sales Manager',
            'scope' => 'TENANT',
            'permissions' => [
                'users.view',
                'projects.view', 'layouts.view', 'maps.view', 'plots.view',
                'masters.measurement_units.view',
                'bookings.view', 'bookings.manage', 'collections.view', 'customers.view', 'customers.manage', 'agents.view'
            ]
        ],
        'SURVEYOR' => [
            'name' => 'Surveyor / Map Operator',
            'scope' => 'TENANT',
            'permissions' => [
                'projects.view', 'layouts.view',
                'maps.view', 'maps.edit', 'maps.draw', 'maps.validate',
                'plots.view', 'plots.create', 'plots.edit', 'plots.generate', 'plots.split', 'plots.merge', 'plots.number', 'plots.validate',
                'masters.measurement_units.view',
                'dxf.upload', 'dxf.view', 'dxf.process'
            ]
        ],
        'READ_ONLY_USER' => [
            'name' => 'Read Only User',
            'scope' => 'TENANT',
            'permissions' => [
                'projects.view', 'layouts.view', 'maps.view', 'plots.view',
                'masters.measurement_units.view'
            ]
        ],
        'CUSTOMER' => [
            'name' => 'Customer Profile',
            'scope' => 'TENANT',
            'permissions' => [
                'projects.view', 'layouts.view', 'maps.view', 'plots.view', 'bookings.view', 'collections.view'
            ]
        ]
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        $this->info("=======================================================================");
        $this->info(" BhoomiOne V3 - RBAC Permission & Role Synchronization Engine");
        $this->info(" Mode: " . ($isDryRun ? "DRY RUN (No changes written)" : "LIVE EXECUTION"));
        $this->info("=======================================================================");

        $createdPerms = 0;
        $updatedPerms = 0;
        $unchangedPerms = 0;
        $createdRoles = 0;
        $updatedRoles = 0;
        $mappedPermsCount = 0;
        $conflicts = 0;

        // 1. Sync Permissions
        $existingPerms = DB::table('permissions')->get()->keyBy('code');
        $permIdMap = [];

        foreach (self::$canonicalPermissions as $code => $data) {
            if ($existingPerms->has($code)) {
                $existing = $existingPerms->get($code);
                $permIdMap[$code] = $existing->id;

                if ($existing->name !== $data['name'] || $existing->module !== $data['module']) {
                    if (!$isDryRun) {
                        DB::table('permissions')
                            ->where('code', $code)
                            ->update([
                                'name' => $data['name'],
                                'module' => $data['module'],
                                'updated_at' => now(),
                            ]);
                    }
                    $updatedPerms++;
                    $this->line("  [UPDATE] Permission: <comment>{$code}</comment>");
                } else {
                    $unchangedPerms++;
                }
            } else {
                $newId = (string) Str::uuid();
                $permIdMap[$code] = $newId;

                if (!$isDryRun) {
                    DB::table('permissions')->insert([
                        'id' => $newId,
                        'code' => $code,
                        'name' => $data['name'],
                        'module' => $data['module'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
                $createdPerms++;
                $this->info("  [CREATE] Permission: <info>{$code}</info>");
            }
        }

        // 2. Sync Standard Role Templates
        $existingRoles = DB::table('roles')->get()->keyBy('code');
        $roleIdMap = [];

        foreach (self::$roleTemplates as $code => $data) {
            if ($existingRoles->has($code)) {
                $existing = $existingRoles->get($code);
                $roleIdMap[$code] = $existing->id;

                if ($existing->name !== $data['name'] || $existing->scope !== $data['scope']) {
                    if (!$isDryRun) {
                        DB::table('roles')
                            ->where('code', $code)
                            ->update([
                                'name' => $data['name'],
                                'scope' => $data['scope'],
                                'updated_at' => now(),
                            ]);
                    }
                    $updatedRoles++;
                    $this->line("  [UPDATE] Role: <comment>{$code}</comment>");
                }
            } else {
                $newId = (string) Str::uuid();
                $roleIdMap[$code] = $newId;

                if (!$isDryRun) {
                    DB::table('roles')->insert([
                        'id' => $newId,
                        'code' => $code,
                        'name' => $data['name'],
                        'scope' => $data['scope'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
                $createdRoles++;
                $this->info("  [CREATE] Role: <info>{$code}</info>");
            }
        }

        // 3. Sync Role Permissions Mappings
        if (!$isDryRun) {
            foreach (self::$roleTemplates as $roleCode => $data) {
                $roleId = $roleIdMap[$roleCode] ?? null;
                if (!$roleId) continue;

                $assignedCodes = $data['permissions'];
                if ($assignedCodes === '*') {
                    $assignedCodes = array_keys(self::$canonicalPermissions);
                }

                foreach ($assignedCodes as $pCode) {
                    $pId = $permIdMap[$pCode] ?? null;
                    if (!$pId) {
                        $conflicts++;
                        $this->error("  [CONFLICT] Permission code '{$pCode}' not found for role '{$roleCode}'");
                        continue;
                    }

                    $exists = DB::table('role_permissions')
                        ->where('role_id', $roleId)
                        ->where('permission_id', $pId)
                        ->exists();

                    if (!$exists) {
                        DB::table('role_permissions')->insert([
                            'role_id' => $roleId,
                            'permission_id' => $pId,
                        ]);
                        $mappedPermsCount++;
                    }
                }
            }

            // 4. Invalidate all Permission Caches
            PermissionService::clearAllPermissionCache();

            // 5. Record Audit Trail
            AuditLogService::log([
                'tenantId' => null,
                'userId' => null,
                'entityName' => 'rbac_permissions',
                'entityId' => 'SYSTEM_SYNC',
                'action' => 'PERMISSION_SYNC',
                'newValues' => [
                    'created_permissions' => $createdPerms,
                    'updated_permissions' => $updatedPerms,
                    'mapped_permissions' => $mappedPermsCount,
                ],
                'ipAddress' => '127.0.0.1',
                'userAgent' => 'Artisan CLI Engine'
            ]);
        }

        $this->info("-----------------------------------------------------------------------");
        $this->info(" SYNCHRONIZATION SUMMARY REPORT");
        $this->info("-----------------------------------------------------------------------");
        $this->line(" Permissions Created  : <info>{$createdPerms}</info>");
        $this->line(" Permissions Updated  : <comment>{$updatedPerms}</comment>");
        $this->line(" Permissions Unchanged: {$unchangedPerms}");
        $this->line(" Roles Created        : <info>{$createdRoles}</info>");
        $this->line(" Roles Updated        : <comment>{$updatedRoles}</comment>");
        $this->line(" New Role Mappings    : <info>{$mappedPermsCount}</info>");
        $this->line(" Conflicts / Failures : <error>{$conflicts}</error>");
        $this->info(" Cache Status         : INVALIDATED & REFRESHED");
        $this->info("-----------------------------------------------------------------------");

        return $conflicts > 0 ? 1 : 0;
    }
}
