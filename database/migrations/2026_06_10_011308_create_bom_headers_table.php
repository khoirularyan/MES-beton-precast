<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('production_bom_headers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')
                ->constrained('production_products')
                ->cascadeOnDelete();
            $table->string('versi', 10)->default('V1.0');
            $table->boolean('is_active')->default(true);
            $table->string('catatan', 300)->nullable();
            $table->decimal('bom_efficiency', 5, 2)->default(100);
            $table->decimal('overhead_pct', 5, 2)->default(15);
            $table->string('dibuat_oleh', 100)->nullable();
            $table->timestamp('berlaku_dari')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['product_id', 'versi']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_bom_headers');
    }
};
