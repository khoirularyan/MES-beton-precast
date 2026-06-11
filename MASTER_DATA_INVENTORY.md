# Master Data — Daftar Lengkap Entitas & Field

Dokumen ini merangkum **semua entitas** yang ada di halaman Master Data beserta field-field yang tersimpan di database dan yang ditampilkan di UI. Gunakan ini untuk mengevaluasi apakah data yang ada sudah cukup atau perlu ditambah.

---

## 1. Produk (`production_products`)

| Field | Tipe | UI | Keterangan |
|---|---|---|---|
| `kode` | string(30) unique | Ya | Kode produk, misal `PC-001` |
| `nama` | string(200) | Ya | Nama produk |
| `kategori` | string(50) | Ya | Referensi ke Kategori Produk |
| `varian` | string(50) | Ya | Tipe/varian produk |
| `spek` | string(100) | Ya | Spesifikasi singkat |
| `grade` | string(20) | Ya | Mutu beton (K-250, K-350, dst.) |
| `berat` | decimal(10,2) | Ya | Berat per unit (kg) |
| `volume_m3` | decimal(10,3) | Ya | Volume per unit (m³) |
| `harga` | bigint | Ya | Harga jual per unit (IDR) |
| `satuan` | string(20) | Ya | pcs, unit, m3, dll |
| `standar` | string(50) | **Tidak** | SNI, ASTM, dll — ada di DB tapi tidak di form UI |
| `aktif` | boolean | **Tidak** | Ada di DB, tidak ada toggle di UI |

**Catatan**: Produk ditampilkan dalam 2 mode — **Grid** (kartu visual) dan **Tabel**.

---

## 2. Spesifikasi Produk (`production_product_specs`)

| Field | Tipe | UI | Keterangan |
|---|---|---|---|
| `kode` | string(30) unique | Ya | Kode spec |
| `produk` | string(200) | Ya | Nama produk terkait |
| `dimensi` | string(100) | Ya | Dimensi produk |
| `toleransi` | string(50) | Ya | Toleransi ukuran |
| `berat` | string(50) | Ya | Berat |
| `grade` | string(20) | Ya | Mutu beton |
| `aktif` | boolean | Ya | Status aktif/nonaktif |

---

## 3. Mutu Beton (`production_concrete_grades`)

> **Komposisi material (semen, pasir, split, air, admixture) TIDAK disimpan di sini.**
> Komposisi disimpan di **BOM / Mix Design** karena satu mutu bisa punya beberapa mix design berbeda.

| Field | Tipe | UI | Keterangan |
|---|---|---|---|
| `grade` | string(20) unique | Ya | Kode mutu (K-250, K-300, K-350, K-400) |
| `nama` | string(200) | Ya | Nama mutu (deskriptif) |
| `fc_mpa` | decimal(6,2) | Ya | Kuat tekan f'c (MPa) |
| `slump_min_cm` | decimal(5,2) | Ya | Slump minimum (cm) |
| `slump_max_cm` | decimal(5,2) | Ya | Slump maximum (cm) |
| `keterangan` | text | Ya | Keterangan / catatan |
| `aktif` | boolean | **Tidak** | Ada di DB, tidak di UI |

---

## 4. Material (`production_materials`)

| Field | Tipe | UI | Keterangan |
|---|---|---|---|
| `kode` | string(20) unique | **Tidak** | Ada di DB, tidak di form UI |
| `nama` | string(200) | Ya | Nama material |
| `satuan` | string(20) | Ya | kg, ton, m³, liter, lembar |
| `kategori` | string(50) | Ya | Binder, Agregat, Tulangan, Admixture |
| `stok` | decimal(15,3) | Ya | Stok saat ini |
| `min_stok` | decimal(15,3) | Ya | Minimum stok (alert) |
| `supplier_id` | FK → suppliers | **Tidak** | Relasi ke supplier, tidak di form UI |
| `harga` | bigint | Ya | Harga per satuan (IDR) |
| `lead_time_hari` | integer | Ya | Lead time pengadaan (hari, default 7) |
| `aktif` | boolean | **Tidak** | Ada di DB, tidak di UI |

---

## 5. Kategori Material (`production_material_categories`)

| Field | Tipe | UI | Keterangan |
|---|---|---|---|
| `kode` | string(20) unique | **Tidak** | Ada di DB, tidak di UI |
| `nama` | string(100) | **Tidak** | Ada di DB, tapi tidak ada tab terpisah di UI — kategori material di-input langsung via datalist di tab Material |
| `deskripsi` | text | **Tidak** | Ada di DB, tidak di UI |
| `contoh` | string(300) | **Tidak** | Ada di DB, tidak di UI |
| `aktif` | boolean | **Tidak** | Ada di DB, tidak di UI |

**Catatan**: Tab "Kategori Material" **tidak ada di UI** meskipun tabel DB sudah dibuat. Kategori di-input inline via datalist di tab Material.

---

## 6. Cetakan / Mold (`production_molds`)

| Field | Tipe | UI | Keterangan |
|---|---|---|---|
| `kode` | string(20) unique | Ya | Kode cetakan |
| `nama` | string(100) | Ya | Nama cetakan |
| `produk` | string(100) | Ya | Produk terkait |
| `jumlah` | integer | Ya | Total cetakan |
| `kondisi` | string(30) | Ya | Baik / Sedang / Perlu Perawatan |
| `kapasitas_per_siklus` | integer | Ya | Kapasitas per siklus casting |
| `siklus_per_hari` | integer | Ya | Jumlah siklus per hari |
| `aktif` | integer | **Tidak** | Ada di DB, tidak di UI |

**Catatan**: `utilisasi` dihapus dari UI — akan dihitung otomatis oleh sistem berdasarkan produksi aktual.

---

## 7. Customer (`production_customers`)

| Field | Tipe | UI | Keterangan |
|---|---|---|---|
| `kode` | string(20) unique | Ya | Kode customer |
| `nama` | string(200) | Ya | Nama perusahaan |
| `kontak` | string(100) | Ya | Kontak person |
| `telepon` | string(30) | Ya | Nomor telepon |
| `email` | string(100) | Ya | Email |
| `alamat` | string(300) | Ya | Alamat lengkap |
| `kota` | string(100) | Ya | Kota |
| `segmen` | string(50) | Ya | BUMN Konstruksi / Swasta / Pemerintah |
| `limit_kredit` | bigint | Ya | Limit kredit (IDR) |
| `npwp` | string(30) | Ya | NPWP perusahaan |
| `pic_proyek` | string(200) | Ya | PIC untuk proyek |
| `aktif` | boolean | **Tidak** | Ada di DB, tidak di UI |

---

## 8. Supplier (`production_suppliers`)

| Field | Tipe | UI | Keterangan |
|---|---|---|---|
| `kode` | string(20) unique | **Tidak** | Ada di DB, tidak di form UI |
| `nama` | string(200) | Ya | Nama supplier |
| `material` | string(100) | **Tidak** | Field DB lama, di UI diganti relasi `materials` (multiselect) |
| `kontak` | string(30) | Ya | Telepon |
| `email` | string(100) | Ya | Email |
| `alamat` | string(300) | Ya | Alamat |
| `kota` | string(100) | Ya | Kota |
| `rating` | tinyint(1-5) | Ya | Rating supplier (bintang) |
| `lead_time_hari` | integer | Ya | Lead time pengiriman (hari, default 7) |
| `aktif` | boolean | **Tidak** | Ada di DB, tidak di UI |

---

## 9. Gudang / Warehouse (`production_warehouses`)

| Field | Tipe | UI | Keterangan |
|---|---|---|---|
| `kode` | string(20) unique | Ya | Kode gudang |
| `nama` | string(100) | Ya | Nama gudang |
| `tipe` | string(50) | Ya | Raw Material / Work In Progress / Finished Goods / Reject |
| `lokasi` | string(200) | Ya | Lokasi fisik |
| `kapasitas` | string(50) | Ya | Kapasitas gudang |
| `aktif` | boolean | **Tidak** | Ada di DB, tidak di UI |

**Catatan**: `utilisasi` dihapus dari UI — akan dihitung otomatis oleh sistem berdasarkan stok barang di gudang.

---

## ~~10. Line Produksi~~ (DIHAPUS)

> **Keputusan**: Tab Line Produksi dihapus dari Master Data. Pengganti: **Batch Produksi** (akan dibuat di modul produksi).

---

## ~~11. Mesin / Machine~~ (DIHAPUS)

> **Keputusan**: Modul Mesin dihapus dari Master Data. Mesin akan dikelola di modul aset/peralatan terpisah.

---

## 12. Master User (`production_users`)

> Menggantikan tab Karyawan. Menggunakan tabel `production_users` dengan RBAC.

| Field | Tipe | UI | Keterangan |
|---|---|---|---|
| `name` | string(200) | Ya | Nama lengkap user |
| `username` | string(255) unique | Ya | Username untuk login |
| `email` | string(200) | Ya | Email login |
| `password` | string | Ya | Password (hashed, min 6 karakter) |
| `role` | string(50) | Ya | RBAC Role: super_admin, admin, manager, ppic, production, qc, warehouse, sales |
| `is_active` | boolean | Ya | Status aktif (default: true) |
| `plant` | string(100) | **Tidak** | Lokasi plant (default: Plant Bekasi) |

**RBAC Roles**:
- `super_admin` — Full access ke semua modul
- `admin` — Administrative access
- `manager` — Management dashboard & reports
- `ppic` — Production Planning & Inventory Control
- `production` — Production execution
- `qc` — Quality Control
- `warehouse` — Inventory & Gudang
- `sales` — Sales Orders & Customer

---

## 13. Shift (`production_shifts`)

| Field | Tipe | UI | Keterangan |
|---|---|---|---|
| `kode` | string(20) unique | Ya | Kode shift |
| `nama` | string(50) | Ya | Nama shift |
| `jam` | string(30) | Ya | Jam kerja (07:00 - 15:00) |
| `supervisor` | string(100) | Ya | Nama supervisor |
| `jumlah_pekerja` | integer | Ya | Jumlah pekerja |
| `aktif` | boolean | **Tidak** | Ada di DB, tidak di UI |

---

## 14. Parameter QC (`production_qc_parameters`)

| Field | Tipe | UI | Keterangan |
|---|---|---|---|
| `kode` | string(30) unique | Ya | Kode parameter |
| `parameter` | string(200) | Ya | Nama parameter |
| `satuan` | string(30) | Ya | Satuan ukur |
| `min` | string(30) | Ya | Batas minimum |
| `target` | string(30) | Ya | Nilai target |
| `metode` | string(100) | Ya | Metode uji |
| `aktif` | boolean | Ya | Status aktif/nonaktif |

---

## 15. Kategori Defect (`production_defect_categories`)

| Field | Tipe | UI | Keterangan |
|---|---|---|---|
| `kode` | string(20) unique | Ya | Kode defect |
| `nama` | string(100) | Ya | Nama defect |
| `warna` | string(10) | Ya | Warna hex untuk indikator visual |
| `tingkat` | string(20) | Ya | Kritis / Mayor / Minor |
| `penyebab_umum` | string(300) | Ya | Penyebab umum |
| `disposisi` | string(200) | Ya | Disposisi standar |
| `aktif` | boolean | Ya | Status aktif/nonaktif |

---

## 16. Status Batch (`production_batch_statuses`)

> Menggantikan Status Produksi. Digunakan untuk tracking batch produksi.

| Field | Tipe | UI | Keterangan |
|---|---|---|---|
| `kode` | string(20) unique | Ya | Kode status (BS-01, dll) |
| `nama` | string(50) | Ya | Nama status |
| `urutan` | integer | Ya | Urutan workflow |
| `warna` | string(20) | Ya | Warna hex |
| `deskripsi` | text | Ya | Deskripsi status |
| `aktif` | boolean | Ya | Toggle aktif/nonaktif (default: true) |

**Default** (dari seeder):
1. Planning (urutan 1)
2. Ready Material (urutan 2)
3. Casting (urutan 3)
4. QC (urutan 4)
5. Finished (urutan 5)
6. Delivered (urutan 6)

## ~~17. Status Produksi~~ (DIHAPUS — di-hardcode)

> **Keputusan**: Status produksi di-hardcode, bukan master data.

## ~~18. Status Pengiriman~~ (DIHAPUS — di-hardcode)

> **Keputusan**: Status pengiriman di-hardcode, bukan master data.

---

## Entitas di Luar Tab Master Data (tapi terkait)

### BOM (Bill of Materials) — Halaman terpisah `MasterBOM`

**`production_bom_headers`**
| Field | Tipe | Keterangan |
|---|---|---|
| `product_id` | FK → products | Produk terkait |
| `versi` | string(10) | Versi BOM (V1.0) |
| `is_active` | boolean | BOM aktif |
| `catatan` | string(300) | Catatan |
| `bom_efficiency` | decimal(5,2) | Efisiensi BOM (%) |
| `overhead_pct` | decimal(5,2) | Overhead (%) |
| `dibuat_oleh` | string(100) | Pembuat BOM |
| `berlaku_dari` | timestamp | Tanggal berlaku |

**`production_bom_items`**
| Field | Tipe | Keterangan |
|---|---|---|
| `bom_header_id` | FK → bom_headers | Header BOM |
| `material_id` | FK → materials | Material |
| `qty_per_unit` | decimal(12,4) | Kebutuhan per 1 unit produk |
| `waste_pct` | decimal(5,2) | Persentase waste/scrap |
| `urutan` | integer | Urutan item |
| `catatan` | string(200) | Catatan |

---

## Ringkasan: Field yang Ada di DB tapi Tidak di UI

| Entitas | Field yang Terlewat |
|---|---|
| Produk | `standar`, `aktif` |
| Material | `kode`, `supplier_id`, `aktif` |
| Kategori Material | **Seluruh tab tidak ada di UI** — `kode`, `deskripsi`, `contoh`, `aktif` |
| Supplier | `kode`, `aktif` |
| Customer | `aktif` |
| Mutu Beton | `aktif` |
| Cetakan | `aktif` |
| Gudang | `aktif` |
| Shift | `aktif`, `supervisor` (nama user dari User list) |
| User | `plant` |
| Status Batch | `warna`, `aktif` (sebagian ditampilkan) |
| ~~Line Produksi~~ | **Dihapus** — diganti Batch Produksi |
| ~~Mesin~~ | **Dihapus** — akan dikelola di modul aset |
| ~~Karyawan~~ | **Dihapus** — diganti Master User |
| ~~Status Produksi~~ | **Dihapus** — di-hardcode |
| ~~Status Pengiriman~~ | **Dihapus** — di-hardcode |

---

## Potensi Kekurangan Data untuk Dipertimbangkan

1. **Kategori Material** — Tabel DB sudah ada tapi tidak ada tab UI terpisah. Perlu ditambah jika ingin mengelola kategori secara independen.
2. **Field `aktif`** — Hampir semua entitas punya field `aktif` di DB tapi tidak ada toggle di UI. Mungkin perlu ditambahkan untuk soft-enable/disable data tanpa hapus.
3. **User `plant`** — Field plant ada di DB tapi tidak bisa di-set dari UI (hardcoded "Plant Bekasi").
4. **Produk `standar`** — Standar (SNI/ASTM) ada di DB tapi tidak bisa di-input dari form.
5. **Satuan Produk** — Field `satuan` ada di DB Produk tapi tidak ada di form UI (hanya hardcoded "unit").
6. **Status Produksi & Pengiriman** — Dihapus dari Master Data, di-hardcode di aplikasi. Tabel DB masih ada tapi tidak digunakan via UI.
7. **RBAC Implementation** — Role sudah didefinisikan di User, tapi middleware/gate untuk enforce access control per role belum diimplementasi.
8. **Utilisasi Otomatis** — Field `utilisasi` di Gudang dan Cetakan dihapus dari UI, akan dihitung otomatis oleh sistem berdasarkan data produksi/stok aktual.
9. **Shift Supervisor** — Supervisor di Shift sekarang dipilih dari daftar User (nama), bukan hardcoded string.
