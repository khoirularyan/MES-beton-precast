<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('global.user_roles', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 50)->unique()->comment('Role key: super_admin, admin, etc.');
            $table->string('nama', 100)->comment('Display name: Super Admin, Admin, etc.');
            $table->string('deskripsi', 255)->nullable();
            $table->boolean('is_system')->default(false)->comment('System roles cannot be deleted');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('global.user_roles');
    }
};
