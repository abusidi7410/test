<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'available_balance',
        'ledger_balance',
        'cashback_balance',
        'bonus_balance',
        'is_locked',
        'locked_at',
    ];

    protected function casts(): array
    {
        return [
            'available_balance' => 'decimal:2',
            'ledger_balance' => 'decimal:2',
            'cashback_balance' => 'decimal:2',
            'bonus_balance' => 'decimal:2',
            'is_locked' => 'boolean',
            'locked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
