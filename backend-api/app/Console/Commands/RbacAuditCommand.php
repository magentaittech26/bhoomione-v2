<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Services\PermissionService;

class RbacAuditCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rbac:audit {--fix : Attempt safe automated repair of identified anomalies}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Audit RBAC database integrity for duplicate permissions, orphan pivots, unassigned users, and missing master permissions.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $shouldFix = $this->option('fix');

        $this->info("=======================================================================");
        $this->info(" BhoomiOne V3 - RBAC Database Integrity & Audit Analysis");
        $this->info(" Mode: " . ($shouldFix ? "AUDIT & AUTOMATED SAFE REPAIR" : "AUDIT ONLY (REPORT)"));
        $this->info("=======================================================================");

        $issuesFound = 0;
        $repairedCount = 0;

        // 1. Check duplicate permission codes
        $dups = DB::table('permissions')
            ->select('code', DB::raw('COUNT(*) as total'))
            ->groupBy('code')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        if ($dups->isNotEmpty()) {
            $issuesFound += $dups->count();
            $this->error(" ❌ [ANOMALY] Found {$dups->count()} duplicate permission codes!");
            foreach ($dups as $d) {
                $this->line("    - Code: {$d->code} (Count: {$d->total})");
            }
        } else {
            $this->info(" ✅ Duplicate permissions check: PASSED");
        }

        // 2. Orphan role_permissions
        $orphanRolePerms = DB::table('role_permissions')
            ->leftJoin('roles', 'role_permissions.role_id', '=', 'roles.id')
            ->leftJoin('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->whereNull('roles.id')
            ->orWhereNull('permissions.id')
            ->select('role_permissions.*')
            ->get();

        if ($orphanRolePerms->isNotEmpty()) {
            $issuesFound += $orphanRolePerms->count();
            $this->error(" ❌ [ANOMALY] Found {$orphanRolePerms->count()} orphan role_permissions records!");

            if ($shouldFix) {
                DB::table('role_permissions')
                    ->leftJoin('roles', 'role_permissions.role_id', '=', 'roles.id')
                    ->leftJoin('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
                    ->whereNull('roles.id')
                    ->orWhereNull('permissions.id')
                    ->delete();
                $repairedCount += $orphanRolePerms->count();
                $this->info("    -> REPAIRED: Cleaned orphan role_permissions rows.");
            }
        } else {
            $this->info(" ✅ Orphan role_permissions check: PASSED");
        }

        // 3. Orphan user_roles
        $orphanUserRoles = DB::table('user_roles')
            ->leftJoin('users', 'user_roles.user_id', '=', 'users.id')
            ->leftJoin('roles', 'user_roles.role_id', '=', 'roles.id')
            ->whereNull('users.id')
            ->orWhereNull('roles.id')
            ->select('user_roles.*')
            ->get();

        if ($orphanUserRoles->isNotEmpty()) {
            $issuesFound += $orphanUserRoles->count();
            $this->error(" ❌ [ANOMALY] Found {$orphanUserRoles->count()} orphan user_roles records!");

            if ($shouldFix) {
                DB::table('user_roles')
                    ->leftJoin('users', 'user_roles.user_id', '=', 'users.id')
                    ->leftJoin('roles', 'user_roles.role_id', '=', 'roles.id')
                    ->whereNull('users.id')
                    ->orWhereNull('roles.id')
                    ->delete();
                $repairedCount += $orphanUserRoles->count();
                $this->info("    -> REPAIRED: Cleaned orphan user_roles rows.");
            }
        } else {
            $this->info(" ✅ Orphan user_roles check: PASSED");
        }

        // 4. Orphan tenant_users
        $orphanTenantUsers = DB::table('tenant_users')
            ->leftJoin('users', 'tenant_users.user_id', '=', 'users.id')
            ->leftJoin('tenants', 'tenant_users.tenant_id', '=', 'tenants.id')
            ->leftJoin('roles', 'tenant_users.role_id', '=', 'roles.id')
            ->whereNull('users.id')
            ->orWhereNull('tenants.id')
            ->orWhereNull('roles.id')
            ->select('tenant_users.*')
            ->get();

        if ($orphanTenantUsers->isNotEmpty()) {
            $issuesFound += $orphanTenantUsers->count();
            $this->error(" ❌ [ANOMALY] Found {$orphanTenantUsers->count()} orphan tenant_users records!");

            if ($shouldFix) {
                DB::table('tenant_users')
                    ->leftJoin('users', 'tenant_users.user_id', '=', 'users.id')
                    ->leftJoin('tenants', 'tenant_users.tenant_id', '=', 'tenants.id')
                    ->leftJoin('roles', 'tenant_users.role_id', '=', 'roles.id')
                    ->whereNull('users.id')
                    ->orWhereNull('tenants.id')
                    ->orWhereNull('roles.id')
                    ->delete();
                $repairedCount += $orphanTenantUsers->count();
                $this->info("    -> REPAIRED: Cleaned orphan tenant_users rows.");
            }
        } else {
            $this->info(" ✅ Orphan tenant_users check: PASSED");
        }

        // 5. Users without assigned roles
        $usersWithoutRoles = DB::table('users')
            ->leftJoin('user_roles', 'users.id', '=', 'user_roles.user_id')
            ->leftJoin('tenant_users', 'users.id', '=', 'tenant_users.user_id')
            ->whereNull('user_roles.user_id')
            ->whereNull('tenant_users.user_id')
            ->select('users.id', 'users.name', 'users.email')
            ->get();

        if ($usersWithoutRoles->isNotEmpty()) {
            $issuesFound += $usersWithoutRoles->count();
            $this->error(" ⚠️ [WARNING] Found {$usersWithoutRoles->count()} users without any role assignments!");
            foreach ($usersWithoutRoles as $u) {
                $this->line("    - User: {$u->name} <{$u->email}> (ID: {$u->id})");
            }
        } else {
            $this->info(" ✅ Users with assigned roles check: PASSED");
        }

        // 6. Check missing Measurement Unit permissions
        $muPerms = [
            'masters.measurement_units.view',
            'masters.measurement_units.create',
            'masters.measurement_units.edit',
            'masters.measurement_units.delete',
            'masters.measurement_units.activate',
            'masters.measurement_units.export',
            'masters.measurement_units.import'
        ];

        $existingMuCodes = DB::table('permissions')
            ->whereIn('code', $muPerms)
            ->pluck('code')
            ->toArray();

        $missingMu = array_diff($muPerms, $existingMuCodes);

        if (!empty($missingMu)) {
            $issuesFound += count($missingMu);
            $this->error(" ❌ [DEFECT] Missing " . count($missingMu) . " Measurement Unit permissions: " . implode(', ', $missingMu));

            if ($shouldFix) {
                $this->call('rbac:sync-permissions');
                $repairedCount += count($missingMu);
                $this->info("    -> REPAIRED: Executed rbac:sync-permissions to restore missing measurement unit permissions.");
            }
        } else {
            $this->info(" ✅ Measurement Unit permissions check: PASSED");
        }

        $this->info("-----------------------------------------------------------------------");
        $this->info(" AUDIT SUMMARY");
        $this->info("-----------------------------------------------------------------------");
        $this->line(" Total Anomaly Issues Identified: " . ($issuesFound > 0 ? "<error>{$issuesFound}</error>" : "<info>0</info>"));
        if ($shouldFix) {
            $this->line(" Total Anomaly Issues Repaired  : <info>{$repairedCount}</info>");
        } else if ($issuesFound > 0) {
            $this->comment(" Run 'php artisan rbac:audit --fix' to automatically resolve safe anomalies.");
        }
        $this->info("-----------------------------------------------------------------------");

        return $issuesFound > 0 ? 1 : 0;
    }
}
