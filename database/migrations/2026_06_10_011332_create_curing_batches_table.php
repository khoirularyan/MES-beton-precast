<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('public.production_curing_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch', 30)->unique();
            $table->foreignId('production_order_id')
                ->nullable()
                ->constrained('public.production_orders')
                ->nullOnDelete();
            $table->foreignId('product_id')
                ->constrained('global.production_products')
                ->restrictOnDelete();
            $table->integer('qty');
            $table->string('chamber', 30)->nullable();
            $table->timestamp('mulai')->nullable();
            $table->timestamp('target_selesai')->nullable();
            $table->timestamp('selesai_aktual')->nullable();
            $table->decimal('suhu', 5, 1)->nullable();       // °C
            $table->decimal('kelembaban', 5, 1)->nullable(); // %
            $table->integer('progress')->default(0);
            $table->string('status', 30)->default('Berjalan');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public.production_curing_batches');
    }
};
