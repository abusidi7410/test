<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class PaymentGateway extends Model
{
    use HasFactory;

    private const ENCRYPTED_FIELDS = [
        'secret_key',
        'webhook_secret',
    ];

    protected $table = 'payment_gateways';

    protected $fillable = [
        'name',
        'slug',
        'provider',
        'secret_key',
        'public_key',
        'webhook_secret',
        'webhook_url',
        'is_default',
        'test_mode',
        'settings',
        'status',
    ];

    protected $hidden = [
        'secret_key',
        'webhook_secret',
    ];

    protected static function booted(): void
    {
        static::saving(function (PaymentGateway $gateway) {
            foreach (self::ENCRYPTED_FIELDS as $field) {
                $value = $gateway->{$field};
                if ($value !== null && $value !== '' && !str_starts_with((string) $value, 'eyJ')) {
                    $gateway->{$field} = Crypt::encryptString((string) $value);
                }
            }
        });

        static::retrieved(function (PaymentGateway $gateway) {
            foreach (self::ENCRYPTED_FIELDS as $field) {
                $value = $gateway->{$field};
                if ($value !== null && $value !== '' && str_starts_with((string) $value, 'eyJ')) {
                    try {
                        $gateway->setAttribute($field, Crypt::decryptString((string) $value));
                    } catch (\Exception) {
                        // Field is corrupted or encryption key changed; leave as-is
                    }
                }
            }
        });
    }

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'test_mode' => 'boolean',
            'settings' => 'array',
        ];
    }
}
