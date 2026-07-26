<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WithdrawRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bank_code' => 'required|string|max:10',
            'account_number' => 'required|string|size:10',
            'account_name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:500|max:500000',
        ];
    }
}
