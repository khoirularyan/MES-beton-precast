# MES Beton Precast — PT Megacon Bangun Perkasa

Manufacturing Execution System (MES) untuk pabrik beton pracetak. Dibangun sebagai aplikasi Laravel 13 monolitik dengan React 19 + Vite 8 sebagai frontend.

---

## 🚀 Quick Start

```bash
# Install dependencies (pertama kali saja)
composer install && npm install

# Build & jalankan aplikasi
npm start
```

Akses browser: **http://127.0.0.1:8000**

---

## Struktur Folder Repository

```
MES-beton-precast/
├── app/                    ← Laravel Controllers, Models, dll
├── bootstrap/
├── config/
├── database/
│   └── migrations/         ← 14 migration files (production_*)
├── resources/
│   ├── views/
│   │   └── app.blade.php   ← HTML entry point
│   └── js/                 ← React application
│       ├── pages/          ← 17 halaman
│       ├── components/
│       ├── data/
│       └── lib/
├── routes/
├── public/
│   └── build/              ← Build output (Vite)
├── storage/
├── vendor/                 ← PHP dependencies
├── node_modules/           ← Node.js dependencies
├── vite.config.js
├── package.json            ← npm scripts
├── composer.json           ← Composer config
├── artisan
├── .env                    ← Database configuration
├── php.ini
└── README.md
```

---

## 🛠️ Technology Stack & Architecture
=========================================

Aplikasi MES Beton Precast ini dibangun menggunakan arsitektur monolitik modern berbasis **Laravel + React SPA (Single Page Application)** dengan pembagian tanggung jawab yang jelas antara frontend (React) dan backend (Laravel REST API).

### **1. Frontend Layer**
*   **Core Library**: **React 18 (`react: ^18.3.1`)** — Menangani rendering UI deklaratif dan reaktivitas komponen.
*   **Routing & Navigation**: **React Router DOM 7 (`react-router-dom: 7.5.1`)** — Mengatur navigasi halaman SPA tanpa reload penuh.
*   **State Management & Caching**: **TanStack React Query v5 (`@tanstack/react-query: 5.56.2`)** — Digunakan untuk manajemen state asinkronus, caching data API, otomatisasi refetching, dan optimasi load data dari database.
*   **Styling (CSS)**: **Tailwind CSS v4 (`tailwindcss: ^4.0.0`)** — Menyediakan utility-first CSS styling dengan performa tinggi langsung via compiler Vite.
*   **HTTP Client**: **Axios (`axios: 1.8.4`)** — Digunakan untuk request data ke REST API Laravel dengan proteksi CSRF Cookie otomatis via interceptor.
*   **Visualisasi Data & KPI**: **Recharts (`recharts: 3.6.0`)** — Menyajikan data grafik tren produksi harian/bulanan serta distribusi penyebab reject secara interaktif.
*   **Notifications**: **Sonner (`sonner: 2.0.3`)** — Toast alert melayang untuk respons interaksi pengguna.
*   **UI Components**: **Radix UI primitive components** — Menyediakan fondasi dialog (`FormDialog`), select dropdown, popover, checkbox, dan tab navigation yang responsif dan aksesibel.
*   **Build Tool**: **Vite v5** dengan **laravel-vite-plugin** — Menyediakan Hot Module Replacement (HMR) cepat untuk proses development dan kompilasi bundle production yang ringkas.

### **2. Backend Layer (REST API & Business Logic)**
*   **Core Framework**: **Laravel 13.x (PHP 8.3+)** — Menangani *routing* REST API, validasi data request, middleware otorisasi, penanganan job/queue background, dan arsitektur database.
*   **Database ORM**: **Eloquent ORM** — Menyediakan abstraksi query database berorientasi objek dengan relasi terstruktur (`belongsTo`, `hasMany`, `hasOne`) serta getter/setter attribute serialization (`$appends` & `getStatusAttribute`).
*   **Database Primary**: **PostgreSQL** — Menyimpan seluruh data master dan transaksi dengan skema terpisah (`public` untuk data operasional harian dan `global` untuk master data terpusat).
*   **Testing Suite**: **PHPUnit 12** — Menyediakan framework testing unit dan feature untuk memastikan integritas logika bisnis (seperti alur konsumsi material dan transisi status produksi).
*   **Security & Session**: Menggunakan mekanisme cookie-based session dengan token-based CSRF protection untuk mengamankan API endpoint.

---

## Prasyarat

Pastikan software berikut sudah terinstall:

- **PHP** `>= 8.3` — [https://www.php.net/downloads](https://www.php.net/downloads)
- **Composer** — [https://getcomposer.org](https://getcomposer.org)
- **Node.js** `>= 20` — [https://nodejs.org](https://nodejs.org)
- **PostgreSQL** `>= 16` — [https://www.postgresql.org/download](https://www.postgresql.org/download)

Cek versi:
```bash
php --version
composer --version
node --version
npm --version
```

---

## Setup Pertama Kali (Fresh Install)

### A. Aktifkan PostgreSQL extension di PHP

Edit file `C:\php-8.4.21-nts-Win32-vs17-x64\php.ini` (buka **Notepad as Administrator**):

```ini
[PHP]
extension_dir = "C:\php-8.4.21-nts-Win32-vs17-x64\ext"
extension = openssl
extension = curl
extension = fileinfo
extension = mbstring
extension = zip
extension = pdo_pgsql
extension = pgsql
```

Verifikasi:
```powershell
php -m | findstr pgsql
# Harus muncul: pdo_pgsql dan pgsql
```

---

### B. Buat database `production` di PostgreSQL

**Lewat terminal**:
```powershell
psql -U postgres -h 127.0.0.1
CREATE DATABASE production;
\q
```

**Atau lewat pgAdmin 4**:
1. Klik kanan Databases → Create → Database
2. Nama: `production`
3. Klik Save

---

### C. Konfigurasi `.env`

Buka file `.env`, isi konfigurasi database:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=production
DB_USERNAME=postgres
DB_PASSWORD=isi_password_postgres_anda
```

---

### D. Install dependencies & jalankan migrasi

```bash
# Install PHP dependencies
composer install

# Generate application key
php artisan key:generate

# Jalankan database migrations
php artisan migrate

# Install Node.js dependencies
npm install

# Build frontend assets
npm run build
```

---

## Menjalankan Aplikasi

### Cara Paling Cepat
```bash
npm start
```

Ini akan:
1. Build React assets (`npm run build`)
2. Jalankan Laravel server (`php artisan serve`)

Buka browser: **http://127.0.0.1:8000**

### Atau Manual

**Terminal 1 — Build React** (jika ada perubahan frontend):
```bash
npm run build
```

**Terminal 2 — Jalankan Laravel**:
```bash
php artisan serve
```

Akses: **http://127.0.0.1:8000**

---

## Workflow Development

### Edit Kode Frontend
Edit file di `resources/js/`:
- `pages/` — Halaman-halaman
- `components/` — Komponen React
- `data/mockData.jsx` — Mock data (nanti ganti dengan API)

### Build Setelah Edit
```bash
npm run build
```

### Refresh Browser
```
Ctrl+F5 (hard refresh) atau Ctrl+Shift+R
```

### Auto-Build Mode (Optional)
Kalau males build manual, gunakan watch mode:

```bash
# Terminal 1: Auto-build setiap ada perubahan
npm run build -- --watch

# Terminal 2: Laravel server
php artisan serve
```

---

## Database Schema

Semua tabel menggunakan prefix `production_`:

| Tabel | Keterangan |
|---|---|
| `production_customers` | Data pelanggan |
| `production_suppliers` | Data supplier |
| `production_products` | Master produk precast |
| `production_materials` | Master material/bahan baku |
| `production_bom_headers` | Header Bill of Material |
| `production_bom_items` | Detail item BOM |
| `production_lines` | Line produksi (A/B/C/D) |
| `production_sales_orders` | Sales Order (trigger MTO/MTS) |
| `production_orders` | Production Order |
| `production_work_orders` | Eksekusi produksi per batch |
| `production_curing_batches` | Monitoring curing |
| `production_qc_inspections` | Inspeksi QC |
| `production_inventory` | Stok produk jadi + aging |
| `production_delivery_orders` | Pengiriman |

---

## Halaman-Halaman Aplikasi

| Halaman | Route | Status |
|---------|-------|--------|
| Dashboard | `/` | ✅ |
| Production Planning | `/planning` | ✅ |
| Production Execution | `/production-execution` | ✅ |
| Production Work Order | `/work-orders` | ✅ |
| Sales Orders | `/sales` | ✅ |
| Curing Management | `/curing` | ✅ |
| Quality Control | `/quality` | ✅ |
| Inventory | `/inventory` | ✅ |
| Delivery Orders | `/delivery` | ✅ |
| Purchasing | `/purchasing` | ✅ |
| Maintenance | `/maintenance` | ✅ |
| Reports | `/reports` | ✅ |
| Master Data | `/master-data` | ✅ |
| Master BOM | `/master-bom` | ✅ |
| Master Process | `/master-process` | ✅ |

---

## Troubleshooting

### Port 8000 sudah dipakai
```bash
php artisan serve --port=8001
```

### Build error
Pastikan semua dependencies terinstall:
```bash
npm install
npm run build
```

### Database connection error
Pastikan:
1. PostgreSQL berjalan
2. Database `production` sudah dibuat
3. `.env` sudah dikonfigurasi dengan benar
4. PHP extension `pdo_pgsql` aktif

### Clear cache Laravel
```bash
php artisan cache:clear
php artisan config:clear
php artisan view:clear
```

---

## Dokumentasi Tambahan

- **DEVELOPMENT.md** — Panduan development lebih detail
- **CHANGELOG.md** — Riwayat perubahan
- **design_guidelines.json** — Panduan desain UI/UX

---

## Git Workflow

Jangan commit langsung ke `main`. Buat branch baru:

```bash
# Buat branch
git checkout -b feature/nama-fitur

# Commit & push
git add .
git commit -m "deskripsi perubahan"
git push -u origin feature/nama-fitur

# Buat pull request di GitHub
```

---

## Kontak Project

- **Client**: PT SWA X Megacon Precast
- **Developer**: PT SWA Digital Solusindo
- **Meeting MoU**: 09 Juni 2026

---

**Last Updated**: 2026-06-10  
**Status**: Production-ready ✅
