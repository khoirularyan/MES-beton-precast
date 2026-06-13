<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Product;

class ProductSpecSeeder extends Seeder
{
    public function run(): void
    {
        // Get products by kode to link with specs
        $products = Product::pluck('id', 'kode')->toArray();

        // ── SPESIFIKASI TIANG LISTRIK BULAT 9M
        if (isset($products['TL-9M-K300'])) {
            DB::table('global.production_product_specs')->insertOrIgnore([
                [
                    'product_id' => $products['TL-9M-K300'],
                    'kode' => 'SPEC-TL9-MAIN',
                    'produk' => 'Tiang Listrik 9M K-300',
                    'dimensi' => 'Diameter 30cm, Tinggi 900cm, Lubang Tengah Ø5cm',
                    'toleransi' => 'Diameter ±2cm, Tinggi ±5cm',
                    'berat' => '450 kg',
                    'grade' => 'K-300',
                    'aktif' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'product_id' => $products['TL-9M-K300'],
                    'kode' => 'SPEC-TL9-TULANG',
                    'produk' => 'Tiang Listrik 9M K-300',
                    'dimensi' => 'Tulangan spiral D8, Spasi 5cm, Tulangan memanjang D13x16',
                    'toleransi' => 'Diameter tulang ±1mm',
                    'berat' => '-',
                    'grade' => 'K-300',
                    'aktif' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // ── SPESIFIKASI TIANG LISTRIK BULAT 11M
        if (isset($products['TL-11M-K300'])) {
            DB::table('global.production_product_specs')->insertOrIgnore([
                [
                    'product_id' => $products['TL-11M-K300'],
                    'kode' => 'SPEC-TL11-MAIN',
                    'produk' => 'Tiang Listrik 11M K-300',
                    'dimensi' => 'Diameter 30cm, Tinggi 1100cm, Lubang Tengah Ø5cm',
                    'toleransi' => 'Diameter ±2cm, Tinggi ±5cm',
                    'berat' => '550 kg',
                    'grade' => 'K-300',
                    'aktif' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // ── SPESIFIKASI TIANG LISTRIK BULAT 12M
        if (isset($products['TL-12M-K300'])) {
            DB::table('global.production_product_specs')->insertOrIgnore([
                [
                    'product_id' => $products['TL-12M-K300'],
                    'kode' => 'SPEC-TL12-MAIN',
                    'produk' => 'Tiang Listrik 12M K-300',
                    'dimensi' => 'Diameter 30cm, Tinggi 1200cm, Lubang Tengah Ø5cm',
                    'toleransi' => 'Diameter ±2cm, Tinggi ±5cm',
                    'berat' => '600 kg',
                    'grade' => 'K-300',
                    'aktif' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // ── SPESIFIKASI TIANG PANCANG SEGI DELAPAN 10M
        if (isset($products['TP-10M-K350'])) {
            DB::table('global.production_product_specs')->insertOrIgnore([
                [
                    'product_id' => $products['TP-10M-K350'],
                    'kode' => 'SPEC-TP10-MAIN',
                    'produk' => 'Tiang Pancang 10M K-350',
                    'dimensi' => 'Segi 8 Berlubang, Sisi 50cm, Tinggi 1000cm, Lubang Tengah 20cm',
                    'toleransi' => 'Sisi ±2cm, Tinggi ±5cm',
                    'berat' => '800 kg',
                    'grade' => 'K-350',
                    'aktif' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // ── SPESIFIKASI PANEL DINDING 120x25
        if (isset($products['PD-120-K350'])) {
            DB::table('global.production_product_specs')->insertOrIgnore([
                [
                    'product_id' => $products['PD-120-K350'],
                    'kode' => 'SPEC-PD120-MAIN',
                    'produk' => 'Panel Dinding 120x25cm K-350',
                    'dimensi' => 'Panjang 120cm, Lebar 25cm, Tebal 8cm',
                    'toleransi' => 'Panjang ±5mm, Lebar ±2mm, Tebal ±3mm',
                    'berat' => '280 kg',
                    'grade' => 'K-350',
                    'aktif' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'product_id' => $products['PD-120-K350'],
                    'kode' => 'SPEC-PD120-TULANG',
                    'produk' => 'Panel Dinding 120x25cm K-350',
                    'dimensi' => 'Tulangan D6, Spasi 10cm arah panjang, D6 Spasi 15cm arah lebar',
                    'toleransi' => '-',
                    'berat' => '-',
                    'grade' => '-',
                    'aktif' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // ── SPESIFIKASI PANEL PAGAR 300x20
        if (isset($products['PF-300-K350'])) {
            DB::table('global.production_product_specs')->insertOrIgnore([
                [
                    'product_id' => $products['PF-300-K350'],
                    'kode' => 'SPEC-PF300-MAIN',
                    'produk' => 'Panel Pagar 300x20cm K-350',
                    'dimensi' => 'Panjang 300cm, Tinggi 20cm, Tebal 6cm',
                    'toleransi' => 'Panjang ±5mm, Tinggi ±2mm, Tebal ±3mm',
                    'berat' => '200 kg',
                    'grade' => 'K-350',
                    'aktif' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // ── SPESIFIKASI U-GIRDER 20x50
        if (isset($products['BJ-UG20-K350'])) {
            DB::table('global.production_product_specs')->insertOrIgnore([
                [
                    'product_id' => $products['BJ-UG20-K350'],
                    'kode' => 'SPEC-UG20-MAIN',
                    'produk' => 'U-Girder 20x50cm K-350',
                    'dimensi' => 'Lebar Atas 50cm, Lebar Bawah 20cm, Tinggi 50cm, Panjang 12m',
                    'toleransi' => 'Lebar ±1cm, Tinggi ±1cm, Panjang ±2cm',
                    'berat' => '2500 kg',
                    'grade' => 'K-350',
                    'aktif' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // ── SPESIFIKASI BOX CULVERT 100x100
        if (isset($products['BC-1010-K350'])) {
            DB::table('global.production_product_specs')->insertOrIgnore([
                [
                    'product_id' => $products['BC-1010-K350'],
                    'kode' => 'SPEC-BC10-MAIN',
                    'produk' => 'Box Culvert 100x100cm K-350',
                    'dimensi' => 'Lebar 100cm, Tinggi 100cm, Tebal Dinding 15cm, Panjang 1m',
                    'toleransi' => 'Lebar ±1cm, Tinggi ±1cm, Tebal ±2mm',
                    'berat' => '8000 kg',
                    'grade' => 'K-350',
                    'aktif' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // ── SPESIFIKASI PIPA GORONG 800
        if (isset($products['PI-800-K300'])) {
            DB::table('global.production_product_specs')->insertOrIgnore([
                [
                    'product_id' => $products['PI-800-K300'],
                    'kode' => 'SPEC-PI800-MAIN',
                    'produk' => 'Pipa Gorong Ø800mm K-300',
                    'dimensi' => 'Diameter Dalam 800mm, Tebal Dinding 15cm, Panjang 1m',
                    'toleransi' => 'Diameter ±5mm, Tebal ±2mm, Panjang ±1cm',
                    'berat' => '3500 kg',
                    'grade' => 'K-300',
                    'aktif' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }
}
