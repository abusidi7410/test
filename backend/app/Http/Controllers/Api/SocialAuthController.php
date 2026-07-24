<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\User;
use App\Models\UserSetting;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Contracts\User as SocialiteUser;

class SocialAuthController extends Controller
{
    protected array $providers = [
        'google',
        'facebook',
        'apple',
        'microsoft',
        'twitter',
        'tiktok',
    ];

    public function redirect(string $provider): RedirectResponse
    {
        if (!in_array($provider, $this->providers)) {
            return redirect()->away(
                env('FRONTEND_URL', 'http://localhost:5173') . '/login?error=unsupported_provider'
            );
        }

        $configKey = $provider === 'twitter' ? 'twitter' : $provider;

        if (config("services.{$configKey}.client_id") === null || config("services.{$configKey}.client_id") === '') {
            return redirect()->away(
                env('FRONTEND_URL', 'http://localhost:5173') . '/login?error=provider_not_configured'
            );
        }

        $redirectUrl = config("services.{$configKey}.redirect");

        if (empty($redirectUrl)) {
            return redirect()->away(
                env('FRONTEND_URL', 'http://localhost:5173') . '/login?error=' . urlencode('Redirect URL not configured for ' . ucfirst($provider))
            );
        }

        try {
            return Socialite::driver($provider)
                ->stateless()
                ->redirect();
        } catch (\Exception $e) {
            return redirect()->away(
                env('FRONTEND_URL', 'http://localhost:5173') . '/login?error=' . urlencode('Failed to connect with ' . ucfirst($provider) . ': ' . $e->getMessage())
            );
        }
    }

    public function debugRedirectUri(string $provider): JsonResponse
    {
        $configKey = $provider === 'twitter' ? 'twitter' : $provider;

        return response()->json([
            'provider' => $provider,
            'config_key_used' => $configKey,
            'env_goOGLE_REDIRECT_URL' => env('GOOGLE_REDIRECT_URL'),
            'config_redirect' => config("services.{$configKey}.redirect"),
            'config_client_id' => config("services.{$configKey}.client_id") ? 'SET (hidden)' : 'NOT SET',
            'app_url' => env('APP_URL'),
            'frontend_url' => env('FRONTEND_URL'),
        ]);
    }

    public function callback(string $provider): RedirectResponse
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        if (!in_array($provider, $this->providers)) {
            return redirect()->away($frontendUrl . '/login?error=unsupported_provider');
        }

        if (config("services.{$provider}.client_id") === null || config("services.{$provider}.client_id") === '') {
            return redirect()->away($frontendUrl . '/login?error=provider_not_configured');
        }

        try {
            $socialUser = Socialite::driver($provider)
                ->stateless()
                ->user();
        } catch (\Exception $e) {
            Log::error("Social auth callback failed for {$provider}: " . $e->getMessage(), [
                'exception' => $e,
                'provider' => $provider,
            ]);
            return redirect()->away($frontendUrl . '/login?error=' . urlencode('Could not authenticate with ' . ucfirst($provider)));
        }

        if (empty($socialUser->getId())) {
            return redirect()->away($frontendUrl . '/login?error=' . urlencode('Could not retrieve provider ID'));
        }

        $user = $this->findOrCreateUserFromSocial($socialUser, $provider);

        $token = $user->createToken('auth-token')->plainTextToken;

        return redirect()->away(
            $frontendUrl . '/auth/callback?token=' . urlencode($token) . '&provider=' . $provider
        );
    }

    public function callbackToken(Request $request, string $provider): JsonResponse
    {
        if (!in_array($provider, $this->providers)) {
            return $this->errorResponse('Unsupported social provider.', 422);
        }

        if (config("services.{$provider}.client_id") === null || config("services.{$provider}.client_id") === '') {
            return $this->errorResponse('Social login is not configured for ' . ucfirst($provider) . '.', 501);
        }

        try {
            $socialUser = Socialite::driver($provider)
                ->stateless()
                ->user();
        } catch (\Exception $e) {
            return $this->errorResponse('Could not authenticate with ' . ucfirst($provider) . '. Please try again.', 401);
        }

        if (empty($socialUser->getId())) {
            return $this->errorResponse('Could not retrieve provider ID.', 401);
        }

        $user = $this->findOrCreateUserFromSocial($socialUser, $provider);

        $token = $user->createToken('auth-token')->plainTextToken;

        return $this->successResponse([
            'user' => $user->load('wallet'),
            'token' => $token,
        ], 'Social login successful.');
    }

    private function findOrCreateUserFromSocial(
        SocialiteUser $socialUser,
        string $provider,
    ): User {
        $providerId = $socialUser->getId();
        $email = $socialUser->getEmail();
        $name = $socialUser->getName();

        return DB::transaction(function () use ($provider, $providerId, $email, $name) {
            $existingAccount = SocialAccount::where('provider', $provider)
                ->where('provider_id', $providerId)
                ->first();

            if ($existingAccount) {
                $existingAccount->update(['provider_token' => null]);

                return $existingAccount->user;
            }

            $user = $email
                ? User::where('email', $email)->first()
                : null;

            if (!$user) {
                $firstName = $name && str_contains($name, ' ')
                    ? explode(' ', $name)[0]
                    : ucfirst($provider) . 'User';

                $lastName = $name && str_contains($name, ' ')
                    ? explode(' ', $name, 2)[1]
                    : Str::random(4);

                $user = User::create([
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'username' => strtolower($firstName . $lastName . Str::random(4)),
                    'email' => $email ?: $provider . '_' . $providerId . '@social.local',
                    'password' => Str::random(80),
                    'referral_code' => strtoupper(Str::random(8)),
                    'status' => 'active',
                    'level' => 1,
                    'email_verified_at' => now(),
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
            }

            SocialAccount::create([
                'user_id' => $user->id,
                'provider' => $provider,
                'provider_id' => $providerId,
                'provider_token' => null,
            ]);

            return $user;
        });
    }
}
