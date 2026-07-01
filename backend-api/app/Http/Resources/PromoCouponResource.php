<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PromoCouponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'type' => $this->type,
            'value' => (float) $this->value,
            'campaignId' => $this->campaign_id,
            'campaignName' => $this->campaign ? $this->campaign->name : null,
            'expiryDate' => $this->expiry_date ? $this->expiry_date->format('Y-m-d') : null,
            'maxUses' => (int) $this->max_uses,
            'currentUses' => (int) $this->current_uses,
            'tenantId' => $this->tenant_id,
            'builderName' => $this->builder_name,
            'status' => $this->status,
            'createdAt' => $this->created_at ? $this->created_at->format('Y-m-d') : null,
            'updatedAt' => $this->updated_at ? $this->updated_at->format('Y-m-d') : null,
        ];
    }
}
