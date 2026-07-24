<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\AdminRole;
use Illuminate\Database\Seeder;

class AdminRoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'super_admin',
                'display_name' => 'Super Administrator',
                'description' => 'Full system access with all permissions',
                'permissions' => ['*'],
                'is_system' => true,
            ],
            [
                'name' => 'operations',
                'display_name' => 'Operations Manager',
                'description' => 'Manages users, transactions, providers, wallets, and support',
                'permissions' => [
                    'users.view',
                    'users.edit',
                    'users.suspend',
                    'transactions.view',
                    'transactions.approve',
                    'transactions.reject',
                    'providers.view',
                    'providers.edit',
                    'providers.toggle',
                    'wallets.view',
                    'wallets.credit',
                    'wallets.debit',
                    'support.view',
                    'support.reply',
                    'notifications.send',
                    'reports.view',
                    'settings.view',
                ],
                'is_system' => false,
            ],
            [
                'name' => 'finance',
                'display_name' => 'Finance Manager',
                'description' => 'Handles financial operations, wallets, and payment gateways',
                'permissions' => [
                    'users.view',
                    'transactions.view',
                    'transactions.approve',
                    'transactions.reject',
                    'transactions.reverse',
                    'wallets.view',
                    'wallets.credit',
                    'wallets.debit',
                    'reports.view',
                    'reports.export',
                    'gateways.view',
                    'gateways.edit',
                ],
                'is_system' => false,
            ],
            [
                'name' => 'support',
                'display_name' => 'Support Agent',
                'description' => 'Handles customer support and notifications',
                'permissions' => [
                    'users.view',
                    'transactions.view',
                    'support.view',
                    'support.reply',
                    'support.assign',
                    'support.close',
                    'notifications.send',
                ],
                'is_system' => false,
            ],
            [
                'name' => 'marketing',
                'display_name' => 'Marketing Manager',
                'description' => 'Manages broadcasts, notifications, and user communications',
                'permissions' => [
                    'users.view',
                    'users.edit',
                    'notifications.send',
                    'reports.view',
                    'broadcasts.send',
                ],
                'is_system' => false,
            ],
            [
                'name' => 'developer',
                'display_name' => 'Developer',
                'description' => 'Manages providers, gateways, settings, and API access',
                'permissions' => [
                    'users.view',
                    'transactions.view',
                    'providers.view',
                    'providers.edit',
                    'providers.toggle',
                    'gateways.view',
                    'gateways.edit',
                    'settings.view',
                    'settings.edit',
                    'api.view',
                ],
                'is_system' => false,
            ],
            [
                'name' => 'auditor',
                'display_name' => 'Auditor',
                'description' => 'Read-only access to reports, logs, and system settings',
                'permissions' => [
                    'users.view',
                    'transactions.view',
                    'reports.view',
                    'reports.export',
                    'wallets.view',
                    'providers.view',
                    'gateways.view',
                    'settings.view',
                    'activity_logs.view',
                ],
                'is_system' => false,
            ],
        ];

        foreach ($roles as $role) {
            AdminRole::updateOrCreate(
                ['name' => $role['name']],
                $role,
            );
        }
    }
}
