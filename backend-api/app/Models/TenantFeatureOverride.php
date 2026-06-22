<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantFeatureOverride extends Model
{
    protected $table = 'tenant_feature_overrides';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'tenant_subscription_id', 'feature_id', 'override_status'
    ];

    public function tenantSubscription(): BelongsTo
    {
        return $this->belongsTo(TenantSubscription::class, 'tenant_subscription_id');
    }

    public function feature(): BelongsTo
    {
        return $this->belongsTo(SaasFeature::class, 'feature_id');
    }
}
