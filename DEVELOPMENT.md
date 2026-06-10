# Panduan Development — MES Beton Precast

## 🚀 Quick Start (Paling Mudah)

```bash
npm start
```

Buka browser: **http://127.0.0.1:8000**

Selesai! Aplikasi sudah jalan. ✅

---

## ⚠️ PENTING: Port 8000 Saja!

**Hanya butuh membuka 1 port: `8000` (Laravel)**

❌ Jangan buka port 5173 (Vite dev server)
- Port 5173 hanya untuk mode dev dengan hot-reload
- Di setup kita, ada bug menyebabkan blank screen
- Tidak perlu membuka port 5173

**Alur**:
```
npm run build  ← Vite compile React (offline process)
      ↓
php artisan serve  ← Laravel serve dari public/build/
      ↓
Browser: http://127.0.0.1:8000  ✅ (HANYA BUKA INI)
```

---

## 📦 Workflow Development yang Benar

### 1. Build React dengan Vite
```bash
npm run build
```

Vite akan compile semua kode React jadi `.js` dan `.css` di folder `public/build/`.

### 2. Jalankan Laravel Server
```bash
php artisan serve
```

Laravel akan serve hasil build dari `public/build/` di port **8000**.

### 3. Buka di Browser
```
http://127.0.0.1:8000
```

✅ Selesai! Hanya perlu 1 port (8000).

---

## 🔄 Setiap Kali Edit Kode Frontend

### Edit File React/CSS:
```bash
npm run build
php artisan serve
# Refresh browser (Ctrl+F5)
```

### Opsi: Auto Build (Lebih Nyaman)
Jika males build manual, bisa pakai watch mode:

```bash
# Terminal 1: Vite auto-build setiap ada perubahan
npm run build -- --watch

# Terminal 2: Laravel server
php artisan serve
```

Dengan ini, setiap kali save file `.jsx` atau `.css`, Vite otomatis compile ulang.
Tinggal refresh browser (F5).

### Ingat Selalu!
- ✅ Buka browser di: **http://127.0.0.1:8000**
- ❌ Jangan buka http://127.0.0.1:5173
- ✅ Setiap edit, jalankan `npm run build`
- ✅ Refresh browser setelah build (Ctrl+F5)

---

## 🛠️ Penjelasan Vite vs Laravel

### Vite itu "Compiler"
- **Input**: React code (`.jsx`, `.css`)
- **Output**: Browser-ready files (`.js`, `.css`)
- **Process**: `npm run build`
- **Location**: Output disimpan di `public/build/`

### Laravel itu "Web Server"
- **Input**: File dari `public/build/`
- **Output**: Serve ke browser
- **Process**: `php artisan serve`
- **Port**: 8000

### Jadi Hubungannya:
```
React code (resources/js/)
    ↓
npm run build (Vite compile)
    ↓
Output: public/build/index-xxx.js
    ↓
php artisan serve (Laravel serve)
    ↓
Browser load http://127.0.0.1:8000
```

### Port 5173 (Vite Dev Server)
- ❌ Tidak perlu di setup ini
- ⚠️ Ada bug (blank screen)
- 💡 Hanya berguna kalau pakai `npm run dev` dengan hot-reload

---

## 🐛 Debugging / Troubleshooting

### Halaman Blank?
1. Hard refresh browser: `Ctrl+Shift+R`
2. Cek apakah sudah run `npm run build`
3. Cek apakah `public/build/` folder ada file `.js` dan `.css`

### CSS tidak jalan?
1. Jalankan `npm run build`
2. Refresh browser (Ctrl+F5)

### Kode lama masih tampil?
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Atau buka Incognito mode

### Build error?
Jalankan di terminal:
```bash
npm run build
```
Lihat error message, perbaiki kode React-nya

### Port 8000 sudah dipakai?
```bash
php artisan serve --port=8001
```

---

## 📁 File Structure

```
MES-beton-precast/
├── resources/
│   ├── views/
│   │   └── app.blade.php    ← HTML entry point
│   └── js/                  ← React code (edit di sini)
│       ├── index.jsx         ← React entry
│       ├── App.jsx           ← Main app & routing
│       ├── index.css         ← Global CSS + Tailwind
│       ├── pages/            ← Halaman-halaman
│       │   ├── Dashboard.jsx
│       │   ├── ProductionPlanning.jsx
│       │   ├── ProductionExecution.jsx
│       │   └── ... (14 more)
│       ├── components/       ← Reusable components
│       │   ├── layout/
│       │   ├── shared/
│       │   ├── ui/           ← shadcn/ui components
│       │   └── visuals/
│       ├── data/
│       │   └── mockData.jsx  ← Mock data (nanti ganti API)
│       └── lib/
│           └── utils.jsx
├── public/
│   └── build/                ← Build output (auto-generated)
│       ├── index-xxx.js
│       └── index-xxx.css
├── database/
│   └── migrations/           ← Database migrations
├── app/                      ← Laravel backend
├── routes/
│   └── web.php               ← Laravel routing
├── vite.config.js
├── package.json
├── composer.json
├── .env
└── php.ini
```

---

## 🚦 Command Cheatsheet

| Command | Fungsi |
|---------|--------|
| `npm install` | Install Node.js dependencies |
| `npm run build` | Build React assets |
| `npm run build -- --watch` | Build + auto-rebuild setiap ada perubahan |
| `npm start` | Build + jalankan Laravel server |
| `php artisan serve` | Jalankan Laravel server |
| `php artisan migrate` | Jalankan database migrations |
| `php artisan cache:clear` | Clear Laravel cache |
| `composer install` | Install PHP dependencies |
| `composer update` | Update PHP dependencies |

---

## 💡 Development Tips

1. **Edit file React saja di `resources/js/`** — Jangan edit hasil build di `public/build/`
2. **Selalu run `npm run build` setelah edit** — Atau pakai `--watch` mode
3. **Hard refresh browser** — `Ctrl+Shift+R` untuk clear cache
4. **Pakai React DevTools extension** — Untuk debugging React component

---

## 📝 Current Status

✅ **Yang Jalan**:
- Laravel server: `php artisan serve` → http://127.0.0.1:8000
- Production build: `npm run build` → Assets di `public/build/`
- **15 halaman UI** berfungsi normal dengan feature lengkap
- Database PostgreSQL terkoneksi
- Routing React Router berfungsi
- **Authentication system**: Login page ready
- **RBAC system**: User Access Management ready
- **MoU Compliance**: 90% (18/21 kebutuhan terpenuhi)

❌ **Yang Belum Jalan**:
- Vite dev server: `npm run dev` → Menyebabkan blank screen (SKIP, gunakan build mode)
- Backend API endpoints → Ready untuk development

🔧 **Next Steps** (Priority):
1. **Backend development**: Create Controllers & API endpoints
2. Implement authentication API (`/auth/login`, `/auth/users`)
3. Replace mock data dengan real API calls
4. Setup RBAC middleware untuk permission checking
5. (Optional) Enhancement untuk aging detail & labor costing

📊 **Analisis Terbaru**:
Lihat `MOU_COMPLIANCE_ANALYSIS_2026-06-10.md` untuk detailed compliance scorecard dengan 15 halaman inventory.

---

**Last Updated**: 2026-06-10 09:45 WIB  
**Status**: ✅ Production build mode working perfectly. UI 90% MoU compliant, ready for backend development.
