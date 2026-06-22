<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionPlanFeature extends Model
{
    protected $table = 'subscription_plan_features';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'plan_id', 'feature_id', 'access_level'
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function feature(): BelongsTo
    {
        return $this->belongsTo(SaasFeature::class, 'feature_id');
    }
}
