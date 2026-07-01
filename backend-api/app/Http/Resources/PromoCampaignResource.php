<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PromoCampaignResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $totalRedemptions = \DB::table('promo_coupons')
            ->where('campaign_id', $this->id)
            ->sum('current_uses');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'channel' => $this->channel,
            'status' => $this->status,
            'startDate' => $this->start_date ? $this->start_date->format('Y-m-d') : null,
            'endDate' => $this->end_date ? $this->end_date->format('Y-m-d') : null,
            'spend' => (float) $this->spend,
            'revenue' => (float) $this->revenue,
            'leads' => (int) $this->leads,
            'conversions' => (int) $this->conversions,
            'targetAudience' => $this->target_audience,
            'timezone' => $this->timezone,
            'couponCount' => (int) $this->coupons_count,
            'totalRedemptions' => (int) $totalRedemptions,
            'createdAt' => $this->created_at ? $this->created_at->format('Y-m-d') : null,
            'updatedAt' => $this->updated_at ? $this->updated_at->format('Y-m-d') : null,
        ];
    }
}
