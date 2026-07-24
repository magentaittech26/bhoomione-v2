<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantBusinessRulePolicy extends Model
{
    protected $table = 'tenant_business_rule_policies';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'tenant_id',
        'rule_code',
        'parameters',
        'is_enabled',
        'version',
    ];

    protected $casts = [
        'parameters' => 'array',
        'is_enabled' => 'boolean',
    ];
}
