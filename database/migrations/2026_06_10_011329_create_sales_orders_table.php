<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('public.production_sales_orders', function (Blueprint $table) {
            $table->id();
            $table->string('no', 30)->unique();
            $table->string('so_type', 10)->default('MTO'); // MTO / MTS
            $table->foreignId('customer_id')
                ->constrained('global.production_customers')
                ->restrictOnDelete();
            $table->foreignId('product_id')
                ->constrained('global.production_products')
                ->restrictOnDelete();
            $table->integer('qty');
            $table->bigInteger('nilai')->default(0);      // nilai kontrak (IDR)
            $table->date('tgl_order');
            $table->date('tgl_kirim');
            $table->string('status', 30)->default('Draft');
            $table->string('prioritas', 20)->default('Sedang'); // Rendah, Sedang, Tinggi
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public.production_sales_orders');
    }
};
