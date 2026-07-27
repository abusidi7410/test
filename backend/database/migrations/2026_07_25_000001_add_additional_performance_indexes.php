<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Check if an index/constraint already exists.
     */
    private function indexExists(string $table, string $index): bool
    {
        return DB::table('pg_indexes')
            ->where('tablename', $table)
            ->where('indexname', $index)
            ->exists();
    }

    /**
     * Add a normal index if it doesn't already exist.
     */
    private function addIndexIfMissing(string $table, $columns): void
    {
        $columns = (array) $columns;

        $indexName = $table . '_' . implode('_', $columns) . '_index';

        if (!$this->indexExists($table, $indexName)) {
            Schema::table($table, function (Blueprint $table) use ($columns, $indexName) {
                $table->index($columns, $indexName);
            });
        }
    }

    /**
     * Add a unique index if it doesn't already exist.
     */
    private function addUniqueIfMissing(string $table, $columns): void
    {
        $columns = (array) $columns;

        $indexName = $table . '_' . implode('_', $columns) . '_unique';

        if (!$this->indexExists($table, $indexName)) {
            Schema::table($table, function (Blueprint $table) use ($columns, $indexName) {
                $table->unique($columns, $indexName);
            });
        }
    }

    public function up(): void
    {
        $this->addIndexIfMissing('transactions', ['status', 'type', 'amount']);
        $this->addIndexIfMissing('transactions', ['status', 'charge', 'type']);

        $this->addIndexIfMissing('users', ['first_name', 'last_name']);
        $this->addIndexIfMissing('users', 'email');
        $this->addIndexIfMissing('users', 'status');
        $this->addIndexIfMissing('users', 'created_at');

        $this->addIndexIfMissing('wallets', 'user_id');
        $this->addIndexIfMissing('wallets', 'available_balance');

        $this->addIndexIfMissing('notifications', ['user_id', 'read_at']);

        $this->addIndexIfMissing('support_tickets', ['status', 'created_at']);
        $this->addIndexIfMissing('support_tickets', 'assigned_to');

        $this->addIndexIfMissing('audit_logs', ['user_id', 'created_at']);
        $this->addIndexIfMissing('audit_logs', 'event');

        $this->addIndexIfMissing('admin_activity_logs', ['admin_id', 'created_at']);

        $this->addUniqueIfMissing('system_settings', ['group_name', 'key_name']);

        $this->addIndexIfMissing(
            'personal_access_tokens',
            ['token', 'tokenable_type', 'tokenable_id']
        );

        $this->addIndexIfMissing(
            'transactions',
            ['user_id', 'type', 'status', 'created_at']
        );
    }

    public function down(): void
    {
        // Intentionally left empty.
    }
};