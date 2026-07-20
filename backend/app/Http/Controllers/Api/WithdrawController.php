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

class WithdrawController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'bank_code' => ['required', 'string', 'max:10'],
            'account_number' => ['required', 'string', 'size:10'],
            'account_name' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:500', 'max:500000'],
        ]);

        $charge = 25.00;
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
                'category' => 'withdrawal',
                'type' => 'debit',
                'amount' => $validated['amount'],
                'charge' => $charge,
                'previous_balance' => $previousBalance,
                'current_balance' => $currentBalance,
                'status' => 'pending',
                'description' => 'Withdrawal to ' . $validated['account_number'],
                'reference' => $reference,
                'metadata' => [
                    'bank_code' => $validated['bank_code'],
                    'account_number' => $validated['account_number'],
                    'account_name' => $validated['account_name'],
                ],
            ]);

            $transaction->bankTransfer()->create([
                'transaction_id' => $transaction->id,
                'recipient_bank' => $validated['bank_code'],
                'recipient_account' => $validated['account_number'],
                'recipient_name' => $validated['account_name'],
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
        ], 'Withdrawal initiated successfully.', 201);
    }
}
