<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('production_curing_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch', 30)->unique();
            $table->foreignId('production_order_id')
                ->nullable()
                ->constrained('production_orders')
                ->nullOnDelete();
            $table->foreignId('product_id')
                ->constrained('production_products')
                ->restrictOnDelete();
            $table->integer('qty');
            $table->string('chamber', 30)->nullable();
            $table->timestamp('mulai')->nullable();
            $table->timestamp('target_selesai')->nullable();
            $table->timestamp('selesai_aktual')->nullable();
            $table->decimal('suhu', 5, 1)->nullable();       // °C
            $table->decimal('kelembaban', 5, 1)->nullable(); // %
            $table->integer('progress')->default(0);
            // Berjalan, Selesai, Gagal
            $table->string('status', 30)->default('Berjalan');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_curing_batches');
    }
};
