<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('available_balance', 15, 2)->default(0);
            $table->decimal('ledger_balance', 15, 2)->default(0);
            $table->decimal('cashback_balance', 15, 2)->default(0);
            $table->decimal('bonus_balance', 15, 2)->default(0);
            $table->boolean('is_locked')->default(false);
            $table->timestamp('locked_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallets');
    }
};
