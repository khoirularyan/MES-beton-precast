# User Access Management Customization Specification

## Current Status ✅

**Fixed Issue:**
- ✅ `/auth/users` endpoint created in AuthController
- ✅ User count now displays correctly (showing 9 total users, 7 active)
- ✅ Frontend UserAccessManagement component can fetch user list

**Current RBAC System:**
- Fixed 8 roles: `super_admin`, `admin`, `ppic`, `sales`, `production`, `qc`, `warehouse`, `manager`
- Permissions hardcoded in `App\Support\Rbac` class
- Per-role module access defined in RBAC::PERMISSIONS constant

---

## Phase 2: Custom Role & Permission Management

### Goal
Allow admins to customize which modules each role can access, without changing code.

### Implementation Plan

#### 1. Database Schema Enhancement

**New Tables:**

```sql
-- Custom role management (extends hardcoded roles)
CREATE TABLE global.user_roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    kode VARCHAR(30) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    is_custom BOOLEAN DEFAULT true,  -- false for system roles
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Custom role permissions (defines module access per role)
CREATE TABLE global.user_role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT NOT NULL FOREIGN KEY -> user_roles(id),
    permission VARCHAR(100) NOT NULL,  -- "dashboard.view", "master-data.manage", etc.
    created_at TIMESTAMP
);

-- Track user role assignments (support multiple roles per user)
CREATE TABLE global.user_role_assignments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL FOREIGN KEY -> production_users(id),
    role_id BIGINT NOT NULL FOREIGN KEY -> user_roles(id),
    assigned_by_id BIGINT NOT NULL FOREIGN KEY -> production_users(id),  -- who assigned it
    assigned_at TIMESTAMP,
    created_at TIMESTAMP,
    deleted_at TIMESTAMP -- soft delete to track history
);
```

#### 2. Models

**UserRole Model:**
```php
class UserRole extends Model
{
    public function permissions(): HasMany
    {
        return $this->hasMany(UserRolePermission::class, 'role_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'global.user_role_assignments');
    }
}
```

**UserRolePermission Model:**
```php
class UserRolePermission extends Model
{
    public $timestamps = false;
    
    public function role(): BelongsTo
    {
        return $this->belongsTo(UserRole::class);
    }
}
```

#### 3. API Endpoints

**Role Management:**
```
GET    /api/user-roles              -- List all roles (admin only)
POST   /api/user-roles              -- Create custom role (admin only)
PATCH  /api/user-roles/{roleId}     -- Update role (admin only)
DELETE /api/user-roles/{roleId}     -- Delete role (admin only)

GET    /api/user-roles/{roleId}/permissions    -- Get role permissions
POST   /api/user-roles/{roleId}/permissions    -- Bulk set permissions (admin only)
DELETE /api/user-roles/{roleId}/permissions/:permission -- Remove permission (admin only)
```

**User Role Assignment:**
```
GET    /api/users/{userId}/roles              -- Get user's roles
POST   /api/users/{userId}/roles              -- Assign role to user (admin only)
DELETE /api/users/{userId}/roles/{roleId}     -- Remove role from user (admin only)
```

#### 4. Frontend UI Components

**Component 1: Role Matrix Editor**
```jsx
<RolePermissionMatrix>
├─ List of all roles (system + custom)
├─ For each role:
│  ├─ Role name & description
│  ├─ Checklist of module permissions
│  │  ├─ Dashboard
│  │  ├─ Master Data
│  │  ├─ Sales Order
│  │  ├─ Production Planning
│  │  ├─ Work Orders
│  │  ├─ Production Execution
│  │  ├─ Curing
│  │  ├─ Quality Control
│  │  ├─ Inventory
│  │  ├─ Delivery
│  │  ├─ Reports
│  │  └─ User Access Management
│  ├─ Save button
│  └─ [If custom] Delete button
└─ Create New Role button
```

**Component 2: User Role Assignment**
```jsx
<UserRoleAssignment user={user}>
├─ Current roles (multi-select / chips)
├─ Available roles (dropdown/modal)
├─ Who assigned it (display name + timestamp)
├─ Save button
└─ [For each role] Remove button
```

**Component 3: Permission Viewer (User Details)**
```jsx
<UserPermissionViewer user={user}>
├─ User name & email
├─ Assigned roles
├─ Effective permissions (combined from all roles)
├─ Module access matrix
└─ Last modified info
```

#### 5. Workflow Examples

**Example 1: QC Manager Gets More Access**

Current state:
- QC role: `qc.view`, `qc.manage`, `qc.approve`

Admin action:
- Go to Role Matrix
- Select QC role
- Add: `master-data.view`, `batch.view`, `inventory.view`
- Save

Result:
- All QC users (via role) get these new permissions
- Or: Specific QC user assigned custom "QC Manager" role with extended permissions

**Example 2: New Custom Role - "Shift Supervisor"**

Admin action:
1. Click "Create New Role"
2. Name: "Shift Supervisor", Description: "Oversees production shifts"
3. Select permissions:
   - dashboard.view ✓
   - master-data.view ✓
   - batch.view ✓
   - batch.manage ✓
   - work-orders.view ✓
   - qc.view ✓
4. Save role
5. Go to Users, assign this role to: production, operator-1, operator-2

---

## Phase 3: Modifications to Existing Systems

### RBAC Class Changes

**Current:** Hardcoded in `App/Support/Rbac.php`

**New:** Check database first, fall back to hardcoded

```php
class Rbac
{
    // ... existing code ...

    public static function permissionsFor(string $role): array
    {
        // Try database first
        $dbRole = UserRole::where('kode', $role)->first();
        if ($dbRole) {
            return $dbRole->permissions->pluck('permission')->toArray();
        }

        // Fall back to hardcoded
        return self::PERMISSIONS[$role] ?? [];
    }

    public static function allRoles(): array
    {
        // Combine system + custom roles
        $systemRoles = collect(self::ROLES);
        $customRoles = UserRole::where('is_active', true)->get();
        
        return $systemRoles->merge(
            $customRoles->mapWithKeys(fn ($r) => [$r->kode => $r->nama])
        )->toArray();
    }
}
```

### User Model Changes

Add relationship:
```php
class User extends Model
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            UserRole::class,
            'global.user_role_assignments'
        );
    }

    // Get combined permissions from all roles
    public function getPermissions(): array
    {
        return $this->roles()
            ->with('permissions')
            ->get()
            ->flatMap(fn ($role) => $role->permissions->pluck('permission'))
            ->unique()
            ->toArray();
    }
}
```

### Middleware Changes

Update `EnsurePermission` middleware:
```php
class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        // Check hardcoded permissions (legacy)
        $hardcodedPermissions = Rbac::permissionsFor($user->role);
        
        // Check database permissions (custom roles)
        $customPermissions = $user->getPermissions();

        if (!in_array($permission, [...$hardcodedPermissions, ...$customPermissions])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $next($request);
    }
}
```

---

## Implementation Priority

### Phase 1 (DONE ✅)
- [x] Fix `/auth/users` endpoint
- [x] Display correct user count

### Phase 2 (NEXT - UI/UX)
- [ ] Create database migrations for role management
- [ ] Create UserRole & UserRolePermission models
- [ ] Create API endpoints for role management
- [ ] Update RBAC permission check to use database
- [ ] Create frontend components (Role Matrix, User Assignment)

### Phase 3 (FINAL - Polish)
- [ ] Update User model with role relationships
- [ ] Update middleware to check custom permissions
- [ ] Add role history/audit log
- [ ] Add role templates (common configurations)
- [ ] Add permission descriptions & help text

---

## User Stories

### US-1: Admin Customizes QC Role Permissions
**As** Super Admin  
**I want to** add additional module access to the QC role  
**So that** QC staff can access inventory management

**Acceptance Criteria:**
- [ ] Navigate to Role Matrix
- [ ] Select QC role
- [ ] Check "Inventory" module
- [ ] Save changes
- [ ] QC users now have `inventory.view` permission

### US-2: Create Custom "Line Manager" Role
**As** Super Admin  
**I want to** create a new role with specific permissions  
**So that** production line managers have appropriate access

**Acceptance Criteria:**
- [ ] Click "Create New Role"
- [ ] Enter name & description
- [ ] Select permissions from checklist
- [ ] Save role
- [ ] Role appears in role list

### US-3: Assign Multiple Roles to User
**As** Super Admin  
**I want to** assign multiple roles to a single user  
**So that** Shift supervisors have both production + QC access

**Acceptance Criteria:**
- [ ] Open user detail
- [ ] See current roles
- [ ] Add additional role from dropdown
- [ ] User now has combined permissions
- [ ] Can remove individual roles

### US-4: View User's Effective Permissions
**As** Super Admin  
**I want to** see all permissions a user has  
**So that** I can verify access levels are correct

**Acceptance Criteria:**
- [ ] Open user detail
- [ ] See "Effective Permissions" section
- [ ] Shows all permissions from all assigned roles
- [ ] Shows which role granted each permission

---

## Technical Notes

- Permission checks use **whitelist** (only granted permissions work)
- Roles can be **system** (hardcoded) or **custom** (database)
- Custom roles **cannot conflict** with system role names
- Permission changes apply **immediately** (no login required)
- All role changes are **audited** (track who changed what when)
- **Soft delete** on role assignments for history tracking

