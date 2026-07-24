<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\User;
use App\Services\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        public readonly int $userId,
        public readonly string $template,
        public readonly array $data = [],
    ) {
        $this->onQueue('emails');
    }

    public function handle(EmailService $emailService): void
    {
        $user = User::find($this->userId);

        if (!$user) {
            Log::warning('SendEmailJob: user not found', ['user_id' => $this->userId]);
            return;
        }

        $emailService->send($user, $this->template, $this->data);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('SendEmailJob failed', [
            'user_id' => $this->userId,
            'template' => $this->template,
            'error' => $exception->getMessage(),
        ]);
    }
}
