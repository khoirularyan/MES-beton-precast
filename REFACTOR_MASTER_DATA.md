# Refactor Master Data MES Beton Precast

## Ringkasan Perubahan

Dokumen ini menjelaskan refactor komprehensif modul Master Data pada aplikasi MES Beton Precast untuk mendukung proses bisnis industri precast concrete sesuai dengan kebutuhan MOU.

---

## 🎯 Tujuan Refactor

Master Data harus mendukung alur bisnis lengkap:
```
Sales Order → Production Planning → MRP → Batch Produksi → 
Pemakaian Material → QC → Finished Goods → Delivery → Costing
```

---

## 📋 Perubahan Detail per Modul

### 1. **PRODUK** ✅

#### Perubahan Schema
| Field Baru | Tipe | Keterangan |
|------------|------|------------|
| `volume_m3` | decimal(10,3) | Volume produk dalam m³ |
| `umur_curing_hari` | integer | Umur curing standar (default: 28 hari) |

#### Field yang Dipertahankan
- `kode_produk`, `nama_produk`, `kategori`, `varian`
- `mutu_beton` (relasi ke ConcreteGrade)
- `spesifikasi`, `berat`, `harga`, `satuan`

#### Relasi
- ✅ BOM (1:N via BomHeader)
- ✅ Spesifikasi Produk (via ProductSpec)
- ✅ Batch Produksi (1:N)
- ✅ Sales Order Items (1:N)

---

### 2. **SPESIFIKASI PRODUK** ✅

#### Field yang Dipertahankan
- `kode_spec`, `produk_id`, `dimensi`, `toleransi`
- `berat`, `mutu_beton`

#### Relasi
- ✅ Produk (N:1)

---

### 3. **MUTU BETON** ✅ REFACTORED

#### Perubahan Field (Renamed)
| Field Lama | Field Baru | Keterangan |
|------------|------------|------------|
| `fc` | `fc_mpa` | Kuat tekan f'c dalam MPa |
| `slump_min` | `slump_min_cm` | Slump minimum dalam cm |
| `slump_max` | `slump_max_cm` | Slump maksimum dalam cm |

#### Struktur Final
```php
- kode_mutu (unique)
- nama_mutu
- fc_mpa (MPa)
- slump_min_cm (cm)
- slump_max_cm (cm)
- keterangan
```

#### Contoh Data
| Kode | Nama | fc_mpa | Slump Min | Slump Max |
|------|------|--------|-----------|-----------|
| K-350 | Beton K-350 untuk Kolom | 29.05 | 8 | 12 |
| K-400 | Beton K-400 High Strength | 33.20 | 8 | 12 |

> **PENTING**: Komposisi material TIDAK disimpan di master mutu beton. Gunakan BOM/Mix Design.

---

### 4. **BOM (Bill of Material)** ✅

#### Struktur Header
```php
- product_id (FK)
- versi (e.g., "V1.0", "V2.0")
- is_active (boolean)
- berlaku_dari (date)
- bom_efficiency (%)
- overhead_pct (%)
- dibuat_oleh
```

#### Struktur Items
```php
- bom_header_id (FK)
- material_id (FK)
- qty_per_unit (kebutuhan per 1 unit produk)
- waste_pct (% waste/scrap)
- urutan
- catatan
```

#### Fungsi BOM
- ✅ Sumber utama kebutuhan material untuk MRP
- ✅ Basis perhitungan costing
- ✅ Input untuk perencanaan produksi
- ✅ Versioning untuk track perubahan mix design

---

### 5. **MATERIAL** ✅

#### Field yang Dipertahankan
- `nama_material`, `satuan`, `kategori`
- `stok_awal`, `min_stok`, `harga`
- `lead_time_hari` (sudah ada dari migration sebelumnya)

#### Kategori Material (Contoh)
- Semen (OPC, PPC, SRC)
- Pasir (Agregat halus)
- Split (Agregat kasar)
- Wiremesh
- Besi Tulangan
- Admixture (Sikament, ViscoCrete, Retarder)
- Consumable

#### Relasi
- ✅ BOM Items (1:N)
- ✅ Supplier (M:N via pivot table `supplier_materials`)
- ✅ Inventory Batches (1:N)

> **CATATAN**: Field `kode` dihapus dari materials (by design pada migration sebelumnya)

---

### 6. **CETAKAN (MOLD)** ✅ REFACTORED

#### Field Baru
| Field | Tipe | Keterangan |
|-------|------|------------|
| `kapasitas_per_siklus` | integer | Jumlah produk per siklus casting |
| `siklus_per_hari` | integer | Jumlah siklus per hari |

#### Field yang Dipertahankan
- `kode_cetakan`, `nama_cetakan`, `produk_terkait`
- `jumlah`, `kondisi`

#### Penggunaan
- ✅ Perencanaan kapasitas produksi
- ✅ Scheduling batch produksi
- Formula: `Kapasitas Harian = kapasitas_per_siklus × siklus_per_hari × jumlah_aktif`

#### Contoh Data
| Kode | Nama | Kapasitas/Siklus | Siklus/Hari | Kapasitas Harian |
|------|------|------------------|-------------|------------------|
| CET-TL9 | Cetakan Tiang 9m | 2 | 3 | 6 unit/hari |
| CET-PD | Cetakan Panel | 4 | 2 | 8 unit/hari |

---

### 7. **CUSTOMER** ✅ REFACTORED

#### Field Baru
| Field | Tipe | Keterangan |
|-------|------|------------|
| `npwp` | string(20) | Nomor Pokok Wajib Pajak |
| `pic_proyek` | string(100) | PIC khusus untuk proyek tertentu |

#### Field yang Dipertahankan
- `kode_customer`, `nama_perusahaan`, `kontak_person`
- `telepon`, `email`, `alamat`, `kota`, `segmen`
- `limit_kredit`

#### Relasi
- ✅ Sales Orders (1:N)

---

### 8. **SUPPLIER** ✅ REFACTORED

#### Field Baru
| Field | Tipe | Keterangan |
|-------|------|------------|
| `lead_time_hari` | integer | Lead time pengiriman dalam hari |

#### Field yang Dipertahankan
- `nama_supplier`, `telepon`, `email`, `kota`, `alamat`
- `rating` (1-5)

#### Relasi
- ✅ Material (M:N via `supplier_materials`)

> **PENTING**: Relasi Supplier ↔ Material adalah **Many-to-Many**  
> Satu supplier dapat memasok banyak material, satu material bisa dari banyak supplier.

---

### 9. **GUDANG** ✅

#### Tipe Gudang
- **Raw Material** - Bahan baku
- **WIP** - Work in Progress
- **Curing** - Area curing
- **Finished Goods** - Produk jadi
- **Reject** - Produk reject

#### Field yang Dipertahankan
- `kode_gudang`, `nama_gudang`, `tipe`, `lokasi`, `kapasitas`

---

### 10. **LINE PRODUKSI** ❌ DIHAPUS

**Status**: Modul dihapus, digantikan dengan **Batch Produksi**

---

### 11. **BATCH PRODUKSI** ✅ BARU

#### Master Data: Batch Status
Ditambahkan tabel baru: `production_batch_statuses`

```php
- kode (e.g., "BS-01", "BS-02")
- status
- urutan
- warna (hex color)
- deskripsi
- aktif
```

#### Status Default
| Kode | Status | Urutan | Warna | Deskripsi |
|------|--------|--------|-------|-----------|
| BS-01 | Planning | 1 | #9E9E9E | Batch sedang direncanakan |
| BS-02 | Ready Material | 2 | #2196F3 | Material sudah siap |
| BS-03 | Casting | 3 | #FF9800 | Proses casting sedang berjalan |
| BS-04 | Curing | 4 | #00BCD4 | Dalam proses curing |
| BS-05 | QC | 5 | #9C27B0 | Quality control inspection |
| BS-06 | Finished | 6 | #4CAF50 | Batch selesai, produk ready |
| BS-07 | Delivered | 7 | #00E676 | Batch sudah dikirim |

#### Field Batch Produksi (Transaksi)
```php
- kode_batch
- nama_batch
- product_id
- target_qty
- target_m3
- status_id (FK ke batch_statuses)
- tanggal_produksi
- shift_id
```

---

### 12. **MESIN** ❌ DIHAPUS

**Status**: Modul dihapus  
**Alasan**: Belum dibutuhkan pada fase implementasi saat ini

---

### 13. **KARYAWAN** ❌ DIHAPUS

**Status**: Modul dihapus, digantikan dengan **User/Role System**

#### Master User (Pengganti)
```php
- name
- username
- email
- password
- role (Administrator, PPIC, Produksi, QC, Gudang, Sales, Manager)
- department
- status (active/inactive)
```

#### Role Contoh
- **Administrator** - Full access
- **PPIC** - Production planning & control
- **Produksi** - Operator produksi
- **QC** - Quality control inspector
- **Gudang** - Warehouse staff
- **Sales** - Sales & customer service
- **Manager** - Approval & monitoring

---

### 14. **SHIFT** ✅ REFACTORED

#### Perubahan Field
| Field Lama | Field Baru | Tipe |
|------------|------------|------|
| `supervisor` (string) | `supervisor_id` | foreignId → users |

#### Field yang Dipertahankan
- `kode_shift`, `nama_shift`, `jam_mulai`, `jam_selesai`
- `jumlah_pekerja`

#### Relasi Baru
- ✅ Supervisor → User (N:1)

#### Contoh Data
| Kode | Nama | Jam | Supervisor ID |
|------|------|-----|---------------|
| SH-01 | Shift Pagi | 07:00 - 15:00 | 1 (User: Budi Santoso) |
| SH-02 | Shift Sore | 15:00 - 23:00 | 2 (User: Rudi Hartono) |
| SH-03 | Shift Malam | 23:00 - 07:00 | 3 (User: Agus Prabowo) |

---

### 15. **PARAMETER QC** ✅

#### Field yang Dipertahankan
- `kode`, `parameter`, `satuan`, `min`, `target`, `metode`

#### Contoh Parameter
| Kode | Parameter | Satuan | Min | Target | Metode |
|------|-----------|--------|-----|--------|--------|
| QC-01 | Kuat Tekan 28 Hari | MPa | 24.9 | 28.0 | SNI 1974:2011 |
| QC-02 | Slump Beton | cm | 8 | 12 | SNI 1972:2008 |
| QC-03 | Dimensi Produk | mm | -5 | 0 | Visual |
| QC-04 | Kelurusan Tiang | mm/m | 0 | ≤3 | Waterpass |
| QC-05 | Tebal Selimut | mm | 20 | 25 | Cover Meter |

---

### 16. **KATEGORI DEFECT** ✅

#### Field yang Dipertahankan
- `kode`, `nama`, `tingkat`, `warna`, `penyebab_umum`, `disposisi`

#### Tingkat Defect
- **Kritis** - Reject wajib
- **Mayor** - Perlu evaluasi, bisa repair atau reject
- **Minor** - Repair ringan diizinkan

#### Contoh Data
| Kode | Nama | Tingkat | Disposisi |
|------|------|---------|-----------|
| DF-01 | Retak Permukaan | Mayor | Repair epoxy atau reject |
| DF-02 | Keropos (Honeycomb) | Kritis | Reject wajib |
| DF-03 | Dimensi Out of Spec | Mayor | Verifikasi ulang |
| DF-04 | Cacat Permukaan Minor | Minor | Repair ringan |
| DF-05 | Tulangan Tidak Sesuai | Kritis | Reject wajib |

---

### 17. **STATUS PRODUKSI** ✅

#### Status Default
| Kode | Status | Deskripsi |
|------|--------|-----------|
| PS-01 | Planning | Order produksi dibuat, belum diproses |
| PS-02 | Ready Material | Material sudah siap |
| PS-03 | Casting | Proses casting |
| PS-04 | Curing | Dalam proses curing |
| PS-05 | QC | Quality control inspection |
| PS-06 | Finished | Finished goods, siap kirim |
| PS-07 | Delivered | Sudah dikirim ke customer |

> **CATATAN**: Status dapat dikonfigurasi melalui master data

---

## 🔗 Relasi Wajib yang Dibuat

### 1. Customer → Sales Order
```
Customer (1) ─────→ (N) Sales Order
```

### 2. Produk → BOM
```
Product (1) ─────→ (N) BOM Header ─────→ (N) BOM Items
                                               ↓
                                         Material (N)
```

### 3. Produk → Spesifikasi
```
Product (1) ─────→ (N) Product Spec
```

### 4. Produk → Mutu Beton
```
Product (N) ─────→ (1) Concrete Grade
```

### 5. Produk → Batch Produksi
```
Product (1) ─────→ (N) Production Batch
```

### 6. Material → Supplier (M:N)
```
Material (N) ←───── Supplier_Materials ─────→ (N) Supplier
```

### 7. Material → BOM
```
Material (1) ─────→ (N) BOM Items
```

### 8. Batch → Status
```
Production Batch (N) ─────→ (1) Batch Status
```

### 9. User → Shift (Supervisor)
```
User (1) ─────→ (N) Shift (as supervisor)
```

### 10. User → Approval
```
User (1) ─────→ (N) Approvals (various transactions)
```

---

## 📁 File yang Dimodifikasi

### Migrations
- ✅ `2026_06_11_100000_refactor_master_data_for_mes_precast.php` (BARU)

### Models
- ✅ `Product.php` - tambah volume_m3, umur_curing_hari
- ✅ `ConcreteGrade.php` - rename fc, slump_min, slump_max
- ✅ `Customer.php` - tambah npwp, pic_proyek
- ✅ `Supplier.php` - tambah lead_time_hari
- ✅ `Mold.php` - tambah kapasitas_per_siklus, siklus_per_hari
- ✅ `Shift.php` - ubah supervisor menjadi supervisor_id (FK)
- ✅ `BatchStatus.php` - model baru
- ❌ `Machine.php` - DIHAPUS
- ❌ `Employee.php` - DIHAPUS

### Controllers
- ✅ `ProductController.php` - update validation
- ✅ `ConcreteGradeController.php` - update validation
- ✅ `CustomerController.php` - update validation
- ✅ `SupplierController.php` - update validation
- ✅ `MoldController.php` - update validation
- ✅ `ShiftController.php` - update validation, eager load supervisor
- ✅ `BatchStatusController.php` - controller baru
- ❌ `MachineController.php` - DIHAPUS
- ❌ `EmployeeController.php` - DIHAPUS

### Routes
- ✅ `api.php` - tambah route `batch-statuses`

### Seeders
- ✅ `MasterDataSeeder.php` - update data concrete_grades, suppliers, customers, molds
- ✅ `MasterDataSeeder.php` - hapus data machines, employees
- ✅ `MasterDataSeeder.php` - tambah data batch_statuses

---

## 🚀 Cara Menjalankan Refactor

### 1. Backup Database
```bash
php artisan db:backup  # atau manual backup
```

### 2. Jalankan Migration
```bash
php artisan migrate
```

Migration akan:
- ✅ Tambah field baru ke products, customers, suppliers, molds
- ✅ Rename field di concrete_grades
- ✅ Ubah struktur shifts (supervisor → supervisor_id)
- ✅ Drop tables machines, employees
- ✅ Create table batch_statuses

### 3. Refresh Seeder (Optional)
```bash
php artisan migrate:fresh --seed  # HATI-HATI: hapus semua data
# atau
php artisan db:seed --class=MasterDataSeeder  # seed ulang master data saja
```

### 4. Clear Cache
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

---

## ⚠️ Breaking Changes

### 1. **Concrete Grades**
- Field `fc`, `slump_min`, `slump_max` → renamed
- **Action Required**: Update semua query yang menggunakan field lama

### 2. **Shifts**
- Field `supervisor` (string) → `supervisor_id` (FK)
- **Action Required**: Update UI form untuk gunakan dropdown user

### 3. **Machines & Employees**
- Tables dihapus sepenuhnya
- **Action Required**: 
  - Hapus UI untuk machines & employees
  - Ganti dengan user management
  - Update API routes

### 4. **Products**
- Tambah field wajib: `volume_m3`, `umur_curing_hari`
- **Action Required**: Update form produk di UI

---

## 📊 Rekomendasi Tambahan

### 1. **Work Center / Production Line**
Pertimbangkan untuk menambahkan master data Work Center sebagai pengganti Line Produksi:
```php
- kode_workcenter
- nama_workcenter
- tipe (Mixing, Casting, Curing, Finishing)
- kapasitas_per_hari
- status (active/maintenance)
```

### 2. **Mix Design Template**
Untuk mempermudah pembuatan BOM:
```php
- template_name
- concrete_grade_id
- standard_composition (JSON)
- notes
```

### 3. **Production Calendar**
Untuk planning yang lebih akurat:
```php
- tanggal
- tipe (working_day, holiday, maintenance)
- shift_available (array)
- notes
```

### 4. **Material Category Enhancement**
Tambah field untuk grouping material dalam laporan:
```php
- tipe_biaya (direct, indirect, overhead)
- is_critical (boolean)
- reorder_point
```

### 5. **Customer Delivery Location**
Untuk multiple delivery locations per customer:
```php
- customer_id
- nama_lokasi
- alamat_kirim
- pic_site
- telepon_site
```

---

## ✅ Checklist Validasi

Setelah refactor, pastikan:

- [ ] Semua migration berjalan tanpa error
- [ ] Seeder berhasil populate data
- [ ] API endpoints merespons dengan benar
- [ ] Relasi antar model berfungsi (test dengan Tinker)
- [ ] UI form ter-update sesuai field baru
- [ ] Validation rules sesuai dengan schema baru
- [ ] Soft deletes tetap berfungsi
- [ ] User permission untuk modul yang dihapus sudah diupdate

---

## 📝 Catatan Penting

1. **Komposisi Mutu Beton**: JANGAN simpan di master mutu beton. Gunakan BOM.
2. **Material Kode**: Field `kode` dihapus by design. Gunakan `id` atau `nama` sebagai identifier.
3. **Supplier Kode**: Field `kode` dihapus. Supplier diidentifikasi dari `nama`.
4. **Employee → User**: Semua data employee harus di-migrate ke users table dengan role assignment.
5. **Machine**: Jika kedepan diperlukan, bisa ditambahkan kembali dengan struktur yang lebih sederhana.

---

## 🔄 Roadmap Selanjutnya

### Phase 1: Transaction Modules (Current)
- Sales Order Management
- Production Planning & MRP
- Batch Production Execution
- Material Consumption
- QC Inspection
- Delivery Order

### Phase 2: Reporting & Analytics
- Production Dashboard
- Material Usage Report
- Cost Analysis
- OEE (Overall Equipment Effectiveness)
- Quality Metrics

### Phase 3: Advanced Features
- Predictive Maintenance (jika Machine dikembalikan)
- AI-based Quality Prediction
- Automated Scheduling
- Real-time Monitoring

---

## 📞 Support

Jika ada pertanyaan terkait refactor ini, hubungi:
- **Senior ERP/MES Architect**
- **Lead Developer**

---

**Document Version**: 1.0  
**Last Updated**: 11 Juni 2026  
**Author**: Senior Fullstack Engineer
