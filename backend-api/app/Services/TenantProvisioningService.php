<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\TenantSubscription;
use App\Models\TenantAddon;
use App\Models\TenantProvisioningJob;
use App\Models\TenantLifecycleEvent;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Services\AuditLogService;

class TenantProvisioningService
{
    /**
     * Set of allowed transitions.
     */
    public static function isValidTransition(string $oldStatus, string $newStatus): bool
    {
        $allowed = [
            'TRIAL' => ['ACTIVE'],
            'ACTIVE' => ['SUSPENDED', 'CANCELLED', 'EXPIRED'],
            'SUSPENDED' => ['ACTIVE'],
        ];

        if (!isset($allowed[$oldStatus])) {
            return false;
        }

        return in_array($newStatus, $allowed[$oldStatus]);
    }

    /**
     * Create a Tenant with Initial Subscription and Domain.
     */
    public static function createTenant(array $data, array $context): Tenant
    {
        return DB::transaction(function () use ($data, $context) {
            $tenantId = (string) Str::uuid();
            
            // Create tenant record
            $tenant = Tenant::create([
                'id' => $tenantId,
                'tenant_code' => strtolower($data['tenant_code']),
                'company_name' => $data['company_name'],
                'status' => 'ACTIVE', // ACTIVE so TenantResolverMiddleware resolves. Sub status will govern access details
                'infrastructure_tier' => $data['infrastructure_tier'] ?? 'SHARED',
                'database_host' => $data['database_host'] ?? null,
                'database_name' => $data['database_name'] ?? null,
                'database_port' => $data['database_port'] ?? null,
            ]);

            // Create secondary companion domain record
            $domain = TenantDomain::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $tenantId,
                'domain' => $data['domain'],
                'domain_name' => $data['domain_name'] ?? $data['domain'],
                'type' => $data['domain_type'] ?? 'SUBDOMAIN',
                'is_primary' => true,
                'ssl_status' => 'ACTIVE',
                'dns_status' => 'ACTIVE',
                'verified_at' => now(),
            ]);

            // Create initial subscription record
            $subId = (string) Str::uuid();
            $subscription = TenantSubscription::create([
                'id' => $subId,
                'tenant_id' => $tenantId,
                'plan_id' => $data['plan_id'],
                'status' => $data['initial_status'] ?? 'TRIAL',
                'subscription_start_date' => now(),
                'subscription_expiry_date' => now()->addYear(),
                'trial_expiry_date' => now()->addDays(14),
                'renewal_date' => now()->addDays(14),
            ]);

            // Log Provisioning Job
            TenantProvisioningJob::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $tenantId,
                'job_type' => 'CREATE',
                'status' => 'SUCCESS',
                'started_at' => now(),
                'completed_at' => now(),
                'created_by' => $context['userId'] ?? null,
            ]);

            // Log Lifecycle Event
            TenantLifecycleEvent::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $tenantId,
                'old_status' => null,
                'new_status' => $data['initial_status'] ?? 'TRIAL',
                'reason' => 'Tenant initialized on plan via platform admin operations',
                'changed_by' => $context['userId'] ?? null,
                'created_at' => now(),
            ]);

            // Audit
            AuditLogService::log([
                'tenantId' => $tenantId,
                'userId' => $context['userId'] ?? null,
                'entityName' => 'Tenant',
                'entityId' => $tenantId,
                'action' => 'TENANT_CREATED',
                'newValues' => $tenant->toArray(),
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $tenant;
        });
    }

    /**
     * Activate Tenant Subscription.
     */
    public static function activateTenant(string $id, array $context): TenantSubscription
    {
        return DB::transaction(function () use ($id, $context) {
            $sub = TenantSubscription::where('tenant_id', $id)->firstOrFail();
            $oldStatus = $sub->status;

            if ($oldStatus === 'ACTIVE') {
                return $sub; // already active
            }

            if (!self::isValidTransition($oldStatus, 'ACTIVE')) {
                throw new \InvalidArgumentException("INVALID_STATUS_TRANSITION");
            }

            $sub->status = 'ACTIVE';
            $sub->subscription_expiry_date = now()->addYear();
            $sub->renewal_date = now()->addYear();
            $sub->save();

            // Make sure tenant parent is ACTIVE too
            $tenant = Tenant::findOrFail($id);
            $tenant->status = 'ACTIVE';
            $tenant->save();

            // Provisioning Job
            TenantProvisioningJob::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'job_type' => 'ACTIVATE',
                'status' => 'SUCCESS',
                'started_at' => now(),
                'completed_at' => now(),
                'created_by' => $context['userId'] ?? null,
            ]);

            // Lifecycle event
            TenantLifecycleEvent::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'old_status' => $oldStatus,
                'new_status' => 'ACTIVE',
                'reason' => 'Subscribed from trial state',
                'changed_by' => $context['userId'] ?? null,
                'created_at' => now(),
            ]);

            // Audit
            AuditLogService::log([
                'tenantId' => $id,
                'userId' => $context['userId'] ?? null,
                'entityName' => 'TenantSubscription',
                'entityId' => $sub->id,
                'action' => 'TENANT_ACTIVATED',
                'oldValues' => ['status' => $oldStatus],
                'newValues' => ['status' => 'ACTIVE'],
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $sub;
        });
    }

    /**
     * Suspend Tenant.
     */
    public static function suspendTenant(string $id, string $reason, array $context): TenantSubscription
    {
        return DB::transaction(function () use ($id, $reason, $context) {
            $sub = TenantSubscription::where('tenant_id', $id)->firstOrFail();
            $oldStatus = $sub->status;

            if ($oldStatus === 'SUSPENDED') {
                return $sub;
            }

            if (!self::isValidTransition($oldStatus, 'SUSPENDED')) {
                throw new \InvalidArgumentException("INVALID_STATUS_TRANSITION");
            }

            $sub->status = 'SUSPENDED';
            $sub->save();

            // Set parent tenant status to SUSPENDED to lock downstream resolution
            $tenant = Tenant::findOrFail($id);
            $tenant->status = 'SUSPENDED';
            $tenant->save();

            // Job
            TenantProvisioningJob::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'job_type' => 'SUSPEND',
                'status' => 'SUCCESS',
                'started_at' => now(),
                'completed_at' => now(),
                'created_by' => $context['userId'] ?? null,
            ]);

            // Lifecycle event
            TenantLifecycleEvent::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'old_status' => $oldStatus,
                'new_status' => 'SUSPENDED',
                'reason' => $reason ?: 'Standard administrative suspension',
                'changed_by' => $context['userId'] ?? null,
                'created_at' => now(),
            ]);

            // Audit
            AuditLogService::log([
                'tenantId' => $id,
                'userId' => $context['userId'] ?? null,
                'entityName' => 'TenantSubscription',
                'entityId' => $sub->id,
                'action' => 'TENANT_SUSPENDED',
                'oldValues' => ['status' => $oldStatus],
                'newValues' => ['status' => 'SUSPENDED'],
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $sub;
        });
    }

    /**
     * Resume Tenant.
     */
    public static function resumeTenant(string $id, array $context): TenantSubscription
    {
        return DB::transaction(function () use ($id, $context) {
            $sub = TenantSubscription::where('tenant_id', $id)->firstOrFail();
            $oldStatus = $sub->status;

            if ($oldStatus === 'ACTIVE') {
                return $sub;
            }

            if (!self::isValidTransition($oldStatus, 'ACTIVE')) {
                throw new \InvalidArgumentException("INVALID_STATUS_TRANSITION");
            }

            $sub->status = 'ACTIVE';
            $sub->save();

            // Restore parent tenant to ACTIVE
            $tenant = Tenant::findOrFail($id);
            $tenant->status = 'ACTIVE';
            $tenant->save();

            // Job
            TenantProvisioningJob::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'job_type' => 'RESUME',
                'status' => 'SUCCESS',
                'started_at' => now(),
                'completed_at' => now(),
                'created_by' => $context['userId'] ?? null,
            ]);

            // Lifecycle event
            TenantLifecycleEvent::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'old_status' => $oldStatus,
                'new_status' => 'ACTIVE',
                'reason' => 'Administrative subscription reactivation',
                'changed_by' => $context['userId'] ?? null,
                'created_at' => now(),
            ]);

            // Audit
            AuditLogService::log([
                'tenantId' => $id,
                'userId' => $context['userId'] ?? null,
                'entityName' => 'TenantSubscription',
                'entityId' => $sub->id,
                'action' => 'TENANT_RESUMED',
                'oldValues' => ['status' => $oldStatus],
                'newValues' => ['status' => 'ACTIVE'],
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $sub;
        });
    }

    /**
     * Cancel Tenant.
     */
    public static function cancelTenant(string $id, string $reason, array $context): TenantSubscription
    {
        return DB::transaction(function () use ($id, $reason, $context) {
            $sub = TenantSubscription::where('tenant_id', $id)->firstOrFail();
            $oldStatus = $sub->status;

            if ($oldStatus === 'CANCELLED') {
                return $sub;
            }

            if (!self::isValidTransition($oldStatus, 'CANCELLED')) {
                throw new \InvalidArgumentException("INVALID_STATUS_TRANSITION");
            }

            $sub->status = 'CANCELLED';
            $sub->save();

            // Deactivate resolver scope
            $tenant = Tenant::findOrFail($id);
            $tenant->status = 'SUSPENDED'; // block resolution completely
            $tenant->save();

            // Job
            TenantProvisioningJob::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'job_type' => 'CANCEL',
                'status' => 'SUCCESS',
                'started_at' => now(),
                'completed_at' => now(),
                'created_by' => $context['userId'] ?? null,
            ]);

            // Lifecycle event
            TenantLifecycleEvent::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'old_status' => $oldStatus,
                'new_status' => 'CANCELLED',
                'reason' => $reason ?: 'Standard tenant cancellation request',
                'changed_by' => $context['userId'] ?? null,
                'created_at' => now(),
            ]);

            // Audit
            AuditLogService::log([
                'tenantId' => $id,
                'userId' => $context['userId'] ?? null,
                'entityName' => 'TenantSubscription',
                'entityId' => $sub->id,
                'action' => 'TENANT_CANCELLED',
                'oldValues' => ['status' => $oldStatus],
                'newValues' => ['status' => 'CANCELLED'],
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $sub;
        });
    }

    /**
     * Change Plan.
     */
    public static function changePlan(string $id, string $planId, array $context): TenantSubscription
    {
        return DB::transaction(function () use ($id, $planId, $context) {
            $sub = TenantSubscription::where('tenant_id', $id)->firstOrFail();
            $oldPlanId = $sub->plan_id;

            if ($oldPlanId === $planId) {
                return $sub;
            }

            $sub->plan_id = $planId;
            $sub->save();

            // Job
            TenantProvisioningJob::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'job_type' => 'CHANGE_PLAN',
                'status' => 'SUCCESS',
                'started_at' => now(),
                'completed_at' => now(),
                'created_by' => $context['userId'] ?? null,
            ]);

            // Audit
            AuditLogService::log([
                'tenantId' => $id,
                'userId' => $context['userId'] ?? null,
                'entityName' => 'TenantSubscription',
                'entityId' => $sub->id,
                'action' => 'PLAN_CHANGED',
                'oldValues' => ['plan_id' => $oldPlanId],
                'newValues' => ['plan_id' => $planId],
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $sub;
        });
    }

    /**
     * Assign Addon.
     */
    public static function assignAddon(string $id, string $addonId, array $context): TenantAddon
    {
        return DB::transaction(function () use ($id, $addonId, $context) {
            $sub = TenantSubscription::where('tenant_id', $id)->firstOrFail();

            $addon = TenantAddon::updateOrCreate([
                'tenant_subscription_id' => $sub->id,
                'addon_id' => $addonId,
            ], [
                'id' => (string) Str::uuid(),
                'assigned_at' => now(),
            ]);

            // Job
            TenantProvisioningJob::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'job_type' => 'ASSIGN_ADDON',
                'status' => 'SUCCESS',
                'started_at' => now(),
                'completed_at' => now(),
                'created_by' => $context['userId'] ?? null,
            ]);

            // Audit
            AuditLogService::log([
                'tenantId' => $id,
                'userId' => $context['userId'] ?? null,
                'entityName' => 'TenantAddon',
                'entityId' => $addon->id,
                'action' => 'ADDON_ASSIGNED',
                'newValues' => ['addon_id' => $addonId],
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $addon;
        });
    }

    /**
     * Remove Addon.
     */
    public static function removeAddon(string $id, string $addonId, array $context): void
    {
        DB::transaction(function () use ($id, $addonId, $context) {
            $sub = TenantSubscription::where('tenant_id', $id)->firstOrFail();
            
            $addon = TenantAddon::where('tenant_subscription_id', $sub->id)
                ->where('addon_id', $addonId)
                ->first();

            if ($addon) {
                $addonIdSaved = $addon->id;
                $addon->delete();

                // Job
                TenantProvisioningJob::create([
                    'id' => (string) Str::uuid(),
                    'tenant_id' => $id,
                    'job_type' => 'REMOVE_ADDON',
                    'status' => 'SUCCESS',
                    'started_at' => now(),
                    'completed_at' => now(),
                    'created_by' => $context['userId'] ?? null,
                ]);

                // Audit
                AuditLogService::log([
                    'tenantId' => $id,
                    'userId' => $context['userId'] ?? null,
                    'entityName' => 'TenantAddon',
                    'entityId' => $addonIdSaved,
                    'action' => 'ADDON_REMOVED',
                    'oldValues' => ['addon_id' => $addonId],
                    'ipAddress' => $context['ip'] ?? null,
                    'userAgent' => $context['userAgent'] ?? null,
                ]);
            }
        });
    }

    /**
     * Attach Domain.
     */
    public static function attachDomain(string $id, string $domainName, string $type, array $context): TenantDomain
    {
        return DB::transaction(function () use ($id, $domainName, $type, $context) {
            // Check if subdomain / custom domain exists
            $exists = TenantDomain::where('domain_name', strtolower($domainName))
                ->orWhere('domain', strtolower($domainName))
                ->exists();

            if ($exists) {
                throw new \InvalidArgumentException("DOMAIN_ALREADY_EXISTS");
            }

            $domain = TenantDomain::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'domain' => strtolower($domainName),
                'domain_name' => strtolower($domainName),
                'type' => strtoupper($type),
                'is_primary' => false,
                'ssl_status' => 'PENDING',
                'dns_status' => 'PENDING',
                'verified_at' => null,
            ]);

            // Job
            TenantProvisioningJob::create([
                'id' => (string) Str::uuid(),
                'tenant_id' => $id,
                'job_type' => 'ATTACH_DOMAIN',
                'status' => 'SUCCESS',
                'started_at' => now(),
                'completed_at' => now(),
                'created_by' => $context['userId'] ?? null,
            ]);

            // Audit
            AuditLogService::log([
                'tenantId' => $id,
                'userId' => $context['userId'] ?? null,
                'entityName' => 'TenantDomain',
                'entityId' => $domain->id,
                'action' => 'DOMAIN_ATTACHED',
                'newValues' => ['domain' => $domainName, 'type' => $type],
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $domain;
        });
    }
}
