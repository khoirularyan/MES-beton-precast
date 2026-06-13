<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 1. Enhance global.production_bom_headers
        Schema::table('global.production_bom_headers', function (Blueprint $table) {
            if (Schema::hasColumn('global.production_bom_headers', 'versi')) {
                $table->renameColumn('versi', 'version');
            }
            if (Schema::hasColumn('global.production_bom_headers', 'catatan')) {
                $table->renameColumn('catatan', 'notes');
            }
            
            $table->string('status', 20)->default('draft'); // draft, active, archived
            $table->decimal('output_qty', 12, 4)->default(1.0000);
            $table->string('output_uom', 20)->default('PCS');
            $table->bigInteger('total_material_cost')->default(0);
            $table->bigInteger('total_waste_cost')->default(0);
        });

        // Alter column size to 20 for version in postgres
        if (Schema::connection(null)->getConnection()->getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE global.production_bom_headers ALTER COLUMN version TYPE VARCHAR(20)");
        }

        // Migrate existing data only if is_active exists
        if (Schema::hasColumn('global.production_bom_headers', 'is_active')) {
            DB::table('global.production_bom_headers')->where('is_active', true)->update(['status' => 'active']);
            DB::table('global.production_bom_headers')->where('is_active', false)->update(['status' => 'draft']);

            Schema::table('global.production_bom_headers', function (Blueprint $table) {
                $table->dropColumn('is_active');
            });
        }

        // Add conditional unique constraint for active BOMs
        if (Schema::connection(null)->getConnection()->getDriverName() === 'sqlite') {
            Schema::table('global.production_bom_headers', function (Blueprint $table) {
                $table->unique(['product_id', 'status']);
            });
        } else {
            // Drop index if exists to avoid duplication
            DB::statement("DROP INDEX IF EXISTS unique_active_bom_per_product");
            DB::statement("CREATE UNIQUE INDEX unique_active_bom_per_product ON global.production_bom_headers (product_id) WHERE status = 'active' AND deleted_at IS NULL");
        }

        // 2. Enhance global.production_bom_items
        Schema::table('global.production_bom_items', function (Blueprint $table) {
            $table->string('material_type', 30)->nullable(); // Raw Material, Reinforcement, Chemical, Consumable
            $table->bigInteger('harga_snapshot')->default(0);
            
            $table->unique(['bom_header_id', 'material_id']);
        });
    }

    public function down(): void
    {
        // Drop unique constraints
        if (Schema::connection(null)->getConnection()->getDriverName() === 'sqlite') {
            Schema::table('global.production_bom_headers', function (Blueprint $table) {
                $table->dropUnique(['product_id', 'status']);
            });
        } else {
            DB::statement("DROP INDEX IF EXISTS unique_active_bom_per_product");
        }

        Schema::table('global.production_bom_items', function (Blueprint $table) {
            $table->dropUnique(['bom_header_id', 'material_id']);
            $table->dropColumn(['material_type', 'harga_snapshot']);
        });

        Schema::table('global.production_bom_headers', function (Blueprint $table) {
            $table->boolean('is_active')->default(true);
        });

        DB::table('global.production_bom_headers')->where('status', 'active')->update(['is_active' => true]);
        DB::table('global.production_bom_headers')->where('status', 'draft')->update(['is_active' => false]);

        Schema::table('global.production_bom_headers', function (Blueprint $table) {
            $table->renameColumn('version', 'versi');
            $table->renameColumn('notes', 'catatan');
            $table->dropColumn(['status', 'output_qty', 'output_uom', 'total_material_cost', 'total_waste_cost']);
        });
    }
};
