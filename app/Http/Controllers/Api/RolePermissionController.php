<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\RolePermission;
use App\Models\SystemModule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RolePermissionController extends Controller
{
    /**
     * Get the full permission matrix for a role.
     * Returns all modules with their permission flags for the given role.
     */
    public function show(Role $role): JsonResponse
    {
        $modules = SystemModule::where('is_active', true)->orderBy('name')->get();

        $permissions = RolePermission::where('role_id', $role->id)->get()->keyBy('module_id');

        $matrix = $modules->map(function ($module) use ($permissions) {
            $perm = $permissions->get($module->id);
            return [
                'module_id'   => $module->id,
                'module_code' => $module->code,
                'module_name' => $module->name,
                'can_view'    => (bool) ($perm->can_view    ?? false),
                'can_create'  => (bool) ($perm->can_create  ?? false),
                'can_update'  => (bool) ($perm->can_update  ?? false),
                'can_delete'  => (bool) ($perm->can_delete  ?? false),
                'can_approve' => (bool) ($perm->can_approve ?? false),
            ];
        });

        return response()->json([
            'role'    => $role,
            'modules' => $matrix,
        ]);
    }

    /**
     * Bulk-update the permission matrix for a role.
     * Expects: { permissions: [ { module_id, can_view, can_create, can_update, can_delete, can_approve }, ... ] }
     */
    public function update(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'permissions'               => 'required|array',
            'permissions.*.module_id'   => 'required|integer|exists:system_modules,id',
            'permissions.*.can_view'    => 'nullable|boolean',
            'permissions.*.can_create'  => 'nullable|boolean',
            'permissions.*.can_update'  => 'nullable|boolean',
            'permissions.*.can_delete'  => 'nullable|boolean',
            'permissions.*.can_approve' => 'nullable|boolean',
        ]);

        foreach ($validated['permissions'] as $item) {
            RolePermission::updateOrCreate(
                [
                    'role_id'   => $role->id,
                    'module_id' => $item['module_id'],
                ],
                [
                    'can_view'    => $item['can_view']    ?? false,
                    'can_create'  => $item['can_create']  ?? false,
                    'can_update'  => $item['can_update']  ?? false,
                    'can_delete'  => $item['can_delete']  ?? false,
                    'can_approve' => $item['can_approve'] ?? false,
                ]
            );
        }

        AuditLog::log('permission.updated', 'role', $role->id, null, ['modules' => count($validated['permissions'])]);

        return response()->json(['message' => 'Permission matrix updated successfully']);
    }
}
