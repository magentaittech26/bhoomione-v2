<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\JwtTokenService;
use App\Models\User;
use Symfony\Component\HttpFoundation\Response;

class PermissionRequirementMiddleware
{
    /**
     * Handle incoming request based on granular database privilege attributes.
     */
    public function handle(Request $request, Closure $next, ...$permissions): Response
    {
        $bearer = $request->bearerToken();

        if (!$bearer) {
            return response()->json([
                'error' => 'Unauthenticated headers. Authentication token is missing.'
            ], 401);
        }

        try {
            $decoded = JwtTokenService::verifyAccessToken($bearer);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Access token is invalid, revoked, or expired: ' . $e->getMessage()
            ], 401);
        }

        $userId = $decoded['userId'];
        $user = User::find($userId);

        if (!$user || $user->status !== 'ACTIVE') {
            return response()->json([
                'error' => 'User identity is suspended or does not exist.'
            ], 403);
        }

        // Attach parsed user profile directly onto request attributes for controller usability
        $request->attributes->set('authenticatedUser', $user);
        $request->attributes->set('authenticatedUserPayload', $decoded);

        // Resolve active tenant boundary (if any)
        $resolvedTenant = $request->attributes->get('resolvedTenant');
        $tenantId = $resolvedTenant ? $resolvedTenant->id : ($decoded['tenantId'] ?? null);

        // Double check permissions array
        if (empty($permissions)) {
            return $next($request);
        }

        foreach ($permissions as $permission) {
            if (!$user->hasPermission($permission, $tenantId)) {
                return response()->json([
                    'error' => "Forbidden. Insufficient permissions to execute the requested action [{$permission}]."
                ], 403);
            }
        }

        return $next($request);
    }
}
