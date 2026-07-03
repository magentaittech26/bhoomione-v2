<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class TaxTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenantId' => $this->tenant_id,
            'invoiceNumber' => $this->invoice_number,
            'customerName' => $this->customer_name,
            'stateCode' => $this->state_code,
            'baseAmount' => (float) $this->base_amount,
            'cgstAmount' => (float) $this->cgst_amount,
            'sgstAmount' => (float) $this->sgst_amount,
            'igstAmount' => (float) $this->igst_amount,
            'tdsAmount' => (float) $this->tds_amount,
            'stampDutyAmount' => (float) $this->stamp_duty_amount,
            'registrationCharges' => (float) $this->registration_charges,
            'otherCharges' => (float) $this->other_charges,
            'totalTaxAmount' => (float) $this->total_tax_amount,
            'totalInvoiceAmount' => (float) $this->total_invoice_amount,
            'createdAt' => $this->created_at ? Carbon::parse($this->created_at)->toIso8601String() : null,
        ];
    }
}
