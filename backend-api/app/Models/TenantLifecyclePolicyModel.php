<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantLifecyclePolicyModel extends Model
{
    protected $table = 'tenant_lifecycle_policies';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'tenant_id',
        'lifecycle_code',
        'parameters',
        'is_enabled',
        'version',
    ];

    protected $casts = [
        'parameters' => 'array',
        'is_enabled' => 'boolean',
    ];
}
