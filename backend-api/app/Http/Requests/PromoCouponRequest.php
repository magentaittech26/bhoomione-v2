<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
            'campaignId' => 'nullable|string',
            'expiryDate' => 'required|date',
            'maxUses' => 'required|integer|min:1',
            'currentUses' => 'nullable|integer|min:0',
            'tenantId' => 'nullable|string',
            'builderName' => 'nullable|string',
            'status' => 'nullable|string|in:ACTIVE,EXPIRED,EXHAUSTED',
        ];
    }
}
