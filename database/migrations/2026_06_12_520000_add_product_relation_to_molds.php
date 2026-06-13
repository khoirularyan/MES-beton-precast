<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('global.production_molds', function (Blueprint $table) {
            // Remove old 'produk' string field (it's just text, not relational)
            // Add proper product_id foreign key
            
            if (!Schema::hasColumn('global.production_molds', 'product_id')) {
                $table->foreignId('product_id')
                    ->nullable()
                    ->after('nama')
                    ->constrained('global.production_products')
                    ->nullOnDelete();
            }
            
            // Keep 'produk' field for backward compatibility but it's deprecated
            // In future, use product_id relation instead
        });
    }

    public function down(): void
    {
        Schema::table('global.production_molds', function (Blueprint $table) {
            if (Schema::hasColumn('global.production_molds', 'product_id')) {
                $table->dropForeign(['product_id']);
                $table->dropColumn('product_id');
            }
        });
    }
};
