<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vtu_providers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('logo')->nullable();
            $table->string('base_url');
            $table->text('api_key')->nullable();
            $table->text('public_key')->nullable();
            $table->text('secret_key')->nullable();
            $table->text('username')->nullable();
            $table->text('password')->nullable();
            $table->text('authorization_token')->nullable();
            $table->text('webhook_secret')->nullable();
            $table->string('environment')->default('sandbox');
            $table->string('status')->default('active');
            $table->integer('priority')->default(0);
            $table->boolean('is_default')->default(false);
            $table->json('supported_services')->nullable();
            $table->integer('total_requests')->default(0);
            $table->integer('successful_requests')->default(0);
            $table->integer('failed_requests')->default(0);
            $table->integer('pending_requests')->default(0);
            $table->decimal('avg_response_time_ms', 10, 2)->nullable();
            $table->timestamp('last_health_check_at')->nullable();
            $table->json('health_check_response')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('priority');
            $table->index('is_default');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vtu_providers');
    }
};
