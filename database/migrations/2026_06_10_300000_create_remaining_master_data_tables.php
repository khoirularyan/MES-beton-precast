<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ── Kategori Produk
        Schema::create('global.production_product_categories', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('nama', 100);
            $table->text('deskripsi')->nullable();
            $table->integer('jumlah_produk')->default(0);
            $table->boolean('aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Tipe Produk
        Schema::create('global.production_product_types', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('kategori', 100)->nullable();
            $table->string('nama', 100);
            $table->string('kode_prefix', 10)->nullable();
            $table->string('standar', 100)->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Spesifikasi Produk
        Schema::create('global.production_product_specs', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 30)->unique();
            $table->string('produk', 200);
            $table->string('dimensi', 100)->nullable();
            $table->string('toleransi', 50)->nullable();
            $table->string('berat', 50)->nullable();
            $table->string('grade', 20)->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Mutu Beton
        Schema::create('global.production_concrete_grades', function (Blueprint $table) {
            $table->id();
            $table->string('grade', 20)->unique();
            $table->decimal('fc', 6, 2)->nullable();
            $table->string('slump', 20)->nullable();
            $table->decimal('semen', 8, 2)->nullable();
            $table->decimal('agregat', 8, 2)->nullable();
            $table->decimal('air', 8, 2)->nullable();
            $table->string('admixture', 100)->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Kategori Material
        Schema::create('global.production_material_categories', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('nama', 100);
            $table->text('deskripsi')->nullable();
            $table->string('contoh', 300)->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Cetakan (Molds)
        Schema::create('global.production_molds', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('nama', 100);
            $table->string('produk', 100)->nullable();
            $table->integer('jumlah')->default(0);
            $table->integer('aktif')->default(0);
            $table->string('kondisi', 30)->default('Baik');
            $table->integer('utilisasi')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Gudang (Warehouses)
        Schema::create('global.production_warehouses', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('nama', 100);
            $table->string('tipe', 50)->nullable();
            $table->string('lokasi', 200)->nullable();
            $table->string('kapasitas', 50)->nullable();
            $table->integer('utilisasi')->default(0);
            $table->boolean('aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Mesin (Machines)
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

        // ── Karyawan (Employees)
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

        // ── Shift Kerja
        Schema::create('global.production_shifts', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('nama', 50);
            $table->string('jam', 30)->nullable();
            $table->string('supervisor', 100)->nullable();
            $table->integer('jumlah_pekerja')->default(0);
            $table->boolean('aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Parameter QC
        Schema::create('global.production_qc_parameters', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 30)->unique();
            $table->string('parameter', 200);
            $table->string('satuan', 30)->nullable();
            $table->string('min', 30)->nullable();
            $table->string('target', 30)->nullable();
            $table->string('metode', 100)->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Kategori Defect
        Schema::create('global.production_defect_categories', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('nama', 100);
            $table->string('warna', 10)->nullable();
            $table->string('tingkat', 20)->nullable(); // Kritis, Mayor, Minor
            $table->string('penyebab_umum', 300)->nullable();
            $table->string('disposisi', 200)->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Status Produksi
        Schema::create('global.production_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('status', 100);
            $table->integer('urutan')->default(0);
            $table->string('warna', 10)->nullable();
            $table->text('deskripsi')->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        // ── Status Pengiriman
        Schema::create('global.production_delivery_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 20)->unique();
            $table->string('status', 100);
            $table->integer('urutan')->default(0);
            $table->string('warna', 10)->nullable();
            $table->text('deskripsi')->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('global.production_delivery_statuses');
        Schema::dropIfExists('global.production_statuses');
        Schema::dropIfExists('global.production_defect_categories');
        Schema::dropIfExists('global.production_qc_parameters');
        Schema::dropIfExists('global.production_shifts');
        Schema::dropIfExists('global.production_employees');
        Schema::dropIfExists('global.production_machines');
        Schema::dropIfExists('global.production_warehouses');
        Schema::dropIfExists('global.production_molds');
        Schema::dropIfExists('global.production_material_categories');
        Schema::dropIfExists('global.production_concrete_grades');
        Schema::dropIfExists('global.production_product_specs');
        Schema::dropIfExists('global.production_product_types');
        Schema::dropIfExists('global.production_product_categories');
    }
};
