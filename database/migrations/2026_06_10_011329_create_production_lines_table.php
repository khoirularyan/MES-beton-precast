<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('production_lines', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('nama', 100);
            $table->string('produk_kategori', 100)->nullable();
            $table->integer('kapasitas_harian')->default(0); // unit/hari
            $table->integer('output_hari_ini')->default(0);
            $table->string('status', 20)->default('Aktif'); // Aktif, Maintenance, Idle
            $table->string('supervisor', 100)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_lines');
    }
};
