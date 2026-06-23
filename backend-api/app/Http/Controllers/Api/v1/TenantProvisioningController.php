<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\TenantProvisioningService;
use App\Models\Tenant;
use App\Models\TenantDomain;
use App\Models\TenantSubscription;
use App\Models\TenantProvisioningJob;
use App\Models\TenantLifecycleEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TenantProvisioningController extends Controller
{
    /**
     * Helper to retrieve logging context.
     */
    private function getContextAndUser(Request $request): array
    {
        $user = $request->attributes->get('authenticatedUser');
        return [
            'userId' => $user ? $user->id : null,
            'ip' => $request->ip(),
            'userAgent' => $request->userAgent()
        ];
    }

    /**
     * GET /api/v1/admin/tenants
     * Returns directory of active workspaces with computed limits and usage.
     */
    public function getTenants(Request $request)
    {
        $tenants = Tenant::with(['subscription.plan', 'domains'])->get();
        
        $res = $tenants->map(function ($t) {
            // Count projects
            $projectsCount = DB::table('projects')->where('tenant_id', $t->id)->count();
            // Count users in this tenant organization
            $usersCount = DB::table('tenant_users')->where('tenant_id', $t->id)->count();
            // Count layouts for projects in this tenant
            $layoutsCount = DB::table('layouts')
                ->join('projects', 'layouts.project_id', '=', 'projects.id')
                ->where('projects.tenant_id', $t->id)
                ->count();
            // Count plots in layouts for projects in this tenant
            $plotsCount = DB::table('plots')
                ->join('layouts', 'plots.layout_id', '=', 'layouts.id')
                ->join('projects', 'layouts.project_id', '=', 'projects.id')
                ->where('projects.tenant_id', $t->id)
                ->count();

            // Slabs or subscription details
            $sub = $t->subscription;
            $plan = $sub ? $sub->plan : null;

            return [
                'id' => $t->id,
                'tenant_code' => $t->tenant_code,
                'company_name' => $t->company_name,
                'tenant_status' => $t->status,
                'infrastructure_tier' => $t->infrastructure_tier,
                'subscription' => $sub ? [
                    'id' => $sub->id,
                    'plan_id' => $sub->plan_id,
                    'plan_name' => $plan ? $plan->name : 'N/A',
                    'plan_code' => $plan ? $plan->plan_code : 'N/A',
                    'status' => $sub->status,
                    'start_date' => $sub->subscription_start_date ? $sub->subscription_start_date->format('Y-m-d') : null,
                    'expiry_date' => $sub->subscription_expiry_date ? $sub->subscription_expiry_date->format('Y-m-d') : null,
                    'trial_expiry_date' => $sub->trial_expiry_date ? $sub->trial_expiry_date->format('Y-m-d') : null,
                    'renewal_date' => $sub->renewal_date ? $sub->renewal_date->format('Y-m-d') : null,
                    'addons' => DB::table('tenant_addons')
                        ->join('subscription_addons', 'tenant_addons.addon_id', '=', 'subscription_addons.id')
                        ->where('tenant_addons.tenant_subscription_id', $sub->id)
                        ->select('subscription_addons.id', 'subscription_addons.code', 'subscription_addons.name')
                        ->get()
                ] : null,
                'domains' => $t->domains->map(function ($d) {
                    return [
                        'id' => $d->id,
                        'domain' => $d->domain ?: $d->domain_name,
                        'type' => $d->type,
                        'is_primary' => $d->is_primary,
                        'ssl_status' => $d->ssl_status,
                        'dns_status' => $d->dns_status,
                        'verified_at' => $d->verified_at ? $d->verified_at->format('Y-m-d H:i:s') : null,
                    ];
                }),
                'usage' => [
                    'projects' => $projectsCount,
                    'users' => $usersCount,
                    'layouts' => $layoutsCount,
                    'plots' => $plotsCount,
                ],
            ];
        });

        return response()->json($res);
    }

    /**
     * GET /api/v1/admin/tenants/logs
     * Returns full workspace provisioning ledger.
     */
    public function getLogs(Request $request)
    {
        $logs = TenantProvisioningJob::with('tenant')
            ->orderBy('created_at', 'desc')
            ->get();

        $res = $logs->map(function ($l) {
            return [
                'id' => $l->id,
                'tenant_id' => $l->tenant_id,
                'tenant_name' => $l->tenant ? $l->tenant->company_name : 'System/Anonymous',
                'tenant_code' => $l->tenant ? $l->tenant->tenant_code : 'N/A',
                'job_type' => $l->job_type,
                'status' => $l->status,
                'error_message' => $l->error_message,
                'started_at' => $l->started_at ? $l->started_at->format('Y-m-d H:i:s') : null,
                'completed_at' => $l->completed_at ? $l->completed_at->format('Y-m-d H:i:s') : null,
                'created_at' => $l->created_at ? $l->created_at->format('Y-m-d H:i:s') : null,
            ];
        });

        return response()->json($res);
    }

    /**
     * GET /api/v1/admin/tenants/{id}/lifecycle-events
     */
    public function getLifecycleEvents($id)
    {
        $events = TenantLifecycleEvent::where('tenant_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($events);
    }

    /**
     * POST /api/v1/admin/tenants/provision
     */
    public function provision(Request $request)
    {
        $validated = $request->validate([
            'tenant_code' => 'required|string|max:100|alpha_dash|unique:tenants,tenant_code',
            'company_name' => 'required|string|max:255',
            'plan_id' => 'required|uuid|exists:subscription_plans,id',
            'domain' => 'required|string|max:255|unique:tenant_domains,domain_name',
            'domain_type' => 'nullable|string|in:SUBDOMAIN,CUSTOM',
            'infrastructure_tier' => 'nullable|string|in:SHARED,DEDICATED,ENTERPRISE',
            'initial_status' => 'nullable|string|in:TRIAL,ACTIVE',
        ]);

        $context = $this->getContextAndUser($request);

        try {
            $tenant = TenantProvisioningService::createTenant($validated, $context);
            return response()->json([
                'success' => true,
                'message' => 'Tenant successfully provisioned!',
                'tenant' => $tenant
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/v1/admin/tenants/{id}/activate
     */
    public function activate(Request $request, $id)
    {
        $context = $this->getContextAndUser($request);

        try {
            $sub = TenantProvisioningService::activateTenant($id, $context);
            return response()->json([
                'success' => true,
                'message' => 'Subscription activated successfully!',
                'subscription' => $sub
            ]);
        } catch (\InvalidArgumentException $e) {
            if ($e->getMessage() === 'INVALID_STATUS_TRANSITION') {
                return response()->json(['error' => 'INVALID_STATUS_TRANSITION'], 422);
            }
            return response()->json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/tenants/{id}/suspend
     */
    public function suspend(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000'
        ]);

        $context = $this->getContextAndUser($request);

        try {
            $sub = TenantProvisioningService::suspendTenant($id, $validated['reason'] ?? '', $context);
            return response()->json([
                'success' => true,
                'message' => 'Tenant suspended successfully!',
                'subscription' => $sub
            ]);
        } catch (\InvalidArgumentException $e) {
            if ($e->getMessage() === 'INVALID_STATUS_TRANSITION') {
                return response()->json(['error' => 'INVALID_STATUS_TRANSITION'], 422);
            }
            return response()->json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/tenants/{id}/resume
     */
    public function resume(Request $request, $id)
    {
        $context = $this->getContextAndUser($request);

        try {
            $sub = TenantProvisioningService::resumeTenant($id, $context);
            return response()->json([
                'success' => true,
                'message' => 'Tenant resumed successfully!',
                'subscription' => $sub
            ]);
        } catch (\InvalidArgumentException $e) {
            if ($e->getMessage() === 'INVALID_STATUS_TRANSITION') {
                return response()->json(['error' => 'INVALID_STATUS_TRANSITION'], 422);
            }
            return response()->json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/tenants/{id}/cancel
     */
    public function cancel(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000'
        ]);

        $context = $this->getContextAndUser($request);

        try {
            $sub = TenantProvisioningService::cancelTenant($id, $validated['reason'] ?? '', $context);
            return response()->json([
                'success' => true,
                'message' => 'Tenant cancelled completely!',
                'subscription' => $sub
            ]);
        } catch (\InvalidArgumentException $e) {
            if ($e->getMessage() === 'INVALID_STATUS_TRANSITION') {
                return response()->json(['error' => 'INVALID_STATUS_TRANSITION'], 422);
            }
            return response()->json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/tenants/{id}/change-plan
     */
    public function changePlan(Request $request, $id)
    {
        $validated = $request->validate([
            'plan_id' => 'required|uuid|exists:subscription_plans,id',
        ]);

        $context = $this->getContextAndUser($request);

        try {
            $sub = TenantProvisioningService::changePlan($id, $validated['plan_id'], $context);
            return response()->json([
                'success' => true,
                'message' => 'Tenant plan upgraded/downgraded!',
                'subscription' => $sub
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/tenants/{id}/assign-addon
     */
    public function assignAddon(Request $request, $id)
    {
        $validated = $request->validate([
            'addon_id' => 'required|uuid|exists:subscription_addons,id',
        ]);

        $context = $this->getContextAndUser($request);

        try {
            $addon = TenantProvisioningService::assignAddon($id, $validated['addon_id'], $context);
            return response()->json([
                'success' => true,
                'message' => 'Add-on assigned to tenant subscription profile!',
                'addon' => $addon
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/tenants/{id}/remove-addon
     */
    public function removeAddon(Request $request, $id)
    {
        $validated = $request->validate([
            'addon_id' => 'required|uuid|exists:subscription_addons,id',
        ]);

        $context = $this->getContextAndUser($request);

        try {
            TenantProvisioningService::removeAddon($id, $validated['addon_id'], $context);
            return response()->json([
                'success' => true,
                'message' => 'Add-on removed from workspace.'
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/tenants/{id}/domains
     */
    public function attachDomain(Request $request, $id)
    {
        $validated = $request->validate([
            'domain' => 'required|string|max:255',
            'type' => 'required|string|in:SUBDOMAIN,CUSTOM',
        ]);

        $context = $this->getContextAndUser($request);

        try {
            $dom = TenantProvisioningService::attachDomain($id, $validated['domain'], $validated['type'], $context);
            return response()->json([
                'success' => true,
                'message' => 'Domain successfully attached to tenant workspace configuration!',
                'domain' => $dom
            ]);
        } catch (\InvalidArgumentException $e) {
            if ($e->getMessage() === 'DOMAIN_ALREADY_EXISTS') {
                return response()->json(['error' => 'Domain or subdomain is already in use by another workspace profile.'], 422);
            }
            return response()->json(['error' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/v1/admin/tenants/{id}/domains
     */
    public function getDomains($id)
    {
        $domains = TenantDomain::where('tenant_id', $id)->get();
        return response()->json($domains);
    }
}
