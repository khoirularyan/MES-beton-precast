<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Role::query();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('kode', 'ilike', "%{$request->search}%")
                  ->orWhere('nama', 'ilike', "%{$request->search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json($query->orderBy('is_system', 'desc')->orderBy('nama')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'required|string|max:50|unique:user_roles,kode',
            'nama'      => 'required|string|max:100',
            'deskripsi' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['is_system'] = false; // Custom roles are never system
        $validated['is_active'] = $validated['is_active'] ?? true;

        $role = Role::create($validated);
        AuditLog::log('role.created', 'role', $role->id, null, $role->toArray());
        return response()->json($role, 201);
    }

    public function show(Role $role): JsonResponse
    {
        return response()->json($role->load('permissions.module'));
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'kode'      => 'sometimes|string|max:50|unique:user_roles,kode,' . $role->id,
            'nama'      => 'sometimes|string|max:100',
            'deskripsi' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        $oldValues = $role->only(['kode', 'nama', 'deskripsi', 'is_active']);
        $role->update($validated);
        AuditLog::log('role.updated', 'role', $role->id, $oldValues, $role->fresh()->toArray());
        return response()->json($role->fresh());
    }

    public function destroy(Role $role): JsonResponse
    {
        if (! $role->isDeletable()) {
            return response()->json(['message' => 'System roles cannot be deleted.'], 403);
        }

        // Re-assign users with this role to 'sales' (most restrictive)
        $fallbackRole = Role::where('kode', 'sales')->first();
        if ($fallbackRole) {
            User::where('role_id', $role->id)->update([
                'role_id' => $fallbackRole->id,
                'role'    => $fallbackRole->kode,
            ]);
        }

        AuditLog::log('role.deleted', 'role', $role->id, $role->toArray());
        $role->delete();
        return response()->json(['message' => 'Role deleted successfully']);
    }
}
