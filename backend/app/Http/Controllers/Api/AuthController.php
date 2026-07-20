<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Referral;
use App\Models\User;
use App\Models\UserSetting;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'phone' => ['nullable', 'string', 'max:20', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'referral_code' => ['nullable', 'string', 'exists:users,referral_code'],
        ]);

        $user = DB::transaction(function () use ($validated) {
            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'password' => $validated['password'],
                'referral_code' => strtoupper(Str::random(8)),
                'status' => 'active',
                'level' => 1,
            ]);

            Wallet::create([
                'user_id' => $user->id,
                'available_balance' => 0.00,
                'ledger_balance' => 0.00,
                'cashback_balance' => 0.00,
                'bonus_balance' => 0.00,
            ]);

            UserSetting::create([
                'user_id' => $user->id,
                'email_notifications' => true,
                'push_notifications' => true,
                'sms_alerts' => true,
                'marketing_emails' => false,
                'theme' => 'light',
                'language' => 'en',
            ]);

            if (!empty($validated['referral_code'])) {
                $referrer = User::where('referral_code', $validated['referral_code'])->first();
                if ($referrer) {
                    $user->update(['referred_by' => $referrer->id]);
                    Referral::create([
                        'referrer_id' => $referrer->id,
                        'referred_id' => $user->id,
                        'status' => 'pending',
                    ]);
                }
            }

            return $user;
        });

        $token = $user->createToken('auth-token')->plainTextToken;

        return $this->successResponse([
            'user' => $user->load('wallet'),
            'token' => $token,
        ], 'Registration successful.', 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!auth()->attempt($validated)) {
            return $this->errorResponse('Invalid credentials.', 401);
        }

        /** @var User $user */
        $user = auth()->user();

        if ($user->status !== 'active') {
            auth()->logout();
            return $this->errorResponse('Your account has been suspended.', 403);
        }

        $user->update(['last_login_at' => now()]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return $this->successResponse([
            'user' => $user->load('wallet'),
            'token' => $token,
        ], 'Login successful.');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse(null, 'Logged out successfully.');
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user()->load('wallet');

        return $this->successResponse($user);
    }
}
