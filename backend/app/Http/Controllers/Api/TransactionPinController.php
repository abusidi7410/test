<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PinReset;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TransactionPinController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $rules = [
            'pin' => ['required', 'string', 'size:4', 'digits:4'],
            'pin_confirmation' => ['required', 'string', 'same:pin'],
        ];

        if ($user->hasTransactionPin()) {
            $rules['current_pin'] = ['required', 'string', 'size:4'];
        }

        $validated = $request->validate($rules);

        if ($user->hasTransactionPin() && !$user->verifyTransactionPin($validated['current_pin'])) {
            return $this->errorResponse('Current PIN is incorrect.', 422);
        }

        $user->update([
            'transaction_pin' => Hash::make($validated['pin']),
            'pin_set_at' => now(),
        ]);

        return $this->successResponse(null, $user->wasRecentlyCreated
            ? 'Transaction PIN set successfully.'
            : 'Transaction PIN changed successfully.'
        );
    }

    public function verify(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'pin' => ['required', 'string', 'size:4'],
        ]);

        if (!$user->hasTransactionPin()) {
            return $this->errorResponse('Transaction PIN not set. Please set a PIN first.', 422);
        }

        if (!$user->verifyTransactionPin($validated['pin'])) {
            return $this->errorResponse('Invalid transaction PIN.', 401);
        }

        return $this->successResponse(null, 'PIN verified successfully.');
    }

    public function requestReset(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (!$user->hasTransactionPin()) {
            return $this->errorResponse('No transaction PIN to reset. Please set a PIN first.', 422);
        }

        PinReset::where('user_id', $user->id)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->update(['used_at' => now()]);

        $otp = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        PinReset::create([
            'user_id' => $user->id,
            'otp' => Hash::make($otp),
            'expires_at' => now()->addMinutes(10),
        ]);

        \App\Jobs\SendEmailJob::dispatch($user->id, 'pin_reset_otp', [
            'otp' => $otp,
            'expires_in' => '10 minutes',
            'user_name' => $user->first_name,
        ]);

        return $this->successResponse(null, 'OTP sent to your email address.');
    }

    public function confirmReset(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'otp' => ['required', 'string', 'size:6'],
            'pin' => ['required', 'string', 'size:4', 'digits:4'],
            'pin_confirmation' => ['required', 'string', 'same:pin'],
        ]);

        $pinReset = PinReset::where('user_id', $user->id)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->orderByDesc('id')
            ->first();

        if (!$pinReset) {
            return $this->errorResponse('Invalid or expired OTP. Please request a new one.', 422);
        }

        if (!Hash::check($validated['otp'], $pinReset->otp)) {
            return $this->errorResponse('Invalid OTP. Please check and try again.', 422);
        }

        DB::transaction(function () use ($user, $validated, $pinReset) {
            $user->update([
                'transaction_pin' => Hash::make($validated['pin']),
                'pin_set_at' => now(),
            ]);

            $pinReset->update(['used_at' => now()]);
        });

        return $this->successResponse(null, 'Transaction PIN reset successfully.');
    }

    public function status(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return $this->successResponse([
            'has_pin' => $user->hasTransactionPin(),
            'pin_set_at' => $user->pin_set_at?->toISOString(),
        ]);
    }
}
