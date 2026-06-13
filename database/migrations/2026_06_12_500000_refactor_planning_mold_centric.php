<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Add kapasitas_per_siklus to molds table
        Schema::table('global.production_molds', function (Blueprint $table) {
            if (!Schema::hasColumn('global.production_molds', 'kapasitas_per_siklus')) {
                $table->integer('kapasitas_per_siklus')->default(1)->after('utilisasi');
            }
        });

        // Refactor production_plans to be mold-centric
        Schema::table('public.production_plans', function (Blueprint $table) {
            // Add sales_order_id for direct reference
            if (!Schema::hasColumn('public.production_plans', 'sales_order_id')) {
                $table->foreignId('sales_order_id')
                    ->nullable()
                    ->after('plan_number')
                    ->constrained('public.production_sales_orders')
                    ->nullOnDelete();
            }

            // Make mold_id required (not nullable anymore)
            // Add mold_capacity_snapshot to preserve capacity at planning time
            if (!Schema::hasColumn('public.production_plans', 'mold_capacity_snapshot')) {
                $table->integer('mold_capacity_snapshot')->nullable()->after('mold_capacity_per_cycle');
            }

            // Add demand_qty to preserve quantity at planning time
            if (!Schema::hasColumn('public.production_plans', 'demand_qty')) {
                $table->decimal('demand_qty', 10, 2)->nullable()->after('planned_qty');
            }

            // Add start_date and end_date for date range
            if (!Schema::hasColumn('public.production_plans', 'start_date')) {
                $table->date('start_date')->nullable()->after('period_end');
            }
            if (!Schema::hasColumn('public.production_plans', 'end_date')) {
                $table->date('end_date')->nullable()->after('start_date');
            }

            // Simplify status: Scheduled, Completed, Cancelled
            // Drop unnecessary statuses columns if they exist
            $table->string('status', 30)->default('Scheduled')->change();
        });

        // Refactor production_batches to be mold-centric
        Schema::table('public.production_batches', function (Blueprint $table) {
            // Add planned_date (single date, not datetime range for simple scheduling)
            if (!Schema::hasColumn('public.production_batches', 'planned_date')) {
                $table->date('planned_date')->nullable()->after('planned_end');
            }

            // Simplify status: Planned, In Progress, QC Pending, Completed, Delivered, Cancelled
            $table->string('status', 30)->default('Planned')->change();
        });

        // Update existing data to use new date fields
        DB::statement("
            UPDATE public.production_plans 
            SET start_date = period_start, 
                end_date = period_end 
            WHERE start_date IS NULL
        ");

        DB::statement("
            UPDATE public.production_batches 
            SET planned_date = DATE(planned_start) 
            WHERE planned_date IS NULL AND planned_start IS NOT NULL
        ");
    }

    public function down(): void
    {
        Schema::table('global.production_molds', function (Blueprint $table) {
            if (Schema::hasColumn('global.production_molds', 'kapasitas_per_siklus')) {
                $table->dropColumn('kapasitas_per_siklus');
            }
        });

        Schema::table('public.production_plans', function (Blueprint $table) {
            if (Schema::hasColumn('public.production_plans', 'sales_order_id')) {
                $table->dropForeign(['sales_order_id']);
                $table->dropColumn('sales_order_id');
            }
            if (Schema::hasColumn('public.production_plans', 'mold_capacity_snapshot')) {
                $table->dropColumn('mold_capacity_snapshot');
            }
            if (Schema::hasColumn('public.production_plans', 'demand_qty')) {
                $table->dropColumn('demand_qty');
            }
            if (Schema::hasColumn('public.production_plans', 'start_date')) {
                $table->dropColumn('start_date');
            }
            if (Schema::hasColumn('public.production_plans', 'end_date')) {
                $table->dropColumn('end_date');
            }
        });

        Schema::table('public.production_batches', function (Blueprint $table) {
            if (Schema::hasColumn('public.production_batches', 'planned_date')) {
                $table->dropColumn('planned_date');
            }
        });
    }
};
