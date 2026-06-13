# Refactor Master Data MES Beton Precast

## Current State Analysis

The codebase has been partially refactored already:
- Mutu Beton: simplified (done in previous turn)
- Mesin: deleted from UI, API commented out
- Karyawan: replaced with Master User
- Status Produksi: replaced with Status Batch
- Cetakan: already has `kapasitas_per_siklus` and `siklus_per_hari`
- Produk: already has `volume_m3` in form

## Remaining Gaps vs Spec

| Entity | Gap |
|---|---|
| Produk | `volume_m3` not in table columns; `umur_curing_hari` in form but not in spec |
| Material | Missing `lead_time_hari` |
| Customer | Missing `npwp`, `pic_proyek` |
| Supplier | Missing `lead_time_hari` |
| Gudang | Still has "Curing" tipe option |
| Line Produksi | Tab still exists, must be removed |
| Migrations | Missing new columns for above entities |
| Models/Controllers | Need fillable/validation updates |
| Seeders/Mock Data | Need to match new schemas |

---

## Task 1: Remove Line Produksi Tab

**File:** `resources/js/pages/MasterData.jsx`
- Remove `TabsTrigger value="lines"`
- Remove `TabsContent value="lines"` (entire section ~lines 681-702)
- Remove `productionLines`, `linesLoading` state and the `useEffect` that loads work-centers
- Remove `lines` useApiData hook (line 294)
- Remove `workCenterApi` import if present

---

## Task 2: Update Produk Form and Table

**File:** `resources/js/pages/MasterData.jsx`
- Remove `umur_curing_hari` from both grid form and table form `addFields`
- Add `volume_m3` column to the table `columns` array

**File:** `database/migrations/2026_06_10_011306_create_products_table.php`
- Add `$table->decimal('volume_m3', 10, 3)->nullable();`

**File:** `app/Models/Product.php`
- Add `volume_m3` to `$fillable` and `$casts`

**File:** `app/Http/Controllers/Api/ProductController.php`
- Add `volume_m3` validation rule

---

## Task 3: Add `lead_time_hari` to Material

**File:** `resources/js/pages/MasterData.jsx`
- Add `{ name: "lead_time_hari", label: "Lead Time (hari)", type: "number" }` to material `addFields`
- Add `{ key: "lead_time_hari", label: "Lead Time", cls: "text-right font-mono-num" }` to columns

**File:** `database/migrations/2026_06_10_011307_create_materials_table.php`
- Already has `lead_time_hari` column -- verify it exists

**File:** `app/Models/Material.php`
- Add `lead_time_hari` to `$fillable` and `$casts`

**File:** `app/Http/Controllers/Api/MaterialController.php`
- Add `lead_time_hari` validation rule

---

## Task 4: Add `npwp` and `pic_proyek` to Customer

**File:** `resources/js/pages/MasterData.jsx`
- Add `npwp` and `pic_proyek` fields to customer `addFields`
- Add columns for `npwp` and `pic_proyek`

**File:** `database/migrations/2026_06_10_011305_create_customers_table.php`
- Add `npwp` string(30) and `pic_proyek` string(200) columns

**File:** `app/Models/Customer.php`
- Add to `$fillable`

**File:** `app/Http/Controllers/Api/CustomerController.php`
- Add validation rules

---

## Task 5: Add `lead_time_hari` to Supplier

**File:** `resources/js/pages/MasterData.jsx`
- Add `lead_time_hari` field to supplier `addFields`
- Add column for `lead_time_hari`

**File:** `database/migrations/2026_06_10_011305_create_suppliers_table.php`
- Add `lead_time_hari` integer column

**File:** `app/Models/Supplier.php`
- Add to `$fillable` and `$casts`

**File:** `app/Http/Controllers/Api/SupplierController.php`
- Add validation rule

---

## Task 6: Remove "Curing" from Gudang Tipe Options

**File:** `resources/js/pages/MasterData.jsx`
- In warehouse `addFields`, remove `{ value: "Curing", label: "Curing" }` from tipe select options
- Keep: Raw Material, Work In Progress, Finished Goods, Reject

---

## Task 7: Verify Status Batch Defaults

**File:** `database/seeders/MasterDataSeeder.php`
- Ensure batch_statuses seed data includes: Planning, Ready Material, Casting, QC, Finished, Delivered (with correct urutan)

---

## Task 8: Update Mock Data

**File:** `resources/js/data/mockData.jsx`
- Update product mock data to include `volume_m3`, remove `umur_curing_hari`
- Update material mock data to include `lead_time_hari`
- Update customer mock data to include `npwp`, `pic_proyek`
- Update supplier mock data to include `lead_time_hari`

---

## Task 9: Update MASTER_DATA_INVENTORY.md

- Reflect all changes: removed Line Produksi, added fields, removed Curing gudang type

---

## Files to Modify (Summary)

1. `resources/js/pages/MasterData.jsx` -- Remove lines tab, update forms/columns for produk/material/customer/supplier/gudang
2. `database/migrations/2026_06_10_011306_create_products_table.php` -- Add volume_m3
3. `database/migrations/2026_06_10_011305_create_customers_table.php` -- Add npwp, pic_proyek
4. `database/migrations/2026_06_10_011305_create_suppliers_table.php` -- Add lead_time_hari
5. `app/Models/Product.php` -- Add volume_m3
6. `app/Models/Material.php` -- Add lead_time_hari
7. `app/Models/Customer.php` -- Add npwp, pic_proyek
8. `app/Models/Supplier.php` -- Add lead_time_hari
9. `app/Http/Controllers/Api/ProductController.php` -- Add volume_m3 validation
10. `app/Http/Controllers/Api/MaterialController.php` -- Add lead_time_hari validation
11. `app/Http/Controllers/Api/CustomerController.php` -- Add npwp, pic_proyek validation
12. `app/Http/Controllers/Api/SupplierController.php` -- Add lead_time_hari validation
13. `database/seeders/MasterDataSeeder.php` -- Update seed data
14. `resources/js/data/mockData.jsx` -- Update mock data
15. `MASTER_DATA_INVENTORY.md` -- Update documentation
