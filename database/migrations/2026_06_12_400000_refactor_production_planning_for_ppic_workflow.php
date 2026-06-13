<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('public.production_plans', function (Blueprint $table) {
            $table->foreignId('demand_id')
                ->nullable()
                ->constrained('public.production_demands')
                ->nullOnDelete();
            $table->foreignId('mold_id')
                ->nullable()
                ->constrained('global.production_molds')
                ->nullOnDelete();
            $table->integer('mold_capacity_per_cycle')->nullable();
            $table->integer('required_batches')->nullable();
            $table->string('shift', 30)->nullable();
        });

        Schema::table('public.production_batches', function (Blueprint $table) {
            $table->foreignId('mold_id')
                ->nullable()
                ->constrained('global.production_molds')
                ->nullOnDelete();
            $table->integer('batch_sequence')->nullable();
            $table->foreignId('sales_order_id')
                ->nullable()
                ->constrained('public.production_sales_orders')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('public.production_plans', function (Blueprint $table) {
            $table->dropForeign(['demand_id']);
            $table->dropForeign(['mold_id']);
            $table->dropColumn(['demand_id', 'mold_id', 'mold_capacity_per_cycle', 'required_batches', 'shift']);
        });

        Schema::table('public.production_batches', function (Blueprint $table) {
            $table->dropForeign(['mold_id']);
            $table->dropForeign(['sales_order_id']);
            $table->dropColumn(['mold_id', 'batch_sequence', 'sales_order_id']);
        });
    }
};
