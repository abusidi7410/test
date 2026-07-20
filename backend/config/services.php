<?php

return [
    'paystack' => [
        'secret_key' => env('PAYSTACK_SECRET_KEY'),
        'public_key' => env('PAYSTACK_PUBLIC_KEY'),
        'webhook_secret' => env('PAYSTACK_WEBHOOK_SECRET'),
        'base_url' => 'https://api.paystack.co',
    ],

    'vtpass' => [
        'api_key' => env('VTPASS_API_KEY'),
        'public_key' => env('VTPASS_PUBLIC_KEY'),
        'secret_key' => env('VTPASS_SECRET_KEY'),
        'base_url' => env('VTPASS_BASE_URL', 'https://sandbox.vtpass.com/api'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URL'),
    ],

    'facebook' => [
        'client_id' => env('FACEBOOK_CLIENT_ID'),
        'client_secret' => env('FACEBOOK_CLIENT_SECRET'),
        'redirect' => env('FACEBOOK_REDIRECT_URL'),
    ],

    'apple' => [
        'client_id' => env('APPLE_CLIENT_ID'),
        'client_secret' => env('APPLE_CLIENT_SECRET'),
        'redirect' => env('APPLE_REDIRECT_URL'),
    ],

    'microsoft' => [
        'client_id' => env('MICROSOFT_CLIENT_ID'),
        'client_secret' => env('MICROSOFT_CLIENT_SECRET'),
        'redirect' => env('MICROSOFT_REDIRECT_URL'),
    ],

    'twitter' => [
        'client_id' => env('TWITTER_CLIENT_ID'),
        'client_secret' => env('TWITTER_CLIENT_SECRET'),
        'redirect' => env('TWITTER_REDIRECT_URL'),
    ],

    'tiktok' => [
        'client_id' => env('TIKTOK_CLIENT_ID'),
        'client_secret' => env('TIKTOK_CLIENT_SECRET'),
        'redirect' => env('TIKTOK_REDIRECT_URL'),
    ],
];
