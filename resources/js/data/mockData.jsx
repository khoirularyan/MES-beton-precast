// Mock data for Precast Concrete MES Dashboard - Bahasa Indonesia

export const company = {
  name: "PT Megacon Bangun Perkasa",
  plant: "Plant Bekasi",
  shift: "Shift 1 - Morning",
  operator: "Budi Santoso",
};

export const todayKPIs = {
  targetProduksi: 150,
  realisasiProduksi: 132,
  achievement: 88.0,
  dalamCuring: 248,
  siapQC: 45,
  reject: 6,
  rejectRate: 2.1,
  stokProdukJadi: 1842,
  pemakaianMaterial: 84.5, // ton
  utilisasiCetakan: 78,
  efisiensiProduksi: 92.4,
  worKInProgress: 312,
};

// Production trend - last 14 days
export const productionTrend = [
  { tanggal: "01 Feb", target: 140, realisasi: 132, reject: 4 },
  { tanggal: "02 Feb", target: 140, realisasi: 138, reject: 3 },
  { tanggal: "03 Feb", target: 140, realisasi: 145, reject: 5 },
  { tanggal: "04 Feb", target: 150, realisasi: 142, reject: 6 },
  { tanggal: "05 Feb", target: 150, realisasi: 148, reject: 4 },
  { tanggal: "06 Feb", target: 150, realisasi: 155, reject: 3 },
  { tanggal: "07 Feb", target: 150, realisasi: 138, reject: 7 },
  { tanggal: "08 Feb", target: 150, realisasi: 144, reject: 5 },
  { tanggal: "09 Feb", target: 160, realisasi: 158, reject: 4 },
  { tanggal: "10 Feb", target: 160, realisasi: 152, reject: 6 },
  { tanggal: "11 Feb", target: 160, realisasi: 165, reject: 3 },
  { tanggal: "12 Feb", target: 160, realisasi: 148, reject: 8 },
  { tanggal: "13 Feb", target: 150, realisasi: 142, reject: 5 },
  { tanggal: "14 Feb", target: 150, realisasi: 132, reject: 6 },
];

export const monthlyProduction = [
  { bulan: "Sep", produksi: 3240, target: 3500 },
  { bulan: "Okt", produksi: 3680, target: 3500 },
  { bulan: "Nov", produksi: 3920, target: 3800 },
  { bulan: "Des", produksi: 3450, target: 3800 },
  { bulan: "Jan", produksi: 4120, target: 4000 },
  { bulan: "Feb", produksi: 2845, target: 4200 },
];

export const topProducts = [
  { kode: "UDT-500", nama: "U-Ditch 500×500×1200", qty: 824, persen: 22 },
  { kode: "BC-800", nama: "Box Culvert 800×800×1000", qty: 612, persen: 16 },
  { kode: "PIPE-RC-600", nama: "Pipa Beton Bertulang Ø600", qty: 548, persen: 14 },
  { kode: "UDT-300", nama: "U-Ditch 300×300×1200", qty: 462, persen: 12 },
  { kode: "BAR-NJ", nama: "Barrier Beton New Jersey", qty: 384, persen: 10 },
  { kode: "CUDT-300", nama: "Cover U-Ditch 300×1200", qty: 312, persen: 8 },
];

export const recentActivities = [
  { waktu: "14:32", aktivitas: "Casting selesai", detail: "PO-2026-0241 - U-Ditch 500 (24 unit)", line: "Line-B", status: "success" },
  { waktu: "14:18", aktivitas: "Inspeksi QC lulus", detail: "Batch BC-800-0118 (18 unit)", line: "QC-01", status: "success" },
  { waktu: "13:55", aktivitas: "Curing dimulai", detail: "PO-2026-0238 - Box Culvert 800 (12 unit)", line: "Curing-A", status: "info" },
  { waktu: "13:42", aktivitas: "Demoulding", detail: "PO-2026-0235 - Pipa Ø600 (16 unit)", line: "Line-A", status: "info" },
  { waktu: "13:21", aktivitas: "Reject ditemukan", detail: "Retak pada UDT-500 (2 unit)", line: "QC-02", status: "error" },
  { waktu: "12:48", aktivitas: "Material diterima", detail: "Semen Portland 40 ton dari PT Semen Indonesia", line: "Gudang-RM", status: "info" },
  { waktu: "12:15", aktivitas: "Order produksi baru", detail: "PO-2026-0244 - Barrier NJ (60 unit)", line: "Line-D", status: "warning" },
  { waktu: "11:30", aktivitas: "Casting dimulai", detail: "PO-2026-0240 - U-Ditch 300 (30 unit)", line: "Line-B", status: "info" },
];

// ===== PRODUCTS =====
export const products = [
  { kode: "PC-BEAM-GIRDER-1200", nama: "PC Beam Girder 1200", kategori: "Beam", varian: "PC-BG-1200", spek: "1200mm × 300mm × 6000mm", grade: "K-400", berat: 3200, volume_m3: 2.160, harga: 6450000 },
  { kode: "PIPE-RC-300", nama: "Pipa Beton Bertulang Ø300mm", kategori: "Pipa", varian: "RCP-300-K350", spek: "Ø300 × 2000mm", grade: "K-350", berat: 145, volume_m3: 0.141, harga: 285000 },
  { kode: "PIPE-RC-600", nama: "Pipa Beton Bertulang Ø600mm", kategori: "Pipa", varian: "RCP-600-K350", spek: "Ø600 × 2000mm", grade: "K-350", berat: 425, volume_m3: 0.565, harga: 850000 },
  { kode: "PIPE-RC-1000", nama: "Pipa Beton Bertulang Ø1000mm", kategori: "Pipa", varian: "RCP-1000-K400", spek: "Ø1000 × 2000mm", grade: "K-400", berat: 1240, volume_m3: 1.571, harga: 2450000 },
  { kode: "PIPE-NR-300", nama: "Pipa Beton Non Bertulang Ø300", kategori: "Pipa", varian: "NRP-300-K250", spek: "Ø300 × 1000mm", grade: "K-250", berat: 78, volume_m3: 0.071, harga: 145000 },
  { kode: "JCK-PIPE-1200", nama: "Jacking Pipe Ø1200mm", kategori: "Jacking", varian: "JCK-1200-K500", spek: "Ø1200 × 2500mm", grade: "K-500", berat: 2150, volume_m3: 2.827, harga: 5800000 },
  { kode: "UDT-300", nama: "U-Ditch 300×300×1200", kategori: "U-Ditch", varian: "UDT-30-K350", spek: "300×300×1200", grade: "K-350", berat: 185, volume_m3: 0.108, harga: 320000 },
  { kode: "UDT-500", nama: "U-Ditch 500×500×1200", kategori: "U-Ditch", varian: "UDT-50-K350", spek: "500×500×1200", grade: "K-350", berat: 385, volume_m3: 0.300, harga: 685000 },
  { kode: "UDT-800", nama: "U-Ditch 800×800×1200", kategori: "U-Ditch", varian: "UDT-80-K400", spek: "800×800×1200", grade: "K-400", berat: 720, volume_m3: 0.768, harga: 1280000 },
  { kode: "CUDT-300", nama: "Cover U-Ditch 300×1200", kategori: "Cover", varian: "CVR-30-K350", spek: "300×1200×80", grade: "K-350", berat: 62, volume_m3: 0.029, harga: 145000 },
  { kode: "CUDT-500", nama: "Cover U-Ditch 500×1200", kategori: "Cover", varian: "CVR-50-K350", spek: "500×1200×100", grade: "K-350", berat: 115, volume_m3: 0.060, harga: 245000 },
  { kode: "BC-800", nama: "Box Culvert 800×800×1000", kategori: "Box Culvert", varian: "BC-80-K400", spek: "800×800×1000", grade: "K-400", berat: 945, volume_m3: 0.640, harga: 1850000 },
  { kode: "BC-1500", nama: "Box Culvert 1500×1500×1000", kategori: "Box Culvert", varian: "BC-150-K450", spek: "1500×1500×1000", grade: "K-450", berat: 2480, volume_m3: 2.250, harga: 4850000 },
  { kode: "BAR-NJ", nama: "Barrier Beton New Jersey", kategori: "Barrier", varian: "NJ-STD-K350", spek: "810×600×3000", grade: "K-350", berat: 1320, volume_m3: 1.458, harga: 2150000 },
  { kode: "SR-100", nama: "Sumur Resapan Ø1000", kategori: "Sumur Resapan", varian: "SR-100-K300", spek: "Ø1000 × 1000mm", grade: "K-300", berat: 580, volume_m3: 0.785, harga: 1150000 },
];

export const bomItems = {
  "PC-BEAM-GIRDER-1200": {
    productName: "PC Beam Girder 1200",
    activeVersion: "V2.4",
    versionLabel: "V2.4",
    lastUpdated: "04 Jun 2026",
    lastUpdatedBy: "Rina Permata",
    standardUnit: "Panel",
    bomEfficiency: 94,
    calculatedWeight: 12.4,
    estimatedProductionCost: 186500000,
    overheadPct: 18,
    components: [
      { kode: "MAT-001", nama: "Semen Portland Type I", satuan: "KG", qtyPerUnit: 210.5, wastePct: 2.5, cost: 304000, hargaPerUnit: 1450 },
      { kode: "MAT-002", nama: "Pasir Lumajang", satuan: "M3", qtyPerUnit: 0.54, wastePct: 3.1, cost: 154000, hargaPerUnit: 285000 },
      { kode: "MAT-005", nama: "Besi Beton D10", satuan: "KG", qtyPerUnit: 62.0, wastePct: 1.8, cost: 837000, hargaPerUnit: 13500 },
      { kode: "MAT-009", nama: "Sika ViscoCrete 1003", satuan: "LTR", qtyPerUnit: 4.4, wastePct: 0.5, cost: 169600, hargaPerUnit: 38500 },
      { kode: "MAT-010", nama: "MasterGlenium ACE 8595", satuan: "LTR", qtyPerUnit: 2.1, wastePct: 0.5, cost: 109200, hargaPerUnit: 52000 },
      { kode: "MAT-011", nama: "Air Bersih", satuan: "M3", qtyPerUnit: 0.18, wastePct: 0.0, cost: 1530, hargaPerUnit: 8500 },
    ],
  },
};

export const bomVersionHistory = [
  { version: "V2.4", catatan: "Optimized material mix and reduced waste", status: "Active", tanggal: "04 Jun 2026", author: "Rina Permata" },
  { version: "V2.3", catatan: "Updated reinforcement layout and casting tolerances", status: "Archived", tanggal: "28 Mei 2026", author: "Arif Hidayat" },
  { version: "V2.2", catatan: "Added new curing schedule and labor overhead", status: "Archived", tanggal: "15 Mei 2026", author: "Dewi Kartika" },
];

export const productCategories = [
  { kode: "CAT-001", nama: "Pipa", deskripsi: "Pipa beton bertulang & non bertulang", jumlahProduk: 4 },
  { kode: "CAT-002", nama: "Jacking", deskripsi: "Jacking pipe untuk micro tunneling", jumlahProduk: 1 },
  { kode: "CAT-003", nama: "U-Ditch", deskripsi: "Saluran terbuka berbentuk U", jumlahProduk: 3 },
  { kode: "CAT-004", nama: "Cover", deskripsi: "Tutup penutup U-Ditch", jumlahProduk: 2 },
  { kode: "CAT-005", nama: "Box Culvert", deskripsi: "Saluran tertutup persegi", jumlahProduk: 2 },
  { kode: "CAT-006", nama: "Barrier", deskripsi: "Pemisah jalan beton", jumlahProduk: 1 },
  { kode: "CAT-007", nama: "Sumur Resapan", deskripsi: "Drainase peresapan air", jumlahProduk: 1 },
  { kode: "CAT-008", nama: "Beam", deskripsi: "Produk girder dan balok pracetak", jumlahProduk: 1 },
];

export const concreteGrades = [
  { grade: "K-225", nama: "Beton K-225 Umum",       fc_mpa: 18.7,  slump_min_cm: 8,  slump_max_cm: 12, keterangan: "Mutu dasar" },
  { grade: "K-250", nama: "Beton K-250 Umum",       fc_mpa: 20.75, slump_min_cm: 10, slump_max_cm: 15, keterangan: "Mutu standar pekerjaan umum" },
  { grade: "K-300", nama: "Beton K-300 Struktur",   fc_mpa: 24.9,  slump_min_cm: 10, slump_max_cm: 15, keterangan: "Untuk struktur kolom & balok" },
  { grade: "K-350", nama: "Beton K-350 Precast",    fc_mpa: 29.05, slump_min_cm: 8,  slump_max_cm: 12, keterangan: "Mutu umum precast beton" },
  { grade: "K-400", nama: "Beton K-400 High Strength", fc_mpa: 33.2, slump_min_cm: 8,  slump_max_cm: 12, keterangan: "Elemen struktural berat" },
  { grade: "K-450", nama: "Beton K-450 High Strength", fc_mpa: 37.35, slump_min_cm: 6,  slump_max_cm: 10, keterangan: "Mutu tinggi, butuh admixture" },
  { grade: "K-500", nama: "Beton K-500 Ultra High", fc_mpa: 41.5,  slump_min_cm: 6,  slump_max_cm: 10, keterangan: "Mutu sangat tinggi" },
];

export const materials = [
  { kode: "MAT-001", nama: "Semen Portland Type I", satuan: "kg", stok: 184500, minStok: 50000, supplier: "PT Semen Indonesia", harga: 1450, lead_time_hari: 3 },
  { kode: "MAT-002", nama: "Pasir Lumajang", satuan: "m³", stok: 1280, minStok: 400, supplier: "CV Mitra Pasir", harga: 285000, lead_time_hari: 5 },
  { kode: "MAT-003", nama: "Batu Split 1-2", satuan: "m³", stok: 980, minStok: 300, supplier: "CV Sumber Batu", harga: 320000, lead_time_hari: 5 },
  { kode: "MAT-004", nama: "Batu Split 2-3", satuan: "m³", stok: 720, minStok: 250, supplier: "CV Sumber Batu", harga: 315000, lead_time_hari: 5 },
  { kode: "MAT-005", nama: "Besi Beton D10", satuan: "kg", stok: 42500, minStok: 15000, supplier: "PT Krakatau Steel", harga: 13500, lead_time_hari: 7 },
  { kode: "MAT-006", nama: "Besi Beton D13", satuan: "kg", stok: 38200, minStok: 15000, supplier: "PT Krakatau Steel", harga: 13800, lead_time_hari: 7 },
  { kode: "MAT-007", nama: "Besi Beton D16", satuan: "kg", stok: 28400, minStok: 10000, supplier: "PT Krakatau Steel", harga: 14200, lead_time_hari: 7 },
  { kode: "MAT-008", nama: "Wire Mesh M8 150×150", satuan: "lembar", stok: 845, minStok: 200, supplier: "PT Master Steel", harga: 425000, lead_time_hari: 10 },
  { kode: "MAT-009", nama: "Sika ViscoCrete 1003", satuan: "liter", stok: 4250, minStok: 1000, supplier: "PT Sika Indonesia", harga: 38500, lead_time_hari: 14 },
  { kode: "MAT-010", nama: "MasterGlenium ACE 8595", satuan: "liter", stok: 2180, minStok: 500, supplier: "PT MBCC Indonesia", harga: 52000, lead_time_hari: 14 },
  { kode: "MAT-011", nama: "Air Bersih", satuan: "m³", stok: 145, minStok: 50, supplier: "Internal", harga: 8500, lead_time_hari: 1 },
];

export const molds = [
  { kode: "MD-PRC-300", nama: "Cetakan Pipa RC Ø300", produk: "PIPE-RC-300", jumlah: 8, aktif: 7, kondisi: "Baik" },
  { kode: "MD-PRC-600", nama: "Cetakan Pipa RC Ø600", produk: "PIPE-RC-600", jumlah: 6, aktif: 5, kondisi: "Baik" },
  { kode: "MD-PRC-1000", nama: "Cetakan Pipa RC Ø1000", produk: "PIPE-RC-1000", jumlah: 4, aktif: 3, kondisi: "Sedang" },
  { kode: "MD-UDT-300", nama: "Cetakan U-Ditch 300", produk: "UDT-300", jumlah: 12, aktif: 11, kondisi: "Baik" },
  { kode: "MD-UDT-500", nama: "Cetakan U-Ditch 500", produk: "UDT-500", jumlah: 10, aktif: 9, kondisi: "Baik" },
  { kode: "MD-UDT-800", nama: "Cetakan U-Ditch 800", produk: "UDT-800", jumlah: 6, aktif: 4, kondisi: "Perlu Perawatan" },
  { kode: "MD-BC-800", nama: "Cetakan Box Culvert 800", produk: "BC-800", jumlah: 5, aktif: 4, kondisi: "Baik" },
  { kode: "MD-BC-1500", nama: "Cetakan Box Culvert 1500", produk: "BC-1500", jumlah: 3, aktif: 2, kondisi: "Sedang" },
  { kode: "MD-BAR-NJ", nama: "Cetakan Barrier NJ", produk: "BAR-NJ", jumlah: 8, aktif: 7, kondisi: "Baik" },
];

export const customers = [
  { kode: "CST-0001", nama: "PT Wijaya Karya (Persero) Tbk", kontak: "Bpk. Hadi Pratama", telepon: "021-8192808", kota: "Jakarta", segmen: "BUMN Konstruksi", limitKredit: 5000000000, npwp: "01.234.567.8-012.000", pic_proyek: "Ir. Bambang Tjahjono" },
  { kode: "CST-0002", nama: "PT Adhi Karya (Persero) Tbk", kontak: "Bpk. Sutrisno", telepon: "021-8093003", kota: "Jakarta", segmen: "BUMN Konstruksi", limitKredit: 4500000000, npwp: "02.345.678.9-012.000", pic_proyek: "Drs. Agus Setiawan, MT" },
  { kode: "CST-0003", nama: "PT PP (Persero) Tbk", kontak: "Ibu Ratna Sari", telepon: "021-8403883", kota: "Jakarta", segmen: "BUMN Konstruksi", limitKredit: 4000000000, npwp: "03.456.789.0-012.000", pic_proyek: "Ir. Sri Wahyuni" },
  { kode: "CST-0004", nama: "PT Hutama Karya (Persero)", kontak: "Bpk. Andi Wijaya", telepon: "021-8193708", kota: "Jakarta", segmen: "BUMN Konstruksi", limitKredit: 6000000000, npwp: "04.567.890.1-012.000", pic_proyek: "Ir. Fajar Ramadhan" },
  { kode: "CST-0005", nama: "Dinas PU Kota Surabaya", kontak: "Bpk. Sunarto, ST", telepon: "031-5345555", kota: "Surabaya", segmen: "Pemerintah", limitKredit: 2500000000, npwp: "00.000.000.0-000.000", pic_proyek: "Drs. Heru Prasetyo, MT" },
  { kode: "CST-0006", nama: "PT Brantas Abipraya (Persero)", kontak: "Ibu Lia Maharani", telepon: "021-8516290", kota: "Jakarta", segmen: "BUMN Konstruksi", limitKredit: 3500000000, npwp: "05.678.901.2-012.000", pic_proyek: "Ir. Dewi Kartikasari" },
  { kode: "CST-0007", nama: "PT Jasamarga Tollroad", kontak: "Bpk. Eko Prasetyo", telepon: "021-8413630", kota: "Jakarta", segmen: "Swasta", limitKredit: 5500000000, npwp: "06.789.012.3-012.000", pic_proyek: "Ir. Rudi Hartono" },
  { kode: "CST-0008", nama: "CV Bumi Persada", kontak: "Bpk. Joko", telepon: "031-7654321", kota: "Sidoarjo", segmen: "Swasta", limitKredit: 800000000, npwp: "07.890.123.4-012.000", pic_proyek: "Amin Joko Santoso" },
];

export const suppliers = [
  { kode: "SUP-001", nama: "PT Semen Indonesia (Persero) Tbk", material: "Semen Portland", kontak: "021-5266666", kota: "Jakarta", rating: 5, lead_time_hari: 3 },
  { kode: "SUP-002", nama: "PT Holcim Indonesia Tbk", material: "Semen", kontak: "021-5125222", kota: "Jakarta", rating: 4, lead_time_hari: 3 },
  { kode: "SUP-003", nama: "PT Krakatau Steel (Persero)", material: "Besi Beton", kontak: "0254-392159", kota: "Cilegon", rating: 5, lead_time_hari: 7 },
  { kode: "SUP-004", nama: "PT Master Steel Mfg", material: "Wire Mesh & Besi", kontak: "021-8907788", kota: "Bekasi", rating: 4, lead_time_hari: 10 },
  { kode: "SUP-005", nama: "PT Sika Indonesia", material: "Admixture", kontak: "021-29516310", kota: "Bogor", rating: 5, lead_time_hari: 14 },
  { kode: "SUP-006", nama: "PT MBCC Indonesia", material: "Admixture", kontak: "021-29856100", kota: "Cikarang", rating: 4, lead_time_hari: 14 },
  { kode: "SUP-007", nama: "CV Mitra Pasir Lumajang", material: "Pasir & Agregat", kontak: "0334-892211", kota: "Lumajang", rating: 4, lead_time_hari: 5 },
  { kode: "SUP-008", nama: "CV Sumber Batu Pasuruan", material: "Batu Split", kontak: "0343-413322", kota: "Pasuruan", rating: 4, lead_time_hari: 5 },
];

export const warehouses = [
  { kode: "WH-RM", nama: "Gudang Bahan Baku", tipe: "Raw Material", lokasi: "Area Utara", kapasitas: "8.500 ton" },
  { kode: "WH-WIP", nama: "Area WIP Casting", tipe: "Work In Progress", lokasi: "Area Produksi", kapasitas: "400 unit" },
  { kode: "WH-CUR", nama: "Area Curing", tipe: "Work In Progress", lokasi: "Area Tengah", kapasitas: "350 unit" },
  { kode: "WH-FG", nama: "Gudang Produk Jadi", tipe: "Finished Goods", lokasi: "Area Selatan", kapasitas: "2.500 unit" },
  { kode: "WH-REJ", nama: "Area Reject", tipe: "Reject", lokasi: "Area Timur", kapasitas: "100 unit" },
];

export const productionLines = [
  { kode: "LINE-A", nama: "Line A - Pipa Beton", produk: "Pipa RC & NR", kapasitas: 48, output: 42, status: "Aktif", supervisor: "Ahmad Suparman" },
  { kode: "LINE-B", nama: "Line B - U-Ditch", produk: "U-Ditch & Cover", kapasitas: 60, output: 56, status: "Aktif", supervisor: "Joko Widodo" },
  { kode: "LINE-C", nama: "Line C - Box Culvert", produk: "Box Culvert", kapasitas: 24, output: 18, status: "Aktif", supervisor: "Sutrisno" },
  { kode: "LINE-D", nama: "Line D - Barrier", produk: "Barrier & Sumur Resapan", kapasitas: 36, output: 16, status: "Maintenance", supervisor: "Bambang Wijaya" },
];

export const machines = [
  { kode: "MCH-001", nama: "Batching Plant 60 m³/jam", tipe: "Mixer", line: "Sentral", status: "Running", lastMaintenance: "2026-01-15", nextMaintenance: "2026-03-15" },
  { kode: "MCH-002", nama: "Overhead Crane 10 Ton", tipe: "Material Handling", line: "Line-A", status: "Running", lastMaintenance: "2026-01-22", nextMaintenance: "2026-04-22" },
  { kode: "MCH-003", nama: "Vibrating Table HD-2000", tipe: "Casting", line: "Line-B", status: "Running", lastMaintenance: "2026-02-01", nextMaintenance: "2026-05-01" },
  { kode: "MCH-004", nama: "Steam Curing Chamber 1", tipe: "Curing", line: "Curing-A", status: "Running", lastMaintenance: "2026-01-10", nextMaintenance: "2026-04-10" },
  { kode: "MCH-005", nama: "Steam Curing Chamber 2", tipe: "Curing", line: "Curing-B", status: "Running", lastMaintenance: "2026-01-10", nextMaintenance: "2026-04-10" },
  { kode: "MCH-006", nama: "Concrete Pump 40 m³/jam", tipe: "Casting", line: "Line-C", status: "Running", lastMaintenance: "2026-02-05", nextMaintenance: "2026-05-05" },
  { kode: "MCH-007", nama: "Compressive Strength Tester", tipe: "QC Lab", line: "QC-Lab", status: "Running", lastMaintenance: "2026-01-30", nextMaintenance: "2026-07-30" },
  { kode: "MCH-008", nama: "Forklift 5 Ton #1", tipe: "Material Handling", line: "Warehouse", status: "Maintenance", lastMaintenance: "2026-02-14", nextMaintenance: "2026-02-20" },
];

export const employees = [
  { nik: "EMP-2018-001", nama: "Budi Santoso", jabatan: "Plant Manager", departemen: "Produksi", shift: "Pagi", status: "Aktif" },
  { nik: "EMP-2019-014", nama: "Ahmad Suparman", jabatan: "Supervisor Line-A", departemen: "Produksi", shift: "Pagi", status: "Aktif" },
  { nik: "EMP-2019-027", nama: "Joko Widodo", jabatan: "Supervisor Line-B", departemen: "Produksi", shift: "Pagi", status: "Aktif" },
  { nik: "EMP-2020-038", nama: "Sutrisno", jabatan: "Supervisor Line-C", departemen: "Produksi", shift: "Sore", status: "Aktif" },
  { nik: "EMP-2020-051", nama: "Bambang Wijaya", jabatan: "Supervisor Line-D", departemen: "Produksi", shift: "Pagi", status: "Aktif" },
  { nik: "EMP-2021-062", nama: "Rina Kusumawati", jabatan: "QC Engineer", departemen: "Quality", shift: "Pagi", status: "Aktif" },
  { nik: "EMP-2021-073", nama: "Hendra Gunawan", jabatan: "QC Engineer", departemen: "Quality", shift: "Sore", status: "Aktif" },
  { nik: "EMP-2022-085", nama: "Slamet Riyadi", jabatan: "Operator Batching", departemen: "Produksi", shift: "Pagi", status: "Aktif" },
  { nik: "EMP-2022-098", nama: "Eko Saputra", jabatan: "Operator Crane", departemen: "Produksi", shift: "Pagi", status: "Aktif" },
  { nik: "EMP-2023-104", nama: "Dewi Anggraini", jabatan: "Admin Gudang", departemen: "Logistik", shift: "Pagi", status: "Aktif" },
];

export const shifts = [
  { kode: "SHF-1", nama: "Shift Pagi", jam: "07:00 - 15:00", supervisor: "Budi Santoso", jumlahPekerja: 42 },
  { kode: "SHF-2", nama: "Shift Sore", jam: "15:00 - 23:00", supervisor: "Sutrisno", jumlahPekerja: 38 },
  { kode: "SHF-3", nama: "Shift Malam", jam: "23:00 - 07:00", supervisor: "Hendra Gunawan", jumlahPekerja: 18 },
];

// ===== PRODUCTION ORDERS =====
export const productionOrders = [
  { no: "PO-2026-0244", produk: "Barrier Beton NJ", qty: 60, line: "LINE-D", customer: "PT Hutama Karya", tglMulai: "2026-02-14", tglSelesai: "2026-02-20", progress: 5, status: "Direncanakan", prioritas: "Tinggi", executed: 0 },
  { no: "PO-2026-0243", produk: "Box Culvert 1500", qty: 24, line: "LINE-C", customer: "Dinas PU Surabaya", tglMulai: "2026-02-13", tglSelesai: "2026-02-19", progress: 35, status: "Casting", prioritas: "Tinggi", executed: 0 },
  { no: "PO-2026-0242", produk: "U-Ditch 800", qty: 48, line: "LINE-B", customer: "PT Wijaya Karya", tglMulai: "2026-02-12", tglSelesai: "2026-02-18", progress: 60, status: "Curing", prioritas: "Sedang", executed: 0 },
  { no: "PO-2026-0241", produk: "U-Ditch 500", qty: 80, line: "LINE-B", customer: "PT Adhi Karya", tglMulai: "2026-02-11", tglSelesai: "2026-02-17", progress: 78, status: "Curing", prioritas: "Tinggi", executed: 0 },
  { no: "PO-2026-0240", produk: "U-Ditch 300", qty: 120, line: "LINE-B", customer: "PT PP", tglMulai: "2026-02-10", tglSelesai: "2026-02-15", progress: 92, status: "QC", prioritas: "Sedang", executed: 0 },
  { no: "PO-2026-0239", produk: "Pipa RC Ø1000", qty: 16, line: "LINE-A", customer: "PT Brantas Abipraya", tglMulai: "2026-02-10", tglSelesai: "2026-02-16", progress: 70, status: "Curing", prioritas: "Tinggi", executed: 0 },
  { no: "PO-2026-0238", produk: "Box Culvert 800", qty: 32, line: "LINE-C", customer: "PT Jasamarga", tglMulai: "2026-02-09", tglSelesai: "2026-02-15", progress: 85, status: "Demoulding", prioritas: "Sedang", executed: 0 },
  { no: "PO-2026-0237", produk: "Pipa RC Ø600", qty: 48, line: "LINE-A", customer: "Dinas PU Surabaya", tglMulai: "2026-02-08", tglSelesai: "2026-02-14", progress: 100, status: "Selesai", prioritas: "Sedang", executed: 0 },
  { no: "PO-2026-0236", produk: "Cover U-Ditch 500", qty: 96, line: "LINE-B", customer: "PT Wijaya Karya", tglMulai: "2026-02-07", tglSelesai: "2026-02-13", progress: 100, status: "Selesai", prioritas: "Rendah", executed: 0 },
  { no: "PO-2026-0235", produk: "Pipa RC Ø600", qty: 24, line: "LINE-A", customer: "CV Bumi Persada", tglMulai: "2026-02-06", tglSelesai: "2026-02-12", progress: 100, status: "Selesai", prioritas: "Rendah", executed: 0 },
];

// ===== PLANNING (Gantt-like) =====
export const planningRows = [
  { no: "PO-2026-0240", produk: "U-Ditch 300", batch: "BATCH-B", start: 0, duration: 5, status: "Selesai" },
  { no: "PO-2026-0241", produk: "U-Ditch 500", batch: "BATCH-B", start: 1, duration: 6, status: "Progress" },
  { no: "PO-2026-0242", produk: "U-Ditch 800", batch: "BATCH-B", start: 2, duration: 6, status: "Progress" },
  { no: "PO-2026-0238", produk: "Box Culvert 800", batch: "BATCH-C", start: 0, duration: 6, status: "Progress" },
  { no: "PO-2026-0243", produk: "Box Culvert 1500", batch: "BATCH-C", start: 3, duration: 6, status: "Progress" },
  { no: "PO-2026-0239", produk: "Pipa RC Ø1000", batch: "BATCH-A", start: 0, duration: 6, status: "Progress" },
  { no: "PO-2026-0237", produk: "Pipa RC Ø600", batch: "BATCH-A", start: 2, duration: 6, status: "Selesai" },
  { no: "PO-2026-0244", produk: "Barrier NJ", batch: "BATCH-D", start: 4, duration: 6, status: "Direncanakan" },
];

// ===== CURING =====
export const curingBatches = [
  { batch: "CUR-0241-A", po: "PO-2026-0241", produk: "U-Ditch 500", qty: 28, chamber: "Curing-A", mulai: "2026-02-13 06:00", target: "2026-02-15 06:00", suhu: 65, kelembaban: 95, progress: 78 },
  { batch: "CUR-0242-A", po: "PO-2026-0242", produk: "U-Ditch 800", qty: 16, chamber: "Curing-A", mulai: "2026-02-13 14:00", target: "2026-02-15 14:00", suhu: 68, kelembaban: 92, progress: 62 },
  { batch: "CUR-0239-B", po: "PO-2026-0239", produk: "Pipa RC Ø1000", qty: 8, chamber: "Curing-B", mulai: "2026-02-12 18:00", target: "2026-02-14 18:00", suhu: 70, kelembaban: 90, progress: 88 },
  { batch: "CUR-0243-B", po: "PO-2026-0243", produk: "Box Culvert 1500", qty: 12, chamber: "Curing-B", mulai: "2026-02-14 04:00", target: "2026-02-16 04:00", suhu: 67, kelembaban: 93, progress: 35 },
];

// ===== QC =====
export const qcInspections = [
  { no: "QC-2026-0118", po: "PO-2026-0240", produk: "U-Ditch 300", qty: 30, dimensiOK: 28, dimensiReject: 2, kuatTekan: 32.4, status: "Lulus", inspektur: "Rina Kusumawati", tanggal: "2026-02-14" },
  { no: "QC-2026-0117", po: "PO-2026-0238", produk: "Box Culvert 800", qty: 18, dimensiOK: 18, dimensiReject: 0, kuatTekan: 35.8, status: "Lulus", inspektur: "Hendra Gunawan", tanggal: "2026-02-14" },
  { no: "QC-2026-0116", po: "PO-2026-0237", produk: "Pipa RC Ø600", qty: 24, dimensiOK: 23, dimensiReject: 1, kuatTekan: 31.2, status: "Lulus", inspektur: "Rina Kusumawati", tanggal: "2026-02-13" },
  { no: "QC-2026-0115", po: "PO-2026-0236", produk: "Cover U-Ditch 500", qty: 48, dimensiOK: 47, dimensiReject: 1, kuatTekan: 30.5, status: "Lulus", inspektur: "Hendra Gunawan", tanggal: "2026-02-13" },
  { no: "QC-2026-0114", po: "PO-2026-0235", produk: "Pipa RC Ø600", qty: 24, dimensiOK: 22, dimensiReject: 2, kuatTekan: 29.8, status: "Lulus Bersyarat", inspektur: "Rina Kusumawati", tanggal: "2026-02-12" },
  { no: "QC-2026-0113", po: "PO-2026-0234", produk: "U-Ditch 500", qty: 30, dimensiOK: 26, dimensiReject: 4, kuatTekan: 28.4, status: "Reject", inspektur: "Hendra Gunawan", tanggal: "2026-02-11" },
];

export const strengthTests = [
  { kode: "STR-0089", batch: "CUR-0241-A", grade: "K-350", umur: 7, target: 29.05, hasil: 22.1, persen: 76, status: "Sesuai" },
  { kode: "STR-0088", batch: "CUR-0239-B", grade: "K-400", umur: 28, target: 33.2, hasil: 35.8, persen: 108, status: "Lulus" },
  { kode: "STR-0087", batch: "CUR-0237-A", grade: "K-350", umur: 28, target: 29.05, hasil: 31.2, persen: 107, status: "Lulus" },
  { kode: "STR-0086", batch: "CUR-0238-B", grade: "K-400", umur: 14, target: 33.2, hasil: 28.4, persen: 86, status: "Sesuai" },
  { kode: "STR-0085", batch: "CUR-0236-A", grade: "K-350", umur: 28, target: 29.05, hasil: 30.5, persen: 105, status: "Lulus" },
  { kode: "STR-0084", batch: "CUR-0234-A", grade: "K-350", umur: 28, target: 29.05, hasil: 26.2, persen: 90, status: "Gagal" },
];

export const rejects = [
  { no: "REJ-2026-018", produk: "U-Ditch 500", qty: 4, alasan: "Retak struktural", po: "PO-2026-0234", tanggal: "2026-02-11", disposisi: "Hancurkan" },
  { no: "REJ-2026-017", produk: "Pipa RC Ø600", qty: 2, alasan: "Dimensi tidak sesuai", po: "PO-2026-0235", tanggal: "2026-02-10", disposisi: "Rework" },
  { no: "REJ-2026-016", produk: "Box Culvert 800", qty: 1, alasan: "Cacat permukaan", po: "PO-2026-0232", tanggal: "2026-02-09", disposisi: "Downgrade" },
  { no: "REJ-2026-015", produk: "U-Ditch 300", qty: 2, alasan: "Honeycomb", po: "PO-2026-0231", tanggal: "2026-02-08", disposisi: "Hancurkan" },
  { no: "REJ-2026-014", produk: "Cover U-Ditch 500", qty: 1, alasan: "Tulangan terekspos", po: "PO-2026-0230", tanggal: "2026-02-07", disposisi: "Rework" },
];

// ===== SALES =====
export const salesOrders = [
  { no: "SO-2026-0098", customer: "PT Wijaya Karya", produk: "U-Ditch 500 (200), U-Ditch 800 (80)", nilai: 239800000, tglOrder: "2026-02-12", tglKirim: "2026-02-25", status: "Konfirmasi" },
  { no: "SO-2026-0097", customer: "PT Hutama Karya", produk: "Barrier NJ (120)", nilai: 258000000, tglOrder: "2026-02-11", tglKirim: "2026-02-28", status: "Produksi" },
  { no: "SO-2026-0096", customer: "Dinas PU Surabaya", produk: "Box Culvert 1500 (24)", nilai: 116400000, tglOrder: "2026-02-10", tglKirim: "2026-02-22", status: "Produksi" },
  { no: "SO-2026-0095", customer: "PT Adhi Karya", produk: "U-Ditch 500 (80), Cover (160)", nilai: 93000000, tglOrder: "2026-02-09", tglKirim: "2026-02-20", status: "Siap Kirim" },
  { no: "SO-2026-0094", customer: "PT PP", produk: "U-Ditch 300 (120)", nilai: 38400000, tglOrder: "2026-02-08", tglKirim: "2026-02-18", status: "Siap Kirim" },
  { no: "SO-2026-0093", customer: "PT Brantas Abipraya", produk: "Pipa RC Ø1000 (16)", nilai: 39200000, tglOrder: "2026-02-07", tglKirim: "2026-02-18", status: "Produksi" },
  { no: "SO-2026-0092", customer: "PT Jasamarga", produk: "Box Culvert 800 (32)", nilai: 59200000, tglOrder: "2026-02-06", tglKirim: "2026-02-16", status: "Selesai" },
  { no: "SO-2026-0091", customer: "CV Bumi Persada", produk: "Pipa RC Ø600 (24)", nilai: 20400000, tglOrder: "2026-02-05", tglKirim: "2026-02-14", status: "Selesai" },
];

export const deliveryOrders = [
  { no: "DO-2026-0142", so: "SO-2026-0095", customer: "PT Adhi Karya", qty: "80 U-Ditch + 160 Cover", truk: "B-9012-AB / L-8821-CD", driver: "Pak Yono, Pak Karto", tglKirim: "2026-02-15", status: "Dalam Perjalanan" },
  { no: "DO-2026-0141", so: "SO-2026-0094", customer: "PT PP", qty: "120 U-Ditch 300", truk: "B-9145-XY", driver: "Pak Sukirno", tglKirim: "2026-02-15", status: "Siap Berangkat" },
  { no: "DO-2026-0140", so: "SO-2026-0092", customer: "PT Jasamarga", qty: "32 Box Culvert 800", truk: "B-9821-MN", driver: "Pak Tarmin", tglKirim: "2026-02-14", status: "Selesai" },
  { no: "DO-2026-0139", so: "SO-2026-0091", customer: "CV Bumi Persada", qty: "24 Pipa RC Ø600", truk: "L-8244-EF", driver: "Pak Sugeng", tglKirim: "2026-02-14", status: "Selesai" },
  { no: "DO-2026-0138", so: "SO-2026-0089", customer: "PT Wijaya Karya", qty: "60 U-Ditch 800", truk: "B-9322-GH", driver: "Pak Mulyono", tglKirim: "2026-02-13", status: "Selesai" },
];

// ===== PURCHASING =====
export const purchaseOrders = [
  { no: "PR-2026-0048", supplier: "PT Semen Indonesia", item: "Semen Portland Type I", qty: "100 ton", nilai: 145000000, tglOrder: "2026-02-13", tglTiba: "2026-02-17", status: "Konfirmasi" },
  { no: "PR-2026-0047", supplier: "PT Krakatau Steel", item: "Besi Beton D13", qty: "12 ton", nilai: 165600000, tglOrder: "2026-02-12", tglTiba: "2026-02-18", status: "Konfirmasi" },
  { no: "PR-2026-0046", supplier: "CV Mitra Pasir", item: "Pasir Lumajang", qty: "400 m³", nilai: 114000000, tglOrder: "2026-02-11", tglTiba: "2026-02-15", status: "Diterima" },
  { no: "PR-2026-0045", supplier: "PT Sika Indonesia", item: "Sika ViscoCrete 1003", qty: "2000 liter", nilai: 77000000, tglOrder: "2026-02-10", tglTiba: "2026-02-16", status: "Pengiriman" },
  { no: "PR-2026-0044", supplier: "CV Sumber Batu", item: "Batu Split 1-2", qty: "300 m³", nilai: 96000000, tglOrder: "2026-02-08", tglTiba: "2026-02-13", status: "Diterima" },
  { no: "PR-2026-0043", supplier: "PT Master Steel", item: "Wire Mesh M8", qty: "200 lembar", nilai: 85000000, tglOrder: "2026-02-07", tglTiba: "2026-02-14", status: "Diterima" },
];

// ===== INVENTORY =====
export const finishedGoods = [
  { kode: "UDT-500", nama: "U-Ditch 500×500×1200", stok: 248, reserved: 80, available: 168, gudang: "WH-FG", lokasi: "Rak A1-A4" },
  { kode: "BC-800", nama: "Box Culvert 800×800×1000", stok: 142, reserved: 32, available: 110, gudang: "WH-FG", lokasi: "Rak B1-B3" },
  { kode: "PIPE-RC-600", nama: "Pipa Beton Bertulang Ø600", stok: 186, reserved: 24, available: 162, gudang: "WH-FG", lokasi: "Rak C1-C4" },
  { kode: "UDT-300", nama: "U-Ditch 300×300×1200", stok: 312, reserved: 120, available: 192, gudang: "WH-FG", lokasi: "Rak A5-A8" },
  { kode: "BAR-NJ", nama: "Barrier Beton New Jersey", stok: 88, reserved: 0, available: 88, gudang: "WH-FG", lokasi: "Rak D1-D2" },
  { kode: "CUDT-300", nama: "Cover U-Ditch 300×1200", stok: 264, reserved: 96, available: 168, gudang: "WH-FG", lokasi: "Rak E1-E2" },
  { kode: "BC-1500", nama: "Box Culvert 1500×1500×1000", stok: 38, reserved: 24, available: 14, gudang: "WH-FG", lokasi: "Rak B4" },
  { kode: "PIPE-RC-1000", nama: "Pipa Beton Bertulang Ø1000", stok: 42, reserved: 16, available: 26, gudang: "WH-FG", lokasi: "Rak C5" },
];

export const stockMovements = [
  { no: "SM-2026-0234", tipe: "Masuk", item: "Pasir Lumajang", qty: "400 m³", referensi: "PR-2026-0046", tanggal: "2026-02-14 09:15", lokasi: "WH-RM" },
  { no: "SM-2026-0233", tipe: "Keluar", item: "U-Ditch 500", qty: "60 unit", referensi: "DO-2026-0138", tanggal: "2026-02-14 08:45", lokasi: "WH-FG" },
  { no: "SM-2026-0232", tipe: "Masuk", item: "Box Culvert 800", qty: "18 unit", referensi: "QC-2026-0117", tanggal: "2026-02-14 07:20", lokasi: "WH-FG" },
  { no: "SM-2026-0231", tipe: "Keluar", item: "Semen Portland", qty: "8.4 ton", referensi: "BC-2026-0089", tanggal: "2026-02-14 06:30", lokasi: "WH-RM" },
  { no: "SM-2026-0230", tipe: "Pindah", item: "U-Ditch 300", qty: "30 unit", referensi: "PO-2026-0240", tanggal: "2026-02-13 18:10", lokasi: "WH-CUR → WH-FG" },
  { no: "SM-2026-0229", tipe: "Masuk", item: "Batu Split 1-2", qty: "300 m³", referensi: "PR-2026-0044", tanggal: "2026-02-13 14:25", lokasi: "WH-RM" },
];

export const materialConsumption = [
  { tanggal: "08 Feb", semen: 76, agregat: 142, besi: 12 },
  { tanggal: "09 Feb", semen: 82, agregat: 154, besi: 14 },
  { tanggal: "10 Feb", semen: 78, agregat: 148, besi: 13 },
  { tanggal: "11 Feb", semen: 85, agregat: 162, besi: 15 },
  { tanggal: "12 Feb", semen: 80, agregat: 152, besi: 13 },
  { tanggal: "13 Feb", semen: 88, agregat: 168, besi: 16 },
  { tanggal: "14 Feb", semen: 84, agregat: 158, besi: 14 },
];

// ===== MAINTENANCE =====
export const maintenanceLog = [
  { no: "MT-2026-0042", mesin: "MCH-008", nama: "Forklift 5 Ton #1", tipe: "Korektif", masalah: "Hidrolik bocor", teknisi: "Tim Mekanik A", mulai: "2026-02-14 10:00", estimasi: "2026-02-20", status: "Berlangsung" },
  { no: "MT-2026-0041", mesin: "MCH-006", nama: "Concrete Pump 40 m³/jam", tipe: "Preventif", masalah: "Service 1500 jam", teknisi: "Tim Mekanik B", mulai: "2026-02-12 08:00", estimasi: "2026-02-12", status: "Selesai" },
  { no: "MT-2026-0040", mesin: "MCH-003", nama: "Vibrating Table HD-2000", tipe: "Preventif", masalah: "Pelumasan bearing", teknisi: "Tim Mekanik A", mulai: "2026-02-10 14:00", estimasi: "2026-02-10", status: "Selesai" },
  { no: "MT-2026-0039", mesin: "MCH-001", nama: "Batching Plant", tipe: "Korektif", masalah: "Kalibrasi sensor agregat", teknisi: "PT Mitra Servis", mulai: "2026-02-08 06:00", estimasi: "2026-02-08", status: "Selesai" },
  { no: "MT-2026-0038", mesin: "MCH-005", nama: "Steam Curing Chamber 2", tipe: "Preventif", masalah: "Cek katup uap", teknisi: "Tim Mekanik B", mulai: "2026-02-05 10:00", estimasi: "2026-02-05", status: "Selesai" },
];

// ===== Reports data =====
export const monthlyByProduct = [
  { produk: "U-Ditch", produksi: 1284, persen: 32 },
  { produk: "Box Culvert", produksi: 642, persen: 16 },
  { produk: "Pipa Beton", produksi: 548, persen: 14 },
  { produk: "Cover", produksi: 462, persen: 12 },
  { produk: "Barrier", produksi: 384, persen: 10 },
  { produk: "Jacking Pipe", produksi: 124, persen: 3 },
  { produk: "Sumur Resapan", produksi: 162, persen: 4 },
  { produk: "Pipa NR", produksi: 285, persen: 7 },
];

export const rejectByReason = [
  { alasan: "Retak struktural", jumlah: 14, persen: 28 },
  { alasan: "Dimensi tidak sesuai", jumlah: 11, persen: 22 },
  { alasan: "Honeycomb", jumlah: 9, persen: 18 },
  { alasan: "Cacat permukaan", jumlah: 8, persen: 16 },
  { alasan: "Tulangan terekspos", jumlah: 5, persen: 10 },
  { alasan: "Lainnya", jumlah: 3, persen: 6 },
];

export const efficiencyByLine = [
  { line: "Line-A", utilisasi: 87, output: 92, oee: 80 },
  { line: "Line-B", utilisasi: 93, output: 96, oee: 89 },
  { line: "Line-C", utilisasi: 75, output: 82, oee: 61 },
  { line: "Line-D", utilisasi: 44, output: 58, oee: 26 },
];

export const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/", permission: "dashboard.view" },
  { id: "master-data", label: "Master Data", icon: "Database", path: "/master-data", permission: "master-data.view" },
  { id: "master-bom", label: "Master BOM", icon: "Package", path: "/master-bom", permission: "master-bom.view" },
  { id: "sales", label: "Sales", icon: "ShoppingBag", path: "/sales", permission: "sales.view" },
  { id: "planning", label: "Production Planning", icon: "CalendarRange", path: "/planning", permission: "planning.view" },
  { id: "work-orders", label: "Production Execution", icon: "PlayCircle", path: "/work-orders", permission: "work-orders.view" },
  { id: "quality", label: "Quality Control", icon: "ShieldCheck", path: "/quality", permission: "quality.view" },
  { id: "inventory", label: "Inventory", icon: "Package", path: "/inventory", permission: "inventory.view" },
  { id: "delivery", label: "Delivery", icon: "Truck", path: "/delivery", permission: "delivery.view" },
  { id: "reports", label: "Reports", icon: "FileBarChart", path: "/reports", permission: "reports.view" },
  { id: "user-access", label: "User Access", icon: "UsersRound", path: "/user-access", permission: "user-access.manage" },
];

// ===== CONFIGURABLE MASTER DATA (extended) =====

export const productTypes = [
  { kode: "TYP-001", kategori: "Pipa", nama: "Reinforced Concrete Pipe", kodePrefix: "RCP", standar: "SNI 6369:2008", aktif: true },
  { kode: "TYP-002", kategori: "Pipa", nama: "Non-Reinforced Concrete Pipe", kodePrefix: "NRP", standar: "SNI 03-2853-1992", aktif: true },
  { kode: "TYP-003", kategori: "U-Ditch", nama: "U-Ditch Standard", kodePrefix: "UDT", standar: "SNI 7833:2012", aktif: true },
  { kode: "TYP-004", kategori: "U-Ditch", nama: "U-Ditch Heavy Duty", kodePrefix: "UDTH", standar: "SNI 7833:2012", aktif: true },
  { kode: "TYP-005", kategori: "Cover", nama: "Cover U-Ditch", kodePrefix: "CVR", standar: "SNI 7833:2012", aktif: true },
  { kode: "TYP-006", kategori: "Box Culvert", nama: "Box Culvert Single", kodePrefix: "BCS", standar: "SNI 4810:2013", aktif: true },
  { kode: "TYP-007", kategori: "Box Culvert", nama: "Box Culvert Double", kodePrefix: "BCD", standar: "SNI 4810:2013", aktif: true },
  { kode: "TYP-008", kategori: "Barrier", nama: "New Jersey Barrier", kodePrefix: "NJ", standar: "AASHTO LRFD", aktif: true },
  { kode: "TYP-009", kategori: "Sumur Resapan", nama: "Sumur Resapan Modular", kodePrefix: "SR", standar: "SNI 03-2453-2002", aktif: true },
  { kode: "TYP-010", kategori: "Jacking", nama: "Micro-Tunneling Pipe", kodePrefix: "JCK", standar: "ASTM C76", aktif: true },
];

export const productSpecifications = [
  { kode: "SPEC-001", produk: "U-Ditch 300", dimensi: "300×300×1200 mm", toleransi: "± 5 mm", berat: "185 kg", grade: "K-350", aktif: true },
  { kode: "SPEC-002", produk: "U-Ditch 500", dimensi: "500×500×1200 mm", toleransi: "± 5 mm", berat: "385 kg", grade: "K-350", aktif: true },
  { kode: "SPEC-003", produk: "U-Ditch 800", dimensi: "800×800×1200 mm", toleransi: "± 8 mm", berat: "720 kg", grade: "K-400", aktif: true },
  { kode: "SPEC-004", produk: "Box Culvert 800", dimensi: "800×800×1000 mm", toleransi: "± 8 mm", berat: "945 kg", grade: "K-400", aktif: true },
  { kode: "SPEC-005", produk: "Box Culvert 1500", dimensi: "1500×1500×1000 mm", toleransi: "± 10 mm", berat: "2480 kg", grade: "K-450", aktif: true },
  { kode: "SPEC-006", produk: "Pipa RC Ø600", dimensi: "Ø600 × 2000 mm", toleransi: "± 6 mm", berat: "425 kg", grade: "K-350", aktif: true },
  { kode: "SPEC-007", produk: "Pipa RC Ø1000", dimensi: "Ø1000 × 2000 mm", toleransi: "± 10 mm", berat: "1240 kg", grade: "K-400", aktif: true },
  { kode: "SPEC-008", produk: "Barrier NJ", dimensi: "810×600×3000 mm", toleransi: "± 5 mm", berat: "1320 kg", grade: "K-350", aktif: true },
];

export const materialCategories = [
  { kode: "MTC-001", nama: "Binder", deskripsi: "Material pengikat utama beton", contoh: "Semen Portland, Semen PCC", aktif: true },
  { kode: "MTC-002", nama: "Agregat Halus", deskripsi: "Pasir untuk campuran beton", contoh: "Pasir Lumajang, Pasir Cor", aktif: true },
  { kode: "MTC-003", nama: "Agregat Kasar", deskripsi: "Batu pecah / split", contoh: "Batu Split 1-2, Split 2-3", aktif: true },
  { kode: "MTC-004", nama: "Tulangan", deskripsi: "Baja tulangan beton", contoh: "Besi D10, D13, Wire Mesh", aktif: true },
  { kode: "MTC-005", nama: "Admixture", deskripsi: "Bahan tambahan kimia", contoh: "Superplasticizer, Retarder", aktif: true },
  { kode: "MTC-006", nama: "Air", deskripsi: "Air pencampur beton", contoh: "Air Bersih Standar", aktif: true },
  { kode: "MTC-007", nama: "Curing Compound", deskripsi: "Bahan perawatan beton", contoh: "Membrane Curing Liquid", aktif: true },
];

export const qcParameters = [
  { kode: "QCP-001", parameter: "Kuat Tekan 7 Hari", satuan: "MPa", min: "70% f'c", target: "Sesuai SNI", metode: "Compressive Test", aktif: true },
  { kode: "QCP-002", parameter: "Kuat Tekan 28 Hari", satuan: "MPa", min: "100% f'c", target: "≥ f'c rencana", metode: "Compressive Test", aktif: true },
  { kode: "QCP-003", parameter: "Slump Test", satuan: "cm", min: "8 cm", target: "10 ± 2 cm", metode: "Slump Cone", aktif: true },
  { kode: "QCP-004", parameter: "Dimensi Panjang", satuan: "mm", min: "Toleransi ±5", target: "Sesuai gambar", metode: "Meteran Kalibrasi", aktif: true },
  { kode: "QCP-005", parameter: "Dimensi Lebar/Diameter", satuan: "mm", min: "Toleransi ±5", target: "Sesuai gambar", metode: "Caliper", aktif: true },
  { kode: "QCP-006", parameter: "Tebal Selimut Beton", satuan: "mm", min: "20 mm", target: "≥ 25 mm", metode: "Cover Meter", aktif: true },
  { kode: "QCP-007", parameter: "Visual Permukaan", satuan: "kelas", min: "Kelas B", target: "Kelas A", metode: "Visual Inspection", aktif: true },
  { kode: "QCP-008", parameter: "Berat per Unit", satuan: "kg", min: "Toleransi -3%", target: "± 2%", metode: "Timbangan Industri", aktif: true },
];

export const defectCategories = [
  { kode: "DEF-001", nama: "Retak Struktural", tingkat: "Kritis", penyebabUmum: "Curing tidak optimal", disposisi: "Hancurkan", warna: "#B00020", aktif: true },
  { kode: "DEF-002", nama: "Dimensi Tidak Sesuai", tingkat: "Mayor", penyebabUmum: "Cetakan aus / pemasangan salah", disposisi: "Rework / Reject", warna: "#E9730C", aktif: true },
  { kode: "DEF-003", nama: "Honeycomb", tingkat: "Mayor", penyebabUmum: "Pemadatan kurang", disposisi: "Repair / Hancurkan", warna: "#E9730C", aktif: true },
  { kode: "DEF-004", nama: "Cacat Permukaan", tingkat: "Minor", penyebabUmum: "Demoulding terlalu cepat", disposisi: "Repair / Downgrade", warna: "#FBC36C", aktif: true },
  { kode: "DEF-005", nama: "Tulangan Terekspos", tingkat: "Mayor", penyebabUmum: "Selimut beton tipis", disposisi: "Repair / Reject", warna: "#E9730C", aktif: true },
  { kode: "DEF-006", nama: "Warna Tidak Merata", tingkat: "Minor", penyebabUmum: "Mix design tidak konsisten", disposisi: "Downgrade", warna: "#FBC36C", aktif: true },
  { kode: "DEF-007", nama: "Lubang Udara", tingkat: "Minor", penyebabUmum: "Getaran kurang", disposisi: "Repair", warna: "#FBC36C", aktif: true },
];

export const productionStatuses = [
  { kode: "PRS-01", status: "Direncanakan", urutan: 1, warna: "#59687A", deskripsi: "PO sudah dibuat, menunggu mulai produksi", aktif: true },
  { kode: "PRS-02", status: "Casting", urutan: 2, warna: "#0A6ED1", deskripsi: "Sedang dalam proses pengecoran", aktif: true },
  { kode: "PRS-03", status: "Curing", urutan: 3, warna: "#E9730C", deskripsi: "Sedang dalam proses perawatan beton", aktif: true },
  { kode: "PRS-04", status: "Demoulding", urutan: 4, warna: "#0070F2", deskripsi: "Pembukaan cetakan setelah curing selesai", aktif: true },
  { kode: "PRS-05", status: "QC", urutan: 5, warna: "#107E3E", deskripsi: "Pemeriksaan mutu sebelum gudang", aktif: true },
  { kode: "PRS-06", status: "Selesai", urutan: 6, warna: "#107E3E", deskripsi: "Produk siap di gudang produk jadi", aktif: true },
  { kode: "PRS-07", status: "Ditahan", urutan: 7, warna: "#B00020", deskripsi: "Produksi dihentikan sementara", aktif: false },
];

export const deliveryStatuses = [
  { kode: "DLS-01", status: "Dipersiapkan", urutan: 1, warna: "#59687A", deskripsi: "DO dibuat, item sedang disiapkan", aktif: true },
  { kode: "DLS-02", status: "Siap Berangkat", urutan: 2, warna: "#0A6ED1", deskripsi: "Truk sudah dimuat, menunggu keberangkatan", aktif: true },
  { kode: "DLS-03", status: "Dalam Perjalanan", urutan: 3, warna: "#E9730C", deskripsi: "Truk dalam perjalanan ke lokasi customer", aktif: true },
  { kode: "DLS-04", status: "Diterima", urutan: 4, warna: "#107E3E", deskripsi: "Customer telah menerima barang", aktif: true },
  { kode: "DLS-05", status: "Selesai", urutan: 5, warna: "#107E3E", deskripsi: "PO ditutup dan invoice diterbitkan", aktif: true },
  { kode: "DLS-06", status: "Tertunda", urutan: 6, warna: "#B00020", deskripsi: "Pengiriman ditunda karena alasan tertentu", aktif: false },
];

export const processDefinitions = [
  { id: "P01", urutan: 1, nama: "Batching", icon: "Droplet", warna: "#0A6ED1", deskripsi: "Penakaran semen, agregat, air, dan admixture sesuai mix design", durasi: 30, aktif: true },
  { id: "P02", urutan: 2, nama: "Casting", icon: "Hammer", warna: "#0070F2", deskripsi: "Pengecoran beton segar ke dalam cetakan dengan vibrasi pemadatan", durasi: 60, aktif: true },
  { id: "P03", urutan: 3, nama: "Curing", icon: "Thermometer", warna: "#E9730C", deskripsi: "Perawatan beton dengan uap pada 65-70°C selama 8-12 jam", durasi: 480, aktif: true },
  { id: "P04", urutan: 4, nama: "Finishing", icon: "ShieldCheck", warna: "#107E3E", deskripsi: "Demoulding, repair, QC final, dan marking sebelum masuk gudang", durasi: 30, aktif: true },
  { id: "P05", urutan: 5, nama: "Storage", icon: "Package", warna: "#59687A", deskripsi: "Pemindahan ke gudang produk jadi dan pencatatan stok", durasi: 15, aktif: true },
];

export const businessFlow = [
  { id: "F1", nama: "Order Penjualan", icon: "ShoppingCart", warna: "#0A6ED1", deskripsi: "Sales menerima order dari customer, mencatat spesifikasi, qty, harga, dan tanggal kirim", input: "Permintaan customer", output: "Sales Order (SO)" },
  { id: "F2", nama: "Order Produksi", icon: "ClipboardList", warna: "#0070F2", deskripsi: "PPIC membuat Production Order dari SO, menentukan line, jadwal, dan kebutuhan material", input: "Sales Order", output: "Production Order (PO)" },
  { id: "F3", nama: "Proses Produksi", icon: "Factory", warna: "#E9730C", deskripsi: "Eksekusi 10 tahap proses: persiapan tulangan → casting → curing → demoulding → repair", input: "Production Order", output: "Work-In-Progress" },
  { id: "F4", nama: "Quality Control", icon: "ShieldCheck", warna: "#107E3E", deskripsi: "Inspeksi 8 parameter mutu (kuat tekan, dimensi, visual, selimut beton, dll)", input: "WIP siap inspeksi", output: "Status Lulus / Reject" },
  { id: "F5", nama: "Produk Jadi", icon: "Package", warna: "#107E3E", deskripsi: "Produk lulus QC masuk ke gudang Finished Goods, tersedia untuk pengiriman", input: "Hasil QC Lulus", output: "Stok Tersedia" },
  { id: "F6", nama: "Pengiriman", icon: "Truck", warna: "#0A6ED1", deskripsi: "Dispatch berdasarkan SO, alokasi truk, driver, dan rute, hingga diterima customer", input: "Sales Order + Stok", output: "Delivery Order Selesai" },
];

export const kpiDefinitions = {
  "kpi-target": {
    label: "Target Produksi", formula: "Target = Σ Quantity dari PO Aktif (status Direncanakan + Berjalan) untuk hari ini",
    dataSource: "Production Orders · Master Lines",
    deskripsi: "Jumlah unit yang direncanakan untuk diproduksi hari ini.",
    breakdown: [
      { label: "LINE-A · Pipa Beton", value: 48, unit: "unit", color: "#0A6ED1" },
      { label: "LINE-B · U-Ditch", value: 60, unit: "unit", color: "#0070F2" },
      { label: "LINE-C · Box Culvert", value: 24, unit: "unit", color: "#E9730C" },
      { label: "LINE-D · Barrier", value: 18, unit: "unit", color: "#59687A" },
    ],
  },
  "kpi-realisasi": {
    label: "Realisasi Hari Ini", formula: "Realisasi = Σ output aktual dari semua line produksi yang sudah selesai casting",
    dataSource: "Production Execution Log",
    deskripsi: "Jumlah unit yang telah selesai diproduksi hari ini.",
    breakdown: [
      { label: "LINE-A · Pipa Beton", value: 42, unit: "unit", color: "#0A6ED1" },
      { label: "LINE-B · U-Ditch", value: 56, unit: "unit", color: "#0070F2" },
      { label: "LINE-C · Box Culvert", value: 18, unit: "unit", color: "#E9730C" },
      { label: "LINE-D · Barrier", value: 16, unit: "unit", color: "#59687A" },
    ],
  },
  "kpi-achievement": {
    label: "Pencapaian", formula: "Pencapaian (%) = (Realisasi ÷ Target) × 100",
    dataSource: "Dihitung dari Target & Realisasi",
    deskripsi: "Persentase realisasi dibanding target produksi.",
    breakdown: [
      { label: "Realisasi", value: 132, unit: "unit", color: "#107E3E" },
      { label: "Target", value: 150, unit: "unit", color: "#59687A" },
      { label: "Gap", value: 18, unit: "unit", color: "#B00020" },
      { label: "Pencapaian", value: "88,0%", color: "#0A6ED1" },
    ],
  },
  "kpi-curing": {
    label: "Dalam Curing", formula: "Σ unit aktif di semua chamber curing (status: Steam Curing)",
    dataSource: "Curing Management",
    deskripsi: "Jumlah unit yang sedang berada dalam proses curing.",
    breakdown: [
      { label: "Curing Chamber A", value: 96, unit: "unit", color: "#E9730C" },
      { label: "Curing Chamber B", value: 78, unit: "unit", color: "#E9730C" },
      { label: "Curing Chamber C", value: 74, unit: "unit", color: "#FBC36C" },
      { label: "Total", value: 248, unit: "unit", color: "#0A6ED1" },
    ],
  },
  "kpi-qc": {
    label: "Siap QC", formula: "Σ unit yang sudah selesai curing & demoulding, antri di area QC",
    dataSource: "Production Execution · WIP",
    deskripsi: "Jumlah unit yang telah selesai curing dan menunggu inspeksi QC.",
    breakdown: [
      { label: "Antri QC Lab", value: 28, unit: "unit", color: "#0A6ED1" },
      { label: "Inspeksi Visual", value: 12, unit: "unit", color: "#0070F2" },
      { label: "Uji Dimensi", value: 5, unit: "unit", color: "#107E3E" },
    ],
  },
  "kpi-reject": {
    label: "Reject Rate", formula: "Reject Rate (%) = (Σ Reject ÷ Σ Inspeksi) × 100 dalam 7 hari terakhir",
    dataSource: "Quality Control · Reject Log",
    deskripsi: "Persentase produk yang gagal memenuhi standar mutu.",
    breakdown: [
      { label: "Retak Struktural", value: 14, unit: "kasus", color: "#B00020" },
      { label: "Dimensi", value: 11, unit: "kasus", color: "#E9730C" },
      { label: "Honeycomb", value: 9, unit: "kasus", color: "#E9730C" },
      { label: "Cacat Permukaan", value: 8, unit: "kasus", color: "#FBC36C" },
    ],
  },
  "kpi-stok": {
    label: "Stok Produk Jadi", formula: "Σ stok available di semua gudang Finished Goods",
    dataSource: "Inventory · Finished Goods",
    deskripsi: "Jumlah produk jadi yang tersedia di gudang.",
    breakdown: [
      { label: "WH-FG Bekasi", value: 1842, unit: "unit", color: "#107E3E" },
      { label: "Reserved", value: 528, unit: "unit", color: "#E9730C" },
      { label: "Available", value: 1314, unit: "unit", color: "#0A6ED1" },
    ],
  },
  "kpi-material": {
    label: "Pemakaian Material", formula: "Σ konsumsi material (semen + agregat + besi) hari ini",
    dataSource: "Stock Movement · Material Consumption",
    deskripsi: "Total material yang digunakan selama periode berjalan.",
    breakdown: [
      { label: "Semen Portland", value: 28.4, unit: "ton", color: "#59687A" },
      { label: "Agregat Halus", value: 36.2, unit: "ton", color: "#0070F2" },
      { label: "Agregat Kasar", value: 14.6, unit: "ton", color: "#E9730C" },
      { label: "Besi Tulangan", value: 5.3, unit: "ton", color: "#B00020" },
    ],
  },
  "kpi-mold": {
    label: "Utilisasi Cetakan", formula: "(Σ Cetakan Aktif ÷ Σ Cetakan Total) × 100",
    dataSource: "Master Cetakan · Production Lines",
    deskripsi: "Persentase penggunaan cetakan dibanding kapasitas tersedia.",
    breakdown: [
      { label: "Total Cetakan", value: 150, unit: "unit", color: "#59687A" },
      { label: "Aktif", value: 94, unit: "unit (63%)", color: "#0A6ED1" },
      { label: "Ready", value: 26, unit: "unit (17%)", color: "#107E3E" },
      { label: "Maintenance", value: 12, unit: "unit (8%)", color: "#E9730C" },
      { label: "Cleaning", value: 6, unit: "unit (4%)", color: "#59687A" },
    ],
  },
  "kpi-wip": {
    label: "Work In Progress", formula: "Σ unit dengan status: Casting + Curing + Demoulding + QC",
    dataSource: "Production Orders · Status WIP",
    deskripsi: "Jumlah unit yang masih berada dalam proses produksi.",
    breakdown: [
      { label: "Casting", value: 28, unit: "unit", color: "#0A6ED1" },
      { label: "Curing", value: 248, unit: "unit", color: "#E9730C" },
      { label: "Demoulding", value: 21, unit: "unit", color: "#0070F2" },
      { label: "QC", value: 15, unit: "unit", color: "#107E3E" },
    ],
  },
  "kpi-efisiensi": {
    label: "Efisiensi Produksi", formula: "OEE = Availability × Performance × Quality",
    dataSource: "Reports · OEE Calculation",
    deskripsi: "Rasio output aktual terhadap kapasitas produksi.",
    breakdown: [
      { label: "Availability", value: "96,4%", color: "#107E3E" },
      { label: "Performance", value: "98,8%", color: "#107E3E" },
      { label: "Quality", value: "97,1%", color: "#107E3E" },
      { label: "OEE", value: "92,4%", color: "#0A6ED1" },
    ],
  },
  "kpi-jadi-hari": {
    label: "Produk Jadi Hari Ini", formula: "Σ unit yang lulus QC & masuk gudang FG hari ini = Realisasi − Reject",
    dataSource: "Inventory In-Movement · QC Pass Log",
    deskripsi: "Jumlah unit yang selesai dan masuk ke gudang produk jadi hari ini.",
    breakdown: [
      { label: "Realisasi", value: 132, unit: "unit", color: "#0A6ED1" },
      { label: "Reject", value: 6, unit: "unit", color: "#B00020" },
      { label: "Masuk Gudang FG", value: 126, unit: "unit", color: "#107E3E" },
    ],
  },
};

export const formatRupiah = (n) => {
  const val = Number(n);
  return "Rp " + (isNaN(val) ? 0 : val).toLocaleString("id-ID");
};

export const formatNumber = (n) => {
  const val = Number(n);
  return (isNaN(val) ? 0 : val).toLocaleString("id-ID");
};
