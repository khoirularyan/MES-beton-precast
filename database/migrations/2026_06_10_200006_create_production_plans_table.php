<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('public.production_plans', function (Blueprint $table) {
            $table->id();
            $table->string('plan_number', 30)->unique();
            $table->string('plan_level', 20); // MPS, Weekly, Daily
            $table->date('period_start');
            $table->date('period_end');
            $table->foreignId('product_id')
                ->constrained('global.production_products')
                ->restrictOnDelete();
            $table->decimal('planned_qty', 10, 2);
            $table->decimal('planned_volume_m3', 10, 3)->nullable();
            $table->foreignId('work_center_id')
                ->nullable()
                ->constrained('global.production_work_centers')
                ->nullOnDelete();
            $table->string('material_status', 30)->default('Not Ready');
            $table->string('capacity_status', 30)->default('Available');
            $table->string('status', 30)->default('Draft');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['plan_level', 'period_start', 'status']);
            $table->index(['product_id', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public.production_plans');
    }
};
