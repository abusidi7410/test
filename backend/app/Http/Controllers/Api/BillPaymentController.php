<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BillPayment;
use App\Models\Notification;
use App\Models\Transaction;
use App\Models\User;
use App\Services\Providers\ProviderRegistry;
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
        callable $buildAdapterOperation,
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
            $adapterOperation = $buildAdapterOperation($validated);

            $registry = app(ProviderRegistry::class);
            $result = $registry->executeWithFailover($category, $adapterOperation);

            /** @var BillPayment $billPayment */
            $billPayment = $transaction->billPayment;

            if ($result['success'] && isset($result['pending'])) {
                $billPayment->update([
                    'vtpass_request_id' => $result['response']['request_id'] ?? null,
                    'vtpass_response' => $result['response'],
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
                    'provider' => $result['provider']?->name,
                    'vtpass_response' => $result['response'],
                ], $description . ' is being processed.', 202);
            } elseif ($result['success']) {
                $transaction->update([
                    'status' => 'successful',
                    'provider_reference' => $result['response']['transactionId'] ?? null,
                ]);

                $billPayment->update([
                    'vtpass_request_id' => $result['response']['request_id'] ?? null,
                    'vtpass_response' => $result['response'],
                ]);

                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'transaction',
                    'title' => $description . ' Successful',
                    'description' => $description . ' completed successfully via ' . ($result['provider']?->name ?? 'provider') . '.',
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
                    'provider' => $result['provider']?->name,
                    'vtpass_response' => $result['response'],
                ], $description . ' successful.', 201);
            } else {
                $errorMsg = $result['message'] ?? 'Unknown error';

                DB::transaction(function () use ($transaction, $user, $totalDebit, $errorMsg) {
                    $transaction->update([
                        'status' => 'failed',
                        'description' => $transaction->description . ' - ' . $errorMsg,
                    ]);

                    $user->wallet->increment('available_balance', $totalDebit);
                });

                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'transaction',
                    'title' => $description . ' Failed',
                    'description' => $description . ' failed: ' . $errorMsg,
                    'data' => [
                        'transaction_id' => $transaction->id,
                        'reference' => $transaction->reference,
                    ],
                ]);

                return $this->errorResponse(
                    $description . ' failed: ' . $errorMsg,
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
            function (array $validated): callable {
                return function ($adapter) use ($validated) {
                    $serviceMap = [
                        'mtn' => 'mtn',
                        'airtel' => 'airtel',
                        'glo' => 'glo',
                        '9mobile' => '9mobile',
                    ];

                    return $adapter->payWithSubscription(
                        $serviceMap[$validated['provider']] ?? $validated['provider'],
                        $validated['phone'],
                        $validated['provider'],
                        'renew',
                    );
                };
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
            function (array $validated): callable {
                return function ($adapter) use ($validated) {
                    $serviceMap = [
                        'mtn' => 'mtn-data',
                        'airtel' => 'airtel-data',
                        'glo' => 'glo-data',
                        '9mobile' => '9mobile-data',
                    ];

                    return $adapter->payWithSubscription(
                        $serviceMap[$validated['provider']] ?? $validated['provider'],
                        $validated['phone'],
                        $validated['plan'],
                        'renew',
                    );
                };
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

            /** @var Transaction $transaction */
            $registry = app(ProviderRegistry::class);

            $result = $registry->executeWithFailover('electricity', function ($adapter) use ($validated, $serviceMap) {
                return $adapter->pay(
                    $serviceMap[$validated['provider']] ?? $validated['provider'],
                    (string) $validated['amount'],
                    $validated['meter_number'],
                    $validated['meter_type'],
                );
            });

            /** @var BillPayment $billPayment */
            $billPayment = $transaction->billPayment;

            if ($result['success'] && !isset($result['pending'])) {
                $content = $result['response']['content'] ?? [];
                $token = $content['Token'] ?? null;
                $accessToken = $content['AccessToken'] ?? null;

                $transaction->update([
                    'status' => 'successful',
                    'provider_reference' => $result['response']['transactionId'] ?? null,
                    'metadata' => array_merge($transaction->metadata ?? [], [
                        'token' => $token,
                        'access_token' => $accessToken,
                    ]),
                ]);

                $billPayment->update([
                    'vtpass_request_id' => $result['response']['request_id'] ?? null,
                    'vtpass_response' => $result['response'],
                ]);

                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'transaction',
                    'title' => 'Electricity Payment Successful',
                    'description' => 'Electricity token purchased successfully via ' . ($result['provider']?->name ?? 'provider') . '.',
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
                    'provider' => $result['provider']?->name,
                ], 'Electricity payment successful.', 201);
            } elseif ($result['success'] && isset($result['pending'])) {
                $billPayment->update([
                    'vtpass_request_id' => $result['response']['request_id'] ?? null,
                    'vtpass_response' => $result['response'],
                ]);

                return $this->successResponse([
                    'transaction' => $transaction->fresh(['billPayment']),
                    'amount' => number_format($amount, 2),
                    'reference' => $transaction->reference,
                    'provider' => $result['provider']?->name,
                ], 'Electricity payment is being processed.', 202);
            } else {
                $errorMsg = $result['message'] ?? 'Unknown error';

                DB::transaction(function () use ($transaction, $user, $totalDebit, $errorMsg) {
                    $transaction->update([
                        'status' => 'failed',
                        'description' => $transaction->description . ' - ' . $errorMsg,
                    ]);

                    $user->wallet->increment('available_balance', $totalDebit);
                });

                return $this->errorResponse(
                    'Electricity payment failed: ' . $errorMsg,
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
            function (array $validated): callable {
                return function ($adapter) use ($validated) {
                    return $adapter->payWithSubscription(
                        $validated['provider'],
                        $validated['smartcard'],
                        $validated['package'],
                        'renew',
                    );
                };
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
            function (array $validated): callable {
                return function ($adapter) use ($validated) {
                    return $adapter->payWithSubscription(
                        $validated['provider'],
                        $validated['customer_id'],
                        $validated['plan'],
                        'renew',
                    );
                };
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
            function (array $validated): callable {
                return function ($adapter) use ($validated) {
                    $serviceMap = [
                        'waec' => 'waec',
                        'neco' => 'neco',
                        'nabteb' => 'nabteb',
                    ];

                    return $adapter->payWithSubscription(
                        $serviceMap[$validated['provider']] ?? $validated['provider'],
                        $validated['candidate_name'],
                        $validated['provider'],
                        'renew',
                    );
                };
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
            function (array $validated): callable {
                return function ($adapter) use ($validated) {
                    $serviceMap = [
                        'sportybet' => 'sportybet',
                        'bet9ja' => 'bet9ja',
                        'betty' => 'bet9ja',
                        'betking' => 'betking',
                        '1xbet' => '1xbet',
                    ];

                    return $adapter->pay(
                        $serviceMap[$validated['provider']] ?? $validated['provider'],
                        (string) $validated['amount'],
                        $validated['user_id'],
                        $validated['provider'],
                    );
                };
            },
        );
    }

    public function convertAirtime(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:15'],
            'amount' => ['required', 'numeric', 'min:100', 'max:50000'],
            'provider' => ['required', 'string', 'in:mtn,airtel,glo,9mobile'],
        ]);

        /** @var User $user */
        $user = $request->user();

        $amount = (float) $validated['amount'];

        $transaction = DB::transaction(function () use (
            $user,
            $validated,
            $amount,
        ) {
            $previousBalance = $user->wallet->available_balance;
            $currentBalance = $previousBalance + $amount;
            $reference = 'TH-' . Str::random(12);

            $transaction = Transaction::create([
                'user_id' => $user->id,
                'wallet_id' => $user->wallet->id,
                'category' => 'airtime_to_cash',
                'type' => 'credit',
                'amount' => $amount,
                'charge' => 0.00,
                'previous_balance' => $previousBalance,
                'current_balance' => $currentBalance,
                'status' => 'pending',
                'description' => 'Airtime to cash conversion',
                'reference' => $reference,
                'metadata' => $validated,
            ]);

            $transaction->billPayment()->create([
                'transaction_id' => $transaction->id,
                'service_type' => 'airtime_to_cash',
                'provider' => $validated['provider'],
                'customer_id' => $validated['phone'],
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
        ], 'Airtime to cash conversion successful.', 201);
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
            $registry = app(ProviderRegistry::class);
            $result = $registry->executeWithFailover('electricity', function ($adapter) use ($validated, $serviceMap) {
                return $adapter->verifyMeter(
                    $validated['meter_number'],
                    $serviceMap[$validated['provider']] ?? $validated['provider'],
                    $validated['meter_type'],
                );
            });

            if ($result['success']) {
                $content = $result['response']['content'] ?? [];

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
                'Meter verification failed: ' . ($result['message'] ?? 'Unknown error'),
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
            return $this->errorResponse('No provider request ID found for this transaction.', 422);
        }

        if ($transaction->status !== 'pending') {
            return $this->successResponse([
                'transaction' => $transaction->fresh(['billPayment']),
                'status' => $transaction->status,
            ], 'Transaction already ' . $transaction->status . '.');
        }

        try {
            $registry = app(ProviderRegistry::class);
            $result = $registry->executeWithFailover($transaction->category, function ($adapter) use ($billPayment) {
                return $adapter->requery($billPayment->vtpass_request_id);
            });

            if ($result['success'] && !isset($result['pending'])) {
                DB::transaction(function () use ($transaction, $result) {
                    $transaction->update([
                        'status' => 'successful',
                        'provider_reference' => $result['response']['transactionId'] ?? null,
                    ]);

                    $transaction->billPayment->update([
                        'vtpass_response' => $result['response'],
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
            } elseif ($result['success'] && isset($result['pending'])) {
                return $this->successResponse([
                    'transaction' => $transaction->fresh(['billPayment']),
                    'status' => 'pending',
                ], 'Transaction is still being processed.');
            } else {
                $errorMsg = $result['message'] ?? 'Unknown error';

                DB::transaction(function () use ($transaction, $user, $errorMsg) {
                    $transaction->update([
                        'status' => 'failed',
                        'description' => $transaction->description . ' - ' . $errorMsg,
                    ]);

                    $user->wallet->increment('available_balance', $transaction->amount + $transaction->charge);
                });

                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'transaction',
                    'title' => $transaction->description . ' Failed',
                    'description' => $transaction->description . ' failed: ' . $errorMsg,
                    'data' => [
                        'transaction_id' => $transaction->id,
                        'reference' => $transaction->reference,
                    ],
                ]);

                return $this->errorResponse(
                    'Transaction failed: ' . $errorMsg,
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
