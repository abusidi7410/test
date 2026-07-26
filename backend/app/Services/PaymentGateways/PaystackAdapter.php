<?php

declare(strict_types=1);

namespace App\Services\PaymentGateways;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaystackAdapter implements PaymentGatewayInterface
{
    private string $secretKey;
    private string $webhookSecret;
    private string $baseUrl;

    public function __construct()
    {
        $this->secretKey = (string) config('services.paystack.secret_key');
        $this->webhookSecret = (string) config('services.paystack.webhook_secret');
        $this->baseUrl = (string) config('services.paystack.base_url', 'https://api.paystack.co');
    }

    public function getName(): string
    {
        return 'paystack';
    }

    public function initializeTransaction(
        float  $amount,
        string $email,
        string $reference,
        string $callbackUrl,
    ): array {
        $amountInKobo = (int) round($amount * 100);

        $payload = [
            'amount' => $amountInKobo,
            'email' => $email,
            'reference' => $reference,
            'currency' => 'NGN',
            'callback_url' => $callbackUrl,
        ];

        try {
            Log::info('Paystack API: initializing transaction', [
                'reference' => $reference,
                'amount_kobo' => $amountInKobo,
                'email' => $email,
                'callback_url' => $callbackUrl,
            ]);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->timeout(30)->post($this->baseUrl . '/transaction/initialize', $payload);

            if ($response->successful() && $response->json('status') === true) {
                return $response->json('data');
            }

            Log::error('Paystack initialize transaction failed', [
                'reference' => $reference,
                'response' => $response->json(),
            ]);

            return ['error' => $response->json('message') ?? 'Transaction initialization failed'];
        } catch (\Exception $e) {
            Log::error('Paystack initialize transaction exception', [
                'reference' => $reference,
                'error' => $e->getMessage(),
            ]);

            return ['error' => $e->getMessage()];
        }
    }

    public function verifyTransaction(string $reference): array
    {
        try {
            Log::info('Paystack API: verifying transaction', [
                'reference' => $reference,
            ]);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Accept' => 'application/json',
            ])->timeout(30)->get($this->baseUrl . '/transaction/verify/' . $reference);

            $responseBody = $response->json();

            Log::info('Paystack API: verify response', [
                'reference' => $reference,
                'status_code' => $response->status(),
                'paystack_status' => $responseBody['data']['status'] ?? 'unknown',
                'amount' => isset($responseBody['data']['amount']) ? $responseBody['data']['amount'] / 100 : null,
            ]);

            if ($response->successful() && $response->json('status') === true) {
                return $response->json('data');
            }

            Log::warning('Paystack transaction verification failed', [
                'reference' => $reference,
                'response' => $responseBody,
            ]);

            return ['error' => $responseBody['message'] ?? 'Transaction verification failed'];
        } catch (\Exception $e) {
            Log::error('Paystack transaction verification exception', [
                'reference' => $reference,
                'error' => $e->getMessage(),
            ]);

            return ['error' => $e->getMessage()];
        }
    }

    public function verifyTransfer(string $reference): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Accept' => 'application/json',
            ])->timeout(30)->get($this->baseUrl . '/transfer/verify/' . $reference);

            if ($response->successful() && $response->json('status') === true) {
                return $response->json('data');
            }

            Log::warning('Paystack transfer verification failed', [
                'reference' => $reference,
                'response' => $response->json(),
            ]);

            return ['error' => $response->json('message') ?? 'Transfer verification failed'];
        } catch (\Exception $e) {
            Log::error('Paystack transfer verification exception', [
                'reference' => $reference,
                'error' => $e->getMessage(),
            ]);

            return ['error' => $e->getMessage()];
        }
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        if (empty($this->webhookSecret)) {
            Log::critical('PAYSTACK_WEBHOOK_SECRET is not configured');

            return false;
        }

        $expectedSignature = hash_hmac('sha512', $payload, $this->webhookSecret);

        return hash_equals($expectedSignature, $signature);
    }
}
