<?php

declare(strict_types=1);

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class Vtpass
{
    private string $apiKey;
    private string $publicKey;
    private string $secretKey;
    private string $baseUrl;

    public function __construct()
    {
        $this->apiKey = (string) config('services.vtpass.api_key');
        $this->publicKey = (string) config('services.vtpass.public_key');
        $this->secretKey = (string) config('services.vtpass.secret_key');
        $this->baseUrl = (string) config('services.vtpass.base_url');
    }

    public function generateRequestId(): string
    {
        $timestamp = Carbon::now('Africa/Lagos')->format('YmdHi');
        $random = strtoupper(Str::random(4));

        return $timestamp . $random;
    }

    public function pay(string $serviceId, string $amount, string $customerId, ?string $variationCode = null, ?string $meterType = null, int $quantity = 1): array
    {
        $payload = [
            'serviceID' => $serviceId,
            'amount' => $amount,
            'phone' => $customerId,
            'request_id' => $this->generateRequestId(),
        ];

        if ($variationCode) {
            $payload['variation_code'] = $variationCode;
        }

        if ($meterType) {
            $payload['meter_type'] = $meterType;
        }

        if ($quantity > 1) {
            $payload['quantity'] = $quantity;
        }

        return $this->post('/api/pay', $payload, true);
    }

    public function payWithSubscription(string $serviceId, string $customerId, string $variationCode, string $subscriptionType = 'renew'): array
    {
        $payload = [
            'serviceID' => $serviceId,
            'billersCode' => $customerId,
            'variation_code' => $variationCode,
            'request_id' => $this->generateRequestId(),
            'subscription_type' => $subscriptionType,
        ];

        return $this->post('/api/pay', $payload, true);
    }

    public function requery(string $requestId): array
    {
        return $this->post('/api/requery', [
            'request_id' => $requestId,
        ]);
    }

    public function verifyMeter(string $meterNumber, string $disco, string $meterType = 'prepaid'): array
    {
        return $this->post('/api/merchant-verify', [
            'meterNumber' => $meterNumber,
            'disco' => $disco,
            'meter_type' => $meterType,
        ]);
    }

    public function getServiceVariations(string $serviceId): array
    {
        return $this->get('/api/service-variations', [
            'serviceID' => $serviceId,
        ]);
    }

    public function isResponseSuccessful(array $response): bool
    {
        return isset($response['code']) && (string) $response['code'] === '000';
    }

    public function isResponsePending(array $response): bool
    {
        return isset($response['code']) && (string) $response['code'] === '011';
    }

    public function getResponseMessage(array $response): string
    {
        return $response['response_description'] ?? $response['message'] ?? 'Unknown response';
    }

    private function get(string $endpoint, array $params = []): array
    {
        try {
            $url = $this->baseUrl . $endpoint;

            $response = Http::withHeaders([
                'api-key' => $this->apiKey,
                'public-key' => $this->publicKey,
                'Content-Type' => 'application/json',
            ])->timeout(30)->get($url, $params);

            $body = $response->json();

            Log::info('VTpass GET response', [
                'endpoint' => $endpoint,
                'params' => $params,
                'status' => $response->status(),
                'response' => $body,
            ]);

            return $body ?? [];
        } catch (\Exception $e) {
            Log::error('VTpass GET error', [
                'endpoint' => $endpoint,
                'params' => $params,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    private function post(string $endpoint, array $data, bool $isPay = false): array
    {
        try {
            $url = $this->baseUrl . $endpoint;

            $headers = [
                'api-key' => $this->apiKey,
                'secret-key' => $this->secretKey,
                'Content-Type' => 'application/json',
            ];

            if ($isPay) {
                $headers['public-key'] = $this->publicKey;
            }

            $response = Http::withHeaders($headers)
                ->timeout(30)
                ->post($url, $data);

            $body = $response->json();

            Log::info('VTpass POST response', [
                'endpoint' => $endpoint,
                'data' => $data,
                'status' => $response->status(),
                'response' => $body,
            ]);

            return $body ?? [];
        } catch (\Exception $e) {
            Log::error('VTpass POST error', [
                'endpoint' => $endpoint,
                'data' => $data,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
