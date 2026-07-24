<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessRuleOverride extends Model
{
    protected $table = 'business_rule_overrides';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'tenant_id',
        'rule_code',
        'entity_type',
        'entity_id',
        'reason',
        'requested_by',
        'approved_by',
        'status',
        'expires_at',
        'evidence',
    ];

    protected $casts = [
        'evidence' => 'array',
        'expires_at' => 'datetime',
    ];

    public function isValid(): bool
    {
        if ($this->status !== 'APPROVED') {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }
}
