<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('global.production_materials', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('nama', 200);
            $table->string('satuan', 20)->default('kg');
            $table->string('kategori', 50)->nullable(); // Binder, Agregat, Tulangan, Admixture
            $table->decimal('stok', 15, 3)->default(0);
            $table->decimal('min_stok', 15, 3)->default(0);
            $table->foreignId('supplier_id')
                ->nullable()
                ->constrained('global.production_suppliers')
                ->nullOnDelete();
            $table->bigInteger('harga')->default(0);    // harga per satuan (IDR)
            $table->integer('lead_time_hari')->default(7);
            $table->boolean('aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('global.production_materials');
    }
};
