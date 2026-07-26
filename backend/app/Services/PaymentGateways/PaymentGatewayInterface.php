<?php

declare(strict_types=1);

namespace App\Services\PaymentGateways;

interface PaymentGatewayInterface
{
    /**
     * Initialize a payment transaction.
     *
     * @param float  $amount      Amount in the base currency unit (e.g. NGN, not kobo)
     * @param string $email       Customer email address
     * @param string $reference   Unique transaction reference
     * @param string $callbackUrl URL to redirect/settle after payment
     *
     * @return array{authorization_url: string, access_code: string, reference: string}|array{error: string}
     */
    public function initializeTransaction(
        float  $amount,
        string $email,
        string $reference,
        string $callbackUrl,
    ): array;

    /**
     * Verify a transaction by its reference.
     *
     * @return array{status: string, amount: float, reference: string, ...}|array{error: string}
     */
    public function verifyTransaction(string $reference): array;

    /**
     * Verify a transfer (payout) by its reference.
     *
     * @return array{status: string, reference: string, ...}|array{error: string}
     */
    public function verifyTransfer(string $reference): array;

    /**
     * Verify the webhook signature against the raw payload.
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool;

    /**
     * Human-readable gateway name.
     */
    public function getName(): string;
}
