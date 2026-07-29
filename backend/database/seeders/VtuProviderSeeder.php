<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\VtuProvider;
use Illuminate\Database\Seeder;

class VtuProviderSeeder extends Seeder
{
    public function run(): void
    {
        VtuProvider::updateOrCreate(
            ['slug' => 'vtpass'],
            [
                'name' => 'VTpass',
                'slug' => 'vtpass',
                'base_url' => config('services.vtpass.base_url', 'https://sandbox.vtpass.com/api'),
                'api_key' => config('services.vtpass.api_key', ''),
                'public_key' => config('services.vtpass.public_key', ''),
                'secret_key' => config('services.vtpass.secret_key', ''),
                'environment' => 'sandbox',
                'status' => 'active',
                'priority' => 10,
                'is_default' => true,
                'supported_services' => [
                    'airtime',
                    'data',
                    'electricity',
                    'cable_tv',
                    'internet',
                    'education',
'airtime_to_cash',
                ],
            ]
        );
    }
}
