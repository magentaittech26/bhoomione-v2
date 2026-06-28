<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'name' => $this->name,
            'code' => $this->code,
            'description' => $this->description,
            'location' => $this->location,
            'developer_name' => $this->developer_name,
            'total_area_value' => (float) $this->total_area_value,
            'total_plots_count' => (int) $this->total_plots_count,
            'launch_date' => $this->launch_date,
            'possession_target_date' => $this->possession_target_date,
            'publishing_status' => $this->publishing_status,
            'is_featured' => (bool) $this->is_featured,
            'seo_settings' => $this->seo_settings,
            'moderation_status' => $this->moderation_status,
            'moderation_history' => $this->moderation_history,
            'views_count' => (int) $this->views_count,
            'publish_date' => $this->publish_date,
            'unpublish_date' => $this->unpublish_date,
            'layouts' => LayoutResource::collection($this->whenLoaded('layouts')),
            'tenant' => $this->whenLoaded('tenant'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
