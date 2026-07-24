<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('group_name')->index();
            $table->string('key_name')->index();
            $table->text('value')->nullable();
            $table->string('type')->default('text');
            $table->string('description')->nullable();
            $table->timestamps();

            $table->unique(['group_name', 'key_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
