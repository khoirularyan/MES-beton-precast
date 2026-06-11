<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('public.production_inventory_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_number', 50)->unique();
            $table->foreignId('product_id')
                ->constrained('global.production_products')
                ->restrictOnDelete();
            $table->string('warehouse', 50)->default('WH-FG');
            $table->string('location', 100)->nullable();
            $table->date('production_date');
            $table->decimal('qty_on_hand', 10, 2)->default(0);
            $table->decimal('qty_reserved', 10, 2)->default(0);
            $table->string('status', 30)->default('Available');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['product_id', 'status']);
            $table->index('production_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public.production_inventory_batches');
    }
};
