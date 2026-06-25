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
                'setting_key' => 'support_email',
                'setting_value' => 'support@bhoomione.in',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'GENERAL',
                'setting_key' => 'support_phone',
                'setting_value' => '+91 99999 99999',
                'setting_type' => 'string',
                'is_public' => true,
            ],

            // COMPANY
            [
                'setting_group' => 'COMPANY',
                'setting_key' => 'company_name',
                'setting_value' => 'BhoomiOne Land Systems Pvt Ltd',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'COMPANY',
                'setting_key' => 'corporate_identity_number',
                'setting_value' => 'U72200KA2026PTC123456',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'COMPANY',
                'setting_key' => 'pan_number',
                'setting_value' => 'AAACB1234A',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'COMPANY',
                'setting_key' => 'gst_number',
                'setting_value' => '29AAAAA1111A1Z1',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'COMPANY',
                'setting_key' => 'address',
                'setting_value' => 'No. 45, 3rd Cross, Indiranagar, Bengaluru, KA 560038',
                'setting_type' => 'string',
                'is_public' => false,
            ],

            // BRANDING
            [
                'setting_group' => 'BRANDING',
                'setting_key' => 'primary_color',
                'setting_value' => '#4f46e5',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'BRANDING',
                'setting_key' => 'secondary_color',
                'setting_value' => '#0ea5e9',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'BRANDING',
                'setting_key' => 'logo_url',
                'setting_value' => '/assets/logo-bhoomione.png',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'BRANDING',
                'setting_key' => 'favicon_url',
                'setting_value' => '/favicon.ico',
                'setting_type' => 'string',
                'is_public' => true,
            ],

            // LOCALIZATION
            [
                'setting_group' => 'LOCALIZATION',
                'setting_key' => 'timezone',
                'setting_value' => 'Asia/Kolkata',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'LOCALIZATION',
                'setting_key' => 'date_format',
                'setting_value' => 'DD-MM-YYYY',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'LOCALIZATION',
                'setting_key' => 'time_format',
                'setting_value' => '24_HOUR',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'LOCALIZATION',
                'setting_key' => 'default_language',
                'setting_value' => 'en',
                'setting_type' => 'string',
                'is_public' => true,
            ],

            // CURRENCY
            [
                'setting_group' => 'CURRENCY',
                'setting_key' => 'currency_code',
                'setting_value' => 'INR',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'CURRENCY',
                'setting_key' => 'currency_symbol',
                'setting_value' => '₹',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'CURRENCY',
                'setting_key' => 'thousand_separator',
                'setting_value' => ',',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'CURRENCY',
                'setting_key' => 'decimal_separator',
                'setting_value' => '.',
                'setting_type' => 'string',
                'is_public' => true,
            ],

            // TAX
            [
                'setting_group' => 'TAX',
                'setting_key' => 'tax_name',
                'setting_value' => 'GST',
                'setting_type' => 'string',
                'is_public' => true,
            ],
            [
                'setting_group' => 'TAX',
                'setting_key' => 'tax_rate_percent',
                'setting_value' => '18',
                'setting_type' => 'number',
                'is_public' => false,
            ],
            [
                'setting_group' => 'TAX',
                'setting_key' => 'tax_treatment',
                'setting_value' => 'EXCLUSIVE',
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
                'setting_value' => 'market.bhoomione.in',
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
                'setting_key' => 'notification_channels',
                'setting_value' => 'EMAIL_SMS_WHATSAPP',
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

            // EMAIL
            [
                'setting_group' => 'EMAIL',
                'setting_key' => 'email_provider',
                'setting_value' => 'SMTP',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'EMAIL',
                'setting_key' => 'smtp_host',
                'setting_value' => 'smtp.mailgun.org',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'EMAIL',
                'setting_key' => 'smtp_port',
                'setting_value' => '587',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'EMAIL',
                'setting_key' => 'smtp_username',
                'setting_value' => 'postmaster@bhoomione.in',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'EMAIL',
                'setting_key' => 'smtp_password',
                'setting_value' => 'secret',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'EMAIL',
                'setting_key' => 'smtp_encryption',
                'setting_value' => 'tls',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'EMAIL',
                'setting_key' => 'from_email',
                'setting_value' => 'noreply@bhoomione.in',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'EMAIL',
                'setting_key' => 'from_name',
                'setting_value' => 'BhoomiOne Alerts',
                'setting_type' => 'string',
                'is_public' => false,
            ],

            // WHATSAPP
            [
                'setting_group' => 'WHATSAPP',
                'setting_key' => 'whatsapp_provider',
                'setting_value' => 'Twilio',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'WHATSAPP',
                'setting_key' => 'whatsapp_account_sid',
                'setting_value' => 'ACxxxxxxxxxxxxxxxxxxxx',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'WHATSAPP',
                'setting_key' => 'whatsapp_auth_token',
                'setting_value' => 'secret',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'WHATSAPP',
                'setting_key' => 'whatsapp_sender_number',
                'setting_value' => '+14155238886',
                'setting_type' => 'string',
                'is_public' => false,
            ],

            // SYSTEM
            [
                'setting_group' => 'SYSTEM',
                'setting_key' => 'api_gateway_mode',
                'setting_value' => 'Laravel',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'SYSTEM',
                'setting_key' => 'frontend_runtime',
                'setting_value' => 'Vite',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'SYSTEM',
                'setting_key' => 'database_engine',
                'setting_value' => 'PostgreSQL',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'SYSTEM',
                'setting_key' => 'cache_driver',
                'setting_value' => 'Redis',
                'setting_type' => 'string',
                'is_public' => false,
            ],
            [
                'setting_group' => 'SYSTEM',
                'setting_key' => 'queue_driver',
                'setting_value' => 'Redis',
                'setting_type' => 'string',
                'is_public' => false,
            ],

            // ADVANCED
            [
                'setting_group' => 'ADVANCED',
                'setting_key' => 'maintenance_mode',
                'setting_value' => 'false',
                'setting_type' => 'boolean',
                'is_public' => false,
            ],
            [
                'setting_group' => 'ADVANCED',
                'setting_key' => 'debug_mode',
                'setting_value' => 'false',
                'setting_type' => 'boolean',
                'is_public' => false,
            ],
            [
                'setting_group' => 'ADVANCED',
                'setting_key' => 'allowed_cors_origins',
                'setting_value' => '*',
                'setting_type' => 'string',
                'is_public' => false,
            ],
        ];

        foreach ($settings as $setting) {
            $existing = SaasPlatformSetting::where('setting_key', $setting['setting_key'])->first();
            if (!$existing) {
                SaasPlatformSetting::create([
                    'id' => (string) Str::uuid(),
                    'setting_group' => $setting['setting_group'],
                    'setting_key' => $setting['setting_key'],
                    'setting_value' => $setting['setting_value'],
                    'setting_type' => $setting['setting_type'],
                    'is_public' => $setting['is_public']
                ]);
            }
        }
    }
}
