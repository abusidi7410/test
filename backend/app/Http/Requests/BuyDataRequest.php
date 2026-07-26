<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BuyDataRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => 'required|string|max:15',
            'plan' => 'required|string|max:100',
            'provider' => 'required|string|in:mtn,airtel,glo,9mobile',
            'amount' => 'required|numeric|min:100',
        ];
    }
}
