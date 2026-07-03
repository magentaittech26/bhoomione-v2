<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class TaxRuleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Auths managed in controller via Policies
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'id' => 'nullable|string',
            'tenantId' => 'nullable|string',
            'tenant_id' => 'nullable|string',
            'taxType' => 'nullable|string',
            'tax_type' => 'nullable|string',
            'name' => 'required|string|max:255',
            'ratePercentage' => 'nullable|numeric|min:0|max:100',
            'rate_percentage' => 'nullable|numeric|min:0|max:100',
            'stateCode' => 'nullable|string|max:10',
            'state_code' => 'nullable|string|max:10',
            'effectiveFrom' => 'nullable|date',
            'effective_from' => 'nullable|date',
            'effectiveTo' => 'nullable|date|after_or_equal:effectiveFrom',
            'effective_to' => 'nullable|date|after_or_equal:effective_from',
            'isActive' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'isDefault' => 'nullable|boolean',
            'is_default' => 'nullable|boolean',
            'builderName' => 'nullable|string|max:255',
            'builder_name' => 'nullable|string|max:255',
            'amountType' => 'nullable|string|in:percentage,fixed',
            'amount_type' => 'nullable|string|in:percentage,fixed',
            'fixedAmount' => 'nullable|numeric|min:0',
            'fixed_amount' => 'nullable|numeric|min:0',
        ];
    }

    /**
     * Return custom JSON response on validation failure instead of redirect.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'error' => 'Validation failed: ' . implode(', ', $validator->errors()->all()),
            'errors' => $validator->errors()
        ], 422));
    }
}
