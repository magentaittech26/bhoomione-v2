<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SubscriptionAddon extends Model
{
    use SoftDeletes;

    protected $table = 'subscription_addons';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'code', 'name', 'monthly_price', 'yearly_price', 'description', 'status'
    ];

    protected $casts = [
        'monthly_price' => 'decimal:2',
        'yearly_price' => 'decimal:2',
    ];
}
