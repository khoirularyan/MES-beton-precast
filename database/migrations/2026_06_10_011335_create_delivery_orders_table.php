<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('public.production_delivery_orders', function (Blueprint $table) {
            $table->id();
            $table->string('no', 30)->unique();
            $table->foreignId('sales_order_id')
                ->nullable()
                ->constrained('public.production_sales_orders')
                ->nullOnDelete();
            $table->foreignId('customer_id')
                ->constrained('global.production_customers')
                ->restrictOnDelete();
            $table->integer('qty');
            $table->string('truk', 100)->nullable();
            $table->string('driver', 100)->nullable();
            $table->date('tgl_kirim');
            $table->string('status', 30)->default('Dipersiapkan');
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public.production_delivery_orders');
    }
};
