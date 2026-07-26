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
            ? $table . '_' . implode('_', $columns) . '_idx'
            : $table . '_' . $columns . '_idx';

        if ($unique) {
            $indexName .= '_uniq';
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
        // Composite indexes for admin dashboard aggregate queries
        $this->addIndexIfMissing('transactions', ['status', 'type', 'amount']);
        $this->addIndexIfMissing('transactions', ['status', 'charge', 'type']);

        // Indexes for user search in admin
        $this->addIndexIfMissing('users', ['first_name', 'last_name']);
        $this->addIndexIfMissing('users', 'email');
        $this->addIndexIfMissing('users', 'status');
        $this->addIndexIfMissing('users', 'created_at');

        // Wallet lookups
        $this->addIndexIfMissing('wallets', 'user_id');
        $this->addIndexIfMissing('wallets', 'available_balance');

        // Notification unread count optimization
        $this->addIndexIfMissing('notifications', ['user_id', 'read_at']);

        // Support tickets admin queries
        $this->addIndexIfMissing('support_tickets', ['status', 'created_at']);
        $this->addIndexIfMissing('support_tickets', 'assigned_to');

        // Audit logs
        $this->addIndexIfMissing('audit_logs', ['user_id', 'created_at']);
        $this->addIndexIfMissing('audit_logs', 'event');

        // Admin activity logs
        $this->addIndexIfMissing('admin_activity_logs', ['admin_id', 'created_at']);

        // System settings fast lookup
        $this->addIndexIfMissing('system_settings', ['group_name', 'key_name'], true);

        // Personal access tokens - ensure fast token lookup
        $this->addIndexIfMissing('personal_access_tokens', ['token', 'tokenable_type', 'tokenable_id']);

        // Transaction date index for spending summary queries
        $this->addIndexIfMissing('transactions', ['user_id', 'type', 'status', 'created_at']);
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['status', 'type', 'amount']);
            $table->dropIndex(['status', 'charge', 'type']);
            $table->dropIndex(['user_id', 'type', 'status', 'created_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['first_name', 'last_name']);
            $table->dropIndex('email');
            $table->dropIndex('status');
            $table->dropIndex('created_at');
        });

        Schema::table('wallets', function (Blueprint $table) {
            $table->dropIndex('user_id');
            $table->dropIndex('available_balance');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'read_at']);
        });

        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
            $table->dropIndex('assigned_to');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'created_at']);
            $table->dropIndex('event');
        });

        Schema::table('admin_activity_logs', function (Blueprint $table) {
            $table->dropIndex(['admin_id', 'created_at']);
        });

        Schema::table('system_settings', function (Blueprint $table) {
            $table->dropIndex(['group_name', 'key_name']);
        });

        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropIndex(['token', 'tokenable_type', 'tokenable_id']);
        });
    }
};
