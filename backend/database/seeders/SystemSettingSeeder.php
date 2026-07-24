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
            'company' => [
                'name' => ['value' => 'TechHub', 'type' => 'text', 'description' => 'Company name'],
                'email' => ['value' => 'support@techhub.com', 'type' => 'text', 'description' => 'Company contact email'],
                'phone' => ['value' => '', 'type' => 'text', 'description' => 'Company phone number'],
                'address' => ['value' => '', 'type' => 'text', 'description' => 'Company address'],
                'website' => ['value' => 'https://techhub.com', 'type' => 'text', 'description' => 'Company website'],
                'logo' => ['value' => '', 'type' => 'text', 'description' => 'Company logo URL'],
                'timezone' => ['value' => 'Africa/Lagos', 'type' => 'text', 'description' => 'Default timezone'],
            ],
            'email' => [
                'driver' => ['value' => 'smtp', 'type' => 'text', 'description' => 'Email driver'],
                'host' => ['value' => 'smtp.mailtrap.io', 'type' => 'text', 'description' => 'SMTP host'],
                'port' => ['value' => '587', 'type' => 'text', 'description' => 'SMTP port'],
                'username' => ['value' => '', 'type' => 'text', 'description' => 'SMTP username'],
                'password' => ['value' => '', 'type' => 'text', 'description' => 'SMTP password'],
                'from_address' => ['value' => 'noreply@techhub.com', 'type' => 'text', 'description' => 'From email address'],
                'from_name' => ['value' => 'TechHub', 'type' => 'text', 'description' => 'From name'],
            ],
            'sms' => [
                'driver' => ['value' => 'termii', 'type' => 'text', 'description' => 'SMS driver'],
                'api_key' => ['value' => '', 'type' => 'text', 'description' => 'SMS API key'],
                'sender_id' => ['value' => 'TechHub', 'type' => 'text', 'description' => 'SMS sender ID'],
            ],
            'api' => [
                'rate_limit' => ['value' => '60', 'type' => 'text', 'description' => 'API rate limit per minute'],
                'timeout' => ['value' => '30', 'type' => 'text', 'description' => 'API request timeout in seconds'],
                'debug_mode' => ['value' => 'false', 'type' => 'text', 'description' => 'API debug mode'],
            ],
            'security' => [
                'max_login_attempts' => ['value' => '5', 'type' => 'text', 'description' => 'Maximum login attempts before lockout'],
                'lockout_duration' => ['value' => '15', 'type' => 'text', 'description' => 'Lockout duration in minutes'],
                'require_2fa' => ['value' => 'false', 'type' => 'text', 'description' => 'Require two-factor authentication'],
                'session_timeout' => ['value' => '120', 'type' => 'text', 'description' => 'Session timeout in minutes'],
                'password_min_length' => ['value' => '8', 'type' => 'text', 'description' => 'Minimum password length'],
            ],
            'vtu' => [
                'default_charge_airtime' => ['value' => '0', 'type' => 'text', 'description' => 'Default airtime charge'],
                'default_charge_data' => ['value' => '0', 'type' => 'text', 'description' => 'Default data charge'],
                'default_charge_electricity' => ['value' => '0', 'type' => 'text', 'description' => 'Default electricity charge'],
                'markup_percentage' => ['value' => '0', 'type' => 'text', 'description' => 'VTU markup percentage'],
            ],
            'notifications' => [
                'email_enabled' => ['value' => 'true', 'type' => 'text', 'description' => 'Enable email notifications'],
                'sms_enabled' => ['value' => 'true', 'type' => 'text', 'description' => 'Enable SMS notifications'],
                'push_enabled' => ['value' => 'true', 'type' => 'text', 'description' => 'Enable push notifications'],
                'in_app_enabled' => ['value' => 'true', 'type' => 'text', 'description' => 'Enable in-app notifications'],
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
