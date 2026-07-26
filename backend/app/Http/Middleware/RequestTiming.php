<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class RequestTiming
{
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);

        $response = $next($request);

        $duration = round((microtime(true) - $start) * 1000, 2);

        // Log slow requests (> 500ms)
        if ($duration > 500) {
            Log::warning('Slow request detected', [
                'method' => $request->method(),
                'path' => $request->path(),
                'duration_ms' => $duration,
                'status' => $response->getStatusCode(),
                'user_id' => $request->user()?->id,
            ]);
        }

        // Add timing header for debugging
        $response->headers->set('X-Request-Duration', $duration . 'ms');

        return $response;
    }
}
