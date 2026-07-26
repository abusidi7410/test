<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Transaction;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WalletController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user()->load('wallet');

        $wallet = $user->wallet;

        $todaySpending = $user->transactions()
            ->where('type', 'debit')
            ->where('status', 'successful')
            ->whereDate('created_at', now()->toDateString())
            ->sum('amount');

        $monthSpending = $user->transactions()
            ->where('type', 'debit')
            ->where('status', 'successful')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount');

        $dailyLimit = match ($user->level->value) {
            1 => 50000.00,
            2 => 200000.00,
            3 => 500000.00,
            default => 50000.00,
        };

        return $this->successResponse([
            'id' => $wallet->id,
            'balance' => (float) $wallet->available_balance,
            'ledger_balance' => (float) $wallet->ledger_balance,
            'cashback_balance' => (float) $wallet->cashback_balance,
            'bonus_balance' => (float) $wallet->bonus_balance,
            'daily_limit' => $dailyLimit,
            'spent_today' => (float) $todaySpending,
            'spent_month' => (float) $monthSpending,
            'currency' => 'NGN',
            'status' => $wallet->is_locked ? 'locked' : 'active',
            'is_locked' => $wallet->is_locked,
            'updated_at' => $wallet->updated_at->toISOString(),
        ]);
    }

    /**
     * Initialize a wallet funding transaction with Paystack.
     *
     * This creates a pending transaction record and initializes the payment
     * on Paystack's server. The authorization URL is returned to the frontend
     * for the user to complete payment. The actual wallet credit happens
     * via the Paystack webhook (charge.success event).
     */
    public function fund(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:100', 'max:500000'],
        ]);

        $reference = 'TH-' . Str::random(12);
        $amountInKobo = (int) ($validated['amount'] * 100);

        // Build the callback URL for Paystack redirect (frontend return page)
        // Use ?: (elvis) not ?? — empty string from env is falsy but not null
        $callbackUrl = config('services.paystack.callback_url')
            ?: config('frontend.url', 'http://localhost:5173') . '/payment/success';

        Log::info('Wallet fund: initializing Paystack payment', [
            'user_id' => $user->id,
            'amount' => $validated['amount'],
            'reference' => $reference,
            'callback_url' => $callbackUrl,
        ]);

        // Initialize the transaction on Paystack's server via their API
        $paystackService = app(PaystackService::class);
        $paystackData = $paystackService->initializeTransaction(
            amountInKobo: $amountInKobo,
            email: $user->email,
            reference: $reference,
            callbackUrl: $callbackUrl,
            metadata: [
                'user_id' => $user->id,
                'wallet_id' => $user->wallet->id,
            ],
        );

        if (!$paystackData) {
            Log::error('Wallet fund: Paystack initialization failed', [
                'user_id' => $user->id,
                'amount' => $validated['amount'],
                'reference' => $reference,
            ]);

            return $this->errorResponse('Failed to initialize payment. Please try again.', 500);
        }

        Log::info('Wallet fund: Paystack initialization successful', [
            'user_id' => $user->id,
            'reference' => $reference,
            'authorization_url' => $paystackData['authorization_url'] ?? null,
        ]);

        // Create a pending transaction record inside a DB transaction
        DB::transaction(function () use ($user, $validated, $reference, $paystackData) {
            Transaction::create([
                'user_id' => $user->id,
                'wallet_id' => $user->wallet->id,
                'category' => 'wallet_funding',
                'type' => 'credit',
                'amount' => $validated['amount'],
                'charge' => 0.00,
                'fees' => 0.00,
                'previous_balance' => $user->wallet->available_balance,
                'current_balance' => $user->wallet->available_balance,
                'status' => 'pending',
                'description' => 'Wallet funding via Paystack',
                'reference' => $reference,
                'gateway' => 'paystack',
                'customer_email' => $user->email,
                'currency' => 'NGN',
                'metadata' => [
                    'amount' => $validated['amount'],
                    'email' => $user->email,
                    'paystack_reference' => $paystackData['reference'] ?? $reference,
                ],
            ]);
        });

        return $this->successResponse([
            'authorization_url' => $paystackData['authorization_url'],
            'access_code' => $paystackData['access_code'],
            'reference' => $reference,
            'amount' => number_format($validated['amount'], 2),
        ], 'Payment initialization successful.', 201);
    }
}
