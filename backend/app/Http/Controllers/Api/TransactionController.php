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

        $todaySpending = $user->transactions()
            ->where('type', 'debit')
            ->where('status', 'successful')
            ->whereDate('created_at', Carbon::today())
            ->sum('amount');

        $weekSpending = $user->transactions()
            ->where('type', 'debit')
            ->where('status', 'successful')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('amount');

        $monthSpending = $user->transactions()
            ->where('type', 'debit')
            ->where('status', 'successful')
            ->whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->sum('amount');

        return $this->successResponse([
            'today' => (float) number_format($todaySpending, 2, '.', ''),
            'week' => (float) number_format($weekSpending, 2, '.', ''),
            'month' => (float) number_format($monthSpending, 2, '.', ''),
            'series' => $series,
        ]);
    }
}
