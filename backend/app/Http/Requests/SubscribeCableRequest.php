<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubscribeCableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'smartcard' => 'required|string|max:20',
            'package' => 'required|string|max:100',
            'provider' => 'required|string|in:dstv,gotv,startimes',
        ];
    }
}
