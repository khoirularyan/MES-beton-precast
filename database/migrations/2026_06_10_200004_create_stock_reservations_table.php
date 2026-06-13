<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('public.production_stock_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')
                ->constrained('public.production_sales_orders')
                ->cascadeOnDelete();
            $table->foreignId('sales_order_item_id')
                ->constrained('public.production_sales_order_items')
                ->cascadeOnDelete();
            $table->foreignId('inventory_batch_id')
                ->constrained('public.production_inventory_batches')
                ->cascadeOnDelete();
            $table->foreignId('product_id')
                ->constrained('global.production_products')
                ->restrictOnDelete();
            $table->decimal('reserved_qty', 10, 2);
            $table->timestamp('reservation_date')->useCurrent();
            $table->string('status', 30)->default('Active');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['sales_order_id', 'status']);
            $table->index(['inventory_batch_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public.production_stock_reservations');
    }
};
