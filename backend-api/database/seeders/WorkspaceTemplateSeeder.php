<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WorkspaceTemplate;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class WorkspaceTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Truncate workspace_templates table for a fresh seed
        DB::statement('TRUNCATE TABLE workspace_templates CASCADE');

        $templates = [
            [
                'id' => (string) Str::uuid(),
                'code' => 'STARTER',
                'name' => 'Starter Template',
                'description' => 'A lightweight workspace template optimized for small developers and startup builders.',
                'roles_permissions' => [
                    'DEVELOPER_OWNER' => ['users.view', 'users.create', 'users.update', 'projects.view', 'layouts.view', 'plots.view'],
                    'CUSTOMER' => ['projects.view']
                ],
                'menus' => [
                    ['title' => 'Dashboard', 'route' => '/dashboard', 'icon' => 'Activity'],
                    ['title' => 'Projects', 'route' => '/projects', 'icon' => 'Server'],
                    ['title' => 'My Subscription', 'route' => '/billing', 'icon' => 'Zap']
                ],
                'modules' => ['PROJECTS', 'LAYOUTS', 'PLOTS'],
                'features' => [
                    'projects.view' => 'ENABLED', 'projects.manage' => 'ENABLED',
                    'layouts.view' => 'ENABLED', 'layouts.manage' => 'ENABLED',
                    'plots.view' => 'ENABLED', 'plots.manage' => 'ENABLED'
                ],
                'limits' => [
                    'projectsLimit' => 1,
                    'layoutsLimit' => 5,
                    'plotsLimit' => 150,
                    'usersLimit' => 3,
                    'fileStorageGb' => 2,
                ],
                'default_settings' => [
                    'timezone' => 'Asia/Kolkata',
                    'currency' => 'INR',
                    'date_format' => 'd/m/Y',
                    'auto_invoice' => false
                ],
                'branding' => [
                    'primary_color' => '#4f46e5',
                    'logo_url' => '/assets/starter_logo.png',
                    'theme' => 'light'
                ],
                'seed_data' => [
                    'generate_demo_data' => false
                ]
            ],
            [
                'id' => (string) Str::uuid(),
                'code' => 'GROWTH',
                'name' => 'Growth Template',
                'description' => 'Designed for scaling developer operations with CRM, Leads and basic CAD DXF support.',
                'roles_permissions' => [
                    'DEVELOPER_OWNER' => ['users.view', 'users.create', 'users.update', 'users.delete', 'projects.view', 'projects.manage', 'layouts.view', 'layouts.manage', 'plots.view', 'plots.manage', 'customers.view', 'customers.manage', 'dxf.view', 'dxf.upload'],
                    'SALES_EXECUTIVE' => ['customers.view', 'customers.manage']
                ],
                'menus' => [
                    ['title' => 'Dashboard', 'route' => '/dashboard', 'icon' => 'Activity'],
                    ['title' => 'Projects', 'route' => '/projects', 'icon' => 'Server'],
                    ['title' => 'CRM Customers', 'route' => '/customers', 'icon' => 'Users'],
                    ['title' => 'CAD Geometry', 'route' => '/dxf', 'icon' => 'Terminal']
                ],
                'modules' => ['PROJECTS', 'LAYOUTS', 'PLOTS', 'CUSTOMERS', 'LEADS', 'DXF'],
                'features' => [
                    'projects.view' => 'ENABLED', 'projects.manage' => 'ENABLED',
                    'layouts.view' => 'ENABLED', 'layouts.manage' => 'ENABLED',
                    'plots.view' => 'ENABLED', 'plots.manage' => 'ENABLED',
                    'customers.view' => 'ENABLED', 'customers.manage' => 'ENABLED',
                    'dxf.view' => 'ENABLED', 'dxf.upload' => 'ENABLED'
                ],
                'limits' => [
                    'projectsLimit' => 3,
                    'layoutsLimit' => 15,
                    'plotsLimit' => 1000,
                    'usersLimit' => 10,
                    'fileStorageGb' => 10,
                ],
                'default_settings' => [
                    'timezone' => 'Asia/Kolkata',
                    'currency' => 'INR',
                    'date_format' => 'd/m/Y',
                    'auto_invoice' => true
                ],
                'branding' => [
                    'primary_color' => '#0ea5e9',
                    'logo_url' => '/assets/growth_logo.png',
                    'theme' => 'light'
                ],
                'seed_data' => [
                    'generate_demo_data' => false
                ]
            ],
            [
                'id' => (string) Str::uuid(),
                'code' => 'PROFESSIONAL',
                'name' => 'Professional Template',
                'description' => 'A robust template including bookings, collections ledgers, and interactive GIS mapping.',
                'roles_permissions' => [
                    'DEVELOPER_OWNER' => [
                        'users.view', 'users.create', 'users.update', 'users.delete', 'roles.view', 'roles.manage',
                        'projects.view', 'projects.manage', 'layouts.view', 'layouts.manage', 'plots.view', 'plots.manage',
                        'customers.view', 'customers.manage', 'bookings.view', 'bookings.manage', 'collections.view', 'collections.manage',
                        'dxf.view', 'dxf.upload', 'dxf.process'
                    ],
                    'FINANCE_MANAGER' => ['collections.view', 'collections.manage']
                ],
                'menus' => [
                    ['title' => 'Dashboard', 'route' => '/dashboard', 'icon' => 'Activity'],
                    ['title' => 'Projects', 'route' => '/projects', 'icon' => 'Server'],
                    ['title' => 'Customers CRM', 'route' => '/customers', 'icon' => 'Users'],
                    ['title' => 'Bookings Gateway', 'route' => '/bookings', 'icon' => 'Zap'],
                    ['title' => 'Financial Ledgers', 'route' => '/collections', 'icon' => 'CheckCircle']
                ],
                'modules' => ['PROJECTS', 'LAYOUTS', 'PLOTS', 'CUSTOMERS', 'AGENTS', 'LEADS', 'BOOKINGS', 'COLLECTIONS', 'DXF', 'INTERACTIVE_MAP'],
                'features' => [
                    'projects.view' => 'ENABLED', 'projects.manage' => 'ENABLED',
                    'layouts.view' => 'ENABLED', 'layouts.manage' => 'ENABLED',
                    'plots.view' => 'ENABLED', 'plots.manage' => 'ENABLED',
                    'customers.view' => 'ENABLED', 'customers.manage' => 'ENABLED',
                    'bookings.view' => 'ENABLED', 'bookings.manage' => 'ENABLED',
                    'collections.view' => 'ENABLED', 'collections.manage' => 'ENABLED',
                    'dxf.view' => 'ENABLED', 'dxf.upload' => 'ENABLED', 'dxf.process' => 'ENABLED'
                ],
                'limits' => [
                    'projectsLimit' => 10,
                    'layoutsLimit' => 50,
                    'plotsLimit' => 5000,
                    'usersLimit' => 50,
                    'fileStorageGb' => 50,
                ],
                'default_settings' => [
                    'timezone' => 'Asia/Kolkata',
                    'currency' => 'INR',
                    'date_format' => 'd/m/Y',
                    'auto_invoice' => true
                ],
                'branding' => [
                    'primary_color' => '#10b981',
                    'logo_url' => '/assets/pro_logo.png',
                    'theme' => 'light'
                ],
                'seed_data' => [
                    'generate_demo_data' => false
                ]
            ],
            [
                'id' => (string) Str::uuid(),
                'code' => 'ENTERPRISE',
                'name' => 'Enterprise Template',
                'description' => 'Unlimited capacity, priority support, full API integrations and custom external portals.',
                'roles_permissions' => [
                    'DEVELOPER_OWNER' => [
                        'users.view', 'users.create', 'users.update', 'users.delete', 'roles.view', 'roles.manage', 'permissions.view', 'permissions.manage',
                        'projects.view', 'projects.manage', 'layouts.view', 'layouts.manage', 'plots.view', 'plots.manage',
                        'customers.view', 'customers.manage', 'bookings.view', 'bookings.manage', 'collections.view', 'collections.manage',
                        'dxf.view', 'dxf.upload', 'dxf.process'
                    ]
                ],
                'menus' => [
                    ['title' => 'Dashboard', 'route' => '/dashboard', 'icon' => 'Activity'],
                    ['title' => 'Enterprise Hub', 'route' => '/projects', 'icon' => 'Server'],
                    ['title' => 'GIS Layouts', 'route' => '/layouts', 'icon' => 'Globe'],
                    ['title' => 'Ledgers & Cash', 'route' => '/collections', 'icon' => 'Sliders']
                ],
                'modules' => ['PROJECTS', 'LAYOUTS', 'PLOTS', 'CUSTOMERS', 'AGENTS', 'LEADS', 'BOOKINGS', 'COLLECTIONS', 'DXF', 'INTERACTIVE_MAP', 'MARKETPLACE', 'CUSTOMER_PORTAL', 'AGENT_PORTAL'],
                'features' => [
                    'projects.view' => 'ENABLED', 'projects.manage' => 'ENABLED',
                    'layouts.view' => 'ENABLED', 'layouts.manage' => 'ENABLED',
                    'plots.view' => 'ENABLED', 'plots.manage' => 'ENABLED',
                    'customers.view' => 'ENABLED', 'customers.manage' => 'ENABLED',
                    'bookings.view' => 'ENABLED', 'bookings.manage' => 'ENABLED',
                    'collections.view' => 'ENABLED', 'collections.manage' => 'ENABLED',
                    'dxf.view' => 'ENABLED', 'dxf.upload' => 'ENABLED', 'dxf.process' => 'ENABLED'
                ],
                'limits' => [
                    'projectsLimit' => 100,
                    'layoutsLimit' => 500,
                    'plotsLimit' => 50000,
                    'usersLimit' => 1000,
                    'fileStorageGb' => 1000,
                ],
                'default_settings' => [
                    'timezone' => 'Asia/Kolkata',
                    'currency' => 'INR',
                    'date_format' => 'd/m/Y',
                    'auto_invoice' => true
                ],
                'branding' => [
                    'primary_color' => '#6366f1',
                    'logo_url' => '/assets/enterprise_logo.png',
                    'theme' => 'dark'
                ],
                'seed_data' => [
                    'generate_demo_data' => false
                ]
            ],
            [
                'id' => (string) Str::uuid(),
                'code' => 'DEVELOPER',
                'name' => 'Developer Sandbox Template',
                'description' => 'A completely open environment featuring audit trailing, fast processing & API keys.',
                'roles_permissions' => [
                    'DEVELOPER_OWNER' => [
                        'users.view', 'users.create', 'users.update', 'users.delete', 'roles.view', 'roles.manage', 'permissions.view', 'permissions.manage',
                        'projects.view', 'projects.manage', 'layouts.view', 'layouts.manage', 'plots.view', 'plots.manage',
                        'customers.view', 'customers.manage', 'bookings.view', 'bookings.manage', 'collections.view', 'collections.manage',
                        'dxf.view', 'dxf.upload', 'dxf.process', 'audit.view'
                    ]
                ],
                'menus' => [
                    ['title' => 'Sandbox console', 'route' => '/dashboard', 'icon' => 'Activity'],
                    ['title' => 'CAD Workspace', 'route' => '/dxf', 'icon' => 'Terminal'],
                    ['title' => 'Audit Trails', 'route' => '/audit', 'icon' => 'Shield']
                ],
                'modules' => ['PROJECTS', 'LAYOUTS', 'PLOTS', 'DXF', 'INTERACTIVE_MAP'],
                'features' => [
                    'projects.view' => 'ENABLED', 'projects.manage' => 'ENABLED',
                    'layouts.view' => 'ENABLED', 'layouts.manage' => 'ENABLED',
                    'plots.view' => 'ENABLED', 'plots.manage' => 'ENABLED',
                    'dxf.view' => 'ENABLED', 'dxf.upload' => 'ENABLED', 'dxf.process' => 'ENABLED',
                    'audit.view' => 'ENABLED'
                ],
                'limits' => [
                    'projectsLimit' => 50,
                    'layoutsLimit' => 100,
                    'plotsLimit' => 10000,
                    'usersLimit' => 100,
                    'fileStorageGb' => 100,
                ],
                'default_settings' => [
                    'timezone' => 'Asia/Kolkata',
                    'currency' => 'INR',
                    'date_format' => 'd/m/Y',
                    'auto_invoice' => false
                ],
                'branding' => [
                    'primary_color' => '#14b8a6',
                    'logo_url' => '/assets/dev_logo.png',
                    'theme' => 'light'
                ],
                'seed_data' => [
                    'generate_demo_data' => false
                ]
            ],
            [
                'id' => (string) Str::uuid(),
                'code' => 'DEMO',
                'name' => 'Interactive Demo Template',
                'description' => 'A pre-loaded template pre-seeded with layouts, bookings, ledgers and active plot maps for rapid testing.',
                'roles_permissions' => [
                    'DEVELOPER_OWNER' => [
                        'users.view', 'users.create', 'users.update', 'users.delete', 'roles.view', 'roles.manage',
                        'projects.view', 'projects.manage', 'layouts.view', 'layouts.manage', 'plots.view', 'plots.manage',
                        'customers.view', 'customers.manage', 'bookings.view', 'bookings.manage', 'collections.view', 'collections.manage',
                        'dxf.view', 'dxf.upload', 'dxf.process'
                    ]
                ],
                'menus' => [
                    ['title' => 'Demo Center', 'route' => '/dashboard', 'icon' => 'Activity'],
                    ['title' => 'Sample Projects', 'route' => '/projects', 'icon' => 'Server'],
                    ['title' => 'Bookings Ledger', 'route' => '/bookings', 'icon' => 'Zap']
                ],
                'modules' => ['PROJECTS', 'LAYOUTS', 'PLOTS', 'CUSTOMERS', 'AGENTS', 'BOOKINGS', 'COLLECTIONS', 'DXF'],
                'features' => [
                    'projects.view' => 'ENABLED', 'projects.manage' => 'ENABLED',
                    'layouts.view' => 'ENABLED', 'layouts.manage' => 'ENABLED',
                    'plots.view' => 'ENABLED', 'plots.manage' => 'ENABLED',
                    'customers.view' => 'ENABLED', 'customers.manage' => 'ENABLED',
                    'bookings.view' => 'ENABLED', 'bookings.manage' => 'ENABLED',
                    'collections.view' => 'ENABLED', 'collections.manage' => 'ENABLED',
                    'dxf.view' => 'ENABLED', 'dxf.upload' => 'ENABLED'
                ],
                'limits' => [
                    'projectsLimit' => 5,
                    'layoutsLimit' => 15,
                    'plotsLimit' => 500,
                    'usersLimit' => 5,
                    'fileStorageGb' => 5,
                ],
                'default_settings' => [
                    'timezone' => 'Asia/Kolkata',
                    'currency' => 'INR',
                    'date_format' => 'd/m/Y',
                    'auto_invoice' => true
                ],
                'branding' => [
                    'primary_color' => '#ec4899',
                    'logo_url' => '/assets/demo_logo.png',
                    'theme' => 'light'
                ],
                'seed_data' => [
                    'generate_demo_data' => true
                ]
            ]
        ];

        foreach ($templates as $t) {
            WorkspaceTemplate::updateOrCreate(
                ['code' => $t['code']],
                [
                    'id' => $t['id'],
                    'name' => $t['name'],
                    'description' => $t['description'],
                    'roles_permissions' => $t['roles_permissions'],
                    'menus' => $t['menus'],
                    'modules' => $t['modules'],
                    'features' => $t['features'],
                    'limits' => $t['limits'],
                    'default_settings' => $t['default_settings'],
                    'branding' => $t['branding'],
                    'seed_data' => $t['seed_data'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
