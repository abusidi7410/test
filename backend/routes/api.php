<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BankAccountController;
use App\Http\Controllers\Api\BillPaymentController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReferralController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\TransferController;
use App\Http\Controllers\Api\VariationController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\WithdrawController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::post('/webhooks/vtpass', [WebhookController::class, 'handleVtpassCallback']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);
    Route::put('/profile/password', [ProfileController::class, 'changePassword']);
    Route::post('/profile/upgrade', [ProfileController::class, 'upgradeLevel']);

    Route::get('/wallet', [WalletController::class, 'show']);
    Route::post('/wallet/fund', [WalletController::class, 'fund']);

    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::get('/transactions/spending-summary', [TransactionController::class, 'spendingSummary']);
    Route::get('/transactions/{uuid}', [TransactionController::class, 'show']);
    Route::post('/transactions/{reference}/requery', [BillPaymentController::class, 'requeryTransaction']);

    Route::post('/bills/airtime', [BillPaymentController::class, 'buyAirtime']);
    Route::post('/bills/data', [BillPaymentController::class, 'buyData']);
    Route::post('/bills/electricity', [BillPaymentController::class, 'payElectricity']);
    Route::post('/bills/verify-meter', [BillPaymentController::class, 'verifyMeter']);
    Route::post('/bills/cable-tv', [BillPaymentController::class, 'subscribeCable']);
    Route::post('/bills/internet', [BillPaymentController::class, 'subscribeInternet']);
    Route::post('/bills/education', [BillPaymentController::class, 'buyEducationPin']);
    Route::post('/bills/betting', [BillPaymentController::class, 'fundBetting']);
    Route::post('/bills/airtime-to-cash', [BillPaymentController::class, 'convertAirtime']);

    Route::get('/variations/{serviceId}', [VariationController::class, 'getVariations']);

    Route::post('/transfers', [TransferController::class, 'store']);
    Route::post('/withdrawals', [WithdrawController::class, 'store']);

    Route::get('/bank-accounts', [BankAccountController::class, 'index']);
    Route::post('/bank-accounts', [BankAccountController::class, 'store']);
    Route::delete('/bank-accounts/{id}', [BankAccountController::class, 'destroy']);
    Route::put('/bank-accounts/{id}/default', [BankAccountController::class, 'setDefault']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    Route::get('/referrals', [ReferralController::class, 'index']);
    Route::get('/referrals/link', [ReferralController::class, 'link']);

    Route::get('/settings', [SettingsController::class, 'show']);
    Route::put('/settings', [SettingsController::class, 'update']);
});
