<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminWalletController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Wallet::with('user:id,first_name,last_name,email')
            ->select(['id', 'user_id', 'available_balance', 'ledger_balance', 'cashback_balance', 'bonus_balance', 'is_locked', 'created_at']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_locked')) {
            $query->where('is_locked', $request->boolean('is_locked'));
        }

        $wallets = $query->latest()->paginate($request->input('per_page', 20));

        return $this->paginatedResponse($wallets);
    }

    public function show(string $id): JsonResponse
    {
        $wallet = Wallet::with([
            'user',
            'transactions' => fn ($q) => $q->latest()->take(20),
        ])->find($id);

        if (!$wallet) {
            return $this->errorResponse('Wallet not found.', 404);
        }

        return $this->successResponse(['wallet' => $wallet]);
    }

    public function credit(string $id, Request $request): JsonResponse
    {
        $wallet = Wallet::find($id);

        if (!$wallet) {
            return $this->errorResponse('Wallet not found.', 404);
        }

        if ($wallet->is_locked) {
            return $this->errorResponse('Wallet is locked.', 403);
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'narration' => ['nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($wallet, $validated) {
            $previousBalance = $wallet->available_balance;

            $wallet->increment('available_balance', $validated['amount']);
            $wallet->increment('ledger_balance', $validated['amount']);

            Transaction::create([
                'user_id' => $wallet->user_id,
                'wallet_id' => $wallet->id,
                'type' => TransactionType::CREDIT,
                'category' => 'wallet_funding',
                'amount' => $validated['amount'],
                'charge' => 0.00,
                'fees' => 0.00,
                'status' => TransactionStatus::SUCCESSFUL,
                'description' => $validated['narration'] ?? 'Admin credit',
                'reference' => 'ADM-' . strtoupper(Str::random(16)),
                'previous_balance' => $previousBalance,
                'current_balance' => $wallet->fresh()->available_balance,
                'currency' => 'NGN',
            ]);
        });

        return $this->successResponse([
            'wallet' => $wallet->fresh()->load('user'),
        ], 'Wallet credited successfully.');
    }

    public function debit(string $id, Request $request): JsonResponse
    {
        $wallet = Wallet::find($id);

        if (!$wallet) {
            return $this->errorResponse('Wallet not found.', 404);
        }

        if ($wallet->is_locked) {
            return $this->errorResponse('Wallet is locked.', 403);
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'narration' => ['nullable', 'string', 'max:255'],
        ]);

        if ($wallet->available_balance < $validated['amount']) {
            return $this->errorResponse('Insufficient wallet balance.', 400);
        }

        DB::transaction(function () use ($wallet, $validated) {
            $previousBalance = $wallet->available_balance;

            $wallet->decrement('available_balance', $validated['amount']);
            $wallet->decrement('ledger_balance', $validated['amount']);

            Transaction::create([
                'user_id' => $wallet->user_id,
                'wallet_id' => $wallet->id,
                'type' => TransactionType::DEBIT,
                'category' => 'transfer',
                'amount' => $validated['amount'],
                'charge' => 0.00,
                'fees' => 0.00,
                'status' => TransactionStatus::SUCCESSFUL,
                'description' => $validated['narration'] ?? 'Admin debit',
                'reference' => 'ADM-' . strtoupper(Str::random(16)),
                'previous_balance' => $previousBalance,
                'current_balance' => $wallet->fresh()->available_balance,
                'currency' => 'NGN',
            ]);
        });

        return $this->successResponse([
            'wallet' => $wallet->fresh()->load('user'),
        ], 'Wallet debited successfully.');
    }

    public function lock(string $id): JsonResponse
    {
        $wallet = Wallet::find($id);

        if (!$wallet) {
            return $this->errorResponse('Wallet not found.', 404);
        }

        $wallet->update([
            'is_locked' => true,
            'locked_at' => now(),
        ]);

        return $this->successResponse([
            'wallet' => $wallet->fresh()->load('user'),
        ], 'Wallet locked successfully.');
    }

    public function unlock(string $id): JsonResponse
    {
        $wallet = Wallet::find($id);

        if (!$wallet) {
            return $this->errorResponse('Wallet not found.', 404);
        }

        $wallet->update([
            'is_locked' => false,
            'locked_at' => null,
        ]);

        return $this->successResponse([
            'wallet' => $wallet->fresh()->load('user'),
        ], 'Wallet unlocked successfully.');
    }

    public function history(string $id, Request $request): JsonResponse
    {
        $wallet = Wallet::find($id);

        if (!$wallet) {
            return $this->errorResponse('Wallet not found.', 404);
        }

        $query = Transaction::where('wallet_id', $id);

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        $transactions = $query->latest()->paginate($request->input('per_page', 20));

        return $this->paginatedResponse($transactions);
    }
}
