<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EmailService
{
    private string $apiKey;
    private string $fromEmail;
    private string $fromName;

    public function __construct()
    {
        $this->apiKey = (string) config('services.resend.api_key', env('RESEND_API_KEY'));
        $this->fromEmail = (string) config('services.resend.from_email', env('MAIL_FROM_ADDRESS', 'noreply@techhub.io'));
        $this->fromName = (string) config('services.resend.from_name', env('MAIL_FROM_NAME', 'Techub'));
    }

    public function send(User $user, string $template, array $data = []): bool
    {
        $content = $this->renderTemplate($template, $user, $data);

        if (empty($this->apiKey)) {
            Log::info('EmailService: Resend API key not configured, skipping email', [
                'user_id' => $user->id,
                'template' => $template,
            ]);
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(30)->post('https://api.resend.com/emails', [
                'from' => $this->fromName . ' <' . $this->fromEmail . '>',
                'to' => [$user->email],
                'subject' => $content['subject'],
                'html' => $content['html'],
            ]);

            if ($response->successful()) {
                Log::info('Email sent successfully', [
                    'user_id' => $user->id,
                    'template' => $template,
                    'email_id' => $response->json('id'),
                ]);
                return true;
            }

            Log::error('Email sending failed', [
                'user_id' => $user->id,
                'template' => $template,
                'status' => $response->status(),
                'response' => $response->json(),
            ]);
            return false;
        } catch (\Exception $e) {
            Log::error('Email sending exception', [
                'user_id' => $user->id,
                'template' => $template,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    private function renderTemplate(string $template, User $user, array $data): array
    {
        return match ($template) {
            'welcome' => $this->welcomeEmail($user, $data),
            'password_reset' => $this->passwordResetEmail($user, $data),
            'transaction_receipt' => $this->transactionReceiptEmail($user, $data),
            'wallet_credit' => $this->walletCreditEmail($user, $data),
            'wallet_debit' => $this->walletDebitEmail($user, $data),
            'transfer_notification' => $this->transferNotificationEmail($user, $data),
            'referral_bonus' => $this->referralBonusEmail($user, $data),
            default => $this->genericEmail($user, $data),
        };
    }

    private function welcomeEmail(User $user, array $data): array
    {
        $name = $user->first_name;
        return [
            'subject' => 'Welcome to Techub!',
            'html' => "<h2>Welcome to Techub, {$name}!</h2>
            <p>Thank you for joining Techub, your all-in-one financial services platform.</p>
            <p>You can now fund your wallet, buy airtime, data, pay bills, and much more.</p>
            <p>If you have any questions, our support team is here to help.</p>
            <br><p>Best regards,<br>The Techub Team</p>",
        ];
    }

    private function passwordResetEmail(User $user, array $data): array
    {
        $resetUrl = $data['reset_url'] ?? '#';
        return [
            'subject' => 'Password Reset Request',
            'html' => "<h2>Password Reset</h2>
            <p>Hi {$user->first_name},</p>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <p><a href='{$resetUrl}'>Reset Password</a></p>
            <p>This link will expire in 60 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <br><p>Best regards,<br>The Techub Team</p>",
        ];
    }

    private function transactionReceiptEmail(User $user, array $data): array
    {
        $amount = number_format($data['amount'] ?? 0, 2);
        $reference = $data['reference'] ?? 'N/A';
        $description = $data['description'] ?? 'Transaction';
        $status = $data['status'] ?? 'completed';

        return [
            'subject' => "Transaction Receipt - {$description}",
            'html' => "<h2>Transaction Receipt</h2>
            <p>Hi {$user->first_name},</p>
            <p>Your transaction has been {$status}.</p>
            <table style='border-collapse:collapse;width:100%;max-width:400px'>
            <tr><td style='padding:8px;border-bottom:1px solid #eee'><strong>Amount:</strong></td><td style='padding:8px;border-bottom:1px solid #eee'>₦{$amount}</td></tr>
            <tr><td style='padding:8px;border-bottom:1px solid #eee'><strong>Reference:</strong></td><td style='padding:8px;border-bottom:1px solid #eee'>{$reference}</td></tr>
            <tr><td style='padding:8px;border-bottom:1px solid #eee'><strong>Description:</strong></td><td style='padding:8px;border-bottom:1px solid #eee'>{$description}</td></tr>
            <tr><td style='padding:8px;border-bottom:1px solid #eee'><strong>Status:</strong></td><td style='padding:8px;border-bottom:1px solid #eee'>{$status}</td></tr>
            </table>
            <br><p>Best regards,<br>The Techub Team</p>",
        ];
    }

    private function walletCreditEmail(User $user, array $data): array
    {
        $amount = number_format($data['amount'] ?? 0, 2);
        $balance = number_format($data['balance'] ?? 0, 2);

        return [
            'subject' => 'Wallet Credited',
            'html' => "<h2>Wallet Credit</h2>
            <p>Hi {$user->first_name},</p>
            <p>Your wallet has been credited with <strong>₦{$amount}</strong>.</p>
            <p>New balance: <strong>₦{$balance}</strong></p>
            <br><p>Best regards,<br>The Techub Team</p>",
        ];
    }

    private function walletDebitEmail(User $user, array $data): array
    {
        $amount = number_format($data['amount'] ?? 0, 2);
        $balance = number_format($data['balance'] ?? 0, 2);
        $description = $data['description'] ?? 'Transaction';

        return [
            'subject' => 'Wallet Debited',
            'html' => "<h2>Wallet Debit</h2>
            <p>Hi {$user->first_name},</p>
            <p>Your wallet has been debited with <strong>₦{$amount}</strong> for {$description}.</p>
            <p>New balance: <strong>₦{$balance}</strong></p>
            <br><p>Best regards,<br>The Techub Team</p>",
        ];
    }

    private function transferNotificationEmail(User $user, array $data): array
    {
        $amount = number_format($data['amount'] ?? 0, 2);
        $recipient = $data['recipient'] ?? 'N/A';

        return [
            'subject' => 'Transfer Completed',
            'html' => "<h2>Transfer Completed</h2>
            <p>Hi {$user->first_name},</p>
            <p>Your transfer of <strong>₦{$amount}</strong> to {$recipient} has been completed.</p>
            <br><p>Best regards,<br>The Techub Team</p>",
        ];
    }

    private function referralBonusEmail(User $user, array $data): array
    {
        $amount = number_format($data['amount'] ?? 0, 2);

        return [
            'subject' => 'Referral Bonus!',
            'html' => "<h2>Referral Bonus!</h2>
            <p>Hi {$user->first_name},</p>
            <p>Congratulations! You've earned a referral bonus of <strong>₦{$amount}</strong>.</p>
            <p>Keep inviting friends to earn more!</p>
            <br><p>Best regards,<br>The Techub Team</p>",
        ];
    }

    private function genericEmail(User $user, array $data): array
    {
        return [
            'subject' => $data['subject'] ?? 'Notification from Techub',
            'html' => $data['body'] ?? '<p>You have a new notification from Techub.</p>',
        ];
    }
}
