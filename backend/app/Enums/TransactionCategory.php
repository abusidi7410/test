<?php

namespace App\Enums;

enum TransactionCategory: string
{
    case WALLET_FUNDING = 'wallet_funding';
    case AIRTIME = 'airtime';
    case DATA = 'data';
    case ELECTRICITY = 'electricity';
    case CABLE_TV = 'cable_tv';
    case INTERNET = 'internet';
case TRANSFER = 'transfer';
    case WITHDRAWAL = 'withdrawal';
    case AIRTIME_TO_CASH = 'airtime_to_cash';
    case REFERRAL_BONUS = 'referral_bonus';
    case GIFT_CARD = 'gift_card';

    public function label(): string
    {
        return match ($this) {
            self::WALLET_FUNDING => 'Wallet Funding',
            self::AIRTIME => 'Airtime',
            self::DATA => 'Data',
            self::ELECTRICITY => 'Electricity',
            self::CABLE_TV => 'Cable TV',
            self::INTERNET => 'Internet',
self::TRANSFER => 'Transfer',
            self::WITHDRAWAL => 'Withdrawal',
            self::AIRTIME_TO_CASH => 'Airtime to Cash',
            self::REFERRAL_BONUS => 'Referral Bonus',
            self::GIFT_CARD => 'Gift Card',
        };
    }
}
