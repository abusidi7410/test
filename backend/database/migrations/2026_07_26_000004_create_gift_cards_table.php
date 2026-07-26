<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gift_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->index();
            $table->foreignId('transaction_id')->nullable()->index();
            $table->string('card_name');
            $table->string('card_number');
            $table->string('card_pin')->nullable();
            $table->decimal('card_value', 15, 2);
            $table->decimal('exchange_rate', 10, 4);
            $table->decimal('naira_value', 15, 2);
            $table->string('status')->default('active');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->restrictOnDelete();
            $table->foreign('transaction_id')->references('id')->on('transactions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gift_cards');
    }
};
