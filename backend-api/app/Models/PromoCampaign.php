<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PromoCampaign extends Model
{
    use SoftDeletes;

    protected $table = 'promo_campaigns';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'type',
        'channel',
        'status',
        'start_date',
        'end_date',
        'spend',
        'revenue',
        'leads',
        'conversions',
        'target_audience',
        'timezone',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'spend' => 'float',
        'revenue' => 'float',
        'leads' => 'integer',
        'conversions' => 'integer',
    ];

    public function coupons(): HasMany
    {
        return $this->hasMany(PromoCoupon::class, 'campaign_id', 'id');
    }
}
