<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminTransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with('user');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        $transactions = $query->latest()->paginate($request->input('per_page', 20));

        return $this->paginatedResponse($transactions);
    }

    public function show(string $id): JsonResponse
    {
        $transaction = Transaction::with('user')->find($id);

        if (!$transaction) {
            return $this->errorResponse('Transaction not found.', 404);
        }

        return $this->successResponse(['transaction' => $transaction]);
    }

    public function approve(string $id): JsonResponse
    {
        $transaction = Transaction::find($id);

        if (!$transaction) {
            return $this->errorResponse('Transaction not found.', 404);
        }

        if ($transaction->status !== TransactionStatus::PENDING) {
            return $this->errorResponse('Only pending transactions can be approved.', 400);
        }

        $transaction->update(['status' => TransactionStatus::SUCCESSFUL]);

        if ($transaction->type === TransactionType::CREDIT && $transaction->wallet_id) {
            $transaction->wallet->increment('available_balance', $transaction->amount);
            $transaction->wallet->increment('ledger_balance', $transaction->amount);
            $transaction->update([
                'current_balance' => $transaction->wallet->fresh()->available_balance,
            ]);
        }

        return $this->successResponse([
            'transaction' => $transaction->fresh()->load('user'),
        ], 'Transaction approved successfully.');
    }

    public function reject(string $id): JsonResponse
    {
        $transaction = Transaction::find($id);

        if (!$transaction) {
            return $this->errorResponse('Transaction not found.', 404);
        }

        if ($transaction->status !== TransactionStatus::PENDING) {
            return $this->errorResponse('Only pending transactions can be rejected.', 400);
        }

        $transaction->update(['status' => TransactionStatus::FAILED]);

        return $this->successResponse([
            'transaction' => $transaction->fresh()->load('user'),
        ], 'Transaction rejected successfully.');
    }

    public function reverse(string $id): JsonResponse
    {
        $transaction = Transaction::find($id);

        if (!$transaction) {
            return $this->errorResponse('Transaction not found.', 404);
        }

        if ($transaction->status !== TransactionStatus::SUCCESSFUL) {
            return $this->errorResponse('Only successful transactions can be reversed.', 400);
        }

        $wallet = $transaction->wallet;

        if (!$wallet) {
            return $this->errorResponse('Wallet not found for this transaction.', 404);
        }

        DB::transaction(function () use ($transaction, $wallet) {
            $previousBalance = $wallet->available_balance;

            if ($transaction->type === TransactionType::CREDIT) {
                $wallet->decrement('available_balance', $transaction->amount);
                $wallet->decrement('ledger_balance', $transaction->amount);
            } else {
                $wallet->increment('available_balance', $transaction->amount);
                $wallet->increment('ledger_balance', $transaction->amount);
            }

            $currentBalance = $wallet->fresh()->available_balance;

            Transaction::create([
                'user_id' => $transaction->user_id,
                'wallet_id' => $wallet->id,
                'type' => $transaction->type === TransactionType::CREDIT
                    ? TransactionType::DEBIT
                    : TransactionType::CREDIT,
                'category' => $transaction->category,
                'amount' => $transaction->amount,
                'charge' => 0.00,
                'fees' => 0.00,
                'status' => TransactionStatus::SUCCESSFUL,
                'description' => 'Reversal for ' . $transaction->reference,
                'reference' => 'REV-' . strtoupper(Str::random(16)),
                'previous_balance' => $previousBalance,
                'current_balance' => $currentBalance,
                'currency' => $transaction->currency,
            ]);

            $transaction->update(['status' => TransactionStatus::REVERSED]);
        });

        return $this->successResponse([
            'transaction' => $transaction->fresh()->load('user'),
        ], 'Transaction reversed successfully.');
    }
}
