<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\BillPayment;
use App\Models\Notification;
use App\Models\Transaction;
use App\Services\Providers\ProviderRegistry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RetryPendingBillPayment implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        public readonly int $transactionId,
    ) {
        $this->onQueue('default');
    }

    public function handle(ProviderRegistry $registry): void
    {
        $transaction = Transaction::with('billPayment')->find($this->transactionId);

        if (!$transaction || !$transaction->billPayment) {
            Log::warning('RetryPendingBillPayment: transaction or billPayment not found', [
                'transaction_id' => $this->transactionId,
            ]);
            return;
        }

        if ($transaction->status !== Transaction::STATUS_PENDING) {
            return;
        }

        $billPayment = $transaction->billPayment;

        if (!$billPayment->vtpass_request_id) {
            Log::warning('RetryPendingBillPayment: no vtpass_request_id', [
                'transaction_id' => $this->transactionId,
            ]);
            return;
        }

        $result = $registry->executeWithFailover(
            $transaction->category,
            fn ($adapter) => $adapter->requery($billPayment->vtpass_request_id),
        );

        DB::transaction(function () use ($result, $transaction, $billPayment) {
            if ($result['success'] && !isset($result['pending'])) {
                $transaction->update([
                    'status' => Transaction::STATUS_SUCCESSFUL,
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

                Log::info('RetryPendingBillPayment: transaction successful', [
                    'transaction_id' => $transaction->id,
                    'reference' => $transaction->reference,
                ]);
            } elseif ($result['success'] && isset($result['pending'])) {
                Log::info('RetryPendingBillPayment: transaction still pending', [
                    'transaction_id' => $transaction->id,
                    'reference' => $transaction->reference,
                ]);
            } else {
                throw new \RuntimeException(
                    'Bill payment requery failed: ' . ($result['message'] ?? 'Unknown error')
                );
            }
        });
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('RetryPendingBillPayment: all retries exhausted', [
            'transaction_id' => $this->transactionId,
            'error' => $exception->getMessage(),
        ]);

        DB::transaction(function () use ($exception) {
            $transaction = Transaction::with('billPayment')->find($this->transactionId);

            if (!$transaction || $transaction->status !== Transaction::STATUS_PENDING) {
                return;
            }

            $transaction->update([
                'status' => Transaction::STATUS_FAILED,
                'description' => $transaction->description . ' - ' . $exception->getMessage(),
            ]);

            if ($transaction->billPayment) {
                $transaction->billPayment->update([
                    'vtpass_response' => ['error' => $exception->getMessage()],
                ]);
            }

            $transaction->wallet->increment(
                'available_balance',
                $transaction->amount + $transaction->charge,
            );

            Notification::create([
                'user_id' => $transaction->user_id,
                'type' => 'transaction',
                'title' => 'Bill Payment Failed',
                'description' => $transaction->description . ' failed: ' . $exception->getMessage(),
                'data' => [
                    'transaction_id' => $transaction->id,
                    'reference' => $transaction->reference,
                ],
            ]);
        });
    }
}
