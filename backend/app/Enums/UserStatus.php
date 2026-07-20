<?php

namespace App\Enums;

enum UserStatus: string
{
    case ACTIVE = 'active';
    case SUSPENDED = 'suspended';
    case BANNED = 'banned';

    public function label(): string
    {
        return match ($this) {
            self::ACTIVE => 'Active',
            self::SUSPENDED => 'Suspended',
            self::BANNED => 'Banned',
        };
    }
}
