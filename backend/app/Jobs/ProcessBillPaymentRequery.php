<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessBillPaymentRequery implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function __construct()
    {
        $this->onQueue('default');
    }

    public function handle(): void
    {
        $cutoff = Carbon::now()->subMinutes(5);

        $pendingTransactions = Transaction::where('status', 'pending')
            ->where('created_at', '<=', $cutoff)
            ->whereHas('billPayment', fn ($q) => $q->whereNotNull('vtpass_request_id'))
            ->with('billPayment')
            ->limit(50)
            ->get();

        if ($pendingTransactions->isEmpty()) {
            Log::info('ProcessBillPaymentRequery: no stale pending transactions found');
            return;
        }

        Log::info('ProcessBillPaymentRequery: dispatching retries', [
            'count' => $pendingTransactions->count(),
        ]);

        foreach ($pendingTransactions as $transaction) {
            RetryPendingBillPayment::dispatch($transaction->id);
        }
    }
}
