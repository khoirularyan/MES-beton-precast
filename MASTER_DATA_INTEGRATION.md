# Master Data API Integration Guide

## Overview
This document describes the integration between the React frontend and Laravel backend for Master Data management (Products & Materials).

## Architecture

```
React Frontend ←→ Axios (api.js) ←→ Laravel API Routes ←→ Controllers ←→ Models ←→ PostgreSQL
```

## Completed Integration

### ✅ Products Module
**Frontend**: `resources/js/pages/MasterData.jsx` (Products tab)
**Backend**: `app/Http/Controllers/Api/ProductController.php`
**API Endpoint**: `/api/products`
**Model**: `app/Models/Product.php`

**Features**:
- ✅ List all products with loading state
- ✅ Create new product with validation
- ✅ Grid view and table view
- ✅ Search/filter functionality
- ⏳ Edit product (ready to implement)
- ⏳ Delete product (ready to implement)

**API Fields**:
```javascript
{
  kode: "P001",           // Required, unique, max 30 chars
  nama: "Product Name",   // Required, max 200 chars
  kategori: "Category",   // Optional, max 50 chars
  varian: "Variant",      // Optional, max 50 chars
  spek: "Specification",  // Optional, max 100 chars
  grade: "K-300",         // Optional, max 20 chars
  berat: 1500.5,          // Optional, numeric
  harga: 250000,          // Optional, integer (Rp)
  satuan: "pcs",          // Optional, max 20 chars
  standar: "SNI 7833",    // Optional, max 50 chars
  aktif: true             // Optional, boolean (default: true)
}
```

### ✅ Materials Module
**Frontend**: `resources/js/pages/MasterData.jsx` (Materials tab)
**Backend**: `app/Http/Controllers/Api/MaterialController.php`
**API Endpoint**: `/api/materials`
**Model**: `app/Models/Material.php`

**Features**:
- ✅ List all materials with loading state
- ✅ Create new material with validation
- ✅ Table view with stock information
- ✅ Search/filter functionality
- ⏳ Edit material (ready to implement)
- ⏳ Delete material (ready to implement)

**API Fields**:
```javascript
{
  kode: "M001",              // Required, unique, max 20 chars
  nama: "Material Name",     // Required, max 200 chars
  satuan: "kg",              // Optional, max 20 chars
  kategori: "Semen",         // Optional, max 50 chars
  stok: 5000.5,              // Optional, numeric (3 decimals)
  min_stok: 1000.0,          // Optional, numeric (3 decimals)
  supplier_id: 1,            // Optional, must exist in suppliers table
  harga: 150000,             // Optional, integer (Rp)
  lead_time_hari: 7,         // Optional, integer (days)
  aktif: true                // Optional, boolean (default: true)
}
```

## File Structure

### Frontend Files
```
resources/js/
├── lib/
│   └── api.js                    # ✅ API helper functions (Axios)
├── pages/
│   └── MasterData.jsx            # ✅ Main page with Products & Materials tabs
└── components/
    └── shared/
        └── FormDialog.jsx        # ✅ Updated with async onSubmit support
```

### Backend Files
```
app/
├── Http/Controllers/Api/
│   ├── ProductController.php     # ✅ CRUD operations for products
│   └── MaterialController.php    # ✅ CRUD operations for materials
└── Models/
    ├── Product.php               # ✅ Product model with fillable fields
    └── Material.php              # ✅ Material model with fillable fields

routes/
└── api.php                       # ✅ API routes with auth middleware
```

## Testing the Integration

### Prerequisites
1. Database seeded with default users:
   - **Super Admin**: `super@admin` / `super`
   - **QC User**: `qc@qc` / `12345`
   - **Regular User**: `user@user` / `12345`

2. Laravel server running:
   ```bash
   php artisan serve
   ```

3. Vite dev server running:
   ```bash
   npm run dev
   ```

### Test Steps

#### 1. Test Product Creation
1. Navigate to **Master Data** page
2. Click on **Products** tab
3. Verify loading spinner appears briefly
4. Click **Add Product** button
5. Fill in the form:
   - **Product Code**: `TEST001` (required)
   - **Product Name**: `Test Product` (required)
   - **Category**: Select from dropdown
   - **Concrete Grade**: Select from dropdown
   - **Specification**: `100x50x20 cm`
   - **Weight (kg)**: `150`
   - **Price (Rp)**: `250000`
   - **Unit**: `pcs`
6. Click **Save**
7. Verify:
   - ✅ Loading spinner appears on button
   - ✅ Success toast notification
   - ✅ Dialog closes automatically
   - ✅ Product appears in the list

#### 2. Test Material Creation
1. Navigate to **Materials** tab
2. Verify loading spinner appears briefly
3. Click **Add** button (Tambah)
4. Fill in the form:
   - **Material Code**: `MAT001` (required)
   - **Material Name**: `Test Cement` (required)
   - **Unit**: Select `kg`
   - **Category**: `Semen`
   - **Initial Stock**: `5000`
   - **Min Stock**: `1000`
   - **Price (Rp/unit)**: `1500`
5. Click **Save**
6. Verify:
   - ✅ Loading spinner appears on button
   - ✅ Success toast notification
   - ✅ Dialog closes automatically
   - ✅ Material appears in the list

#### 3. Test Validation
1. Try creating a product without required fields
2. Verify error toast appears: "Missing required fields"
3. Try creating duplicate product code
4. Verify backend validation error appears

#### 4. Test Browser Network Tab
1. Open Browser DevTools → Network tab
2. Filter by **XHR** or **Fetch**
3. Create a new product
4. Verify API calls:
   - ✅ `POST /api/products` with status 201
   - ✅ `GET /api/products` to reload list
   - ✅ Request includes CSRF token header
   - ✅ Response includes created product data

## Error Handling

### Frontend Error States
- ✅ Loading state during API calls
- ✅ Error toast on API failure
- ✅ Fallback to mock data if API fails
- ✅ Validation for required fields
- ✅ Disabled buttons during submission

### Backend Validation
- ✅ Unique constraint on product/material code
- ✅ Required field validation
- ✅ Data type validation (numeric, string, etc.)
- ✅ Maximum length validation
- ✅ Foreign key validation (supplier_id)

## Common Issues & Solutions

### Issue: 401 Unauthorized
**Cause**: User not logged in or session expired
**Solution**: 
- Check if user is logged in at `/login`
- Verify `auth` middleware in `routes/api.php`
- Check browser cookies for session

### Issue: 419 CSRF Token Mismatch
**Cause**: Missing or invalid CSRF token
**Solution**:
- Verify `<meta name="csrf-token">` exists in `app.blade.php`
- Check axios interceptor in `api.js` adds token to headers
- Clear browser cache and restart servers

### Issue: 422 Validation Error
**Cause**: Invalid data sent to backend
**Solution**:
- Check browser console for request payload
- Verify field names match backend expectations
- Check validation rules in controller

### Issue: 500 Internal Server Error
**Cause**: Backend error (database, code, etc.)
**Solution**:
- Check Laravel logs: `storage/logs/laravel.log`
- Run `php artisan migrate` to ensure database is up to date
- Verify database connection in `.env`

## Next Steps

### Immediate (High Priority)
1. ✅ **Complete FormDialog async support** - DONE
2. ✅ **Connect Products create handler** - DONE
3. ✅ **Connect Materials create handler** - DONE
4. ⏳ **Add Edit functionality** for Products & Materials
5. ⏳ **Add Delete functionality** with confirmation

### Short Term
6. ⏳ **Extend to other master data**: Customers, Suppliers, Work Centers
7. ⏳ **Add pagination controls** for large datasets
8. ⏳ **Implement advanced filters** (category, status, etc.)
9. ⏳ **Add bulk operations** (export, import CSV)

### Medium Term
10. ⏳ **Integrate BOM (Bill of Materials)** management
11. ⏳ **Connect Sales Orders** to real products
12. ⏳ **Implement Production Planning** with real data
13. ⏳ **Add dashboard statistics** from real production data

## API Helper Reference

### Usage Example
```javascript
import { productApi, materialApi } from '@/lib/api';

// Get all products (with pagination)
const response = await productApi.getAll({ per_page: 50, page: 2 });

// Get single product
const product = await productApi.getOne(1);

// Create product
const newProduct = await productApi.create({
  kode: 'P001',
  nama: 'Product Name',
  harga: 250000
});

// Update product
const updated = await productApi.update(1, { harga: 275000 });

// Delete product
await productApi.delete(1);
```

## Authentication Flow
1. User logs in via `/login` page
2. Laravel creates session and returns user data
3. React stores user in `AuthContext`
4. All API calls include:
   - Session cookies (automatically via `credentials: 'same-origin'`)
   - CSRF token in `X-CSRF-TOKEN` header
5. Laravel validates session via `auth` middleware
6. If unauthorized (401), redirect to login page

## Database Tables

### production_products
- `id` - Primary key
- `kode` - Unique product code
- `nama` - Product name
- `kategori`, `varian`, `spek` - Classification
- `grade` - Concrete grade (K-xxx)
- `berat`, `harga`, `satuan` - Measurements
- `standar` - Standard reference
- `aktif` - Active status
- `created_at`, `updated_at`, `deleted_at` - Timestamps

### production_materials
- `id` - Primary key
- `kode` - Unique material code
- `nama` - Material name
- `satuan` - Unit of measurement
- `kategori` - Material category
- `stok`, `min_stok` - Inventory levels
- `supplier_id` - Foreign key to suppliers
- `harga` - Unit price
- `lead_time_hari` - Lead time in days
- `aktif` - Active status
- `created_at`, `updated_at`, `deleted_at` - Timestamps

## Support
For issues or questions:
1. Check Laravel logs: `storage/logs/laravel.log`
2. Check browser console for frontend errors
3. Review this documentation
4. Check `SETUP_GUIDE.md` for environment setup
