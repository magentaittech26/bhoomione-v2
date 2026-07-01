<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentLog extends Model
{
    protected $table = 'payment_logs';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'gateway_code', 'transaction_id', 'amount', 'currency', 'status', 'error_message', 'customer_email'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];
}
