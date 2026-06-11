<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // ── TIANG BETON (TL)
        DB::table('global.production_products')->insertOrIgnore([
            // Tiang Listrik Bulat
            ['kode' => 'TL-9M-K300',  'nama' => 'Tiang Listrik 9M K-300',  'kategori' => 'Tiang Beton', 'varian' => '9 Meter', 'spek' => 'Bulat Pejal', 'grade' => 'K-300', 'berat' => '450', 'volume_m3' => '0.45', 'satuan' => 'Batang', 'standar' => 'SNI 0225:2011', 'harga' => 3500000, 'umur_curing_hari' => 28, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'TL-11M-K300', 'nama' => 'Tiang Listrik 11M K-300', 'kategori' => 'Tiang Beton', 'varian' => '11 Meter', 'spek' => 'Bulat Pejal', 'grade' => 'K-300', 'berat' => '550', 'volume_m3' => '0.55', 'satuan' => 'Batang', 'standar' => 'SNI 0225:2011', 'harga' => 4200000, 'umur_curing_hari' => 28, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'TL-12M-K300', 'nama' => 'Tiang Listrik 12M K-300', 'kategori' => 'Tiang Beton', 'varian' => '12 Meter', 'spek' => 'Bulat Pejal', 'grade' => 'K-300', 'berat' => '600', 'volume_m3' => '0.60', 'satuan' => 'Batang', 'standar' => 'SNI 0225:2011', 'harga' => 4500000, 'umur_curing_hari' => 28, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],

            // Tiang Pancang Segi Delapan
            ['kode' => 'TP-10M-K350', 'nama' => 'Tiang Pancang 10M K-350', 'kategori' => 'Tiang Beton', 'varian' => '10 Meter', 'spek' => 'Segi Delapan Berlubang', 'grade' => 'K-350', 'berat' => '800', 'volume_m3' => '0.80', 'satuan' => 'Batang', 'standar' => 'SNI 7833:2012', 'harga' => 5200000, 'umur_curing_hari' => 28, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'TP-12M-K350', 'nama' => 'Tiang Pancang 12M K-350', 'kategori' => 'Tiang Beton', 'varian' => '12 Meter', 'spek' => 'Segi Delapan Berlubang', 'grade' => 'K-350', 'berat' => '950', 'volume_m3' => '0.95', 'satuan' => 'Batang', 'standar' => 'SNI 7833:2012', 'harga' => 6200000, 'umur_curing_hari' => 28, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'TP-15M-K350', 'nama' => 'Tiang Pancang 15M K-350', 'kategori' => 'Tiang Beton', 'varian' => '15 Meter', 'spek' => 'Segi Delapan Berlubang', 'grade' => 'K-350', 'berat' => '1200', 'volume_m3' => '1.20', 'satuan' => 'Batang', 'standar' => 'SNI 7833:2012', 'harga' => 8000000, 'umur_curing_hari' => 28, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],

            // ── PANEL BETON (PD)
            ['kode' => 'PD-120-K350', 'nama' => 'Panel Dinding 120x25cm K-350', 'kategori' => 'Panel Beton', 'varian' => '120x25cm', 'spek' => 'Panel Dinding Pracetak', 'grade' => 'K-350', 'berat' => '280', 'volume_m3' => '0.08', 'satuan' => 'Lembar', 'standar' => 'SNI 2847:2019', 'harga' => 500000, 'umur_curing_hari' => 21, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'PD-150-K350', 'nama' => 'Panel Dinding 150x25cm K-350', 'kategori' => 'Panel Beton', 'varian' => '150x25cm', 'spek' => 'Panel Dinding Pracetak', 'grade' => 'K-350', 'berat' => '350', 'volume_m3' => '0.10', 'satuan' => 'Lembar', 'standar' => 'SNI 2847:2019', 'harga' => 650000, 'umur_curing_hari' => 21, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'PF-300-K350', 'nama' => 'Panel Pagar 300x20cm K-350', 'kategori' => 'Panel Beton', 'varian' => '300x20cm', 'spek' => 'Panel Pagar Dekoratif', 'grade' => 'K-350', 'berat' => '200', 'volume_m3' => '0.06', 'satuan' => 'Lembar', 'standar' => 'SNI 2847:2019', 'harga' => 400000, 'umur_curing_hari' => 14, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],

            // ── BALOK & GIRDER (BJ)
            ['kode' => 'BJ-UG20-K350', 'nama' => 'U-Girder 20x50cm K-350', 'kategori' => 'Balok & Girder', 'varian' => 'U-Girder 20x50', 'spek' => 'U-Shape Girder untuk Jembatan', 'grade' => 'K-350', 'berat' => '2500', 'volume_m3' => '2.50', 'satuan' => 'Batang', 'standar' => 'SNI 1725:2016', 'harga' => 15000000, 'umur_curing_hari' => 28, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'BJ-UG30-K350', 'nama' => 'U-Girder 30x60cm K-350', 'kategori' => 'Balok & Girder', 'varian' => 'U-Girder 30x60', 'spek' => 'U-Shape Girder untuk Jembatan', 'grade' => 'K-350', 'berat' => '4000', 'volume_m3' => '4.00', 'satuan' => 'Batang', 'standar' => 'SNI 1725:2016', 'harga' => 22000000, 'umur_curing_hari' => 28, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],

            // ── PIPA BETON (PI)
            ['kode' => 'PI-800-K300', 'nama' => 'Pipa Gorong Ø800mm K-300', 'kategori' => 'Pipa Beton', 'varian' => 'Ø800mm', 'spek' => 'Pipa Gorong-Gorong Pracetak', 'grade' => 'K-300', 'berat' => '3500', 'volume_m3' => '3.50', 'satuan' => 'Unit', 'standar' => 'SNI 0351:2021', 'harga' => 8000000, 'umur_curing_hari' => 28, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'PI-1000-K300', 'nama' => 'Pipa Gorong Ø1000mm K-300', 'kategori' => 'Pipa Beton', 'varian' => 'Ø1000mm', 'spek' => 'Pipa Gorong-Gorong Pracetak', 'grade' => 'K-300', 'berat' => '5200', 'volume_m3' => '5.20', 'satuan' => 'Unit', 'standar' => 'SNI 0351:2021', 'harga' => 12000000, 'umur_curing_hari' => 28, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],

            // ── BOX CULVERT (BC)
            ['kode' => 'BC-1010-K350', 'nama' => 'Box Culvert 100x100cm K-350', 'kategori' => 'Box Culvert', 'varian' => '100x100cm', 'spek' => 'Box Culvert Persegi', 'grade' => 'K-350', 'berat' => '8000', 'volume_m3' => '8.00', 'satuan' => 'Unit', 'standar' => 'SNI 2847:2019', 'harga' => 18000000, 'umur_curing_hari' => 28, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
            ['kode' => 'BC-1515-K350', 'nama' => 'Box Culvert 150x150cm K-350', 'kategori' => 'Box Culvert', 'varian' => '150x150cm', 'spek' => 'Box Culvert Persegi', 'grade' => 'K-350', 'berat' => '12000', 'volume_m3' => '12.00', 'satuan' => 'Unit', 'standar' => 'SNI 2847:2019', 'harga' => 28000000, 'umur_curing_hari' => 28, 'aktif' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
