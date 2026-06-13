<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('global.system_modules', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique()->comment('Module identifier: dashboard, master_data, etc.');
            $table->string('name', 100)->comment('Display name: Dashboard, Master Data, etc.');
            $table->string('description', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('global.system_modules');
    }
};
