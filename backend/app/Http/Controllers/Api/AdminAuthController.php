<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\AdminRoleEnum;
use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        /** @var AdminUser|null $admin */
        $admin = AdminUser::where('email', $validated['email'])->first();

        if (!$admin || !password_verify($validated['password'], $admin->password)) {
            return $this->errorResponse('Invalid credentials.', 401);
        }

        if ($admin->status !== 'active') {
            return $this->errorResponse('Your admin account has been suspended.', 403);
        }

        $admin->update(['last_login_at' => now()]);

        $token = $admin->createToken('admin-token')->plainTextToken;

        return $this->successResponse([
            'user' => $admin,
            'token' => $token,
        ], 'Admin login successful.');
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
        /** @var AdminUser $admin */
        $admin = $request->user();

        return $this->successResponse(['user' => $admin]);
    }
}
