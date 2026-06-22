<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\SubscriptionEnforcementEngine;

class SubscriptionFeatureGate
{
    /**
     * Intercept and enforce subscription features.
     */
    public function handle(Request $request, Closure $next, string $featureCode): Response
    {
        // 1. Resolve active tenant context
        $resolvedTenant = $request->attributes->get('resolvedTenant');
        $tenantId = $resolvedTenant ? $resolvedTenant->id : null;

        // If no explicit tenant ID header or body parameter, parse from auth user payload fallback
        if (!$tenantId) {
            $authPayload = $request->attributes->get('authenticatedUserPayload');
            $tenantId = $authPayload['tenantId'] ?? null;
        }

        if (!$tenantId) {
            return response()->json([
                'error' => 'TENANT_NOT_SPECIFIED',
                'message' => 'Tenant workspace context not found. Specify X-Tenant-ID header to resolve subscriptions.'
            ], 400);
        }

        // 2. Perform enforcement check
        $hasAccess = SubscriptionEnforcementEngine::hasFeature($tenantId, $featureCode);

        if (!$hasAccess) {
            return response()->json([
                'error' => 'FEATURE_NOT_AVAILABLE',
                'feature' => strtoupper($featureCode),
                'message' => "The '" . strtoupper($featureCode) . "' feature is not included in your active subscription package.",
                'upgrade_guidance' => "To unlock access to " . strtoupper($featureCode) . ", please visit the Subscriptions Center in the administration console, or contact your BhoomiOne Platform Support agent to adjust your workspace allocations."
            ], 403);
        }

        return $next($request);
    }
}
