<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\EmailConfiguration;
use App\Models\EmailTemplate;

class EmailInfrastructureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Outbound Email Providers Configuration Seed
        $providers = [
            [
                'provider_code' => 'SMTP',
                'name' => 'Standard SMTP Relay',
                'is_enabled' => true,
                'is_default' => true,
                'host' => 'smtp.mailgun.org',
                'port' => 587,
                'encryption' => 'TLS',
                'username' => 'postmaster@bhoomione.in',
                'password' => 'smtp_secure_password_placeholder',
                'sender_name' => 'BhoomiOne Core',
                'sender_email' => 'no-reply@bhoomione.in',
                'custom_params' => null,
                'status' => 'ACTIVE',
            ],
            [
                'provider_code' => 'GMAIL_OAUTH',
                'name' => 'Gmail Workspace OAuth',
                'is_enabled' => false,
                'is_default' => false,
                'host' => 'smtp.gmail.com',
                'port' => 587,
                'encryption' => 'TLS',
                'username' => 'gmail-oauth-user@bhoomione.in',
                'password' => 'oauth_client_secret_placeholder',
                'sender_name' => 'BhoomiOne Gmail Service',
                'sender_email' => 'alerts@bhoomione.in',
                'custom_params' => [
                    'client_id' => 'gmail-client-id-xyz.apps.googleusercontent.com',
                    'client_secret' => 'gmail-client-secret-abc',
                    'refresh_token' => 'refresh-token-gmail',
                ],
                'status' => 'INACTIVE',
            ],
            [
                'provider_code' => 'OFFICE365',
                'name' => 'Microsoft 365 Exchange',
                'is_enabled' => false,
                'is_default' => false,
                'host' => 'smtp.office365.com',
                'port' => 587,
                'encryption' => 'TLS',
                'username' => 'm365-exchange@bhoomione.in',
                'password' => 'exchange_password_placeholder',
                'sender_name' => 'BhoomiOne Office Service',
                'sender_email' => 'exchange-alerts@bhoomione.in',
                'custom_params' => null,
                'status' => 'INACTIVE',
            ],
            [
                'provider_code' => 'SES',
                'name' => 'Amazon Simple Email Service (SES)',
                'is_enabled' => false,
                'is_default' => false,
                'host' => 'email-smtp.us-east-1.amazonaws.com',
                'port' => 587,
                'encryption' => 'TLS',
                'username' => 'AKIAIOSFODNN7EXAMPLE',
                'password' => 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
                'sender_name' => 'BhoomiOne Amazon Cloud Delivery',
                'sender_email' => 'aws-alerts@bhoomione.in',
                'custom_params' => [
                    'region' => 'us-east-1',
                ],
                'status' => 'INACTIVE',
            ],
            [
                'provider_code' => 'MAILGUN',
                'name' => 'Mailgun API Relay Engine',
                'is_enabled' => false,
                'is_default' => false,
                'host' => null,
                'port' => null,
                'encryption' => null,
                'username' => null,
                'password' => 'mailgun_api_key_placeholder',
                'sender_name' => 'BhoomiOne Mailgun Relay',
                'sender_email' => 'mg-alerts@bhoomione.in',
                'custom_params' => [
                    'domain' => 'mg.bhoomione.in',
                    'region' => 'US',
                ],
                'status' => 'INACTIVE',
            ],
            [
                'provider_code' => 'SENDGRID',
                'name' => 'SendGrid Secure Delivery API',
                'is_enabled' => false,
                'is_default' => false,
                'host' => null,
                'port' => null,
                'encryption' => null,
                'username' => null,
                'password' => 'sendgrid_api_key_placeholder',
                'sender_name' => 'BhoomiOne SendGrid',
                'sender_email' => 'sg-alerts@bhoomione.in',
                'custom_params' => null,
                'status' => 'INACTIVE',
            ],
            [
                'provider_code' => 'POSTMARK',
                'name' => 'Postmark API Service',
                'is_enabled' => false,
                'is_default' => false,
                'host' => null,
                'port' => null,
                'encryption' => null,
                'username' => null,
                'password' => 'postmark_server_token_placeholder',
                'sender_name' => 'BhoomiOne Postmark',
                'sender_email' => 'postmark-alerts@bhoomione.in',
                'custom_params' => null,
                'status' => 'INACTIVE',
            ],
            [
                'provider_code' => 'BREVO',
                'name' => 'Brevo (Sendinblue) Gateway',
                'is_enabled' => false,
                'is_default' => false,
                'host' => null,
                'port' => null,
                'encryption' => null,
                'username' => null,
                'password' => 'brevo_api_key_placeholder',
                'sender_name' => 'BhoomiOne Brevo Service',
                'sender_email' => 'brevo-alerts@bhoomione.in',
                'custom_params' => null,
                'status' => 'INACTIVE',
            ],
        ];

        foreach ($providers as $p) {
            EmailConfiguration::updateOrCreate(
                ['provider_code' => $p['provider_code']],
                [
                    'id' => EmailConfiguration::where('provider_code', $p['provider_code'])->value('id') ?: (string) Str::uuid(),
                    'name' => $p['name'],
                    'is_enabled' => $p['is_enabled'],
                    'is_default' => $p['is_default'],
                    'host' => $p['host'],
                    'port' => $p['port'],
                    'encryption' => $p['encryption'],
                    'username' => $p['username'],
                    'password' => $p['password'],
                    'sender_name' => $p['sender_name'],
                    'sender_email' => $p['sender_email'],
                    'custom_params' => $p['custom_params'],
                    'status' => $p['status'],
                ]
            );
        }

        // 2. Core Email Templates Seed
        $templates = [
            [
                'template_key' => 'WELCOME',
                'name' => 'Platform Welcome & Onboarding',
                'subject' => 'Welcome to BhoomiOne V3 - Let\'s Build Something Amazing!',
                'body_html' => '<h2>Hello {{admin_name}},</h2>
<p>Welcome to <strong>BhoomiOne V3</strong>! Your SaaS account is officially registered.</p>
<p>We are excited to help you manage your land development projects and automate complex commercial taxation effortlessly.</p>
<p>Should you need any technical support or advice, feel free to reply directly to this mail.</p>
<p>Best Regards,<br>The BhoomiOne Team</p>',
                'body_text' => "Hello {{admin_name}},\n\nWelcome to BhoomiOne V3! Your SaaS account is officially registered.\n\nWe are excited to help you manage your projects and automate commercial taxation.\n\nBest Regards,\nThe BhoomiOne Team",
            ],
            [
                'template_key' => 'TENANT_PROVISIONED',
                'name' => 'Tenant Workspace Provisioned',
                'subject' => 'Your Tenant Workspace is Live: {{tenant_name}}',
                'body_html' => '<h2>Congratulations!</h2>
<p>Your tenant workspace <strong>{{tenant_name}}</strong> has been successfully provisioned on BhoomiOne V3.</p>
<p>You can access your exclusive workspace right now at: <a href="{{workspace_url}}">{{workspace_url}}</a></p>
<p>Use your registered administrative email to sign in.</p>
<p>Enjoy isolated database operations, Map-First visualizer suites, and real estate bookkeeping tools today.</p>
<p>Best Regards,<br>BhoomiOne Platform Provisioner</p>',
                'body_text' => "Congratulations!\n\nYour tenant workspace {{tenant_name}} has been successfully provisioned on BhoomiOne V3.\n\nYou can access your exclusive workspace right now at: {{workspace_url}}\n\nBest Regards,\nBhoomiOne Platform Provisioner",
            ],
            [
                'template_key' => 'PASSWORD_RESET',
                'name' => 'Password Reset Authorization',
                'subject' => 'Authorize Password Reset for Your Account',
                'body_html' => '<h2>Hello,</h2>
<p>We received an administrative request to reset the password for your BhoomiOne V3 credentials.</p>
<p>If you did not make this request, you can safely ignore this email. No security changes have been committed yet.</p>
<p>To authorize the password reset, click the secure link below:</p>
<p style="margin: 20px 0;"><a href="{{workspace_url}}/reset-password" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset My Password</a></p>
<p>Your temporary password validation key is: <strong>{{temporary_password}}</strong></p>
<p>Best Regards,<br>BhoomiOne Trust & Security Desk</p>',
                'body_text' => "Hello,\n\nWe received an administrative request to reset the password for your BhoomiOne V3 credentials.\n\nTo reset your password, visit: {{workspace_url}}/reset-password\nTemporary verification key: {{temporary_password}}\n\nBest Regards,\nBhoomiOne Trust & Security Desk",
            ],
            [
                'template_key' => 'EMAIL_VERIFICATION',
                'name' => 'Email Verification Key',
                'subject' => 'Verify Your Email to Continue Setup',
                'body_html' => '<h2>Hello,</h2>
<p>Thank you for registering. Please verify your outbound communications address by entering the secure verification code below:</p>
<h1 style="color: #4f46e5; font-size: 32px; letter-spacing: 4px; text-align: center; margin: 30px 0;"><strong>{{temporary_password}}</strong></h1>
<p>This security code remains valid for 15 minutes. Please complete this step immediately to proceed.</p>
<p>Best Regards,<br>BhoomiOne Trust & Security Desk</p>',
                'body_text' => "Hello,\n\nThank you for registering. Please verify your email by entering the secure verification code below:\n\n{{temporary_password}}\n\nBest Regards,\nBhoomiOne Trust & Security Desk",
            ],
            [
                'template_key' => 'SUBSCRIPTION_CREATED',
                'name' => 'Subscription Created Successfully',
                'subject' => 'Subscription Activated: {{subscription_name}} License',
                'body_html' => '<h2>Hello {{admin_name}},</h2>
<p>Your enterprise license for <strong>{{subscription_name}}</strong> is now active on the BhoomiOne Platform!</p>
<p>Your company <strong>{{company_name}}</strong> now has access to Interactive CAD Maps, Polygon Geometry engines, and localized GST tax overrides.</p>
<p>Billing will recur on the scheduled date automatically. Thank you for partnering with BhoomiOne.</p>
<p>Best Regards,<br>BhoomiOne Commercial Gateway</p>',
                'body_text' => "Hello {{admin_name}},\n\nYour enterprise license for {{subscription_name}} is now active on the BhoomiOne Platform!\n\nYour company {{company_name}} now has full access to the Map-First developer engine.\n\nBest Regards,\nBhoomiOne Commercial Gateway",
            ],
            [
                'template_key' => 'SUBSCRIPTION_RENEWED',
                'name' => 'Subscription Renewed Successfully',
                'subject' => 'License Renewed: {{subscription_name}} Platform License',
                'body_html' => '<h2>Subscription Invoice Settled</h2>
<p>Your subscription to <strong>{{subscription_name}}</strong> has been successfully renewed.</p>
<p>An amount of <strong>INR {{amount}}</strong> was charged to your card/bank account on file.</p>
<p>Your system license remains in high-standing. Next renewal date: <strong>{{expiry_date}}</strong>.</p>
<p>Thank you for choosing BhoomiOne.</p>
<p>Best Regards,<br>BhoomiOne Commercial Billing</p>',
                'body_text' => "Subscription Invoice Settled\n\nYour subscription to {{subscription_name}} has been successfully renewed.\n\nAmount Charged: INR {{amount}}\nNext Renewal: {{expiry_date}}\n\nThank you for choosing BhoomiOne.",
            ],
            [
                'template_key' => 'INVOICE_GENERATED',
                'name' => 'Invoice Generated Ledger',
                'subject' => 'New Invoice Generated: #{{invoice_number}}',
                'body_html' => '<h2>New Administrative Invoice Generated</h2>
<p>A new platform invoice has been generated for your recent subscription cycle or addon purchases:</p>
<ul>
    <li><strong>Invoice Number:</strong> {{invoice_number}}</li>
    <li><strong>Tenant Workspace:</strong> {{tenant_name}}</li>
    <li><strong>Total Value:</strong> INR {{amount}}</li>
</ul>
<p>Please log in to your SaaS administrator account to download the complete tax ledger invoice or make outstanding payments.</p>
<p>Best Regards,<br>BhoomiOne Commercial Billing</p>',
                'body_text' => "New Administrative Invoice Generated\n\nInvoice Number: {{invoice_number}}\nTenant Workspace: {{tenant_name}}\nTotal Value: INR {{amount}}\n\nBest Regards,\nBhoomiOne Commercial Billing",
            ],
            [
                'template_key' => 'PAYMENT_RECEIVED',
                'name' => 'Payment Confirmation Receipt',
                'subject' => 'Payment Receipt for Invoice #{{invoice_number}}',
                'body_html' => '<h2>Payment Settle Confirmation</h2>
<p>Thank you for your payment! This is a formal receipt indicating that <strong>INR {{amount}}</strong> has been successfully credited against Invoice #<strong>{{invoice_number}}</strong>.</p>
<p>Your license account and all active tenant subdomains are running in high standing.</p>
<p>Best Regards,<br>BhoomiOne Billing Services</p>',
                'body_text' => "Payment Settle Confirmation\n\nThank you for your payment! This is a formal receipt indicating that INR {{amount}} has been successfully credited against Invoice #{{invoice_number}}.\n\nBest Regards,\nBhoomiOne Billing Services",
            ],
            [
                'template_key' => 'TRIAL_EXPIRY',
                'name' => 'Trial Period Expiry Warning',
                'subject' => 'URGENT: Trial License Expiry Notice',
                'body_html' => '<h2>Your Trial License is Expiring</h2>
<p>This is an automated notification warning you that the trial license for <strong>{{tenant_name}}</strong> will expire on <strong>{{expiry_date}}</strong>.</p>
<p>To avoid any disruption in Interactive Maps, plots workflows, or accounting features, please upgrade to a premier enterprise package now.</p>
<p>Upgrades are safe, near-instant, and do not impact your workspace data.</p>
<p>Best Regards,<br>BhoomiOne Licensing Desk</p>',
                'body_text' => "Your Trial License is Expiring\n\nThis is an automated warning that the trial license for {{tenant_name}} will expire on {{expiry_date}}.\n\nPlease upgrade to a paid enterprise plan to prevent service disruption.",
            ],
            [
                'template_key' => 'ACCOUNT_SUSPENDED',
                'name' => 'Account Suspended Notice',
                'subject' => 'SaaS License Alert: Account Temporarily Suspended',
                'body_html' => '<h2 style="color: #ef4444;">Compliance Suspended</h2>
<p>Please be advised that your BhoomiOne SaaS account for <strong>{{company_name}}</strong> (and its associated tenant workspace <strong>{{tenant_name}}</strong>) has been temporarily suspended due to administrative non-payment or compliance policy reviews.</p>
<p>Your maps, leads, and accounting transactions are safe but are locked from operations until reactivation is authorized.</p>
<p>Please contact support immediately at <strong>support@bhoomione.in</strong> to resolve this issue.</p>
<p>Best Regards,<br>BhoomiOne Trust & Compliance Unit</p>',
                'body_text' => "Compliance Suspended\n\nPlease be advised that your BhoomiOne SaaS account for {{company_name}} has been temporarily suspended due to non-payment or compliance policy reviews.\n\nPlease contact support immediately at support@bhoomione.in to resolve this issue.",
            ],
            [
                'template_key' => 'ACCOUNT_REACTIVATED',
                'name' => 'Account Reactivated Notice',
                'subject' => 'Access Restored: Account Successfully Reactivated',
                'body_html' => '<h2 style="color: #10b981;">Access Re-Authorized!</h2>
<p>Great news! Your SaaS tenant account and routing paths for <strong>{{tenant_name}}</strong> have been fully reactivated.</p>
<p>All Interactive Map portals, GIS layouts, plot reservation gates, and transactional payment ledgers are restored and fully active.</p>
<p>Thank you for your patience during this resolution process.</p>
<p>Best Regards,<br>BhoomiOne Trust & Compliance Unit</p>',
                'body_text' => "Access Re-Authorized!\n\nYour SaaS tenant account for {{tenant_name}} has been fully reactivated.\n\nThank you for your patience.",
            ],
        ];

        foreach ($templates as $t) {
            EmailTemplate::updateOrCreate(
                ['template_key' => $t['template_key']],
                [
                    'id' => EmailTemplate::where('template_key', $t['template_key'])->value('id') ?: (string) Str::uuid(),
                    'name' => $t['name'],
                    'subject' => $t['subject'],
                    'body_html' => $t['body_html'],
                    'body_text' => $t['body_text'],
                ]
            );
        }
    }
}
