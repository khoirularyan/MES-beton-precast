# Master Data Login Redirect Fix

Tanggal: 10 Juni 2026

## Masalah

Setelah user berhasil login, halaman **Master Data** selalu keluar kembali ke halaman login.

Gejala yang terlihat:

- Login berhasil.
- Saat membuka Master Data, frontend memanggil endpoint:

```text
GET /api/products?per_page=100
```

- Request API mendapat response `401 Unauthorized`.
- Interceptor frontend mendeteksi `401`, lalu otomatis redirect ke:

```text
/login
```

## Penyebab

Masalahnya ada pada cookie session.

Di `.env`, session cookie sebelumnya dikunci ke domain:

```env
SESSION_DOMAIN=localhost
SESSION_SAME_SITE=none
```

Tetapi aplikasi sedang dibuka dari:

```text
http://127.0.0.1:8000
```

Browser menganggap `localhost` dan `127.0.0.1` sebagai host yang berbeda.

Akibatnya:

- Cookie login dibuat untuk `localhost`.
- Request ke `127.0.0.1` tidak membawa cookie session.
- Laravel menganggap user belum login.
- API `/api/products` mengembalikan `401 Unauthorized`.
- Frontend redirect ke login.

## Perubahan Yang Dilakukan

### 1. Update `.env`

Diubah dari:

```env
APP_URL=http://localhost
SESSION_DOMAIN=localhost
SESSION_SAME_SITE=none
```

Menjadi:

```env
APP_URL=http://127.0.0.1:8000
SESSION_DOMAIN=null
SESSION_SAME_SITE=lax
```

Dengan `SESSION_DOMAIN=null`, Laravel membuat cookie host-only.

Artinya cookie akan mengikuti host yang sedang dipakai:

- Jika buka `127.0.0.1`, cookie berlaku untuk `127.0.0.1`.
- Jika buka `localhost`, cookie berlaku untuk `localhost`.

### 2. Update `resources/js/lib/api.js`

Sebelumnya API hardcode ke:

```js
baseURL: 'http://127.0.0.1:8000/api'
```

Sekarang backend origin dibuat dinamis:

```js
const backendOrigin = import.meta.env.VITE_API_BASE_URL
  || (window.location.port === '5173' ? 'http://127.0.0.1:8000' : window.location.origin);
```

Lalu dipakai oleh axios:

```js
baseURL: `${backendOrigin}/api`
```

Tujuannya supaya frontend tidak bergantung pada host yang di-hardcode.

### 3. Update `resources/js/lib/auth.jsx`

Auth request juga dibuat memakai backend origin yang sama:

```js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (window.location.port === '5173' ? 'http://127.0.0.1:8000' : window.location.origin);
```

Request login/session/logout tetap membawa cookie:

```js
credentials: "include"
```

## Command Yang Dijalankan

Clear config Laravel:

```bash
php artisan config:clear
```

Cek session domain:

```bash
php artisan config:show session.domain
```

Hasil:

```text
session.domain .. null
```

Build frontend:

```bash
npm.cmd run build
```

Build berhasil dan menghasilkan asset baru di:

```text
public/build
```

## Cara Tes Ulang

1. Buka browser.
2. Hapus cookie lama untuk:

```text
localhost
127.0.0.1
```

3. Buka aplikasi:

```text
http://127.0.0.1:8000
```

4. Login ulang.
5. Masuk ke menu **Master Data**.
6. Cek Network tab untuk request:

```text
GET /api/products?per_page=100
```

Expected result:

```text
Status 200 OK
```

Halaman Master Data tidak lagi keluar ke login.

## Catatan

Untuk development lokal, sebaiknya konsisten pakai satu host saja.

Rekomendasi:

```text
http://127.0.0.1:8000
```

Jangan campur akses antara:

```text
http://localhost:8000
http://127.0.0.1:8000
```

karena browser memperlakukan keduanya sebagai host berbeda untuk cookie.
