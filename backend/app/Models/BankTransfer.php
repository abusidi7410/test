<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankTransfer extends Model
{
    protected $fillable = [
        'transaction_id',
        'recipient_bank',
        'recipient_account',
        'recipient_name',
        'amount',
        'status',
        'provider_response',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'provider_response' => 'array',
        ];
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
