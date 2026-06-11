<?php

namespace App\Http\Middleware;

use App\Support\Rbac;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnsurePermission
 *
 * Checks that the authenticated user's role grants the required permission.
 *
 * Usage in routes:
 *   ->middleware('permission:master-data.manage')
 *   ->middleware('permission:sales.approve')
 *   ->middleware('permission:user-access.manage')
 */
class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (! Rbac::userCan($request->user(), $permission)) {
            return response()->json([
                'message'  => 'You do not have permission to perform this action.',
                'required' => $permission,
            ], 403);
        }

        return $next($request);
    }
}
