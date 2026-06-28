<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMarketplaceLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tenant_id' => 'required|uuid|exists:tenants,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:50',
            'lead_type' => 'required|string|in:Request Callback,Book Site Visit,Request Brochure,WhatsApp,Call,Email,General Enquiry',
            'message' => 'nullable|string|max:1000',
            'metadata' => 'nullable|array',
        ];
    }
}
