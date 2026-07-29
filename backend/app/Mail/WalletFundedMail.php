<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WalletFundedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $amount,
        public string $reference,
        public string $balance,
        public ?string $paymentMethod = null,
        public ?string $date = null,
    ) {
        $this->onQueue('emails');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Wallet Funding Successful',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.wallet-funded',
            with: [
                'firstName' => $this->user->first_name,
                'amount' => $this->amount,
                'reference' => $this->reference,
                'balance' => $this->balance,
                'paymentMethod' => $this->paymentMethod,
                'date' => $this->date ?? now()->format('j F Y, g:i A'),
                'dashboardUrl' => config('frontend.url', 'https://techub.com') . '/dashboard',
            ],
        );
    }
}
