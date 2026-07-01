<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PromoCoupon extends Model
{
    protected $table = 'promo_coupons';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'code',
        'type',
        'value',
        'campaign_id',
        'expiry_date',
        'max_uses',
        'current_uses',
        'tenant_id',
        'builder_name',
        'status',
    ];

    protected $casts = [
        'value' => 'float',
        'expiry_date' => 'date',
        'max_uses' => 'integer',
        'current_uses' => 'integer',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(PromoCampaign::class, 'campaign_id', 'id');
    }
}
