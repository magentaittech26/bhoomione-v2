<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SubscriptionPlotSlab extends Model
{
    use SoftDeletes;

    protected $table = 'subscription_plot_slabs';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'min_plots', 'max_plots', 'monthly_price', 'yearly_price', 'status'
    ];

    protected $casts = [
        'min_plots' => 'integer',
        'max_plots' => 'integer',
        'monthly_price' => 'decimal:2',
        'yearly_price' => 'decimal:2',
    ];
}
