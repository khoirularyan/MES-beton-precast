<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('global.production_work_centers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('name', 100);
            $table->string('description', 255)->nullable();
            $table->decimal('capacity_qty_per_shift', 10, 2)->default(0);
            $table->decimal('capacity_m3_per_shift', 10, 3)->default(0);
            $table->integer('shifts_per_day')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('global.production_work_centers');
    }
};
