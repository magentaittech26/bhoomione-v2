<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\SaasModule;
use App\Models\SaasFeature;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionPlanFeature;
use App\Models\SubscriptionPlanLimit;
use App\Models\SubscriptionAddon;
use App\Models\SubscriptionPlotSlab;

class SaasSubscriptionSeeder extends Seeder
{
    /**
     * Run the seeder.
     */
    public function run(): void
    {
        // 1. Core Modules Seed
        $modulesData = [
            ['code' => 'PROJECTS', 'name' => 'Projects Module', 'group' => 'Core Development', 'description' => 'Real estate development project registration, detail logs & RERA tracking', 'is_core' => true, 'is_billable' => true],
            ['code' => 'LAYOUTS', 'name' => 'Layouts Module', 'group' => 'Core Development', 'description' => 'Layout mapping, plotting, sector configuration and geographic planning', 'is_core' => true, 'is_billable' => true],
            ['code' => 'PLOTS', 'name' => 'Plots Parser', 'group' => 'Core Development', 'description' => 'Detailed plot bounds modeling, dimensions scaling and status assignment', 'is_core' => true, 'is_billable' => true],
            ['code' => 'CUSTOMERS', 'name' => 'Customers CRM', 'group' => 'CRM & Leads', 'description' => 'Comprehensive client portfolio profiles, tracking historical interactions', 'is_core' => false, 'is_billable' => true],
            ['code' => 'AGENTS', 'name' => 'Agents Catalog', 'group' => 'Brokerage Nets', 'description' => 'Broker rosters, agency validation pipelines and commission contracts', 'is_core' => false, 'is_billable' => true],
            ['code' => 'LEADS', 'name' => 'Leads Engine', 'group' => 'CRM & Leads', 'description' => 'Omni-channel sales pipeline monitoring and performance matrixing', 'is_core' => false, 'is_billable' => true],
            ['code' => 'BOOKINGS', 'name' => 'Bookings Gateway', 'group' => 'Billing & Ledger', 'description' => 'Virtual parcel reservation, custom pricing matrices and checkout schedules', 'is_core' => false, 'is_billable' => true],
            ['code' => 'COLLECTIONS', 'name' => 'Collections Vault', 'group' => 'Billing & Ledger', 'description' => 'Installments ledger management, automation receipts and custom invoicing', 'is_core' => false, 'is_billable' => true],
            ['code' => 'DXF', 'name' => 'Heavy CAD Parser', 'group' => 'Platform Integrations', 'description' => 'High-precision DXF layers ingestion, geometric node analysis and parsing', 'is_core' => false, 'is_billable' => true],
            ['code' => 'INTERACTIVE_MAP', 'name' => 'Interactive Mapper', 'group' => 'Platform Integrations', 'description' => 'Real-time interactive SVG plot mapping overlay and geographic analytics', 'is_core' => false, 'is_billable' => true],
            ['code' => 'MARKETPLACE', 'name' => 'Marketplace Listing', 'group' => 'Brokerage Nets', 'description' => 'Public-facing property catalogs, search gateways and social landing', 'is_core' => false, 'is_billable' => true],
            ['code' => 'CUSTOMER_PORTAL', 'name' => 'Customer Portal', 'group' => 'External Portals', 'description' => 'Self-service consumer ledger, payment receipt access and milestone updates', 'is_core' => false, 'is_billable' => true],
            ['code' => 'AGENT_PORTAL', 'name' => 'Agent Portal Area', 'group' => 'External Portals', 'description' => 'External advisor dashboard, commission payout records and booking tools', 'is_core' => false, 'is_billable' => true],
        ];

        $moduleModels = [];
        $featureModels = [];

        foreach ($modulesData as $index => $m) {
            $module = SaasModule::updateOrCreate(
                ['code' => $m['code']],
                [
                    'id' => SaasModule::where('code', $m['code'])->value('id') ?? (string) Str::uuid(),
                    'name' => $m['name'],
                    'group' => $m['group'],
                    'description' => $m['description'],
                    'is_core' => $m['is_core'],
                    'is_billable' => $m['is_billable'],
                    'sort_order' => ($index + 1) * 10,
                    'status' => 'ACTIVE'
                ]
            );
            $moduleModels[$m['code']] = $module;

            // Seed 2 child features per module (View and Manage)
            $fViewCode = strtolower($m['code']) . '.view';
            $fView = SaasFeature::updateOrCreate(
                ['code' => $fViewCode],
                [
                    'id' => SaasFeature::where('code', $fViewCode)->value('id') ?? (string) Str::uuid(),
                    'module_id' => $module->id,
                    'name' => 'View ' . $m['name'],
                    'group' => $m['group'],
                    'description' => 'Authorize viewing records for module ' . $m['code'],
                    'status' => 'ACTIVE',
                    'default_enabled' => true
                ]
            );
            
            $fManageCode = strtolower($m['code']) . '.manage';
            $fManage = SaasFeature::updateOrCreate(
                ['code' => $fManageCode],
                [
                    'id' => SaasFeature::where('code', $fManageCode)->value('id') ?? (string) Str::uuid(),
                    'module_id' => $module->id,
                    'name' => 'Manage ' . $m['name'],
                    'group' => $m['group'],
                    'description' => 'Authorize writing/updating records for module ' . $m['code'],
                    'status' => 'ACTIVE',
                    'default_enabled' => !($m['is_core'] === false) // non-core starts off-limit for sub tiers
                ]
            );

            $featureModels[$m['code'] . '_VIEW'] = $fView;
            $featureModels[$m['code'] . '_MANAGE'] = $fManage;
        }

        // 2. Pricing Plans Seed
        $plansData = [
            [
                'plan_code' => 'STARTER',
                'name' => 'Starter Plan',
                'monthly_price' => 99.00,
                'yearly_price' => 990.00,
                'trial_days' => 14,
                'sort_order' => 10,
                'limits' => [
                    'projectsLimit' => 1,
                    'layoutsLimit' => 5,
                    'plotsLimit' => 150,
                    'usersLimit' => 3,
                    'fileStorageGb' => 2,
                    'apiRequestsLimit' => 1000
                ],
                'enabled_features' => [
                    'PROJECTS_VIEW', 'PROJECTS_MANAGE',
                    'LAYOUTS_VIEW', 'LAYOUTS_MANAGE',
                    'PLOTS_VIEW', 'PLOTS_MANAGE'
                ]
            ],
            [
                'plan_code' => 'GROWTH',
                'name' => 'Growth Scale Plan',
                'monthly_price' => 249.00,
                'yearly_price' => 2490.00,
                'trial_days' => 14,
                'sort_order' => 20,
                'limits' => [
                    'projectsLimit' => 3,
                    'layoutsLimit' => 15,
                    'plotsLimit' => 1000,
                    'usersLimit' => 10,
                    'fileStorageGb' => 10,
                    'apiRequestsLimit' => 10000
                ],
                'enabled_features' => [
                    'PROJECTS_VIEW', 'PROJECTS_MANAGE',
                    'LAYOUTS_VIEW', 'LAYOUTS_MANAGE',
                    'PLOTS_VIEW', 'PLOTS_MANAGE',
                    'CUSTOMERS_VIEW', 'CUSTOMERS_MANAGE',
                    'LEADS_VIEW', 'LEADS_MANAGE',
                    'DXF_VIEW', 'DXF_MANAGE'
                ]
            ],
            [
                'plan_code' => 'PROFESSIONAL',
                'name' => 'Professional Enterprise',
                'monthly_price' => 499.00,
                'yearly_price' => 4990.00,
                'trial_days' => 30,
                'sort_order' => 30,
                'limits' => [
                    'projectsLimit' => 10,
                    'layoutsLimit' => 50,
                    'plotsLimit' => 5000,
                    'usersLimit' => 50,
                    'fileStorageGb' => 50,
                    'apiRequestsLimit' => 50000
                ],
                'enabled_features' => [
                    'PROJECTS_VIEW', 'PROJECTS_MANAGE',
                    'LAYOUTS_VIEW', 'LAYOUTS_MANAGE',
                    'PLOTS_VIEW', 'PLOTS_MANAGE',
                    'CUSTOMERS_VIEW', 'CUSTOMERS_MANAGE',
                    'AGENTS_VIEW', 'AGENTS_MANAGE',
                    'LEADS_VIEW', 'LEADS_MANAGE',
                    'BOOKINGS_VIEW', 'BOOKINGS_MANAGE',
                    'COLLECTIONS_VIEW', 'COLLECTIONS_MANAGE',
                    'DXF_VIEW', 'DXF_MANAGE',
                    'INTERACTIVE_MAP_VIEW', 'INTERACTIVE_MAP_MANAGE'
                ]
            ],
            [
                'plan_code' => 'ENTERPRISE',
                'name' => 'Enterprise Suite',
                'monthly_price' => 999.00,
                'yearly_price' => 9990.00,
                'trial_days' => 30,
                'sort_order' => 40,
                'limits' => [
                    'projectsLimit' => 999,
                    'layoutsLimit' => 999,
                    'plotsLimit' => 99999,
                    'usersLimit' => 999,
                    'fileStorageGb' => 500,
                    'apiRequestsLimit' => 1000000
                ],
                // All features are enabled
                'enabled_features' => array_keys($featureModels)
            ]
        ];

        foreach ($plansData as $p) {
            $plan = SubscriptionPlan::updateOrCreate(
                ['plan_code' => $p['plan_code']],
                [
                    'id' => SubscriptionPlan::where('plan_code', $p['plan_code'])->value('id') ?? (string) Str::uuid(),
                    'name' => $p['name'],
                    'monthly_price' => $p['monthly_price'],
                    'yearly_price' => $p['yearly_price'],
                    'trial_days' => $p['trial_days'],
                    'status' => 'ACTIVE',
                    'sort_order' => $p['sort_order']
                ]
            );

            // Connect Plan limits
            foreach ($p['limits'] as $key => $val) {
                SubscriptionPlanLimit::updateOrCreate(
                    ['plan_id' => $plan->id, 'limit_key' => $key],
                    [
                        'id' => SubscriptionPlanLimit::where(['plan_id' => $plan->id, 'limit_key' => $key])->value('id') ?? (string) Str::uuid(),
                        'limit_value' => $val
                    ]
                );
            }

            // Connect Plan features
            foreach ($p['enabled_features'] as $fName) {
                if (isset($featureModels[$fName])) {
                    $featId = $featureModels[$fName]->id;
                    SubscriptionPlanFeature::updateOrCreate(
                        ['plan_id' => $plan->id, 'feature_id' => $featId],
                        [
                            'id' => SubscriptionPlanFeature::where(['plan_id' => $plan->id, 'feature_id' => $featId])->value('id') ?? (string) Str::uuid(),
                            'access_level' => 'ENABLED'
                        ]
                    );
                }
            }
        }

        // 3. Addon Catalog Seed with type classification and limit boosts
        $addonsData = [
            [
                'code' => 'ADDON_DXF',
                'name' => 'Extended Heavy CAD Core',
                'addon_type' => 'FEATURE',
                'monthly' => 39.00,
                'yearly' => 390.00,
                'one_time' => 0.00,
                'desc' => 'High speed geo mapping parser and high-precision DXF layers ingestion.',
                'feature_code' => 'dxf.manage',
                'limit_key' => null,
                'limit_increment' => null
            ],
            [
                'code' => 'ADDON_LIMIT_PROJECTS',
                'name' => 'Project Capacity Boost (+5)',
                'addon_type' => 'CAPACITY',
                'monthly' => 29.00,
                'yearly' => 290.00,
                'one_time' => 0.00,
                'desc' => 'Increases your workspace capacity by adding +5 additional active real estate projects.',
                'feature_code' => null,
                'limit_key' => 'projectsLimit',
                'limit_increment' => 5
            ],
            [
                'code' => 'ADDON_LIMIT_PLOTS',
                'name' => 'Plot Parcel Boost (+1000)',
                'addon_type' => 'CAPACITY',
                'monthly' => 49.00,
                'yearly' => 490.00,
                'one_time' => 0.00,
                'desc' => 'Increases your total plot capacity by adding +1000 plots across layouts.',
                'feature_code' => null,
                'limit_key' => 'plotsLimit',
                'limit_increment' => 1000
            ],
            [
                'code' => 'ADDON_SUPPORT_PREMIUM',
                'name' => 'Premium Elite Dedicated Support',
                'addon_type' => 'SERVICE',
                'monthly' => 79.00,
                'yearly' => 790.00,
                'one_time' => 150.00,
                'desc' => 'Access 24/7 priority developer engineering support and SLA guarantees.',
                'feature_code' => null,
                'limit_key' => null,
                'limit_increment' => null
            ],
        ];

        foreach ($addonsData as $add) {
            SubscriptionAddon::updateOrCreate(
                ['code' => $add['code']],
                [
                    'id' => SubscriptionAddon::where('code', $add['code'])->value('id') ?? (string) Str::uuid(),
                    'name' => $add['name'],
                    'addon_type' => $add['addon_type'],
                    'monthly_price' => $add['monthly'],
                    'yearly_price' => $add['yearly'],
                    'one_time_price' => $add['one_time'],
                    'description' => $add['desc'],
                    'feature_code' => $add['feature_code'],
                    'limit_key' => $add['limit_key'],
                    'limit_increment' => $add['limit_increment'],
                    'status' => 'ACTIVE'
                ]
            );
        }

        // 4. Plot Billing Slabs Seed
        $slabsData = [
            ['min' => 1, 'max' => 500, 'monthly' => 0.00, 'yearly' => 0.00],
            ['min' => 501, 'max' => 1000, 'monthly' => 29.00, 'yearly' => 290.00],
            ['min' => 1001, 'max' => 5000, 'monthly' => 79.00, 'yearly' => 790.00],
            ['min' => 5001, 'max' => 999999, 'monthly' => 199.00, 'yearly' => 1990.00],
        ];

        foreach ($slabsData as $slab) {
            SubscriptionPlotSlab::updateOrCreate(
                ['min_plots' => $slab['min'], 'max_plots' => $slab['max']],
                [
                    'id' => SubscriptionPlotSlab::where(['min_plots' => $slab['min'], 'max_plots' => $slab['max']])->value('id') ?? (string) Str::uuid(),
                    'monthly_price' => $slab['monthly'],
                    'yearly_price' => $slab['yearly'],
                    'status' => 'ACTIVE'
                ]
            );
        }
    }
}
