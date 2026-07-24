<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\AdminUser;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class ResolveTokenUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $accessToken = PersonalAccessToken::findToken($token);

        if (!$accessToken) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $model = $accessToken->tokenable;

        if (!$model) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($model instanceof User && in_array($model->status->value, ['suspended', 'banned'], true)) {
            return response()->json([
                'message' => 'Your account has been ' . $model->status->value . '. Please contact support.',
            ], 403);
        }

        $request->setUserResolver(fn () => $model);

        return $next($request);
    }
}
