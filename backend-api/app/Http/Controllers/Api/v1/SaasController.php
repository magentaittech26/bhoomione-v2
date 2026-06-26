<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\SaasSubscriptionService;
use Illuminate\Http\Request;

class SaasController extends Controller
{
    public function __construct()
    {
        try {
            \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        } catch (\Throwable $e) {
            // Safe logging fallback
        }
    }

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
            'one_time_license_price' => 'nullable|numeric|min:0',
            'amc_price' => 'nullable|numeric|min:0',
            'sort_order' => 'nullable|integer',
            'status' => 'nullable|string|in:ACTIVE,DISABLED',
        ]);

        $context = $this->getContextAndUser($request);
        $slab = SaasSubscriptionService::savePlotSlab($validated, $context);
        return response()->json($slab);
    }

    /**
     * DELETE /api/v1/admin/slabs/{id}
     */
    public function deletePlotSlab(Request $request, $id)
    {
        $context = $this->getContextAndUser($request);
        try {
            SaasSubscriptionService::deletePlotSlab($id, $context);
            return response()->json(['success' => true, 'message' => 'Plot slab deleted successfully.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }

    /**
     * POST /api/v1/admin/slabs/reorder
     */
    public function reorderPlotSlabs(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|uuid'
        ]);

        $context = $this->getContextAndUser($request);
        SaasSubscriptionService::reorderPlotSlabs($validated['ids'], $context);
        return response()->json(['success' => true, 'message' => 'Plot slabs reordered successfully.']);
    }

    /**
     * GET /api/v1/admin/settings
     */
    public function getPlatformSettings()
    {
        return response()->json(SaasSubscriptionService::getPlatformSettings());
    }

    /**
     * POST /api/v1/admin/settings
     */
    public function savePlatformSettings(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.setting_group' => 'required|string|max:100',
            'settings.*.setting_key' => 'required|string|max:100',
            'settings.*.setting_value' => 'nullable|string',
            'settings.*.setting_type' => 'nullable|string|max:50',
            'settings.*.is_public' => 'nullable|boolean'
        ]);

        $context = $this->getContextAndUser($request);
        $saved = SaasSubscriptionService::savePlatformSettings($validated['settings'], $context);
        return response()->json(['success' => true, 'settings' => $saved]);
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
            'billing_override' => 'nullable|array'
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
        $summary = \App\Services\SubscriptionEnforcementEngine::getSubscriptionSummary($id);
        return response()->json($summary);
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

    /**
     * GET /api/v1/admin/commercial/features
     */
    public function getCommercialFeatures()
    {
        return response()->json(\App\Models\SaasFeature::all());
    }

    /**
     * GET /api/v1/admin/commercial/plans
     */
    public function getCommercialPlans()
    {
        return response()->json(SaasSubscriptionService::getPlans());
    }

    /**
     * POST /api/v1/admin/commercial/plans
     */
    public function saveCommercialPlan(Request $request)
    {
        return $this->savePlan($request);
    }

    /**
     * GET /api/v1/admin/commercial/addons
     */
    public function getCommercialAddons()
    {
        return response()->json(\App\Models\SubscriptionAddon::all());
    }

    /**
     * POST /api/v1/admin/commercial/addons
     */
    public function saveCommercialAddon(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|uuid',
            'code' => 'required|string|max:100',
            'name' => 'required|string|max:255',
            'monthly_price' => 'required|numeric|min:0',
            'yearly_price' => 'required|numeric|min:0',
            'one_time_price' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:ACTIVE,DISABLED',
            'addon_type' => 'nullable|string|in:FEATURE,CAPACITY,SERVICE',
            'feature_code' => 'nullable|string|max:100',
            'limit_key' => 'nullable|string|max:100',
            'limit_increment' => 'nullable|integer',
        ]);

        $context = $this->getContextAndUser($request);
        $addon = SaasSubscriptionService::saveAddon($validated, $context);
        return response()->json($addon);
    }

    /**
     * POST /api/v1/admin/tenants/{id}/addons
     */
    public function purchaseTenantAddon(Request $request, $id)
    {
        $validated = $request->validate([
            'addon_id' => 'required|uuid'
        ]);

        $tenantId = $id;
        $context = $this->getContextAndUser($request);

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($tenantId, $validated, $context) {
                // Find tenant subscription or create one on STARTER
                $sub = \App\Models\TenantSubscription::where('tenant_id', $tenantId)->first();
                if (!$sub) {
                    $starterPlan = \App\Models\SubscriptionPlan::where('plan_code', 'STARTER')->first();
                    if (!$starterPlan) {
                        throw new \Exception("Starter plan not found to initiate tenant subscription.");
                    }
                    $sub = \App\Models\TenantSubscription::create([
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'tenant_id' => $tenantId,
                        'plan_id' => $starterPlan->id,
                        'status' => 'ACTIVE',
                        'subscription_start_date' => now()->toDateString(),
                        'subscription_expiry_date' => now()->addDays(14)->toDateString(),
                        'trial_expiry_date' => now()->addDays(14)->toDateString(),
                    ]);
                }

                $addonId = $validated['addon_id'];
                $addon = \App\Models\SubscriptionAddon::findOrFail($addonId);

                // Add to tenant_addons if not already assigned
                $existing = \Illuminate\Support\Facades\DB::table('tenant_addons')
                    ->where('tenant_subscription_id', $sub->id)
                    ->where('addon_id', $addonId)
                    ->first();

                if (!$existing) {
                    \Illuminate\Support\Facades\DB::table('tenant_addons')->insert([
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'tenant_subscription_id' => $sub->id,
                        'addon_id' => $addonId,
                        'assigned_at' => now(),
                    ]);
                }

                // Write custom audit log
                \App\Services\AuditLogService::log([
                    'tenantId' => $tenantId,
                    'userId' => $context['userId'] ?? null,
                    'entityName' => 'TenantSubscription',
                    'entityId' => $sub->id,
                    'action' => 'ADDON_PURCHASED',
                    'newValues' => [
                        'addon_id' => $addonId,
                        'addon_code' => $addon->code,
                        'addon_name' => $addon->name,
                    ],
                    'ipAddress' => $context['ip'] ?? null,
                    'userAgent' => $context['userAgent'] ?? null,
                ]);

                return $this->getTenantSubscriptionSummary($tenantId);
            });
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * DELETE /api/v1/admin/tenants/{id}/addons/{addonId}
     */
    public function removeTenantAddon(Request $request, $id, $addonId)
    {
        $tenantId = $id;
        $context = $this->getContextAndUser($request);

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($tenantId, $addonId, $context) {
                $sub = \App\Models\TenantSubscription::where('tenant_id', $tenantId)->first();
                if (!$sub) {
                    return response()->json(['error' => 'Tenant does not have an active subscription.'], 400);
                }

                $addon = \App\Models\SubscriptionAddon::findOrFail($addonId);

                \Illuminate\Support\Facades\DB::table('tenant_addons')
                    ->where('tenant_subscription_id', $sub->id)
                    ->where('addon_id', $addonId)
                    ->delete();

                // Write custom audit log
                \App\Services\AuditLogService::log([
                    'tenantId' => $tenantId,
                    'userId' => $context['userId'] ?? null,
                    'entityName' => 'TenantSubscription',
                    'entityId' => $sub->id,
                    'action' => 'ADDON_REMOVED',
                    'newValues' => [
                        'addon_id' => $addonId,
                        'addon_code' => $addon->code,
                        'addon_name' => $addon->name,
                    ],
                    'ipAddress' => $context['ip'] ?? null,
                    'userAgent' => $context['userAgent'] ?? null,
                ]);

                return $this->getTenantSubscriptionSummary($tenantId);
            });
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * POST /api/v1/tenant/subscription/upgrade
     */
    public function upgradeMyPlan(Request $request)
    {
        $validated = $request->validate([
            'plan_id' => 'required|uuid'
        ]);

        $resolvedTenant = $request->attributes->get('resolvedTenant');
        $tenantId = $resolvedTenant ? $resolvedTenant->id : ($request->attributes->get('authenticatedUserPayload')['tenantId'] ?? null);

        if (!$tenantId) {
            return response()->json(['error' => 'Tenant context couldn\'t be resolved.'], 400);
        }

        $context = $this->getContextAndUser($request);

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($tenantId, $validated, $context) {
                $sub = \App\Models\TenantSubscription::where('tenant_id', $tenantId)->first();
                $plan = \App\Models\SubscriptionPlan::findOrFail($validated['plan_id']);

                if (!$sub) {
                    $sub = \App\Models\TenantSubscription::create([
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'tenant_id' => $tenantId,
                        'plan_id' => $plan->id,
                        'status' => 'ACTIVE',
                        'subscription_start_date' => now()->toDateString(),
                        'subscription_expiry_date' => now()->addDays(30)->toDateString(),
                    ]);
                } else {
                    $sub->update([
                        'plan_id' => $plan->id,
                        'subscription_expiry_date' => now()->addDays(30)->toDateString(),
                    ]);
                }

                // Audit
                \App\Services\AuditLogService::log([
                    'tenantId' => $tenantId,
                    'userId' => $context['userId'] ?? null,
                    'entityName' => 'TenantSubscription',
                    'entityId' => $sub->id,
                    'action' => 'PLAN_UPDATED',
                    'newValues' => [
                        'plan_id' => $plan->id,
                        'plan_code' => $plan->plan_code,
                        'plan_name' => $plan->name,
                    ],
                    'ipAddress' => $context['ip'] ?? null,
                    'userAgent' => $context['userAgent'] ?? null,
                ]);

                return $this->getTenantSubscriptionSummary($tenantId);
            });
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * POST /api/v1/tenant/addons
     */
    public function purchaseMyAddon(Request $request)
    {
        $resolvedTenant = $request->attributes->get('resolvedTenant');
        $tenantId = $resolvedTenant ? $resolvedTenant->id : ($request->attributes->get('authenticatedUserPayload')['tenantId'] ?? null);

        if (!$tenantId) {
            return response()->json(['error' => 'Tenant context couldn\'t be resolved.'], 400);
        }

        return $this->purchaseTenantAddon($request, $tenantId);
    }

    /**
     * DELETE /api/v1/tenant/addons/{addonId}
     */
    public function removeMyAddon(Request $request, $addonId)
    {
        $resolvedTenant = $request->attributes->get('resolvedTenant');
        $tenantId = $resolvedTenant ? $resolvedTenant->id : ($request->attributes->get('authenticatedUserPayload')['tenantId'] ?? null);

        if (!$tenantId) {
            return response()->json(['error' => 'Tenant context couldn\'t be resolved.'], 400);
        }

        return $this->removeTenantAddon($request, $tenantId, $addonId);
    }
}
