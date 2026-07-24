<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminBroadcast;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AdminBroadcast::with('sender');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        $broadcasts = $query->latest()->paginate($request->input('per_page', 20));

        return $this->paginatedResponse($broadcasts);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
            'type' => ['required', 'string', 'in:email,sms,push,in_app,broadcast'],
            'target' => ['required', 'string', 'in:all,specific_users,specific_roles'],
            'target_users' => ['required_if:target,specific_users', 'array'],
            'target_users.*' => ['string', 'exists:users,id'],
            'target_roles' => ['required_if:target,specific_roles', 'array'],
            'target_roles.*' => ['string'],
        ]);

        $admin = $request->user();
        $recipientsCount = 0;

        DB::transaction(function () use ($validated, $admin, &$recipientsCount) {
            $targetUserIds = match ($validated['target']) {
                'all' => User::pluck('id')->toArray(),
                'specific_users' => $validated['target_users'] ?? [],
                'specific_roles' => [],
                default => [],
            };

            if ($validated['target'] === 'all') {
                $targetUserIds = User::pluck('id')->toArray();
            }

            $recipientsCount = count($targetUserIds);

            $broadcast = AdminBroadcast::create([
                'sent_by' => $admin->id,
                'title' => $validated['title'],
                'message' => $validated['message'],
                'type' => $validated['type'],
                'target' => $validated['target'],
                'target_users' => $validated['target_users'] ?? null,
                'target_roles' => $validated['target_roles'] ?? null,
                'recipients_count' => $recipientsCount,
                'status' => 'sent',
                'sent_at' => now(),
            ]);

            if ($validated['type'] === 'in_app' || $validated['type'] === 'broadcast') {
                foreach ($targetUserIds as $userId) {
                    Notification::create([
                        'user_id' => $userId,
                        'type' => 'primary',
                        'title' => $validated['title'],
                        'description' => $validated['message'],
                        'data' => [
                            'broadcast_id' => $broadcast->id,
                            'sender' => $admin->first_name . ' ' . $admin->last_name,
                        ],
                    ]);
                }
            }

            return $broadcast;
        });

        $broadcast = AdminBroadcast::with('sender')
            ->where('status', 'sent')
            ->latest()
            ->first();

        return $this->successResponse([
            'broadcast' => $broadcast,
            'recipients_count' => $recipientsCount,
        ], 'Broadcast sent successfully.', 201);
    }

    public function show(string $id): JsonResponse
    {
        $broadcast = AdminBroadcast::with('sender')->find($id);

        if (!$broadcast) {
            return $this->errorResponse('Broadcast not found.', 404);
        }

        return $this->successResponse(['broadcast' => $broadcast]);
    }

    public function destroy(string $id): JsonResponse
    {
        $broadcast = AdminBroadcast::find($id);

        if (!$broadcast) {
            return $this->errorResponse('Broadcast not found.', 404);
        }

        if ($broadcast->status === 'sent') {
            return $this->errorResponse('Cannot delete a broadcast that has already been sent.', 400);
        }

        $broadcast->delete();

        return $this->successResponse(null, 'Broadcast deleted successfully.');
    }
}
