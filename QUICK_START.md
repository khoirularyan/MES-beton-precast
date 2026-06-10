# ⚡ Quick Start - MES Beton Precast

**Untuk sistem yang sudah disetup sebelumnya**

---

## ✅ Pre-flight Checklist

Pastikan sudah terinstall:
- [x] PHP 8.3+ dengan extension pdo_pgsql
- [x] PostgreSQL running
- [x] Node.js & npm
- [x] Composer
- [x] Database `production` sudah dibuat

---

## 🚀 Start Aplikasi (3 Langkah)

### 1️⃣ **Cek Status Migrasi**
```cmd
php artisan migrate:status
```
**Expected:** Semua migration status = "Ran"

Jika ada yang belum: `php artisan migrate --force`

---

### 2️⃣ **Cek Users Sudah Ada**
```cmd
php artisan tinker
```
```php
\App\Models\User::count();
// Output harus: 3 (atau lebih)
exit
```

Jika 0 users: `php artisan db:seed`

---

### 3️⃣ **Start Development Server**

**Cara Termudah (1 terminal):**
```cmd
npm run dev:prod
```

**Atau Manual (2 terminal):**

Terminal 1:
```cmd
php artisan serve
```

Terminal 2:
```cmd
npm run watch
```

---

## 🌐 Akses Aplikasi

**URL:** http://localhost:8000

**Login Credentials:**

| User Type | Email | Password | Access Level |
|-----------|-------|----------|--------------|
| Super Admin | `super@admin` | `super` | All modules |
| QC User | `qc@qc` | `12345` | Quality Control only |
| Standard User | `user@user` | `12345` | Operations only |

---

## 🛠️ Troubleshooting Cepat

### ❌ Problem: Blank page setelah login

**Fix:**
```cmd
# Pastikan Vite build assets sudah ada
npm run build

# Restart dev server
npm run dev:prod
```

---

### ❌ Problem: "Connection refused" PostgreSQL

**Fix:**
1. Cek PostgreSQL running:
```cmd
psql -U postgres -d production -c "SELECT 1;"
```

2. Cek password di `.env` benar (DB_PASSWORD=khoirul123)

---

### ❌ Problem: "Class not found"

**Fix:**
```cmd
composer dump-autoload
php artisan optimize:clear
```

---

### ❌ Problem: CSS/JS tidak load

**Fix:**
```cmd
# Rebuild assets
npm run build

# Clear browser cache (Ctrl+Shift+R)
```

---

## 📂 Struktur Folder Penting

```
MES-beton-precast/
├── .env                          ← Konfigurasi database
├── public/build/                 ← Compiled frontend assets
│   └── manifest.json             ← Harus ada setelah npm run build
├── resources/js/                 ← React source code
├── app/Http/Controllers/Api/     ← Backend API controllers
├── database/migrations/          ← Database schema
└── database/seeders/             ← Initial data seeding
```

---

## 🎯 Development Commands

### Frontend
```cmd
npm run dev          # Vite dev server (HMR)
npm run build        # Production build
npm run watch        # Build + watch mode
```

### Backend
```cmd
php artisan serve                    # Start Laravel
php artisan migrate:fresh --seed     # Reset DB + seed
php artisan tinker                   # Laravel REPL
php artisan route:list               # List all routes
```

### Combined
```cmd
npm run dev:all      # Laravel + Vite + Queue + Logs
npm run dev:prod     # Laravel + Vite watch (recommended)
```

---

## 📊 Database Quick Check

```cmd
# Check migrations
php artisan migrate:status

# Check user count
psql -U postgres -d production -c "SELECT count(*) FROM production_users;"

# Check all tables
psql -U postgres -d production -c "\dt"
```

---

## 🔄 Reset Database (Hati-hati!)

```cmd
# Full reset - DELETES ALL DATA
php artisan migrate:fresh --seed
```

---

## 📱 Main Menu Access

Setelah login sebagai **Super Admin**, Anda bisa akses:

- ✅ **Dashboard** - Production overview
- ✅ **Master Data** - Products, Materials, Customers, etc.
- ✅ **Master BOM** - Bill of Materials
- ✅ **Master Process** - Production process stages
- ✅ **Sales Orders** - Customer orders
- ✅ **Production Planning** - MPS/Planning
- ✅ **Production Execution** - Work orders
- ✅ **Curing Management** - Curing tracking
- ✅ **Quality Control** - QC inspections
- ✅ **Inventory** - Stock management
- ✅ **Delivery** - Delivery orders
- ✅ **Reports** - Analytics & reports
- ✅ **User Access Management** - User permissions

---

## ⚠️ Common Mistakes

1. ❌ Lupa jalankan `npm run build` setelah clone
2. ❌ Database PostgreSQL tidak running
3. ❌ Password PostgreSQL di `.env` salah
4. ❌ Lupa run `php artisan migrate`
5. ❌ Lupa run `php artisan db:seed`
6. ❌ Browser cache tidak di-clear

---

## 🎉 Success Indicators

Sistem berjalan dengan baik jika:

- ✅ `http://localhost:8000` menampilkan login page
- ✅ Login berhasil dengan salah satu user
- ✅ Sidebar menampilkan menu sesuai role
- ✅ Dashboard menampilkan metrics (dummy data OK)
- ✅ Tidak ada error di browser console
- ✅ Tidak ada error di terminal Laravel

---

**Status:** ✅ **SISTEM SIAP DIGUNAKAN**

Ikuti langkah 1-2-3 di atas untuk start aplikasi.
