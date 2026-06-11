<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('global.production_users', function (Blueprint $table) {
            $table->string('role')->default('user')->after('password');
            $table->string('department')->nullable()->after('role');
            $table->string('plant')->default('Plant Bekasi')->after('department');
            $table->boolean('is_active')->default(true)->after('plant');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('global.production_users', function (Blueprint $table) {
            $table->dropColumn(['role', 'department', 'plant', 'is_active']);
        });
    }
};
