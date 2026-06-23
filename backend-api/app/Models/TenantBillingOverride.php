<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantBillingOverride extends Model
{
    protected $table = 'tenant_billing_overrides';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_subscription_id',
        'custom_monthly_fee',
        'custom_annual_fee',
        'custom_discount_percentage',
        'special_contract_notes'
    ];

    protected $casts = [
        'custom_monthly_fee' => 'float',
        'custom_annual_fee' => 'float',
        'custom_discount_percentage' => 'float',
    ];

    public function tenantSubscription(): BelongsTo
    {
        return $this->belongsTo(TenantSubscription::class, 'tenant_subscription_id');
    }
}
