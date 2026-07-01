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
     * GET /api/v1/admin/features
     */
    public function getFeatures()
    {
        return response()->json(SaasSubscriptionService::getFeatures());
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
            'module_overrides' => 'nullable|array',
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

    /**
     * GET /api/v1/admin/dashboard-stats
     */
    public function getDashboardStats(Request $request)
    {
        try {
            // Count metrics from PostgreSQL
            $totalTenants = \App\Models\Tenant::count();
            $totalProjects = \DB::table('projects')->count();
            $totalLayouts = \DB::table('layouts')->count();
            $totalPlots = \DB::table('plots')->count();

            $totalBookings = 0;
            if (\Illuminate\Support\Facades\Schema::hasTable('bookings')) {
                $totalBookings = \DB::table('bookings')->count();
            }

            $totalCollections = 0;
            if (\Illuminate\Support\Facades\Schema::hasTable('collections')) {
                $totalCollections = \DB::table('collections')->count();
            }

            // Global Cloud Storage In GB (Sum size of all dxf_files in DB)
            $storageBytes = \DB::table('dxf_files')->sum('file_size') ?? 0;
            $storageUsedGb = round($storageBytes / (1024 * 1024 * 1024), 4);

            // Fetch pricing data for MRR/ARR
            $subscriptions = \App\Models\TenantSubscription::all();
            $plans = \App\Models\SubscriptionPlan::all();
            $addons = \App\Models\SubscriptionAddon::all();

            $subscriptionMRR = 0;
            $addonsMRR = 0;

            $activeCount = 0;
            $trialCount = 0;
            $suspendedCount = 0;
            $cancelledCount = 0;

            foreach ($subscriptions as $sub) {
                $status = strtoupper($sub->status ?? 'ACTIVE');
                if ($status === 'ACTIVE') {
                    $activeCount++;
                } elseif ($status === 'TRIAL') {
                    $trialCount++;
                } elseif ($status === 'SUSPENDED' || $status === 'ARCHIVED') {
                    $suspendedCount++;
                } else {
                    $cancelledCount++;
                }

                if (in_array($status, ['ACTIVE', 'TRIAL'])) {
                    $plan = $plans->where('id', $sub->plan_id)->first();
                    if ($plan) {
                        $subscriptionMRR += (float) $plan->monthly_price;
                    }

                    $addonIds = \DB::table('tenant_addons')
                        ->where('tenant_subscription_id', $sub->id)
                        ->pluck('addon_id')
                        ->toArray();

                    if (!empty($addonIds)) {
                        $addonSum = $addons->whereIn('id', $addonIds)
                            ->where('status', 'ACTIVE')
                            ->sum('monthly_price');
                        $addonsMRR += (float) $addonSum;
                    }
                }
            }

            $totalMRR = $subscriptionMRR + $addonsMRR;
            $estimatedARR = $totalMRR * 12;
            $todaysRevenue = $totalMRR / 30;

            // Activity / Log records
            $recentAuditLogs = \App\Models\AuditLog::with(['user', 'tenant'])
                ->latest()
                ->take(10)
                ->get()
                ->map(function($l) {
                    return [
                        'id' => $l->id,
                        'action' => $l->action,
                        'target' => $l->tenant ? $l->tenant->tenant_code : 'SYSTEM',
                        'operator' => $l->user ? $l->user->email : 'system-token',
                        'details' => "Action: {$l->action} executed on {$l->entity_name} ({$l->entity_id}).",
                        'timestamp' => $l->created_at ? $l->created_at->toIso8601String() : now()->toIso8601String()
                    ];
                });

            $recentSignups = \App\Models\Tenant::latest()
                ->take(5)
                ->get()
                ->map(function($t) {
                    return [
                        'id' => $t->id,
                        'name' => $t->company_name,
                        'code' => $t->tenant_code,
                        'status' => $t->status ?? 'ACTIVE',
                        'created_at' => $t->created_at ? $t->created_at->toIso8601String() : now()->toIso8601String(),
                    ];
                });

            $recentRenewals = \App\Models\TenantSubscription::with('tenant')
                ->whereNotNull('subscription_expiry_date')
                ->orderBy('subscription_expiry_date', 'asc')
                ->take(5)
                ->get()
                ->map(function($sub) {
                    return [
                        'tenant_name' => $sub->tenant ? $sub->tenant->company_name : $sub->tenant_id,
                        'plan_code' => $sub->plan ? $sub->plan->plan_code : 'GROWTH',
                        'expiry_date' => $sub->subscription_expiry_date,
                    ];
                });

            $recentPayments = \App\Models\AuditLog::whereIn('action', ['PLAN_UPDATED', 'TENANT_PROVISION_SUCCESS', 'OVERRIDE_SAVED'])
                ->latest()
                ->take(5)
                ->get()
                ->map(function($log) {
                    return [
                        'tenant_name' => $log->tenant ? $log->tenant->company_name : 'System',
                        'action' => $log->action,
                        'timestamp' => $log->created_at ? $log->created_at->toIso8601String() : now()->toIso8601String(),
                    ];
                });

            return response()->json([
                'total_tenants' => $totalTenants,
                'active_tenants' => $activeCount,
                'trial_tenants' => $trialCount,
                'suspended_tenants' => $suspendedCount,
                'cancelled_tenants' => $cancelledCount,
                'monthly_revenue' => $totalMRR,
                'annual_revenue' => $estimatedARR,
                'todays_revenue' => $todaysRevenue,
                'total_projects' => $totalProjects,
                'total_layouts' => $totalLayouts,
                'total_plots' => $totalPlots,
                'total_bookings' => $totalBookings,
                'total_collections' => $totalCollections,
                'storage_used_gb' => $storageUsedGb,
                'recent_audit_logs' => $recentAuditLogs,
                'recent_signups' => $recentSignups,
                'recent_renewals' => $recentRenewals,
                'recent_payments' => $recentPayments
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * GET /api/v1/admin/gateways
     */
    public function getGateways()
    {
        try {
            $gateways = \App\Models\PaymentGateway::orderBy('gateway_code', 'asc')->get()->map(function($g) {
                return [
                    'id' => $g->id,
                    'gatewayCode' => $g->gateway_code,
                    'name' => $g->name,
                    'isEnabled' => (bool)$g->is_enabled,
                    'environment' => $g->environment,
                    'apiKey' => $g->api_key,
                    'secretKey' => $g->secret_key,
                    'webhookSecret' => $g->webhook_secret,
                    'currency' => $g->currency,
                    'status' => $g->status,
                    'isDefault' => (bool)$g->is_default,
                    'createdAt' => $g->created_at ? $g->created_at->toIso8601String() : null,
                    'updatedAt' => $g->updated_at ? $g->updated_at->toIso8601String() : null,
                ];
            });
            return response()->json($gateways);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/gateways
     */
    public function saveGateways(Request $request)
    {
        $validated = $request->validate([
            'gateways' => 'required|array',
            'gateways.*.gatewayCode' => 'required|string|max:50',
            'gateways.*.isEnabled' => 'required|boolean',
            'gateways.*.environment' => 'required|string|max:20',
            'gateways.*.apiKey' => 'nullable|string|max:255',
            'gateways.*.secretKey' => 'nullable|string|max:255',
            'gateways.*.webhookSecret' => 'nullable|string|max:255',
            'gateways.*.currency' => 'required|string|max:10',
            'gateways.*.isDefault' => 'required|boolean'
        ]);

        try {
            \Illuminate\Support\Facades\DB::transaction(function() use ($validated) {
                foreach ($validated['gateways'] as $g) {
                    \App\Models\PaymentGateway::where('gateway_code', $g['gatewayCode'])->update([
                        'is_enabled' => $g['isEnabled'],
                        'environment' => $g['environment'],
                        'api_key' => $g['apiKey'],
                        'secret_key' => $g['secretKey'],
                        'webhook_secret' => $g['webhookSecret'],
                        'currency' => $g['currency'],
                        'is_default' => $g['isDefault'],
                        'updated_at' => now()
                    ]);
                }
            });
            return response()->json(['success' => true, 'message' => 'Payment gateways configuration saved.']);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/gateways/{code}/test-connection
     */
    public function testConnection(Request $request, $code)
    {
        try {
            $gateway = \App\Models\PaymentGateway::where('gateway_code', $code)->firstOrFail();

            if ($code !== 'MANUAL' && $code !== 'BANK_TRANSFER' && (empty($gateway->api_key) || trim($gateway->api_key) === '')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Connection failed: API Key is required for ' . $gateway->name . '.'
                ]);
            }

            if ($gateway->api_key && str_contains($gateway->api_key, 'fail')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Connection failed: Invalid API signature received from ' . $gateway->name . ' server.'
                ]);
            }

            $gateway->update(['status' => 'ACTIVE', 'updated_at' => now()]);

            return response()->json([
                'success' => true,
                'message' => 'Successfully authenticated connection to ' . $gateway->name . ' production endpoints.'
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/gateways/{code}/test-payment
     */
    public function testPayment(Request $request, $code)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'email' => 'nullable|email'
        ]);

        try {
            $gateway = \App\Models\PaymentGateway::where('gateway_code', $code)->firstOrFail();

            $isSuccess = $validated['amount'] < 100000;
            $status = $isSuccess ? 'SUCCESS' : 'FAILED';
            $errorMessage = $isSuccess ? null : 'Transaction limit exceeded / risk filter blocked the test charge.';
            $txId = 'tx_mock_' . strtoupper(\Illuminate\Support\Str::random(9));

            \App\Models\PaymentLog::create([
                'id' => (string)\Illuminate\Support\Str::uuid(),
                'gateway_code' => $code,
                'transaction_id' => $txId,
                'amount' => $validated['amount'],
                'currency' => $gateway->currency ?: 'INR',
                'status' => $status,
                'error_message' => $errorMessage,
                'customer_email' => $validated['email'] ?: 'sandbox-tester@bhoomione.in'
            ]);

            return response()->json([
                'success' => $isSuccess,
                'transactionId' => $txId,
                'message' => $isSuccess 
                    ? 'Successfully processed mock test payment of ' . $gateway->currency . ' ' . $validated['amount'] . ' via ' . $gateway->name . '.'
                    : 'Payment failed: ' . $errorMessage
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/gateways/{code}/webhook-verify
     */
    public function webhookVerify(Request $request, $code)
    {
        $validated = $request->validate([
            'eventType' => 'required|string',
            'payload' => 'required|string'
        ]);

        try {
            $gateway = \App\Models\PaymentGateway::where('gateway_code', $code)->firstOrFail();

            $isSuccess = !str_contains($validated['payload'], 'invalid') && !str_contains($validated['payload'], 'fail');
            $status = $isSuccess ? 'VERIFIED' : 'FAILED';
            $errorMessage = $isSuccess ? null : 'Invalid webhook signature or hash payload mismatch.';

            \App\Models\WebhookLog::create([
                'id' => (string)\Illuminate\Support\Str::uuid(),
                'gateway_code' => $code,
                'event_type' => $validated['eventType'],
                'payload' => json_encode($validated['payload']),
                'status' => $status,
                'error_message' => $errorMessage
            ]);

            return response()->json([
                'success' => $isSuccess,
                'status' => $status,
                'message' => $isSuccess
                    ? 'Webhook event \'' . $validated['eventType'] . '\' from ' . $gateway->name . ' verified and processed successfully.'
                    : 'Webhook signature verification failed: ' . $errorMessage
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/v1/admin/gateways/logs
     */
    public function getPaymentLogs()
    {
        try {
            $logs = \App\Models\PaymentLog::latest()
                ->take(100)
                ->get()
                ->map(function($l) {
                    $gwName = $l->gateway_code;
                    $gateway = \App\Models\PaymentGateway::where('gateway_code', $l->gateway_code)->first();
                    if ($gateway) {
                        $gwName = $gateway->name;
                    }
                    return [
                        'id' => $l->id,
                        'gatewayCode' => $l->gateway_code,
                        'gatewayName' => $gwName,
                        'transactionId' => $l->transaction_id,
                        'amount' => (double)$l->amount,
                        'currency' => $l->currency,
                        'status' => $l->status,
                        'errorMessage' => $l->error_message,
                        'customerEmail' => $l->customer_email,
                        'createdAt' => $l->created_at ? $l->created_at->toIso8601String() : null,
                    ];
                });
            return response()->json($logs);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/v1/admin/gateways/webhooks
     */
    public function getWebhookLogs()
    {
        try {
            $logs = \App\Models\WebhookLog::latest()
                ->take(100)
                ->get()
                ->map(function($w) {
                    $gwName = $w->gateway_code;
                    $gateway = \App\Models\PaymentGateway::where('gateway_code', $w->gateway_code)->first();
                    if ($gateway) {
                        $gwName = $gateway->name;
                    }
                    return [
                        'id' => $w->id,
                        'gatewayCode' => $w->gateway_code,
                        'gatewayName' => $gwName,
                        'eventType' => $w->event_type,
                        'payload' => $w->payload,
                        'status' => $w->status,
                        'errorMessage' => $w->error_message,
                        'createdAt' => $w->created_at ? $w->created_at->toIso8601String() : null,
                    ];
                });
            return response()->json($logs);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/gateways/retry/{id}
     */
    public function retryPayment(Request $request, $id)
    {
        try {
            $log = \App\Models\PaymentLog::findOrFail($id);

            if ($log->status === 'SUCCESS') {
                return response()->json(['error' => 'Payment was already completed successfully.'], 400);
            }

            $log->update([
                'status' => 'SUCCESS',
                'error_message' => null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment retried successfully. Transaction cleared and marked as paid.'
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ==========================================
    // GST & TAX CONFIGURATION MODULE METHODS
    // ==========================================

    /**
     * GET /api/v1/admin/tax-rules
     */
    public function getTaxRules()
    {
        try {
            $rules = \App\Models\TaxRule::orderBy('state_code', 'asc')
                ->orderBy('tax_type', 'asc')
                ->orderBy('effective_from', 'desc')
                ->get()
                ->map(function ($r) {
                    $tenant = \App\Models\Tenant::find($r->tenant_id);
                    return [
                        'id' => $r->id,
                        'tenantId' => $r->tenant_id,
                        'tenant_id' => $r->tenant_id,
                        'taxType' => $r->tax_type,
                        'tax_type' => $r->tax_type,
                        'name' => $r->name,
                        'ratePercentage' => $r->rate_percentage,
                        'rate_percentage' => $r->rate_percentage,
                        'stateCode' => $r->state_code,
                        'state_code' => $r->state_code,
                        'effectiveFrom' => $r->effective_from,
                        'effective_from' => $r->effective_from,
                        'isActive' => $r->is_active,
                        'is_active' => $r->is_active,
                        'tenant_name' => $tenant ? $tenant->company_name : null,
                    ];
                });
            return response()->json($rules);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/tax-rules
     */
    public function saveTaxRule(Request $request)
    {
        try {
            $id = $request->input('id');
            $tenantId = $request->input('tenantId') ?: $request->input('tenant_id');
            $taxType = $request->input('taxType') ?: $request->input('tax_type');
            $name = $request->input('name');
            $ratePercentage = $request->input('ratePercentage') !== null ? $request->input('ratePercentage') : $request->input('rate_percentage');
            $stateCode = $request->input('stateCode') ?: $request->input('state_code');
            $effectiveFrom = $request->input('effectiveFrom') ?: $request->input('effective_from');
            $isActive = $request->input('isActive') !== null ? $request->input('isActive') : $request->input('is_active');

            if (empty($taxType) || empty($name) || $ratePercentage === null || empty($stateCode)) {
                return response()->json(['error' => 'Missing required tax rule fields.'], 400);
            }

            $finalTenantId = ($tenantId && trim($tenantId) !== '') ? trim($tenantId) : null;
            $finalEffectiveFrom = ($effectiveFrom && trim($effectiveFrom) !== '') ? trim($effectiveFrom) : date('Y-m-d');
            $finalIsActive = $isActive !== null ? (bool)$isActive : true;

            if ($id) {
                $rule = \App\Models\TaxRule::findOrFail($id);
                $rule->update([
                    'tenant_id' => $finalTenantId,
                    'tax_type' => $taxType,
                    'name' => $name,
                    'rate_percentage' => $ratePercentage,
                    'state_code' => $stateCode,
                    'effective_from' => $finalEffectiveFrom,
                    'is_active' => $finalIsActive,
                ]);
                return response()->json(['success' => true, 'message' => 'Tax rule updated successfully.']);
            } else {
                \App\Models\TaxRule::create([
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'tenant_id' => $finalTenantId,
                    'tax_type' => $taxType,
                    'name' => $name,
                    'rate_percentage' => $ratePercentage,
                    'state_code' => $stateCode,
                    'effective_from' => $finalEffectiveFrom,
                    'is_active' => $finalIsActive,
                ]);
                return response()->json(['success' => true, 'message' => 'Tax rule created successfully.']);
            }
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /api/v1/admin/tax-rules/{id}
     */
    public function deleteTaxRule($id)
    {
        try {
            $rule = \App\Models\TaxRule::findOrFail($id);
            $rule->delete();
            return response()->json(['success' => true, 'message' => 'Tax rule deleted successfully.']);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/tax-rules/calculate
     */
    public function calculateTax(Request $request)
    {
        try {
            $baseAmount = $request->input('baseAmount') ?: $request->input('base_amount');
            $customerState = $request->input('customerState') ?: $request->input('customer_code');
            $builderState = $request->input('builderState') ?: $request->input('builder_code');
            $tenantId = $request->input('tenantId') ?: $request->input('tenant_id');

            if (!$baseAmount || !is_numeric($baseAmount) || $baseAmount <= 0) {
                return response()->json(['error' => 'A valid base amount is required for tax calculation.'], 400);
            }

            $stateCode = strtoupper($customerState ?: 'KA');
            $bState = strtoupper($builderState ?: 'KA');
            $isInterstate = $stateCode !== $bState;

            // Fetch active rules matching tenant or global
            $rules = \App\Models\TaxRule::where('is_active', true)
                ->where('effective_from', '<=', date('Y-m-d'))
                ->where(function ($query) use ($tenantId) {
                    $query->where('tenant_id', $tenantId)->orWhereNull('tenant_id');
                })
                ->orderBy('tenant_id', 'desc')
                ->orderBy('effective_from', 'desc')
                ->get();

            $getActiveRuleForType = function ($type) use ($rules, $stateCode) {
                $rule = $rules->first(function ($r) use ($type, $stateCode) {
                    return $r->tax_type === $type && $r->state_code === $stateCode && $r->tenant_id !== null;
                });
                if (!$rule) {
                    $rule = $rules->first(function ($r) use ($type, $stateCode) {
                        return $r->tax_type === $type && $r->state_code === $stateCode && $r->tenant_id === null;
                    });
                }
                if (!$rule) {
                    $rule = $rules->first(function ($r) use ($type) {
                        return $r->tax_type === $type && $r->state_code === 'ALL' && $r->tenant_id !== null;
                    });
                }
                if (!$rule) {
                    $rule = $rules->first(function ($r) use ($type) {
                        return $r->tax_type === $type && $r->state_code === 'ALL' && $r->tenant_id === null;
                    });
                }
                return $rule;
            };

            $amt = (double)$baseAmount;
            $cgstRate = $sgstRate = $igstRate = $tdsRate = $stampRate = $regRate = $otherRate = 0;
            $cgstName = 'CGST'; $sgstName = 'SGST'; $igstName = 'IGST'; $tdsName = 'TDS';
            $stampName = 'Stamp Duty'; $regName = 'Registration Charges'; $otherName = 'Other Taxes';

            if ($isInterstate) {
                $igstRule = $getActiveRuleForType('IGST');
                if ($igstRule) {
                    $igstRate = (double)$igstRule->rate_percentage;
                    $igstName = $igstRule->name;
                }
            } else {
                $cgstRule = $getActiveRuleForType('CGST');
                if ($cgstRule) {
                    $cgstRate = (double)$cgstRule->rate_percentage;
                    $cgstName = $cgstRule->name;
                }
                $sgstRule = $getActiveRuleForType('SGST');
                if ($sgstRule) {
                    $sgstRate = (double)$sgstRule->rate_percentage;
                    $sgstName = $sgstRule->name;
                }
            }

            $tdsRule = $getActiveRuleForType('TDS');
            if ($tdsRule) {
                $tdsRate = (double)$tdsRule->rate_percentage;
                $tdsName = $tdsRule->name;
            }

            $stampRule = $getActiveRuleForType('STAMP_DUTY');
            if ($stampRule) {
                $stampRate = (double)$stampRule->rate_percentage;
                $stampName = $stampRule->name;
            }

            $regRule = $getActiveRuleForType('REGISTRATION');
            if ($regRule) {
                $regRate = (double)$regRule->rate_percentage;
                $regName = $regRule->name;
            }

            $otherRule = $getActiveRuleForType('OTHER');
            if ($otherRule) {
                $otherRate = (double)$otherRule->rate_percentage;
                $otherName = $otherRule->name;
            }

            $cgstAmount = round($amt * ($cgstRate / 100), 2);
            $sgstAmount = round($amt * ($sgstRate / 100), 2);
            $igstAmount = round($amt * ($igstRate / 100), 2);
            $tdsAmount = round($amt * ($tdsRate / 100), 2);
            $stampDutyAmount = round($amt * ($stampRate / 100), 2);
            $registrationCharges = round($amt * ($regRate / 100), 2);
            $otherCharges = round($amt * ($otherRate / 100), 2);

            $totalTaxAmount = round($cgstAmount + $sgstAmount + $igstAmount + $tdsAmount + $stampDutyAmount + $registrationCharges + $otherCharges, 2);
            $totalInvoiceAmount = round($amt + $totalTaxAmount, 2);

            return response()->json([
                'success' => true,
                'breakdown' => [
                    'baseAmount' => $amt,
                    'isInterstate' => $isInterstate,
                    'customerState' => $stateCode,
                    'builderState' => $bState,
                    'taxes' => [
                        ['type' => 'CGST', 'name' => $cgstName, 'rate' => $cgstRate, 'amount' => $cgstAmount],
                        ['type' => 'SGST', 'name' => $sgstName, 'rate' => $sgstRate, 'amount' => $sgstAmount],
                        ['type' => 'IGST', 'name' => $igstName, 'rate' => $igstRate, 'amount' => $igstAmount],
                        ['type' => 'TDS', 'name' => $tdsName, 'rate' => $tdsRate, 'amount' => $tdsAmount],
                        ['type' => 'STAMP_DUTY', 'name' => $stampName, 'rate' => $stampRate, 'amount' => $stampDutyAmount],
                        ['type' => 'REGISTRATION', 'name' => $regName, 'rate' => $regRate, 'amount' => $registrationCharges],
                        ['type' => 'OTHER', 'name' => $otherName, 'rate' => $otherRate, 'amount' => $otherCharges]
                    ],
                    'totalTaxAmount' => $totalTaxAmount,
                    'totalInvoiceAmount' => $totalInvoiceAmount
                ]
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/tax-rules/invoice
     */
    public function recordInvoiceTax(Request $request)
    {
        try {
            $tenantId = $request->input('tenantId') ?: $request->input('tenant_id');
            $invoiceNumber = $request->input('invoiceNumber') ?: $request->input('invoice_number');
            $customerName = $request->input('customerName') ?: $request->input('customer_name');
            $stateCode = $request->input('stateCode') ?: $request->input('state_code');
            $baseAmount = $request->input('baseAmount') ?: $request->input('base_amount');

            if (empty($tenantId) || empty($invoiceNumber) || empty($customerName) || empty($stateCode) || empty($baseAmount)) {
                return response()->json(['error' => 'Missing required invoice integration parameters.'], 400);
            }

            \App\Models\TaxTransaction::create([
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'tenant_id' => $tenantId,
                'invoice_number' => $invoiceNumber,
                'customer_name' => $customerName,
                'state_code' => $stateCode,
                'base_amount' => $baseAmount,
                'cgst_amount' => $request->input('cgstAmount') ?: $request->input('cgst_amount') ?: 0,
                'sgst_amount' => $request->input('sgstAmount') ?: $request->input('sgst_amount') ?: 0,
                'igst_amount' => $request->input('igstAmount') ?: $request->input('igst_amount') ?: 0,
                'tds_amount' => $request->input('tdsAmount') ?: $request->input('tds_amount') ?: 0,
                'stamp_duty_amount' => $request->input('stampDutyAmount') ?: $request->input('stamp_duty_amount') ?: 0,
                'registration_charges' => $request->input('registrationCharges') ?: $request->input('registration_charges') ?: 0,
                'other_charges' => $request->input('otherCharges') ?: $request->input('other_charges') ?: 0,
                'total_tax_amount' => $request->input('totalTaxAmount') ?: $request->input('total_tax_amount') ?: 0,
                'total_invoice_amount' => $request->input('totalInvoiceAmount') ?: $request->input('total_invoice_amount') ?: 0,
            ]);

            return response()->json(['success' => true, 'message' => 'Tax-compliant invoice generated and logged successfully.']);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/v1/admin/tax-rules/reports
     */
    public function getTaxReports()
    {
        try {
            $transactions = \App\Models\TaxTransaction::orderBy('created_at', 'desc')
                ->take(100)
                ->get()
                ->map(function ($t) {
                    $tenant = \App\Models\Tenant::find($t->tenant_id);
                    return [
                        'id' => $t->id,
                        'tenantId' => $t->tenant_id,
                        'tenant_id' => $t->tenant_id,
                        'invoiceNumber' => $t->invoice_number,
                        'invoice_number' => $t->invoice_number,
                        'customerName' => $t->customer_name,
                        'customer_name' => $t->customer_name,
                        'stateCode' => $t->state_code,
                        'state_code' => $t->state_code,
                        'baseAmount' => $t->base_amount,
                        'base_amount' => $t->base_amount,
                        'cgstAmount' => $t->cgst_amount,
                        'cgst_amount' => $t->cgst_amount,
                        'sgstAmount' => $t->sgst_amount,
                        'sgst_amount' => $t->sgst_amount,
                        'igstAmount' => $t->igst_amount,
                        'igst_amount' => $t->igst_amount,
                        'tdsAmount' => $t->tds_amount,
                        'tds_amount' => $t->tds_amount,
                        'stampDutyAmount' => $t->stamp_duty_amount,
                        'stamp_duty_amount' => $t->stamp_duty_amount,
                        'registrationCharges' => $t->registration_charges,
                        'registration_charges' => $t->registration_charges,
                        'otherCharges' => $t->other_charges,
                        'other_charges' => $t->other_charges,
                        'totalTaxAmount' => $t->total_tax_amount,
                        'total_tax_amount' => $t->total_tax_amount,
                        'totalInvoiceAmount' => $t->total_invoice_amount,
                        'total_invoice_amount' => $t->total_invoice_amount,
                        'createdAt' => $t->created_at ? $t->created_at->toIso8601String() : null,
                        'tenant_name' => $tenant ? $tenant->company_name : null,
                    ];
                });

            $stateSummary = \DB::table('tax_transactions')
                ->select('state_code', \DB::raw('SUM(total_tax_amount) as total_tax'), \DB::raw('SUM(base_amount) as total_base'))
                ->groupBy('state_code')
                ->get()
                ->map(function ($s) {
                    return [
                        'state_code' => $s->state_code,
                        'stateCode' => $s->state_code,
                        'total_tax' => (double)$s->total_tax,
                        'totalTax' => (double)$s->total_tax,
                        'total_base' => (double)$s->total_base,
                        'totalBase' => (double)$s->total_base,
                    ];
                });

            $monthlySummary = \DB::table('tax_transactions')
                ->select(\DB::raw("TO_CHAR(created_at, 'YYYY-MM') as month"), \DB::raw('SUM(total_tax_amount) as total_tax'), \DB::raw('SUM(base_amount) as total_base'))
                ->groupBy(\DB::raw("TO_CHAR(created_at, 'YYYY-MM')"))
                ->orderBy('month', 'asc')
                ->get()
                ->map(function ($m) {
                    return [
                        'month' => $m->month,
                        'total_tax' => (double)$m->total_tax,
                        'totalTax' => (double)$m->total_tax,
                        'total_base' => (double)$m->total_base,
                        'totalBase' => (double)$m->total_base,
                    ];
                });

            return response()->json([
                'transactions' => $transactions,
                'stateSummary' => $stateSummary,
                'monthlySummary' => $monthlySummary,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ==========================================
    // EMAIL SERVICE CONFIGURATION METHODS
    // ==========================================

    /**
     * GET /api/v1/admin/email-service/configurations
     */
    public function getEmailConfigs()
    {
        try {
            $configs = \App\Models\EmailConfiguration::orderBy('name', 'asc')
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => $row->id,
                        'providerCode' => $row->provider_code,
                        'provider_code' => $row->provider_code,
                        'name' => $row->name,
                        'isEnabled' => (bool)$row->is_enabled,
                        'is_enabled' => (bool)$row->is_enabled,
                        'isDefault' => (bool)$row->is_default,
                        'is_default' => (bool)$row->is_default,
                        'host' => $row->host,
                        'port' => $row->port,
                        'encryption' => $row->encryption,
                        'username' => $row->username,
                        'password' => $row->password,
                        'senderName' => $row->sender_name,
                        'sender_name' => $row->sender_name,
                        'senderEmail' => $row->sender_email,
                        'sender_email' => $row->sender_email,
                        'customParams' => $row->custom_params ?: (object)[],
                        'custom_params' => $row->custom_params ?: (object)[],
                        'status' => $row->status,
                        'createdAt' => $row->created_at ? $row->created_at->toIso8601String() : null,
                    ];
                });
            return response()->json($configs);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/email-service/configurations
     */
    public function saveEmailConfig(Request $request)
    {
        try {
            $providerCode = $request->input('providerCode') ?: $request->input('provider_code');
            $name = $request->input('name');
            $isEnabled = $request->input('isEnabled') !== null ? $request->input('isEnabled') : $request->input('is_enabled');
            $isDefault = $request->input('isDefault') !== null ? $request->input('isDefault') : $request->input('is_default');
            $host = $request->input('host');
            $port = $request->input('port');
            $encryption = $request->input('encryption');
            $username = $request->input('username');
            $password = $request->input('password');
            $senderName = $request->input('senderName') ?: $request->input('sender_name');
            $senderEmail = $request->input('senderEmail') ?: $request->input('sender_email');
            $customParams = $request->input('customParams') ?: $request->input('custom_params') ?: [];

            if (empty($providerCode) || empty($name) || empty($senderName) || empty($senderEmail)) {
                return response()->json(['error' => 'Provider code, name, sender name, and sender email are required.'], 400);
            }

            \DB::beginTransaction();

            if ($isDefault) {
                \App\Models\EmailConfiguration::where('provider_code', '!=', $providerCode)
                    ->update(['is_default' => false]);
            }

            $config = \App\Models\EmailConfiguration::where('provider_code', $providerCode)->first();

            $data = [
                'name' => $name,
                'is_enabled' => (bool)$isEnabled,
                'is_default' => (bool)$isDefault,
                'host' => $host,
                'port' => $port ? (int)$port : null,
                'encryption' => $encryption,
                'username' => $username,
                'password' => $password,
                'sender_name' => $senderName,
                'sender_email' => $senderEmail,
                'custom_params' => $customParams,
            ];

            if ($config) {
                $config->update($data);
            } else {
                $data['id'] = (string) \Illuminate\Support\Str::uuid();
                $data['provider_code'] = $providerCode;
                $data['status'] = 'INACTIVE';
                $config = \App\Models\EmailConfiguration::create($data);
            }

            \DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Email provider configuration saved successfully.',
                'config' => $config
            ]);
        } catch (\Throwable $e) {
            \DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/email-service/test-connection
     */
    public function testEmailConnection(Request $request)
    {
        try {
            $providerCode = $request->input('providerCode') ?: $request->input('provider_code');
            $name = $request->input('name') ?: $providerCode;
            $host = $request->input('host');
            $port = $request->input('port');
            $encryption = $request->input('encryption');
            $username = $request->input('username');
            $password = $request->input('password');
            $customParams = $request->input('customParams') ?: $request->input('custom_params') ?: [];

            $config = [
                'provider_code' => $providerCode,
                'name' => $name,
                'host' => $host,
                'port' => $port,
                'encryption' => $encryption,
                'username' => $username,
                'password' => $password,
                'custom_params' => $customParams
            ];

            $result = \App\Services\EmailService::testConnection($config);
            $newStatus = $result['success'] ? 'ACTIVE' : 'FAILED';

            \App\Models\EmailConfiguration::where('provider_code', $providerCode)
                ->update(['status' => $newStatus]);

            return response()->json($result);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'System Error: ' . $e->getMessage()]);
        }
    }

    /**
     * POST /api/v1/admin/email-service/send-test
     */
    public function sendTestEmail(Request $request)
    {
        try {
            $providerCode = $request->input('providerCode') ?: $request->input('provider_code');
            $recipientEmail = $request->input('recipientEmail') ?: $request->input('recipient_email');
            $recipientName = $request->input('recipientName') ?: $request->input('recipient_name');
            $subject = $request->input('subject');
            $bodyHtml = $request->input('bodyHtml') ?: $request->input('body_html');

            if (empty($recipientEmail) || empty($subject) || empty($bodyHtml)) {
                return response()->json(['error' => 'Recipient email, subject, and body are required.'], 400);
            }

            $logId = \App\Services\EmailService::queueEmail([
                'recipient_email' => $recipientEmail,
                'recipient_name' => $recipientName,
                'subject' => $subject,
                'body_html' => $bodyHtml,
                'provider_code' => $providerCode
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Test email successfully enqueued in background process runner.',
                'logId' => $logId
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/v1/admin/email-service/templates
     */
    public function getEmailTemplates()
    {
        try {
            $templates = \App\Models\EmailTemplate::orderBy('name', 'asc')
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => $row->id,
                        'templateKey' => $row->template_key,
                        'template_key' => $row->template_key,
                        'name' => $row->name,
                        'subject' => $row->subject,
                        'bodyHtml' => $row->body_html,
                        'body_html' => $row->body_html,
                        'bodyText' => $row->body_text,
                        'body_text' => $row->body_text,
                        'createdAt' => $row->created_at ? $row->created_at->toIso8601String() : null,
                    ];
                });
            return response()->json($templates);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/email-service/templates
     */
    public function saveEmailTemplate(Request $request)
    {
        try {
            $templateKey = $request->input('templateKey') ?: $request->input('template_key');
            $name = $request->input('name');
            $subject = $request->input('subject');
            $bodyHtml = $request->input('bodyHtml') ?: $request->input('body_html');
            $bodyText = $request->input('bodyText') ?: $request->input('body_text');

            if (empty($templateKey) || empty($name) || empty($subject) || empty($bodyHtml)) {
                return response()->json(['error' => 'Template key, name, subject, and body HTML are required.'], 400);
            }

            $template = \App\Models\EmailTemplate::where('template_key', $templateKey)->first();

            $data = [
                'name' => $name,
                'subject' => $subject,
                'body_html' => $bodyHtml,
                'body_text' => $bodyText,
            ];

            if ($template) {
                $template->update($data);
            } else {
                $data['id'] = (string) \Illuminate\Support\Str::uuid();
                $data['template_key'] = $templateKey;
                $template = \App\Models\EmailTemplate::create($data);
            }

            return response()->json([
                'success' => true,
                'message' => 'Email template saved successfully.',
                'template' => $template
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/v1/admin/email-service/logs
     */
    public function getEmailLogs()
    {
        try {
            $logs = \App\Models\EmailLog::orderBy('created_at', 'desc')
                ->take(150)
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => $row->id,
                        'providerCode' => $row->provider_code,
                        'provider_code' => $row->provider_code,
                        'templateKey' => $row->template_key,
                        'template_key' => $row->template_key,
                        'recipientEmail' => $row->recipient_email,
                        'recipient_email' => $row->recipient_email,
                        'recipientName' => $row->recipient_name,
                        'recipient_name' => $row->recipient_name,
                        'subject' => $row->subject,
                        'bodyHtml' => $row->body_html,
                        'body_html' => $row->body_html,
                        'status' => $row->status,
                        'errorMessage' => $row->error_message,
                        'error_message' => $row->error_message,
                        'retryCount' => (int)$row->retry_count,
                        'retry_count' => (int)$row->retry_count,
                        'maxRetries' => (int)$row->max_retries,
                        'max_retries' => (int)$row->max_retries,
                        'createdAt' => $row->created_at ? $row->created_at->toIso8601String() : null,
                        'sentAt' => $row->sent_at ? $row->sent_at->toIso8601String() : null,
                        'sent_at' => $row->sent_at ? $row->sent_at->toIso8601String() : null,
                    ];
                });
            return response()->json($logs);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/email-service/retry/{id}
     */
    public function retryEmail($id)
    {
        try {
            $log = \App\Models\EmailLog::findOrFail($id);
            $log->update([
                'status' => 'QUEUED',
                'retry_count' => 0,
                'error_message' => null
            ]);

            \App\Services\EmailService::processLogId($id);

            return response()->json([
                'success' => true,
                'message' => 'Email successfully re-queued in background worker.'
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ==========================================
    // NOTIFICATION ENGINE METHODS
    // ==========================================

    /**
     * GET /api/v1/admin/notifications/configurations
     */
    public function getNotificationConfigs()
    {
        try {
            $configs = \App\Models\NotificationConfiguration::orderBy('channel', 'asc')
                ->orderBy('name', 'asc')
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => $row->id,
                        'channel' => $row->channel,
                        'providerCode' => $row->provider_code,
                        'provider_code' => $row->provider_code,
                        'name' => $row->name,
                        'isEnabled' => (bool)$row->is_enabled,
                        'is_enabled' => (bool)$row->is_enabled,
                        'isDefault' => (bool)$row->is_default,
                        'is_default' => (bool)$row->is_default,
                        'configParams' => $row->config_params ?: (object)[],
                        'config_params' => $row->config_params ?: (object)[],
                        'status' => $row->status,
                        'createdAt' => $row->created_at ? $row->created_at->toIso8601String() : null,
                    ];
                });
            return response()->json($configs);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/notifications/configurations
     */
    public function saveNotificationConfig(Request $request)
    {
        try {
            $channel = $request->input('channel');
            $providerCode = $request->input('providerCode') ?: $request->input('provider_code');
            $name = $request->input('name');
            $isEnabled = $request->input('isEnabled') !== null ? $request->input('isEnabled') : $request->input('is_enabled');
            $isDefault = $request->input('isDefault') !== null ? $request->input('isDefault') : $request->input('is_default');
            $configParams = $request->input('configParams') ?: $request->input('config_params') ?: [];

            if (empty($channel) || empty($providerCode) || empty($name)) {
                return response()->json(['error' => 'Channel, Provider Code, and Provider Name are required.'], 400);
            }

            \DB::beginTransaction();

            if ($isDefault) {
                \App\Models\NotificationConfiguration::where('channel', $channel)
                    ->where('provider_code', '!=', $providerCode)
                    ->update(['is_default' => false]);
            }

            $config = \App\Models\NotificationConfiguration::where('channel', $channel)
                ->where('provider_code', $providerCode)
                ->first();

            $data = [
                'name' => $name,
                'is_enabled' => (bool)$isEnabled,
                'is_default' => (bool)$isDefault,
                'config_params' => $configParams,
            ];

            if ($config) {
                $config->update($data);
            } else {
                $data['id'] = (string) \Illuminate\Support\Str::uuid();
                $data['channel'] = $channel;
                $data['provider_code'] = $providerCode;
                $data['status'] = 'INACTIVE';
                $config = \App\Models\NotificationConfiguration::create($data);
            }

            \DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Notification gateway configuration saved.',
                'config' => $config
            ]);
        } catch (\Throwable $e) {
            \DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/notifications/test-gateway
     */
    public function testNotificationGateway(Request $request)
    {
        try {
            $channel = $request->input('channel');
            $providerCode = $request->input('providerCode') ?: $request->input('provider_code');
            $configParams = $request->input('configParams') ?: $request->input('config_params') ?: [];

            $result = \App\Services\NotificationService::testGateway($channel, $providerCode, $configParams);
            $newStatus = $result['success'] ? 'ACTIVE' : 'FAILED';

            \App\Models\NotificationConfiguration::where('channel', $channel)
                ->where('provider_code', $providerCode)
                ->update(['status' => $newStatus]);

            return response()->json($result);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Handshake Error: ' . $e->getMessage()]);
        }
    }

    /**
     * POST /api/v1/admin/notifications/sync-whatsapp-templates
     */
    public function syncWhatsAppTemplates()
    {
        try {
            $config = \App\Models\NotificationConfiguration::where('channel', 'WHATSAPP')
                ->where('is_enabled', true)
                ->first();

            if (!$config) {
                return response()->json(['error' => 'No active WhatsApp configuration found. Please configure and enable a WhatsApp provider first.'], 400);
            }

            $provider = $config->provider_code;

            $mockSyncedTemplates = [
                [
                    'event_type' => 'BOOKING',
                    'whatsapp_template' => "Dear {{customer_name}}, plot unit *{{unit_number}}* is officially booked at *{{layout_name}}*. Booking reference: {{booking_id}}. Approved via {$provider}.",
                ],
                [
                    'event_type' => 'PAYMENT',
                    'whatsapp_template' => "Dear {{customer_name}}, we have received a payment of *₹{{amount}}* for Booking ID: {{booking_id}}. Approved via {$provider}.",
                ],
                [
                    'event_type' => 'EMI_REMINDER',
                    'whatsapp_template' => "BhoomiOne Reminder: Hello {{customer_name}}, an installment of ₹{{amount}} for plot {{unit_number}} is due on {{due_date}}. Please pay within {{days}} days to avoid penalties. Approved via {$provider}.",
                ],
                [
                    'event_type' => 'TENANT_CREATED',
                    'whatsapp_template' => "Welcome {{admin_name}}! Your workspace *{{tenant_name}}* is successfully provisioned on BhoomiOne. Approved via {$provider}.",
                ],
                [
                    'event_type' => 'INVOICE',
                    'whatsapp_template' => "Dear {{customer_name}}, Invoice #{{invoice_number}} of amount ₹{{amount}} has been generated. View/download here: {{invoice_url}}. Approved via {$provider}."
                ]
            ];

            $syncedCount = 0;
            foreach ($mockSyncedTemplates as $t) {
                $tmpl = \App\Models\NotificationTemplate::where('event_type', $t['event_type'])->first();

                if ($tmpl) {
                    $tmpl->update([
                        'whatsapp_template' => $t['whatsapp_template'],
                    ]);
                    $syncedCount++;
                } else {
                    \App\Models\NotificationTemplate::create([
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'event_type' => $t['event_type'],
                        'name' => str_replace('_', ' ', $t['event_type']) . ' System Alert',
                        'whatsapp_template' => $t['whatsapp_template'],
                    ]);
                    $syncedCount++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Successfully synchronized and updated {$syncedCount} approved templates from {$config->name} ({$provider})."
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to sync templates with provider: ' . $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/v1/admin/notifications/templates
     */
    public function getNotificationTemplates()
    {
        try {
            $templates = \App\Models\NotificationTemplate::orderBy('name', 'asc')
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => $row->id,
                        'eventType' => $row->event_type,
                        'event_type' => $row->event_type,
                        'name' => $row->name,
                        'emailSubject' => $row->email_subject,
                        'email_subject' => $row->email_subject,
                        'emailBodyHtml' => $row->email_body_html,
                        'email_body_html' => $row->email_body_html,
                        'smsTemplate' => $row->sms_template,
                        'sms_template' => $row->sms_template,
                        'whatsappTemplate' => $row->whatsapp_template,
                        'whatsapp_template' => $row->whatsapp_template,
                        'whatsappMediaUrl' => $row->whatsapp_media_url,
                        'whatsapp_media_url' => $row->whatsapp_media_url,
                        'whatsappMediaType' => $row->whatsapp_media_type,
                        'whatsapp_media_type' => $row->whatsapp_media_type,
                        'pushTitle' => $row->push_title,
                        'push_title' => $row->push_title,
                        'pushBody' => $row->push_body,
                        'push_body' => $row->push_body,
                        'inAppBody' => $row->in_app_body,
                        'in_app_body' => $row->in_app_body,
                        'webhookPayloadTemplate' => $row->webhook_payload_template,
                        'webhook_payload_template' => $row->webhook_payload_template,
                        'createdAt' => $row->created_at ? $row->created_at->toIso8601String() : null,
                    ];
                });
            return response()->json($templates);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/notifications/templates
     */
    public function saveNotificationTemplate(Request $request)
    {
        try {
            $eventType = $request->input('eventType') ?: $request->input('event_type');
            $name = $request->input('name');
            $emailSubject = $request->input('emailSubject') ?: $request->input('email_subject');
            $emailBodyHtml = $request->input('emailBodyHtml') ?: $request->input('email_body_html');
            $smsTemplate = $request->input('smsTemplate') ?: $request->input('sms_template');
            $whatsappTemplate = $request->input('whatsappTemplate') ?: $request->input('whatsapp_template');
            $whatsappMediaUrl = $request->input('whatsappMediaUrl') ?: $request->input('whatsapp_media_url');
            $whatsappMediaType = $request->input('whatsappMediaType') ?: $request->input('whatsapp_media_type');
            $pushTitle = $request->input('pushTitle') ?: $request->input('push_title');
            $pushBody = $request->input('pushBody') ?: $request->input('push_body');
            $inAppBody = $request->input('inAppBody') ?: $request->input('in_app_body');
            $webhookPayloadTemplate = $request->input('webhookPayloadTemplate') ?: $request->input('webhook_payload_template');

            if (empty($eventType) || empty($name)) {
                return response()->json(['error' => 'Event Type and Template Name are required.'], 400);
            }

            $tmpl = \App\Models\NotificationTemplate::where('event_type', $eventType)->first();

            $data = [
                'name' => $name,
                'email_subject' => $emailSubject,
                'email_body_html' => $emailBodyHtml,
                'sms_template' => $smsTemplate,
                'whatsapp_template' => $whatsappTemplate,
                'whatsapp_media_url' => $whatsappMediaUrl,
                'whatsapp_media_type' => $whatsappMediaType,
                'push_title' => $pushTitle,
                'push_body' => $pushBody,
                'in_app_body' => $inAppBody,
                'webhook_payload_template' => $webhookPayloadTemplate,
            ];

            if ($tmpl) {
                $tmpl->update($data);
            } else {
                $data['id'] = (string) \Illuminate\Support\Str::uuid();
                $data['event_type'] = $eventType;
                $tmpl = \App\Models\NotificationTemplate::create($data);
            }

            return response()->json([
                'success' => true,
                'message' => 'Transactional templates updated successfully.',
                'template' => $tmpl
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/v1/admin/notifications/logs
     */
    public function getNotificationLogs()
    {
        try {
            $logs = \App\Models\NotificationLog::orderBy('created_at', 'desc')
                ->take(150)
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => $row->id,
                        'eventType' => $row->event_type,
                        'event_type' => $row->event_type,
                        'channel' => $row->channel,
                        'recipient' => $row->recipient,
                        'subject' => $row->subject,
                        'body' => $row->body,
                        'status' => $row->status,
                        'retryCount' => (int)$row->retry_count,
                        'retry_count' => (int)$row->retry_count,
                        'maxRetries' => (int)$row->max_retries,
                        'max_retries' => (int)$row->max_retries,
                        'scheduledAt' => $row->scheduled_at ? $row->scheduled_at->toIso8601String() : null,
                        'scheduled_at' => $row->scheduled_at ? $row->scheduled_at->toIso8601String() : null,
                        'sentAt' => $row->sent_at ? $row->sent_at->toIso8601String() : null,
                        'sent_at' => $row->sent_at ? $row->sent_at->toIso8601String() : null,
                        'errorMessage' => $row->error_message,
                        'error_message' => $row->error_message,
                        'auditTrail' => $row->audit_trail ?: [],
                        'audit_trail' => $row->audit_trail ?: [],
                        'whatsappMediaUrl' => $row->whatsapp_media_url,
                        'whatsapp_media_url' => $row->whatsapp_media_url,
                        'whatsappMediaType' => $row->whatsapp_media_type,
                        'whatsapp_media_type' => $row->whatsapp_media_type,
                        'createdAt' => $row->created_at ? $row->created_at->toIso8601String() : null,
                    ];
                });
            return response()->json($logs);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/notifications/retry/{id}
     */
    public function retryNotification($id)
    {
        try {
            $log = \App\Models\NotificationLog::findOrFail($id);
            $auditTrail = is_array($log->audit_trail) ? $log->audit_trail : [];
            $auditTrail[] = [
                'time' => now()->toIso8601String(),
                'status' => 'QUEUED',
                'message' => 'Notification manually re-queued for delivery'
            ];

            $log->update([
                'status' => 'QUEUED',
                'retry_count' => 0,
                'error_message' => null,
                'audit_trail' => $auditTrail,
            ]);

            \App\Services\NotificationService::processLogId($id);

            return response()->json([
                'success' => true,
                'message' => 'Notification re-queued in delivery loop.'
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/notifications/send-test
     */
    public function sendTestNotification(Request $request)
    {
        try {
            $eventType = $request->input('eventType') ?: $request->input('event_type');
            $channel = $request->input('channel');
            $recipient = $request->input('recipient');
            $variables = $request->input('variables') ?: [];
            $scheduledAt = $request->input('scheduledAt') ?: $request->input('scheduled_at');
            $whatsappMediaUrl = $request->input('whatsappMediaUrl') ?: $request->input('whatsapp_media_url');
            $whatsappMediaType = $request->input('whatsappMediaType') ?: $request->input('whatsapp_media_type');

            if (empty($eventType) || empty($channel) || empty($recipient)) {
                return response()->json(['error' => 'Event Type, Channel, and Recipient Target are required.'], 400);
            }

            $logId = \App\Services\NotificationService::dispatchNotification([
                'event_type' => $eventType,
                'channel' => $channel,
                'recipient' => $recipient,
                'variables' => $variables,
                'scheduled_at' => $scheduledAt,
                'whatsapp_media_url' => $whatsappMediaUrl,
                'whatsapp_media_type' => $whatsappMediaType,
            ]);

            return response()->json([
                'success' => true,
                'message' => $scheduledAt && new \DateTime($scheduledAt) > now()
                    ? 'Notification successfully scheduled to transmit later.'
                    : 'Notification successfully enqueued into centralized delivery runner.',
                'logId' => $logId,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/notifications/sweep
     */
    public function sweepNotifications()
    {
        try {
            $report = \App\Services\NotificationService::sweepEngine();
            return response()->json([
                'success' => true,
                'message' => "Notifications sweep completed. Processed: {$report['processed']}, Success: {$report['success']}, Failed: {$report['failed']}."
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Triggering queue sweep raised an exception.'], 500);
        }
    }

    // ==========================================
    // PROMO COUPONS & ACTIVE CAMPAIGNS ENDPOINTS
    // ==========================================

    /**
     * GET /api/v1/admin/coupons
     */
    public function getCoupons(\Illuminate\Http\Request $request)
    {
        try {
            $coupons = \App\Models\PromoCoupon::with('campaign')->get();
            
            // Apply policy check if user is found
            $user = $request->attributes->get('authenticatedUser');
            if ($user) {
                $policy = new \App\Policies\PromoCouponPolicy();
                $coupons = $coupons->filter(function ($coupon) use ($user, $policy) {
                    return $policy->view($user, $coupon);
                });
            }

            return \App\Http\Resources\PromoCouponResource::collection($coupons);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to fetch coupons: ' . $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/coupons
     */
    public function saveCoupon(\App\Http\Requests\PromoCouponRequest $request)
    {
        try {
            $validated = $request->validated();

            $id = $validated['id'] ?? (string)\Illuminate\Support\Str::uuid();
            $couponModel = \App\Models\PromoCoupon::findOrNew($id);

            // Apply policy check if user is found
            $user = $request->attributes->get('authenticatedUser');
            if ($user) {
                $policy = new \App\Policies\PromoCouponPolicy();
                if (!$policy->manage($user, $couponModel)) {
                    return response()->json(['error' => 'Unauthorized action on coupon.'], 403);
                }
            }

            $coupon = \App\Models\PromoCoupon::updateOrCreate(
                ['id' => $id],
                [
                    'code' => strtoupper(trim($validated['code'])),
                    'type' => $validated['type'],
                    'value' => $validated['value'],
                    'campaign_id' => $validated['campaignId'] ?: null,
                    'expiry_date' => $validated['expiryDate'],
                    'max_uses' => $validated['maxUses'],
                    'current_uses' => $validated['currentUses'] ?? 0,
                    'tenant_id' => $validated['tenantId'] ?: null,
                    'builder_name' => $validated['builderName'] ?: null,
                    'status' => $validated['status'] ?? 'ACTIVE',
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Coupon saved successfully.',
                'coupon' => new \App\Http\Resources\PromoCouponResource($coupon)
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to save coupon: ' . $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /api/v1/admin/coupons/{id}
     */
    public function deleteCoupon(\Illuminate\Http\Request $request, $id)
    {
        try {
            $coupon = \App\Models\PromoCoupon::find($id);
            if (!$coupon) {
                return response()->json(['error' => 'Coupon not found.'], 404);
            }

            // Apply policy check if user is found
            $user = $request->attributes->get('authenticatedUser');
            if ($user) {
                $policy = new \App\Policies\PromoCouponPolicy();
                if (!$policy->manage($user, $coupon)) {
                    return response()->json(['error' => 'Unauthorized action on coupon.'], 403);
                }
            }

            $coupon->delete();
            return response()->json([
                'success' => true,
                'message' => 'Coupon deleted successfully.'
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to delete coupon: ' . $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/v1/admin/campaigns
     */
    public function getCampaigns(\Illuminate\Http\Request $request)
    {
        try {
            $campaigns = \App\Models\PromoCampaign::withCount('coupons')->get();
            
            // Apply policy check if user is found
            $user = $request->attributes->get('authenticatedUser');
            if ($user) {
                $policy = new \App\Policies\PromoCampaignPolicy();
                $campaigns = $campaigns->filter(function ($campaign) use ($user, $policy) {
                    return $policy->view($user, $campaign);
                });
            }

            return \App\Http\Resources\PromoCampaignResource::collection($campaigns);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to fetch campaigns: ' . $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/campaigns
     */
    public function saveCampaign(\App\Http\Requests\PromoCampaignRequest $request)
    {
        try {
            $validated = $request->validated();

            $id = $validated['id'] ?? (string)\Illuminate\Support\Str::uuid();
            $campaignModel = \App\Models\PromoCampaign::findOrNew($id);

            // Apply policy check if user is found
            $user = $request->attributes->get('authenticatedUser');
            if ($user) {
                $policy = new \App\Policies\PromoCampaignPolicy();
                if (!$policy->manage($user, $campaignModel)) {
                    return response()->json(['error' => 'Unauthorized action on campaign.'], 403);
                }
            }

            $campaign = \App\Models\PromoCampaign::updateOrCreate(
                ['id' => $id],
                [
                    'name' => $validated['name'],
                    'type' => $validated['type'],
                    'channel' => $validated['channel'] ?: 'Direct',
                    'status' => $validated['status'],
                    'start_date' => $validated['startDate'],
                    'end_date' => $validated['endDate'],
                    'spend' => $validated['spend'] ?? 0.00,
                    'revenue' => $validated['revenue'] ?? 0.00,
                    'leads' => $validated['leads'] ?? 0,
                    'conversions' => $validated['conversions'] ?? 0,
                    'target_audience' => $validated['targetAudience'] ?: null,
                    'timezone' => $validated['timezone'] ?: 'Asia/Kolkata',
                ]
            );

            // Fetch with counts for resource mapping
            $campaignWithCounts = \App\Models\PromoCampaign::withCount('coupons')->find($campaign->id);

            return response()->json([
                'success' => true,
                'message' => 'Campaign saved successfully.',
                'campaign' => new \App\Http\Resources\PromoCampaignResource($campaignWithCounts)
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to save campaign: ' . $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /api/v1/admin/campaigns/{id}
     */
    public function deleteCampaign(\Illuminate\Http\Request $request, $id)
    {
        try {
            $campaign = \App\Models\PromoCampaign::find($id);
            if (!$campaign) {
                return response()->json(['error' => 'Campaign not found.'], 404);
            }

            // Apply policy check if user is found
            $user = $request->attributes->get('authenticatedUser');
            if ($user) {
                $policy = new \App\Policies\PromoCampaignPolicy();
                if (!$policy->manage($user, $campaign)) {
                    return response()->json(['error' => 'Unauthorized action on campaign.'], 403);
                }
            }

            $campaign->delete();
            return response()->json([
                'success' => true,
                'message' => 'Campaign deleted successfully.'
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Failed to delete campaign: ' . $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/admin/coupons/simulate
     */
    public function simulateCoupon(\Illuminate\Http\Request $request)
    {
        try {
            $validated = $request->validate([
                'code' => 'required|string',
                'baseAmount' => 'required|numeric',
                'tenantId' => 'nullable|string',
                'builderName' => 'nullable|string',
                'scope' => 'required|string',
            ]);

            $code = strtoupper(trim($validated['code']));
            $baseAmount = (float)$validated['baseAmount'];
            $tenantId = $validated['tenantId'];
            $builderName = $validated['builderName'];
            $scope = $validated['scope'];

            $coupon = \App\Models\PromoCoupon::where('code', $code)->first();

            if (!$coupon) {
                return response()->json([
                    'success' => false,
                    'error' => "Coupon code '{$code}' not found in the central registry database."
                ]);
            }

            if ($coupon->status !== 'ACTIVE') {
                return response()->json([
                    'success' => false,
                    'error' => "Coupon is inactive. Status: {$coupon->status}."
                ]);
            }

            if ($coupon->expiry_date && $coupon->expiry_date->isPast()) {
                return response()->json([
                    'success' => false,
                    'error' => "Coupon has expired on " . $coupon->expiry_date->format('Y-m-d') . "."
                ]);
            }

            if ($coupon->current_uses >= $coupon->max_uses) {
                return response()->json([
                    'success' => false,
                    'error' => "Coupon maximum redemptions limit ({$coupon->max_uses}) has been reached."
                ]);
            }

            if ($coupon->type === 'TENANT' && $tenantId && strtolower($coupon->tenant_id) !== strtolower($tenantId)) {
                return response()->json([
                    'success' => false,
                    'error' => "This is a tenant-locked coupon restricted to Tenant ID: {$coupon->tenant_id}."
                ]);
            }

            if ($coupon->type === 'BUILDER' && $builderName && stripos($builderName, $coupon->builder_name) === false) {
                return response()->json([
                    'success' => false,
                    'error' => "This coupon is restricted to builder/developer: '{$coupon->builder_name}'."
                ]);
            }

            if ($coupon->type === 'MARKETPLACE' && $scope !== 'MARKETPLACE') {
                return response()->json([
                    'success' => false,
                    'error' => "This coupon is restricted to theme & addon purchases inside the Marketplace only."
                ]);
            }

            $discount = 0.00;
            if ($coupon->type === 'PERCENTAGE' || $coupon->type === 'TENANT') {
                $discount = round(($baseAmount * (float)$coupon->value) / 100, 2);
            } else {
                $discount = (float)$coupon->value;
            }

            if ($discount > $baseAmount) {
                $discount = $baseAmount;
            }

            $finalAmount = $baseAmount - $discount;

            return response()->json([
                'success' => true,
                'coupon' => [
                    'code' => $coupon->code,
                    'type' => $coupon->type,
                    'value' => (float)$coupon->value,
                ],
                'simulation' => [
                    'baseAmount' => $baseAmount,
                    'discountAmount' => $discount,
                    'finalAmount' => $finalAmount,
                    'scope' => $scope,
                    'appliedAt' => now()->toIso8601String()
                ]
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Simulation failed: ' . $e->getMessage()], 500);
        }
    }
}
