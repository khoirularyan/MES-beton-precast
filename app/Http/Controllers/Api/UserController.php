<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Rbac;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    private function validRoles(): string
    {
        try {
            $dbRoles = \App\Models\Role::where('is_active', true)->pluck('kode')->toArray();
            $allRoles = array_unique(array_merge(Rbac::roleNames(), $dbRoles));
            return implode(',', $allRoles);
        } catch (\Throwable) {
            return implode(',', Rbac::roleNames());
        }
    }

    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name',     'ilike', "%{$request->search}%")
                  ->orWhere('username', 'ilike', "%{$request->search}%")
                  ->orWhere('email',   'ilike', "%{$request->search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json($query->orderBy('name')->paginate($request->get('per_page', 100)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'username'  => 'required|string|max:255|unique:production_users,username',
            'email'     => 'required|email|max:255|unique:production_users,email',
            'password'  => 'required|string|min:6',
            'role'      => 'nullable|string|in:' . $this->validRoles(),
            'is_active' => 'nullable|boolean',
        ]);

        $validated['password']  = Hash::make($validated['password']);
        $validated['is_active'] = $validated['is_active'] ?? true;

        // Auto-sync role_id from role kode
        if (! isset($validated['role_id']) && isset($validated['role'])) {
            $validated['role_id'] = \App\Models\Role::where('kode', $validated['role'])->value('id');
        }

        $user = User::create($validated);
        return response()->json($user, 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($user);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'username'  => 'sometimes|string|max:255|unique:production_users,username,' . $user->id,
            'email'     => 'sometimes|email|max:255|unique:production_users,email,' . $user->id,
            'password'  => 'sometimes|string|min:6',
            'role'      => 'nullable|string|in:' . $this->validRoles(),
            'is_active' => 'nullable|boolean',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        // Auto-sync role_id from role kode
        if (! isset($validated['role_id']) && isset($validated['role'])) {
            $validated['role_id'] = \App\Models\Role::where('kode', $validated['role'])->value('id');
        }

        $user->update($validated);
        return response()->json($user->fresh());
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
