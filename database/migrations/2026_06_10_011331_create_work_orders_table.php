<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('public.production_work_orders', function (Blueprint $table) {
            $table->id();
            $table->string('no', 30)->unique();
            $table->foreignId('production_order_id')
                ->nullable()
                ->constrained('public.production_orders')
                ->nullOnDelete();
            $table->foreignId('product_id')
                ->constrained('global.production_products')
                ->restrictOnDelete();
            $table->foreignId('line_id')
                ->nullable()
                ->constrained('global.production_lines')
                ->nullOnDelete();
            $table->string('batch_no', 50)->nullable();
            $table->integer('qty');
            $table->integer('qty_selesai')->default(0);
            $table->integer('progress')->default(0);
            $table->string('status', 30)->default('SCHEDULED');
            $table->string('prioritas', 20)->default('NORMAL');
            $table->date('tgl_mulai');
            $table->date('tgl_selesai');
            $table->string('plant', 50)->nullable();
            $table->string('shift', 30)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public.production_work_orders');
    }
};
