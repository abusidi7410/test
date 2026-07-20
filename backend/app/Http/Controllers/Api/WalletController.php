<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WalletController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user()->load('wallet');

        return $this->successResponse($user->wallet);
    }

    public function fund(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:100', 'max:500000'],
        ]);

        $reference = 'TH-' . Str::random(12);

        $transaction = Transaction::create([
            'user_id' => $user->id,
            'wallet_id' => $user->wallet->id,
            'category' => 'wallet_funding',
            'type' => 'credit',
            'amount' => $validated['amount'],
            'charge' => 0.00,
            'previous_balance' => $user->wallet->available_balance,
            'current_balance' => $user->wallet->available_balance,
            'status' => 'pending',
            'description' => 'Wallet funding via Paystack',
            'reference' => $reference,
            'metadata' => [
                'amount' => $validated['amount'],
                'email' => $user->email,
            ],
        ]);

        $authorizationUrl = config('services.paystack.base_url')
            . '/transaction/initialize'
            . '?reference=' . $reference
            . '&amount=' . ($validated['amount'] * 100)
            . '&email=' . $user->email;

        return $this->successResponse([
            'authorization_url' => $authorizationUrl,
            'reference' => $reference,
            'amount' => number_format($validated['amount'], 2),
            'transaction_id' => $transaction->id,
        ], 'Payment initialization successful.', 201);
    }
}
