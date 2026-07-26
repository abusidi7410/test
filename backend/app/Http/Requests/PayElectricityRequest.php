<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PayElectricityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'meter_number' => 'required|string|max:20',
            'amount' => 'required|numeric|min:500|max:100000',
            'provider' => 'required|string|in:ikeja,ibadan,eko,abuja,kano,ph,benin,enugu',
            'meter_type' => 'required|string|in:prepaid,postpaid',
        ];
    }
}
