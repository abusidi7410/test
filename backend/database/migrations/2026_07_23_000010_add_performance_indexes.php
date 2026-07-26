<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private function addIndexIfMissing(string $table, $columns, bool $unique = false): void
    {
        $indexName = is_array($columns)
            ? $table . '_' . implode('_', $columns) . '_index'
            : $table . '_' . $columns . '_index';

        if ($unique) {
            $indexName = is_array($columns)
                ? $table . '_' . implode('_', $columns) . '_unique'
                : $table . '_' . $columns . '_unique';
        }

        $exists = DB::select(
            "SELECT 1 FROM pg_indexes WHERE tablename = ? AND indexname = ?",
            [$table, $indexName]
        );

        if (empty($exists)) {
            Schema::table($table, function (Blueprint $table) use ($columns, $unique) {
                if ($unique) {
                    $table->unique($columns);
                } else {
                    $table->index($columns);
                }
            });
        }
    }

    public function up(): void
    {
        // transactions indexes
        foreach (['category', 'type', 'reference', 'provider_reference', 'gateway'] as $col) {
            $this->addIndexIfMissing('transactions', $col);
        }
        $this->addIndexIfMissing('transactions', ['user_id', 'created_at']);
        $this->addIndexIfMissing('transactions', ['status', 'created_at']);
        $this->addIndexIfMissing('transactions', ['wallet_id', 'created_at']);

        // bill_payments indexes
        foreach (['vtpass_request_id', 'service_type', 'provider'] as $col) {
            $this->addIndexIfMissing('bill_payments', $col);
        }

        // notifications indexes
        $this->addIndexIfMissing('notifications', ['user_id', 'created_at']);
        $this->addIndexIfMissing('notifications', 'read_at');

        // bank_accounts indexes
        $this->addIndexIfMissing('bank_accounts', 'is_default');

        // referrals indexes
        $this->addIndexIfMissing('referrals', 'status');

        // referral_earnings indexes
        $this->addIndexIfMissing('referral_earnings', 'user_id');

        // social_accounts unique constraint
        $this->addIndexIfMissing('social_accounts', ['provider', 'provider_id'], true);

        // personal_access_tokens indexes
        $this->addIndexIfMissing('personal_access_tokens', 'token');

        // admin_users indexes
        $this->addIndexIfMissing('admin_users', 'status');
        $this->addIndexIfMissing('admin_users', 'role');
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
