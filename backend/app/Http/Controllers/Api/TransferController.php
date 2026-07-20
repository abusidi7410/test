<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransferController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'recipient_bank' => ['required', 'string', 'max:100'],
            'account_number' => ['required', 'string', 'size:10'],
            'amount' => ['required', 'numeric', 'min:100', 'max:500000'],
            'narration' => ['nullable', 'string', 'max:255'],
        ]);

        $charge = 10.00;
        $totalDebit = $validated['amount'] + $charge;

        if ($user->wallet->available_balance < $totalDebit) {
            return $this->errorResponse('Insufficient wallet balance.', 422);
        }

        $transaction = DB::transaction(function () use ($user, $validated, $charge, $totalDebit) {
            $previousBalance = $user->wallet->available_balance;
            $currentBalance = $previousBalance - $totalDebit;
            $reference = 'TH-' . Str::random(12);

            $transaction = Transaction::create([
                'user_id' => $user->id,
                'wallet_id' => $user->wallet->id,
                'category' => 'transfer',
                'type' => 'debit',
                'amount' => $validated['amount'],
                'charge' => $charge,
                'previous_balance' => $previousBalance,
                'current_balance' => $currentBalance,
                'status' => 'pending',
                'description' => $validated['narration'] ?? 'Bank transfer to ' . $validated['account_number'],
                'reference' => $reference,
                'metadata' => [
                    'recipient_bank' => $validated['recipient_bank'],
                    'recipient_account' => $validated['account_number'],
                ],
            ]);

            $transaction->bankTransfer()->create([
                'transaction_id' => $transaction->id,
                'recipient_bank' => $validated['recipient_bank'],
                'recipient_account' => $validated['account_number'],
                'recipient_name' => null,
                'amount' => $validated['amount'],
                'status' => 'pending',
            ]);

            $user->wallet->decrement('available_balance', $totalDebit);

            return $transaction;
        });

        return $this->successResponse([
            'transaction' => $transaction->fresh(['bankTransfer']),
            'amount' => number_format($validated['amount'], 2),
            'charge' => number_format($charge, 2),
            'total_debited' => number_format($totalDebit, 2),
            'reference' => $transaction->reference,
        ], 'Transfer initiated successfully.', 201);
    }
}
