<?php

namespace App\Enums;

enum TransactionStatus: string
{
    case PENDING = 'pending';
    case SUCCESSFUL = 'successful';
    case FAILED = 'failed';
    case REVERSED = 'reversed';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending',
            self::SUCCESSFUL => 'Successful',
            self::FAILED => 'Failed',
            self::REVERSED => 'Reversed',
        };
    }
}
