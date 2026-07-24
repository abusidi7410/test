<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_broadcasts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('message');
            $table->string('type');
            $table->string('target');
            $table->json('target_users')->nullable();
            $table->json('target_roles')->nullable();
            $table->foreignId('sent_by');
            $table->timestamp('sent_at')->nullable();
            $table->integer('recipients_count')->default(0);
            $table->string('status');
            $table->timestamps();

            $table->foreign('sent_by')->references('id')->on('admin_users')->restrictOnDelete();

            $table->index('status');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_broadcasts');
    }
};
