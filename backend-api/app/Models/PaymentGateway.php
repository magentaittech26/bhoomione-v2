<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentGateway extends Model
{
    protected $table = 'payment_gateways';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'gateway_code', 'name', 'is_enabled', 'environment', 'api_key', 'secret_key', 'webhook_secret', 'currency', 'status', 'is_default'
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'is_default' => 'boolean',
    ];
}
