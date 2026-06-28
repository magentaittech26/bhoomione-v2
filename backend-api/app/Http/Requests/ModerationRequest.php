<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ModerationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => 'required|string|max:50',
            'reason' => 'required|string|min:5|max:1000',
        ];
    }
}
