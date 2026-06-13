<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Supplier;

class MaterialSeeder extends Seeder
{
    public function run(): void
    {
        // Get supplier IDs by name
        $suppliers = Supplier::pluck('id', 'nama')->toArray();

        // Default supplier IDs in case they don't exist
        $semenIndonesia = $suppliers['PT Semen Indonesia (Persero) Tbk'] ?? 1;
        $holcim = $suppliers['PT Holcim Indonesia Tbk'] ?? 2;
        $majuJaya = $suppliers['CV Maju Jaya Agregat'] ?? 3;
        $krakatau = $suppliers['PT Krakatau Steel'] ?? 4;
        $sika = $suppliers['PT Sika Indonesia'] ?? 5;

        // Raw material list with stock included (will be split during seeding)
        $materialsData = [
            // ── SEMEN (SEM)
            ['kode' => 'MAT-SEM-OPC', 'nama' => 'Semen Portland Putih (OPC)',        'kategori' => 'Semen', 'supplier_id' => $semenIndonesia, 'satuan' => 'Kg', 'harga' => 1800,  'stok' => 50000,  'min_stok' => 10000, 'lead_time_hari' => 3,  'aktif' => true],
            ['kode' => 'MAT-SEM-PPC', 'nama' => 'Semen Portland Komposit (PPC)',     'kategori' => 'Semen', 'supplier_id' => $holcim, 'satuan' => 'Kg', 'harga' => 1600,  'stok' => 75000,  'min_stok' => 15000, 'lead_time_hari' => 5,  'aktif' => true],
            ['kode' => 'MAT-SEM-SRC', 'nama' => 'Semen Portland Tahan Sulfat (SRC)', 'kategori' => 'Semen', 'supplier_id' => $semenIndonesia, 'satuan' => 'Kg', 'harga' => 2200,  'stok' => 20000,  'min_stok' => 5000,  'lead_time_hari' => 3,  'aktif' => true],

            // ── AGREGAT - PASIR (AGR)
            ['kode' => 'MAT-AGR-PASIR05', 'nama' => 'Pasir 0/5mm (Pasir Halus)',        'kategori' => 'Agregat', 'supplier_id' => $majuJaya,  'satuan' => 'Kubik', 'harga' => 150000, 'stok' => 500,   'min_stok' => 100,  'lead_time_hari' => 2, 'aktif' => true],
            ['kode' => 'MAT-AGR-PASIR08', 'nama' => 'Pasir 0/8mm (Pasir Sedang)',      'kategori' => 'Agregat', 'supplier_id' => $majuJaya,  'satuan' => 'Kubik', 'harga' => 140000, 'stok' => 800,   'min_stok' => 200,  'lead_time_hari' => 2, 'aktif' => true],

            // ── AGREGAT - KERIKIL/SPLIT (AGR)
            ['kode' => 'MAT-AGR-SPLIT10', 'nama' => 'Kerikil/Split 5/10mm',           'kategori' => 'Agregat', 'supplier_id' => $majuJaya,  'satuan' => 'Kubik', 'harga' => 200000, 'stok' => 600,   'min_stok' => 150,  'lead_time_hari' => 2, 'aktif' => true],
            ['kode' => 'MAT-AGR-SPLIT15', 'nama' => 'Kerikil/Split 10/15mm',         'kategori' => 'Agregat', 'supplier_id' => $majuJaya,  'satuan' => 'Kubik', 'harga' => 180000, 'stok' => 700,   'min_stok' => 150,  'lead_time_hari' => 2, 'aktif' => true],
            ['kode' => 'MAT-AGR-SPLIT20', 'nama' => 'Kerikil/Split 10/20mm',         'kategori' => 'Agregat', 'supplier_id' => $majuJaya,  'satuan' => 'Kubik', 'harga' => 160000, 'stok' => 1000,  'min_stok' => 200,  'lead_time_hari' => 2, 'aktif' => true],
            ['kode' => 'MAT-AGR-BATU30', 'nama' => 'Batu Split 20/30mm',             'kategori' => 'Agregat', 'supplier_id' => $majuJaya,  'satuan' => 'Kubik', 'harga' => 140000, 'stok' => 1200,  'min_stok' => 300,  'lead_time_hari' => 2, 'aktif' => true],

            // ── ADMIXTURE (ADM)
            ['kode' => 'MAT-ADM-SIKAMENT', 'nama' => 'Sikament NN (Superplasticizer)', 'kategori' => 'Admixture', 'supplier_id' => $sika, 'satuan' => 'Liter', 'harga' => 50000,  'stok' => 1000, 'min_stok' => 200, 'lead_time_hari' => 5, 'aktif' => true],
            ['kode' => 'MAT-ADM-VISCOR', 'nama' => 'Sika ViscoCrete (Flow Aid)',      'kategori' => 'Admixture', 'supplier_id' => $sika, 'satuan' => 'Liter', 'harga' => 45000,  'stok' => 800,  'min_stok' => 150, 'lead_time_hari' => 5, 'aktif' => true],
            ['kode' => 'MAT-ADM-RETARDER', 'nama' => 'Sika Retarder (Penunda Pengikatan)', 'kategori' => 'Admixture', 'supplier_id' => $sika, 'satuan' => 'Liter', 'harga' => 55000,  'stok' => 500,  'min_stok' => 100, 'lead_time_hari' => 5, 'aktif' => true],
            ['kode' => 'MAT-ADM-AIRPOR', 'nama' => 'Sika Aer (Air Entrainer)',       'kategori' => 'Admixture', 'supplier_id' => $sika, 'satuan' => 'Liter', 'harga' => 40000,  'stok' => 600,  'min_stok' => 100, 'lead_time_hari' => 5, 'aktif' => true],

            // ── BESI & BAJA (BES)
            ['kode' => 'MAT-BES-D10',  'nama' => 'Besi Tulangan D10 (High Tensile)', 'kategori' => 'Besi & Baja', 'supplier_id' => $krakatau, 'satuan' => 'Kg', 'harga' => 10500, 'stok' => 10000, 'min_stok' => 2000, 'lead_time_hari' => 7, 'aktif' => true],
            ['kode' => 'MAT-BES-D13',  'nama' => 'Besi Tulangan D13 (High Tensile)', 'kategori' => 'Besi & Baja', 'supplier_id' => $krakatau, 'satuan' => 'Kg', 'harga' => 11000, 'stok' => 8000,  'min_stok' => 1500, 'lead_time_hari' => 7, 'aktif' => true],
            ['kode' => 'MAT-BES-D16',  'nama' => 'Besi Tulangan D16 (High Tensile)', 'kategori' => 'Besi & Baja', 'supplier_id' => $krakatau, 'satuan' => 'Kg', 'harga' => 11200, 'stok' => 5000,  'min_stok' => 1000, 'lead_time_hari' => 7, 'aktif' => true],
            ['kode' => 'MAT-BES-D19',  'nama' => 'Besi Tulangan D19 (High Tensile)', 'kategori' => 'Besi & Baja', 'supplier_id' => $krakatau, 'satuan' => 'Kg', 'harga' => 11500, 'stok' => 3000,  'min_stok' => 500,  'lead_time_hari' => 7, 'aktif' => true],
            ['kode' => 'MAT-BES-D22',  'nama' => 'Besi Tulangan D22 (High Tensile)', 'kategori' => 'Besi & Baja', 'supplier_id' => $krakatau, 'satuan' => 'Kg', 'harga' => 12000, 'stok' => 2000,  'min_stok' => 400,  'lead_time_hari' => 7, 'aktif' => true],
            ['kode' => 'MAT-BES-KAWAT', 'nama' => 'Kawat Beton Pracetak Ø5mm',      'kategori' => 'Besi & Baja', 'supplier_id' => $krakatau, 'satuan' => 'Kg', 'harga' => 12000, 'stok' => 5000,  'min_stok' => 1000, 'lead_time_hari' => 7, 'aktif' => true],

            // ── AIR (AIR)
            ['kode' => 'MAT-AIR-BERSIH', 'nama' => 'Air Bersih untuk Campuran',      'kategori' => 'Air', 'supplier_id' => null,  'satuan' => 'Kubik', 'harga' => 50000,  'stok' => 10000, 'min_stok' => 1000, 'lead_time_hari' => 1, 'aktif' => true],
            ['kode' => 'MAT-AIR-PDAM',  'nama' => 'Air PDAM untuk Curing',           'kategori' => 'Air', 'supplier_id' => null,  'satuan' => 'Kubik', 'harga' => 40000,  'stok' => 15000, 'min_stok' => 2000, 'lead_time_hari' => 1, 'aktif' => true],
        ];

        DB::transaction(function () use ($materialsData) {
            foreach ($materialsData as $data) {
                $stok = $data['stok'];
                
                // Remove stok field from materials table insert
                unset($data['stok']);
                
                $data['created_at'] = now();
                $data['updated_at'] = now();
                
                // Get or insert material
                $materialId = DB::table('global.production_materials')->where('kode', $data['kode'])->value('id');
                
                if (!$materialId) {
                    $materialId = DB::table('global.production_materials')->insertGetId($data);
                } else {
                    DB::table('global.production_materials')->where('id', $materialId)->update($data);
                }

                // Insert or update inventory record
                DB::table('public.production_material_inventory')->updateOrInsert(
                    ['material_id' => $materialId],
                    [
                        'qty_on_hand' => $stok,
                        'created_at'  => now(),
                        'updated_at'  => now()
                    ]
                );
            }
        });
    }
}
