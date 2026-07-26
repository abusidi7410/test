<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'recipient_bank' => 'required|string|max:100',
            'account_number' => 'required|string|size:10',
            'amount' => 'required|numeric|min:100|max:500000',
            'narration' => 'nullable|string|max:255',
        ];
    }
}
