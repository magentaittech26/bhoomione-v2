<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdatePlotRequest extends FormRequest
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
            'layout_id' => 'sometimes|required|uuid|exists:layouts,id',
            'plot_number' => 'sometimes|required|string|max:100',
            'area_value' => 'sometimes|required|numeric|min:0',
            'measurement_unit_id' => 'sometimes|required|uuid|exists:measurement_units,id',
            'length' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:0',
            'road_width' => 'nullable|numeric|min:0',
            'corner_plot' => 'nullable|boolean',
            'facing' => 'nullable|string|max:50',
            'dimensions' => 'sometimes|required|string|max:100',
            'dimensions_metadata' => 'nullable|array',
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
