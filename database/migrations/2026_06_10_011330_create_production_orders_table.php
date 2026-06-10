<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('production_orders', function (Blueprint $table) {
            $table->id();
            $table->string('no', 30)->unique();
            $table->foreignId('sales_order_id')
                ->nullable()
                ->constrained('production_sales_orders')
                ->nullOnDelete();
            $table->foreignId('product_id')
                ->constrained('production_products')
                ->restrictOnDelete();
            $table->foreignId('line_id')
                ->nullable()
                ->constrained('production_lines')
                ->nullOnDelete();
            $table->integer('qty');
            $table->integer('qty_selesai')->default(0);
            $table->integer('progress')->default(0); // 0-100
            // Direncanakan → Casting → Curing → Demoulding → QC → Selesai
            $table->string('status', 30)->default('Direncanakan');
            $table->string('prioritas', 20)->default('Sedang');
            $table->date('tgl_mulai');
            $table->date('tgl_selesai');
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_orders');
    }
};
