<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConvertAirtimeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => 'required|string|max:15',
            'amount' => 'required|numeric|min:100|max:50000',
            'provider' => 'required|string|in:mtn,airtel,glo,9mobile',
        ];
    }
}
