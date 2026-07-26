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

        $query = $user->transactions()
            ->with(['billPayment' => fn ($q) => $q->select(['id', 'transaction_id', 'service_type', 'provider', 'vtpass_request_id']),
                   'bankTransfer' => fn ($q) => $q->select(['id', 'transaction_id', 'recipient_bank', 'recipient_account', 'recipient_name', 'amount', 'status'])])
            ->select(['id', 'uuid', 'reference', 'type', 'category', 'amount', 'charge', 'status', 'description', 'metadata', 'created_at']);

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

        $paginator = $query->latest()->paginate($request->input('per_page', 20));

        $items = collect($paginator->items())->map(fn ($tx) => [
            'id' => $tx->id,
            'uuid' => $tx->uuid,
            'reference' => $tx->reference,
            'type' => $tx->type->value,
            'service' => $tx->category->value,
            'amount' => (float) $tx->amount,
            'fee' => (float) $tx->charge,
            'status' => $tx->status->value,
            'direction' => $tx->type->value === 'credit' ? 'in' : 'out',
            'narration' => $tx->description,
            'metadata' => $tx->metadata,
            'created_at' => $tx->created_at->toISOString(),
            'billPayment' => $tx->billPayment,
            'bankTransfer' => $tx->bankTransfer,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Request completed successfully.',
            'data' => [
                'data' => $items,
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                ],
            ],
        ]);
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

        // Single query for all spending stats instead of 4 separate queries
        $stats = $user->transactions()
            ->where('type', 'debit')
            ->where('status', 'successful')
            ->selectRaw('
                SUM(CASE WHEN created_at >= ? THEN amount ELSE 0 END) as today,
                SUM(CASE WHEN created_at >= ? AND created_at <= ? THEN amount ELSE 0 END) as week,
                SUM(CASE WHEN EXTRACT(MONTH FROM created_at) = ? AND EXTRACT(YEAR FROM created_at) = ? THEN amount ELSE 0 END) as month
            ', [
                Carbon::today()->toDateTimeString(),
                $startDate->toDateTimeString(),
                $endDate->toDateTimeString(),
                Carbon::now()->month,
                Carbon::now()->year,
            ])
            ->first();

        $dailySpending = $user->transactions()
            ->where('type', 'debit')
            ->where('status', 'successful')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, SUM(amount) as total')
            ->groupBy('date')
            ->pluck('total', 'date');

        $series = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            $series[] = [
                'day' => Carbon::now()->subDays($i)->format('D'),
                'amount' => (float) number_format($dailySpending->get($date, 0), 2, '.', ''),
            ];
        }

        return $this->successResponse([
            'today' => (float) number_format($stats->today ?? 0, 2, '.', ''),
            'week' => (float) number_format($stats->week ?? 0, 2, '.', ''),
            'month' => (float) number_format($stats->month ?? 0, 2, '.', ''),
            'series' => $series,
        ]);
    }
}
