<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\PaymentGateway;
use Illuminate\Database\Seeder;

class PaymentGatewaySeeder extends Seeder
{
    public function run(): void
    {
        $gateways = [
            [
                'name' => 'paystack',
                'display_name' => 'Paystack',
                'status' => 'inactive',
                'test_mode' => true,
                'is_default' => true,
            ],
            [
                'name' => 'flutterwave',
                'display_name' => 'Flutterwave',
                'status' => 'inactive',
                'test_mode' => true,
                'is_default' => false,
            ],
            [
                'name' => 'monnify',
                'display_name' => 'Monnify',
                'status' => 'inactive',
                'test_mode' => true,
                'is_default' => false,
            ],
        ];

        foreach ($gateways as $gateway) {
            PaymentGateway::updateOrCreate(
                ['name' => $gateway['name']],
                $gateway,
            );
        }
    }
}
