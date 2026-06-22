<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    use SoftDeletes;

    protected $table = 'subscription_plans';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'plan_code', 'name', 'monthly_price', 'yearly_price', 'trial_days', 'status', 'sort_order'
    ];

    protected $casts = [
        'monthly_price' => 'decimal:2',
        'yearly_price' => 'decimal:2',
        'trial_days' => 'integer',
        'sort_order' => 'integer',
    ];

    public function planFeatures(): HasMany
    {
        return $this->hasMany(SubscriptionPlanFeature::class, 'plan_id');
    }

    public function planLimits(): HasMany
    {
        return $this->hasMany(SubscriptionPlanLimit::class, 'plan_id');
    }
}
