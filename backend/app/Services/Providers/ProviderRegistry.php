<?php

declare(strict_types=1);

namespace App\Services\Providers;

use App\Enums\ProviderStatus;
use App\Models\VtuProvider;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ProviderRegistry
{
    private const CACHE_KEY = 'vtu_providers_active';
    private const CACHE_TTL = 300;

    private static array $adapterMap = [
        'vtpass' => VtpassAdapter::class,
    ];

    public function getForService(string $service, ?string $preferredProvider = null): ?ProviderServiceInterface
    {
        $providers = $this->getActiveProvidersForService($service);

        if ($providers->isEmpty()) {
            Log::warning('No active providers found for service', ['service' => $service]);

            return null;
        }

        if ($preferredProvider) {
            $preferred = $providers->firstWhere('slug', $preferredProvider);
            if ($preferred) {
                return $this->makeAdapter($preferred);
            }
        }

        $default = $providers->firstWhere('is_default', true);
        if ($default) {
            return $this->makeAdapter($default);
        }

        return $this->makeAdapter($providers->first());
    }

    public function getProvidersWithFailover(string $service): array
    {
        $providers = $this->getActiveProvidersForService($service);

        return $providers->map(fn (VtuProvider $p) => $this->makeAdapter($p))->toArray();
    }

    public function executeWithFailover(string $service, callable $operation, ?string $preferredProvider = null): array
    {
        $providers = $this->getActiveProvidersForService($service);

        if ($providers->isEmpty()) {
            return [
                'success' => false,
                'message' => 'No active providers available for this service.',
                'provider' => null,
                'response' => null,
            ];
        }

        if ($preferredProvider) {
            $preferred = $providers->firstWhere('slug', $preferredProvider);
            if ($preferred) {
                $providers = $providers->filter(fn ($p) => $p->slug !== $preferredProvider)->prepend($preferred);
            }
        }

        $lastError = null;

        foreach ($providers as $provider) {
            $adapter = $this->makeAdapter($provider);

            try {
                $startTime = microtime(true);
                $response = $operation($adapter, $provider);
                $elapsed = round((microtime(true) - $startTime) * 1000, 2);

                if ($adapter->isResponseSuccessful($response)) {
                    $provider->recordSuccess($elapsed);
                    $this->clearCache();

                    return [
                        'success' => true,
                        'message' => 'Successful via ' . $provider->name,
                        'provider' => $provider,
                        'response' => $response,
                        'response_time_ms' => $elapsed,
                    ];
                }

                if ($adapter->isResponsePending($response)) {
                    $provider->recordPending();
                    $this->clearCache();

                    return [
                        'success' => true,
                        'message' => 'Pending via ' . $provider->name,
                        'provider' => $provider,
                        'response' => $response,
                        'pending' => true,
                        'response_time_ms' => $elapsed,
                    ];
                }

                $errorMsg = $adapter->getResponseMessage($response);
                $provider->recordFailure($errorMsg);
                $lastError = $errorMsg;

                Log::warning('Provider failed, trying next', [
                    'provider' => $provider->slug,
                    'service' => $service,
                    'error' => $errorMsg,
                ]);
            } catch (\Exception $e) {
                $provider->recordFailure($e->getMessage());
                $lastError = $e->getMessage();

                Log::error('Provider exception, trying next', [
                    'provider' => $provider->slug,
                    'service' => $service,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->clearCache();

        return [
            'success' => false,
            'message' => 'All providers failed. Last error: ' . ($lastError ?? 'Unknown'),
            'provider' => null,
            'response' => null,
        ];
    }

    private function getActiveProvidersForService(string $service)
    {
        return Cache::remember(self::CACHE_KEY . ':' . $service, self::CACHE_TTL, function () use ($service) {
            return VtuProvider::active()
                ->forService($service)
                ->byPriority()
                ->get();
        });
    }

    public static function getAdapterClass(string $slug): string
    {
        return self::$adapterMap[$slug] ?? VtpassAdapter::class;
    }

    private function makeAdapter(VtuProvider $provider): ProviderServiceInterface
    {
        $adapterClass = self::getAdapterClass($provider->slug);

        return new $adapterClass($provider);
    }

    private function clearCache(): void
    {
        try {
            $driver = Cache::getDefaultDriver();
            if ($driver === 'redis') {
                $keys = Cache::getRedis()->keys('vtu_providers_active:*');
                foreach ($keys as $key) {
                    Cache::forget($key);
                }
            } else {
                Cache::forget(self::CACHE_KEY . ':airtime');
                Cache::forget(self::CACHE_KEY . ':data');
                Cache::forget(self::CACHE_KEY . ':electricity');
                Cache::forget(self::CACHE_KEY . ':cable_tv');
                Cache::forget(self::CACHE_KEY . ':internet');
                Cache::forget(self::CACHE_KEY . ':education');
                Cache::forget(self::CACHE_KEY . ':betting');
                Cache::forget(self::CACHE_KEY . ':airtime_to_cash');
                Cache::forget(self::CACHE_KEY . ':waec');
                Cache::forget(self::CACHE_KEY . ':neco');
                Cache::forget(self::CACHE_KEY . ':jamb');
            }
        } catch (\Exception) {
            // Cache driver doesn't support key scanning; ignore silently
        }
    }

    public function invalidateCache(?string $service = null): void
    {
        if ($service) {
            Cache::forget(self::CACHE_KEY . ':' . $service);
        } else {
            $this->clearCache();
        }
    }
}
