<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\ProviderEnvironment;
use App\Enums\ProviderStatus;
use App\Enums\SupportedService;
use App\Http\Controllers\Controller;
use App\Models\VtuProvider;
use App\Services\Providers\ProviderRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminVtuProviderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = VtuProvider::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('environment')) {
            $query->where('environment', $request->input('environment'));
        }

        $providers = $query->orderBy('priority', 'desc')
            ->orderBy('id', 'asc')
            ->paginate($request->input('per_page', 20));

        return $this->paginatedResponse($providers);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:100', 'unique:vtu_providers,slug'],
            'logo' => ['nullable', 'string', 'max:500'],
            'base_url' => ['required', 'url', 'max:500'],
            'api_key' => ['nullable', 'string', 'max:500'],
            'public_key' => ['nullable', 'string', 'max:500'],
            'secret_key' => ['nullable', 'string', 'max:500'],
            'username' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'max:255'],
            'authorization_token' => ['nullable', 'string', 'max:500'],
            'webhook_secret' => ['nullable', 'string', 'max:500'],
            'environment' => ['required', 'string', 'in:sandbox,production'],
            'status' => ['required', 'string', 'in:active,inactive'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:100'],
            'is_default' => ['nullable', 'boolean'],
            'supported_services' => ['required', 'array', 'min:1'],
            'supported_services.*' => ['string', 'in:' . implode(',', SupportedService::values())],
        ]);

        $validated['slug'] = Str::slug($validated['slug']);
        $validated['priority'] = $validated['priority'] ?? 0;
        $validated['is_default'] = $validated['is_default'] ?? false;

        if ($validated['is_default']) {
            VtuProvider::where('is_default', true)->update(['is_default' => false]);
        }

        $provider = VtuProvider::create($validated);

        app(ProviderRegistry::class)->invalidateCache();

        return $this->successResponse([
            'provider' => $provider,
        ], 'Provider created successfully.', 201);
    }

    public function show(string $id): JsonResponse
    {
        $provider = VtuProvider::find($id);

        if (!$provider) {
            return $this->errorResponse('Provider not found.', 404);
        }

        return $this->successResponse(['provider' => $provider]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $provider = VtuProvider::find($id);

        if (!$provider) {
            return $this->errorResponse('Provider not found.', 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:100', 'unique:vtu_providers,slug,' . $id],
            'logo' => ['nullable', 'string', 'max:500'],
            'base_url' => ['sometimes', 'url', 'max:500'],
            'api_key' => ['nullable', 'string', 'max:500'],
            'public_key' => ['nullable', 'string', 'max:500'],
            'secret_key' => ['nullable', 'string', 'max:500'],
            'username' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'max:255'],
            'authorization_token' => ['nullable', 'string', 'max:500'],
            'webhook_secret' => ['nullable', 'string', 'max:500'],
            'environment' => ['sometimes', 'string', 'in:sandbox,production'],
            'status' => ['sometimes', 'string', 'in:active,inactive'],
            'priority' => ['nullable', 'integer', 'min:0', 'max:100'],
            'is_default' => ['nullable', 'boolean'],
            'supported_services' => ['sometimes', 'array', 'min:1'],
            'supported_services.*' => ['string', 'in:' . implode(',', SupportedService::values())],
        ]);

        if (isset($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['slug']);
        }

        if (isset($validated['is_default']) && $validated['is_default']) {
            VtuProvider::where('is_default', true)
                ->where('id', '!=', $id)
                ->update(['is_default' => false]);
        }

        $provider->update($validated);

        app(ProviderRegistry::class)->invalidateCache();

        return $this->successResponse([
            'provider' => $provider->fresh(),
        ], 'Provider updated successfully.');
    }

    public function destroy(string $id): JsonResponse
    {
        $provider = VtuProvider::find($id);

        if (!$provider) {
            return $this->errorResponse('Provider not found.', 404);
        }

        $provider->delete();

        app(ProviderRegistry::class)->invalidateCache();

        return $this->successResponse(null, 'Provider deleted successfully.');
    }

    public function toggleStatus(string $id): JsonResponse
    {
        $provider = VtuProvider::find($id);

        if (!$provider) {
            return $this->errorResponse('Provider not found.', 404);
        }

        $newStatus = $provider->status === ProviderStatus::ACTIVE
            ? ProviderStatus::INACTIVE
            : ProviderStatus::ACTIVE;

        $provider->update(['status' => $newStatus]);

        app(ProviderRegistry::class)->invalidateCache();

        return $this->successResponse([
            'provider' => $provider->fresh(),
        ], 'Provider status updated to ' . $newStatus->label() . '.');
    }

    public function setDefault(string $id): JsonResponse
    {
        $provider = VtuProvider::find($id);

        if (!$provider) {
            return $this->errorResponse('Provider not found.', 404);
        }

        DB::transaction(function () use ($provider) {
            VtuProvider::where('is_default', true)->update(['is_default' => false]);
            $provider->update(['is_default' => true]);
        });

        app(ProviderRegistry::class)->invalidateCache();

        return $this->successResponse([
            'provider' => $provider->fresh(),
        ], 'Default provider updated successfully.');
    }

    public function updatePriority(Request $request, string $id): JsonResponse
    {
        $provider = VtuProvider::find($id);

        if (!$provider) {
            return $this->errorResponse('Provider not found.', 404);
        }

        $validated = $request->validate([
            'priority' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        $provider->update(['priority' => $validated['priority']]);

        app(ProviderRegistry::class)->invalidateCache();

        return $this->successResponse([
            'provider' => $provider->fresh(),
        ], 'Provider priority updated successfully.');
    }

    public function testConnection(string $id): JsonResponse
    {
        $provider = VtuProvider::find($id);

        if (!$provider) {
            return $this->errorResponse('Provider not found.', 404);
        }

        $adapterClass = ProviderRegistry::getAdapterClass($provider->slug);
        $adapter = new $adapterClass($provider);
        $result = $adapter->testConnection();

        $provider->update([
            'last_health_check_at' => now(),
            'health_check_response' => $result,
        ]);

        return $this->successResponse([
            'provider' => $provider->fresh(),
            'test_result' => $result,
        ], $result['success'] ? 'Connection test passed.' : 'Connection test failed.');
    }

    public function healthCheck(string $id): JsonResponse
    {
        $provider = VtuProvider::find($id);

        if (!$provider) {
            return $this->errorResponse('Provider not found.', 404);
        }

        $adapterClass = ProviderRegistry::getAdapterClass($provider->slug);
        $adapter = new $adapterClass($provider);
        $result = $adapter->testConnection();

        $provider->update([
            'last_health_check_at' => now(),
            'health_check_response' => $result,
        ]);

        return $this->successResponse([
            'provider' => $provider->fresh(),
            'health' => [
                'status' => $result['success'] ? 'healthy' : 'unhealthy',
                'last_check' => now()->toISOString(),
                'response_time_ms' => $result['response_time_ms'] ?? 0,
                'message' => $result['message'],
                'total_requests' => $provider->total_requests,
                'successful_requests' => $provider->successful_requests,
                'failed_requests' => $provider->failed_requests,
                'success_rate' => $provider->getSuccessRate(),
            ],
        ]);
    }

    public function statistics(string $id): JsonResponse
    {
        $provider = VtuProvider::find($id);

        if (!$provider) {
            return $this->errorResponse('Provider not found.', 404);
        }

        return $this->successResponse([
            'provider' => [
                'id' => $provider->id,
                'name' => $provider->name,
                'slug' => $provider->slug,
                'status' => $provider->status->value,
                'is_default' => $provider->is_default,
                'environment' => $provider->environment->value,
            ],
            'statistics' => [
                'total_requests' => $provider->total_requests,
                'successful_requests' => $provider->successful_requests,
                'failed_requests' => $provider->failed_requests,
                'pending_requests' => $provider->pending_requests,
                'success_rate' => $provider->getSuccessRate(),
                'avg_response_time_ms' => $provider->avg_response_time_ms,
                'last_used_at' => $provider->last_used_at?->toISOString(),
                'last_health_check_at' => $provider->last_health_check_at?->toISOString(),
                'last_error' => $provider->last_error,
            ],
            'services' => $provider->supported_services ?? [],
        ]);
    }

    public function globalStatistics(): JsonResponse
    {
        $stats = [
            'total_providers' => VtuProvider::count(),
            'active_providers' => VtuProvider::active()->count(),
            'inactive_providers' => VtuProvider::where('status', ProviderStatus::INACTIVE)->count(),
            'default_provider' => VtuProvider::default()->first(['id', 'name', 'slug']),
            'providers' => VtuProvider::select([
                'id', 'name', 'slug', 'status', 'is_default', 'environment',
                'priority', 'total_requests', 'successful_requests', 'failed_requests',
                'avg_response_time_ms', 'last_health_check_at', 'last_error',
            ])->orderBy('priority', 'desc')->get()->map(fn ($p) => [
                ...$p->toArray(),
                'success_rate' => $p->getSuccessRate(),
                'status_label' => $p->status->label(),
                'environment_label' => $p->environment->label(),
            ]),
        ];

        return $this->successResponse($stats);
    }

    public function all(): JsonResponse
    {
        $providers = VtuProvider::orderBy('priority', 'desc')
            ->orderBy('id', 'asc')
            ->get(['id', 'name', 'slug', 'logo', 'status', 'is_default', 'environment', 'priority', 'supported_services']);

        return $this->successResponse(['providers' => $providers]);
    }
}
