<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BillPayment;
use App\Models\Notification;
use App\Models\Transaction;
use App\Models\User;
use App\Services\Vtpass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class BillPaymentController extends Controller
{
    private function processBillPayment(
        Request $request,
        string $category,
        string $serviceType,
        array $validationRules,
        string $description,
        callable $buildPayload,
        ?float $charge = null,
    ): JsonResponse {
        $validated = $request->validate($validationRules);

        /** @var User $user */
        $user = $request->user();

        $amount = (float) ($validated['amount'] ?? 0);
        $totalDebit = $charge !== null ? $amount + $charge : $amount;

        if ($user->wallet->available_balance < $totalDebit) {
            return $this->errorResponse('Insufficient wallet balance.', 422);
        }

        $transaction = null;

        try {
            $transaction = DB::transaction(function () use (
                $user,
                $category,
                $serviceType,
                $validated,
                $amount,
                $charge,
                $description,
                $totalDebit,
                $buildPayload,
            ) {
                $previousBalance = $user->wallet->available_balance;
                $currentBalance = $previousBalance - $totalDebit;
                $reference = 'TH-' . Str::random(12);

                $transaction = Transaction::create([
                    'user_id' => $user->id,
                    'wallet_id' => $user->wallet->id,
                    'category' => $category,
                    'type' => 'debit',
                    'amount' => $amount,
                    'charge' => $charge ?? 0.00,
                    'previous_balance' => $previousBalance,
                    'current_balance' => $currentBalance,
                    'status' => 'pending',
                    'description' => $description,
                    'reference' => $reference,
                    'metadata' => $validated,
                ]);

                $billData = [
                    'transaction_id' => $transaction->id,
                    'service_type' => $serviceType,
                    'provider' => $validated['provider'] ?? null,
                    'customer_id' => $validated['phone'] ?? $validated['meter_number']
                        ?? $validated['smartcard'] ?? $validated['customer_id']
                        ?? $validated['user_id'] ?? null,
                    'package' => $validated['plan'] ?? $validated['package'] ?? null,
                    'quantity' => $validated['quantity'] ?? 1,
                ];

                $transaction->billPayment()->create($billData);

                $user->wallet->decrement('available_balance', $totalDebit);

                return $transaction;
            });

            /** @var Transaction $transaction */
            $vtpassPayload = $buildPayload($validated);

            /** @var Vtpass $vtpass */
            $vtpass = app(Vtpass::class);
            $response = $vtpass->payWithSubscription(
                $vtpassPayload['serviceID'],
                $vtpassPayload['billersCode'],
                $vtpassPayload['variation_code'],
                $vtpassPayload['subscription_type'] ?? 'renew',
            );

            /** @var BillPayment $billPayment */
            $billPayment = $transaction->billPayment;

            if ($vtpass->isResponseSuccessful($response)) {
                $transaction->update([
                    'status' => 'successful',
                    'provider_reference' => $response['transactionId'] ?? null,
                ]);

                $billPayment->update([
                    'vtpass_request_id' => $vtpassPayload['request_id'],
                    'vtpass_response' => $response,
                ]);

                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'transaction',
                    'title' => $description . ' Successful',
                    'description' => $description . ' completed successfully.',
                    'data' => [
                        'transaction_id' => $transaction->id,
                        'reference' => $transaction->reference,
                        'amount' => $amount,
                    ],
                ]);

                return $this->successResponse([
                    'transaction' => $transaction->fresh(['billPayment']),
                    'amount' => number_format($amount, 2),
                    'charge' => number_format($charge ?? 0, 2),
                    'total_debited' => number_format($totalDebit, 2),
                    'reference' => $transaction->reference,
                    'vtpass_response' => $response,
                ], $description . ' successful.', 201);
            } elseif ($vtpass->isResponsePending($response)) {
                $billPayment->update([
                    'vtpass_request_id' => $vtpassPayload['request_id'],
                    'vtpass_response' => $response,
                ]);

                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'transaction',
                    'title' => $description . ' Pending',
                    'description' => $description . ' is being processed. You will be notified when complete.',
                    'data' => [
                        'transaction_id' => $transaction->id,
                        'reference' => $transaction->reference,
                        'amount' => $amount,
                    ],
                ]);

                return $this->successResponse([
                    'transaction' => $transaction->fresh(['billPayment']),
                    'amount' => number_format($amount, 2),
                    'charge' => number_format($charge ?? 0, 2),
                    'total_debited' => number_format($totalDebit, 2),
                    'reference' => $transaction->reference,
                    'vtpass_response' => $response,
                ], $description . ' is being processed.', 202);
            } else {
                DB::transaction(function () use ($transaction, $user, $totalDebit, $response, $vtpassPayload) {
                    $transaction->update([
                        'status' => 'failed',
                        'description' => $transaction->description . ' - ' . $vtpass->getResponseMessage($response),
                    ]);

                    $transaction->billPayment->update([
                        'vtpass_request_id' => $vtpassPayload['request_id'],
                        'vtpass_response' => $response,
                    ]);

                    $user->wallet->increment('available_balance', $totalDebit);
                });

                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'transaction',
                    'title' => $description . ' Failed',
                    'description' => $description . ' failed: ' . $vtpass->getResponseMessage($response),
                    'data' => [
                        'transaction_id' => $transaction->id,
                        'reference' => $transaction->reference,
                    ],
                ]);

                return $this->errorResponse(
                    $description . ' failed: ' . $vtpass->getResponseMessage($response),
                    422,
                );
            }
        } catch (\Exception $e) {
            Log::error($description . ' exception', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            if ($transaction) {
                DB::transaction(function () use ($transaction, $user, $totalDebit) {
                    $transaction->update(['status' => 'failed']);
                    $user->wallet->increment('available_balance', $totalDebit);
                });
            }

            return $this->errorResponse(
                $description . ' failed. Please try again.',
                500,
            );
        }
    }

    private function processCreditBillPayment(
        Request $request,
        string $category,
        string $serviceType,
        array $validationRules,
        string $description,
    ): JsonResponse {
        $validated = $request->validate($validationRules);

        /** @var User $user */
        $user = $request->user();

        $amount = (float) ($validated['amount'] ?? 0);

        $transaction = DB::transaction(function () use (
            $user,
            $category,
            $serviceType,
            $validated,
            $amount,
            $description,
        ) {
            $previousBalance = $user->wallet->available_balance;
            $currentBalance = $previousBalance + $amount;
            $reference = 'TH-' . Str::random(12);

            $transaction = Transaction::create([
                'user_id' => $user->id,
                'wallet_id' => $user->wallet->id,
                'category' => $category,
                'type' => 'credit',
                'amount' => $amount,
                'charge' => 0.00,
                'previous_balance' => $previousBalance,
                'current_balance' => $currentBalance,
                'status' => 'pending',
                'description' => $description,
                'reference' => $reference,
                'metadata' => $validated,
            ]);

            $transaction->billPayment()->create([
                'transaction_id' => $transaction->id,
                'service_type' => $serviceType,
                'provider' => $validated['provider'] ?? null,
                'customer_id' => $validated['phone'] ?? null,
                'package' => null,
                'quantity' => 1,
            ]);

            $user->wallet->increment('available_balance', $amount);

            return $transaction;
        });

        return $this->successResponse([
            'transaction' => $transaction->fresh(['billPayment']),
            'amount' => number_format($amount, 2),
            'reference' => $transaction->reference,
        ], $description . ' successful.', 201);
    }

    public function buyAirtime(Request $request): JsonResponse
    {
        return $this->processBillPayment(
            $request,
            'airtime',
            'airtime',
            [
                'phone' => ['required', 'string', 'max:15'],
                'amount' => ['required', 'numeric', 'min:50', 'max:50000'],
                'provider' => ['required', 'string', 'in:mtn,airtel,glo,9mobile'],
            ],
            'Airtime purchase',
            function (array $validated): array {
                $serviceMap = [
                    'mtn' => 'mtn',
                    'airtel' => 'airtel',
                    'glo' => 'glo',
                    '9mobile' => '9mobile',
                ];

                /** @var Vtpass $vtpass */
                $vtpass = app(Vtpass::class);

                return [
                    'serviceID' => $serviceMap[$validated['provider']] ?? $validated['provider'],
                    'billersCode' => $validated['phone'],
                    'variation_code' => $validated['provider'],
                    'amount' => $validated['amount'],
                    'request_id' => $vtpass->generateRequestId(),
                ];
            },
        );
    }

    public function buyData(Request $request): JsonResponse
    {
        return $this->processBillPayment(
            $request,
            'data',
            'data',
            [
                'phone' => ['required', 'string', 'max:15'],
                'plan' => ['required', 'string', 'max:100'],
                'provider' => ['required', 'string', 'in:mtn,airtel,glo,9mobile'],
                'amount' => ['required', 'numeric', 'min:100'],
            ],
            'Data purchase',
            function (array $validated): array {
                $serviceMap = [
                    'mtn' => 'mtn-data',
                    'airtel' => 'airtel-data',
                    'glo' => 'glo-data',
                    '9mobile' => '9mobile-data',
                ];

                /** @var Vtpass $vtpass */
                $vtpass = app(Vtpass::class);

                return [
                    'serviceID' => $serviceMap[$validated['provider']] ?? $validated['provider'],
                    'billersCode' => $validated['phone'],
                    'variation_code' => $validated['plan'],
                    'amount' => $validated['amount'],
                    'request_id' => $vtpass->generateRequestId(),
                ];
            },
        );
    }

    public function payElectricity(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'meter_number' => ['required', 'string', 'max:20'],
            'amount' => ['required', 'numeric', 'min:500', 'max:100000'],
            'provider' => ['required', 'string', 'in:ikeja,ibadan,eko,abuja,kano,ph,benin,enugu'],
            'meter_type' => ['required', 'string', 'in:prepaid,postpaid'],
        ]);

        /** @var User $user */
        $user = $request->user();

        $amount = (float) $validated['amount'];
        $charge = 0.00;
        $totalDebit = $amount + $charge;

        if ($user->wallet->available_balance < $totalDebit) {
            return $this->errorResponse('Insufficient wallet balance.', 422);
        }

        $serviceMap = [
            'ikeja' => 'ikeja-electric',
            'ibadan' => 'ibadan-electric',
            'eko' => 'eko-electric',
            'abuja' => 'abuja-electric',
            'kano' => 'kano-electric',
            'ph' => 'phcn-electric',
            'benin' => 'benin-electric',
            'enugu' => 'enugu-electric',
        ];

        $transaction = null;

        try {
            $transaction = DB::transaction(function () use (
                $user,
                $validated,
                $amount,
                $charge,
                $totalDebit,
            ) {
                $previousBalance = $user->wallet->available_balance;
                $currentBalance = $previousBalance - $totalDebit;
                $reference = 'TH-' . Str::random(12);

                $transaction = Transaction::create([
                    'user_id' => $user->id,
                    'wallet_id' => $user->wallet->id,
                    'category' => 'electricity',
                    'type' => 'debit',
                    'amount' => $amount,
                    'charge' => $charge,
                    'previous_balance' => $previousBalance,
                    'current_balance' => $currentBalance,
                    'status' => 'pending',
                    'description' => 'Electricity payment',
                    'reference' => $reference,
                    'metadata' => $validated,
                ]);

                $transaction->billPayment()->create([
                    'transaction_id' => $transaction->id,
                    'service_type' => 'electricity',
                    'provider' => $validated['provider'],
                    'customer_id' => $validated['meter_number'],
                    'package' => $validated['meter_type'],
                    'quantity' => 1,
                ]);

                $user->wallet->decrement('available_balance', $totalDebit);

                return $transaction;
            });

            /** @var Vtpass $vtpass */
            $vtpass = app(Vtpass::class);

            $response = $vtpass->pay(
                $serviceMap[$validated['provider']] ?? $validated['provider'],
                (string) $amount,
                $validated['meter_number'],
                $validated['meter_type'],
            );

            /** @var Transaction $transaction */
            /** @var BillPayment $billPayment */
            $billPayment = $transaction->billPayment;

            if ($vtpass->isResponseSuccessful($response)) {
                $token = $response['content']['Token'] ?? null;
                $accessToken = $response['content']['AccessToken'] ?? null;

                $transaction->update([
                    'status' => 'successful',
                    'provider_reference' => $response['transactionId'] ?? null,
                    'metadata' => array_merge($transaction->metadata ?? [], [
                        'token' => $token,
                        'access_token' => $accessToken,
                    ]),
                ]);

                $billPayment->update([
                    'vtpass_request_id' => $vtpass->generateRequestId(),
                    'vtpass_response' => $response,
                ]);

                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'transaction',
                    'title' => 'Electricity Payment Successful',
                    'description' => 'Electricity token purchased successfully.',
                    'data' => [
                        'transaction_id' => $transaction->id,
                        'reference' => $transaction->reference,
                        'token' => $token,
                        'amount' => $amount,
                    ],
                ]);

                return $this->successResponse([
                    'transaction' => $transaction->fresh(['billPayment']),
                    'amount' => number_format($amount, 2),
                    'charge' => number_format($charge, 2),
                    'total_debited' => number_format($totalDebit, 2),
                    'reference' => $transaction->reference,
                    'token' => $token,
                    'access_token' => $accessToken,
                ], 'Electricity payment successful.', 201);
            } elseif ($vtpass->isResponsePending($response)) {
                $billPayment->update([
                    'vtpass_request_id' => $vtpass->generateRequestId(),
                    'vtpass_response' => $response,
                ]);

                return $this->successResponse([
                    'transaction' => $transaction->fresh(['billPayment']),
                    'amount' => number_format($amount, 2),
                    'reference' => $transaction->reference,
                ], 'Electricity payment is being processed.', 202);
            } else {
                DB::transaction(function () use ($transaction, $user, $totalDebit, $response, $billPayment, $vtpass) {
                    $transaction->update([
                        'status' => 'failed',
                        'description' => $transaction->description . ' - ' . $vtpass->getResponseMessage($response),
                    ]);

                    $billPayment->update([
                        'vtpass_response' => $response,
                    ]);

                    $user->wallet->increment('available_balance', $totalDebit);
                });

                return $this->errorResponse(
                    'Electricity payment failed: ' . $vtpass->getResponseMessage($response),
                    422,
                );
            }
        } catch (\Exception $e) {
            Log::error('Electricity payment exception', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            if ($transaction) {
                DB::transaction(function () use ($transaction, $user, $totalDebit) {
                    $transaction->update(['status' => 'failed']);
                    $user->wallet->increment('available_balance', $totalDebit);
                });
            }

            return $this->errorResponse('Electricity payment failed. Please try again.', 500);
        }
    }

    public function subscribeCable(Request $request): JsonResponse
    {
        return $this->processBillPayment(
            $request,
            'cable_tv',
            'cable_tv',
            [
                'smartcard' => ['required', 'string', 'max:20'],
                'package' => ['required', 'string', 'max:100'],
                'provider' => ['required', 'string', 'in:dstv,gotv,startimes'],
            ],
            'Cable TV subscription',
            function (array $validated): array {
                /** @var Vtpass $vtpass */
                $vtpass = app(Vtpass::class);

                return [
                    'serviceID' => $validated['provider'],
                    'billersCode' => $validated['smartcard'],
                    'variation_code' => $validated['package'],
                    'subscription_type' => 'renew',
                    'request_id' => $vtpass->generateRequestId(),
                ];
            },
        );
    }

    public function subscribeInternet(Request $request): JsonResponse
    {
        return $this->processBillPayment(
            $request,
            'internet',
            'internet',
            [
                'customer_id' => ['required', 'string', 'max:50'],
                'plan' => ['required', 'string', 'max:100'],
                'provider' => ['required', 'string', 'in:smile,spectranet,mixx'],
            ],
            'Internet subscription',
            function (array $validated): array {
                /** @var Vtpass $vtpass */
                $vtpass = app(Vtpass::class);

                return [
                    'serviceID' => $validated['provider'],
                    'billersCode' => $validated['customer_id'],
                    'variation_code' => $validated['plan'],
                    'subscription_type' => 'renew',
                    'request_id' => $vtpass->generateRequestId(),
                ];
            },
        );
    }

    public function buyEducationPin(Request $request): JsonResponse
    {
        return $this->processBillPayment(
            $request,
            'education',
            'education',
            [
                'candidate_name' => ['required', 'string', 'max:255'],
                'quantity' => ['required', 'integer', 'min:1', 'max:10'],
                'provider' => ['required', 'string', 'in:waec,neco,nabteb'],
                'amount' => ['required', 'numeric', 'min:500'],
            ],
            'Education PIN purchase',
            function (array $validated): array {
                $serviceMap = [
                    'waec' => 'waec',
                    'neco' => 'neco',
                    'nabteb' => 'nabteb',
                ];

                /** @var Vtpass $vtpass */
                $vtpass = app(Vtpass::class);

                return [
                    'serviceID' => $serviceMap[$validated['provider']] ?? $validated['provider'],
                    'billersCode' => $validated['candidate_name'],
                    'variation_code' => $validated['provider'],
                    'quantity' => (string) $validated['quantity'],
                    'request_id' => $vtpass->generateRequestId(),
                ];
            },
        );
    }

    public function fundBetting(Request $request): JsonResponse
    {
        return $this->processBillPayment(
            $request,
            'betting',
            'betting',
            [
                'user_id' => ['required', 'string', 'max:50'],
                'amount' => ['required', 'numeric', 'min:100', 'max:100000'],
                'provider' => ['required', 'string', 'in:sportybet,bet9ja,betty,betking,1xbet'],
            ],
            'Betting funding',
            function (array $validated): array {
                $serviceMap = [
                    'sportybet' => 'sportybet',
                    'bet9ja' => 'bet9ja',
                    'betty' => 'bet9ja',
                    'betking' => 'betking',
                    '1xbet' => '1xbet',
                ];

                /** @var Vtpass $vtpass */
                $vtpass = app(Vtpass::class);

                return [
                    'serviceID' => $serviceMap[$validated['provider']] ?? $validated['provider'],
                    'billersCode' => $validated['user_id'],
                    'variation_code' => $validated['provider'],
                    'amount' => $validated['amount'],
                    'request_id' => $vtpass->generateRequestId(),
                ];
            },
        );
    }

    public function convertAirtime(Request $request): JsonResponse
    {
        return $this->processCreditBillPayment(
            $request,
            'airtime_to_cash',
            'airtime_to_cash',
            [
                'phone' => ['required', 'string', 'max:15'],
                'amount' => ['required', 'numeric', 'min:100', 'max:50000'],
                'provider' => ['required', 'string', 'in:mtn,airtel,glo,9mobile'],
            ],
            'Airtime to cash conversion',
        );
    }

    public function verifyMeter(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'meter_number' => ['required', 'string', 'max:20'],
            'provider' => ['required', 'string', 'in:ikeja,ibadan,eko,abuja,kano,ph,benin,enugu'],
            'meter_type' => ['required', 'string', 'in:prepaid,postpaid'],
        ]);

        $serviceMap = [
            'ikeja' => 'ikeja-electric',
            'ibadan' => 'ibadan-electric',
            'eko' => 'eko-electric',
            'abuja' => 'abuja-electric',
            'kano' => 'kano-electric',
            'ph' => 'phcn-electric',
            'benin' => 'benin-electric',
            'enugu' => 'enugu-electric',
        ];

        try {
            /** @var Vtpass $vtpass */
            $vtpass = app(Vtpass::class);

            $response = $vtpass->verifyMeter(
                $validated['meter_number'],
                $serviceMap[$validated['provider']] ?? $validated['provider'],
                $validated['meter_type'],
            );

            if ($vtpass->isResponseSuccessful($response)) {
                $content = $response['content'] ?? [];

                return $this->successResponse([
                    'customer_name' => $content['Customer_Name'] ?? $content['customerName'] ?? null,
                    'customer_address' => $content['Customer_Address'] ?? $content['customerAddress'] ?? null,
                    'meter_number' => $content['MeterNo'] ?? $validated['meter_number'],
                    'meter_type' => $validated['meter_type'],
                    'tariff' => $content['Tariff'] ?? $content['tariff'] ?? null,
                    'max_demand' => $content['Maximum_Demand'] ?? $content['maximumDemand'] ?? null,
                ], 'Meter verified successfully.');
            }

            return $this->errorResponse(
                'Meter verification failed: ' . $vtpass->getResponseMessage($response),
                422,
            );
        } catch (\Exception $e) {
            Log::error('Meter verification exception', [
                'meter_number' => $validated['meter_number'],
                'error' => $e->getMessage(),
            ]);

            return $this->errorResponse('Meter verification failed. Please try again.', 500);
        }
    }

    public function requeryTransaction(Request $request, string $reference): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $transaction = $user->transactions()
            ->where('reference', $reference)
            ->with('billPayment')
            ->first();

        if (!$transaction) {
            return $this->errorResponse('Transaction not found.', 404);
        }

        /** @var BillPayment|null $billPayment */
        $billPayment = $transaction->billPayment;

        if (!$billPayment || !$billPayment->vtpass_request_id) {
            return $this->errorResponse('No VTpass request ID found for this transaction.', 422);
        }

        if ($transaction->status !== 'pending') {
            return $this->successResponse([
                'transaction' => $transaction->fresh(['billPayment']),
                'status' => $transaction->status,
            ], 'Transaction already ' . $transaction->status . '.');
        }

        try {
            /** @var Vtpass $vtpass */
            $vtpass = app(Vtpass::class);
            $response = $vtpass->requery($billPayment->vtpass_request_id);

            if ($vtpass->isResponseSuccessful($response)) {
                DB::transaction(function () use ($transaction, $response, $vtpass, $billPayment) {
                    $transaction->update([
                        'status' => 'successful',
                        'provider_reference' => $response['transactionId'] ?? null,
                    ]);

                    $billPayment->update([
                        'vtpass_response' => $response,
                    ]);
                });

                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'transaction',
                    'title' => $transaction->description . ' Successful',
                    'description' => $transaction->description . ' completed successfully.',
                    'data' => [
                        'transaction_id' => $transaction->id,
                        'reference' => $transaction->reference,
                    ],
                ]);

                return $this->successResponse([
                    'transaction' => $transaction->fresh(['billPayment']),
                    'status' => 'successful',
                ], 'Transaction is successful.');
            } elseif ($vtpass->isResponsePending($response)) {
                return $this->successResponse([
                    'transaction' => $transaction->fresh(['billPayment']),
                    'status' => 'pending',
                ], 'Transaction is still being processed.');
            } else {
                DB::transaction(function () use ($transaction, $user, $response, $billPayment, $vtpass) {
                    $transaction->update([
                        'status' => 'failed',
                        'description' => $transaction->description . ' - ' . $vtpass->getResponseMessage($response),
                    ]);

                    $billPayment->update([
                        'vtpass_response' => $response,
                    ]);

                    $user->wallet->increment('available_balance', $transaction->amount + $transaction->charge);
                });

                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'transaction',
                    'title' => $transaction->description . ' Failed',
                    'description' => $transaction->description . ' failed: ' . $vtpass->getResponseMessage($response),
                    'data' => [
                        'transaction_id' => $transaction->id,
                        'reference' => $transaction->reference,
                    ],
                ]);

                return $this->errorResponse(
                    'Transaction failed: ' . $vtpass->getResponseMessage($response),
                    422,
                );
            }
        } catch (\Exception $e) {
            Log::error('Requery exception', [
                'reference' => $reference,
                'error' => $e->getMessage(),
            ]);

            return $this->errorResponse('Requery failed. Please try again.', 500);
        }
    }
}
