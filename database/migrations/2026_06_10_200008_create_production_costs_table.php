<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('production_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_batch_id')
                ->constrained('production_batches')
                ->cascadeOnDelete();
            $table->decimal('estimated_material_cost', 15, 2)->default(0);
            $table->decimal('estimated_labor_cost', 15, 2)->default(0);
            $table->decimal('estimated_overhead_cost', 15, 2)->default(0);
            $table->decimal('actual_material_cost', 15, 2)->default(0);
            $table->decimal('actual_labor_cost', 15, 2)->default(0);
            $table->decimal('actual_overhead_cost', 15, 2)->default(0);
            // variance = actual_total - estimated_total
            $table->decimal('variance_amount', 15, 2)->default(0);
            $table->decimal('variance_percent', 8, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_costs');
    }
};
