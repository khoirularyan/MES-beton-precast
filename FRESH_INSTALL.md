# 🚀 MES Beton Precast - Fresh Installation Guide

**Complete setup instructions for first-time installation**

---

## 📋 Prerequisites

Ensure these are installed on your system:

### Required Software
- **PHP** ≥ 8.3 with extensions:
  - `pdo_pgsql` (PostgreSQL driver)
  - `mbstring`
  - `zip`
  - `fileinfo`
  - `openssl`
  - `tokenizer`
  - `xml`
  - `ctype`
  - `json`
  - `bcmath`

- **PostgreSQL** ≥ 14
- **Node.js** ≥ 20.x
- **npm** ≥ 10.x
- **Composer** ≥ 2.x

### Verify Installations
```cmd
php -v
php -m | findstr pdo_pgsql
psql --version
node -v
npm -v
composer -v
```

---

## 🗄️ Step 1: Database Setup

### 1.1 Create PostgreSQL Database
```cmd
psql -U postgres
```

In PostgreSQL shell:
```sql
CREATE DATABASE production;
\q
```

### 1.2 Test Connection
```cmd
psql -U postgres -d production -c "SELECT version();"
```

---

## ⚙️ Step 2: Environment Configuration

### 2.1 Configure `.env` File

The `.env` file is already configured. Verify these settings:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=production
DB_USERNAME=postgres
DB_PASSWORD=khoirul123
```

**⚠️ IMPORTANT:** If your PostgreSQL password is different, update `DB_PASSWORD`

### 2.2 Verify APP_KEY
Ensure `APP_KEY` exists in `.env`. If not, generate it:
```cmd
php artisan key:generate
```

---

## 📦 Step 3: Install Dependencies

### 3.1 Install PHP Dependencies
```cmd
composer install
```

**Expected output:** Vendor packages installed successfully

### 3.2 Install Node.js Dependencies
```cmd
npm install
```

**Expected output:** Node modules installed (may take 2-5 minutes)

---

## 🗃️ Step 4: Database Migration & Seeding

### 4.1 Run All Migrations
```cmd
php artisan migrate --force
```

**Expected output:** All 26 migrations should run successfully:
- ✅ 0001_01_01_000000_create_users_table
- ✅ 0001_01_01_000001_create_cache_table
- ✅ 0001_01_01_000002_create_jobs_table
- ✅ 2026_06_10_011305_create_customers_table
- ✅ 2026_06_10_011305_create_suppliers_table
- ✅ 2026_06_10_011306_create_products_table
- ✅ 2026_06_10_011307_create_materials_table
- ✅ 2026_06_10_011308_create_bom_headers_table
- ✅ 2026_06_10_011309_create_bom_items_table
- ✅ 2026_06_10_011329_create_production_lines_table
- ✅ 2026_06_10_011329_create_sales_orders_table
- ✅ 2026_06_10_011330_create_production_orders_table
- ✅ 2026_06_10_011331_create_work_orders_table
- ✅ 2026_06_10_011332_create_curing_batches_table
- ✅ 2026_06_10_011333_create_qc_inspections_table
- ✅ 2026_06_10_011334_create_inventory_table
- ✅ 2026_06_10_011335_create_delivery_orders_table
- ✅ 2026_06_10_100000_add_access_fields_to_users_table
- ✅ 2026_06_10_110000_prefix_existing_framework_tables
- ✅ 2026_06_10_200001_create_sales_order_items_table
- ✅ 2026_06_10_200002_create_work_centers_table
- ✅ 2026_06_10_200003_create_inventory_batches_table
- ✅ 2026_06_10_200004_create_stock_reservations_table
- ✅ 2026_06_10_200005_create_production_demands_table
- ✅ 2026_06_10_200006_create_production_plans_table
- ✅ 2026_06_10_200007_create_production_batches_table
- ✅ 2026_06_10_200008_create_production_costs_table

### 4.2 Verify Migration Status
```cmd
php artisan migrate:status
```

All migrations should show "Ran" status.

### 4.3 Seed Default Users
```cmd
php artisan db:seed
```

**Expected output:** 3 default users created:
1. **Super Admin**
   - Email: `super@admin`
   - Password: `super`
   - Role: Full system access

2. **QC User**
   - Email: `qc@qc`
   - Password: `12345`
   - Role: Quality Control workflows only

3. **Standard User**
   - Email: `user@user`
   - Password: `12345`
   - Role: Daily operations (no admin/QC)

---

## 🏗️ Step 5: Build Frontend Assets

### 5.1 Build Production Assets
```cmd
npm run build
```

**Expected output:**
```
✓ built in XXXXms
✓ XX modules transformed.
dist/manifest.json written
```

### 5.2 Verify Build Output
Check that `public/build` folder exists with:
- `manifest.json`
- `assets/*.js`
- `assets/*.css`

---

## 🚀 Step 6: Start Application

### Option A: Production Mode (Recommended for Testing)
```cmd
npm run dev:prod
```

This runs:
- ✅ Laravel server on `http://localhost:8000`
- ✅ Vite watch mode (auto-rebuild on changes)

### Option B: Development Mode (Full Dev Environment)
```cmd
npm run dev:all
```

This runs:
- ✅ Laravel server on `http://localhost:8000`
- ✅ Vite dev server (hot module replacement)

### Option C: Manual Start (Simple)
Open **2 separate terminals**:

**Terminal 1 - Laravel:**
```cmd
php artisan serve
```

**Terminal 2 - Vite Build Watch:**
```cmd
npm run watch
```

---

## ✅ Step 7: Verify Installation

### 7.1 Access Application
Open browser: **http://localhost:8000**

### 7.2 Test Login
Try logging in with any of the seeded users:

**Super Admin:**
- Email: `super@admin`
- Password: `super`

**QC User:**
- Email: `qc@qc`
- Password: `12345`

**Standard User:**
- Email: `user@user`
- Password: `12345`

### 7.3 Check Permissions
After login, verify:
- ✅ Super Admin sees all menu items
- ✅ QC User sees Quality Control menu
- ✅ Standard User sees limited operations menu

---

## 🔍 Troubleshooting

### Issue: "Connection refused" to PostgreSQL

**Solution:**
1. Verify PostgreSQL is running:
   ```cmd
   psql -U postgres -d production -c "SELECT 1;"
   ```

2. Check `.env` database credentials match your PostgreSQL setup

3. Restart PostgreSQL service if needed

### Issue: "Class not found" errors

**Solution:**
```cmd
composer dump-autoload
php artisan clear-compiled
php artisan optimize:clear
```

### Issue: Blank page after login

**Solution:**
1. Check Vite is running:
   ```cmd
   npm run dev
   ```

2. Clear browser cache and hard reload (Ctrl+Shift+R)

3. Verify `public/build/manifest.json` exists

### Issue: "npm install" fails

**Solution:**
```cmd
# Clear npm cache
npm cache clean --force

# Remove node_modules
rmdir /s /q node_modules

# Reinstall
npm install
```

### Issue: Migration fails

**Solution:**
```cmd
# Reset and re-run migrations
php artisan migrate:fresh --seed
```

---

## 📊 Database Tables Overview

After successful migration, you should have:

### Framework Tables (7)
- `production_users` - User accounts and authentication
- `production_password_reset_tokens` - Password reset functionality
- `production_sessions` - User sessions
- `production_cache` / `production_cache_locks` - Caching system
- `production_jobs` / `production_failed_jobs` - Queue system
- `production_migrations` - Migration history

### Master Data Tables (9)
- `customers` - Customer information
- `suppliers` - Supplier information
- `products` - Finished goods catalog
- `materials` - Raw materials catalog
- `bom_headers` / `bom_items` - Bill of Materials
- `production_lines` - Production line resources
- `work_centers` - Work center definitions
- `inventory` - Inventory records

### Transaction Tables (8)
- `sales_orders` / `sales_order_items` - Sales order management
- `production_orders` - Production order headers
- `work_orders` - Work order details
- `production_batches` - Batch production tracking
- `curing_batches` - Curing process tracking
- `qc_inspections` - Quality inspections
- `delivery_orders` - Delivery management

### Planning & Inventory Tables (6)
- `production_demands` - Production demand planning
- `production_plans` - Production planning
- `production_costs` - Cost tracking
- `inventory_batches` - Batch-level inventory
- `stock_reservations` - Stock allocation

---

## 🎯 Next Steps

### 1. Configure Master Data
- Navigate to **Master Data** menu
- Add:
  - Products (concrete precast items)
  - Materials (cement, aggregate, steel, etc.)
  - Customers and Suppliers
  - Production Lines and Work Centers

### 2. Set Up BOM
- Navigate to **Master BOM** menu
- Define Bill of Materials for each product
- Configure material consumption ratios

### 3. Create Sales Orders
- Navigate to **Sales Orders** menu
- Create test sales orders
- Link to customers and products

### 4. Production Planning
- Navigate to **Production Planning** menu
- Generate production plans based on sales orders
- Review material requirements

### 5. Execute Production
- Navigate to **Production Execution** menu
- Create work orders from production plans
- Track batch progress through stages

---

## 📝 Development Workflow

### For Daily Development:
```cmd
# Start both Laravel and Vite in watch mode
npm run dev:prod
```

### For Production Deployment:
```cmd
# Build optimized assets
npm run build

# Start Laravel server only
php artisan serve
```

### For Testing:
```cmd
# Run PHP tests
php artisan test

# Run type checking
npm run build
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change default user passwords
- [ ] Update `APP_KEY` for production
- [ ] Set `APP_DEBUG=false` in `.env`
- [ ] Configure proper `APP_URL`
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable PostgreSQL authentication
- [ ] Configure proper file permissions
- [ ] Set up monitoring and logging

---

## 📞 Support

For issues or questions:
1. Check **SETUP_GUIDE.md** for detailed documentation
2. Review **CHANGELOG.md** for recent changes
3. Check browser console for frontend errors
4. Check `storage/logs/laravel.log` for backend errors

---

## 📦 System Requirements Summary

| Component | Requirement | Status |
|-----------|-------------|--------|
| PHP | ≥ 8.3 | ✅ Configured |
| PostgreSQL | ≥ 14 | ✅ Connected |
| Node.js | ≥ 20.x | ✅ Installed |
| Composer | ≥ 2.x | ✅ Installed |
| Migrations | 26 tables | ✅ Complete |
| Seeders | 3 users | ✅ Seeded |
| Frontend Build | React + Vite | ✅ Built |

---

**Installation Status:** ✅ **READY TO RUN**

The system is fully configured and ready for first-time use. Follow Step 6 to start the application.
