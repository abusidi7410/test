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
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        // Single aggregated query instead of 9 separate count/sum queries
        $stats = DB::selectOne("
            SELECT
                (SELECT COUNT(*) FROM users) AS total_users,
                (SELECT COUNT(*) FROM users WHERE status = ?) AS active_users,
                (SELECT COUNT(*) FROM transactions) AS total_transactions,
                (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE status = ?) AS total_volume,
                (SELECT COALESCE(SUM(charge), 0) FROM transactions WHERE status = ? AND type = ?) AS total_revenue,
                (SELECT COUNT(*) FROM transactions WHERE DATE(created_at) = CURRENT_DATE) AS today_transactions,
                (SELECT COUNT(*) FROM transactions WHERE status = ?) AS pending_transactions,
                (SELECT COUNT(*) FROM transactions WHERE status = ?) AS failed_transactions,
                (SELECT COALESCE(SUM(available_balance), 0) FROM wallets) AS wallet_balance
        ", [
            UserStatus::ACTIVE->value,
            TransactionStatus::SUCCESSFUL->value,
            TransactionStatus::SUCCESSFUL->value,
            TransactionType::DEBIT->value,
            TransactionStatus::PENDING->value,
            TransactionStatus::FAILED->value,
        ]);

        $recentTransactions = Transaction::with('user:id,first_name,last_name,email')
            ->latest()
            ->select(['id', 'reference', 'amount', 'type', 'category', 'status', 'user_id', 'created_at'])
            ->limit(10)
            ->get()
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
            'total_users' => (int) $stats->total_users,
            'active_users' => (int) $stats->active_users,
            'total_transactions' => (int) $stats->total_transactions,
            'total_volume' => (float) $stats->total_volume,
            'pending_transactions' => (int) $stats->pending_transactions,
            'failed_transactions' => (int) $stats->failed_transactions,
            'wallet_balance' => (float) $stats->wallet_balance,
            'revenue' => (float) $stats->total_revenue,
            'today_transactions' => (int) $stats->today_transactions,
            'recent_transactions' => $recentTransactions,
        ]);
    }
}
