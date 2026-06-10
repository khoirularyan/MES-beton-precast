<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('production_demands', function (Blueprint $table) {
            $table->id();
            $table->string('demand_number', 30)->unique();
            $table->string('source_type', 20); // Sales Order, MTS
            $table->foreignId('sales_order_id')
                ->nullable()
                ->constrained('production_sales_orders')
                ->nullOnDelete();
            $table->foreignId('sales_order_item_id')
                ->nullable()
                ->constrained('production_sales_order_items')
                ->nullOnDelete();
            $table->foreignId('product_id')
                ->constrained('production_products')
                ->restrictOnDelete();
            $table->decimal('demand_qty', 10, 2);
            $table->date('required_date');
            $table->integer('priority')->default(5); // 1 = highest
            $table->string('status', 30)->default('Open'); // Open, Planned, Cancelled, Closed
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['product_id', 'status']);
            $table->index(['required_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_demands');
    }
};
