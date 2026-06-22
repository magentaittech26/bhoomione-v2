<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionPlanLimit extends Model
{
    protected $table = 'subscription_plan_limits';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'plan_id', 'limit_key', 'limit_value'
    ];

    protected $casts = [
        'limit_value' => 'integer'
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }
}
