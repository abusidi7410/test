<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Events\TransactionCompleted;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletHistory;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaystackService $paystack,
    ) {}

    /**
     * Verify a Paystack transaction and credit the wallet if successful.
     *
     * This endpoint is called by the frontend after Paystack redirects back.
     * It performs the same idempotent credit logic as the webhook, so either
     * path can safely complete the payment without double-crediting.
     *
     * Flow:
     * 1. Find the pending transaction by reference (must belong to the authenticated user).
     * 2. If already successful → return success immediately (idempotent).
     * 3. Verify the transaction with Paystack's API server-side.
     * 4. If Paystack confirms success → credit wallet, update transaction, create
     *    audit log, wallet history, fire notification event.
     * 5. Return the result to the frontend.
     */
    public function verify(Request $request, string $reference): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        Log::info('Payment verify: incoming request', [
            'reference' => $reference,
            'user_id' => $user->id,
        ]);

        $transaction = Transaction::where('reference', $reference)
            ->where('user_id', $user->id)
            ->first();

        if (!$transaction) {
            return $this->errorResponse(
                'Transaction not found. Please check your reference and try again.',
                404,
            );
        }

        // ── Idempotency: already successful → return success ──
        if ($transaction->status->value === 'successful') {
            $wallet = $user->wallet;

            return $this->successResponse([
                'status' => 'success',
                'reference' => $reference,
                'amount' => (float) $transaction->amount,
                'balance' => $wallet ? (float) $wallet->available_balance : 0,
                'message' => 'Payment already verified and processed.',
            ]);
        }

        // ── Verify with Paystack API ──
        Log::info('Payment verify: calling Paystack API', [
            'reference' => $reference,
            'current_status' => $transaction->status->value,
        ]);

        $verifiedData = $this->paystack->verifyTransaction($reference);

        if (!$verifiedData) {
            Log::warning('Payment verify: Paystack verification failed', [
                'reference' => $reference,
                'user_id' => $user->id,
            ]);

            return $this->errorResponse(
                'Unable to verify payment with Paystack. Please try again.',
                502,
            );
        }

        $paystackStatus = $verifiedData['status'] ?? '';

        if ($paystackStatus !== 'success') {
            Log::info('Payment verify: Paystack reports non-success', [
                'reference' => $reference,
                'paystack_status' => $paystackStatus,
            ]);

            // Update transaction status if Paystack says it failed
            if (in_array($paystackStatus, ['failed', 'abandoned'], true)) {
                $transaction->update([
                    'status' => 'failed',
                    'metadata' => array_merge(
                        $transaction->metadata ?? [],
                        ['paystack_verification' => $verifiedData]
                    ),
                ]);
            }

            return $this->errorResponse(
                'Payment was not successful. Status: ' . $paystackStatus,
                422,
            );
        }

        // ── Paystack says success — credit the wallet ──
        $amountInNaira = (float) ($verifiedData['amount'] ?? 0) / 100;
        $fees = (float) ($verifiedData['fees'] ?? 0) / 100;

        try {
            DB::transaction(function () use (
                $transaction,
                $verifiedData,
                $amountInNaira,
                $fees,
                $reference,
                $request,
            ) {
                // Lock the wallet row to prevent race condition with webhook
                $wallet = $transaction->wallet()->lockForUpdate()->first();

                // Re-check idempotency inside the lock — the webhook may have
                // processed this transaction while we were waiting for the lock.
                $transaction->refresh();
                if ($transaction->status->value === 'successful') {
                    return;
                }

                $previousBalance = (float) $wallet->available_balance;

                // Update the transaction
                $transaction->update([
                    'status' => 'successful',
                    'fees' => $fees,
                    'provider_reference' => $verifiedData['id'] ?? null,
                    'gateway' => 'paystack',
                    'customer_email' => $verifiedData['customer']['email'] ?? null,
                    'customer_id' => $verifiedData['customer']['customer_code'] ?? null,
                    'payment_channel' => $verifiedData['channel'] ?? null,
                    'currency' => $verifiedData['currency'] ?? 'NGN',
                    'paid_at' => $verifiedData['paid_at'] ?? null,
                    'current_balance' => $previousBalance + $amountInNaira,
                    'metadata' => array_merge(
                        $transaction->metadata ?? [],
                        ['paystack_verification' => $verifiedData]
                    ),
                ]);

                // Credit the wallet
                $wallet->increment('available_balance', $amountInNaira);

                $newBalance = (float) $wallet->fresh()->available_balance;

                // Update transaction current_balance to reflect post-credit state
                $transaction->update(['current_balance' => $newBalance]);

                // ── Wallet history ──
                WalletHistory::create([
                    'wallet_id' => $wallet->id,
                    'user_id' => $transaction->user_id,
                    'transaction_id' => $transaction->id,
                    'type' => 'credit',
                    'amount' => $amountInNaira,
                    'balance_before' => $previousBalance,
                    'balance_after' => $newBalance,
                    'description' => 'Wallet funding via Paystack',
                    'reference' => $reference,
                    'metadata' => [
                        'paystack_reference' => $verifiedData['reference'] ?? null,
                        'channel' => $verifiedData['channel'] ?? null,
                        'fees' => $fees,
                    ],
                ]);

                // ── Audit log ──
                AuditLog::create([
                    'user_id' => $transaction->user_id,
                    'event' => 'payment.verified',
                    'auditable_type' => Transaction::class,
                    'auditable_id' => $transaction->id,
                    'description' => "Wallet credited with ₦" . number_format($amountInNaira, 2) . " via Paystack",
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
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                // Fire event for notification + email receipt
                event(new TransactionCompleted($transaction));
            });

            Log::info('Payment verify: wallet credited successfully', [
                'reference' => $reference,
                'user_id' => $user->id,
                'amount' => $amountInNaira,
            ]);

            $wallet = $user->fresh()->wallet;

            return $this->successResponse([
                'status' => 'success',
                'reference' => $reference,
                'amount' => $amountInNaira,
                'balance' => $wallet ? (float) $wallet->available_balance : 0,
                'message' => 'Payment verified and wallet credited successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Payment verify: database transaction failed', [
                'reference' => $reference,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return $this->errorResponse(
                'Payment verified but wallet credit failed. Please contact support.',
                500,
            );
        }
    }
}
