<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\BillPayment;
use App\Models\Notification;
use App\Models\Transaction;
use App\Services\Vtpass;
use Carbon\Carbon;
use Illuminate\Console\Command;

class RequeryPendingBillPayments extends Command
{
    protected $signature = 'bills:requery-pending';

    protected $description = 'Requery pending bill payments with VTpass';

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

        /** @var Vtpass $vtpass */
        $vtpass = app(Vtpass::class);

        $this->info("Requerying {$pendingPayments->count()} pending bill payments...");

        foreach ($pendingPayments as $billPayment) {
            /** @var Transaction $transaction */
            $transaction = $billPayment->transaction;

            try {
                $response = $vtpass->requery($billPayment->vtpass_request_id);

                if ($vtpass->isResponseSuccessful($response)) {
                    $transaction->update([
                        'status' => 'successful',
                        'provider_reference' => $response['transactionId'] ?? null,
                    ]);

                    $billPayment->update([
                        'vtpass_response' => $response,
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
                } elseif ($vtpass->isResponsePending($response)) {
                    $this->info("Transaction {$transaction->reference} still pending.");
                } else {
                    $transaction->update([
                        'status' => 'failed',
                        'description' => $transaction->description . ' - ' . $vtpass->getResponseMessage($response),
                    ]);

                    $billPayment->update([
                        'vtpass_response' => $response,
                    ]);

                    $transaction->user->wallet->increment('available_balance', $transaction->amount + $transaction->charge);

                    Notification::create([
                        'user_id' => $transaction->user_id,
                        'type' => 'transaction',
                        'title' => 'Bill Payment Failed',
                        'description' => $transaction->description . ' failed: ' . $vtpass->getResponseMessage($response),
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
