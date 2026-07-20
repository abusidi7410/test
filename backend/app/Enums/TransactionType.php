<?php

namespace App\Enums;

enum TransactionType: string
{
    case CREDIT = 'credit';
    case DEBIT = 'debit';

    public function label(): string
    {
        return match ($this) {
            self::CREDIT => 'Credit',
            self::DEBIT => 'Debit',
        };
    }
}
