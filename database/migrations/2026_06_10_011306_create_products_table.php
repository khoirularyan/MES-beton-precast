<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('production_products', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 30)->unique();
            $table->string('nama', 200);
            $table->string('kategori', 50)->nullable();   // Pipa, U-Ditch, Box Culvert, dll
            $table->string('varian', 50)->nullable();
            $table->string('spek', 100)->nullable();
            $table->string('grade', 20)->nullable();      // K-350, K-400, dll
            $table->decimal('berat', 10, 2)->nullable();  // kg per unit
            $table->bigInteger('harga')->default(0);      // harga jual per unit (IDR)
            $table->string('satuan', 20)->default('unit');
            $table->string('standar', 50)->nullable();    // SNI, ASTM, dll
            $table->boolean('aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_products');
    }
};
