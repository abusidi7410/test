<?php

declare(strict_types=1);

namespace App\Enums;

enum SupportedService: string
{
    case AIRTIME = 'airtime';
    case DATA = 'data';
    case ELECTRICITY = 'electricity';
    case CABLE_TV = 'cable_tv';
    case INTERNET = 'internet';
    case EDUCATION = 'education';
    case BETTING = 'betting';
    case AIRTIME_TO_CASH = 'airtime_to_cash';
    case WAEC = 'waec';
    case NECO = 'neco';
    case JAMB = 'jamb';

    public function label(): string
    {
        return match ($this) {
            self::AIRTIME => 'Airtime',
            self::DATA => 'Data',
            self::ELECTRICITY => 'Electricity',
            self::CABLE_TV => 'Cable TV',
            self::INTERNET => 'Internet',
            self::EDUCATION => 'Education',
            self::BETTING => 'Betting',
            self::AIRTIME_TO_CASH => 'Airtime to Cash',
            self::WAEC => 'WAEC',
            self::NECO => 'NECO',
            self::JAMB => 'JAMB',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
