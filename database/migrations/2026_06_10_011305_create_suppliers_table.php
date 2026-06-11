<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('global.production_suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('nama', 200);
            $table->string('material', 100)->nullable();
            $table->string('kontak', 30)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('alamat', 300)->nullable();
            $table->string('kota', 100)->nullable();
            $table->tinyInteger('rating')->default(3); // 1-5
            $table->boolean('aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('global.production_suppliers');
    }
};
