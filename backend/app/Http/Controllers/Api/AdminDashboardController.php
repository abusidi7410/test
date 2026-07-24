<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $totalUsers = User::count();
        $activeUsers = User::where('status', UserStatus::ACTIVE)->count();
        $walletBalance = Wallet::sum('available_balance');
        $totalTransactions = Transaction::count();
        $totalVolume = Transaction::where('status', TransactionStatus::SUCCESSFUL)->sum('amount');
        $totalRevenue = Transaction::where('status', TransactionStatus::SUCCESSFUL)
            ->where('type', TransactionType::DEBIT)
            ->sum('charge');
        $todayTransactions = Transaction::whereDate('created_at', today())->count();
        $pendingTransactions = Transaction::where('status', TransactionStatus::PENDING)->count();
        $failedTransactions = Transaction::where('status', TransactionStatus::FAILED)->count();
        $recentTransactions = Transaction::with('user')->latest()->take(10)->get()
            ->map(fn ($tx) => [
                'id' => $tx->id,
                'reference' => $tx->reference,
                'amount' => $tx->amount,
                'type' => $tx->type->value,
                'service' => $tx->category->value,
                'direction' => $tx->type === TransactionType::CREDIT ? 'in' : 'out',
                'status' => $tx->status->value,
                'user' => $tx->user ? [
                    'id' => $tx->user->id,
                    'first_name' => $tx->user->first_name,
                    'last_name' => $tx->user->last_name,
                    'email' => $tx->user->email,
                ] : null,
                'created_at' => $tx->created_at->toISOString(),
            ]);

        return $this->successResponse([
            'total_users' => $totalUsers,
            'active_users' => $activeUsers,
            'total_transactions' => $totalTransactions,
            'total_volume' => $totalVolume,
            'pending_transactions' => $pendingTransactions,
            'failed_transactions' => $failedTransactions,
            'wallet_balance' => $walletBalance,
            'revenue' => $totalRevenue,
            'today_transactions' => $todayTransactions,
            'recent_transactions' => $recentTransactions,
        ]);
    }
}
