<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\BankAccount;
use App\Models\User;

class BankAccountPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, BankAccount $bankAccount): bool
    {
        return $user->id === $bankAccount->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, BankAccount $bankAccount): bool
    {
        return $user->id === $bankAccount->user_id;
    }

    public function delete(User $user, BankAccount $bankAccount): bool
    {
        return $user->id === $bankAccount->user_id;
    }
}
