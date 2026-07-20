<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('wallet_id')->constrained()->cascadeOnDelete();
            $table->string('category');
            $table->string('type');
            $table->decimal('amount', 15, 2);
            $table->decimal('charge', 15, 2)->default(0);
            $table->decimal('previous_balance', 15, 2);
            $table->decimal('current_balance', 15, 2);
            $table->string('status')->default('pending');
            $table->string('description')->nullable();
            $table->string('reference')->unique();
            $table->string('provider_reference')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->index(['user_id', 'category']);
            $table->index(['user_id', 'status']);
            $table->index('reference');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
