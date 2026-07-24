<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Providers\ProviderRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VariationController extends Controller
{
    public function getVariations(Request $request, string $serviceId): JsonResponse
    {
        try {
            $registry = app(ProviderRegistry::class);
            $adapter = $registry->getForService($serviceId);

            if (!$adapter) {
                return $this->errorResponse('No active provider available for this service.', 404);
            }

            $variations = $adapter->getServiceVariations($serviceId);

            if (empty($variations['content']['variations'])) {
                return $this->errorResponse('No variations found for this service.', 404);
            }

            $mapped = collect($variations['content']['variations'])->map(function ($variation) {
                return [
                    'name' => $variation['name'] ?? '',
                    'variation_code' => $variation['variation_code'] ?? '',
                    'amount' => (float) ($variation['variation_amount'] ?? 0),
                    'fixed_price' => (bool) ($variation['fixedPrice'] ?? false),
                ];
            });

            return $this->successResponse([
                'service_id' => $serviceId,
                'variations' => $mapped->toArray(),
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to fetch variations: ' . $e->getMessage(), 500);
        }
    }
}
