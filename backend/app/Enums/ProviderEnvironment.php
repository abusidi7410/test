<?php

declare(strict_types=1);

namespace App\Enums;

enum ProviderEnvironment: string
{
    case SANDBOX = 'sandbox';
    case PRODUCTION = 'production';

    public function label(): string
    {
        return match ($this) {
            self::SANDBOX => 'Sandbox',
            self::PRODUCTION => 'Production',
        };
    }
}
