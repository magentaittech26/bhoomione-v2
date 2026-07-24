<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LifecycleTransitionModel extends Model
{
    protected $table = 'lifecycle_transitions';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'tenant_id',
        'organization_id',
        'lifecycle_code',
        'lifecycle_version',
        'entity_type',
        'entity_id',
        'transition_code',
        'previous_state',
        'destination_state',
        'actor_id',
        'execution_source',
        'reason',
        'business_rule_evaluation_id',
        'override_id',
        'correlation_id',
        'metadata',
        'transitioned_at',
        'reversed_transition_id',
    ];

    protected $casts = [
        'metadata' => 'array',
        'transitioned_at' => 'datetime',
    ];
}
