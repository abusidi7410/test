<?php

use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminTransactionController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AdminNotificationController;
use App\Http\Controllers\Api\AdminPaymentGatewayController;
use App\Http\Controllers\Api\AdminReportController;
use App\Http\Controllers\Api\AdminSupportController;
use App\Http\Controllers\Api\AdminWalletController;
use App\Http\Controllers\Api\AdminVtuProviderController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BankAccountController;
use App\Http\Controllers\Api\BillPaymentController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReferralController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\SocialAuthController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\TransactionPinController;
use App\Http\Controllers\Api\TransferController;
use App\Http\Controllers\Api\VariationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PaystackWebhookController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\WithdrawController;
use App\Http\Controllers\Api\SupportTicketController;
use App\Http\Controllers\Api\GiftCardController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register'])
    ->middleware('throttle:register');
Route::post('/auth/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])
    ->middleware('throttle:password');

Route::get('/auth/social/{provider}/redirect', [SocialAuthController::class, 'redirect'])
    ->middleware('throttle:login');
Route::get('/auth/social/{provider}/callback', [SocialAuthController::class, 'callback'])
    ->middleware('throttle:login');
Route::get('/auth/social/{provider}/callback-token', [SocialAuthController::class, 'callbackToken']);
Route::get('/auth/debug/redirect-uri/{provider}', [SocialAuthController::class, 'debugRedirectUri']);

Route::post('/webhooks/vtpass', [WebhookController::class, 'handleVtpassCallback']);

// Paystack webhook — must be public (no auth) since Paystack calls this directly.
// Signature verification is handled inside the controller.
Route::post('/paystack/webhook', [PaystackWebhookController::class, 'handleWebhook']);

Route::middleware('auth.token')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);
    Route::put('/profile/password', [ProfileController::class, 'changePassword']);
    Route::post('/profile/upgrade', [ProfileController::class, 'upgradeLevel']);

    Route::post('/profile/pin', [TransactionPinController::class, 'store']);
    Route::post('/profile/pin/verify', [TransactionPinController::class, 'verify']);
    Route::get('/profile/pin/status', [TransactionPinController::class, 'status']);
    Route::post('/profile/pin/reset/request', [TransactionPinController::class, 'requestReset']);
    Route::post('/profile/pin/reset/confirm', [TransactionPinController::class, 'confirmReset']);

    Route::get('/wallet', [WalletController::class, 'show']);
    Route::post('/wallet/fund', [WalletController::class, 'fund']);
    Route::get('/payment/verify/{reference}', [PaymentController::class, 'verify']);

    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::get('/transactions/spending-summary', [TransactionController::class, 'spendingSummary']);
    Route::get('/transactions/{uuid}', [TransactionController::class, 'show']);
    Route::post('/transactions/{reference}/requery', [BillPaymentController::class, 'requeryTransaction']);

    Route::middleware('verify.transaction_pin')->group(function () {
        Route::post('/bills/airtime', [BillPaymentController::class, 'buyAirtime']);
        Route::post('/bills/data', [BillPaymentController::class, 'buyData']);
        Route::post('/bills/electricity', [BillPaymentController::class, 'payElectricity']);
        Route::post('/bills/cable-tv', [BillPaymentController::class, 'subscribeCable']);
        Route::post('/bills/internet', [BillPaymentController::class, 'subscribeInternet']);
        Route::post('/bills/education', [BillPaymentController::class, 'buyEducationPin']);
        Route::post('/bills/betting', [BillPaymentController::class, 'fundBetting']);
        Route::post('/bills/airtime-to-cash', [BillPaymentController::class, 'convertAirtime']);

        Route::post('/transfers', [TransferController::class, 'store']);
        Route::post('/withdrawals', [WithdrawController::class, 'store']);
    });

    Route::post('/bills/verify-meter', [BillPaymentController::class, 'verifyMeter']);
    Route::get('/variations/{serviceId}', [VariationController::class, 'getVariations']);

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

    // Gift Cards
    Route::get('/gift-cards', [GiftCardController::class, 'index']);
    Route::post('/gift-cards', [GiftCardController::class, 'store']);
    Route::get('/gift-cards/{id}', [GiftCardController::class, 'show']);

    // Support Tickets
    Route::get('/support', [SupportTicketController::class, 'index']);
    Route::post('/support', [SupportTicketController::class, 'store']);
    Route::get('/support/{id}', [SupportTicketController::class, 'show']);
    Route::post('/support/{id}/reply', [SupportTicketController::class, 'reply']);
});

Route::post('/admin/login', [AdminAuthController::class, 'login']);

Route::middleware('admin')->prefix('admin')->group(function () {
    Route::post('/logout', [AdminAuthController::class, 'logout']);
    Route::get('/me', [AdminAuthController::class, 'me']);

    Route::get('/dashboard', [AdminDashboardController::class, 'index']);

    Route::get('/users', [AdminUserController::class, 'index']);
    Route::post('/users', [AdminUserController::class, 'store']);
    Route::get('/users/{id}', [AdminUserController::class, 'show']);
    Route::put('/users/{id}', [AdminUserController::class, 'update']);
    Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
    Route::post('/users/{id}/suspend', [AdminUserController::class, 'suspend']);
    Route::post('/users/{id}/activate', [AdminUserController::class, 'activate']);
    Route::post('/users/{id}/ban', [AdminUserController::class, 'ban']);
    Route::post('/users/{id}/credit', [AdminUserController::class, 'credit']);
    Route::post('/users/{id}/debit', [AdminUserController::class, 'debit']);
    Route::post('/users/{id}/lock-wallet', [AdminUserController::class, 'lockWallet']);
    Route::post('/users/{id}/unlock-wallet', [AdminUserController::class, 'unlockWallet']);
    Route::get('/users/{id}/transactions', [AdminUserController::class, 'transactions']);

    Route::get('/admins', [AdminController::class, 'index']);
    Route::post('/admins', [AdminController::class, 'store']);
    Route::get('/admins/{id}', [AdminController::class, 'show']);
    Route::put('/admins/{id}', [AdminController::class, 'update']);
    Route::delete('/admins/{id}', [AdminController::class, 'destroy']);
    Route::post('/admins/{id}/suspend', [AdminController::class, 'suspend']);
    Route::post('/admins/{id}/activate', [AdminController::class, 'activate']);

    Route::get('/transactions', [AdminTransactionController::class, 'index']);
    Route::get('/transactions/{id}', [AdminTransactionController::class, 'show']);
    Route::post('/transactions/{id}/approve', [AdminTransactionController::class, 'approve']);
    Route::post('/transactions/{id}/reject', [AdminTransactionController::class, 'reject']);
    Route::post('/transactions/{id}/reverse', [AdminTransactionController::class, 'reverse']);

    Route::get('/providers', [AdminVtuProviderController::class, 'index']);
    Route::get('/providers/all', [AdminVtuProviderController::class, 'all']);
    Route::get('/providers/statistics', [AdminVtuProviderController::class, 'globalStatistics']);
    Route::post('/providers', [AdminVtuProviderController::class, 'store']);
    Route::get('/providers/{id}', [AdminVtuProviderController::class, 'show']);
    Route::put('/providers/{id}', [AdminVtuProviderController::class, 'update']);
    Route::delete('/providers/{id}', [AdminVtuProviderController::class, 'destroy']);
    Route::post('/providers/{id}/toggle-status', [AdminVtuProviderController::class, 'toggleStatus']);
    Route::post('/providers/{id}/set-default', [AdminVtuProviderController::class, 'setDefault']);
    Route::put('/providers/{id}/priority', [AdminVtuProviderController::class, 'updatePriority']);
    Route::post('/providers/{id}/test-connection', [AdminVtuProviderController::class, 'testConnection']);
    Route::post('/providers/{id}/health-check', [AdminVtuProviderController::class, 'healthCheck']);
    Route::get('/providers/{id}/statistics', [AdminVtuProviderController::class, 'statistics']);

    // Support Tickets
    Route::get('/support', [AdminSupportController::class, 'index']);
    Route::get('/support/{id}', [AdminSupportController::class, 'show']);
    Route::post('/support/{id}/assign', [AdminSupportController::class, 'assign']);
    Route::put('/support/{id}/status', [AdminSupportController::class, 'updateStatus']);
    Route::post('/support/{id}/close', [AdminSupportController::class, 'close']);
    Route::post('/support/{id}/reopen', [AdminSupportController::class, 'reopen']);
    Route::post('/support/{id}/reply', [AdminSupportController::class, 'reply']);

    // Admin Notifications / Broadcasts
    Route::get('/notifications/history', [AdminNotificationController::class, 'index']);
    Route::post('/notifications/send', [AdminNotificationController::class, 'store']);
    Route::get('/notifications/history/{id}', [AdminNotificationController::class, 'show']);
    Route::delete('/notifications/history/{id}', [AdminNotificationController::class, 'destroy']);

    // Payment Gateways
    Route::get('/gateways', [AdminPaymentGatewayController::class, 'index']);
    Route::get('/gateways/{id}', [AdminPaymentGatewayController::class, 'show']);
    Route::post('/gateways', [AdminPaymentGatewayController::class, 'store']);
    Route::put('/gateways/{id}', [AdminPaymentGatewayController::class, 'update']);
    Route::post('/gateways/{id}/toggle-status', [AdminPaymentGatewayController::class, 'toggleStatus']);
    Route::post('/gateways/{id}/set-default', [AdminPaymentGatewayController::class, 'setDefault']);
    Route::post('/gateways/{id}/test-connection', [AdminPaymentGatewayController::class, 'testConnection']);
    Route::get('/gateways/{id}/webhooks', [AdminPaymentGatewayController::class, 'webhooks']);

    // Reports
    Route::get('/reports', [AdminReportController::class, 'index']);
    Route::get('/reports/export', [AdminReportController::class, 'export']);

    // Wallet Management (admin-side)
    Route::get('/wallets', [AdminWalletController::class, 'index']);
    Route::get('/wallets/{id}', [AdminWalletController::class, 'show']);
    Route::post('/wallets/{id}/credit', [AdminWalletController::class, 'credit']);
    Route::post('/wallets/{id}/debit', [AdminWalletController::class, 'debit']);
    Route::post('/wallets/{id}/lock', [AdminWalletController::class, 'lock']);
    Route::post('/wallets/{id}/unlock', [AdminWalletController::class, 'unlock']);
    Route::get('/wallets/{id}/history', [AdminWalletController::class, 'history']);

    // System Settings
    Route::get('/settings', function () {
        return response()->json([
            'success' => true,
            'data' => \App\Models\SystemSetting::pluck('value', 'key_name')->toArray(),
        ]);
    });
    Route::put('/settings/{group}', function (\Illuminate\Http\Request $request, string $group) {
        $validated = $request->validate(['settings' => 'required|array']);
        \App\Models\SystemSetting::setGroup($group, $validated['settings']);
        return response()->json(['success' => true, 'message' => 'Settings updated.']);
    });
});
