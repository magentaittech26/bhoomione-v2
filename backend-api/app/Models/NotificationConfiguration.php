<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationConfiguration extends Model
{
    protected $table = 'notification_configurations';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'channel',
        'provider_code',
        'name',
        'is_enabled',
        'is_default',
        'config_params',
        'status',
    ];

    protected $casts = [
        'id' => 'string',
        'is_enabled' => 'boolean',
        'is_default' => 'boolean',
        'config_params' => 'array',
    ];
}
