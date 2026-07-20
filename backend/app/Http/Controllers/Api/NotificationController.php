<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $notifications = $user->notifications()
            ->latest()
            ->paginate($request->input('per_page', 20));

        return $this->paginatedResponse($notifications);
    }

    public function markAsRead(Request $request, int $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $notification = $user->notifications()->where('id', $id)->first();

        if (!$notification) {
            return $this->errorResponse('Notification not found.', 404);
        }

        if (is_null($notification->read_at)) {
            $notification->update(['read_at' => now()]);
        }

        return $this->successResponse($notification->fresh(), 'Notification marked as read.');
    }

    public function markAllRead(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->notifications()
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return $this->successResponse(null, 'All notifications marked as read.');
    }

    public function unreadCount(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $count = $user->notifications()->whereNull('read_at')->count();

        return $this->successResponse(['count' => $count]);
    }
}
