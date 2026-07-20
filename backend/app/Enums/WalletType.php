<?php

namespace App\Enums;

enum WalletType: string
{
    case AVAILABLE = 'available';
    case LEDGER = 'ledger';
    case CASHBACK = 'cashback';
    case BONUS = 'bonus';

    public function label(): string
    {
        return match ($this) {
            self::AVAILABLE => 'Available',
            self::LEDGER => 'Ledger',
            self::CASHBACK => 'Cashback',
            self::BONUS => 'Bonus',
        };
    }
}
