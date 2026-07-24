<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportTicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

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

    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'category' => ['required', 'string', 'in:general,billing,technical,account,other'],
            'priority' => ['required', 'string', 'in:low,medium,high,urgent'],
        ]);

        $ticket = SupportTicket::create([
            'user_id' => $user->id,
            'subject' => $validated['subject'],
            'description' => $validated['description'],
            'category' => $validated['category'],
            'priority' => $validated['priority'],
            'status' => 'open',
        ]);

        return $this->successResponse([
            'ticket' => $ticket,
        ], 'Support ticket created successfully.', 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $ticket = SupportTicket::with(['assignedTo', 'replies'])
            ->where('user_id', $user->id)
            ->find($id);

        if (!$ticket) {
            return $this->errorResponse('Support ticket not found.', 404);
        }

        return $this->successResponse(['ticket' => $ticket]);
    }

    public function reply(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

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
