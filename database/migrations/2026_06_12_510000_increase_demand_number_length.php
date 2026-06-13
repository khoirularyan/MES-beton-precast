<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('public.production_demands', function (Blueprint $table) {
            // Increase demand_number from varchar(30) to varchar(100) to accommodate longer format
            $table->string('demand_number', 100)->change();
        });

        Schema::table('public.production_plans', function (Blueprint $table) {
            // Also increase plan_number for consistency
            $table->string('plan_number', 100)->change();
        });

        Schema::table('public.production_batches', function (Blueprint $table) {
            // Also increase batch_number for consistency
            $table->string('batch_number', 100)->change();
        });
    }

    public function down(): void
    {
        Schema::table('public.production_demands', function (Blueprint $table) {
            $table->string('demand_number', 30)->change();
        });

        Schema::table('public.production_plans', function (Blueprint $table) {
            $table->string('plan_number', 30)->change();
        });

        Schema::table('public.production_batches', function (Blueprint $table) {
            $table->string('batch_number', 50)->change();
        });
    }
};
