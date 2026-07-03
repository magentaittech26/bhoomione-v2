<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaxRule extends Model
{
    use SoftDeletes;

    protected $table = 'tax_rules';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'tax_type',
        'name',
        'rate_percentage',
        'state_code',
        'effective_from',
        'effective_to',
        'is_active',
        'is_default',
        'builder_name',
        'amount_type',
        'fixed_amount',
    ];

    protected $casts = [
        'id' => 'string',
        'tenant_id' => 'string',
        'rate_percentage' => 'double',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'fixed_amount' => 'double',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
