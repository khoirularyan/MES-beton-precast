<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnsureAdmin
 *
 * Restricts access to Admin and Super Admin roles only.
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, ['admin', 'super_admin'], true)) {
            return response()->json([
                'message' => 'This action is restricted to Administrators only.',
            ], 403);
        }

        return $next($request);
    }
}
