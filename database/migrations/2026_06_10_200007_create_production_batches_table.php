<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('production_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_number', 50)->unique();
            $table->foreignId('production_plan_id')
                ->nullable()
                ->constrained('production_plans')
                ->nullOnDelete();
            $table->foreignId('demand_id')
                ->nullable()
                ->constrained('production_demands')
                ->nullOnDelete();
            $table->string('source_type', 20); // SO, MTS
            $table->foreignId('product_id')
                ->constrained('production_products')
                ->restrictOnDelete();
            $table->string('routing_version', 30)->nullable();
            $table->decimal('target_qty', 10, 2);
            $table->decimal('actual_qty', 10, 2)->default(0);
            $table->decimal('target_volume_m3', 10, 3)->nullable();
            $table->timestamp('planned_start')->nullable();
            $table->timestamp('planned_end')->nullable();
            $table->timestamp('actual_start')->nullable();
            $table->timestamp('actual_end')->nullable();
            $table->foreignId('work_center_id')
                ->nullable()
                ->constrained('production_work_centers')
                ->nullOnDelete();
            // Planned, Released, In Progress, QC Pending, Completed, Closed
            $table->string('status', 30)->default('Planned');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['product_id', 'status']);
            $table->index(['planned_start', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_batches');
    }
};
