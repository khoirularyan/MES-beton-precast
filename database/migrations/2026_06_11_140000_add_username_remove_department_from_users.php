<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: add nullable column so existing rows are not rejected
        Schema::table('global.production_users', function (Blueprint $table) {
            $table->string('username')->nullable()->after('name');
        });

        // Step 2: backfill existing rows — use the part before '@' in email
        DB::statement("UPDATE global.production_users SET username = LOWER(SPLIT_PART(email, '@', 1)) WHERE username IS NULL");

        // Step 3: handle any duplicates that resulted from the backfill
        DB::statement("UPDATE global.production_users SET username = username || '_' || id WHERE id IN (
            SELECT id FROM (
                SELECT id, ROW_NUMBER() OVER (PARTITION BY username ORDER BY id) AS rn
                FROM global.production_users
            ) sub WHERE rn > 1
        )");

        // Step 4: enforce NOT NULL + UNIQUE via raw SQL (no doctrine/dbal needed)
        DB::statement('ALTER TABLE global.production_users ALTER COLUMN username SET NOT NULL');
        DB::statement('ALTER TABLE global.production_users ADD CONSTRAINT production_users_username_unique UNIQUE (username)');

        Schema::table('global.production_users', function (Blueprint $table) {
            $table->dropColumn('department');
        });
    }

    public function down(): void
    {
        Schema::table('global.production_users', function (Blueprint $table) {
            $table->dropColumn('username');
            $table->string('department')->nullable()->after('role');
        });
    }
};
