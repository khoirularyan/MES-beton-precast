<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Refactor Master Data untuk MES Beton Precast
 * 
 * Perubahan:
 * 1. Products - tambah volume_m3, umur_curing_hari
 * 2. Concrete Grades - rename field fc, slump_min, slump_max sesuai konvensi
 * 3. Customers - tambah npwp, pic_proyek
 * 4. Suppliers - tambah lead_time_hari
 * 5. Molds - tambah kapasitas_per_siklus, siklus_per_hari
 * 6. Shifts - ubah supervisor menjadi foreignId ke users
 * 7. Hapus tables: machines, employees (diganti user/role system)
 * 8. Tambah production_batch_statuses sebagai master data
 */
return new class extends Migration {
    public function up(): void
    {
        // ───────────────────────────────────────────────────────────────
        // 1. REFACTOR PRODUCTS
        // ───────────────────────────────────────────────────────────────
        Schema::table('global.production_products', function (Blueprint $table) {
            $table->decimal('volume_m3', 10, 3)->nullable()->after('berat');
            $table->integer('umur_curing_hari')->default(28)->after('volume_m3');
        });

        // ───────────────────────────────────────────────────────────────
        // 2. REFACTOR CONCRETE GRADES
        // ───────────────────────────────────────────────────────────────
        Schema::table('global.production_concrete_grades', function (Blueprint $table) {
            // Rename fc → fc_mpa
            $table->renameColumn('fc', 'fc_mpa');
            // Rename slump_min → slump_min_cm
            $table->renameColumn('slump_min', 'slump_min_cm');
            // Rename slump_max → slump_max_cm
            $table->renameColumn('slump_max', 'slump_max_cm');
        });

        // ───────────────────────────────────────────────────────────────
        // 3. REFACTOR CUSTOMERS
        // ───────────────────────────────────────────────────────────────
        Schema::table('global.production_customers', function (Blueprint $table) {
            $table->string('npwp', 20)->nullable()->after('email');
            $table->string('pic_proyek', 100)->nullable()->after('npwp');
        });

        // ───────────────────────────────────────────────────────────────
        // 4. REFACTOR SUPPLIERS
        // ───────────────────────────────────────────────────────────────
        Schema::table('global.production_suppliers', function (Blueprint $table) {
            $table->integer('lead_time_hari')->default(7)->after('rating');
        });

        // ───────────────────────────────────────────────────────────────
        // 5. REFACTOR MOLDS
        // ───────────────────────────────────────────────────────────────
        Schema::table('global.production_molds', function (Blueprint $table) {
            $table->integer('kapasitas_per_siklus')->default(1)->after('kondisi');
            $table->integer('siklus_per_hari')->default(1)->after('kapasitas_per_siklus');
        });

        // ───────────────────────────────────────────────────────────────
        // 6. REFACTOR SHIFTS - supervisor dari User
        // ───────────────────────────────────────────────────────────────
        Schema::table('global.production_shifts', function (Blueprint $table) {
            // Drop old supervisor text field
            $table->dropColumn('supervisor');
            // Add foreignId to users table
            $table->foreignId('supervisor_id')
                ->nullable()
                ->after('jam')
                ->constrained('global.production_users')
                ->nullOnDelete();
        });

        // ───────────────────────────────────────────────────────────────
        // 7. HAPUS TABLES: MACHINES & EMPLOYEES
        // ───────────────────────────────────────────────────────────────
        Schema::dropIfExists('global.production_machines');
        Schema::dropIfExists('global.production_employees');

        // ───────────────────────────────────────────────────────────────
        // 8. TAMBAH MASTER DATA: BATCH STATUSES
        // ───────────────────────────────────────────────────────────────
        Schema::create('global.production_batch_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('status', 50);
            $table->integer('urutan')->default(0);
            $table->string('warna', 10)->nullable(); // hex color
            $table->text('deskripsi')->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        // Rollback Batch Statuses
        Schema::dropIfExists('global.production_batch_statuses');

        // Restore Machines & Employees
        Schema::create('global.production_machines', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('nama', 100);
            $table->string('tipe', 50)->nullable();
            $table->string('line', 50)->nullable();
            $table->string('status', 30)->default('Operasional');
            $table->date('last_maintenance')->nullable();
            $table->date('next_maintenance')->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('global.production_employees', function (Blueprint $table) {
            $table->id();
            $table->string('nik', 20)->unique();
            $table->string('nama', 200);
            $table->string('jabatan', 100)->nullable();
            $table->string('departemen', 50)->nullable();
            $table->string('shift', 20)->nullable();
            $table->string('status', 30)->default('Aktif');
            $table->boolean('aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Rollback Shifts
        Schema::table('global.production_shifts', function (Blueprint $table) {
            $table->dropForeign(['supervisor_id']);
            $table->dropColumn('supervisor_id');
            $table->string('supervisor', 100)->nullable()->after('jam');
        });

        // Rollback Molds
        Schema::table('global.production_molds', function (Blueprint $table) {
            $table->dropColumn(['kapasitas_per_siklus', 'siklus_per_hari']);
        });

        // Rollback Suppliers
        Schema::table('global.production_suppliers', function (Blueprint $table) {
            $table->dropColumn('lead_time_hari');
        });

        // Rollback Customers
        Schema::table('global.production_customers', function (Blueprint $table) {
            $table->dropColumn(['npwp', 'pic_proyek']);
        });

        // Rollback Concrete Grades
        Schema::table('global.production_concrete_grades', function (Blueprint $table) {
            $table->renameColumn('fc_mpa', 'fc');
            $table->renameColumn('slump_min_cm', 'slump_min');
            $table->renameColumn('slump_max_cm', 'slump_max');
        });

        // Rollback Products
        Schema::table('global.production_products', function (Blueprint $table) {
            $table->dropColumn(['volume_m3', 'umur_curing_hari']);
        });
    }
};
