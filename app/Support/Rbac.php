<?php

namespace App\Support;

/**
 * Central RBAC Configuration
 *
 * Roles and their permission sets for the MES Beton Precast system.
 * No database table needed — role permissions are code-managed and version-controlled.
 *
 * Permission naming convention: {module}.{action}
 *   module  : dashboard, master-data, master-bom, sales, planning,
 *             batch, work-orders, qc, inventory, delivery, reports, user-access
 *   action  : view, manage, approve
 */
final class Rbac
{
    // ─────────────────────────────────────────────────────────────────────────
    // ROLE DEFINITIONS
    // ─────────────────────────────────────────────────────────────────────────

    public const ROLES = [
        'super_admin' => 'Super Admin',
        'admin'       => 'Admin',
        'manager'     => 'Manager',
        'ppic'        => 'PPIC',
        'production'  => 'Production',
        'qc'          => 'Quality Control',
        'warehouse'   => 'Warehouse',
        'sales'       => 'Sales',
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // PERMISSION MAP
    // ─────────────────────────────────────────────────────────────────────────

    public const PERMISSIONS = [
        // Full access — no restrictions
        'super_admin' => ['*'],

        // Admin — full operational access + user management
        'admin' => [
            'dashboard.view',
            'master-data.view',   'master-data.manage',
            'master-bom.view',    'master-bom.manage',
            'sales.view',         'sales.manage',     'sales.approve',
            'planning.view',      'planning.manage',
            'batch.view',         'batch.manage',
            'work-orders.view',   'work-orders.manage',
            'qc.view',            'qc.create',        'qc.update',        'qc.delete',        'qc.manage',        'qc.approve',
            'inventory.view',     'inventory.manage',
            'delivery.view',      'delivery.manage',  'delivery.approve',
            'reports.view',
            'user-access.manage',
        ],

        // Manager — read + approve, no user management
        'manager' => [
            'dashboard.view',
            'master-data.view',
            'master-bom.view',
            'sales.view',         'sales.approve',
            'planning.view',
            'batch.view',
            'work-orders.view',
            'qc.view',            'qc.approve',
            'inventory.view',
            'delivery.view',      'delivery.approve',
            'reports.view',
        ],

        // PPIC — production planning + inventory + master data management
        'ppic' => [
            'dashboard.view',
            'master-data.view',   'master-data.manage',
            'master-bom.view',    'master-bom.manage',
            'planning.view',      'planning.manage',
            'batch.view',         'batch.manage',
            'work-orders.view',
            'inventory.view',     'inventory.manage',
            'reports.view',
        ],

        // Production — execution focus, read planning/inventory
        'production' => [
            'dashboard.view',
            'master-data.view',
            'planning.view',
            'batch.view',         'batch.manage',
            'work-orders.view',   'work-orders.manage',
            'inventory.view',
        ],

        // QC — inspection and approval
        'qc' => [
            'dashboard.view',
            'master-data.view',
            'batch.view',
            'work-orders.view',
            'qc.view',            'qc.create',        'qc.update',        'qc.delete',        'qc.manage',        'qc.approve',
            'inventory.view',
            'reports.view',
        ],

        // Warehouse — inventory and delivery
        'warehouse' => [
            'dashboard.view',
            'master-data.view',
            'inventory.view',     'inventory.manage',
            'delivery.view',      'delivery.manage',
            'reports.view',
        ],

        // Sales — order creation and delivery tracking
        'sales' => [
            'dashboard.view',
            'master-data.view',
            'sales.view',         'sales.manage',
            'delivery.view',
            'reports.view',
        ],
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // HELPER: Map old permission string → [module_code, DB flag columns]
    // ─────────────────────────────────────────────────────────────────────────

    private const PERMISSION_MAP = [
        'dashboard.view'          => ['dashboard',       ['can_view']],
        'master-data.view'        => ['master_data',     ['can_view']],
        'master-data.manage'      => ['master_data',     ['can_create', 'can_update', 'can_delete']],
        'master-bom.view'         => ['master_bom',      ['can_view']],
        'master-bom.manage'       => ['master_bom',      ['can_create', 'can_update', 'can_delete']],
        'sales.view'              => ['sales_order',     ['can_view']],
        'sales.manage'            => ['sales_order',     ['can_create', 'can_update', 'can_delete']],
        'sales.approve'           => ['sales_order',     ['can_approve']],
        'planning.view'           => ['planning',        ['can_view']],
        'planning.manage'         => ['planning',        ['can_create', 'can_update', 'can_delete']],
        'batch.view'              => ['batch',           ['can_view']],
        'batch.manage'            => ['batch',           ['can_create', 'can_update', 'can_delete']],
        'work-orders.view'        => ['work_orders',     ['can_view']],
        'work-orders.manage'      => ['work_orders',     ['can_create', 'can_update', 'can_delete']],
        'qc.view'                 => ['qc',              ['can_view']],
        'qc.create'               => ['qc',              ['can_create']],
        'qc.update'               => ['qc',              ['can_update']],
        'qc.delete'               => ['qc',              ['can_delete']],
        'qc.manage'               => ['qc',              ['can_create', 'can_update', 'can_delete']],
        'qc.approve'              => ['qc',              ['can_approve']],
        'inventory.view'          => ['inventory',       ['can_view']],
        'inventory.manage'        => ['inventory',       ['can_create', 'can_update', 'can_delete']],
        'delivery.view'           => ['delivery',        ['can_view']],
        'delivery.manage'         => ['delivery',        ['can_create', 'can_update', 'can_delete']],
        'delivery.approve'        => ['delivery',        ['can_approve']],
        'reports.view'            => ['reports',         ['can_view']],
        'user-access.manage'      => ['user_access',     ['can_view', 'can_create', 'can_update', 'can_delete']],
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS (backward-compatible)
    // ─────────────────────────────────────────────────────────────────────────

    /** Returns the permissions array for a given role. Defaults to 'sales' (most restrictive). */
    public static function permissionsFor(string $role): array
    {
        return self::PERMISSIONS[$role] ?? self::PERMISSIONS['sales'];
    }

    /** Returns the human-readable label for a role. */
    public static function labelFor(string $role): string
    {
        return self::ROLES[$role] ?? ucfirst(str_replace('_', ' ', $role));
    }

    /** Returns all valid role keys. */
    public static function roleNames(): array
    {
        return array_keys(self::ROLES);
    }

    /**
     * Checks whether a user has a given permission.
     *
     * Looks up DB first (via role_id → user_role_permissions),
     * falls back to hardcoded Rbac::PERMISSIONS for backward compatibility.
     */
    public static function userCan(?object $user, string $permission): bool
    {
        if (! $user) {
            return false;
        }

        // ── 1. Try DB-based check ───────────────────────────────────────
        $map = self::PERMISSION_MAP[$permission] ?? null;
        if ($map && ! empty($user->role_id)) {
            [$moduleCode, $columns] = $map;
            $cached = self::dbCheck($user->role_id, $moduleCode, $columns);
            if ($cached !== null) {
                return $cached;
            }
        }

        // ── 2. Fallback to hardcoded permissions ─────────────────────────
        return self::hardcodedCheck($user, $permission);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTERNAL
    // ─────────────────────────────────────────────────────────────────────────

    /** Hardcoded permission check (original behavior). */
    private static function hardcodedCheck(object $user, string $permission): bool
    {
        $permissions = self::permissionsFor($user->role ?? '');

        return in_array('*', $permissions, true)
            || in_array($permission, $permissions, true);
    }

    /**
     * DB-based permission check with caching.
     * Returns null if the permission row doesn't exist yet (signaling fallback).
     */
    private static function dbCheck(int $roleId, string $moduleCode, array $columns): ?bool
    {
        static $cache = [];
        $key = "{$roleId}:{$moduleCode}";

        if (! array_key_exists($key, $cache)) {
            try {
                $module = \App\Models\SystemModule::where('code', $moduleCode)->first();
                if (! $module) {
                    $cache[$key] = null; // Module not in DB yet → fallback
                    return null;
                }

                $perm = \App\Models\RolePermission::where('role_id', $roleId)
                    ->where('module_id', $module->id)
                    ->first();

                if (! $perm) {
                    $cache[$key] = null; // No permission row → fallback
                    return null;
                }

                $cache[$key] = $perm;
            } catch (\Throwable) {
                $cache[$key] = null; // DB error → fallback
                return null;
            }
        }

        $perm = $cache[$key];
        if ($perm === null) return null;

        foreach ($columns as $col) {
            if (! empty($perm->$col)) {
                return true;
            }
        }

        return false;
    }
}
