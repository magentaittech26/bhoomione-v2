<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class TenantResolverMiddleware
{
    /**
     * Resolves incoming workspace contexts dynamically by domain hostname or explicit request headers.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenantInput = $request->header('X-Tenant-ID');
        $host = $request->getHost();

        $resolvedTenant = null;

        // 1. Resolve via headers (UUID format or alphanumeric Tenant Code)
        if ($tenantInput) {
            $tenantInput = trim($tenantInput);
            $isUuid = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $tenantInput);

            if ($isUuid) {
                $tenant = DB::table('tenants')
                    ->where('id', $tenantInput)
                    ->select('id', 'tenant_code', 'company_name', 'status')
                    ->first();
            } else {
                $tenant = DB::table('tenants')
                    ->where('tenant_code', strtolower($tenantInput))
                    ->select('id', 'tenant_code', 'company_name', 'status')
                    ->first();
            }

            if ($tenant) {
                if ($tenant->status !== 'ACTIVE') {
                    return response()->json([
                        'error' => "Tenant workspace is currently: {$tenant->status}"
                    ], 403);
                }

                $resolvedTenant = [
                    'id' => $tenant->id,
                    'tenantCode' => $tenant->tenant_code,
                    'companyName' => $tenant->company_name,
                    'status' => $tenant->status,
                ];
            }
        }

        // 2. Resolve via Domain parsing fallback
        if (!$resolvedTenant && $host) {
            $cleanHost = strtolower($host);

            $tenant = DB::table('tenant_domains')
                ->join('tenants', 'tenant_domains.tenant_id', '=', 'tenants.id')
                ->where('tenant_domains.domain_name', $cleanHost)
                ->select('tenants.id', 'tenants.tenant_code', 'tenants.company_name', 'tenants.status')
                ->first();

            if ($tenant) {
                if ($tenant->status !== 'ACTIVE') {
                    return response()->json([
                        'error' => "Tenant workspace is currently: {$tenant->status}"
                    ], 403);
                }

                $resolvedTenant = [
                    'id' => $tenant->id,
                    'tenantCode' => $tenant->tenant_code,
                    'companyName' => $tenant->company_name,
                    'status' => $tenant->status,
                ];
            }
        }

        // Keep the resolved tenant parameters on the request properties for controllers usage
        if ($resolvedTenant) {
            $request->attributes->set('resolvedTenant', (object) $resolvedTenant);
        }

        return $next($request);
    }
}
