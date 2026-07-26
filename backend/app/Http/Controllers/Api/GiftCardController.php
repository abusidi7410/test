<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\GiftCard;
use App\Models\Transaction;
use App\Models\User;
use App\Models\WalletHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GiftCardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $giftCards = $user->giftCards()
            ->with('transaction')
            ->latest()
            ->paginate(15);

        return $this->successResponse($giftCards, 'Gift cards retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'card_name' => ['required', 'string', 'max:255'],
            'card_number' => ['required', 'string', 'max:255'],
            'card_pin' => ['nullable', 'string', 'max:50'],
            'card_value' => ['required', 'numeric', 'min:0.01'],
            'exchange_rate' => ['required', 'numeric', 'min:0.0001'],
        ]);

        /** @var User $user */
        $user = $request->user();

        $cardValue = (float) $validated['card_value'];
        $exchangeRate = (float) $validated['exchange_rate'];
        $nairaValue = round($cardValue * $exchangeRate, 2);
        $reference = 'TH-GC-' . Str::random(12);

        $transaction = null;
        $giftCard = null;

        try {
            $result = DB::transaction(function () use (
                $user,
                $validated,
                $cardValue,
                $exchangeRate,
                $nairaValue,
                $reference,
            ) {
                $wallet = $user->wallet()->lockForUpdate()->first();

                $previousBalance = (float) $wallet->available_balance;
                $currentBalance = $previousBalance + $nairaValue;

                $transaction = Transaction::create([
                    'user_id' => $user->id,
                    'wallet_id' => $wallet->id,
                    'category' => 'gift_card',
                    'type' => 'credit',
                    'amount' => $nairaValue,
                    'charge' => 0.00,
                    'previous_balance' => $previousBalance,
                    'current_balance' => $currentBalance,
                    'status' => 'successful',
                    'description' => 'Gift card sale - ' . $validated['card_name'],
                    'reference' => $reference,
                    'metadata' => [
                        'card_name' => $validated['card_name'],
                        'card_value' => $cardValue,
                        'exchange_rate' => $exchangeRate,
                        'naira_value' => $nairaValue,
                    ],
                ]);

                $giftCard = GiftCard::create([
                    'user_id' => $user->id,
                    'transaction_id' => $transaction->id,
                    'card_name' => $validated['card_name'],
                    'card_number' => $validated['card_number'],
                    'card_pin' => $validated['card_pin'] ?? null,
                    'card_value' => $cardValue,
                    'exchange_rate' => $exchangeRate,
                    'naira_value' => $nairaValue,
                    'status' => 'active',
                    'metadata' => [
                        'submitted_at' => now()->toISOString(),
                    ],
                ]);

                $wallet->increment('available_balance', $nairaValue);

                WalletHistory::create([
                    'wallet_id' => $wallet->id,
                    'user_id' => $user->id,
                    'transaction_id' => $transaction->id,
                    'type' => 'credit',
                    'amount' => $nairaValue,
                    'balance_before' => $previousBalance,
                    'balance_after' => $currentBalance,
                    'description' => 'Gift card sale - ' . $validated['card_name'],
                    'reference' => $reference,
                ]);

                AuditLog::create([
                    'user_id' => $user->id,
                    'event' => 'wallet_credited',
                    'auditable_type' => Transaction::class,
                    'auditable_id' => $transaction->id,
                    'description' => 'Gift card sale credited wallet',
                    'old_values' => ['balance' => $previousBalance],
                    'new_values' => ['balance' => $currentBalance],
                ]);

                return [
                    'transaction' => $transaction,
                    'giftCard' => $giftCard,
                ];
            });

            return $this->successResponse([
                'gift_card' => $result['giftCard']->fresh(['transaction']),
                'transaction' => $result['transaction'],
                'naira_value' => number_format($nairaValue, 2),
                'reference' => $reference,
            ], 'Gift card submitted successfully. Wallet credited.', 201);
        } catch (\Exception $e) {
            Log::error('Gift card sale exception', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return $this->errorResponse('Gift card submission failed. Please try again.', 500);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $giftCard = $user->giftCards()
            ->with('transaction')
            ->find($id);

        if (!$giftCard) {
            return $this->errorResponse('Gift card not found.', 404);
        }

        return $this->successResponse($giftCard, 'Gift card retrieved successfully.');
    }
}
