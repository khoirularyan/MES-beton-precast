-- ═══════════════════════════════════════════════════════════════
-- MES BETON PRECAST - MASTER DATA REFACTOR
-- SQL Reference Script
-- 
-- Date: 2026-06-11
-- Migration: 2026_06_11_100000_refactor_master_data_for_mes_precast.php
-- 
-- NOTE: This is a REFERENCE file only.
-- DO NOT run this manually - use Laravel migration instead:
-- php artisan migrate
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. PRODUCTS - Add new fields
-- ───────────────────────────────────────────────────────────────

ALTER TABLE global.production_products 
  ADD COLUMN volume_m3 DECIMAL(10,3) NULL,
  ADD COLUMN umur_curing_hari INTEGER DEFAULT 28 NOT NULL;

COMMENT ON COLUMN global.production_products.volume_m3 IS 'Volume produk dalam meter kubik (m³)';
COMMENT ON COLUMN global.production_products.umur_curing_hari IS 'Umur curing standar dalam hari (default: 28)';

-- ───────────────────────────────────────────────────────────────
-- 2. CONCRETE GRADES - Rename fields for clarity
-- ───────────────────────────────────────────────────────────────

ALTER TABLE global.production_concrete_grades 
  RENAME COLUMN fc TO fc_mpa;

ALTER TABLE global.production_concrete_grades 
  RENAME COLUMN slump_min TO slump_min_cm;

ALTER TABLE global.production_concrete_grades 
  RENAME COLUMN slump_max TO slump_max_cm;

COMMENT ON COLUMN global.production_concrete_grades.fc_mpa IS 'Kuat tekan f''c dalam MPa';
COMMENT ON COLUMN global.production_concrete_grades.slump_min_cm IS 'Slump minimum dalam centimeter';
COMMENT ON COLUMN global.production_concrete_grades.slump_max_cm IS 'Slump maksimum dalam centimeter';

-- ───────────────────────────────────────────────────────────────
-- 3. CUSTOMERS - Add NPWP and PIC fields
-- ───────────────────────────────────────────────────────────────

ALTER TABLE global.production_customers 
  ADD COLUMN npwp VARCHAR(20) NULL,
  ADD COLUMN pic_proyek VARCHAR(100) NULL;

COMMENT ON COLUMN global.production_customers.npwp IS 'Nomor Pokok Wajib Pajak';
COMMENT ON COLUMN global.production_customers.pic_proyek IS 'Person In Charge untuk proyek tertentu';

-- ───────────────────────────────────────────────────────────────
-- 4. SUPPLIERS - Add lead time
-- ───────────────────────────────────────────────────────────────

ALTER TABLE global.production_suppliers 
  ADD COLUMN lead_time_hari INTEGER DEFAULT 7 NOT NULL;

COMMENT ON COLUMN global.production_suppliers.lead_time_hari IS 'Lead time pengiriman dalam hari';

-- ───────────────────────────────────────────────────────────────
-- 5. MOLDS - Add capacity fields for planning
-- ───────────────────────────────────────────────────────────────

ALTER TABLE global.production_molds 
  ADD COLUMN kapasitas_per_siklus INTEGER DEFAULT 1 NOT NULL,
  ADD COLUMN siklus_per_hari INTEGER DEFAULT 1 NOT NULL;

COMMENT ON COLUMN global.production_molds.kapasitas_per_siklus IS 'Jumlah produk yang dapat diproduksi per siklus casting';
COMMENT ON COLUMN global.production_molds.siklus_per_hari IS 'Jumlah siklus casting per hari';
COMMENT ON TABLE global.production_molds IS 'Kapasitas harian = kapasitas_per_siklus × siklus_per_hari × jumlah_aktif';

-- ───────────────────────────────────────────────────────────────
-- 6. SHIFTS - Change supervisor from string to FK
-- ───────────────────────────────────────────────────────────────

-- Drop old supervisor field
ALTER TABLE global.production_shifts 
  DROP COLUMN IF EXISTS supervisor;

-- Add foreign key to users
ALTER TABLE global.production_shifts 
  ADD COLUMN supervisor_id BIGINT NULL;

ALTER TABLE global.production_shifts
  ADD CONSTRAINT fk_shifts_supervisor_id 
  FOREIGN KEY (supervisor_id) 
  REFERENCES global.users(id) 
  ON DELETE SET NULL;

COMMENT ON COLUMN global.production_shifts.supervisor_id IS 'Foreign key ke tabel users - supervisor shift';

-- ───────────────────────────────────────────────────────────────
-- 7. DROP MACHINES TABLE
-- ───────────────────────────────────────────────────────────────

-- Drop foreign keys first (if any)
-- Then drop table
DROP TABLE IF EXISTS global.production_machines CASCADE;

COMMENT ON SCHEMA global IS 'Machine table dihapus - belum dibutuhkan pada fase awal. Dapat ditambahkan kembali di masa depan.';

-- ───────────────────────────────────────────────────────────────
-- 8. DROP EMPLOYEES TABLE
-- ───────────────────────────────────────────────────────────────

-- Drop foreign keys first (if any)
-- Then drop table
DROP TABLE IF EXISTS global.production_employees CASCADE;

COMMENT ON SCHEMA global IS 'Employee table dihapus - digantikan dengan user/role system yang lebih terpadu.';

-- ───────────────────────────────────────────────────────────────
-- 9. CREATE BATCH STATUSES TABLE (NEW)
-- ───────────────────────────────────────────────────────────────

CREATE TABLE global.production_batch_statuses (
  id BIGSERIAL PRIMARY KEY,
  kode VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL,
  urutan INTEGER DEFAULT 0 NOT NULL,
  warna VARCHAR(10) NULL,
  deskripsi TEXT NULL,
  aktif BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_batch_statuses_kode ON global.production_batch_statuses(kode);
CREATE INDEX idx_batch_statuses_urutan ON global.production_batch_statuses(urutan);
CREATE INDEX idx_batch_statuses_aktif ON global.production_batch_statuses(aktif);
CREATE INDEX idx_batch_statuses_deleted_at ON global.production_batch_statuses(deleted_at);

COMMENT ON TABLE global.production_batch_statuses IS 'Master data status untuk batch produksi';
COMMENT ON COLUMN global.production_batch_statuses.kode IS 'Kode unik status (e.g., BS-01, BS-02)';
COMMENT ON COLUMN global.production_batch_statuses.status IS 'Nama status (Planning, Ready Material, Casting, etc.)';
COMMENT ON COLUMN global.production_batch_statuses.urutan IS 'Urutan status dalam workflow';
COMMENT ON COLUMN global.production_batch_statuses.warna IS 'Warna hex untuk display di UI (e.g., #4CAF50)';

-- ───────────────────────────────────────────────────────────────
-- 10. SEED DATA: BATCH STATUSES
-- ───────────────────────────────────────────────────────────────

INSERT INTO global.production_batch_statuses (kode, status, urutan, warna, deskripsi, aktif, created_at, updated_at) VALUES
  ('BS-01', 'Planning',       1, '#9E9E9E', 'Batch sedang direncanakan', TRUE, NOW(), NOW()),
  ('BS-02', 'Ready Material', 2, '#2196F3', 'Material sudah siap', TRUE, NOW(), NOW()),
  ('BS-03', 'Casting',        3, '#FF9800', 'Proses casting sedang berjalan', TRUE, NOW(), NOW()),
  ('BS-04', 'Curing',         4, '#00BCD4', 'Dalam proses curing', TRUE, NOW(), NOW()),
  ('BS-05', 'QC',             5, '#9C27B0', 'Quality control inspection', TRUE, NOW(), NOW()),
  ('BS-06', 'Finished',       6, '#4CAF50', 'Batch selesai, produk ready', TRUE, NOW(), NOW()),
  ('BS-07', 'Delivered',      7, '#00E676', 'Batch sudah dikirim ke customer', TRUE, NOW(), NOW())
ON CONFLICT (kode) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════

-- Check Products table structure
SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'global' 
  AND table_name = 'production_products'
  AND column_name IN ('volume_m3', 'umur_curing_hari')
ORDER BY ordinal_position;

-- Check ConcreteGrades renamed fields
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_schema = 'global' 
  AND table_name = 'production_concrete_grades'
  AND column_name IN ('fc_mpa', 'slump_min_cm', 'slump_max_cm')
ORDER BY ordinal_position;

-- Check Customers new fields
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'global' 
  AND table_name = 'production_customers'
  AND column_name IN ('npwp', 'pic_proyek')
ORDER BY ordinal_position;

-- Check Suppliers lead_time field
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'global' 
  AND table_name = 'production_suppliers'
  AND column_name = 'lead_time_hari';

-- Check Molds capacity fields
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'global' 
  AND table_name = 'production_molds'
  AND column_name IN ('kapasitas_per_siklus', 'siklus_per_hari')
ORDER BY ordinal_position;

-- Check Shifts supervisor_id FK
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'global'
  AND tc.table_name = 'production_shifts'
  AND kcu.column_name = 'supervisor_id';

-- Check if machines table exists (should not exist)
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'global' 
    AND table_name = 'production_machines'
) AS machines_table_exists;

-- Check if employees table exists (should not exist)
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'global' 
    AND table_name = 'production_employees'
) AS employees_table_exists;

-- Check BatchStatuses table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'global' 
  AND table_name = 'production_batch_statuses'
ORDER BY ordinal_position;

-- Count BatchStatuses records
SELECT COUNT(*) as total_batch_statuses
FROM global.production_batch_statuses
WHERE deleted_at IS NULL;

-- List all batch statuses
SELECT kode, status, urutan, warna, aktif
FROM global.production_batch_statuses
WHERE deleted_at IS NULL
ORDER BY urutan;

-- ═══════════════════════════════════════════════════════════════
-- DATA MIGRATION HELPERS (if needed)
-- ═══════════════════════════════════════════════════════════════

-- Example: Migrate employee data to users table (if needed)
-- This is just a template - adjust according to your users table structure
/*
INSERT INTO global.users (name, email, role, department, status, created_at, updated_at)
SELECT 
  nama,
  LOWER(REPLACE(nama, ' ', '.')) || '@company.com' as email,
  CASE 
    WHEN jabatan ILIKE '%kepala%' THEN 'Manager'
    WHEN jabatan ILIKE '%supervisor%' THEN 'Supervisor'
    WHEN jabatan ILIKE '%qc%' THEN 'QC'
    WHEN jabatan ILIKE '%operator%' THEN 'Produksi'
    ELSE 'Produksi'
  END as role,
  departemen,
  CASE WHEN aktif THEN 'active' ELSE 'inactive' END as status,
  created_at,
  updated_at
FROM global.production_employees
WHERE deleted_at IS NULL
ON CONFLICT (email) DO NOTHING;
*/

-- Example: Map shift supervisors to user IDs (if needed)
/*
UPDATE global.production_shifts s
SET supervisor_id = u.id
FROM global.users u
WHERE s.supervisor = u.name
  AND s.deleted_at IS NULL;
*/

-- ═══════════════════════════════════════════════════════════════
-- ROLLBACK REFERENCE (for emergency use only)
-- ═══════════════════════════════════════════════════════════════

-- Use Laravel migration rollback instead:
-- php artisan migrate:rollback --step=1
--
-- Manual rollback (NOT RECOMMENDED):
/*
-- 1. Drop batch_statuses table
DROP TABLE IF EXISTS global.production_batch_statuses CASCADE;

-- 2. Restore shifts supervisor
ALTER TABLE global.production_shifts DROP COLUMN IF EXISTS supervisor_id;
ALTER TABLE global.production_shifts ADD COLUMN supervisor VARCHAR(100) NULL;

-- 3. Restore molds
ALTER TABLE global.production_molds DROP COLUMN IF EXISTS kapasitas_per_siklus;
ALTER TABLE global.production_molds DROP COLUMN IF EXISTS siklus_per_hari;

-- 4. Restore suppliers
ALTER TABLE global.production_suppliers DROP COLUMN IF EXISTS lead_time_hari;

-- 5. Restore customers
ALTER TABLE global.production_customers DROP COLUMN IF EXISTS npwp;
ALTER TABLE global.production_customers DROP COLUMN IF EXISTS pic_proyek;

-- 6. Restore concrete_grades
ALTER TABLE global.production_concrete_grades RENAME COLUMN fc_mpa TO fc;
ALTER TABLE global.production_concrete_grades RENAME COLUMN slump_min_cm TO slump_min;
ALTER TABLE global.production_concrete_grades RENAME COLUMN slump_max_cm TO slump_max;

-- 7. Restore products
ALTER TABLE global.production_products DROP COLUMN IF EXISTS volume_m3;
ALTER TABLE global.production_products DROP COLUMN IF EXISTS umur_curing_hari;

-- 8. Restore machines table (structure only - data lost)
-- See migration down() method for table structure

-- 9. Restore employees table (structure only - data lost)
-- See migration down() method for table structure
*/

-- ═══════════════════════════════════════════════════════════════
-- END OF SQL REFERENCE
-- ═══════════════════════════════════════════════════════════════
