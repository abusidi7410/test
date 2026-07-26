<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\SupportTicket;
use App\Models\User;

class SupportTicketPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, SupportTicket $supportTicket): bool
    {
        return $user->id === $supportTicket->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, SupportTicket $supportTicket): bool
    {
        return $user->id === $supportTicket->user_id;
    }

    public function delete(User $user, SupportTicket $supportTicket): bool
    {
        return $user->id === $supportTicket->user_id;
    }
}
