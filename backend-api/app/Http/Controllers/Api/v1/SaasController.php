<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\SaasSubscriptionService;
use Illuminate\Http\Request;

class SaasController extends Controller
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
     * GET /api/v1/admin/modules
     */
    public function getModules()
    {
        return response()->json(SaasSubscriptionService::getModules());
    }

    /**
     * POST /api/v1/admin/modules
     */
    public function saveModule(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|uuid',
            'code' => 'required|string|max:100',
            'name' => 'required|string|max:255',
            'group' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:ACTIVE,DISABLED',
            'is_core' => 'nullable|boolean',
            'is_billable' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $context = $this->getContextAndUser($request);
        $module = SaasSubscriptionService::saveModule($validated, $context);
        return response()->json($module);
    }

    /**
     * POST /api/v1/admin/features
     */
    public function saveFeature(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|uuid',
            'module_id' => 'required|uuid',
            'code' => 'required|string|max:100',
            'name' => 'required|string|max:255',
            'group' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:ACTIVE,DISABLED',
            'default_enabled' => 'nullable|boolean',
        ]);

        $context = $this->getContextAndUser($request);
        $feature = SaasSubscriptionService::saveFeature($validated, $context);
        return response()->json($feature);
    }

    /**
     * GET /api/v1/admin/plans
     */
    public function getPlans()
    {
        return response()->json(SaasSubscriptionService::getPlans());
    }

    /**
     * POST /api/v1/admin/plans
     */
    public function savePlan(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|uuid',
            'plan_code' => 'required|string|max:100',
            'name' => 'required|string|max:255',
            'monthly_price' => 'required|numeric|min:0',
            'yearly_price' => 'required|numeric|min:0',
            'trial_days' => 'nullable|integer|min:0',
            'status' => 'nullable|string|in:ACTIVE,DISABLED',
            'sort_order' => 'nullable|integer',
            'limits' => 'nullable|array',
            'features' => 'nullable|array',
        ]);

        $context = $this->getContextAndUser($request);
        $plan = SaasSubscriptionService::savePlan($validated, $context);
        return response()->json($plan);
    }

    /**
     * GET /api/v1/admin/addons
     */
    public function getAddons()
    {
        return response()->json(SaasSubscriptionService::getAddons());
    }

    /**
     * POST /api/v1/admin/addons
     */
    public function saveAddon(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|uuid',
            'code' => 'required|string|max:100',
            'name' => 'required|string|max:255',
            'monthly_price' => 'required|numeric|min:0',
            'yearly_price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:ACTIVE,DISABLED',
        ]);

        $context = $this->getContextAndUser($request);
        $addon = SaasSubscriptionService::saveAddon($validated, $context);
        return response()->json($addon);
    }

    /**
     * GET /api/v1/admin/slabs
     */
    public function getPlotSlabs()
    {
        return response()->json(SaasSubscriptionService::getPlotSlabs());
    }

    /**
     * POST /api/v1/admin/slabs
     */
    public function savePlotSlab(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|uuid',
            'min_plots' => 'required|integer|min:1',
            'max_plots' => 'required|integer|min:1',
            'monthly_price' => 'required|numeric|min:0',
            'yearly_price' => 'required|numeric|min:0',
            'status' => 'nullable|string|in:ACTIVE,DISABLED',
        ]);

        $context = $this->getContextAndUser($request);
        $slab = SaasSubscriptionService::savePlotSlab($validated, $context);
        return response()->json($slab);
    }

    /**
     * GET /api/v1/admin/tenants/{id}/subscription
     */
    public function getTenantSubscriptionProfile($id)
    {
        return response()->json(SaasSubscriptionService::getTenantSubscriptionProfile($id));
    }

    /**
     * POST /api/v1/admin/tenants/{id}/subscription
     */
    public function assignTenantSubscription(Request $request, $id)
    {
        $validated = $request->validate([
            'plan_id' => 'required|uuid',
            'start_date' => 'nullable|date',
            'billing_period' => 'nullable|string|in:MONTHLY,YEARLY',
            'trial_days' => 'nullable|integer|min:0',
            'status' => 'nullable|string',
        ]);

        $context = $this->getContextAndUser($request);
        $sub = SaasSubscriptionService::assignTenantSubscription($id, $validated, $context);
        return response()->json($sub);
    }

    /**
     * POST /api/v1/admin/tenants/{id}/subscription/lifecycle
     */
    public function updateLifecycle(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:ACTIVE,SUSPENDED,EXPIRED,ARCHIVED',
        ]);

        $context = $this->getContextAndUser($request);
        $sub = SaasSubscriptionService::updateLifecycle($id, $validated['status'], $context);
        return response()->json($sub);
    }

    /**
     * POST /api/v1/admin/tenants/{id}/subscription/overrides
     */
    public function saveOverrides(Request $request, $id)
    {
        $validated = $request->validate([
            'limit_overrides' => 'nullable|array',
            'feature_overrides' => 'nullable|array',
            'addons' => 'nullable|array',
        ]);

        $context = $this->getContextAndUser($request);
        $sub = SaasSubscriptionService::saveOverrides($id, $validated, $context);
        return response()->json($sub);
    }

    /**
     * GET /api/v1/admin/tenants/{id}/subscription-summary
     */
    public function getTenantSubscriptionSummary($id)
    {
        $tenantId = $id;
        $sub = \App\Services\SubscriptionEnforcementEngine::getTenantSubscription($tenantId);

        $activePlanName = "Starter (Trial)";
        $activePlanCode = "STARTER";
        $activeAddons = [];

        if ($sub) {
            $plan = \App\Models\SubscriptionPlan::find($sub->plan_id);
            if ($plan) {
                $activePlanName = $plan->name;
                $activePlanCode = $plan->plan_code;
            }

            // Find assigned addons
            $addonIds = \Illuminate\Support\Facades\DB::table('tenant_addons')
                ->where('tenant_subscription_id', $sub->id)
                ->pluck('addon_id')
                ->toArray();

            if (!empty($addonIds)) {
                $activeAddons = \App\Models\SubscriptionAddon::whereIn('id', $addonIds)
                    ->where('status', 'ACTIVE')
                    ->select('code', 'name')
                    ->get()
                    ->toArray();
            }
        }

        $limits = \App\Services\SubscriptionEnforcementEngine::getEffectiveLimits($tenantId);
        $usage = \App\Services\SubscriptionEnforcementEngine::getUsage($tenantId);
        
        $plotsCount = $usage['plots_count'];
        $slab = \App\Services\SubscriptionEnforcementEngine::getPlotBillingSlab($plotsCount);

        // Utilization rates
        $utilization = [
            'projects' => $limits['projectsLimit'] > 0 ? round(($usage['projects_count'] / $limits['projectsLimit']) * 100, 1) : 0,
            'layouts' => $limits['layoutsLimit'] > 0 ? round(($usage['layouts_count'] / $limits['layoutsLimit']) * 100, 1) : 0,
            'plots' => $limits['plotsLimit'] > 0 ? round(($usage['plots_count'] / $limits['plotsLimit']) * 100, 1) : 0,
            'users' => $limits['usersLimit'] > 0 ? round(($usage['users_count'] / $limits['usersLimit']) * 100, 1) : 0,
            'storage' => $limits['fileStorageGb'] > 0 ? round(($usage['storage_used_gb'] / $limits['fileStorageGb']) * 100, 1) : 0,
        ];

        return response()->json([
            'tenant_id' => $tenantId,
            'active_plan_code' => $activePlanCode,
            'active_plan_name' => $activePlanName,
            'active_addons' => $activeAddons,
            'limits' => $limits,
            'usages' => $usage,
            'utilization' => $utilization,
            'plot_billing_slab' => $slab,
        ]);
    }

    /**
     * GET /api/v1/tenant/subscription-summary
     */
    public function getMySubscriptionSummary(Request $request)
    {
        $resolvedTenant = $request->attributes->get('resolvedTenant');
        $tenantId = $resolvedTenant ? $resolvedTenant->id : ($request->attributes->get('authenticatedUserPayload')['tenantId'] ?? null);

        if (!$tenantId) {
            return response()->json(['error' => 'Tenant context couldn\'t be resolved.'], 400);
        }

        return $this->getTenantSubscriptionSummary($tenantId);
    }
}
