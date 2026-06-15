<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. global.production_work_centers
        Schema::table('global.production_work_centers', function (Blueprint $table) {
            $table->decimal('standard_labor_rate_per_m3', 15, 2)->default(0)->after('is_active');
            $table->decimal('standard_overhead_rate_per_m3', 15, 2)->default(0)->after('standard_labor_rate_per_m3');
        });

        // 2. public.production_batches
        Schema::table('public.production_batches', function (Blueprint $table) {
            $table->foreignId('bom_header_id')
                ->nullable()
                ->after('mold_id')
                ->constrained('global.production_bom_headers')
                ->restrictOnDelete();
            $table->string('bom_version_snapshot', 20)->nullable()->after('bom_header_id');
            $table->decimal('labor_rate_snapshot', 15, 2)->default(0)->after('bom_version_snapshot');
            $table->decimal('overhead_rate_snapshot', 15, 2)->default(0)->after('labor_rate_snapshot');
        });

        // 3. public.production_costs
        Schema::table('public.production_costs', function (Blueprint $table) {
            $table->decimal('material_cost', 15, 2)->default(0)->after('actual_overhead_cost');
            $table->decimal('labor_cost', 15, 2)->default(0)->after('material_cost');
            $table->decimal('overhead_cost', 15, 2)->default(0)->after('labor_cost');
            $table->decimal('total_cost', 15, 2)->default(0)->after('overhead_cost');
            $table->decimal('cost_per_unit', 15, 2)->default(0)->after('total_cost');
            $table->decimal('cost_per_m3', 15, 2)->default(0)->after('cost_per_unit');
        });

        // 4. public.production_inventory_batches
        Schema::table('public.production_inventory_batches', function (Blueprint $table) {
            $table->foreignId('production_batch_id')
                ->nullable()
                ->after('notes')
                ->constrained('public.production_batches')
                ->nullOnDelete();
            $table->decimal('total_cost', 15, 2)->default(0)->after('production_batch_id');
            $table->decimal('cost_per_unit', 15, 2)->default(0)->after('total_cost');
            $table->decimal('cost_per_m3', 15, 2)->default(0)->after('cost_per_unit');
        });
    }

    public function down(): void
    {
        Schema::table('public.production_inventory_batches', function (Blueprint $table) {
            $table->dropForeign(['production_batch_id']);
            $table->dropColumn(['production_batch_id', 'total_cost', 'cost_per_unit', 'cost_per_m3']);
        });

        Schema::table('public.production_costs', function (Blueprint $table) {
            $table->dropColumn(['material_cost', 'labor_cost', 'overhead_cost', 'total_cost', 'cost_per_unit', 'cost_per_m3']);
        });

        Schema::table('public.production_batches', function (Blueprint $table) {
            $table->dropForeign(['bom_header_id']);
            $table->dropColumn(['bom_header_id', 'bom_version_snapshot', 'labor_rate_snapshot', 'overhead_rate_snapshot']);
        });

        Schema::table('global.production_work_centers', function (Blueprint $table) {
            $table->dropColumn(['standard_labor_rate_per_m3', 'standard_overhead_rate_per_m3']);
        });
    }
};
