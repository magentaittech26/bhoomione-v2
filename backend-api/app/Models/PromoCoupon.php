<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PromoCoupon extends Model
{
    use SoftDeletes;

    protected $table = 'promo_coupons';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'code',
        'type',
        'value',
        'campaign_id',
        'start_date',
        'expiry_date',
        'max_uses',
        'current_uses',
        'tenant_id',
        'builder_name',
        'status',
    ];

    protected $casts = [
        'value' => 'float',
        'start_date' => 'date',
        'expiry_date' => 'date',
        'max_uses' => 'integer',
        'current_uses' => 'integer',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(PromoCampaign::class, 'campaign_id', 'id');
    }

    public function getCalculatedStatusAttribute(): string
    {
        $status = $this->status ?: 'ACTIVE';
        if ($this->deleted_at) {
            return 'DELETED';
        }
        if ($status !== 'DRAFT' && $status !== 'PAUSED' && $status !== 'ARCHIVED') {
            if ($this->current_uses >= $this->max_uses) {
                return 'EXHAUSTED';
            }
            if ($this->expiry_date && \Carbon\Carbon::parse($this->expiry_date)->isPast()) {
                return 'EXPIRED';
            }
            if ($this->start_date && \Carbon\Carbon::parse($this->start_date)->isFuture()) {
                return 'SCHEDULED';
            }
            return 'ACTIVE';
        }
        return $status;
    }
}
