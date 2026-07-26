<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\TransactionCategory;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Transaction extends Model
{
    use HasFactory, HasUuid;

    protected $fillable = [
        'uuid',
        'user_id',
        'wallet_id',
        'category',
        'type',
        'amount',
        'charge',
        'fees',
        'previous_balance',
        'current_balance',
        'status',
        'description',
        'reference',
        'provider_reference',
        'gateway',
        'customer_email',
        'customer_id',
        'payment_channel',
        'currency',
        'paid_at',
        'metadata',
        'webhook_payload',
        'ip_address',
        'user_agent',
    ];

    protected $appends = ['service', 'direction'];

    protected function casts(): array
    {
        return [
            'category' => TransactionCategory::class,
            'type' => TransactionType::class,
            'status' => TransactionStatus::class,
            'amount' => 'decimal:2',
            'charge' => 'decimal:2',
            'fees' => 'decimal:2',
            'previous_balance' => 'decimal:2',
            'current_balance' => 'decimal:2',
            'metadata' => 'array',
            'webhook_payload' => 'array',
            'paid_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    public function bankTransfer(): HasOne
    {
        return $this->hasOne(BankTransfer::class);
    }

    public function billPayment(): HasOne
    {
        return $this->hasOne(BillPayment::class);
    }

    public function getServiceAttribute(): string
    {
        return $this->category->value;
    }

    public function getDirectionAttribute(): string
    {
        return $this->type === TransactionType::CREDIT ? 'in' : 'out';
    }
}
