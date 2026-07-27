<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Check if an index already exists (PostgreSQL).
     */
    private function indexExists(string $table, string $index): bool
    {
        return DB::selectOne(
            "
            SELECT 1
            FROM pg_indexes
            WHERE schemaname = 'public'
              AND tablename = ?
              AND indexname = ?
            ",
            [$table, $index]
        ) !== null;
    }

    /**
     * Create a normal index only if it doesn't already exist.
     */
    private function addIndexIfMissing(string $table, $columns): void
    {
        $columns = (array) $columns;

        $indexName = $table . '_' . implode('_', $columns) . '_index';

        if (!$this->indexExists($table, $indexName)) {
            Schema::table($table, function (Blueprint $tableBlueprint) use ($columns, $indexName) {
                $tableBlueprint->index($columns, $indexName);
            });
        }
    }

    /**
     * Create a unique index only if it doesn't already exist.
     */
    private function addUniqueIfMissing(string $table, $columns): void
    {
        $columns = (array) $columns;

        $indexName = $table . '_' . implode('_', $columns) . '_unique';

        if (!$this->indexExists($table, $indexName)) {
            Schema::table($table, function (Blueprint $tableBlueprint) use ($columns, $indexName) {
                $tableBlueprint->unique($columns, $indexName);
            });
        }
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Transactions
        $this->addIndexIfMissing('transactions', ['status', 'type', 'amount']);
        $this->addIndexIfMissing('transactions', ['status', 'charge', 'type']);
        $this->addIndexIfMissing('transactions', ['user_id', 'type', 'status', 'created_at']);

        // Users
        $this->addIndexIfMissing('users', ['first_name', 'last_name']);
        $this->addIndexIfMissing('users', 'email');
        $this->addIndexIfMissing('users', 'status');
        $this->addIndexIfMissing('users', 'created_at');

        // Wallets
        $this->addIndexIfMissing('wallets', 'user_id');
        $this->addIndexIfMissing('wallets', 'available_balance');

        // Notifications
        $this->addIndexIfMissing('notifications', ['user_id', 'read_at']);

        // Support tickets
        $this->addIndexIfMissing('support_tickets', ['status', 'created_at']);
        $this->addIndexIfMissing('support_tickets', 'assigned_to');

        // Audit logs
        $this->addIndexIfMissing('audit_logs', ['user_id', 'created_at']);
        $this->addIndexIfMissing('audit_logs', 'event');

        // Admin activity
        $this->addIndexIfMissing('admin_activity_logs', ['admin_id', 'created_at']);

        // System settings
        $this->addUniqueIfMissing('system_settings', ['group_name', 'key_name']);

        // Personal access tokens
        $this->addIndexIfMissing(
            'personal_access_tokens',
            ['token', 'tokenable_type', 'tokenable_id']
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We intentionally do not remove indexes automatically.
    }
};