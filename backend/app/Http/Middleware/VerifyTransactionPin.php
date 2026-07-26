<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyTransactionPin
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        if (!$user || !($user instanceof User)) {
            return $next($request);
        }

        if (!$user->hasTransactionPin()) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction PIN not set. Please set a PIN before making transactions.',
                'pin_required' => true,
                'pin_set_url' => '/api/profile/pin',
            ], 403);
        }

        $pin = $request->header('X-Transaction-Pin');

        if (!$pin) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction PIN is required.',
                'pin_required' => true,
            ], 401);
        }

        if (!$user->verifyTransactionPin($pin)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid transaction PIN.',
            ], 401);
        }

        $request->attributes->set('pin_verified', true);

        return $next($request);
    }
}
