<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\Referral;
use App\Models\User;
use App\Models\UserSetting;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
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
            $username = strtolower($validated['first_name'] . $validated['last_name'] . Str::random(4));

            $user = User::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'username' => $username,
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
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
            'has_pin' => $user->hasTransactionPin(),
        ], 'Registration successful.', 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if ($user) {
            if (!password_verify($validated['password'], $user->password)) {
                return $this->errorResponse('Invalid credentials.', 401);
            }

            if ($user->status !== UserStatus::ACTIVE) {
                return $this->errorResponse('Your account has been suspended.', 403);
            }

            $user->update(['last_login_at' => now()]);

            $token = $user->createToken('auth-token')->plainTextToken;

            return $this->successResponse([
                'user' => $user->load('wallet'),
                'token' => $token,
                'has_pin' => $user->hasTransactionPin(),
            ], 'Login successful.');
        }

        $admin = \App\Models\AdminUser::where('email', $validated['email'])->first();

        if ($admin && password_verify($validated['password'], $admin->password)) {
            if ($admin->status !== 'active') {
                return $this->errorResponse('Your admin account has been suspended.', 403);
            }

            $admin->update(['last_login_at' => now()]);

            $token = $admin->createToken('admin-token')->plainTextToken;

            return $this->successResponse([
                'user' => $admin,
                'token' => $token,
                'is_admin' => true,
            ], 'Login successful.');
        }

        return $this->errorResponse('Invalid credentials.', 401);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->bearerToken();
        if ($token) {
            $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
            if ($accessToken) {
                $accessToken->delete();
            }
        }

        return $this->successResponse(null, 'Logged out successfully.');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user instanceof \App\Models\AdminUser) {
            return $this->successResponse(['user' => $user, 'is_admin' => true]);
        }

        $user = $user->load('wallet');

        return $this->successResponse([
            'user' => $user,
            'has_pin' => $user->hasTransactionPin(),
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return $this->successResponse(null, 'If an account with that email exists, a reset link has been sent.');
        }

        $status = Password::sendResetLink(
            ['email' => $validated['email']]
        );

        if ($status !== Password::RESET_LINK_SENT) {
            return $this->errorResponse('Failed to send reset link. Please try again.', 500);
        }

        return $this->successResponse(null, 'If an account with that email exists, a reset link has been sent.');
    }
}
