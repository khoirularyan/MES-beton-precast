<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Alter public.production_qc_inspections to add new required columns
        Schema::table('public.production_qc_inspections', function (Blueprint $table) {
            $table->foreignId('production_batch_id')
                ->nullable()
                ->after('production_order_id')
                ->constrained('public.production_batches')
                ->nullOnDelete();
            
            $table->date('inspection_date')->nullable();
            $table->integer('qty_inspected')->default(0);
            $table->integer('qty_passed')->default(0);
            $table->integer('qty_rejected')->default(0);
            $table->text('notes')->nullable();
            $table->string('photo_path', 255)->nullable();
            $table->foreignId('inspector_id')
                ->nullable()
                ->constrained('global.production_users')
                ->nullOnDelete();
        });

        // 2. Create public.production_qc_defects
        Schema::create('public.production_qc_defects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')
                ->constrained('public.production_qc_inspections')
                ->cascadeOnDelete();
            $table->foreignId('defect_category_id')
                ->constrained('global.production_defect_categories')
                ->restrictOnDelete();
            $table->integer('qty')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 3. Create public.production_qc_parameter_values
        Schema::create('public.production_qc_parameter_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_id')
                ->constrained('public.production_qc_inspections')
                ->cascadeOnDelete();
            $table->foreignId('qc_parameter_id')
                ->constrained('global.production_qc_parameters')
                ->restrictOnDelete();
            $table->string('value', 255)->nullable();
            $table->boolean('is_passed')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public.production_qc_parameter_values');
        Schema::dropIfExists('public.production_qc_defects');

        Schema::table('public.production_qc_inspections', function (Blueprint $table) {
            $table->dropForeign(['production_batch_id']);
            $table->dropForeign(['inspector_id']);
            $table->dropColumn([
                'production_batch_id',
                'inspection_date',
                'qty_inspected',
                'qty_passed',
                'qty_rejected',
                'notes',
                'photo_path',
                'inspector_id'
            ]);
        });
    }
};
