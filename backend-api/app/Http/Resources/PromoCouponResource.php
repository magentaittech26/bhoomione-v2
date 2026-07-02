<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PromoCouponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $status = $this->status ?: 'ACTIVE';
        if ($this->deleted_at) {
            $status = 'DELETED';
        } elseif ($status !== 'DRAFT' && $status !== 'PAUSED' && $status !== 'ARCHIVED') {
            if ($this->current_uses >= $this->max_uses) {
                $status = 'EXHAUSTED';
            } elseif ($this->expiry_date && \Carbon\Carbon::parse($this->expiry_date)->isPast()) {
                $status = 'EXPIRED';
            } elseif ($this->start_date && \Carbon\Carbon::parse($this->start_date)->isFuture()) {
                $status = 'SCHEDULED';
            } else {
                $status = 'ACTIVE';
            }
        }

        return [
            'id' => $this->id,
            'code' => $this->code,
            'type' => $this->type,
            'value' => (float) $this->value,
            'campaignId' => $this->campaign_id,
            'campaignName' => $this->campaign ? $this->campaign->name : null,
            'startDate' => $this->start_date ? $this->start_date->format('Y-m-d') : null,
            'expiryDate' => $this->expiry_date ? $this->expiry_date->format('Y-m-d') : null,
            'maxUses' => (int) $this->max_uses,
            'currentUses' => (int) $this->current_uses,
            'tenantId' => $this->tenant_id,
            'builderName' => $this->builder_name,
            'status' => $status,
            'createdAt' => $this->created_at ? $this->created_at->format('Y-m-d') : null,
            'updatedAt' => $this->updated_at ? $this->updated_at->format('Y-m-d') : null,
        ];
    }
}
