<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'transaction_pin')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('transaction_pin')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'transaction_pin')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('transaction_pin');
            });
        }
    }
};