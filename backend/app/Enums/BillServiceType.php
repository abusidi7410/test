<?php

namespace App\Enums;

enum BillServiceType: string
{
    case AIRTIME = 'airtime';
    case DATA = 'data';
    case ELECTRICITY = 'electricity';
    case CABLE_TV = 'cable_tv';
    case INTERNET = 'internet';
    case EDUCATION = 'education';
    case BETTING = 'betting';
    case AIRTIME_TO_CASH = 'airtime_to_cash';

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
        };
    }
}
