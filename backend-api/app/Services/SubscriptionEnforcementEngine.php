<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use App\Models\TenantSubscription;
use App\Models\TenantAddon;
use App\Models\TenantFeatureOverride;
use App\Models\TenantLimitOverride;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionPlanFeature;
use App\Models\SubscriptionPlanLimit;
use App\Models\SubscriptionAddon;
use App\Models\SubscriptionPlotSlab;
use App\Models\SaasModule;
use App\Models\SaasFeature;

class SubscriptionEnforcementEngine
{
    /**
     * Determine whether the tenant has a subscription or falls back to TRIAL/STARTER.
     */
    public static function getTenantSubscription(string $tenantId): ?TenantSubscription
    {
        return TenantSubscription::where('tenant_id', $tenantId)->first();
    }

    /**
     * Calculate effective features: plan features + addons + feature overrides - disabled overrides.
     * Returns an array of enabled feature codes (fully lowercase matching standard db structure).
     */
    public static function getEffectiveFeatures(string $tenantId): array
    {
        // 1. Check if subscription profile exists
        $sub = self::getTenantSubscription($tenantId);
        
        $starterPlan = null;
        if (!$sub) {
            $starterPlan = SubscriptionPlan::where('plan_code', 'STARTER')->first();
            if (!$starterPlan) {
                // Critical fallback: enable nothing or minimal
                return [];
            }
        }

        $planId = $sub ? $sub->plan_id : $starterPlan->id;

        // 2. Load plan features standard mapped inside Postgres subscription_plan_features joining saas_features
        $planFeatureCodes = DB::table('subscription_plan_features')
            ->join('saas_features', 'subscription_plan_features.feature_id', '=', 'saas_features.id')
            ->where('subscription_plan_features.plan_id', $planId)
            ->where('subscription_plan_features.access_level', 'ENABLED')
            ->pluck('saas_features.code')
            ->map(fn($c) => strtolower($c))
            ->toArray();

        // 3. Load features granted via Assigned Add-ons (e.g., DXF addon translates to DXF features)
        $addonFeatureCodes = [];
        if ($sub) {
            // Find assigned addons
            $assignedAddons = DB::table('tenant_addons')
                ->join('subscription_addons', 'tenant_addons.addon_id', '=', 'subscription_addons.id')
                ->where('tenant_addons.tenant_subscription_id', $sub->id)
                ->where('subscription_addons.status', 'ACTIVE')
                ->select('subscription_addons.code', 'subscription_addons.feature_code', 'subscription_addons.addon_type')
                ->get();

            foreach ($assignedAddons as $assigned) {
                // Modern feature_code mapping: if specific feature_code is set, grant it
                if ($assigned->addon_type === 'FEATURE' && !empty($assigned->feature_code)) {
                    $addonFeatureCodes[] = strtolower($assigned->feature_code);
                }

                // Fallback module-level mapping (for compatibility with legacy seeder codes like 'DXF', 'MAPS')
                $addonCode = strtoupper($assigned->code);
                $matchedFeatures = DB::table('saas_features')
                    ->join('saas_modules', 'saas_features.module_id', '=', 'saas_modules.id')
                    ->where(function($q) use ($addonCode) {
                        $q->where('saas_modules.code', $addonCode)
                          ->orWhere('saas_features.code', 'ILIKE', strtolower($addonCode) . '.%')
                          ->orWhere('saas_modules.code', 'MAPS') // Support alternate naming
                          ->orWhere('saas_modules.code', 'INTERACTIVE_MAP');
                    })
                    ->pluck('saas_features.code')
                    ->map(fn($c) => strtolower($c))
                    ->toArray();

                $addonFeatureCodes = array_merge($addonFeatureCodes, $matchedFeatures);
            }
        }

        // Combine standard baseline features
        $combinedFeatures = array_unique(array_merge($planFeatureCodes, $addonFeatureCodes));

        // Let's create an associative key array for easy toggling
        $featuresMap = [];
        foreach ($combinedFeatures as $cCode) {
            $featuresMap[$cCode] = true;
        }

        // 4. Load dynamic custom feature overrides (Overriding takes ABSOLUTE precedence)
        if ($sub) {
            $overrides = DB::table('tenant_feature_overrides')
                ->join('saas_features', 'tenant_feature_overrides.feature_id', '=', 'saas_features.id')
                ->where('tenant_feature_overrides.tenant_subscription_id', $sub->id)
                ->select('saas_features.code', 'tenant_feature_overrides.override_status')
                ->get();

            foreach ($overrides as $o) {
                $code = strtolower($o->code);
                if ($o->override_status === 'ENABLED') {
                    $featuresMap[$code] = true;
                } elseif ($o->override_status === 'DISABLED') {
                    $featuresMap[$code] = false;
                }
            }
        }

        // Return only the enabled feature codes
        $result = [];
        foreach ($featuresMap as $code => $enabled) {
            if ($enabled) {
                $result[] = $code;
            }
        }

        return $result;
    }

    /**
     * Check if a specific feature code is active.
     * Supports both general module codes (e.g., 'DXF', 'MAPS') and precise dot codes (e.g., 'dxf.manage').
     */
    public static function hasFeature(string $tenantId, string $featureCode): bool
    {
        $activeFeatures = self::getEffectiveFeatures($tenantId);
        $cleanSearch = strtolower($featureCode);

        // Standard direct match
        if (in_array($cleanSearch, $activeFeatures)) {
            return true;
        }

        // Expand matching to handle module synonyms (MAPS vs INTERACTIVE_MAP)
        if ($cleanSearch === 'maps' || $cleanSearch === 'interactive_map') {
            if (in_array('interactive_map.view', $activeFeatures) || 
                in_array('interactive_map.manage', $activeFeatures) ||
                in_array('maps.view', $activeFeatures) || 
                in_array('maps.manage', $activeFeatures)) {
                return true;
            }
        }

        // If search code is general (e.g. 'DXF'), see if there's any matching child features enabled (e.g. dxf.view)
        if (!str_contains($cleanSearch, '.')) {
            foreach ($activeFeatures as $actf) {
                if (str_starts_with($actf, $cleanSearch . '.')) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Calculate effective limits: Plan limits + Purchased Capacity Add-on increment + Limit Overrides. No mock data.
     */
    public static function getEffectiveLimits(string $tenantId): array
    {
        $sub = self::getTenantSubscription($tenantId);
        
        $starterPlan = null;
        if (!$sub) {
            $starterPlan = SubscriptionPlan::where('plan_code', 'STARTER')->first();
            if (!$starterPlan) {
                // Critical fallback standard limit values
                return [
                    'projectsLimit' => 1,
                    'layoutsLimit' => 5,
                    'plotsLimit' => 150,
                    'usersLimit' => 3,
                    'fileStorageGb' => 2,
                    'apiRequestsLimit' => 1000
                ];
            }
        }

        $planId = $sub ? $sub->plan_id : $starterPlan->id;

        // Query baseline plan limits from Postgres subscription_plan_limits table
        $baselineLimits = DB::table('subscription_plan_limits')
            ->where('plan_id', $planId)
            ->pluck('limit_value', 'limit_key')
            ->toArray();

        // Standardize limit keys mapping
        $limits = [
            'projectsLimit' => (int) ($baselineLimits['projectsLimit'] ?? 1),
            'layoutsLimit' => (int) ($baselineLimits['layoutsLimit'] ?? 5),
            'plotsLimit' => (int) ($baselineLimits['plotsLimit'] ?? 150),
            'usersLimit' => (int) ($baselineLimits['usersLimit'] ?? 3),
            'fileStorageGb' => (int) ($baselineLimits['fileStorageGb'] ?? 2),
            'apiRequestsLimit' => (int) ($baselineLimits['apiRequestsLimit'] ?? 1000)
        ];

        // Apply purchased capacity add-ons (adds limit_increment)
        if ($sub) {
            $capacityAddons = DB::table('tenant_addons')
                ->join('subscription_addons', 'tenant_addons.addon_id', '=', 'subscription_addons.id')
                ->where('tenant_addons.tenant_subscription_id', $sub->id)
                ->where('subscription_addons.status', 'ACTIVE')
                ->where('subscription_addons.addon_type', 'CAPACITY')
                ->whereNotNull('subscription_addons.limit_key')
                ->whereNotNull('subscription_addons.limit_increment')
                ->select('subscription_addons.limit_key', 'subscription_addons.limit_increment')
                ->get();

            foreach ($capacityAddons as $ca) {
                $key = $ca->limit_key;
                $inc = (int) $ca->limit_increment;

                if (array_key_exists($key, $limits)) {
                    $limits[$key] += $inc;
                } else {
                    foreach (array_keys($limits) as $lKey) {
                        if (strtolower($lKey) === strtolower($key)) {
                            $limits[$lKey] += $inc;
                        }
                    }
                }
            }
        }

        // Apply custom limit overrides (from tenant_limit_overrides), which take absolute precedence
        if ($sub) {
            $overrides = DB::table('tenant_limit_overrides')
                ->where('tenant_subscription_id', $sub->id)
                ->pluck('override_value', 'limit_key')
                ->toArray();

            foreach ($overrides as $key => $overrideVal) {
                // Support exact matches and standard case variation checks
                if (array_key_exists($key, $limits)) {
                    $limits[$key] = (int) $overrideVal;
                } else {
                    // Try to match lowercase or camelCase variants
                    foreach (array_keys($limits) as $lKey) {
                        if (strtolower($lKey) === strtolower($key)) {
                            $limits[$lKey] = (int) $overrideVal;
                        }
                    }
                }
            }
        }

        return $limits;
    }

    /**
     * Get effective limit for a single key.
     */
    public static function getEffectiveLimit(string $tenantId, string $limitKey): int
    {
        $limits = self::getEffectiveLimits($tenantId);
        
        // Match key directly
        if (array_key_exists($limitKey, $limits)) {
            return $limits[$limitKey];
        }

        // Match case-insensitive variations
        foreach ($limits as $k => $v) {
            if (strtolower($k) === strtolower($limitKey) || 
                strtolower($k) . 'limit' === strtolower($limitKey) ||
                strtolower($k) === strtolower($limitKey) . 'limit' ||
                (strtolower($k) === 'filestoragegb' && strtolower($limitKey) === 'storagegb')) {
                return $v;
            }
        }

        return 0;
    }

    /**
     * Determine active billing slab based on active plot density.
     */
    public static function getPlotBillingSlab(int $plotsCount): array
    {
        // Query from DB table subscription_plot_slabs
        $slab = DB::table('subscription_plot_slabs')
            ->where('status', 'ACTIVE')
            ->where('min_plots', '<=', $plotsCount)
            ->where('max_plots', '>=', $plotsCount)
            ->first();

        if ($slab) {
            return [
                'slab_range' => "{$slab->min_plots}-" . ($slab->max_plots > 99999 ? "500+" : $slab->max_plots),
                'monthly_price' => (float) $slab->monthly_price,
                'yearly_price' => (float) $slab->yearly_price
            ];
        }

        // Hardcoded standard fallback slabs to prevent empty nodes
        if ($plotsCount <= 50) {
            return ['slab_range' => '1-50', 'monthly_price' => 50.00, 'yearly_price' => 500.00];
        } elseif ($plotsCount <= 100) {
            return ['slab_range' => '51-100', 'monthly_price' => 100.00, 'yearly_price' => 1000.00];
        } elseif ($plotsCount <= 250) {
            return ['slab_range' => '101-250', 'monthly_price' => 200.00, 'yearly_price' => 2000.00];
        } elseif ($plotsCount <= 500) {
            return ['slab_range' => '251-500', 'monthly_price' => 400.00, 'yearly_price' => 4000.00];
        } else {
            return ['slab_range' => '500+', 'monthly_price' => 800.00, 'yearly_price' => 8000.00];
        }
    }

    /**
     * Track all active resource usages per tenant from live PostgreSQL tables. No mocks.
     */
    public static function getUsage(string $tenantId): array
    {
        // 1. Count projects
        $projectsCount = DB::table('projects')->where('tenant_id', $tenantId)->count();

        // 2. Count layouts
        $layoutsCount = DB::table('layouts')
            ->join('projects', 'layouts.project_id', '=', 'projects.id')
            ->where('projects.tenant_id', $tenantId)
            ->count();

        // 3. Count plots
        $plotsCount = DB::table('plots')
            ->join('layouts', 'plots.layout_id', '=', 'layouts.id')
            ->join('projects', 'layouts.project_id', '=', 'projects.id')
            ->where('projects.tenant_id', $tenantId)
            ->count();

        // 4. Count users
        $usersCount = DB::table('tenant_users')->where('tenant_id', $tenantId)->count();

        // 5. Storage used in GB (summing all uploaded dxf_files)
        $storageBytes = DB::table('dxf_files')->where('tenant_id', $tenantId)->sum('file_size') ?? 0;
        $storageUsedGb = round($storageBytes / (1024 * 1024 * 1024), 4);

        return [
            'projects_count' => $projectsCount,
            'layouts_count' => $layoutsCount,
            'plots_count' => $plotsCount,
            'users_count' => $usersCount,
            'storage_used_gb' => $storageUsedGb,
        ];
    }

    /**
     * Core Limit Check Validator. Throws Exception("LIMIT_EXCEEDED") if threshold breached.
     */
    public static function checkLimit(string $tenantId, string $limitKey, int $additionalQty = 1): void
    {
        // Get limits and usage
        $limits = self::getEffectiveLimits($tenantId);
        $usage = self::getUsage($tenantId);

        // Normalize keys
        $limitVal = 0;
        $currentUsage = 0;

        $keySearch = strtolower($limitKey);
        if ($keySearch === 'projects' || $keySearch === 'projectslimit') {
            $limitVal = $limits['projectsLimit'];
            $currentUsage = $usage['projects_count'];
        } elseif ($keySearch === 'layouts' || $keySearch === 'layoutslimit') {
            $limitVal = $limits['layoutsLimit'];
            $currentUsage = $usage['layouts_count'];
        } elseif ($keySearch === 'plots' || $keySearch === 'plotslimit') {
            $limitVal = $limits['plotsLimit'];
            $currentUsage = $usage['plots_count'];
        } elseif ($keySearch === 'users' || $keySearch === 'userslimit') {
            $limitVal = $limits['usersLimit'];
            $currentUsage = $usage['users_count'];
        } elseif ($keySearch === 'storage' || $keySearch === 'storage_gb' || $keySearch === 'filestoragegb') {
            $limitVal = $limits['fileStorageGb'];
            $currentUsage = $usage['storage_used_gb'];
            // Since active size is sum of dxf_files in bytes, $additionalQty is in bytes.
            // Convert to GB:
            $additionalQtyGb = $additionalQty / (1024 * 1024 * 1024);
            if (($currentUsage + $additionalQtyGb) > $limitVal) {
                throw new \Exception("LIMIT_EXCEEDED");
            }
            return;
        }

        if (($currentUsage + $additionalQty) > $limitVal) {
            throw new \Exception("LIMIT_EXCEEDED");
        }
    }
}
