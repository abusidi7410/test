<?php

declare(strict_types=1);

namespace App\Services\Providers;

use App\Models\VtuProvider;

interface ProviderServiceInterface
{
    public function __construct(VtuProvider $provider);

    public function pay(string $serviceId, string $amount, string $customerId, ?string $variationCode = null, ?string $meterType = null, int $quantity = 1): array;

    public function payWithSubscription(string $serviceId, string $customerId, string $variationCode, string $subscriptionType = 'renew'): array;

    public function requery(string $requestId): array;

    public function verifyMeter(string $meterNumber, string $disco, string $meterType = 'prepaid'): array;

    public function getServiceVariations(string $serviceId): array;

    public function generateRequestId(): string;

    public function isResponseSuccessful(array $response): bool;

    public function isResponsePending(array $response): bool;

    public function getResponseMessage(array $response): string;

    public function testConnection(): array;

    public function getName(): string;
}
