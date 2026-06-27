<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantModuleOverride extends Model
{
    protected $table = 'tenant_module_overrides';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'tenant_subscription_id', 'module_id', 'override_status'
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(TenantSubscription::class, 'tenant_subscription_id');
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(SaasModule::class, 'module_id');
    }
}
