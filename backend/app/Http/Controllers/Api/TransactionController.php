<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $query = $user->transactions()->with(['billPayment', 'bankTransfer']);

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $transactions = $query->latest()->paginate($request->input('per_page', 20));

        return $this->paginatedResponse($transactions);
    }

    public function show(Request $request, string $uuid): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $transaction = $user->transactions()
            ->where('uuid', $uuid)
            ->with(['billPayment', 'bankTransfer'])
            ->first();

        if (!$transaction) {
            return $this->errorResponse('Transaction not found.', 404);
        }

        return $this->successResponse($transaction);
    }

    public function spendingSummary(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $startDate = Carbon::now()->subDays(6)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        $dailySpending = $user->transactions()
            ->where('type', 'debit')
            ->where('status', 'successful')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, SUM(amount) as total')
            ->groupBy('date')
            ->pluck('total', 'date');

        $result = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            $result[] = [
                'date' => $date,
                'amount' => number_format($dailySpending->get($date, 0), 2),
            ];
        }

        $totalSpending = $user->transactions()
            ->where('type', 'debit')
            ->where('status', 'successful')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('amount');

        return $this->successResponse([
            'daily' => $result,
            'total' => number_format($totalSpending, 2),
            'period' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => $endDate->format('Y-m-d'),
            ],
        ]);
    }
}
