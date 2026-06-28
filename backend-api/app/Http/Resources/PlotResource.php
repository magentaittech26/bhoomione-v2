<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Check if the current context is public discovery/marketplace
        $isPublic = $request->is('*public/marketplace*') || $request->header('X-Public-Marketplace') === 'true';

        if ($isPublic) {
            // Hardened public exposure (protecting internal margins, cost details, and confidential logs)
            return [
                'id' => $this->id,
                'layout_id' => $this->layout_id,
                'plot_number' => $this->plot_number,
                'area_value' => (float) $this->area_value,
                'facing' => $this->facing,
                'is_corner' => (bool) ($this->is_corner ?? $this->corner ?? false),
                'road_width' => $this->road_width ?? $this->road_width_value ?? null,
                'booking_status' => $this->booking_status ?? 'AVAILABLE',
                'price' => (float) $this->price,
                'marketplace_visible' => (bool) $this->marketplace_visible,
            ];
        }

        // Full developer layout (CRM details included under RBAC policy validation)
        return [
            'id' => $this->id,
            'layout_id' => $this->layout_id,
            'plot_number' => $this->plot_number,
            'area_value' => (float) $this->area_value,
            'facing' => $this->facing,
            'is_corner' => (bool) ($this->is_corner ?? $this->corner ?? false),
            'road_width' => $this->road_width ?? $this->road_width_value ?? null,
            'booking_status' => $this->booking_status ?? 'AVAILABLE',
            'price' => (float) $this->price,
            'marketplace_visible' => (bool) $this->marketplace_visible,
            'reserved_by' => $this->reserved_by,
            
            // Developer internal metrics (Exposed ONLY under CRM workspace controls)
            'internal_cost' => (float) ($this->internal_cost ?? 0),
            'margin' => (float) ($this->margin ?? 0),
            'developer_notes' => $this->developer_notes ?? null,
            'internal_approval' => $this->internal_approval ?? null,
            'commercial_calculations' => $this->commercial_calculations ?? null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
