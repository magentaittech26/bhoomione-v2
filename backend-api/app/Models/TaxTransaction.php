<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaxTransaction extends Model
{
    protected $table = 'tax_transactions';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false; // created_at only

    protected $fillable = [
        'id',
        'tenant_id',
        'invoice_number',
        'customer_name',
        'state_code',
        'base_amount',
        'cgst_amount',
        'sgst_amount',
        'igst_amount',
        'tds_amount',
        'stamp_duty_amount',
        'registration_charges',
        'other_charges',
        'total_tax_amount',
        'total_invoice_amount',
    ];

    protected $casts = [
        'id' => 'string',
        'tenant_id' => 'string',
        'base_amount' => 'double',
        'cgst_amount' => 'double',
        'sgst_amount' => 'double',
        'igst_amount' => 'double',
        'tds_amount' => 'double',
        'stamp_duty_amount' => 'double',
        'registration_charges' => 'double',
        'other_charges' => 'double',
        'total_tax_amount' => 'double',
        'total_invoice_amount' => 'double',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
