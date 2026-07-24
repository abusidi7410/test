<?php

declare(strict_types=1);

namespace App\Providers;

use App\Events\TransactionCompleted;
use App\Listeners\SendTransactionNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     */
    protected $listen = [
        TransactionCompleted::class => [
            SendTransactionNotification::class,
        ],
    ];
}
