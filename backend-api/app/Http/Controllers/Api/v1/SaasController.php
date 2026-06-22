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
}
