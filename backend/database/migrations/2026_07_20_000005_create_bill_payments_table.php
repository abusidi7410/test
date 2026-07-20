<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bill_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained()->cascadeOnDelete();
            $table->string('service_type');
            $table->string('provider');
            $table->string('customer_id');
            $table->string('package')->nullable();
            $table->integer('quantity')->default(1);
            $table->string('vtpass_request_id')->nullable();
            $table->json('vtpass_response')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_payments');
    }
};
