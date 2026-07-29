<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Email\EmailNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user()->load(['wallet', 'settings']);

        return $this->successResponse($user);
    }

    public function update(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:20', 'unique:users,phone,' . $user->id],
        ]);

        $user->update($validated);

        return $this->successResponse($user->fresh()->load('wallet'), 'Profile updated successfully.');
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return $this->successResponse($user->fresh(), 'Avatar updated successfully.');
    }

    public function changePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return $this->errorResponse('Current password is incorrect.', 422);
        }

        $user->update(['password' => $validated['new_password']]);

        app(EmailNotificationService::class)->sendPasswordChanged(
            $user,
            $request->ip(),
            $request->userAgent(),
        );

        return $this->successResponse(null, 'Password changed successfully.');
    }

    public function upgradeLevel(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'level' => ['required', 'integer', 'in:1,2,3'],
            'bvn' => ['required_if:level,2,3', 'string', 'max:11'],
        ]);

        if ($validated['level'] <= $user->level->value) {
            return $this->errorResponse('You cannot downgrade your account level.', 422);
        }

        $user->update(['level' => $validated['level']]);

        return $this->successResponse($user->fresh(), 'Account level upgraded successfully.');
    }
}
