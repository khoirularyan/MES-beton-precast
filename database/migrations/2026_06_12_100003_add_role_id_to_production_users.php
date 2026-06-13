<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Add role_id as nullable
        Schema::table('global.production_users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('role');
        });

        // Step 2: Backfill role_id from role string → user_roles
        DB::statement("
            UPDATE global.production_users u
            SET role_id = r.id
            FROM global.user_roles r
            WHERE u.role = r.kode
              AND u.role_id IS NULL
        ");

        // Step 3: Add FK constraint (nullable kept for backward compat)
        Schema::table('global.production_users', function (Blueprint $table) {
            $table->foreign('role_id')->references('id')->on('global.user_roles')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('global.production_users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
        });
    }
};
