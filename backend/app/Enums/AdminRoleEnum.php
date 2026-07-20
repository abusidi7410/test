<?php

namespace App\Enums;

enum AdminRoleEnum: string
{
    case SUPER_ADMIN = 'super_admin';
    case ADMIN = 'admin';
    case FINANCE = 'finance';
    case SUPPORT = 'support';

    public function label(): string
    {
        return match ($this) {
            self::SUPER_ADMIN => 'Super Admin',
            self::ADMIN => 'Admin',
            self::FINANCE => 'Finance',
            self::SUPPORT => 'Support',
        };
    }
}
