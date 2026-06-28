<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LayoutResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'name' => $this->name,
            'code' => $this->code,
            'layout_type' => $this->layout_type,
            'total_area_value' => (float) $this->total_area_value,
            'plots_count' => (int) $this->plots_count,
            'visibility' => $this->visibility,
            'price_range' => $this->price_range,
            'downloads_count' => (int) $this->downloads_count,
            'plots' => PlotResource::collection($this->whenLoaded('plots')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
