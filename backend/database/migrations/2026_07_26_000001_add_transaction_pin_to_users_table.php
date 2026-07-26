<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('transaction_pin', 255)->nullable()->after('two_factor_secret');
            $table->timestamp('pin_set_at')->nullable()->after('transaction_pin');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['transaction_pin', 'pin_set_at']);
        });
    }
};
