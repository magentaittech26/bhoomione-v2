<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateProjectRequest extends FormRequest
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
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:100',
            'developer_name' => 'sometimes|required|string|max:255',
            'location' => 'sometimes|required|string|max:255',
            'status' => 'nullable|string|max:50',
            'rera_number' => 'nullable|string|max:100',
            'approval_status' => 'nullable|string|max:100',
            'approval_authority' => 'nullable|string|max:255',
            'launch_date' => 'nullable|date_format:Y-m-d',
            'possession_target_date' => 'nullable|date_format:Y-m-d',
            'approvals_metadata' => 'nullable|array',
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
