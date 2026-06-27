# SaaS Settings Restructure Specification
**BhoomiOne v2 – Phase 1F.13**

## 1. Categorized Sidebar Organization
To prevent cognitive overload, the SaaS Platform Settings left-navigation has been organized into four distinct, semantic categories:

### Category 1: Platform Core
- **General Settings**: Basic platform names, organization, and profile keys.
- **Company Details**: Registered corporate addresses and corporate names.
- **Portal Branding**: Custom workspace logos, login screens, and color values.
- **Localization Info**: Global timezones and date formatting.
- **Security & MFA Policies**: Session timeouts, password strength, and corporate MFA toggles.

### Category 2: Commercial Engine
- **Billing & Gateway**: Configures payment gateway parameters (Razorpay integration keys), billing cron schedules, webhook logs, and automated collection retry logs.
- **Internal Pricing Rules**: Consolidates the former tenant-facing "Plot Billing" slabs into an administrative pricing rules dashboard for plot scale fees.
- **Promo Coupons**: Manage seasonal discount coupon codes (e.g., percentage discount recurring rates, municipal waivers).
- **Active Campaigns**: Set in-app marketing promotion banners designed to trigger upsells.
- **Currency Configuration**: Verify default INR base symbols.
- **GST Taxes Schema**: Setup country-specific IGST/CGST tax coefficients.

### Category 3: Communications
- **Email SMTP Setup**: Establish outbound SMTP mail relay services.
- **WhatsApp Gateway**: Enterprise WhatsApp API webhooks and credentials.
- **SMS Gateway Routing**: Direct connection strings to transaction SMS relays.
- **Notifications & Alerts**: Automated renewal reminders and grace period alerts.

### Category 4: Infrastructure & Audit
- **Domains & Routing**: Workspace CNAME custom hostname proxy rules.
- **Storage Volumes**: Disk upload and size boundaries.
- **Audit Log Lifespans**: Numeric retention configurations.
- **System Telemetry**: Ingress container ports and Nginx proxy configs.
