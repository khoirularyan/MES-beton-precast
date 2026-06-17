<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        // ── Kategori Produk
        DB::table('global.production_product_categories')->insertOrIgnore([
            ['kode' => 'TIANG', 'nama' => 'Tiang Beton', 'deskripsi' => 'Tiang listrik, tiang pancang, tiang telepon', 'jumlah_produk' => 12, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'PANEL', 'nama' => 'Panel Beton', 'deskripsi' => 'Panel dinding, panel pagar, panel lantai', 'jumlah_produk' => 8, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'BALOK', 'nama' => 'Balok & Girder', 'deskripsi' => 'Balok jembatan, U-girder, I-girder', 'jumlah_produk' => 6, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'PIPA',  'nama' => 'Pipa Beton',   'deskripsi' => 'Pipa gorong-gorong, pipa saluran air', 'jumlah_produk' => 5, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'BOX',   'nama' => 'Box Culvert',  'deskripsi' => 'Box culvert berbagai ukuran', 'jumlah_produk' => 4, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Tipe Produk
        DB::table('global.production_product_types')->insertOrIgnore([
            ['kode' => 'TL-01', 'kategori' => 'Tiang Beton', 'nama' => 'Tiang Listrik Bulat', 'kode_prefix' => 'TLB', 'standar' => 'SNI 0225:2011', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'TP-01', 'kategori' => 'Tiang Beton', 'nama' => 'Tiang Pancang Segi Delapan', 'kode_prefix' => 'TPS', 'standar' => 'SNI 7833:2012', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'PD-01', 'kategori' => 'Panel Beton', 'nama' => 'Panel Dinding Pracetak', 'kode_prefix' => 'PDP', 'standar' => 'SNI 2847:2019', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'BJ-01', 'kategori' => 'Balok & Girder', 'nama' => 'U-Girder Jembatan', 'kode_prefix' => 'UGJ', 'standar' => 'SNI 1725:2016', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Mutu Beton
        DB::table('global.production_concrete_grades')->insertOrIgnore([
            ['grade' => 'K-250', 'nama' => 'Beton K-250 Umum',       'fc_mpa' => 20.75, 'slump_min_cm' => 10, 'slump_max_cm' => 15, 'keterangan' => 'Mutu standar untuk pekerjaan umum', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['grade' => 'K-300', 'nama' => 'Beton K-300 Struktur',   'fc_mpa' => 24.90, 'slump_min_cm' => 10, 'slump_max_cm' => 15, 'keterangan' => 'Untuk struktur kolom & balok', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['grade' => 'K-350', 'nama' => 'Beton K-350 Precast',    'fc_mpa' => 29.05, 'slump_min_cm' => 8,  'slump_max_cm' => 12, 'keterangan' => 'Mutu umum precast beton', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['grade' => 'K-400', 'nama' => 'Beton K-400 High Strength', 'fc_mpa' => 33.20, 'slump_min_cm' => 8,  'slump_max_cm' => 12, 'keterangan' => 'Untuk elemen struktural berat', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['grade' => 'K-450', 'nama' => 'Beton K-450 High Strength', 'fc_mpa' => 37.35, 'slump_min_cm' => 6,  'slump_max_cm' => 10, 'keterangan' => 'Mutu tinggi, butuh admixture', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['grade' => 'K-500', 'nama' => 'Beton K-500 Ultra High', 'fc_mpa' => 41.50, 'slump_min_cm' => 6,  'slump_max_cm' => 10, 'keterangan' => 'Mutu sangat tinggi', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Kategori Material
        DB::table('global.production_material_categories')->insertOrIgnore([
            ['kode' => 'SEM', 'nama' => 'Semen',           'deskripsi' => 'Semen Portland dan varian', 'contoh' => 'OPC, PPC, SRC', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'AGR', 'nama' => 'Agregat',         'deskripsi' => 'Pasir, kerikil, batu split', 'contoh' => 'Pasir 0/5mm, Split 5/20mm, Batu 20/30mm', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'ADM', 'nama' => 'Admixture',       'deskripsi' => 'Bahan tambah kimia beton', 'contoh' => 'Sikament NN, Sika ViscoCrete, Retarder', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'BES', 'nama' => 'Besi & Baja',    'deskripsi' => 'Tulangan beton, kawat', 'contoh' => 'Besi D10, D13, D16, D19, D22, Kawat beton', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'AIR', 'nama' => 'Air',             'deskripsi' => 'Air untuk campuran dan curing', 'contoh' => 'Air bersih, Air PDAM', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Cetakan (Molds)
        DB::table('global.production_molds')->insertOrIgnore([
            ['kode' => 'CET-TL9',  'nama' => 'Cetakan Tiang 9m',   'produk' => 'TL-9M-K300', 'jumlah_total' => 20, 'jumlah_aktif' => 18, 'kondisi' => 'Baik',            'utilisasi' => 90, 'kapasitas_per_siklus' => 2, 'siklus_per_hari' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'CET-TL12', 'nama' => 'Cetakan Tiang 12m',  'produk' => 'TL-12M-K300','jumlah_total' => 15, 'jumlah_aktif' => 12, 'kondisi' => 'Baik',            'utilisasi' => 80, 'kapasitas_per_siklus' => 1, 'siklus_per_hari' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'CET-PD',   'nama' => 'Cetakan Panel Dinding','produk' => 'PD-120-K350','jumlah_total' => 10, 'jumlah_aktif' => 8,  'kondisi' => 'Sedang',         'utilisasi' => 80, 'kapasitas_per_siklus' => 4, 'siklus_per_hari' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'CET-BC',   'nama' => 'Cetakan Box Culvert', 'produk' => 'BC-1010',    'jumlah_total' => 6,  'jumlah_aktif' => 5,  'kondisi' => 'Perlu Perawatan', 'utilisasi' => 83, 'kapasitas_per_siklus' => 1, 'siklus_per_hari' => 1, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Gudang
        DB::table('global.production_warehouses')->insertOrIgnore([
            ['kode' => 'GD-01', 'nama' => 'Gudang Bahan Baku',   'tipe' => 'Raw Material',    'lokasi' => 'Area A - Selatan', 'kapasitas' => '500 ton',  'utilisasi' => 72, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'GD-02', 'nama' => 'Area WIP',              'tipe' => 'Work In Progress', 'lokasi' => 'Area B - Tengah',  'kapasitas' => '1000 unit','utilisasi' => 85, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'GD-03', 'nama' => 'Gudang Finished Goods','tipe' => 'Finished Goods', 'lokasi' => 'Area C - Utara',  'kapasitas' => '800 unit', 'utilisasi' => 60, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'GD-04', 'nama' => 'Area Reject',         'tipe' => 'Reject',          'lokasi' => 'Area D - Timur',  'kapasitas' => '100 unit', 'utilisasi' => 15, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Shift (NOTE: supervisor_id akan diisi setelah user dibuat)
        DB::table('global.production_shifts')->insertOrIgnore([
            ['kode' => 'SH-01', 'nama' => 'Shift Pagi',  'jam' => '07:00 - 15:00', 'supervisor_id' => null, 'jumlah_pekerja' => 25, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'SH-02', 'nama' => 'Shift Sore',  'jam' => '15:00 - 23:00', 'supervisor_id' => null, 'jumlah_pekerja' => 20, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'SH-03', 'nama' => 'Shift Malam', 'jam' => '23:00 - 07:00', 'supervisor_id' => null, 'jumlah_pekerja' => 15, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Parameter QC
        DB::table('global.production_qc_parameters')->insertOrIgnore([
            ['kode' => 'QC-01', 'parameter' => 'Kuat Tekan Beton',     'satuan' => 'MPa',  'min' => '24.9',  'target' => '28.0',  'metode' => 'SNI 1974:2011',    'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'QC-02', 'parameter' => 'Slump Beton Segar',    'satuan' => 'cm',   'min' => '8',     'target' => '12',    'metode' => 'SNI 1972:2008',    'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'QC-03', 'parameter' => 'Dimensi Produk',       'satuan' => 'mm',   'min' => '-5mm',  'target' => '0mm',   'metode' => 'Pengukuran Visual','aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'QC-04', 'parameter' => 'Kelurusan Tiang',      'satuan' => 'mm/m', 'min' => '0',     'target' => '≤3',    'metode' => 'Waterpass',        'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'QC-05', 'parameter' => 'Tebal Selimut Beton',  'satuan' => 'mm',   'min' => '20',    'target' => '25',    'metode' => 'Cover Meter',      'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Kategori Defect
        DB::table('global.production_defect_categories')->insertOrIgnore([
            ['kode' => 'DF-01', 'nama' => 'Retak Permukaan',     'warna' => '#E74C3C', 'tingkat' => 'Mayor',  'penyebab_umum' => 'Kurang curing, W/C tinggi', 'disposisi' => 'Repair epoxy atau reject', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'DF-02', 'nama' => 'Keropos (Honeycombs)','warna' => '#E67E22', 'tingkat' => 'Kritis', 'penyebab_umum' => 'Vibrator kurang, slump rendah', 'disposisi' => 'Reject wajib', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'DF-03', 'nama' => 'Dimensi Out of Spec', 'warna' => '#F39C12', 'tingkat' => 'Mayor',  'penyebab_umum' => 'Cetakan longgar, kesalahan ukur', 'disposisi' => 'Verifikasi ulang', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'DF-04', 'nama' => 'Cacat Permukaan Minor','warna' => '#27AE60', 'tingkat' => 'Minor',  'penyebab_umum' => 'Cetakan kotor, release agent kurang', 'disposisi' => 'Repair ringan diizinkan', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'DF-05', 'nama' => 'Tulangan Tidak Sesuai','warna' => '#8E44AD', 'tingkat' => 'Kritis', 'penyebab_umum' => 'Salah posisi, selimut kurang', 'disposisi' => 'Reject wajib', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Status Produksi
        DB::table('global.production_statuses')->insertOrIgnore([
            ['kode' => 'PS-01', 'status' => 'Draft',       'urutan' => 1, 'warna' => '#9E9E9E', 'deskripsi' => 'Order produksi dibuat, belum diproses', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'PS-02', 'status' => 'Planned',     'urutan' => 2, 'warna' => '#2196F3', 'deskripsi' => 'Sudah direncanakan dan dijadwalkan', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'PS-03', 'status' => 'In Progress', 'urutan' => 3, 'warna' => '#FF9800', 'deskripsi' => 'Sedang dalam proses produksi', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'PS-04', 'status' => 'Curing',      'urutan' => 4, 'warna' => '#00BCD4', 'deskripsi' => 'Dalam proses curing', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'PS-05', 'status' => 'QC Check',    'urutan' => 5, 'warna' => '#9C27B0', 'deskripsi' => 'Inspeksi QC', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'PS-06', 'status' => 'Done',        'urutan' => 6, 'warna' => '#4CAF50', 'deskripsi' => 'Produksi selesai, siap kirim', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'PS-07', 'status' => 'Cancelled',   'urutan' => 7, 'warna' => '#F44336', 'deskripsi' => 'Order dibatalkan', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Status Pengiriman
        DB::table('global.production_delivery_statuses')->insertOrIgnore([
            ['kode' => 'DS-01', 'status' => 'Pending',     'urutan' => 1, 'warna' => '#9E9E9E', 'deskripsi' => 'Menunggu konfirmasi pengiriman', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'DS-02', 'status' => 'Confirmed',   'urutan' => 2, 'warna' => '#2196F3', 'deskripsi' => 'Pengiriman dikonfirmasi', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'DS-03', 'status' => 'Loading',     'urutan' => 3, 'warna' => '#FF9800', 'deskripsi' => 'Sedang proses muat ke kendaraan', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'DS-04', 'status' => 'In Transit',  'urutan' => 4, 'warna' => '#00BCD4', 'deskripsi' => 'Dalam perjalanan ke lokasi', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'DS-05', 'status' => 'Delivered',   'urutan' => 5, 'warna' => '#4CAF50', 'deskripsi' => 'Sudah diterima pelanggan', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'DS-06', 'status' => 'Returned',    'urutan' => 6, 'warna' => '#F44336', 'deskripsi' => 'Dikembalikan karena masalah', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Status Batch Produksi
        DB::table('global.production_batch_statuses')->insertOrIgnore([
            ['kode' => 'BS-01', 'status' => 'Planning',       'urutan' => 1, 'warna' => '#9E9E9E', 'deskripsi' => 'Batch sedang direncanakan', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'BS-02', 'status' => 'Ready Material', 'urutan' => 2, 'warna' => '#2196F3', 'deskripsi' => 'Material sudah siap', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'BS-03', 'status' => 'Casting',        'urutan' => 3, 'warna' => '#FF9800', 'deskripsi' => 'Proses casting sedang berjalan', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'BS-04', 'status' => 'QC',             'urutan' => 4, 'warna' => '#9C27B0', 'deskripsi' => 'Quality control inspection', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'BS-05', 'status' => 'Finished',       'urutan' => 5, 'warna' => '#4CAF50', 'deskripsi' => 'Batch selesai, produk ready', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'BS-06', 'status' => 'Delivered',      'urutan' => 6, 'warna' => '#00E676', 'deskripsi' => 'Batch sudah dikirim ke customer', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Status Pengiriman
        DB::table('global.production_delivery_statuses')->insertOrIgnore([
            ['kode' => 'DS-01', 'status' => 'Pending',     'urutan' => 1, 'warna' => '#9E9E9E', 'deskripsi' => 'Menunggu konfirmasi pengiriman', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'DS-02', 'status' => 'Confirmed',   'urutan' => 2, 'warna' => '#2196F3', 'deskripsi' => 'Pengiriman dikonfirmasi', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'DS-03', 'status' => 'Loading',     'urutan' => 3, 'warna' => '#FF9800', 'deskripsi' => 'Sedang proses muat ke kendaraan', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'DS-04', 'status' => 'In Transit',  'urutan' => 4, 'warna' => '#00BCD4', 'deskripsi' => 'Dalam perjalanan ke lokasi', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'DS-05', 'status' => 'Delivered',   'urutan' => 5, 'warna' => '#4CAF50', 'deskripsi' => 'Sudah diterima pelanggan', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'DS-06', 'status' => 'Returned',    'urutan' => 6, 'warna' => '#F44336', 'deskripsi' => 'Dikembalikan karena masalah', 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Supplier
        DB::table('global.production_suppliers')->insertOrIgnore([
            ['nama' => 'PT Semen Indonesia (Persero) Tbk', 'kontak' => '031-981-8000', 'email' => 'sales@semenindonesia.com', 'kota' => 'Gresik',    'rating' => 5, 'lead_time_hari' => 3, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'PT Holcim Indonesia Tbk',          'kontak' => '021-570-6828', 'email' => 'info@holcim.co.id',       'kota' => 'Jakarta',   'rating' => 4, 'lead_time_hari' => 5, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'CV Maju Jaya Agregat',             'kontak' => '0271-123-456', 'email' => 'maju.jaya@email.com',     'kota' => 'Surakarta', 'rating' => 4, 'lead_time_hari' => 2, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'PT Krakatau Steel',                'kontak' => '0254-571-200','email' => 'sales@krakatausteel.com', 'kota' => 'Cilegon',   'rating' => 5, 'lead_time_hari' => 7, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nama' => 'PT Sika Indonesia',                'kontak' => '021-890-3737', 'email' => 'sika@sika.co.id',         'kota' => 'Cibitung',  'rating' => 5, 'lead_time_hari' => 5, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Customer
        DB::table('global.production_customers')->insertOrIgnore([
            ['kode' => 'CUS-001', 'nama' => 'PT PLN (Persero)',           'kontak' => 'Ir. Hendra Pratama', 'telepon' => '021-725-1234', 'email' => 'procurement@pln.co.id',   'npwp' => '01.000.000.0-000.000', 'pic_proyek' => 'Agus Santoso', 'kota' => 'Jakarta',   'segmen' => 'BUMN Konstruksi', 'limit_kredit' => 5000000000, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'CUS-002', 'nama' => 'PT Pembangunan Perumahan Tbk','kontak' => 'Bapak Agus Wibowo', 'telepon' => '021-319-3000', 'email' => 'pp@ptpp.co.id',           'npwp' => '01.000.001.0-000.000', 'pic_proyek' => 'Budi Raharjo', 'kota' => 'Jakarta',   'segmen' => 'BUMN Konstruksi', 'limit_kredit' => 3000000000, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'CUS-003', 'nama' => 'PT Waskita Karya (Persero)', 'kontak' => 'Bapak Irwan Susilo', 'telepon' => '021-850-0008', 'email' => 'waskita@waskita.co.id',   'npwp' => '01.000.002.0-000.000', 'pic_proyek' => 'Eko Prabowo', 'kota' => 'Jakarta',   'segmen' => 'BUMN Konstruksi', 'limit_kredit' => 4000000000, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'CUS-004', 'nama' => 'Dinas PU Kabupaten Sragen',  'kontak' => 'Bapak Bambang Eko', 'telepon' => '0271-891-234', 'email' => 'pu.sragen@sragen.go.id',  'npwp' => '00.000.000.0-000.001', 'pic_proyek' => 'Hadi Susanto', 'kota' => 'Sragen',    'segmen' => 'Pemerintah',      'limit_kredit' => 1000000000, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'CUS-005', 'nama' => 'PT Mitra Konstruksi Mandiri','kontak' => 'Ibu Citra Lestari',  'telepon' => '024-760-5678', 'email' => 'mkm@mkm.co.id',           'npwp' => '02.000.000.0-000.000', 'pic_proyek' => 'Dewi Kusuma', 'kota' => 'Semarang',  'segmen' => 'Swasta',          'limit_kredit' => 500000000,  'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Work Centers
        DB::table('global.production_work_centers')->insertOrIgnore([
            [
                'code' => 'WC-MIX',
                'name' => 'Line Mixing & Batching',
                'description' => 'Preparation of concrete mix, sand, aggregate, cement, admixture',
                'capacity_qty_per_shift' => 100.00,
                'capacity_m3_per_shift' => 50.000,
                'shifts_per_day' => 3,
                'is_active' => true,
                'standard_labor_rate_per_m3' => 25000.00,
                'standard_overhead_rate_per_m3' => 15000.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'WC-MOLD',
                'name' => 'Line Molding & Reinforcement',
                'description' => 'Mold preparation, reinforcement assembly, and wire tensioning',
                'capacity_qty_per_shift' => 50.00,
                'capacity_m3_per_shift' => 30.000,
                'shifts_per_day' => 2,
                'is_active' => true,
                'standard_labor_rate_per_m3' => 35000.00,
                'standard_overhead_rate_per_m3' => 20000.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'WC-CAST',
                'name' => 'Line Casting & Compaction',
                'description' => 'Concrete pouring, vibrating, and initial surface finishing',
                'capacity_qty_per_shift' => 50.00,
                'capacity_m3_per_shift' => 30.000,
                'shifts_per_day' => 2,
                'is_active' => true,
                'standard_labor_rate_per_m3' => 30000.00,
                'standard_overhead_rate_per_m3' => 18000.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'WC-CURE',
                'name' => 'Line Curing & Demolding',
                'description' => 'Steam/water curing and subsequent demolding of concrete elements',
                'capacity_qty_per_shift' => 50.00,
                'capacity_m3_per_shift' => 30.000,
                'shifts_per_day' => 3,
                'is_active' => true,
                'standard_labor_rate_per_m3' => 20000.00,
                'standard_overhead_rate_per_m3' => 12000.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
