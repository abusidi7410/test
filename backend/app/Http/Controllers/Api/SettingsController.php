<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user()->load('settings');

        return $this->successResponse($user->settings);
    }

    public function update(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'email_notifications' => ['sometimes', 'boolean'],
            'push_notifications' => ['sometimes', 'boolean'],
            'sms_alerts' => ['sometimes', 'boolean'],
            'marketing_emails' => ['sometimes', 'boolean'],
            'theme' => ['sometimes', 'string', 'in:light,dark,system'],
            'language' => ['sometimes', 'string', 'in:en,ha,ig,yo,pcm'],
        ]);

        $settings = $user->settings()->updateOrCreate(
            ['user_id' => $user->id],
            $validated,
        );

        return $this->successResponse($settings->fresh(), 'Settings updated successfully.');
    }
}
