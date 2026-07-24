<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BillPayment;
use App\Models\Notification;
use App\Models\Transaction;
use App\Services\Providers\ProviderRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function handleVtpassCallback(Request $request): JsonResponse
    {
        Log::info('VTpass webhook received', $request->all());

        $requestId = $request->input('request_id');

        if (!$requestId) {
            return response()->json(['response' => 'success']);
        }

        $billPayment = BillPayment::where('vtpass_request_id', $requestId)
            ->with('transaction')
            ->first();

        if (!$billPayment) {
            Log::warning('VTpass webhook: bill payment not found', ['request_id' => $requestId]);

            return response()->json(['response' => 'success']);
        }

        /** @var Transaction $transaction */
        $transaction = $billPayment->transaction;

        if ($transaction->status !== 'pending') {
            Log::info('VTpass webhook: transaction already processed', [
                'request_id' => $requestId,
                'status' => $transaction->status,
            ]);

            return response()->json(['response' => 'success']);
        }

        $registry = app(ProviderRegistry::class);
        $adapter = $registry->getForService($transaction->category);

        $response = $request->all();

        if ($adapter->isResponseSuccessful($response)) {
            $transaction->update([
                'status' => 'successful',
                'provider_reference' => $request->input('transactionId'),
            ]);

            $billPayment->update([
                'vtpass_response' => $response,
            ]);

            Notification::create([
                'user_id' => $transaction->user_id,
                'type' => 'transaction',
                'title' => 'Bill Payment Successful',
                'description' => $transaction->description . ' completed successfully.',
                'data' => [
                    'transaction_id' => $transaction->id,
                    'reference' => $transaction->reference,
                    'amount' => $transaction->amount,
                ],
            ]);

            Log::info('VTpass webhook: transaction updated to successful', [
                'request_id' => $requestId,
                'transaction_id' => $transaction->id,
            ]);
        } elseif ($adapter->isResponsePending($response)) {
            Log::info('VTpass webhook: transaction still pending', [
                'request_id' => $requestId,
            ]);
        } else {
            $transaction->update([
                'status' => 'failed',
                'description' => $transaction->description . ' - ' . $adapter->getResponseMessage($response),
            ]);

            $billPayment->update([
                'vtpass_response' => $response,
            ]);

            $transaction->user->wallet->increment('available_balance', $transaction->amount + $transaction->charge);

            Notification::create([
                'user_id' => $transaction->user_id,
                'type' => 'transaction',
                'title' => 'Bill Payment Failed',
                'description' => $transaction->description . ' failed: ' . $adapter->getResponseMessage($response),
                'data' => [
                    'transaction_id' => $transaction->id,
                    'reference' => $transaction->reference,
                ],
            ]);

            Log::info('VTpass webhook: transaction updated to failed', [
                'request_id' => $requestId,
                'transaction_id' => $transaction->id,
            ]);
        }

        return response()->json(['response' => 'success']);
    }
}
