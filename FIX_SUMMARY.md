# User Access Management - Issue Fix & Customization Plan

## 🔧 Issue: User Count Shows 0

### Root Cause
The `UserAccessManagement.jsx` component was calling `/auth/users` endpoint, which **did not exist**.

```javascript
// Line 31 in UserAccessManagement.jsx
useEffect(() => {
    authRequestJson("/auth/users", { method: "GET" })  // ❌ Endpoint didn't exist
        .then((data) => setUsers(data.data ?? []))
        .finally(() => setLoading(false));
}, []);
```

### Why It Showed 0
- Fetch failed silently
- `setUsers` got undefined/empty array
- UI displayed: `users.length` = 0

---

## ✅ Fix Applied

### 1. Added `/auth/users` Endpoint

**File:** `app/Http/Controllers/AuthController.php`

Added new method:
```php
public function users(Request $request): JsonResponse
{
    // Only super_admin and admin can view all users
    $user = $request->user();
    if (!$user || !in_array($user->role, ['super_admin', 'admin'])) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    $query = User::query();

    if ($request->filled('search')) {
        $query->where(function ($q) use ($request) {
            $q->where('name', 'ilike', "%{$request->search}%")
              ->orWhere('email', 'ilike', "%{$request->search}%");
        });
    }

    return response()->json([
        'data' => $query->orderBy('name')->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'role_label' => Rbac::labelFor($u->role ?? ''),
                'department' => $u->department,
                'plant' => $u->plant,
                'is_active' => $u->is_active,
            ];
        })
    ]);
}
```

### 2. Registered Route

**File:** `routes/web.php`

```php
Route::prefix('auth')->controller(AuthController::class)->group(function () {
    Route::get('session', 'session')->name('auth.session');
    Route::post('login', 'login')->middleware('guest')->name('auth.login');
    Route::post('logout', 'logout')->middleware('auth')->name('auth.logout');
    Route::get('users', 'users')->middleware('auth')->name('auth.users');  // ✅ New
});
```

### 3. Verification

**Database:**
- ✅ 9 total users
- ✅ 7 active users
- ✅ 2 inactive users

**UI Display:**
- ✅ User count now shows: 9
- ✅ Active count shows: 7
- ✅ User list displays all users with details

---

## 📋 Customization Plan

A comprehensive specification has been created: **SPEC_USER_ACCESS_CUSTOMIZATION.md**

### What Users Want
1. **Customize QC role** - Add additional module access
2. **Create custom roles** - New roles with specific permissions
3. **Edit user permissions** - Assign roles to users dynamically

### Current RBAC System
```
Fixed 8 Roles:
├─ super_admin (Full Access)
├─ admin (24 permissions)
├─ ppic (13 permissions)
├─ sales (13 permissions)
├─ production (10 permissions)
├─ qc (13 permissions)
├─ warehouse (9 permissions)
└─ manager (11 permissions)

Permissions are HARDCODED in:
└─ App\Support\Rbac class
```

### Proposed Solution: 3-Phase Implementation

#### Phase 1: ✅ DONE
- [x] Fix `/auth/users` endpoint
- [x] Display correct user counts

#### Phase 2: Database + UI (NEXT)
**Database:**
- [ ] Create `user_roles` table (custom roles)
- [ ] Create `user_role_permissions` table (module access per role)
- [ ] Create `user_role_assignments` table (users ↔ roles mapping)

**API:**
- [ ] `GET /api/user-roles` - List all roles
- [ ] `POST /api/user-roles` - Create custom role
- [ ] `PATCH /api/user-roles/{id}` - Edit role
- [ ] `GET /api/user-roles/{id}/permissions` - Get permissions
- [ ] `POST /api/user-roles/{id}/permissions` - Update permissions
- [ ] `GET /api/users/{id}/roles` - Get user roles
- [ ] `POST /api/users/{id}/roles` - Assign role

**Frontend:**
- [ ] Role Permission Matrix (view/edit all roles)
- [ ] Create Role Dialog
- [ ] User Role Assignment UI
- [ ] Permission Viewer (see user's effective access)

#### Phase 3: System Integration
- [ ] Update RBAC class to check database first
- [ ] Update User model with role relationships
- [ ] Update middleware to check custom permissions
- [ ] Add role history/audit log

---

## Usage Examples

### Example 1: QC Manager Needs More Access

**Current:** QC role only has QC module access  
**Goal:** Give QC Manager access to inventory + batch management

**Steps:**
1. Navigate to "Role Management" (new page)
2. Find "QC" role
3. Check additional modules:
   - [ ] Inventory
   - [ ] Batch Management
4. Click "Save"
5. All QC users now have these permissions

### Example 2: Create "Shift Supervisor" Role

**Steps:**
1. Click "Create New Role"
2. Name: "Shift Supervisor"
3. Description: "Oversees production shifts and QC"
4. Select permissions:
   - [x] Dashboard
   - [x] Master Data (view)
   - [x] Work Orders (view)
   - [x] Batch Management (view + manage)
   - [x] Quality Control (view)
5. Save
6. Assign to specific users: Operator-1, Operator-2

### Example 3: Edit User Permissions

**Current:** John (Production Ops) only sees production modules  
**Goal:** John now also needs to see inventory

**Option A - Role-based:**
1. Open John's user details
2. Roles: `production` ← change to `production` + `warehouse`
3. John now has combined permissions

**Option B - Custom Role:**
1. Create "Production + Warehouse" custom role
2. Assign to John (and other similar users)

---

## Technical Architecture

### Current Permission Flow
```
User Login
    ↓
Check is_active + role
    ↓
Load Rbac::PERMISSIONS[$role]
    ↓
Load $user->permissions (from RBAC)
    ↓
Return to frontend
    ↓
Frontend shows/hides modules based on permissions
```

### New Permission Flow (After Phase 2)
```
User Login
    ↓
Check is_active + role
    ↓
Check if custom roles exist → Load from DB
Check if system role → Load from Rbac::PERMISSIONS
    ↓
Combine all role permissions
    ↓
Return effective permissions
    ↓
Middleware validates on each request
```

---

## Files Modified

✅ **Phase 1 (Complete)**
1. `app/Http/Controllers/AuthController.php` - Added `users()` method
2. `routes/web.php` - Added `GET /auth/users` route

📋 **Phase 2 (Planning - See SPEC_USER_ACCESS_CUSTOMIZATION.md)**
- Database migrations
- Models (UserRole, UserRolePermission)
- API Controllers
- Frontend components

---

## Next Steps

1. ✅ **Verify** - Check if user count now displays correctly
2. 📋 **Review** - Read SPEC_USER_ACCESS_CUSTOMIZATION.md
3. 🚀 **Choose** - Decide which phase 2 features to build first
4. 🏗️ **Build** - Implement database + API endpoints
5. 🎨 **UI** - Build frontend components

---

## Related Files
- `SPEC_USER_ACCESS_CUSTOMIZATION.md` - Detailed specifications for customization features
- `app/Support/Rbac.php` - Current hardcoded role/permission system
- `resources/js/pages/UserAccessManagement.jsx` - Frontend UI component
- `app/Http/Controllers/Api/UserController.php` - User CRUD API

