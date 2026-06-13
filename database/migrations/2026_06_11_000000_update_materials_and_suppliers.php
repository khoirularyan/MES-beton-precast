<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Remove kode & supplier_id from production_materials
        Schema::table('global.production_materials', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropColumn(['kode', 'supplier_id']);
        });

        // 2. Remove kode & material from production_suppliers
        Schema::table('global.production_suppliers', function (Blueprint $table) {
            $table->dropColumn(['kode', 'material']);
        });

        // 3. Create pivot table for many-to-many relationship
        Schema::create('global.production_supplier_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('global.production_suppliers')->cascadeOnDelete();
            $table->foreignId('material_id')->constrained('global.production_materials')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['supplier_id', 'material_id']);
        });
        
        // Remove kode from production_material_categories since we don't use it anymore, or keep it?
        // The user didn't explicitly say to remove it from categories, but it makes sense. I'll leave it for now to avoid breaking other things, but make it nullable if not already.
        Schema::table('global.production_material_categories', function (Blueprint $table) {
            $table->string('kode', 20)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('global.production_material_categories', function (Blueprint $table) {
            $table->string('kode', 20)->nullable(false)->change();
        });
        
        Schema::dropIfExists('global.production_supplier_materials');

        Schema::table('global.production_suppliers', function (Blueprint $table) {
            $table->string('kode', 20)->nullable();
            $table->string('material', 100)->nullable();
        });

        Schema::table('global.production_materials', function (Blueprint $table) {
            $table->string('kode', 20)->nullable();
            $table->foreignId('supplier_id')->nullable()->constrained('global.production_suppliers')->nullOnDelete();
        });
    }
};
