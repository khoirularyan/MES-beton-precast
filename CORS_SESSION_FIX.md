# 401 Unauthorized - CORS & Session Fix

## Masalah yang Diperbaiki

**Error**: `401 Unauthorized` ketika mengakses `/api/products` dari frontend
**Penyebab**: Session cookies tidak terkirim karena cross-origin request (Vite port 5173 → Laravel port 8000)

## Solusi yang Diterapkan

### 1. Update `.env` - Session Configuration
```env
SESSION_DRIVER=database          # Ganti dari 'file' ke 'database'
SESSION_DOMAIN=localhost         # Set domain untuk localhost
SESSION_SAME_SITE=none          # Allow cross-site cookies
SESSION_SECURE_COOKIE=false     # False untuk http (development)
```

**Penjelasan**:
- `SESSION_DRIVER=database` - Session disimpan di database, lebih reliable untuk cross-origin
- `SESSION_DOMAIN=localhost` - Cookie akan valid untuk semua port di localhost
- `SESSION_SAME_SITE=none` - Membolehkan cookie dikirim ke different origin
- `SESSION_SECURE_COOKIE=false` - Karena development menggunakan HTTP (bukan HTTPS)

### 2. Create `config/cors.php` - CORS Configuration
```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'auth/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:5173',    // Vite default
        'http://127.0.0.1:5173',
        'http://localhost:3000',    // Alternative port
        'http://127.0.0.1:3000',
    ],
    'allowed_headers' => ['*'],
    'supports_credentials' => true,  // PENTING: Allow cookies
];
```

**Penjelasan**:
- `supports_credentials: true` - **SANGAT PENTING**: Membolehkan cookies dikirim cross-origin
- `allowed_origins` - List origin yang dibolehkan (frontend Vite)

### 3. Update `bootstrap/app.php` - Enable CORS Middleware
```php
->withMiddleware(function (Middleware $middleware): void {
    // Enable CORS for API routes with credentials
    $middleware->api(prepend: [
        \Illuminate\Http\Middleware\HandleCors::class,
    ]);
    
    // Trust proxies for local development
    $middleware->trustProxies(at: '*');
})
```

**Penjelasan**:
- Menambahkan `HandleCors` middleware ke API routes
- Trust semua proxies untuk development

## Langkah Setelah Perubahan

### 1. Clear Cache
```bash
php artisan config:clear
php artisan cache:clear
```

### 2. Restart Laravel Server
```bash
# Stop server (Ctrl+C)
# Start again
php artisan serve
```

### 3. Restart Vite Dev Server
```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

### 4. Clear Browser Cookies
- Buka DevTools (F12)
- Application → Cookies
- Delete all cookies untuk localhost
- Refresh halaman

### 5. Login Ulang
- Kembali ke `/login`
- Login dengan `super@admin` / `super`
- Setelah login, coba akses Master Data lagi

## Verifikasi Fix

### Check 1: Browser DevTools Network Tab
1. Buka Master Data page
2. Open DevTools (F12) → Network tab
3. Lihat request ke `/api/products`
4. Check **Request Headers**:
   ```
   Cookie: laravel-session=xxx; XSRF-TOKEN=xxx
   ```
   ✅ Cookie harus ada!

### Check 2: Response Headers
Lihat **Response Headers** dari `/api/products`:
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```
✅ CORS headers harus ada!

### Check 3: Status Code
- Status code harus **200 OK** (bukan 401)
- Response body harus berisi data products

## Troubleshooting

### Masih 401 setelah fix?

#### Solusi 1: Pastikan sudah login
```bash
# Check di browser console
console.log('Logged in:', !!localStorage.getItem('user'));
```
Jika false, login ulang.

#### Solusi 2: Clear semua cache
```bash
# Laravel
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Browser
# Delete all cookies dan localStorage
# Hard refresh (Ctrl+Shift+R)
```

#### Solusi 3: Check database sessions table
```sql
SELECT * FROM production_sessions ORDER BY last_activity DESC LIMIT 5;
```
Harus ada record session setelah login.

#### Solusi 4: Verify .env loaded
```bash
php artisan tinker
>>> config('session.driver')
# Harus return: "database"
>>> config('session.domain')
# Harus return: "localhost"
```

### CORS Error: "No 'Access-Control-Allow-Origin' header"

**Penyebab**: CORS config tidak loaded atau middleware tidak aktif

**Solusi**:
```bash
# Regenerate config cache
php artisan config:cache

# Restart server
php artisan serve
```

### Cookie tidak terkirim dari browser

**Penyebab**: Browser blocking third-party cookies

**Solusi untuk Development**:
1. Chrome: Settings → Privacy → Allow all cookies (sementara)
2. Firefox: Settings → Privacy → Custom → Cookies: Allow all
3. Atau gunakan **same port** (lihat alternatif di bawah)

## Alternatif: Serve Frontend dari Laravel (No CORS Issues)

Jika masih ada masalah CORS, gunakan Laravel untuk serve frontend:

### Build frontend production
```bash
npm run build
```

### Akses via Laravel
```
http://localhost:8000
```

Tidak ada CORS karena frontend dan backend di port yang sama!

## Production Deployment

Untuk production, update `.env`:
```env
SESSION_DOMAIN=.yourdomain.com  # Domain production
SESSION_SAME_SITE=lax           # Lebih secure
SESSION_SECURE_COOKIE=true      # Require HTTPS
```

Update `config/cors.php`:
```php
'allowed_origins' => [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
],
```

## Penjelasan Teknis

### Mengapa Cross-Origin Session Tidak Work?

1. **Browser Security**: Browser tidak mengirim cookies ke different origin by default
2. **SameSite Policy**: Cookie dengan SameSite=lax tidak dikirim di POST cross-origin
3. **CORS Credentials**: Tanpa `supports_credentials: true`, cookies di-block

### Flow Authentication dengan CORS:

```
1. Login POST → http://localhost:8000/auth/login
   ← Response: Set-Cookie: laravel-session=xxx; Domain=localhost

2. API GET → http://localhost:8000/api/products
   → Request: Cookie: laravel-session=xxx
   → Header: X-CSRF-TOKEN: yyy
   ← Response: 200 OK + data

3. Laravel auth middleware validates:
   - Session cookie exists
   - Session is valid
   - User is authenticated
   ✅ Allow request
```

### Kenapa File Session Tidak Work?

File session menyimpan data di server filesystem. Ketika cookie session dikirim, Laravel perlu:
1. Read session file dari disk
2. Validate session data

Dengan database session:
- Lebih reliable untuk multiple servers
- Easier to debug (query database)
- Better for production environment

## Summary

✅ **Fixed**:
- Session cookies sekarang dikirim cross-origin
- CORS headers ditambahkan ke API responses
- Database session lebih reliable

✅ **Next**: 
- Login ulang
- Test CRUD operations di Master Data
- Verify di Browser DevTools

Jika masih ada masalah, cek `storage/logs/laravel.log` untuk error details.
