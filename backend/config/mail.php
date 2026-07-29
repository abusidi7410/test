<?php

return [
    'default' => env('MAIL_MAILER', 'resend'),

    'mailers' => [
        'resend' => [
            'transport' => 'smtp',
            'host' => env('RESEND_HOST', 'smtp.resend.com'),
            'port' => env('RESEND_PORT', 587),
            'username' => env('RESEND_USERNAME', 'resend'),
            'password' => env('RESEND_KEY'),
            'encryption' => env('RESEND_ENCRYPTION', 'tls'),
            'timeout' => null,
        ],

        'smtp' => [
            'transport' => 'smtp',
            'scheme' => env('MAIL_SCHEME'),
            'host' => env('MAIL_HOST', '127.0.0.1'),
            'port' => env('MAIL_PORT', 2525),
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            'timeout' => null,
            'local_domain' => env('MAIL_EHLO_DOMAIN'),
        ],

        'ses' => [
            'transport' => 'ses',
        ],

        'postmark' => [
            'transport' => 'postmark',
        ],

        'mailgun' => [
            'transport' => 'mailgun',
        ],

        'log' => [
            'transport' => 'log',
            'channel' => env('MAIL_LOG_CHANNEL', 'stack'),
        ],

        'array' => [
            'transport' => 'array',
        ],

        'failover' => [
            'transport' => 'failover',
            'mailers' => [
                'resend',
                'log',
            ],
        ],
    ],

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'noreply@techub.com'),
        'name' => env('MAIL_FROM_NAME', 'Techub'),
    ],

    'reply_to' => [
        'address' => env('MAIL_REPLY_TO_ADDRESS', 'support@techub.com'),
        'name' => env('MAIL_REPLY_TO_NAME', 'Techub Support'),
    ],

    'markdown' => [
        'theme' => 'default',
        'paths' => [
            resource_path('views/emails'),
        ],
    ],
];
