<?php

return [
    'defaults' => [
        'guard' => env('AUTH_GUARD', 'sanctum'),
        'passwords' => env('AUTH_PASSWORD_BROKER', 'users'),
    ],

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'users',
        ],
        'sanctum' => [
            'driver' => 'sanctum',
            'provider' => 'users',
        ],
        'admin' => [
            'driver' => 'sanctum',
            'provider' => 'admin_users',
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => App\Models\User::class,
        ],
        'admin_users' => [
            'driver' => 'eloquent',
            'model' => App\Models\AdminUser::class,
        ],
    ],

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
        'admin_users' => [
            'provider' => 'admin_users',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),
];
