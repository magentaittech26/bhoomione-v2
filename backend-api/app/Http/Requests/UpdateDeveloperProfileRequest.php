<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDeveloperProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name' => 'required|string|max:255',
            'logo' => 'nullable|string|url|max:1000',
            'cover_image' => 'nullable|string|url|max:1000',
            'description' => 'nullable|string|max:2000',
            'rera_number' => 'required|string|max:100',
            'gst' => 'nullable|string|max:50',
            'office_address' => 'required|string|max:500',
            'website' => 'nullable|string|url|max:255',
            'phone' => 'required|string|max:50',
            'email' => 'required|email|max:255',
            'social_links' => 'nullable|array',
            'completed_projects' => 'nullable|integer|min:0',
            'active_projects' => 'nullable|integer|min:0',
            'years_in_business' => 'nullable|integer|min:0',
            'public_visibility' => 'nullable|boolean',
            'seo_slug' => 'required|string|max:255|regex:/^[a-z0-9\-]+$/',
        ];
    }
}
