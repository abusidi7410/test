<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubscribeInternetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => 'required|string|max:50',
            'plan' => 'required|string|max:100',
            'provider' => 'required|string|in:smile,spectranet,mixx',
        ];
    }
}
