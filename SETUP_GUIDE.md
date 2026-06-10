# MES Beton Precast — Setup Guide

> **Manufacturing Execution System untuk PT Megacon Bangun Perkasa**
> Laravel 13 · React 18 · Vite 5 · PostgreSQL 16 · PHP 8.3+

---

## Daftar Isi

1. [Prerequisites](#1-prerequisites)
2. [PHP Extension Setup](#2-php-extension-setup)
3. [Database Setup](#3-database-setup)
4. [Clone & Environment](#4-clone--environment)
5. [Install Dependencies](#5-install-dependencies)
6. [Build & Jalankan](#6-build--jalankan)
7. [Verifikasi Setup](#7-verifikasi-setup)
8. [Development Workflow](#8-development-workflow)
9. [Production Deployment](#9-production-deployment)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

Pastikan semua software berikut sudah terinstall sebelum lanjut.

| Software | Versi Minimum | Cek Command |
|---|---|---|
| PHP | 8.3 | `php --version` |
| Composer | 2.x | `composer --version` |
| Node.js | 20 LTS | `node --version` |
| npm | 10.x | `npm --version` |
| PostgreSQL | 16 | `psql --version` |
| Git | 2.x | `git --version` |

**Download:**
- PHP: https://www.php.net/downloads
- Composer: https://getcomposer.org/download
- Node.js: https://nodejs.org (pilih LTS)
- PostgreSQL: https://www.postgresql.org/download

**Rekomendasi IDE / Extensions:**

VSCode extensions yang membantu:
- `bmewburn.vscode-intelephense-client` — PHP IntelliSense
- `bradlc.vscode-tailwindcss` — Tailwind CSS autocomplete
- `dbaeumer.vscode-eslint` — ESLint
- `esbenp.prettier-vscode` — Prettier formatter

---

## 2. PHP Extension Setup

### Temukan lokasi php.ini

```bash
php --ini
```

Output akan menunjukkan path seperti:
- Windows: `C:\php-8.x.x-nts-Win32-vs17-x64\php.ini`
- Linux: `/etc/php/8.3/cli/php.ini`
- macOS: `/usr/local/etc/php/8.3/php.ini`

### Aktifkan extension yang diperlukan

Buka `php.ini`, cari baris berikut, dan hapus `;` di depannya:

```ini
extension=openssl
extension=pdo_pgsql
extension=pgsql
extension=mbstring
extension=fileinfo
extension=curl
extension=zip
```

### Verifikasi

```bash
# Windows
php -m | findstr "pdo_pgsql pgsql mbstring fileinfo zip openssl curl"

# Linux / macOS
php -m | grep -E "pdo_pgsql|pgsql|mbstring|fileinfo|zip|openssl|curl"
```

Semua extension harus muncul di output. Jika tidak muncul, restart terminal dan coba lagi.

---

## 3. Database Setup

### Buat database

```bash
# Login ke PostgreSQL
psql -U postgres -h 127.0.0.1

# Buat database
CREATE DATABASE production;

# Keluar
\q
```

Alternatif: gunakan pgAdmin 4 → klik kanan Databases → Create → Database → isi Name: `production`.

### Test koneksi

```bash
psql -U postgres -h 127.0.0.1 -d production
```

Jika berhasil masuk ke prompt PostgreSQL, koneksi sudah benar. Keluar dengan `\q`.

> **Catatan:** Jika database sudah ada dan terisi data, lewati langkah migrate di bawah.

---

## 4. Clone & Environment

### Clone repository

```bash
git clone <repository-url> MES-beton-precast
cd MES-beton-precast
```

### Setup file .env

```bash
# Windows
copy .env.example .env

# Linux / macOS
cp .env.example .env
```

### Edit konfigurasi .env

Buka `.env` dan sesuaikan bagian database:

```env
APP_NAME="MES Beton Precast"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=production
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password_here
DB_MIGRATIONS_TABLE=production_migrations

SESSION_DRIVER=database
SESSION_TABLE=production_sessions

QUEUE_CONNECTION=database
DB_QUEUE_TABLE=production_jobs

CACHE_STORE=database
DB_CACHE_TABLE=production_cache
DB_CACHE_LOCK_TABLE=production_cache_locks
```

> **Jangan** set `APP_DEBUG=false` di development — akan menyembunyikan error message.

### Generate application key

```bash
php artisan key:generate
```

Output yang diharapkan:
```
Application key set successfully.
```

Cek `.env` — `APP_KEY=base64:...` harus terisi.

---

## 5. Install Dependencies

### PHP dependencies

```bash
composer install
```

Estimasi waktu: 2–3 menit. Output yang diharapkan:
```
Generating optimized autoload files
> @php artisan package:discover --ansi
INFO  Discovering packages.
```

### Node.js dependencies

```bash
npm install --legacy-peer-deps
```

Flag `--legacy-peer-deps` diperlukan karena beberapa package UI belum update peer dependency mereka untuk React 18. Ini aman untuk development.

Estimasi waktu: 1–3 menit. Output yang diharapkan:
```
added 265 packages, and audited 266 packages
```

---

## 6. Build & Jalankan

### Build frontend assets

```bash
npm run build
```

Output yang diharapkan:
```
vite v5.4.x building for production...
✓ 3343 modules transformed.
public/build/.vite/manifest.json   0.21 kB
public/build/assets/index-*.css   ~100 kB
public/build/assets/index-*.js    ~1.1 MB
✓ built in ~10s
```

File hasil build disimpan di `public/build/`. Folder ini **jangan dicommit** ke git (sudah ada di `.gitignore`).

### Jalankan database migration

> **Skip jika database sudah ada datanya.**

```bash
# Cek status migration
php artisan migrate:status

# Jalankan migration
php artisan migrate
```

### Jalankan aplikasi

```bash
php artisan serve
```

Output:
```
INFO  Server running on [http://127.0.0.1:8000].
```

Buka browser: **http://127.0.0.1:8000**

---

## 7. Verifikasi Setup

Lakukan checklist berikut setelah setup selesai:

### Cek dari terminal

```bash
# 1. Cek database connection
php artisan tinker
>>> DB::connection()->getPdo();
>>> exit

# 2. Cek routes terdaftar
php artisan route:list

# 3. Cek config loaded
php artisan config:show database
```

### Cek dari browser

Buka http://127.0.0.1:8000 dan pastikan:

- [ ] Halaman login muncul (tidak blank, tidak error)
- [ ] Tidak ada error merah di browser Console (F12 → Console)
- [ ] Network tab (F12 → Network) — file JS dan CSS status 200
- [ ] API `/auth/session` merespons JSON

```bash
# Test API dari terminal
curl http://127.0.0.1:8000/auth/session
# Expected: {"user":null,"roles":{...},"permissions":{...}}
```

### Cek file struktur penting

```
public/build/
├── .vite/
│   └── manifest.json     ← wajib ada
└── assets/
    ├── index-*.css
    └── index-*.js
```

---

## 8. Development Workflow

### Struktur workflow

Project ini menggunakan **production build** untuk development di Windows karena keterbatasan kompatibilitas Vite HMR di Windows + laravel-vite-plugin. Ini lebih stabil dan tidak mengurangi produktivitas secara signifikan.

### Pilihan A: Build manual (paling simpel)

```bash
# Terminal 1 — jalankan Laravel server (biarkan berjalan)
php artisan serve

# Setiap kali selesai edit file JSX/CSS/JS, rebuild di terminal lain:
npm run build
# Lalu refresh browser
```

### Pilihan B: Watch mode (auto-rebuild saat file berubah)

```bash
# Terminal 1 — auto rebuild setiap ada perubahan file
npm run watch

# Terminal 2 — Laravel server
php artisan serve
```

Akses aplikasi: **http://127.0.0.1:8000**

> Dengan `npm run watch`, setiap kali kamu save file `.jsx` atau `.css`, Vite otomatis rebuild. Cukup refresh browser manual setelah build selesai (biasanya 5–10 detik).

### Pilihan C: Satu command (watch + serve)

```bash
npm run dev:prod
```

Ini jalankan `npm run watch` dan `php artisan serve` secara bersamaan di satu terminal menggunakan `concurrently`.

### Referensi NPM Scripts

| Command | Fungsi |
|---|---|
| `npm run build` | Build sekali untuk production atau setelah edit file |
| `npm run watch` | Auto rebuild saat file berubah (tanpa server) |
| `npm run serve` | Jalankan Laravel server saja |
| `npm run dev:prod` | Watch + Laravel server sekaligus (recommended untuk dev) |
| `npm start` | Build + serve (untuk quick start tanpa watch) |

### Referensi Artisan Commands

| Command | Fungsi |
|---|---|
| `php artisan serve` | Jalankan development server |
| `php artisan migrate` | Jalankan migration baru |
| `php artisan migrate:status` | Cek status migration |
| `php artisan migrate:rollback` | Rollback migration terakhir |
| `php artisan migrate:fresh --seed` | Reset database + seed (hati-hati, data hilang) |
| `php artisan cache:clear` | Hapus application cache |
| `php artisan config:clear` | Hapus config cache |
| `php artisan route:list` | Tampilkan semua routes |
| `php artisan tinker` | Interactive PHP REPL |
| `php artisan db:seed` | Jalankan database seeder |

### Git workflow

```bash
# Sebelum commit, pastikan tidak ada file hasil build
git status

# File ini TIDAK boleh dicommit:
# - public/build/
# - vendor/
# - node_modules/
# - .env

# Sudah ada di .gitignore — tapi verifikasi dulu
```

---

## 9. Production Deployment

### Persiapan server

Requirements server production:
- PHP 8.3+ dengan extension yang sama seperti di development
- PostgreSQL 16
- Nginx atau Apache
- Supervisor (untuk queue worker)
- SSL certificate (Let's Encrypt atau komersial)

### Langkah deployment

```bash
# 1. Pull code terbaru
git pull origin main

# 2. Install PHP dependencies (tanpa dev packages)
composer install --optimize-autoloader --no-dev

# 3. Install Node dependencies dan build
npm ci --legacy-peer-deps
npm run build

# 4. Jalankan migration (jika ada yang baru)
php artisan migrate --force

# 5. Cache untuk performa
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 6. Restart queue worker
php artisan queue:restart
```

### Konfigurasi .env untuk production

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

LOG_LEVEL=error

# Gunakan session driver database atau redis
SESSION_DRIVER=database

# Queue connection
QUEUE_CONNECTION=database
```

> **WAJIB:** `APP_DEBUG=false` di production. Jika `true`, stack trace dan konfigurasi bisa terekspos ke publik.

### Nginx configuration

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name your-domain.com;
    root /var/www/MES-beton-precast/public;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Redirect HTTP ke HTTPS
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    }
}
```

### Queue worker dengan Supervisor

Install Supervisor:

```bash
# Ubuntu/Debian
sudo apt install supervisor

# CentOS/RHEL
sudo yum install supervisor
```

Buat config file `/etc/supervisor/conf.d/mes-worker.conf`:

```ini
[program:mes-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/MES-beton-precast/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/MES-beton-precast/storage/logs/worker.log
stopwaitsecs=3600
```

Aktifkan:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start mes-worker:*
```

### Scheduler (Cron)

Tambahkan cron job untuk Laravel scheduler:

```bash
crontab -e
```

Tambahkan:

```
* * * * * cd /var/www/MES-beton-precast && php artisan schedule:run >> /dev/null 2>&1
```

### Permissions (Linux)

```bash
sudo chown -R www-data:www-data /var/www/MES-beton-precast
sudo chmod -R 755 /var/www/MES-beton-precast
sudo chmod -R 775 /var/www/MES-beton-precast/storage
sudo chmod -R 775 /var/www/MES-beton-precast/bootstrap/cache
```

---

## 10. Troubleshooting

### ❌ `ViteManifestNotFoundException` — manifest.json not found

```
Vite manifest not found at: public/build/manifest.json
```

**Penyebab:** Assets belum di-build, atau manifest ada di lokasi berbeda.

**Solusi:**

```bash
# Build assets
npm run build

# Verifikasi file ada
# Windows
dir public\build\.vite\

# Linux/macOS
ls public/build/.vite/
```

Pastikan `AppServiceProvider.php` sudah ada baris ini:

```php
Vite::useManifestFilename('.vite/manifest.json');
```

---

### ❌ Blank page / white screen

**Cek browser console (F12 → Console) untuk error message.**

Langkah debugging:

```bash
# 1. Rebuild assets
npm run build

# 2. Clear semua cache Laravel
php artisan cache:clear
php artisan config:clear
php artisan view:clear

# 3. Hard refresh browser
# Windows/Linux: Ctrl + Shift + R
# macOS: Cmd + Shift + R
```

---

### ❌ `SQLSTATE[08006]` — database connection refused

**Penyebab:** PostgreSQL tidak running atau kredensial salah.

**Solusi:**

```bash
# Windows: cek di services.msc, cari "postgresql-x64-16"
# Linux
sudo systemctl status postgresql
sudo systemctl start postgresql

# Test koneksi manual
psql -U postgres -h 127.0.0.1 -d production

# Cek .env
cat .env | grep DB_
```

---

### ❌ `npm install` error — ERESOLVE peer dependency conflict

**Penyebab:** Konflik peer dependency antar packages.

**Solusi:**

```bash
# Selalu gunakan flag ini
npm install --legacy-peer-deps

# Jika masih error, clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

### ❌ `php artisan` error — Class not found

**Penyebab:** Autoload tidak up-to-date.

**Solusi:**

```bash
composer dump-autoload
```

---

### ❌ `The zip extension and unzip commands are both missing`

**Penyebab:** PHP `ext-zip` belum aktif.

**Solusi:** Buka `php.ini`, uncomment:

```ini
extension=zip
```

Restart terminal, lalu coba `composer install` lagi.

---

### ❌ Port 8000 sudah dipakai

**Penyebab:** Ada proses lain yang sudah menggunakan port 8000.

**Solusi:**

```bash
# Gunakan port lain
php artisan serve --port=8001

# Atau temukan dan kill proses (Windows)
netstat -ano | findstr :8000
taskkill /PID <pid_number> /F

# Linux/macOS
lsof -i :8000
kill -9 <pid_number>
```

---

### ❌ `419 Page Expired` saat submit form

**Penyebab:** CSRF token expired atau session bermasalah.

**Solusi:**

```bash
php artisan cache:clear
php artisan config:clear
```

Hapus cookie browser untuk `127.0.0.1`, lalu refresh halaman.

---

### ❌ Storage / file upload tidak berjalan

**Penyebab:** Symlink `public/storage` belum dibuat.

**Solusi:**

```bash
php artisan storage:link
```

---

### ❌ Permission denied di `storage/` (Linux/macOS)

```bash
chmod -R 775 storage bootstrap/cache
chown -R $USER:www-data storage bootstrap/cache
```

---

## Catatan Arsitektur

### Mengapa production build untuk development?

Project ini menggunakan Vite 5 + laravel-vite-plugin 1.x. Kombinasi ini memiliki keterbatasan kompatibilitas HMR (Hot Module Replacement) di Windows. Solusi yang sudah diterapkan:

- **`npm run watch`** — Vite watch mode, auto-rebuild saat file berubah (~5–10 detik per rebuild)
- **`php artisan serve`** — serve hasil build via Laravel
- Manifest Vite 5 disimpan di `.vite/manifest.json` — sudah dikonfigurasi di `AppServiceProvider`

### Stack version yang digunakan

| Package | Versi | Catatan |
|---|---|---|
| laravel/framework | ^13.8 | Laravel 13 |
| React | ^18.3.1 | React 18 (stabil) |
| Vite | ^5.4.0 | Build tool |
| laravel-vite-plugin | ^1.1.1 | Bridge Laravel–Vite |
| @vitejs/plugin-react | ^4.3.4 | React Fast Refresh |
| Tailwind CSS | ^4.0.0 | Styling |
| PostgreSQL | 16 | Database |
| PHP | ^8.3 | Runtime |

---

*Dokumen ini mencerminkan kondisi project per **10 Juni 2026**.*
*Untuk: PT Megacon Bangun Perkasa × PT SWA Digital Solusindo*
