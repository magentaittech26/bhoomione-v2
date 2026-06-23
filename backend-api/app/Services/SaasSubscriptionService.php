<?php

namespace App\Services;

use App\Models\SaasModule;
use App\Models\SaasFeature;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionPlanFeature;
use App\Models\SubscriptionPlanLimit;
use App\Models\SubscriptionAddon;
use App\Models\SubscriptionPlotSlab;
use App\Models\TenantSubscription;
use App\Models\TenantAddon;
use App\Models\TenantFeatureOverride;
use App\Models\TenantLimitOverride;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class SaasSubscriptionService
{
    /**
     * Retrieve all modules and child features.
     */
    public static function getModules()
    {
        return SaasModule::with('features')->orderBy('sort_order')->get();
    }

    /**
     * Create or Update a SaaS Module.
     */
    public static function saveModule(array $data, array $context): SaasModule
    {
        $moduleId = $data['id'] ?? (string) Str::uuid();
        $module = SaasModule::updateOrCreate(
            ['id' => $moduleId],
            [
                'code' => strtoupper($data['code']),
                'name' => $data['name'],
                'group' => $data['group'] ?? 'General',
                'description' => $data['description'] ?? null,
                'status' => $data['status'] ?? 'ACTIVE',
                'is_core' => (bool) ($data['is_core'] ?? false),
                'is_billable' => (bool) ($data['is_billable'] ?? false),
                'sort_order' => (int) ($data['sort_order'] ?? 10),
            ]
        );

        AuditLogService::log([
            'userId' => $context['userId'] ?? null,
            'entityName' => 'SaasModule',
            'entityId' => $module->id,
            'action' => isset($data['id']) ? 'MODULE_UPDATE_SUCCESS' : 'MODULE_CREATE_SUCCESS',
            'newValues' => $module->toArray(),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return $module;
    }

    /**
     * Create or Update a SaaS Feature.
     */
    public static function saveFeature(array $data, array $context): SaasFeature
    {
        $featureId = $data['id'] ?? (string) Str::uuid();
        $feature = SaasFeature::updateOrCreate(
            ['id' => $featureId],
            [
                'module_id' => $data['module_id'],
                'code' => strtoupper($data['code']),
                'name' => $data['name'],
                'group' => $data['group'] ?? 'General',
                'description' => $data['description'] ?? null,
                'status' => $data['status'] ?? 'ACTIVE',
                'default_enabled' => (bool) ($data['default_enabled'] ?? false),
            ]
        );

        AuditLogService::log([
            'userId' => $context['userId'] ?? null,
            'entityName' => 'SaasFeature',
            'entityId' => $feature->id,
            'action' => isset($data['id']) ? 'FEATURE_UPDATE_SUCCESS' : 'FEATURE_CREATE_SUCCESS',
            'newValues' => $feature->toArray(),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return $feature;
    }

    /**
     * Retrieve all pricing plans with limits and feature matrices.
     */
    public static function getPlans()
    {
        return SubscriptionPlan::with(['planFeatures.feature', 'planLimits'])->orderBy('sort_order')->get();
    }

    /**
     * Create or update a pricing plan.
     */
    public static function savePlan(array $data, array $context): SubscriptionPlan
    {
        return DB::transaction(function () use ($data, $context) {
            $planId = $data['id'] ?? (string) Str::uuid();
            
            $plan = SubscriptionPlan::updateOrCreate(
                ['id' => $planId],
                [
                    'plan_code' => strtoupper($data['plan_code']),
                    'name' => $data['name'],
                    'monthly_price' => $data['monthly_price'],
                    'yearly_price' => $data['yearly_price'],
                    'trial_days' => $data['trial_days'] ?? 14,
                    'status' => $data['status'] ?? 'ACTIVE',
                    'sort_order' => $data['sort_order'] ?? 10,
                ]
            );

            // Save limits mapping
            if (isset($data['limits'])) {
                SubscriptionPlanLimit::where('plan_id', $plan->id)->delete();
                foreach ($data['limits'] as $key => $val) {
                    SubscriptionPlanLimit::create([
                        'id' => (string) Str::uuid(),
                        'plan_id' => $plan->id,
                        'limit_key' => $key,
                        'limit_value' => $val,
                    ]);
                }
            }

            // Save features matrix
            if (isset($data['features'])) {
                SubscriptionPlanFeature::where('plan_id', $plan->id)->delete();
                foreach ($data['features'] as $featureId) {
                    SubscriptionPlanFeature::create([
                        'id' => (string) Str::uuid(),
                        'plan_id' => $plan->id,
                        'feature_id' => $featureId,
                        'access_level' => 'ENABLED',
                    ]);
                }
            }

            // Audit
            AuditLogService::log([
                'userId' => $context['userId'] ?? null,
                'entityName' => 'SubscriptionPlan',
                'entityId' => $plan->id,
                'action' => isset($data['id']) ? 'PLAN_UPDATE_SUCCESS' : 'PLAN_CREATE_SUCCESS',
                'newValues' => $plan->toArray(),
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $plan;
        });
    }

    /**
     * Retrieve all dynamic addons.
     */
    public static function getAddons()
    {
        return SubscriptionAddon::all();
    }

    /**
     * Create or Update an Addon
     */
    public static function saveAddon(array $data, array $context): SubscriptionAddon
    {
        $addonId = $data['id'] ?? (string) Str::uuid();
        $addon = SubscriptionAddon::updateOrCreate(
            ['id' => $addonId],
            [
                'code' => strtoupper($data['code']),
                'name' => $data['name'],
                'monthly_price' => $data['monthly_price'],
                'yearly_price' => $data['yearly_price'],
                'description' => $data['description'] ?? null,
                'status' => $data['status'] ?? 'ACTIVE',
            ]
        );

        AuditLogService::log([
            'userId' => $context['userId'] ?? null,
            'entityName' => 'SubscriptionAddon',
            'entityId' => $addon->id,
            'action' => isset($data['id']) ? 'ADDON_UPDATE_SUCCESS' : 'ADDON_CREATE_SUCCESS',
            'newValues' => $addon->toArray(),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return $addon;
    }

    /**
     * Retrieve plot slabs.
     */
    public static function getPlotSlabs()
    {
        return SubscriptionPlotSlab::orderBy('min_plots')->get();
    }

    /**
     * Create or Update Plot Slab
     */
    public static function savePlotSlab(array $data, array $context): SubscriptionPlotSlab
    {
        $slabId = $data['id'] ?? (string) Str::uuid();
        $slab = SubscriptionPlotSlab::updateOrCreate(
            ['id' => $slabId],
            [
                'min_plots' => $data['min_plots'],
                'max_plots' => $data['max_plots'],
                'monthly_price' => $data['monthly_price'],
                'yearly_price' => $data['yearly_price'],
                'status' => $data['status'] ?? 'ACTIVE',
            ]
        );

        AuditLogService::log([
            'userId' => $context['userId'] ?? null,
            'entityName' => 'SubscriptionPlotSlab',
            'entityId' => $slab->id,
            'action' => isset($data['id']) ? 'PLOT_SLAB_UPDATE_SUCCESS' : 'PLOT_SLAB_CREATE_SUCCESS',
            'newValues' => $slab->toArray(),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return $slab;
    }

    /**
     * Get a tenant's complete subscription status profile.
     */
    public static function getTenantSubscriptionProfile(string $tenantId)
    {
        $sub = TenantSubscription::with([
            'plan.planLimits',
            'plan.planFeatures.feature',
            'addons.addon',
            'featureOverrides.feature',
            'limitOverrides',
            'billingOverride'
        ])->where('tenant_id', $tenantId)->first();

        // If no active subscription exists, construct a default dynamic trial tier response
        if (!$sub) {
            $defaultPlan = SubscriptionPlan::where('plan_code', 'STARTER')->first();
            return [
                'has_subscription' => false,
                'status' => 'PENDING_SUBSCRIPTION',
                'plan_id' => $defaultPlan ? $defaultPlan->id : null,
                'plan' => $defaultPlan,
                'addons' => [],
                'feature_overrides' => [],
                'limit_overrides' => [],
                'billing_override' => null
            ];
        }

        return [
            'has_subscription' => true,
            'id' => $sub->id,
            'tenant_id' => $sub->tenant_id,
            'plan_id' => $sub->plan_id,
            'status' => $sub->status,
            'subscription_start_date' => $sub->subscription_start_date->format('Y-m-d'),
            'subscription_expiry_date' => $sub->subscription_expiry_date->format('Y-m-d'),
            'trial_expiry_date' => $sub->trial_expiry_date ? $sub->trial_expiry_date->format('Y-m-d') : null,
            'renewal_date' => $sub->renewal_date ? $sub->renewal_date->format('Y-m-d') : null,
            'plan' => $sub->plan,
            'addons' => $sub->addons,
            'feature_overrides' => $sub->featureOverrides,
            'limit_overrides' => $sub->limitOverrides,
            'billing_override' => $sub->billingOverride,
        ];
    }

    /**
     * Assign / change plan subscription for a tenant.
     */
    public static function assignTenantSubscription(string $tenantId, array $data, array $context): TenantSubscription
    {
        return DB::transaction(function () use ($tenantId, $data, $context) {
            $plan = SubscriptionPlan::findOrFail($data['plan_id']);
            $startDate = $data['start_date'] ?? date('Y-m-d');
            
            // Calculate expiry based on period or seeder trial settings
            $months = ($data['billing_period'] ?? 'MONTHLY') === 'YEARLY' ? 12 : 1;
            $expiryDate = date('Y-m-d', strtotime("+$months months", strtotime($startDate)));

            $sub = TenantSubscription::updateOrCreate(
                ['tenant_id' => $tenantId],
                [
                    'id' => TenantSubscription::where('tenant_id', $tenantId)->value('id') ?? (string) Str::uuid(),
                    'plan_id' => $plan->id,
                    'status' => $data['status'] ?? 'ACTIVE',
                    'subscription_start_date' => $startDate,
                    'subscription_expiry_date' => $expiryDate,
                    'trial_expiry_date' => isset($data['trial_days']) ? date('Y-m-d', strtotime("+{$data['trial_days']} days", strtotime($startDate))) : null,
                    'renewal_date' => $expiryDate,
                ]
            );

            // Audit
            AuditLogService::log([
                'userId' => $context['userId'] ?? null,
                'entityName' => 'TenantSubscription',
                'entityId' => $sub->id,
                'tenantId' => $tenantId,
                'action' => 'SUBSCRIPTION_CHANGE_SUCCESS',
                'newValues' => $sub->toArray(),
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $sub;
        });
    }

    /**
     * Mutate tenant lifecycle subscription status
     */
    public static function updateLifecycle(string $tenantId, string $status, array $context): TenantSubscription
    {
        $sub = TenantSubscription::where('tenant_id', $tenantId)->firstOrFail();
        $oldValues = $sub->toArray();
        
        $sub->status = strtoupper($status); // SUSPENDED, ACTIVE, ARCHIVED, EXPIRED
        $sub->save();

        AuditLogService::log([
            'userId' => $context['userId'] ?? null,
            'entityName' => 'TenantSubscription',
            'entityId' => $sub->id,
            'tenantId' => $tenantId,
            'action' => 'SUBSCRIPTION_LIFECYCLE_MUTATION_' . $sub->status,
            'oldValues' => $oldValues,
            'newValues' => $sub->toArray(),
            'ipAddress' => $context['ip'] ?? null,
            'userAgent' => $context['userAgent'] ?? null,
        ]);

        return $sub;
    }

    /**
     * Apply dynamic custom overrides (features, limits, and helper addons) to tenant subscription
     */
    public static function saveOverrides(string $tenantId, array $data, array $context): TenantSubscription
    {
        return DB::transaction(function () use ($tenantId, $data, $context) {
            $sub = TenantSubscription::where('tenant_id', $tenantId)->firstOrFail();

            // 1. Process limits overrides
            if (isset($data['limit_overrides'])) {
                TenantLimitOverride::where('tenant_subscription_id', $sub->id)->delete();
                foreach ($data['limit_overrides'] as $key => $val) {
                    if ($val !== null) {
                        TenantLimitOverride::create([
                            'id' => (string) Str::uuid(),
                            'tenant_subscription_id' => $sub->id,
                            'limit_key' => $key,
                            'override_value' => (int) $val,
                        ]);
                    }
                }
            }

            // 2. Process features overrides
            if (isset($data['feature_overrides'])) {
                TenantFeatureOverride::where('tenant_subscription_id', $sub->id)->delete();
                foreach ($data['feature_overrides'] as $featId => $overrideStatus) {
                    TenantFeatureOverride::create([
                        'id' => (string) Str::uuid(),
                        'tenant_subscription_id' => $sub->id,
                        'feature_id' => $featId,
                        'override_status' => $overrideStatus, // ENABLED, DISABLED
                    ]);
                }
            }

            // 3. Process assigned addons
            if (isset($data['addons'])) {
                TenantAddon::where('tenant_subscription_id', $sub->id)->delete();
                foreach ($data['addons'] as $addonId) {
                    TenantAddon::create([
                        'id' => (string) Str::uuid(),
                        'tenant_subscription_id' => $sub->id,
                        'addon_id' => $addonId,
                        'assigned_at' => now(),
                    ]);
                }
            }

            // 4. Process billing overrides
            if (isset($data['billing_override'])) {
                $bo = $data['billing_override'];
                \App\Models\TenantBillingOverride::updateOrCreate(
                    ['tenant_subscription_id' => $sub->id],
                    [
                        'id' => \App\Models\TenantBillingOverride::where('tenant_subscription_id', $sub->id)->value('id') ?? (string) Str::uuid(),
                        'custom_monthly_fee' => isset($bo['custom_monthly_fee']) ? (float) $bo['custom_monthly_fee'] : null,
                        'custom_annual_fee' => isset($bo['custom_annual_fee']) ? (float) $bo['custom_annual_fee'] : null,
                        'custom_discount_percentage' => isset($bo['custom_discount_percentage']) ? (float) $bo['custom_discount_percentage'] : 0.00,
                        'special_contract_notes' => $bo['special_contract_notes'] ?? null,
                    ]
                );
            }

            AuditLogService::log([
                'userId' => $context['userId'] ?? null,
                'entityName' => 'TenantSubscription',
                'entityId' => $sub->id,
                'tenantId' => $tenantId,
                'action' => 'SUBSCRIPTION_OVERRIDES_UPDATE',
                'newValues' => $data,
                'ipAddress' => $context['ip'] ?? null,
                'userAgent' => $context['userAgent'] ?? null,
            ]);

            return $sub;
        });
    }
}
