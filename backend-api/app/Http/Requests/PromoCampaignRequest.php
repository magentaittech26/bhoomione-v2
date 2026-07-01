<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PromoCampaignRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Auth handled by middleware / Policies
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'id' => 'nullable|string',
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'channel' => 'nullable|string',
            'status' => 'required|string',
            'startDate' => 'required|date',
            'endDate' => 'required|date',
            'spend' => 'nullable|numeric',
            'revenue' => 'nullable|numeric',
            'leads' => 'nullable|integer',
            'conversions' => 'nullable|integer',
            'targetAudience' => 'nullable|string',
            'timezone' => 'nullable|string',
        ];
    }
}
