<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('production_inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')
                ->constrained('production_products')
                ->restrictOnDelete();
            $table->string('gudang', 30)->default('WH-FG');
            $table->string('lokasi', 50)->nullable();
            $table->integer('stok')->default(0);
            $table->integer('reserved')->default(0);    // dialokasikan ke SO
            $table->integer('age_hari')->default(0);    // inventory aging (hari)
            $table->date('tgl_produksi')->nullable();
            $table->timestamps();

            $table->unique(['product_id', 'gudang']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_inventory');
    }
};
