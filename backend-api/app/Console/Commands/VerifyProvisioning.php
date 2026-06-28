<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Tenant;
use Illuminate\Http\Request;
use App\Http\Middleware\TenantResolverMiddleware;

class VerifyProvisioning extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenant:verify-provisioning {tenant_code : The unique code of the tenant to verify}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verifies tenant existence, domains, subscriptions, active users, and simulates middleware resolution for DNS validation.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tenantCode = strtolower($this->argument('tenant_code'));

        $this->info("==========================================");
        $this->info("BHOOMIONE V2: PROVISIONING VERIFICATION ENGINE");
        $this->info("==========================================");
        $this->line("Target Tenant Code: {$tenantCode}");
        $this->line("------------------------------------------");

        $allPassed = true;

        // 1. Tenant Existence Check
        $tenant = Tenant::where('tenant_code', $tenantCode)->first();
        if ($tenant) {
            $this->info("[✓] PASS: Tenant exists in database.");
            $this->line("    Tenant ID: {$tenant->id}");
            $this->line("    Company Name: {$tenant->company_name}");
            $this->line("    Status: {$tenant->status}");
            $this->line("    Infrastructure Tier: {$tenant->infrastructure_tier}");
        } else {
            $this->error("[✗] FAIL: Tenant does not exist with code '{$tenantCode}'");
            $allPassed = false;
            return 1;
        }

        // 2. Primary Domain Check
        $primaryDomain = DB::table('tenant_domains')
            ->where('tenant_id', $tenant->id)
            ->where('is_primary', true)
            ->first();

        if ($primaryDomain) {
            $this->info("[✓] PASS: Primary domain exists for this tenant.");
            $this->line("    Domain: {$primaryDomain->domain}");
            $this->line("    Domain Name: {$primaryDomain->domain_name}");
            $this->line("    SSL Status: {$primaryDomain->ssl_status}");
            $this->line("    DNS Status: {$primaryDomain->dns_status}");
        } else {
            $this->warn("[!] WARNING: No primary domain found in 'tenant_domains' for this tenant.");
            $this->line("    Creating temporary/default domain mapping for verification...");
            $primaryDomain = (object) [
                'domain' => "{$tenantCode}.bhoomione.in",
                'domain_name' => "{$tenantCode}.bhoomione.in",
            ];
        }

        // 3. Subscription Check
        $subscription = DB::table('tenant_subscriptions')
            ->where('tenant_id', $tenant->id)
            ->first();

        if ($subscription) {
            $this->info("[✓] PASS: Tenant subscription contract resolved.");
            $this->line("    Plan ID: {$subscription->plan_id}");
            $this->line("    Status: {$subscription->status}");
            $this->line("    Expires: {$subscription->subscription_expiry_date}");
            $this->line("    Trial Ends: {$subscription->trial_expiry_date}");
        } else {
            $this->error("[✗] FAIL: No subscription contract registered for this tenant.");
            $allPassed = false;
        }

        // 4. Tenant Users Mapped Check
        $userMappingsCount = DB::table('tenant_users')
            ->where('tenant_id', $tenant->id)
            ->count();

        if ($userMappingsCount > 0) {
            $this->info("[✓] PASS: Active users are mapped to this tenant's workspace.");
            $this->line("    Mapped User Count: {$userMappingsCount}");
            
            $users = DB::table('tenant_users')
                ->join('users', 'tenant_users.user_id', '=', 'users.id')
                ->where('tenant_users.tenant_id', $tenant->id)
                ->select('users.name', 'users.email')
                ->get();
            
            foreach ($users as $user) {
                $this->line("    - {$user->name} ({$user->email})");
            }
        } else {
            $this->warn("[!] WARNING: No users are currently mapped to this tenant workspace.");
        }

        // 5. Middleware Domain Resolution simulation
        $this->line("------------------------------------------");
        $this->info("Simulating dynamic workspace context resolution...");

        $domainsToTest = [
            $primaryDomain->domain,
            "{$tenantCode}.bhoomione.in",
            "{$tenantCode}.localhost"
        ];

        foreach ($domainsToTest as $domainToTest) {
            $this->line("Testing Hostname: '{$domainToTest}'");

            $request = Request::create('http://' . $domainToTest . '/api/v1/auth/tenant/login', 'POST');
            $request->headers->set('Host', $domainToTest);

            $middleware = new TenantResolverMiddleware();
            $resolved = false;
            
            try {
                $middleware->handle($request, function ($req) use (&$resolved, $tenant) {
                    $resolvedTenantObj = $req->attributes->get('resolvedTenant');
                    if ($resolvedTenantObj && $resolvedTenantObj->id === $tenant->id) {
                        $resolved = true;
                    }
                    return response()->json(['status' => 'success']);
                });
            } catch (\Exception $e) {
                $this->error("    [✗] Resolution Error: " . $e->getMessage());
            }

            if ($resolved) {
                $this->info("    [✓] RESOLVED: Successfully mapped '{$domainToTest}' to Tenant '{$tenantCode}' [{$tenant->id}]");
            } else {
                $this->error("    [✗] FAILED: Could not map '{$domainToTest}' dynamically.");
                $allPassed = false;
            }
        }

        // 6. X-Tenant-ID exemption check
        $this->line("------------------------------------------");
        $this->info("Checking X-Tenant-ID header exemption for valid workspace domain logins...");
        
        $request = Request::create('http://' . $primaryDomain->domain . '/api/v1/auth/tenant/login', 'POST');
        $request->headers->set('Host', $primaryDomain->domain);

        $middleware = new TenantResolverMiddleware();
        $passedExemption = false;

        $middleware->handle($request, function ($req) use (&$passedExemption) {
            // Check if resolvedTenant is correctly attached on the request without X-Tenant-ID header
            if ($req->attributes->has('resolvedTenant')) {
                $passedExemption = true;
            }
            return response()->json(['status' => 'success']);
        });

        if ($passedExemption) {
            $this->info("[✓] PASS: X-Tenant-ID header is NOT required when accessing via workspace subdomain.");
            $this->line("    The login endpoint will automatically use the resolved context: '{$tenant->tenant_code}'");
        } else {
            $this->error("[✗] FAIL: The request did not resolve tenant context automatically. X-Tenant-ID might still be required.");
            $allPassed = false;
        }

        $this->info("==========================================");
        if ($allPassed) {
            $this->info("SUMMARY: VERIFICATION SUCCESSFUL. BhoomiOne V2 Tenant Provisioning is fully functional.");
        } else {
            $this->error("SUMMARY: VERIFICATION FAILED. Some checks did not pass. Refer to logs above.");
        }
        $this->info("==========================================");

        return $allPassed ? 0 : 1;
    }
}
