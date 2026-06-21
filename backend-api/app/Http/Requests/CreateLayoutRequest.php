<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class CreateLayoutRequest extends FormRequest
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
            'project_id' => 'required|uuid|exists:projects,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:100',
            'layout_type' => 'required|string|max:50',
            'approval_number' => 'nullable|string|max:150',
            'approval_date' => 'nullable|date_format:Y-m-d',
            'total_area_value' => 'nullable|numeric|min:0',
            'total_area_unit_id' => 'nullable|uuid|exists:measurement_units,id',
            'measurement_unit_id' => 'required|uuid|exists:measurement_units,id',
            'status' => 'nullable|string|max:50',
        ];
    }

    /**
     * Handle a failed validation attempt and output clean JSON 400 responses.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'error' => $validator->errors()->first()
            ], 400)
        );
    }
}
