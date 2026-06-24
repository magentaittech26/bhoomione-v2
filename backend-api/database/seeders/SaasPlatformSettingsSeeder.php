<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SaasPlatformSetting;
use Illuminate\Support\Str;

class SaasPlatformSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // GENERAL
            [
                'setting_group' => 'GENERAL',
                'setting_key' => 'platform_name',
                'setting_value' => 'BhoomiOne',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'GENERAL',
                'setting_key' => 'company_name',
                'setting_value' => 'BhoomiOne Land Systems',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'GENERAL',
                'setting_key' => 'support_email',
                'setting_value' => 'support@bhoomione.in',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'GENERAL',
                'setting_key' => 'support_phone',
                'setting_value' => '+91 00000 00000',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'GENERAL',
                'setting_key' => 'gst_number',
                'setting_value' => '',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'GENERAL',
                'setting_key' => 'address',
                'setting_value' => '',
                'setting_type' => 'string',
                'is_public' => false,
            ],

            // DOMAINS
            [
                'setting_group' => 'DOMAINS',
                'setting_key' => 'base_domain',
                'setting_value' => 'bhoomione.in',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'DOMAINS',
                'setting_key' => 'admin_domain',
                'setting_value' => 'admin.bhoomione.in',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'DOMAINS',
                'setting_key' => 'marketplace_domain',
                'setting_value' => 'bhoomione.in',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'DOMAINS',
                'setting_key' => 'tenant_subdomain_pattern',
                'setting_value' => '{tenant}.bhoomione.in',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'DOMAINS',
                'setting_key' => 'customer_portal_pattern',
                'setting_value' => 'portal.{tenant}.bhoomione.in',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'DOMAINS',
                'setting_key' => 'agent_portal_pattern',
                'setting_value' => 'agents.{tenant}.bhoomione.in',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'DOMAINS',
                'setting_key' => 'custom_domain_policy',
                'setting_value' => 'Manual approval required',
                'setting_type' => 'string',
                'is_public' => false,
            ],

            // BILLING
            [
                'setting_group' => 'BILLING',
                'setting_key' => 'currency',
                'setting_value' => 'INR',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'BILLING',
                'setting_key' => 'gst_percentage',
                'setting_value' => '18',
                'setting_type' => 'number',
                'is_public' => false,
            ],
            [
                'setting_group' => 'BILLING',
                'setting_key' => 'gst_percent',
                'setting_value' => '18',
                'setting_type' => 'number',
                'is_public' => false,
            ],
            [
                'setting_group' => 'BILLING',
                'setting_key' => 'invoice_prefix',
                'setting_value' => 'BHOOMI',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'BILLING',
                'setting_key' => 'default_trial_days',
                'setting_value' => '14',
                'setting_type' => 'number',
                'is_public' => false,
            ],
            [
                'setting_group' => 'BILLING',
                'setting_key' => 'grace_period_days',
                'setting_value' => '7',
                'setting_type' => 'number',
                'is_public' => false,
            ],
            [
                'setting_group' => 'BILLING',
                'setting_key' => 'auto_suspend_after_due_days',
                'setting_value' => '15',
                'setting_type' => 'number',
                'is_public' => false,
            ],
            [
                'setting_group' => 'BILLING',
                'setting_key' => 'auto_expire_after_days',
                'setting_value' => '30',
                'setting_type' => 'number',
                'is_public' => false,
            ],

            // NOTIFICATIONS
            [
                'setting_group' => 'NOTIFICATIONS',
                'setting_key' => 'email_provider',
                'setting_value' => 'SMTP',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'NOTIFICATIONS',
                'setting_key' => 'whatsapp_provider',
                'setting_value' => 'Disabled',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'NOTIFICATIONS',
                'setting_key' => 'sms_provider',
                'setting_value' => 'Disabled',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'NOTIFICATIONS',
                'setting_key' => 'reminder_days_before_renewal',
                'setting_value' => '7',
                'setting_type' => 'number',
                'is_public' => false,
            ],
            [
                'setting_group' => 'NOTIFICATIONS',
                'setting_key' => 'renewal_reminder_days',
                'setting_value' => '7',
                'setting_type' => 'number',
                'is_public' => false,
            ],
            [
                'setting_group' => 'NOTIFICATIONS',
                'setting_key' => 'overdue_reminder_days',
                'setting_value' => '3',
                'setting_type' => 'number',
                'is_public' => false,
            ],

            // SECURITY
            [
                'setting_group' => 'SECURITY',
                'setting_key' => 'session_timeout',
                'setting_value' => '120',
                'setting_type' => 'number',
                'is_public' => false,
            ],
            [
                'setting_group' => 'SECURITY',
                'setting_key' => 'session_timeout_minutes',
                'setting_value' => '120',
                'setting_type' => 'number',
                'is_public' => false,
            ],
            [
                'setting_group' => 'SECURITY',
                'setting_key' => 'password_policy',
                'setting_value' => 'STRONG',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'SECURITY',
                'setting_key' => 'password_min_length',
                'setting_value' => '8',
                'setting_type' => 'number',
                'is_public' => false,
            ],
            [
                'setting_group' => 'SECURITY',
                'setting_key' => 'mfa_required',
                'setting_value' => 'false',
                'setting_type' => 'boolean',
                'is_public' => false,
            ],
            [
                'setting_group' => 'SECURITY',
                'setting_key' => 'audit_retention_days',
                'setting_value' => '365',
                'setting_type' => 'number',
                'is_public' => false,
            ],

            // STORAGE
            [
                'setting_group' => 'STORAGE',
                'setting_key' => 'default_storage_gb',
                'setting_value' => '10',
                'setting_type' => 'number',
                'is_public' => false,
            ],
            [
                'setting_group' => 'STORAGE',
                'setting_key' => 'max_upload_size_mb',
                'setting_value' => '25',
                'setting_type' => 'number',
                'is_public' => false,
            ],
            [
                'setting_group' => 'STORAGE',
                'setting_key' => 'dxf_upload_limit_mb',
                'setting_value' => '50',
                'setting_type' => 'number',
                'is_public' => false,
            ],
            [
                'setting_group' => 'STORAGE',
                'setting_key' => 'image_upload_limit_mb',
                'setting_value' => '10',
                'setting_type' => 'number',
                'is_public' => false,
            ],

            // ADVANCED
            [
                'setting_group' => 'ADVANCED',
                'setting_key' => 'api_gateway_mode',
                'setting_value' => 'Laravel',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'ADVANCED',
                'setting_key' => 'frontend_runtime',
                'setting_value' => 'Vite',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'ADVANCED',
                'setting_key' => 'database_engine',
                'setting_value' => 'PostgreSQL',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'ADVANCED',
                'setting_key' => 'cache_driver',
                'setting_value' => 'Redis',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'ADVANCED',
                'setting_key' => 'queue_driver',
                'setting_value' => 'Redis',
                'setting_type' => 'string',
                'is_public' => false,
            ],
        ];

        foreach ($settings as $setting) {
            SaasPlatformSetting::updateOrCreate(
                ['setting_key' => $setting['setting_key']],
                [
                    'id' => SaasPlatformSetting::where('setting_key', $setting['setting_key'])->value('id') ?? (string) Str::uuid(),
                    'setting_group' => $setting['setting_group'],
                    'setting_value' => $setting['setting_value'],
                    'setting_type' => $setting['setting_type'],
                    'is_public' => $setting['is_public']
                ]
            );
        }
    }
}
