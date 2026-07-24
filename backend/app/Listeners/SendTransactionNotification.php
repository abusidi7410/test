<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\TransactionCompleted;
use App\Jobs\SendEmailJob;
use App\Models\Notification;
use App\Models\Referral;
use App\Models\ReferralEarning;
use Illuminate\Support\Facades\Log;

/**
 * Dispatches in-app notification, email receipt, and referral earnings
 * when a transaction completes.
 */
class SendTransactionNotification
{
    public function handle(TransactionCompleted $event): void
    {
        $transaction = $event->transaction;

        try {
            $title = match ($transaction->category->value) {
                'wallet_funding' => 'Wallet Funded Successfully',
                'transfer' => 'Transfer Completed',
                'withdrawal' => 'Withdrawal Processed',
                default => 'Transaction Completed',
            };

            $description = match ($transaction->category->value) {
                'wallet_funding' => "Your wallet has been credited with ₦" .
                    number_format($transaction->amount, 2) . ".",
                'transfer' => "Your transfer of ₦" .
                    number_format($transaction->amount, 2) . " has been completed.",
                'withdrawal' => "Your withdrawal of ₦" .
                    number_format($transaction->amount, 2) . " has been processed.",
                default => "Your transaction ({$transaction->reference}) has been completed.",
            };

            Notification::create([
                'user_id' => $transaction->user_id,
                'type' => 'success',
                'title' => $title,
                'description' => $description,
                'data' => [
                    'transaction_id' => $transaction->id,
                    'reference' => $transaction->reference,
                    'amount' => $transaction->amount,
                    'category' => $transaction->category->value,
                ],
            ]);

            SendEmailJob::dispatch($transaction->user_id, 'transaction_receipt', [
                'amount' => $transaction->amount,
                'reference' => $transaction->reference,
                'description' => $title,
                'status' => 'completed',
            ])->onQueue('emails');

            $this->processReferralEarnings($transaction);

            Log::info('Transaction notification and email dispatched', [
                'transaction_id' => $transaction->id,
                'user_id' => $transaction->user_id,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to create transaction notification', [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function processReferralEarnings(Transaction $transaction): void
    {
        $user = $transaction->user;

        if (!$user) {
            return;
        }

        $existingEarning = ReferralEarning::where('user_id', $user->id)->first();
        if ($existingEarning) {
            return;
        }

        $referral = Referral::where('referred_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (!$referral) {
            return;
        }

        $bonusAmount = 500.00;

        $referral->update([
            'status' => 'completed',
            'reward_amount' => $bonusAmount,
            'rewarded_at' => now(),
        ]);

        ReferralEarning::create([
            'referral_id' => $referral->id,
            'user_id' => $referral->referrer_id,
            'amount' => $bonusAmount,
            'transaction_id' => $transaction->id,
        ]);

        $referrerWallet = $referral->referrer->wallet;
        if ($referrerWallet) {
            $referrerWallet->increment('bonus_balance', $bonusAmount);
            $referrerWallet->increment('available_balance', $bonusAmount);
        }

        SendEmailJob::dispatch($referral->referrer_id, 'referral_bonus', [
            'amount' => $bonusAmount,
        ])->onQueue('emails');

        Notification::create([
            'user_id' => $referral->referrer_id,
            'type' => 'success',
            'title' => 'Referral Bonus Earned!',
            'description' => "You've earned ₦" . number_format($bonusAmount, 2) . " for referring a friend.",
            'data' => [
                'referral_id' => $referral->id,
                'amount' => $bonusAmount,
            ],
        ]);

        Log::info('Referral earnings processed', [
            'referral_id' => $referral->id,
            'referrer_id' => $referral->referrer_id,
            'amount' => $bonusAmount,
        ]);
    }
}
