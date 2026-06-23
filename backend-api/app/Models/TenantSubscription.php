<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TenantSubscription extends Model
{
    protected $table = 'tenant_subscriptions';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'tenant_id', 'plan_id', 'status', 'subscription_start_date', 'subscription_expiry_date', 'trial_expiry_date', 'renewal_date'
    ];

    protected $casts = [
        'subscription_start_date' => 'date',
        'subscription_expiry_date' => 'date',
        'trial_expiry_date' => 'date',
        'renewal_date' => 'date',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function addons(): HasMany
    {
        return $this->hasMany(TenantAddon::class, 'tenant_subscription_id');
    }

    public function featureOverrides(): HasMany
    {
        return $this->hasMany(TenantFeatureOverride::class, 'tenant_subscription_id');
    }

    public function limitOverrides(): HasMany
    {
        return $this->hasMany(TenantLimitOverride::class, 'tenant_subscription_id');
    }

    public function billingOverride(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(TenantBillingOverride::class, 'tenant_subscription_id');
    }
}
