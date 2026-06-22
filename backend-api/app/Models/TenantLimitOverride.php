<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantLimitOverride extends Model
{
    protected $table = 'tenant_limit_overrides';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'tenant_subscription_id', 'limit_key', 'override_value'
    ];

    protected $casts = [
        'override_value' => 'integer'
    ];

    public function tenantSubscription(): BelongsTo
    {
        return $this->belongsTo(TenantSubscription::class, 'tenant_subscription_id');
    }
}
