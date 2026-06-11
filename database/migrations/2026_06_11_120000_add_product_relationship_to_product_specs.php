<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Add product_id foreign key to production_product_specs
        Schema::table('global.production_product_specs', function (Blueprint $table) {
            // Add product_id column
            $table->foreignId('product_id')
                ->nullable()
                ->after('id')
                ->constrained('global.production_products')
                ->nullOnDelete();
            
            // Modify 'produk' field to be nullable since we now have product_id
            $table->string('produk', 200)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('global.production_product_specs', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->dropColumn('product_id');
            
            // Revert produk to required
            $table->string('produk', 200)->change();
        });
    }
};
