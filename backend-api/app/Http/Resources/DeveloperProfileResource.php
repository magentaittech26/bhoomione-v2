<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeveloperProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'company_name' => $this->company_name,
            'logo' => $this->logo,
            'cover_image' => $this->cover_image,
            'description' => $this->description,
            'rera_number' => $this->rera_number,
            'gst' => $this->gst,
            'office_address' => $this->office_address,
            'website' => $this->website,
            'phone' => $this->phone,
            'email' => $this->email,
            'social_links' => $this->social_links,
            'completed_projects' => (int) $this->completed_projects,
            'active_projects' => (int) $this->active_projects,
            'years_in_business' => (int) $this->years_in_business,
            'verification_status' => $this->verification_status,
            'rating' => (float) $this->rating,
            'public_visibility' => (bool) $this->public_visibility,
            'seo_slug' => $this->seo_slug,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
