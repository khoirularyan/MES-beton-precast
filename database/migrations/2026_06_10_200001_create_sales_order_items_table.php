<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('production_sales_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')
                ->constrained('production_sales_orders')
                ->cascadeOnDelete();
            $table->foreignId('product_id')
                ->constrained('production_products')
                ->restrictOnDelete();
            $table->decimal('qty_ordered', 10, 2);
            $table->decimal('qty_reserved', 10, 2)->default(0);
            $table->decimal('qty_to_produce', 10, 2)->default(0);
            $table->decimal('qty_produced', 10, 2)->default(0);
            $table->decimal('qty_delivered', 10, 2)->default(0);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->date('delivery_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_sales_order_items');
    }
};
