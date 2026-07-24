<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('gateway')->nullable()->after('provider_reference');
            $table->decimal('fees', 15, 2)->default(0)->after('charge');
            $table->string('customer_email')->nullable()->after('gateway');
            $table->string('customer_id')->nullable()->after('customer_email');
            $table->string('payment_channel')->nullable()->after('customer_id');
            $table->string('currency', 10)->default('NGN')->after('payment_channel');
            $table->timestamp('paid_at')->nullable()->after('currency');
            $table->json('webhook_payload')->nullable()->after('metadata');

            $table->index('gateway');
            $table->index('customer_id');
            $table->index('paid_at');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['gateway', 'customer_id', 'paid_at']);
            $table->dropColumn([
                'gateway', 'fees', 'customer_email', 'customer_id',
                'payment_channel', 'currency', 'paid_at', 'webhook_payload',
            ]);
        });
    }
};
