<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PublishProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => 'required|string|in:Draft,Pending Approval,Published,Featured,Archived,Hidden',
            'publish_date' => 'nullable|date',
            'unpublish_date' => 'nullable|date',
        ];
    }
}
