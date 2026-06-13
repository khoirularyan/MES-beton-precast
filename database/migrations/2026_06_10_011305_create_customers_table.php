<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('global.production_customers', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('nama', 200);
            $table->string('kontak', 100)->nullable();
            $table->string('telepon', 30)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('npwp', 30)->nullable();          // NPWP perusahaan
            $table->string('pic_proyek', 200)->nullable();   // PIC di lapangan
            $table->string('alamat', 300)->nullable();
            $table->string('kota', 100)->nullable();
            $table->string('segmen', 50)->nullable(); // BUMN Konstruksi, Swasta, Pemerintah
            $table->bigInteger('limit_kredit')->default(0);
            $table->boolean('aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('global.production_customers');
    }
};
