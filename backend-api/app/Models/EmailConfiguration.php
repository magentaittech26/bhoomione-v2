<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailConfiguration extends Model
{
    protected $table = 'email_configurations';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'provider_code',
        'name',
        'is_enabled',
        'is_default',
        'host',
        'port',
        'encryption',
        'username',
        'password',
        'sender_name',
        'sender_email',
        'custom_params',
        'status',
    ];

    protected $casts = [
        'id' => 'string',
        'is_enabled' => 'boolean',
        'is_default' => 'boolean',
        'port' => 'integer',
        'password' => 'encrypted',
        'custom_params' => 'array',
    ];
}
