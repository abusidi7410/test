<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ProviderEnvironment;
use App\Enums\ProviderStatus;
use App\Enums\SupportedService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Crypt;

class VtuProvider extends Model
{
    use HasFactory, SoftDeletes;

    private const ENCRYPTED_FIELDS = [
        'api_key',
        'public_key',
        'secret_key',
        'username',
        'password',
        'authorization_token',
        'webhook_secret',
    ];

    protected $fillable = [
        'name',
        'slug',
        'logo',
        'base_url',
        'api_key',
        'public_key',
        'secret_key',
        'username',
        'password',
        'authorization_token',
        'webhook_secret',
        'environment',
        'status',
        'priority',
        'is_default',
        'supported_services',
        'total_requests',
        'successful_requests',
        'failed_requests',
        'pending_requests',
        'avg_response_time_ms',
        'last_health_check_at',
        'health_check_response',
        'last_error',
        'last_used_at',
    ];

    protected static function booted(): void
    {
        static::saving(function (VtuProvider $provider) {
            foreach (self::ENCRYPTED_FIELDS as $field) {
                $value = $provider->{$field};
                if ($value !== null && $value !== '' && !str_starts_with((string) $value, 'eyJ')) {
                    $provider->{$field} = Crypt::encryptString((string) $value);
                }
            }
        });

        static::retrieved(function (VtuProvider $provider) {
            foreach (self::ENCRYPTED_FIELDS as $field) {
                $value = $provider->{$field};
                if ($value !== null && $value !== '' && str_starts_with((string) $value, 'eyJ')) {
                    try {
                        $provider->setAttribute($field, Crypt::decryptString((string) $value));
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
            'environment' => ProviderEnvironment::class,
            'status' => ProviderStatus::class,
            'supported_services' => 'array',
            'health_check_response' => 'array',
            'is_default' => 'boolean',
            'total_requests' => 'integer',
            'successful_requests' => 'integer',
            'failed_requests' => 'integer',
            'pending_requests' => 'integer',
            'avg_response_time_ms' => 'float',
            'priority' => 'integer',
            'last_health_check_at' => 'datetime',
            'last_used_at' => 'datetime',
        ];
    }

    protected $hidden = [
        'api_key',
        'public_key',
        'secret_key',
        'password',
        'authorization_token',
        'webhook_secret',
    ];

    public function supportsService(string $service): bool
    {
        $services = $this->supported_services ?? [];

        return in_array($service, $services);
    }

    public function recordSuccess(float $responseTimeMs = 0): void
    {
        $this->increment('successful_requests');
        $this->increment('total_requests');

        if ($responseTimeMs > 0) {
            $currentAvg = $this->avg_response_time_ms ?? 0;
            $total = $this->total_requests;
            $this->update([
                'avg_response_time_ms' => $total > 1
                    ? (($currentAvg * ($total - 1)) + $responseTimeMs) / $total
                    : $responseTimeMs,
            ]);
        }

        $this->update(['last_used_at' => now()]);
    }

    public function recordFailure(string $error = ''): void
    {
        $this->increment('failed_requests');
        $this->increment('total_requests');
        $this->update(['last_error' => $error]);
    }

    public function recordPending(): void
    {
        $this->increment('pending_requests');
        $this->increment('total_requests');
        $this->update(['last_used_at' => now()]);
    }

    public function getSuccessRate(): float
    {
        if ($this->total_requests === 0) {
            return 0;
        }

        return round(($this->successful_requests / $this->total_requests) * 100, 2);
    }

    public function scopeActive($query)
    {
        return $query->where('status', ProviderStatus::ACTIVE);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeForService($query, string $service)
    {
        return $query->whereJsonContains('supported_services', $service);
    }

    public function scopeByPriority($query)
    {
        return $query->orderBy('priority', 'desc')->orderBy('id', 'asc');
    }
}
