<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->index('category');
            $table->index('type');
            $table->index(['user_id', 'created_at']);
            $table->index(['status', 'created_at']);
            $table->index('reference');
            $table->index('provider_reference');
            $table->index(['wallet_id', 'created_at']);
            $table->index('gateway');
        });

        Schema::table('bill_payments', function (Blueprint $table) {
            $table->index('vtpass_request_id');
            $table->index('service_type');
            $table->index('provider');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['user_id', 'created_at']);
            $table->index('read_at');
        });

        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->index('is_default');
        });

        Schema::table('referrals', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('referral_earnings', function (Blueprint $table) {
            $table->index('user_id');
        });

        Schema::table('social_accounts', function (Blueprint $table) {
            $table->unique(['provider', 'provider_id']);
        });

        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->index('token');
        });

        Schema::table('admin_users', function (Blueprint $table) {
            $table->index('status');
            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['category']);
            $table->dropIndex(['type']);
            $table->dropIndex(['user_id', 'created_at']);
            $table->dropIndex(['status', 'created_at']);
            $table->dropIndex(['reference']);
            $table->dropIndex(['provider_reference']);
            $table->dropIndex(['wallet_id', 'created_at']);
            $table->dropIndex(['gateway']);
        });

        Schema::table('bill_payments', function (Blueprint $table) {
            $table->dropIndex(['vtpass_request_id']);
            $table->dropIndex(['service_type']);
            $table->dropIndex(['provider']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'created_at']);
            $table->dropIndex(['read_at']);
        });

        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->dropIndex(['is_default']);
        });

        Schema::table('referrals', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('referral_earnings', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });

        Schema::table('social_accounts', function (Blueprint $table) {
            $table->dropIndex(['provider', 'provider_id']);
        });

        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropIndex(['token']);
        });

        Schema::table('admin_users', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['role']);
        });
    }
};
