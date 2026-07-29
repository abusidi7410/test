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

class PasswordChangedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public ?string $ipAddress = null,
        public ?string $device = null,
    ) {
        $this->onQueue('emails');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Password Was Changed',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.password-changed',
            with: [
                'firstName' => $this->user->first_name,
                'changedAt' => now()->format('j F Y, g:i A'),
                'ipAddress' => $this->ipAddress,
                'device' => $this->device,
            ],
        );
    }
}
