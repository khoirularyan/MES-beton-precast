<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 1. Create public.production_material_inventory table
        Schema::create('public.production_material_inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')
                ->unique()
                ->constrained('global.production_materials')
                ->onDelete('cascade');
            $table->decimal('qty_on_hand', 15, 3)->default(0);
            $table->timestamps();
        });

        // 2. Data Migration: Copy stock from global.production_materials to public.production_material_inventory
        DB::transaction(function () {
            $materials = DB::table('global.production_materials')->get();
            foreach ($materials as $material) {
                $qty = isset($material->stok) ? (float) $material->stok : 0.0;
                DB::table('public.production_material_inventory')->insert([
                    'material_id' => $material->id,
                    'qty_on_hand' => $qty,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }
        });

        // 3. Drop stok column from global.production_materials
        Schema::table('global.production_materials', function (Blueprint $table) {
            if (Schema::hasColumn('global.production_materials', 'stok')) {
                $table->dropColumn('stok');
            }
        });
    }

    public function down(): void
    {
        // 1. Add stok column back to global.production_materials
        Schema::table('global.production_materials', function (Blueprint $table) {
            if (!Schema::hasColumn('global.production_materials', 'stok')) {
                $table->decimal('stok', 15, 3)->default(0);
            }
        });

        // 2. Rollback Data: Copy qty_on_hand back to stok
        DB::transaction(function () {
            $inventories = DB::table('public.production_material_inventory')->get();
            foreach ($inventories as $inv) {
                DB::table('global.production_materials')
                    ->where('id', $inv->material_id)
                    ->update([
                        'stok' => $inv->qty_on_hand
                    ]);
            }
        });

        // 3. Drop public.production_material_inventory table
        Schema::dropIfExists('public.production_material_inventory');
    }
};
