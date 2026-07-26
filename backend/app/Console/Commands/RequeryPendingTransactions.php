<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Jobs\ProcessBillPaymentRequery;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Console\Command;

class RequeryPendingTransactions extends Command
{
    protected $signature = 'transactions:requery';

    protected $description = 'Requery pending transactions that are older than 5 minutes';

    public function handle(): int
    {
        $pendingCount = Transaction::where('status', 'pending')
            ->where('created_at', '<=', Carbon::now()->subMinutes(5))
            ->whereHas('billPayment', fn ($q) => $q->whereNotNull('vtpass_request_id'))
            ->count();

        $this->info("Found {$pendingCount} stale pending transactions.");

        ProcessBillPaymentRequery::dispatch();

        $this->info('Requery job dispatched to queue.');

        return Command::SUCCESS;
    }
}
