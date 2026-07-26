<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FundBettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => 'required|string|max:50',
            'amount' => 'required|numeric|min:100|max:100000',
            'provider' => 'required|string|in:sportybet,bet9ja,betty,betking,1xbet',
        ];
    }
}
