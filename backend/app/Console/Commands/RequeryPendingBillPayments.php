<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\BillPayment;
use App\Models\Notification;
use App\Models\Transaction;
use App\Services\Providers\ProviderRegistry;
use Carbon\Carbon;
use Illuminate\Console\Command;

class RequeryPendingBillPayments extends Command
{
    protected $signature = 'bills:requery-pending';

    protected $description = 'Requery pending bill payments via provider registry';

    public function handle(): int
    {
        $cutoff = Carbon::now()->subHours(24);

        $pendingPayments = BillPayment::whereHas('transaction', function ($query) {
            $query->where('status', 'pending');
            $query->where('created_at', '<=', Carbon::now()->subMinutes(2));
        })
            ->where('created_at', '>=', $cutoff)
            ->whereNotNull('vtpass_request_id')
            ->with('transaction')
            ->limit(50)
            ->get();

        if ($pendingPayments->isEmpty()) {
            $this->info('No pending bill payments to requery.');

            return Command::SUCCESS;
        }

        $registry = app(ProviderRegistry::class);

        $this->info("Requerying {$pendingPayments->count()} pending bill payments...");

        foreach ($pendingPayments as $billPayment) {
            /** @var Transaction $transaction */
            $transaction = $billPayment->transaction;

            try {
                $result = $registry->executeWithFailover($transaction->category, function ($adapter) use ($billPayment) {
                    return $adapter->requery($billPayment->vtpass_request_id);
                });

                if ($result['success'] && !isset($result['pending'])) {
                    $transaction->update([
                        'status' => 'successful',
                        'provider_reference' => $result['response']['transactionId'] ?? null,
                    ]);

                    $billPayment->update([
                        'vtpass_response' => $result['response'],
                    ]);

                    Notification::create([
                        'user_id' => $transaction->user_id,
                        'type' => 'transaction',
                        'title' => 'Bill Payment Successful',
                        'description' => $transaction->description . ' completed successfully.',
                        'data' => [
                            'transaction_id' => $transaction->id,
                            'reference' => $transaction->reference,
                            'amount' => $transaction->amount,
                        ],
                    ]);

                    $this->info("Transaction {$transaction->reference} updated to successful.");
                } elseif ($result['success'] && isset($result['pending'])) {
                    $this->info("Transaction {$transaction->reference} still pending.");
                } else {
                    $transaction->update([
                        'status' => 'failed',
                        'description' => $transaction->description . ' - ' . ($result['message'] ?? 'Unknown error'),
                    ]);

                    $billPayment->update([
                        'vtpass_response' => $result['response'] ?? null,
                    ]);

                    $transaction->user->wallet->increment('available_balance', $transaction->amount + $transaction->charge);

                    Notification::create([
                        'user_id' => $transaction->user_id,
                        'type' => 'transaction',
                        'title' => 'Bill Payment Failed',
                        'description' => $transaction->description . ' failed: ' . ($result['message'] ?? 'Unknown error'),
                        'data' => [
                            'transaction_id' => $transaction->id,
                            'reference' => $transaction->reference,
                        ],
                    ]);

                    $this->warn("Transaction {$transaction->reference} updated to failed. Wallet refunded.");
                }
            } catch (\Exception $e) {
                $this->error("Failed to requery {$transaction->reference}: {$e->getMessage()}");
            }
        }

        $this->info('Requery complete.');

        return Command::SUCCESS;
    }
}
