<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BuyEducationPinRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'candidate_name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1|max:10',
            'provider' => 'required|string|in:waec,neco,nabteb',
            'amount' => 'required|numeric|min:500',
        ];
    }
}
