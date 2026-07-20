<?php

namespace App\Enums;

enum ReferralStatus: string
{
    case PENDING = 'pending';
    case COMPLETED = 'completed';
    case REWARDED = 'rewarded';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending',
            self::COMPLETED => 'Completed',
            self::REWARDED => 'Rewarded',
        };
    }
}
