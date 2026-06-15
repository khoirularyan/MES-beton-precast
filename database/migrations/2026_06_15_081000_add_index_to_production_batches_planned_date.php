<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('public.production_batches', function (Blueprint $table) {
            $table->index('planned_date');
        });
    }

    public function down(): void
    {
        Schema::table('public.production_batches', function (Blueprint $table) {
            $table->dropIndex(['planned_date']);
        });
    }
};
