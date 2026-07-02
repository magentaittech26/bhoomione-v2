<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class PromoCouponRequest extends FormRequest
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
            'code' => 'required|string|max:100',
            'type' => 'required|string|in:PERCENTAGE,FIXED,REFERRAL,BUILDER,MARKETPLACE,TENANT',
            'value' => 'required|numeric|min:0.01',
            'campaign_id' => 'nullable|string',
            'start_date' => 'nullable|date',
            'expiry_date' => 'required|date',
            'max_uses' => 'required|integer|min:1',
            'current_uses' => 'nullable|integer|min:0',
            'tenant_id' => 'nullable|string',
            'builder_name' => 'nullable|string',
            'status' => 'nullable|string|in:DRAFT,SCHEDULED,ACTIVE,PAUSED,EXPIRED,EXHAUSTED,ARCHIVED,DELETED',
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

