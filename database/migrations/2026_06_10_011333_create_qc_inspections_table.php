<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('public.production_qc_inspections', function (Blueprint $table) {
            $table->id();
            $table->string('no', 30)->unique();
            $table->foreignId('production_order_id')
                ->nullable()
                ->constrained('public.production_orders')
                ->nullOnDelete();
            $table->foreignId('product_id')
                ->constrained('global.production_products')
                ->restrictOnDelete();
            $table->integer('qty');
            $table->integer('dimensi_ok')->default(0);
            $table->integer('dimensi_reject')->default(0);
            $table->decimal('kuat_tekan', 6, 2)->nullable(); // MPa
            $table->string('status', 30)->default('Pending');
            $table->string('inspektur', 100)->nullable();
            $table->date('tanggal');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public.production_qc_inspections');
    }
};
