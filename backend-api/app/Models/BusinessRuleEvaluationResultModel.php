<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessRuleEvaluationResultModel extends Model
{
    protected $table = 'business_rule_evaluation_results';
    public $timestamps = false;
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'evaluation_id',
        'rule_code',
        'rule_version',
        'passed',
        'severity',
        'error_code',
        'message',
        'user_message',
        'developer_message',
        'remediation',
        'evidence',
        'failed_conditions',
        'created_at',
    ];

    protected $casts = [
        'passed' => 'boolean',
        'evidence' => 'array',
        'failed_conditions' => 'array',
    ];

    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(BusinessRuleEvaluationModel::class, 'evaluation_id', 'id');
    }
}
