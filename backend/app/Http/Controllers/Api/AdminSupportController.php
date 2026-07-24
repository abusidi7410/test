<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSupportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SupportTicket::with(['user', 'assignedTo', 'replies']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->input('assigned_to'));
        }

        $tickets = $query->latest()->paginate($request->input('per_page', 20));

        return $this->paginatedResponse($tickets);
    }

    public function show(string $id): JsonResponse
    {
        $ticket = SupportTicket::with(['user', 'assignedTo', 'replies'])->find($id);

        if (!$ticket) {
            return $this->errorResponse('Support ticket not found.', 404);
        }

        return $this->successResponse(['ticket' => $ticket]);
    }

    public function assign(string $id, Request $request): JsonResponse
    {
        $ticket = SupportTicket::find($id);

        if (!$ticket) {
            return $this->errorResponse('Support ticket not found.', 404);
        }

        $validated = $request->validate([
            'admin_id' => ['required', 'string', 'exists:admin_users,id'],
        ]);

        $admin = AdminUser::find($validated['admin_id']);

        if (!$admin) {
            return $this->errorResponse('Admin user not found.', 404);
        }

        $ticket->update([
            'assigned_to' => $validated['admin_id'],
            'status' => $ticket->status === 'open' ? 'in_progress' : $ticket->status,
        ]);

        return $this->successResponse([
            'ticket' => $ticket->fresh()->load(['user', 'assignedTo', 'replies']),
        ], 'Ticket assigned successfully.');
    }

    public function updateStatus(string $id, Request $request): JsonResponse
    {
        $ticket = SupportTicket::find($id);

        if (!$ticket) {
            return $this->errorResponse('Support ticket not found.', 404);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:open,in_progress,pending,resolved,closed'],
        ]);

        $ticket->update([
            'status' => $validated['status'],
            'resolved_at' => in_array($validated['status'], ['resolved', 'closed'])
                ? now()
                : $ticket->resolved_at,
        ]);

        return $this->successResponse([
            'ticket' => $ticket->fresh()->load(['user', 'assignedTo', 'replies']),
        ], 'Ticket status updated successfully.');
    }

    public function close(string $id): JsonResponse
    {
        $ticket = SupportTicket::find($id);

        if (!$ticket) {
            return $this->errorResponse('Support ticket not found.', 404);
        }

        $ticket->update([
            'status' => 'closed',
            'resolved_at' => now(),
        ]);

        return $this->successResponse([
            'ticket' => $ticket->fresh()->load(['user', 'assignedTo', 'replies']),
        ], 'Ticket closed successfully.');
    }

    public function reopen(string $id): JsonResponse
    {
        $ticket = SupportTicket::find($id);

        if (!$ticket) {
            return $this->errorResponse('Support ticket not found.', 404);
        }

        $ticket->update([
            'status' => 'open',
            'resolved_at' => null,
        ]);

        return $this->successResponse([
            'ticket' => $ticket->fresh()->load(['user', 'assignedTo', 'replies']),
        ], 'Ticket reopened successfully.');
    }

    public function reply(string $id, Request $request): JsonResponse
    {
        $ticket = SupportTicket::find($id);

        if (!$ticket) {
            return $this->errorResponse('Support ticket not found.', 404);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $admin = $request->user();

        $reply = SupportTicketReply::create([
            'support_ticket_id' => $ticket->id,
            'sender_type' => 'admin',
            'sender_id' => $admin->id,
            'message' => $validated['message'],
        ]);

        if ($ticket->status === 'open') {
            $ticket->update(['status' => 'in_progress']);
        }

        return $this->successResponse([
            'reply' => $reply,
        ], 'Reply added successfully.', 201);
    }

    public function userTickets(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return $this->errorResponse('Unauthorized.', 401);
        }

        $query = SupportTicket::with(['assignedTo', 'replies'])
            ->where('user_id', $user->id);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        $tickets = $query->latest()->paginate($request->input('per_page', 20));

        return $this->paginatedResponse($tickets);
    }

    public function userReply(string $id, Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return $this->errorResponse('Unauthorized.', 401);
        }

        $ticket = SupportTicket::find($id);

        if (!$ticket) {
            return $this->errorResponse('Support ticket not found.', 404);
        }

        if ($ticket->user_id !== $user->id) {
            return $this->errorResponse('You are not authorized to reply to this ticket.', 403);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $reply = SupportTicketReply::create([
            'support_ticket_id' => $ticket->id,
            'sender_type' => 'user',
            'sender_id' => $user->id,
            'message' => $validated['message'],
        ]);

        if ($ticket->status === 'closed') {
            $ticket->update([
                'status' => 'open',
                'resolved_at' => null,
            ]);
        }

        return $this->successResponse([
            'reply' => $reply,
        ], 'Reply added successfully.', 201);
    }
}
