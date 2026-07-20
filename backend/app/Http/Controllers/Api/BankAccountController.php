<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BankAccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $accounts = $user->bankAccounts()->get();

        return $this->successResponse($accounts);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'bank_name' => ['required', 'string', 'max:100'],
            'bank_code' => ['required', 'string', 'max:10'],
            'account_number' => ['required', 'string', 'size:10', 'unique:bank_accounts,account_number'],
            'account_name' => ['required', 'string', 'max:255'],
        ]);

        $hasAccounts = $user->bankAccounts()->exists();

        $account = $user->bankAccounts()->create([
            ...$validated,
            'is_default' => !$hasAccounts,
        ]);

        return $this->successResponse($account, 'Bank account added successfully.', 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $account = $user->bankAccounts()->where('id', $id)->first();

        if (!$account) {
            return $this->errorResponse('Bank account not found.', 404);
        }

        $wasDefault = $account->is_default;
        $account->delete();

        if ($wasDefault) {
            $firstAccount = $user->bankAccounts()->first();
            if ($firstAccount) {
                $firstAccount->update(['is_default' => true]);
            }
        }

        return $this->successResponse(null, 'Bank account removed successfully.');
    }

    public function setDefault(Request $request, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $account = $user->bankAccounts()->where('id', $id)->first();

        if (!$account) {
            return $this->errorResponse('Bank account not found.', 404);
        }

        $user->bankAccounts()->update(['is_default' => false]);
        $account->update(['is_default' => true]);

        return $this->successResponse($account->fresh(), 'Default bank account updated successfully.');
    }
}
