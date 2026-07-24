<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BusinessRuleEvaluationModel extends Model
{
    protected $table = 'business_rule_evaluations';
    public $timestamps = false;
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'tenant_id',
        'actor_id',
        'action',
        'entity_type',
        'entity_id',
        'passed',
        'blocking_count',
        'warning_count',
        'execution_time_ms',
        'mode',
        'execution_source',
        'correlation_id',
        'created_at',
    ];

    protected $casts = [
        'passed' => 'boolean',
        'blocking_count' => 'integer',
        'warning_count' => 'integer',
        'execution_time_ms' => 'float',
    ];

    public function results(): HasMany
    {
        return $this->hasMany(BusinessRuleEvaluationResultModel::class, 'evaluation_id', 'id');
    }
}
