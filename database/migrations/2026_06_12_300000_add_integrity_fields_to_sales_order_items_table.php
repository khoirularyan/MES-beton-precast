<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('public.production_sales_order_items', function (Blueprint $table) {
            $table->foreignId('bom_header_id')
                ->nullable()
                ->constrained('global.production_bom_headers')
                ->nullOnDelete();
                
            $table->string('bom_version_snapshot', 20)->nullable()->after('bom_header_id');
            $table->string('product_code_snapshot', 30)->nullable()->after('product_id');
            $table->string('product_name_snapshot', 150)->nullable()->after('product_code_snapshot');
            $table->string('unit_snapshot', 20)->nullable()->after('product_name_snapshot');
            
            $table->decimal('estimated_volume', 12, 3)->nullable()->after('unit_snapshot');
            $table->decimal('estimated_weight', 12, 2)->nullable()->after('estimated_volume');
        });
    }

    public function down(): void
    {
        Schema::table('public.production_sales_order_items', function (Blueprint $table) {
            $table->dropForeign(['bom_header_id']);
            $table->dropColumn([
                'bom_header_id',
                'bom_version_snapshot',
                'product_code_snapshot',
                'product_name_snapshot',
                'unit_snapshot',
                'estimated_volume',
                'estimated_weight',
            ]);
        });
    }
};
