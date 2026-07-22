<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreMeasurementUnitRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'display_name' => 'nullable|string|max:255',
            'symbol' => 'nullable|string|max:50',
            'short_code' => 'nullable|string|max:50',
            'measurement_type' => 'required|string|max:100',
            'conversion_factor' => 'required|numeric|gt:0',
            'base_unit' => 'nullable|string|max:100',
            'precision' => 'nullable|integer|between:0,6',
            'decimal_places' => 'nullable|integer|between:0,6',
            'display_order' => 'nullable|integer',
            'is_metric' => 'nullable|boolean',
            'is_default' => 'nullable|boolean',
            'is_system' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'country_code' => 'nullable|string|max:10',
            'state_code' => 'nullable|string|max:10',
            'tenant_override_allowed' => 'nullable|boolean',
            'description' => 'nullable|string',
        ];
    }

    /**
     * Handle a failed validation attempt and output clean JSON 422 responses.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors()
            ], 422)
        );
    }
}
