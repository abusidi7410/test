<?php

declare(strict_types=1);

namespace App\Services\Email;

use App\Mail\PasswordChangedMail;
use App\Mail\ResetPasswordMail;
use App\Mail\VerifyEmailMail;
use App\Mail\WalletFundedMail;
use App\Mail\WelcomeMail;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class EmailNotificationService
{
    public function sendWelcome(User $user): void
    {
        try {
            Mail::send(new WelcomeMail($user));
        } catch (\Throwable $e) {
            Log::error('Failed to send welcome email', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function sendEmailVerification(User $user, string $verificationUrl, string $expiresIn = '60 minutes'): void
    {
        try {
            Mail::send(new VerifyEmailMail($user, $verificationUrl, $expiresIn));
        } catch (\Throwable $e) {
            Log::error('Failed to send verification email', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function sendPasswordReset(User $user, string $resetUrl, string $expiresIn = '60 minutes'): void
    {
        try {
            Mail::send(new ResetPasswordMail($user, $resetUrl, $expiresIn));
        } catch (\Throwable $e) {
            Log::error('Failed to send password reset email', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function sendPasswordChanged(User $user, ?string $ipAddress = null, ?string $device = null): void
    {
        try {
            Mail::send(new PasswordChangedMail($user, $ipAddress, $device));
        } catch (\Throwable $e) {
            Log::error('Failed to send password changed email', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function sendWalletFunded(
        User $user,
        string $amount,
        string $reference,
        string $balance,
        ?string $paymentMethod = null,
        ?string $date = null,
    ): void {
        try {
            Mail::send(new WalletFundedMail(
                $user,
                $amount,
                $reference,
                $balance,
                $paymentMethod,
                $date,
            ));
        } catch (\Throwable $e) {
            Log::error('Failed to send wallet funded email', [
                'user_id' => $user->id,
                'reference' => $reference,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
