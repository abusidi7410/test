<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'general' => [
                'platform_name' => ['value' => 'Techub', 'type' => 'text', 'description' => 'Platform name'],
                'support_email' => ['value' => 'support@techub.com', 'type' => 'text', 'description' => 'Support email address'],
                'platform_description' => ['value' => 'Techub is your all-in-one financial services platform.', 'type' => 'text', 'description' => 'Platform description'],
                'default_currency' => ['value' => 'NGN', 'type' => 'text', 'description' => 'Default currency'],
                'maintenance_mode' => ['value' => 'false', 'type' => 'boolean', 'description' => 'Enable maintenance mode'],
            ],
            'security' => [
                'require_2fa' => ['value' => 'false', 'type' => 'boolean', 'description' => 'Require two-factor authentication'],
                'require_email_verification' => ['value' => 'true', 'type' => 'boolean', 'description' => 'Require email verification for new users'],
                'login_notifications' => ['value' => 'true', 'type' => 'boolean', 'description' => 'Notify on new login sessions'],
                'session_timeout' => ['value' => '60', 'type' => 'text', 'description' => 'Session timeout in minutes'],
                'max_login_attempts' => ['value' => '5', 'type' => 'text', 'description' => 'Maximum login attempts before lockout'],
            ],
            'fees' => [
                'airtime_fee' => ['value' => '2', 'type' => 'text', 'description' => 'Airtime fee percentage'],
                'data_fee' => ['value' => '2', 'type' => 'text', 'description' => 'Data fee percentage'],
                'electricity_fee' => ['value' => '100', 'type' => 'text', 'description' => 'Electricity fee flat amount'],
                'transfer_fee' => ['value' => '50', 'type' => 'text', 'description' => 'Transfer fee flat amount'],
                'withdrawal_fee' => ['value' => '1.5', 'type' => 'text', 'description' => 'Withdrawal fee percentage'],
                'min_transaction' => ['value' => '100', 'type' => 'text', 'description' => 'Minimum transaction amount'],
                'flat_fee_mode' => ['value' => 'false', 'type' => 'boolean', 'description' => 'Use flat fees instead of percentage'],
            ],
            'email' => [
                'smtp_host' => ['value' => 'smtp.resend.com', 'type' => 'text', 'description' => 'SMTP host'],
                'smtp_port' => ['value' => '587', 'type' => 'text', 'description' => 'SMTP port'],
                'smtp_username' => ['value' => 'resend', 'type' => 'text', 'description' => 'SMTP username'],
                'smtp_password' => ['value' => '', 'type' => 'text', 'description' => 'SMTP password'],
                'welcome_email' => ['value' => 'true', 'type' => 'boolean', 'description' => 'Send welcome email on registration'],
                'transaction_receipts' => ['value' => 'true', 'type' => 'boolean', 'description' => 'Email receipts for all transactions'],
                'weekly_reports' => ['value' => 'false', 'type' => 'boolean', 'description' => 'Send weekly activity reports'],
            ],
            'social' => [
                'google_enabled' => ['value' => 'true', 'type' => 'boolean', 'description' => 'Enable Google login'],
                'google_client_id' => ['value' => '', 'type' => 'text', 'description' => 'Google OAuth client ID'],
                'google_client_secret' => ['value' => '', 'type' => 'text', 'description' => 'Google OAuth client secret'],
                'apple_enabled' => ['value' => 'false', 'type' => 'boolean', 'description' => 'Enable Apple login'],
                'whatsapp_enabled' => ['value' => 'false', 'type' => 'boolean', 'description' => 'Enable WhatsApp login'],
            ],
        ];

        foreach ($settings as $group => $keys) {
            foreach ($keys as $key => $config) {
                SystemSetting::updateOrCreate(
                    ['group_name' => $group, 'key_name' => $key],
                    [
                        'value' => $config['value'],
                        'type' => $config['type'],
                        'description' => $config['description'],
                    ],
                );
            }
        }
    }
}
