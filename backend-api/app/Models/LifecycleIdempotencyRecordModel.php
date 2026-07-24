<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LifecycleIdempotencyRecordModel extends Model
{
    protected $table = 'lifecycle_idempotency_records';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'tenant_id',
        'idempotency_key',
        'lifecycle_code',
        'entity_type',
        'entity_id',
        'transition_code',
        'transition_id',
        'request_hash',
        'response_payload',
    ];

    protected $casts = [
        'response_payload' => 'array',
    ];
}
