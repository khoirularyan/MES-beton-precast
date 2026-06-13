<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 1. Create global.product_allowed_molds table
        Schema::create('global.product_allowed_molds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')
                ->constrained('global.production_products')
                ->onDelete('cascade');
            $table->foreignId('mold_id')
                ->constrained('global.production_molds')
                ->onDelete('cascade');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->unique(['product_id', 'mold_id'], 'product_mold_unique');
        });

        // 2. Refactor global.production_molds table columns
        Schema::table('global.production_molds', function (Blueprint $table) {
            // Rename columns using raw SQL to ensure maximum compatibility and bypass Doctrine DBAL dependency issues
            if (Schema::hasColumn('global.production_molds', 'jumlah') && !Schema::hasColumn('global.production_molds', 'jumlah_total')) {
                DB::statement('ALTER TABLE global.production_molds RENAME COLUMN jumlah TO jumlah_total');
            }
            if (Schema::hasColumn('global.production_molds', 'aktif') && !Schema::hasColumn('global.production_molds', 'jumlah_aktif')) {
                DB::statement('ALTER TABLE global.production_molds RENAME COLUMN aktif TO jumlah_aktif');
            }
        });

        // 3. Add snapshots to public.production_plans
        Schema::table('public.production_plans', function (Blueprint $table) {
            if (!Schema::hasColumn('public.production_plans', 'daily_capacity')) {
                $table->integer('daily_capacity')->default(0)->after('mold_capacity_snapshot');
            }
            if (!Schema::hasColumn('public.production_plans', 'required_days')) {
                $table->integer('required_days')->default(0)->after('daily_capacity');
            }
        });
    }

    public function down(): void
    {
        Schema::table('public.production_plans', function (Blueprint $table) {
            if (Schema::hasColumn('public.production_plans', 'daily_capacity')) {
                $table->dropColumn('daily_capacity');
            }
            if (Schema::hasColumn('public.production_plans', 'required_days')) {
                $table->dropColumn('required_days');
            }
        });

        Schema::table('global.production_molds', function (Blueprint $table) {
            if (Schema::hasColumn('global.production_molds', 'jumlah_total') && !Schema::hasColumn('global.production_molds', 'jumlah')) {
                DB::statement('ALTER TABLE global.production_molds RENAME COLUMN jumlah_total TO jumlah');
            }
            if (Schema::hasColumn('global.production_molds', 'jumlah_aktif') && !Schema::hasColumn('global.production_molds', 'aktif')) {
                DB::statement('ALTER TABLE global.production_molds RENAME COLUMN jumlah_aktif TO aktif');
            }
        });

        Schema::dropIfExists('global.product_allowed_molds');
    }
};
