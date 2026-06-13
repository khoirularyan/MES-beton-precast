<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Rbac;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────────
    // Session
    // ─────────────────────────────────────────────────────────────────────────

    public function session(Request $request): JsonResponse
    {
        $user = $request->user();

        // If an inactive user somehow still has a session, kill it
        if ($user && ! $user->is_active) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'user'        => null,
                'roles'       => self::loadRoles(),
                'permissions' => self::loadPermissions(),
            ]);
        }

        return response()->json([
            'user'        => $user ? $this->serializeUser($user) : null,
            'roles'       => self::loadRoles(),
            'permissions' => self::loadPermissions(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Login / Logout
    // ─────────────────────────────────────────────────────────────────────────

    /** @throws ValidationException */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // is_active check is embedded in credentials — inactive users cannot log in
        if (! Auth::attempt([...$credentials, 'is_active' => true], $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => 'The email or password is incorrect, or the account is inactive.',
            ]);
        }

        $request->session()->regenerate();

        return response()->json([
            'user'    => $this->serializeUser($request->user()),
            'message' => 'Login successful.',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logout successful.']);
    }

    /**
     * List all users for admin/user access management
     * This endpoint is used by the UserAccessManagement component
     */
    public function users(Request $request): JsonResponse
    {
        // Use Rbac permission check instead of hardcoded role list
        if (! Rbac::userCan($request->user(), 'user-access.manage')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = User::query();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'ilike', "%{$request->search}%")
                  ->orWhere('username', 'ilike', "%{$request->search}%")
                  ->orWhere('email', 'ilike', "%{$request->search}%");
            });
        }

        return response()->json([
            'data' => $query->orderBy('name')->get()->map(function ($u) {
                return [
                    'id'         => $u->id,
                    'name'       => $u->name,
                    'username'   => $u->username,
                    'email'      => $u->email,
                    'role'       => $u->role,
                    'role_label' => Rbac::labelFor($u->role ?? ''),
                    'plant'      => $u->plant,
                    'is_active'  => $u->is_active,
                ];
            })
        ]);
    }

    // Map DB module code → Rbac-compatible permission module prefix
    private const MODULE_CODE_TO_RBAC = [
        'dashboard'       => 'dashboard',
        'master_data'     => 'master-data',
        'master_bom'      => 'master-bom',
        'master_process'  => 'master-process',
        'sales_order'     => 'sales',
        'planning'        => 'planning',
        'batch'           => 'batch',
        'work_orders'     => 'work-orders',
        'production_exec' => 'production-execution',
        'curing'          => 'curing',
        'qc'              => 'qc',
        'inventory'       => 'inventory',
        'delivery'        => 'delivery',
        'reports'         => 'reports',
        'user_access'     => 'user-access',
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function serializeUser(User $user): array
    {
        return [
            'id'          => $user->id,
            'name'        => $user->name,
            'username'    => $user->username,
            'email'       => $user->email,
            'role'        => $user->role,
            'role_id'     => $user->role_id,
            'role_label'  => Rbac::labelFor($user->role ?? ''),
            'permissions' => $this->userPermissions($user),
            'plant'       => $user->plant,
            'is_active'   => $user->is_active,
            'updated_at'  => $user->updated_at?->toISOString(),
        ];
    }

    /** Load roles from DB, merge with hardcoded fallback. */
    private static function loadRoles(): array
    {
        try {
            $dbRoles = \App\Models\Role::orderBy('nama')->pluck('nama', 'kode')->toArray();
            // DB roles take precedence, hardcoded fills gaps
            return array_replace(Rbac::ROLES, $dbRoles);
        } catch (\Throwable) {
            return Rbac::ROLES;
        }
    }

    /** Load permissions from DB, merge with hardcoded fallback. */
    private static function loadPermissions(): array
    {
        try {
            $roles = \App\Models\Role::with('permissions.module')->where('is_active', true)->get();
            $result = [];

            foreach ($roles as $role) {
                $perms = [];
                foreach ($role->permissions as $p) {
                    $rbacPrefix = self::MODULE_CODE_TO_RBAC[$p->module->code] ?? $p->module->code;
                    if ($p->can_view)    $perms[] = "{$rbacPrefix}.view";
                    if ($p->can_create)  $perms[] = "{$rbacPrefix}.manage";
                    if ($p->can_approve) $perms[] = "{$rbacPrefix}.approve";
                }

                // Mark as full access if all modules have all flags
                $allModules = \App\Models\SystemModule::where('is_active', true)->count();
                $hasFull = $role->permissions->count() >= $allModules
                    && $role->permissions->every(fn ($p) =>
                        $p->can_view && $p->can_create && $p->can_update && $p->can_delete && $p->can_approve
                    );

                $result[$role->kode] = $hasFull ? ['*'] : array_values(array_unique($perms));
            }

            // Merge with hardcoded fallback
            foreach (Rbac::PERMISSIONS as $kode => $perms) {
                if (! isset($result[$kode])) {
                    $result[$kode] = $perms;
                }
            }

            return $result;
        } catch (\Throwable) {
            return Rbac::PERMISSIONS;
        }
    }

    /** Get effective permission strings for a user, DB-first. */
    private function userPermissions(User $user): array
    {
        // Try DB when role_id is set
        if ($user->role_id) {
            try {
                $perms = \App\Models\RolePermission::with('module')
                    ->where('role_id', $user->role_id)
                    ->get();

                if ($perms->isNotEmpty()) {
                    $allModules = \App\Models\SystemModule::where('is_active', true)->count();
                    $hasFull = $perms->count() >= $allModules
                        && $perms->every(fn ($p) =>
                            $p->can_view && $p->can_create && $p->can_update && $p->can_delete && $p->can_approve
                        );

                    if ($hasFull) {
                        return ['*'];
                    }

                    $result = [];
                    foreach ($perms as $p) {
                        $rbacPrefix = self::MODULE_CODE_TO_RBAC[$p->module->code] ?? $p->module->code;
                        if ($p->can_view)    $result[] = "{$rbacPrefix}.view";
                        if ($p->can_create || $p->can_update || $p->can_delete) $result[] = "{$rbacPrefix}.manage";
                        if ($p->can_approve) $result[] = "{$rbacPrefix}.approve";
                    }
                    return array_values(array_unique($result));
                }
            } catch (\Throwable) {
                // Fall through to hardcoded
            }
        }

        return Rbac::permissionsFor($user->role ?? '');
    }
}
