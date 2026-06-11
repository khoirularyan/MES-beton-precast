<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('global.production_materials', function (Blueprint $table) {
            // Restore kode column
            $table->string('kode', 20)->unique()->nullable()->after('id');
            
            // Restore supplier_id foreign key for backward compatibility
            // We use the many-to-many relationship, but keep this for direct references
            $table->foreignId('supplier_id')
                ->nullable()
                ->after('kategori')
                ->constrained('global.production_suppliers')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('global.production_materials', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropColumn(['kode', 'supplier_id']);
        });
    }
};
