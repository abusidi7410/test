<?php

namespace App\Enums;

enum AccountLevel: int
{
    case ONE = 1;
    case TWO = 2;
    case THREE = 3;

    public function label(): string
    {
        return match ($this) {
            self::ONE => 'Level 1',
            self::TWO => 'Level 2',
            self::THREE => 'Level 3',
        };
    }
}
