<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GiftCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'transaction_id',
        'card_name',
        'card_number',
        'card_pin',
        'card_value',
        'exchange_rate',
        'naira_value',
        'status',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'card_value' => 'decimal:2',
            'exchange_rate' => 'decimal:4',
            'naira_value' => 'decimal:2',
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function isRedeemed(): bool
    {
        return $this->status === 'redeemed';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
