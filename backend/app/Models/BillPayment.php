<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BillServiceType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillPayment extends Model
{
    protected $fillable = [
        'transaction_id',
        'service_type',
        'provider',
        'customer_id',
        'package',
        'quantity',
        'vtpass_request_id',
        'vtpass_response',
    ];

    protected function casts(): array
    {
        return [
            'service_type' => BillServiceType::class,
            'quantity' => 'integer',
            'vtpass_response' => 'array',
        ];
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
