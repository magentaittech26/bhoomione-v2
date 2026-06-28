<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'total_views' => (int) $this['total_views'],
            'total_leads' => (int) $this['total_leads'],
            'lead_type_breakdown' => $this['lead_type_breakdown'],
            'published_projects_count' => (int) $this['published_projects_count'],
            'pending_projects_count' => (int) $this['pending_projects_count'],
            'hidden_projects_count' => (int) $this['hidden_projects_count'],
            'featured_projects_count' => (int) $this['featured_projects_count'],
            'archived_projects_count' => (int) $this['archived_projects_count'],
            'top_projects' => $this['top_projects'],
            'top_locations' => $this['top_locations'],
            'conversion_rate' => (float) $this['conversion_rate'],
            'monthly_trends' => $this['monthly_trends'],
        ];
    }
}
