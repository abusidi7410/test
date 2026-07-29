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

class VerifyEmailMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $verificationUrl,
        public string $expiresIn = '60 minutes',
    ) {
        $this->onQueue('emails');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Verify Your Email Address',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.verify-email',
            with: [
                'firstName' => $this->user->first_name,
                'verificationUrl' => $this->verificationUrl,
                'expiresIn' => $this->expiresIn,
            ],
        );
    }
}
