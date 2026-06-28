<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MarketplaceSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'developer' => 'nullable|string|max:255',
            'project' => 'nullable|string|max:255',
            'layout' => 'nullable|string|max:255',
            'min_price' => 'nullable|numeric|min:0',
            'max_price' => 'nullable|numeric|min:0',
            'min_area' => 'nullable|numeric|min:0',
            'max_area' => 'nullable|numeric|min:0',
            'facing' => 'nullable|string|max:50',
            'amenities' => 'nullable|string|max:255',
            'project_type' => 'nullable|string|max:255',
            'availability' => 'nullable|string|max:50',
            'sort_by' => 'nullable|string|in:newest,price,area,featured,popularity',
            'per_page' => 'nullable|integer|min:1|max:100',
        ];
    }
}
