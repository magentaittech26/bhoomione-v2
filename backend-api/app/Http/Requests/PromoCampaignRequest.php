<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

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
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'spend' => 'nullable|numeric',
            'revenue' => 'nullable|numeric',
            'leads' => 'nullable|integer',
            'conversions' => 'nullable|integer',
            'target_audience' => 'nullable|string',
            'timezone' => 'nullable|string',
        ];
    }

    /**
     * Return custom JSON response on validation failure instead of raw exception / redirect.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'error' => 'Validation failed: ' . implode(', ', $validator->errors()->all()),
            'errors' => $validator->errors()
        ], 422));
    }
}

