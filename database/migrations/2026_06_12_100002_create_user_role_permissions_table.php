<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('global.user_role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('global.user_roles')->cascadeOnDelete();
            $table->foreignId('module_id')->constrained('global.system_modules')->cascadeOnDelete();

            // Permission flags
            $table->boolean('can_view')->default(false);
            $table->boolean('can_create')->default(false);
            $table->boolean('can_update')->default(false);
            $table->boolean('can_delete')->default(false);
            $table->boolean('can_approve')->default(false);

            $table->timestamps();

            // One row per role+module
            $table->unique(['role_id', 'module_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('global.user_role_permissions');
    }
};
