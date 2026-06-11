# Master Data Integration - Testing Checklist

## 🚀 Pre-Testing Setup

### 1. Start Servers
```bash
# Terminal 1 - Laravel Backend
cd c:\expressa-app\MES-beton-precast
php artisan serve
# Should start at: http://localhost:8000

# Terminal 2 - Vite Frontend
cd c:\expressa-app\MES-beton-precast
npm run dev
# Should start at: http://localhost:5173
```

### 2. Verify Database
```bash
# Check database connection
php artisan migrate:status

# If needed, run migrations
php artisan migrate

# Seed default users if not already done
php artisan db:seed
```

### 3. Login Credentials
- **Super Admin**: `super@admin` / `super`
- **QC User**: `qc@qc` / `12345`
- **Regular User**: `user@user` / `12345`

---

## ✅ PRODUCTS MODULE TESTING

### Test 1: View Products List
- [ ] Navigate to **Master Data** page
- [ ] Click **Products** tab
- [ ] Verify loading spinner appears briefly
- [ ] Verify products list loads (may be empty or show mock data)
- [ ] Verify search box is present
- [ ] Verify "Add Product" button is visible

**Expected**: Products list displays without errors

---

### Test 2: Create New Product (Grid View)
- [ ] Ensure you're on **Products** tab
- [ ] Click **Add Product** button
- [ ] Dialog opens with form fields
- [ ] Fill in ALL required fields:
  ```
  Product Code: P-TEST-001
  Product Name: Test Precast Panel
  Category: Panel (select from dropdown)
  Concrete Grade: K-300 (select from dropdown)
  Specification: 200x100x30 cm
  Weight (kg): 450
  Price (Rp): 850000
  Unit: pcs
  ```
- [ ] Click **Save** button
- [ ] Button shows "Saving..." with spinner
- [ ] Success toast notification appears
- [ ] Dialog closes automatically
- [ ] New product appears in the grid

**Expected**: Product created successfully and visible in list

---

### Test 3: Create Product - Validation Test
- [ ] Click **Add Product** button again
- [ ] Leave **Product Code** empty (required field)
- [ ] Fill in **Product Name**: "Test Product 2"
- [ ] Click **Save**
- [ ] Error toast appears: "Missing required fields"
- [ ] Dialog stays open
- [ ] Fill in **Product Code**: "P-TEST-002"
- [ ] Click **Save** again
- [ ] Product created successfully

**Expected**: Validation prevents empty required fields

---

### Test 4: Edit Product
- [ ] Find "P-TEST-001" in the products list
- [ ] Switch to **Table** view (click Table button)
- [ ] Find the **Edit** button (pencil icon) in the Actions column
- [ ] Click the **Edit** button
- [ ] Dialog opens with pre-filled values
- [ ] Change **Price** to: `900000`
- [ ] Change **Weight** to: `500`
- [ ] Click **Update** button
- [ ] Button shows "Saving..." with spinner
- [ ] Success toast: "Product updated successfully"
- [ ] Dialog closes
- [ ] Verify updated values in table

**Expected**: Product updates successfully with new values

---

### Test 5: Delete Product
- [ ] Find "P-TEST-001" in the products list
- [ ] Click the **Delete** button (trash icon) in Actions column
- [ ] Browser confirmation dialog appears
- [ ] Click **OK** to confirm
- [ ] Success toast: "Product deleted successfully"
- [ ] Product disappears from list

**Expected**: Product deleted successfully (soft delete in database)

---

### Test 6: Search Products
- [ ] Create 2-3 test products with different names
- [ ] Type partial product name in search box
- [ ] Verify filtered results appear
- [ ] Clear search box
- [ ] Verify all products appear again

**Expected**: Search filters products correctly

---

### Test 7: Switch Views (Grid ↔ Table)
- [ ] Click **Grid** button
- [ ] Verify products shown in card/grid layout
- [ ] Click **Table** button (Tabel)
- [ ] Verify products shown in table layout
- [ ] Verify both views show same data

**Expected**: View toggle works without data loss

---

## ✅ MATERIALS MODULE TESTING

### Test 8: View Materials List
- [ ] Click **Materials** tab
- [ ] Verify loading spinner appears briefly
- [ ] Verify materials list loads
- [ ] Verify table headers: Code, Name, Unit, Stock, Min Stock, Price, Actions
- [ ] Verify "Tambah" (Add) button is visible

**Expected**: Materials list displays without errors

---

### Test 9: Create New Material
- [ ] Click **Tambah** (Add) button
- [ ] Dialog opens with form fields
- [ ] Fill in ALL required fields:
  ```
  Material Code: M-TEST-001
  Material Name: Test Portland Cement Type II
  Unit: kg (select from dropdown)
  Category: Semen
  Initial Stock: 5000
  Min Stock: 1000
  Price (Rp/unit): 1800
  ```
- [ ] Click **Save** button
- [ ] Button shows "Saving..." with spinner
- [ ] Success toast notification appears
- [ ] Dialog closes automatically
- [ ] New material appears in the table

**Expected**: Material created successfully and visible in list

---

### Test 10: Edit Material
- [ ] Find "M-TEST-001" in materials list
- [ ] Click the **Edit** button (pencil icon)
- [ ] Dialog opens with pre-filled values
- [ ] Change **Initial Stock** to: `6000`
- [ ] Change **Price** to: `1900`
- [ ] Click **Update** button
- [ ] Success toast: "Material updated successfully"
- [ ] Dialog closes
- [ ] Verify updated stock and price in table

**Expected**: Material updates successfully

---

### Test 11: Delete Material
- [ ] Find "M-TEST-001" in materials list
- [ ] Click the **Delete** button (trash icon)
- [ ] Confirmation dialog appears
- [ ] Click **OK** to confirm
- [ ] Success toast: "Material deleted successfully"
- [ ] Material disappears from list

**Expected**: Material deleted successfully

---

### Test 12: Create Material - Duplicate Code
- [ ] Create a material with code: "M-CEMENT-01"
- [ ] Try creating another material with same code
- [ ] Backend validation error should appear
- [ ] Error toast shows validation message

**Expected**: Duplicate code prevented by backend validation

---

## 🔍 BROWSER DEVTOOLS TESTING

### Test 13: Verify API Calls
- [ ] Open Browser DevTools (F12)
- [ ] Go to **Network** tab
- [ ] Filter by **Fetch/XHR**
- [ ] Create a new product
- [ ] Verify API calls appear:
  - [ ] `POST /api/products` with status **201 Created**
  - [ ] `GET /api/products` to reload list
- [ ] Click on the POST request
- [ ] Check **Headers** tab:
  - [ ] Verify `X-CSRF-TOKEN` header is present
  - [ ] Verify `Content-Type: application/json`
- [ ] Check **Payload** tab:
  - [ ] Verify JSON data sent (kode, nama, etc.)
- [ ] Check **Response** tab:
  - [ ] Verify returned product data includes `id`

**Expected**: All API calls succeed with correct headers and data

---

### Test 14: Verify Console (No Errors)
- [ ] Open Browser DevTools (F12)
- [ ] Go to **Console** tab
- [ ] Clear console
- [ ] Navigate to Master Data page
- [ ] Perform CRUD operations (create, edit, delete)
- [ ] Verify NO red errors appear in console
- [ ] Info/log messages are OK

**Expected**: No JavaScript errors in console

---

## ⚠️ ERROR HANDLING TESTING

### Test 15: Network Error (Backend Down)
- [ ] Stop Laravel server (`Ctrl+C` in Terminal 1)
- [ ] Try creating a new product
- [ ] Verify error toast appears
- [ ] Check error message is user-friendly
- [ ] Restart Laravel server
- [ ] Verify operations work again

**Expected**: Graceful error handling when backend is down

---

### Test 16: Session Timeout (401 Unauthorized)
- [ ] Clear browser cookies
- [ ] Try creating a product
- [ ] Should redirect to **Login** page
- [ ] Login again
- [ ] Operations should work

**Expected**: Redirect to login on session expiration

---

### Test 17: CSRF Token Validation
- [ ] Open DevTools → Application → Cookies
- [ ] Find XSRF-TOKEN cookie
- [ ] Delete the cookie
- [ ] Try creating a product
- [ ] Should get CSRF error
- [ ] Refresh page (token regenerated)
- [ ] Operations should work

**Expected**: CSRF token validation working

---

## 📊 DATA VERIFICATION (Database)

### Test 18: Verify Database Records
```bash
# Connect to PostgreSQL
psql -U postgres -d mes_beton_precast

# Check products table
SELECT id, kode, nama, harga, created_at FROM production_products ORDER BY created_at DESC LIMIT 5;

# Check materials table
SELECT id, kode, nama, stok, harga, created_at FROM production_materials ORDER BY created_at DESC LIMIT 5;

# Verify soft deletes (deleted_at should be set)
SELECT id, kode, nama, deleted_at FROM production_products WHERE deleted_at IS NOT NULL;
```

**Expected**: Database records match UI operations

---

## 🎯 PERFORMANCE TESTING

### Test 19: Loading Speed
- [ ] Time how long products list takes to load
- [ ] Time how long materials list takes to load
- [ ] Verify spinners appear during loading
- [ ] Verify UI doesn't freeze

**Expected**: Loading completes within 1-2 seconds

---

### Test 20: Multiple Operations
- [ ] Create 3 products in a row
- [ ] Edit 2 of them
- [ ] Delete 1 of them
- [ ] Verify all operations complete successfully
- [ ] Verify list updates correctly after each operation

**Expected**: No race conditions or state issues

---

## 📝 FINAL VERIFICATION

### Summary Checklist
- [ ] All Products CRUD operations work
- [ ] All Materials CRUD operations work
- [ ] Validation prevents invalid data
- [ ] Error handling works gracefully
- [ ] No console errors
- [ ] API calls succeed with correct headers
- [ ] Database records correct
- [ ] UI updates reflect backend changes
- [ ] Loading states and toasts work
- [ ] Delete confirmations appear

---

## 🐛 BUG REPORT TEMPLATE

If you find any issues, document them like this:

```
**Bug**: [Short description]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected**: [What should happen]
**Actual**: [What actually happens]
**Console Error**: [Any error messages]
**Browser**: [Chrome/Firefox/Edge]
**Screenshot**: [If applicable]
```

---

## ✅ Testing Complete

Once all tests pass, you can proceed to:
1. Integrate other master data modules (Customers, Suppliers)
2. Connect Sales Orders to Products
3. Implement Production Planning
4. Add dashboard statistics

**Remember**: Test in different browsers (Chrome, Firefox, Edge) for compatibility!
