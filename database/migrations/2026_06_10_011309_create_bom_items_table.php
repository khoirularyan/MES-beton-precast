<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('production_bom_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bom_header_id')
                ->constrained('production_bom_headers')
                ->cascadeOnDelete();
            $table->foreignId('material_id')
                ->constrained('production_materials')
                ->restrictOnDelete();
            $table->decimal('qty_per_unit', 12, 4);         // kebutuhan per 1 unit produk
            $table->decimal('waste_pct', 5, 2)->default(0); // persen waste/scrap
            $table->integer('urutan')->default(0);
            $table->string('catatan', 200)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_bom_items');
    }
};
