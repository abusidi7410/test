<?php

namespace App\Enums;

enum NotificationType: string
{
    case SUCCESS = 'success';
    case PRIMARY = 'primary';
    case WARNING = 'warning';
    case MUTED = 'muted';

    public function label(): string
    {
        return match ($this) {
            self::SUCCESS => 'Success',
            self::PRIMARY => 'Primary',
            self::WARNING => 'Warning',
            self::MUTED => 'Muted',
        };
    }
}
