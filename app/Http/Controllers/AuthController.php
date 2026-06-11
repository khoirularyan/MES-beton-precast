<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const ROLE_LABELS = [
        'super_admin' => 'Super Admin',
        'qc' => 'Quality Control',
        'user' => 'User',
    ];

    private const ROLE_PERMISSIONS = [
        'super_admin' => ['*'],
        'qc' => ['dashboard.view', 'quality.view', 'curing.view', 'inventory.view', 'reports.view'],
        'user' => ['dashboard.view', 'sales.view', 'planning.view', 'work-orders.view', 'inventory.view', 'delivery.view'],
    ];

    public function session(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user() ? $this->serializeUser($request->user()) : null,
            'roles' => self::ROLE_LABELS,
            'permissions' => self::ROLE_PERMISSIONS,
        ]);
    }

    /**
     * @throws ValidationException
     */
    public function login(Request $request): JsonResponse
    {
        // If already authenticated, just return the current user
        if (Auth::check()) {
            return response()->json([
                'user' => $this->serializeUser($request->user()),
                'message' => 'Already authenticated.',
            ]);
        }

        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt([...$credentials, 'is_active' => true], $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => 'The email or password is incorrect, or the account is inactive.',
            ]);
        }

        $request->session()->regenerate();

        return response()->json([
            'user' => $this->serializeUser($request->user()),
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

    public function users(Request $request): JsonResponse
    {
        abort_unless($this->can($request->user(), 'user-access.manage'), 403);

        return response()->json([
            'data' => User::query()
                ->select(['id', 'name', 'email', 'role', 'department', 'plant', 'is_active', 'updated_at'])
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => $this->serializeUser($user)),
        ]);
    }

    private function serializeUser(User $user): array
    {
        $permissions = self::ROLE_PERMISSIONS[$user->role] ?? self::ROLE_PERMISSIONS['user'];

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'role_label' => self::ROLE_LABELS[$user->role] ?? 'User',
            'permissions' => $permissions,
            'department' => $user->department,
            'plant' => $user->plant,
            'is_active' => $user->is_active,
            'updated_at' => $user->updated_at?->toISOString(),
        ];
    }

    private function can(?User $user, string $permission): bool
    {
        if (! $user) {
            return false;
        }

        $permissions = self::ROLE_PERMISSIONS[$user->role] ?? self::ROLE_PERMISSIONS['user'];

        return in_array('*', $permissions, true) || in_array($permission, $permissions, true);
    }
}
