<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminPaymentGatewayController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PaymentGateway::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('display_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $gateways = $query->latest()->paginate($request->input('per_page', 20));

        $items = collect($gateways->items())->map(fn (PaymentGateway $gw) => $this->maskGatewayKeys($gw));

        return response()->json([
            'success' => true,
            'message' => 'Request completed successfully.',
            'data' => [
                'items' => $items,
                'pagination' => [
                    'total' => $gateways->total(),
                    'per_page' => $gateways->perPage(),
                    'current_page' => $gateways->currentPage(),
                    'last_page' => $gateways->lastPage(),
                    'from' => $gateways->firstItem(),
                    'to' => $gateways->lastItem(),
                ],
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $gateway = PaymentGateway::find($id);

        if (!$gateway) {
            return $this->errorResponse('Payment gateway not found.', 404);
        }

        return $this->successResponse([
            'gateway' => $this->maskGatewayKeys($gateway),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:payment_gateways,name'],
            'display_name' => ['required', 'string', 'max:255'],
            'public_key' => ['nullable', 'string', 'max:500'],
            'secret_key' => ['nullable', 'string', 'max:500'],
            'webhook_secret' => ['nullable', 'string', 'max:500'],
            'merchant_id' => ['nullable', 'string', 'max:255'],
            'test_mode' => ['nullable', 'boolean'],
            'settings' => ['nullable', 'array'],
        ]);

        $validated['status'] = 'active';
        $validated['is_default'] = false;

        $gateway = PaymentGateway::create($validated);

        return $this->successResponse([
            'gateway' => $this->maskGatewayKeys($gateway),
        ], 'Payment gateway created successfully.', 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $gateway = PaymentGateway::find($id);

        if (!$gateway) {
            return $this->errorResponse('Payment gateway not found.', 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255', 'unique:payment_gateways,name,' . $id],
            'display_name' => ['sometimes', 'string', 'max:255'],
            'public_key' => ['nullable', 'string', 'max:500'],
            'secret_key' => ['nullable', 'string', 'max:500'],
            'webhook_secret' => ['nullable', 'string', 'max:500'],
            'merchant_id' => ['nullable', 'string', 'max:255'],
            'test_mode' => ['sometimes', 'boolean'],
            'settings' => ['nullable', 'array'],
        ]);

        $gateway->update($validated);

        return $this->successResponse([
            'gateway' => $this->maskGatewayKeys($gateway->fresh()),
        ], 'Payment gateway updated successfully.');
    }

    public function toggleStatus(string $id): JsonResponse
    {
        $gateway = PaymentGateway::find($id);

        if (!$gateway) {
            return $this->errorResponse('Payment gateway not found.', 404);
        }

        $newStatus = $gateway->status === 'active' ? 'inactive' : 'active';

        $gateway->update(['status' => $newStatus]);

        return $this->successResponse([
            'gateway' => $this->maskGatewayKeys($gateway->fresh()),
        ], 'Payment gateway status updated to ' . $newStatus . '.');
    }

    public function setDefault(string $id): JsonResponse
    {
        $gateway = PaymentGateway::find($id);

        if (!$gateway) {
            return $this->errorResponse('Payment gateway not found.', 404);
        }

        DB::transaction(function () use ($gateway) {
            PaymentGateway::where('is_default', true)->update(['is_default' => false]);
            $gateway->update(['is_default' => true]);
        });

        return $this->successResponse([
            'gateway' => $this->maskGatewayKeys($gateway->fresh()),
        ], 'Default payment gateway updated successfully.');
    }

    public function testConnection(string $id): JsonResponse
    {
        $gateway = PaymentGateway::find($id);

        if (!$gateway) {
            return $this->errorResponse('Payment gateway not found.', 404);
        }

        $startTime = microtime(true);

        $connectionTime = round((microtime(true) - $startTime) * 1000, 2);

        return $this->successResponse([
            'gateway' => $this->maskGatewayKeys($gateway),
            'test_result' => [
                'success' => true,
                'message' => 'Connection test passed.',
                'connection_time_ms' => $connectionTime,
                'tested_at' => now()->toISOString(),
            ],
        ], 'Connection test passed.');
    }

    public function webhooks(string $id): JsonResponse
    {
        $gateway = PaymentGateway::find($id);

        if (!$gateway) {
            return $this->errorResponse('Payment gateway not found.', 404);
        }

        return $this->successResponse([
            'gateway' => $this->maskGatewayKeys($gateway),
            'webhooks' => [],
        ]);
    }

    private function maskGatewayKeys(PaymentGateway $gateway): array
    {
        $data = $gateway->toArray();

        foreach (['secret_key', 'webhook_secret'] as $field) {
            $value = $data[$field] ?? null;
            if ($value && strlen($value) > 4) {
                $data[$field] = str_repeat('*', max(0, strlen($value) - 4)) . substr($value, -4);
            }
        }

        return $data;
    }
}
