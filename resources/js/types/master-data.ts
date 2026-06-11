/**
 * TypeScript Type Definitions for MES Beton Precast Master Data
 * 
 * Updated after refactor on 2026-06-11
 * These types reflect the database schema after migration:
 * 2026_06_11_100000_refactor_master_data_for_mes_precast.php
 */

// ═══════════════════════════════════════════════════════════════
// BASE TYPES
// ═══════════════════════════════════════════════════════════════

export interface BaseModel {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT MODULE
// ═══════════════════════════════════════════════════════════════

export interface Product extends BaseModel {
  kode: string;
  nama: string;
  kategori?: string | null;
  varian?: string | null;
  spek?: string | null;
  grade?: string | null;
  berat?: number | null;
  volume_m3?: number | null;              // NEW: Volume produk dalam m³
  umur_curing_hari: number;               // NEW: Umur curing standar (default: 28)
  harga: number;
  satuan: string;
  standar?: string | null;
  aktif: boolean;
  
  // Relations
  bomHeaders?: BomHeader[];
  salesOrderItems?: any[];
  inventoryBatches?: any[];
  productionBatches?: any[];
}

export interface ProductCategory extends BaseModel {
  kode: string;
  nama: string;
  deskripsi?: string | null;
  jumlah_produk: number;
  aktif: boolean;
}

export interface ProductType extends BaseModel {
  kode: string;
  kategori?: string | null;
  nama: string;
  kode_prefix?: string | null;
  standar?: string | null;
  aktif: boolean;
}

export interface ProductSpec extends BaseModel {
  kode: string;
  produk: string;
  dimensi?: string | null;
  toleransi?: string | null;
  berat?: string | null;
  grade?: string | null;
  aktif: boolean;
}

// ═══════════════════════════════════════════════════════════════
// CONCRETE GRADE (REFACTORED)
// ═══════════════════════════════════════════════════════════════

export interface ConcreteGrade extends BaseModel {
  grade: string;                    // e.g., "K-350", "K-400"
  nama?: string | null;
  fc_mpa?: number | null;           // RENAMED from 'fc' - Kuat tekan f'c dalam MPa
  slump_min_cm?: number | null;     // RENAMED from 'slump_min' - Slump min dalam cm
  slump_max_cm?: number | null;     // RENAMED from 'slump_max' - Slump max dalam cm
  keterangan?: string | null;
  aktif: boolean;
}

// ═══════════════════════════════════════════════════════════════
// BOM (BILL OF MATERIAL)
// ═══════════════════════════════════════════════════════════════

export interface BomHeader extends BaseModel {
  product_id: number;
  versi: string;                    // e.g., "V1.0", "V2.0"
  is_active: boolean;
  catatan?: string | null;
  bom_efficiency: number;           // Percentage
  overhead_pct: number;             // Percentage
  dibuat_oleh?: string | null;
  berlaku_dari?: string | null;
  
  // Relations
  product?: Product;
  items?: BomItem[];
}

export interface BomItem extends BaseModel {
  bom_header_id: number;
  material_id: number;
  qty_per_unit: number;             // Kebutuhan per 1 unit produk
  waste_pct: number;                // Percentage waste/scrap
  urutan: number;
  catatan?: string | null;
  
  // Relations
  bomHeader?: BomHeader;
  material?: Material;
}

// ═══════════════════════════════════════════════════════════════
// MATERIAL MODULE
// ═══════════════════════════════════════════════════════════════

export interface Material extends BaseModel {
  nama: string;
  satuan: string;
  kategori?: string | null;
  stok: number;
  min_stok: number;
  harga: number;
  lead_time_hari: number;           // Lead time dalam hari
  aktif: boolean;
  
  // Relations
  suppliers?: Supplier[];           // Many-to-Many
  bomItems?: BomItem[];
}

export interface MaterialCategory extends BaseModel {
  kode?: string | null;
  nama: string;
  deskripsi?: string | null;
  contoh?: string | null;
  aktif: boolean;
}

// ═══════════════════════════════════════════════════════════════
// BUSINESS PARTNERS
// ═══════════════════════════════════════════════════════════════

export interface Customer extends BaseModel {
  kode: string;
  nama: string;
  kontak?: string | null;
  telepon?: string | null;
  email?: string | null;
  npwp?: string | null;             // NEW: Nomor Pokok Wajib Pajak
  pic_proyek?: string | null;       // NEW: PIC untuk proyek tertentu
  alamat?: string | null;
  kota?: string | null;
  segmen?: string | null;           // e.g., "BUMN Konstruksi", "Swasta", "Pemerintah"
  limit_kredit: number;
  aktif: boolean;
  
  // Relations
  salesOrders?: any[];
}

export interface Supplier extends BaseModel {
  nama: string;
  kontak?: string | null;
  email?: string | null;
  alamat?: string | null;
  kota?: string | null;
  rating: number;                   // 1-5
  lead_time_hari: number;           // NEW: Lead time pengiriman dalam hari
  aktif: boolean;
  
  // Relations
  materials?: Material[];           // Many-to-Many
}

// ═══════════════════════════════════════════════════════════════
// PRODUCTION RESOURCES
// ═══════════════════════════════════════════════════════════════

export interface Mold extends BaseModel {
  kode: string;
  nama: string;
  produk?: string | null;
  jumlah: number;
  aktif: number;
  kondisi: string;                  // e.g., "Baik", "Sedang", "Perlu Perawatan"
  utilisasi: number;                // Percentage
  kapasitas_per_siklus: number;     // NEW: Jumlah produk per siklus casting
  siklus_per_hari: number;          // NEW: Jumlah siklus per hari
}

export interface Warehouse extends BaseModel {
  kode: string;
  nama: string;
  tipe?: string | null;             // "Raw Material", "WIP", "Curing", "Finished Goods", "Reject"
  lokasi?: string | null;
  kapasitas?: string | null;
  utilisasi: number;
  aktif: boolean;
}

export interface WorkCenter extends BaseModel {
  kode: string;
  nama: string;
  tipe?: string | null;
  kapasitas_per_hari?: number | null;
  status: string;
  aktif: boolean;
}

// ═══════════════════════════════════════════════════════════════
// USER & SHIFT (REFACTORED)
// ═══════════════════════════════════════════════════════════════

export interface User extends BaseModel {
  name: string;
  username: string;
  email: string;
  role?: string | null;             // "Administrator", "PPIC", "Produksi", "QC", "Gudang", "Sales", "Manager"
  department?: string | null;
  status: string;
  
  // Relations
  supervisedShifts?: Shift[];       // Shifts where this user is supervisor
}

export interface Shift extends BaseModel {
  kode: string;
  nama: string;
  jam?: string | null;              // e.g., "07:00 - 15:00"
  supervisor_id?: number | null;    // REFACTORED: FK to users (was string 'supervisor')
  jumlah_pekerja: number;
  aktif: boolean;
  
  // Relations
  supervisor?: User | null;         // NEW: Relationship to User
}

// ═══════════════════════════════════════════════════════════════
// QUALITY CONTROL
// ═══════════════════════════════════════════════════════════════

export interface QcParameter extends BaseModel {
  kode: string;
  parameter: string;
  satuan?: string | null;
  min?: string | null;
  target?: string | null;
  metode?: string | null;
  aktif: boolean;
}

export interface DefectCategory extends BaseModel {
  kode: string;
  nama: string;
  warna?: string | null;            // Hex color
  tingkat?: string | null;          // "Kritis", "Mayor", "Minor"
  penyebab_umum?: string | null;
  disposisi?: string | null;
  aktif: boolean;
}

// ═══════════════════════════════════════════════════════════════
// STATUS REFERENCES
// ═══════════════════════════════════════════════════════════════

export interface ProductionStatus extends BaseModel {
  kode: string;
  status: string;
  urutan: number;
  warna?: string | null;            // Hex color
  deskripsi?: string | null;
  aktif: boolean;
}

export interface DeliveryStatus extends BaseModel {
  kode: string;
  status: string;
  urutan: number;
  warna?: string | null;            // Hex color
  deskripsi?: string | null;
  aktif: boolean;
}

export interface BatchStatus extends BaseModel {
  kode: string;
  status: string;                   // "Planning", "Ready Material", "Casting", "Curing", "QC", "Finished", "Delivered"
  urutan: number;
  warna?: string | null;            // Hex color
  deskripsi?: string | null;
  aktif: boolean;
}

// ═══════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
  links?: {
    first?: string;
    last?: string;
    prev?: string | null;
    next?: string | null;
  };
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// ═══════════════════════════════════════════════════════════════
// FORM DATA TYPES (for Create/Update)
// ═══════════════════════════════════════════════════════════════

export type ProductFormData = Omit<Product, keyof BaseModel | 'bomHeaders' | 'salesOrderItems' | 'inventoryBatches' | 'productionBatches'>;
export type ConcreteGradeFormData = Omit<ConcreteGrade, keyof BaseModel>;
export type CustomerFormData = Omit<Customer, keyof BaseModel | 'salesOrders'>;
export type SupplierFormData = Omit<Supplier, keyof BaseModel | 'materials'> & {
  materials?: number[];             // Array of material IDs
};
export type MoldFormData = Omit<Mold, keyof BaseModel>;
export type ShiftFormData = Omit<Shift, keyof BaseModel | 'supervisor'>;
export type BatchStatusFormData = Omit<BatchStatus, keyof BaseModel>;

// ═══════════════════════════════════════════════════════════════
// FILTER/SEARCH TYPES
// ═══════════════════════════════════════════════════════════════

export interface ProductFilters {
  search?: string;
  kategori?: string;
  active_only?: boolean;
  per_page?: number;
}

export interface MaterialFilters {
  search?: string;
  kategori?: string;
  low_stock?: boolean;
  per_page?: number;
}

export interface CustomerFilters {
  search?: string;
  segmen?: string;
  kota?: string;
  aktif?: boolean;
  per_page?: number;
}

export interface SupplierFilters {
  search?: string;
  kota?: string;
  aktif?: boolean;
  per_page?: number;
}

// ═══════════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════════

export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  order: SortOrder;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
}

// ═══════════════════════════════════════════════════════════════
// DELETED TYPES (for reference - no longer used)
// ═══════════════════════════════════════════════════════════════

/**
 * @deprecated Machine module has been removed in refactor 2026-06-11
 * Use WorkCenter or other alternatives
 */
export interface Machine_DEPRECATED extends BaseModel {
  kode: string;
  nama: string;
  tipe?: string | null;
  line?: string | null;
  status: string;
  last_maintenance?: string | null;
  next_maintenance?: string | null;
  aktif: boolean;
}

/**
 * @deprecated Employee module has been removed in refactor 2026-06-11
 * Use User model with roles instead
 */
export interface Employee_DEPRECATED extends BaseModel {
  nik: string;
  nama: string;
  jabatan?: string | null;
  departemen?: string | null;
  shift?: string | null;
  status: string;
  aktif: boolean;
}
