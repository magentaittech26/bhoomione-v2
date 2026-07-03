<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

class TaxRuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $status = $this->is_active ? 'ACTIVE' : 'INACTIVE';
        if ($this->deleted_at) {
            $status = 'ARCHIVED';
        } else {
            if ($this->effective_to && Carbon::parse($this->effective_to)->isPast()) {
                $status = 'EXPIRED';
            } elseif ($this->effective_from && Carbon::parse($this->effective_from)->isFuture()) {
                $status = 'SCHEDULED';
            }
        }

        return [
            'id' => $this->id,
            'tenantId' => $this->tenant_id,
            'taxType' => $this->tax_type,
            'name' => $this->name,
            'ratePercentage' => (float) $this->rate_percentage,
            'stateCode' => $this->state_code,
            'effectiveFrom' => $this->effective_from ? Carbon::parse($this->effective_from)->format('Y-m-d') : null,
            'effectiveTo' => $this->effective_to ? Carbon::parse($this->effective_to)->format('Y-m-d') : null,
            'isActive' => (bool) $this->is_active,
            'isDefault' => (bool) $this->is_default,
            'builderName' => $this->builder_name,
            'amountType' => $this->amount_type ?: 'percentage',
            'fixedAmount' => (float) $this->fixed_amount,
            'status' => $status,
            'createdAt' => $this->created_at ? $this->created_at->toIso8601String() : null,
            'updatedAt' => $this->updated_at ? $this->updated_at->toIso8601String() : null,
        ];
    }
}
