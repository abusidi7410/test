<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use App\Models\UserSetting;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with('wallet:id,user_id,available_balance,ledger_balance,is_locked')
            ->select(['id', 'first_name', 'last_name', 'email', 'phone', 'status', 'level', 'created_at']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $users = $query->latest()->paginate($request->input('per_page', 20));

        return $this->paginatedResponse($users);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:20', 'unique:users'],
            'status' => ['nullable', 'string', 'in:active,suspended,banned'],
            'level' => ['nullable', 'integer', 'in:1,2,3'],
        ]);

        $user = DB::transaction(function () use ($validated) {
            $username = strtolower($validated['first_name'] . $validated['last_name'] . Str::random(4));

            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'username' => $username,
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => $validated['password'],
                'referral_code' => strtoupper(Str::random(8)),
                'status' => $validated['status'] ?? 'active',
                'level' => $validated['level'] ?? 1,
            ]);

            Wallet::create([
                'user_id' => $user->id,
                'available_balance' => 0.00,
                'ledger_balance' => 0.00,
                'cashback_balance' => 0.00,
                'bonus_balance' => 0.00,
            ]);

            UserSetting::create([
                'user_id' => $user->id,
                'email_notifications' => true,
                'push_notifications' => true,
                'sms_alerts' => true,
                'marketing_emails' => false,
                'theme' => 'light',
                'language' => 'en',
            ]);

            return $user;
        });

        return $this->successResponse([
            'user' => $user->load('wallet'),
        ], 'User created successfully.', 201);
    }

    public function show(string $id): JsonResponse
    {
        $user = User::with([
            'wallet',
            'settings',
            'transactions' => fn ($q) => $q->latest()->take(50),
            'socialAccounts',
            'referrals',
        ])->find($id);

        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        return $this->successResponse(['user' => $user]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', 'unique:users,email,' . $id],
            'phone' => ['nullable', 'string', 'max:20', 'unique:users,phone,' . $id],
            'status' => ['sometimes', 'string', 'in:active,suspended,banned'],
            'level' => ['sometimes', 'integer', 'in:1,2,3'],
        ]);

        $user->update($validated);

        return $this->successResponse([
            'user' => $user->load('wallet'),
        ], 'User updated successfully.');
    }

    public function destroy(string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        DB::transaction(function () use ($user) {
            $user->transactions()->delete();
            $user->wallet()->delete();
            $user->settings()->delete();
            $user->socialAccounts()->delete();
            $user->referrals()->delete();
            $user->bankAccounts()->delete();
            $user->notifications()->delete();
            $user->delete();
        });

        return $this->successResponse(null, 'User deleted successfully.');
    }

    public function suspend(string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        $user->update(['status' => UserStatus::SUSPENDED]);

        return $this->successResponse([
            'user' => $user->load('wallet'),
        ], 'User suspended successfully.');
    }

    public function activate(string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        $user->update(['status' => UserStatus::ACTIVE]);

        return $this->successResponse([
            'user' => $user->load('wallet'),
        ], 'User activated successfully.');
    }

    public function ban(string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        $user->update(['status' => UserStatus::BANNED]);

        return $this->successResponse([
            'user' => $user->load('wallet'),
        ], 'User banned successfully.');
    }

    public function credit(Request $request, string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'narration' => ['nullable', 'string', 'max:255'],
        ]);

        $wallet = $user->wallet;

        if (!$wallet) {
            return $this->errorResponse('User wallet not found.', 404);
        }

        if ($wallet->is_locked) {
            return $this->errorResponse('User wallet is locked.', 403);
        }

        DB::transaction(function () use ($wallet, $validated, $user) {
            $previousBalance = $wallet->available_balance;

            $wallet->increment('available_balance', $validated['amount']);
            $wallet->increment('ledger_balance', $validated['amount']);

            Transaction::create([
                'user_id' => $user->id,
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
            'wallet' => $wallet->fresh(),
        ], 'Wallet credited successfully.');
    }

    public function debit(Request $request, string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'narration' => ['nullable', 'string', 'max:255'],
        ]);

        $wallet = $user->wallet;

        if (!$wallet) {
            return $this->errorResponse('User wallet not found.', 404);
        }

        if ($wallet->is_locked) {
            return $this->errorResponse('User wallet is locked.', 403);
        }

        if ($wallet->available_balance < $validated['amount']) {
            return $this->errorResponse('Insufficient wallet balance.', 400);
        }

        DB::transaction(function () use ($wallet, $validated, $user) {
            $previousBalance = $wallet->available_balance;

            $wallet->decrement('available_balance', $validated['amount']);
            $wallet->decrement('ledger_balance', $validated['amount']);

            Transaction::create([
                'user_id' => $user->id,
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
            'wallet' => $wallet->fresh(),
        ], 'Wallet debited successfully.');
    }

    public function lockWallet(string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        $wallet = $user->wallet;

        if (!$wallet) {
            return $this->errorResponse('User wallet not found.', 404);
        }

        $wallet->update([
            'is_locked' => true,
            'locked_at' => now(),
        ]);

        return $this->successResponse([
            'wallet' => $wallet->fresh(),
        ], 'Wallet locked successfully.');
    }

    public function unlockWallet(string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        $wallet = $user->wallet;

        if (!$wallet) {
            return $this->errorResponse('User wallet not found.', 404);
        }

        $wallet->update([
            'is_locked' => false,
            'locked_at' => null,
        ]);

        return $this->successResponse([
            'wallet' => $wallet->fresh(),
        ], 'Wallet unlocked successfully.');
    }

    public function transactions(Request $request, string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('User not found.', 404);
        }

        $transactions = $user->transactions()
            ->latest()
            ->paginate($request->input('per_page', 20));

        return $this->paginatedResponse($transactions);
    }
}
