<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\TransactionStatus;
use App\Events\TransactionCompleted;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Transaction;
use App\Models\WalletHistory;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaystackWebhookController extends Controller
{
    public function __construct(
        private readonly PaystackService $paystack,
    ) {}

    /**
     * Handle incoming Paystack webhook events.
     *
     * Paystack sends webhook events for various transaction states.
     * Every request MUST be verified using the x-paystack-signature header
     * before any processing occurs.
     *
     * Supported events:
     * - charge.success     → Wallet funding completed
     * - transfer.success   → Outbound transfer completed
     * - transfer.failed    → Outbound transfer failed
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        // Read the raw request body for HMAC signature verification
        $rawPayload = $request->getContent();
        $signature = $request->header('x-paystack-signature', '');

        // Log every incoming webhook for auditing
        Log::info('Paystack webhook received', [
            'event' => $request->input('event'),
            'reference' => $request->input('data.reference'),
            'has_signature' => !empty($signature),
        ]);

        // ── Step 1: Verify the webhook signature ──
        // Reject immediately with 403 if the signature is missing or invalid.
        // This prevents spoofed requests from ever reaching business logic.
        if (empty($signature) || !$this->paystack->verifyWebhookSignature($rawPayload, $signature)) {
            Log::warning('Paystack webhook: invalid signature', [
                'ip' => $request->ip(),
                'signature_provided' => $signature ? substr($signature, 0, 16) . '...' : 'none',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Invalid webhook signature.',
            ], 403);
        }

        // ── Step 2: Parse and dispatch the event ──
        $event = $request->input('event');

        try {
            return match ($event) {
                'charge.success' => $this->handleChargeSuccess($request),
                'transfer.success' => $this->handleTransferSuccess($request),
                'transfer.failed' => $this->handleTransferFailed($request),
                default => $this->handleUnknownEvent($event),
            };
        } catch (\Throwable $e) {
            Log::error('Paystack webhook: unhandled exception', [
                'event' => $event,
                'reference' => $request->input('data.reference'),
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Webhook processing error.',
            ], 500);
        }
    }

    /**
     * Handle a successful charge (wallet funding).
     *
     * Flow:
     * 1. Extract the transaction reference from the webhook payload.
     * 2. Check if this reference has already been processed (idempotency guard).
     * 3. Verify the transaction directly with Paystack's Verify API.
     * 4. Credit the user's wallet inside a database transaction.
     * 5. Fire a notification event.
     */
    private function handleChargeSuccess(Request $request): JsonResponse
    {
        $reference = $request->input('data.reference');

        if (empty($reference)) {
            Log::warning('Paystack webhook charge.success: missing reference');

            return response()->json(['success' => true, 'message' => 'No reference.']);
        }

        // ── Server-side verification ──
        // Never trust the webhook payload alone. Verify the transaction
        // directly with Paystack's API to confirm the amount and status.
        $verifiedData = $this->paystack->verifyTransaction($reference);

        if (!$verifiedData) {
            Log::warning('Paystack webhook charge.success: verification failed', [
                'reference' => $reference,
            ]);

            return response()->json(['success' => false, 'message' => 'Transaction verification failed.'], 500);
        }

        // Confirm the transaction status is 'success' on Paystack's end
        if (($verifiedData['status'] ?? '') !== 'success') {
            Log::info('Paystack webhook charge.success: transaction not successful on Paystack', [
                'reference' => $reference,
                'paystack_status' => $verifiedData['status'] ?? 'unknown',
            ]);

            return response()->json(['success' => true, 'message' => 'Transaction not successful on Paystack.']);
        }

        // ── Process the credit inside a database transaction ──
        try {
            DB::transaction(function () use ($verifiedData, $reference, $request) {
                // Determine the amount in Naira (Paystack sends in kobo)
                $amountInNaira = (float) ($verifiedData['amount'] ?? 0) / 100;
                $fees = (float) ($verifiedData['fees'] ?? 0) / 100;

                // Find existing transaction (may have been created by the verify endpoint)
                $existingTransaction = Transaction::where('reference', $reference)->first();

                // Idempotent re-check inside the lock — the verify endpoint may
                // have already processed this transaction while we were verifying
                // with Paystack or waiting for the lock.
                if ($existingTransaction && $existingTransaction->status === TransactionStatus::SUCCESSFUL) {
                    Log::info('Paystack webhook charge.success: duplicate, already processed', [
                        'reference' => $reference,
                        'transaction_id' => $existingTransaction->id,
                    ]);

                    return;
                }

                if ($existingTransaction) {
                    // Lock the wallet row to prevent race condition with verify endpoint
                    $wallet = $existingTransaction->wallet()->lockForUpdate()->first();
                    $previousBalance = (float) $wallet->available_balance;

                    // Re-check idempotency after acquiring lock
                    $existingTransaction->refresh();
                    if ($existingTransaction->status === TransactionStatus::SUCCESSFUL) {
                        return;
                    }

                    $existingTransaction->update([
                        'status' => TransactionStatus::SUCCESSFUL,
                        'fees' => $fees,
                        'provider_reference' => $verifiedData['id'] ?? null,
                        'gateway' => 'paystack',
                        'customer_email' => $verifiedData['customer']['email'] ?? null,
                        'customer_id' => $verifiedData['customer']['customer_code'] ?? null,
                        'payment_channel' => $verifiedData['channel'] ?? null,
                        'currency' => $verifiedData['currency'] ?? 'NGN',
                        'paid_at' => $verifiedData['paid_at'] ?? null,
                        'current_balance' => $previousBalance + $amountInNaira,
                        'webhook_payload' => $request->all(),
                        'metadata' => array_merge(
                            $existingTransaction->metadata ?? [],
                            ['paystack_verification' => $verifiedData]
                        ),
                    ]);

                    $transaction = $existingTransaction;
                } else {
                    // No existing transaction found — create a new one.
                    // This handles edge cases where the init record was lost.
                    $wallet = \App\Models\Wallet::where('customer_email', $verifiedData['customer']['email'] ?? '')
                        ->orWhereHas('user', fn($q) => $q->where('email', $verifiedData['customer']['email'] ?? ''))
                        ->lockForUpdate()
                        ->first();

                    if (!$wallet) {
                        Log::error('Paystack webhook charge.success: wallet not found for email', [
                            'email' => $verifiedData['customer']['email'] ?? 'unknown',
                            'reference' => $reference,
                        ]);

                        throw new \RuntimeException('Wallet not found for customer email.');
                    }

                    $previousBalance = (float) $wallet->available_balance;

                    $transaction = Transaction::create([
                        'user_id' => $wallet->user_id,
                        'wallet_id' => $wallet->id,
                        'category' => 'wallet_funding',
                        'type' => 'credit',
                        'amount' => $amountInNaira,
                        'charge' => 0.00,
                        'fees' => $fees,
                        'previous_balance' => $previousBalance,
                        'current_balance' => $previousBalance + $amountInNaira,
                        'status' => TransactionStatus::SUCCESSFUL,
                        'description' => 'Wallet funding via Paystack',
                        'reference' => $reference,
                        'provider_reference' => $verifiedData['id'] ?? null,
                        'gateway' => 'paystack',
                        'customer_email' => $verifiedData['customer']['email'] ?? null,
                        'customer_id' => $verifiedData['customer']['customer_code'] ?? null,
                        'payment_channel' => $verifiedData['channel'] ?? null,
                        'currency' => $verifiedData['currency'] ?? 'NGN',
                        'paid_at' => $verifiedData['paid_at'] ?? null,
                        'webhook_payload' => $request->all(),
                        'metadata' => ['paystack_verification' => $verifiedData],
                    ]);

                    $previousBalance = (float) $wallet->available_balance;
                }

                // Credit the user's wallet
                $wallet->increment('available_balance', $amountInNaira);
                $newBalance = (float) $wallet->fresh()->available_balance;

                // Update current_balance on the transaction to reflect the post-credit balance
                $transaction->update([
                    'current_balance' => $newBalance,
                ]);

                // ── Wallet history ──
                WalletHistory::create([
                    'wallet_id' => $wallet->id,
                    'user_id' => $transaction->user_id,
                    'transaction_id' => $transaction->id,
                    'type' => 'credit',
                    'amount' => $amountInNaira,
                    'balance_before' => $previousBalance,
                    'balance_after' => $newBalance,
                    'description' => 'Wallet funding via Paystack (webhook)',
                    'reference' => $reference,
                    'metadata' => [
                        'paystack_reference' => $verifiedData['id'] ?? null,
                        'channel' => $verifiedData['channel'] ?? null,
                        'fees' => $fees,
                    ],
                ]);

                // ── Audit log ──
                AuditLog::create([
                    'user_id' => $transaction->user_id,
                    'event' => 'payment.webhook_verified',
                    'auditable_type' => Transaction::class,
                    'auditable_id' => $transaction->id,
                    'description' => "Wallet credited with ₦" . number_format($amountInNaira, 2) . " via Paystack webhook",
                    'old_values' => [
                        'status' => 'pending',
                        'balance' => $previousBalance,
                    ],
                    'new_values' => [
                        'status' => 'successful',
                        'balance' => $newBalance,
                    ],
                    'meta' => [
                        'reference' => $reference,
                        'amount' => $amountInNaira,
                        'fees' => $fees,
                        'paystack_reference' => $verifiedData['id'] ?? null,
                        'channel' => $verifiedData['channel'] ?? null,
                    ],
                ]);

                // Fire event for notification dispatch
                event(new TransactionCompleted($transaction));
            });

            Log::info('Paystack webhook charge.success: processed successfully', [
                'reference' => $reference,
                'transaction_id' => $existingTransaction?->id,
            ]);

            return response()->json(['success' => true, 'message' => 'Wallet credited successfully.']);
        } catch (\Throwable $e) {
            Log::error('Paystack webhook charge.success: database transaction failed', [
                'reference' => $reference,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['success' => false, 'message' => 'Processing error.'], 500);
        }
    }

    /**
     * Handle a successful transfer event (outbound bank transfer).
     *
     * Updates the related transaction status to successful.
     */
    private function handleTransferSuccess(Request $request): JsonResponse
    {
        $reference = $request->input('data.reference');

        if (empty($reference)) {
            Log::warning('Paystack webhook transfer.success: missing reference');

            return response()->json(['success' => true, 'message' => 'No reference.']);
        }

        $transaction = Transaction::where('reference', $reference)->first();

        if (!$transaction) {
            Log::warning('Paystack webhook transfer.success: transaction not found', [
                'reference' => $reference,
            ]);

            return response()->json(['success' => true, 'message' => 'Transaction not found.']);
        }

        // Idempotency guard — skip if already successful
        if ($transaction->status === TransactionStatus::SUCCESSFUL) {
            Log::info('Paystack webhook transfer.success: already processed', [
                'reference' => $reference,
            ]);

            return response()->json(['success' => true, 'message' => 'Already processed.']);
        }

        try {
            DB::transaction(function () use ($transaction, $request) {
                $transferData = $request->input('data', []);

                $transaction->update([
                    'status' => TransactionStatus::SUCCESSFUL,
                    'provider_reference' => $transferData['id'] ?? null,
                    'paid_at' => $transferData['completed_at'] ?? now(),
                    'webhook_payload' => array_merge(
                        $transaction->webhook_payload ?? [],
                        ['transfer_success' => $request->all()]
                    ),
                ]);

                event(new TransactionCompleted($transaction));
            });

            Log::info('Paystack webhook transfer.success: processed', [
                'reference' => $reference,
                'transaction_id' => $transaction->id,
            ]);

            return response()->json(['success' => true, 'message' => 'Transfer marked as successful.']);
        } catch (\Throwable $e) {
            Log::error('Paystack webhook transfer.success: processing failed', [
                'reference' => $reference,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['success' => false, 'message' => 'Processing error.'], 500);
        }
    }

    /**
     * Handle a failed transfer event (outbound bank transfer).
     *
     * Updates the related transaction status to failed and refunds
     * the debited amount back to the user's wallet.
     */
    private function handleTransferFailed(Request $request): JsonResponse
    {
        $reference = $request->input('data.reference');

        if (empty($reference)) {
            Log::warning('Paystack webhook transfer.failed: missing reference');

            return response()->json(['success' => true, 'message' => 'No reference.']);
        }

        $transaction = Transaction::where('reference', $reference)->first();

        if (!$transaction) {
            Log::warning('Paystack webhook transfer.failed: transaction not found', [
                'reference' => $reference,
            ]);

            return response()->json(['success' => true, 'message' => 'Transaction not found.']);
        }

        // Idempotency guard — skip if already failed or reversed
        if (in_array($transaction->status, [TransactionStatus::FAILED, TransactionStatus::REVERSED])) {
            Log::info('Paystack webhook transfer.failed: already processed', [
                'reference' => $reference,
                'status' => $transaction->status->value,
            ]);

            return response()->json(['success' => true, 'message' => 'Already processed.']);
        }

        try {
            DB::transaction(function () use ($transaction, $request) {
                $transferData = $request->input('data', []);

                // Refund the debited amount back to the wallet
                $transaction->wallet->increment(
                    'available_balance',
                    $transaction->amount + $transaction->charge
                );

                $transaction->update([
                    'status' => TransactionStatus::FAILED,
                    'provider_reference' => $transferData['id'] ?? null,
                    'webhook_payload' => array_merge(
                        $transaction->webhook_payload ?? [],
                        ['transfer_failure' => $request->all()]
                    ),
                    'description' => ($transaction->description ?? '') .
                        ' — Failed: ' . ($transferData['failure_reason'] ?? 'Transfer failed'),
                ]);
            });

            Log::info('Paystack webhook transfer.failed: processed, wallet refunded', [
                'reference' => $reference,
                'transaction_id' => $transaction->id,
                'refunded_amount' => $transaction->amount + $transaction->charge,
            ]);

            return response()->json(['success' => true, 'message' => 'Transfer failure recorded, wallet refunded.']);
        } catch (\Throwable $e) {
            Log::error('Paystack webhook transfer.failed: processing failed', [
                'reference' => $reference,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['success' => false, 'message' => 'Processing error.'], 500);
        }
    }

    /**
     * Log and acknowledge events we don't handle.
     * Return 200 to prevent Paystack from retrying.
     */
    private function handleUnknownEvent(?string $event): JsonResponse
    {
        Log::info('Paystack webhook: unhandled event type', ['event' => $event]);

        return response()->json(['success' => true, 'message' => 'Event not handled.']);
    }
}
