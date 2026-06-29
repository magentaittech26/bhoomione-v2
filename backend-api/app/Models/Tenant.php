<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tenant extends Model
{
    protected $table = 'tenants';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_code',
        'company_name',
        'status',
        'infrastructure_tier',
        'database_host',
        'database_name',
        'database_port',
        'lifecycle_status',
        'suspended_at',
        'archived_at',
        'deletion_requested_at',
        'deletion_scheduled_at',
        'deleted_reason',
        'backup_reference',
    ];

    /**
     * Mapped domains.
     */
    public function domains(): HasMany
    {
        return $this->hasMany(TenantDomain::class, 'tenant_id');
    }

    /**
     * Tenant active subscription model.
     */
    public function subscription()
    {
        return $this->hasOne(TenantSubscription::class, 'tenant_id');
    }

    /**
     * Tenant provisioning jobs ledger.
     */
    public function provisioningJobs(): HasMany
    {
        return $this->hasMany(TenantProvisioningJob::class, 'tenant_id');
    }

    /**
     * Tenant lifecycle status transition ledger records.
     */
    public function lifecycleEvents(): HasMany
    {
        return $this->hasMany(TenantLifecycleEvent::class, 'tenant_id');
    }

    /**
     * Associated users in this workspace cluster.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tenant_users', 'tenant_id', 'user_id')
            ->withPivot('role_id')
            ->withTimestamps();
    }

    /**
     * Audit events logged in this tenant's namespace.
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'tenant_id');
    }

    /**
     * Public developer profile.
     */
    public function developerProfile()
    {
        return $this->hasOne(DeveloperProfile::class, 'tenant_id');
    }

    /**
     * Leads received from public marketplace.
     */
    public function marketplaceLeads(): HasMany
    {
        return $this->hasMany(MarketplaceLead::class, 'tenant_id');
    }
}
