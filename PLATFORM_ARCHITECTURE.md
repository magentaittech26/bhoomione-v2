# BhoomiOne V3 - SaaS Platform Architecture Specification

This document details the system design, modular boundaries, and operational characteristics of the **BhoomiOne SaaS Platform** (Domain 1).

---

## 1. System Vision & Audience

The SaaS Platform is owned and operated exclusively by **BhoomiOne System Super-Administrators**. All modules, controls, and configurations in this domain govern the system as a whole. No tenant-level business transactions, plot inventories, CRM logs, or customer accounts are stored, managed, or visible inside this domain.

---

## 2. Structural Module Breakdown

```
+-----------------------------------------------------------------------------------------------------------------+
|                                              SaaS Platform Modules                                              |
+-----------------------------------------------------------------------------------------------------------------+
|  [Dashboard]          -> Live aggregate MRR, tenant health metrics, active licenses, and resource telemetry.   |
|  [Workspace Tenants]  -> Provision, suspend, reactivate, or archive tenant subdomains & database schemas.      |
|  [Subscription Center]-> Plan master, add-on features directory, monthly/annual billings, usage limits ledger. |
|  [Module Registry]    -> Directory of optional system modules and global feature-gate definitions.              |
|  [Tenant Overrides]   -> Custom pricing slabs, bespoke resource quotas, and contract renewals per tenant.       |
|  [Audit Logs]         -> Centralized platform telemetry, administrative access logs, and security events.      |
|  [Settings]           -> Multi-group corporate settings console for granular platform properties.               |
+-----------------------------------------------------------------------------------------------------------------+
```

---

## 3. Settings Framework Detail

The settings console is partitioned into dedicated segments to ensure distinct operational governance:

### A. Platform Core
- **General Settings**: Baseline branding details, support contact coordinates, platform naming.
- **Company Details**: Legal registered entity parameters (corporate name, address, corporate PAN, CIN, legal entity details).
- **Branding**: Dynamic asset injection (SVG/PNG logos, system-wide light/dark color accents, theme settings).
- **Localization**: Corporate timezones (`Asia/Kolkata`), standard date-time representations, country codes.
- **Security & MFA**: Multi-factor authentication policies, administrative session timeouts, password strength gates.

### B. Platform Commercial
- **Billing Gateway**: Stripe / Razorpay API credentials, environment modes (Sandbox vs Live), webhook signing keys.
- **Platform Tax & Invoice Configuration**: Corporate taxation coefficients (CGST, SGST, IGST) used exclusively for billing tenants, SAC code 997331 definitions, and real-time document preview engines.
- **Subscription Plans**: Creation, modification, and locking of standardized pricing tiers (Basic, Growth, Enterprise).
- **Subscription Features**: Core platform features bound to standard tiers.
- **Subscription Add-ons**: Slabs and prices for modular upgrades (e.g., interactive 3D map viewer, CAD importing tools).
- **Promo Coupons**: Percentage-based or flat-rate coupon discounts applied on billing cycles.
- **Marketing Campaigns**: Promotional banner injection controls and active upgrade-incentive banners.

### C. Communications
- **Email SMTP Setup**: Outbound transactional SMTP relay servers (Mailgun, SendGrid) used to dispatch license receipts, password resets, and admin notifications.
- **WhatsApp Provider**: Association of commercial Meta API keys for transactional alerts.
- **SMS Provider**: Dynamic Twilio / SMS Gupshup API parameters.
- **Notification Services**: Global triggers governing platform notifications.

### D. Infrastructure
- **Domains & DNS**: Configuration of custom wildcard domains (`*.bhoomione.in`) and reverse-proxy route configurations.
- **SSL Certificates**: Automated Let's Encrypt renewal telemetry and TLS certificate paths.
- **Storage Volumes**: Storage thresholds and limits mapped for files and assets.
- **Audit Retention**: Policy lifespans determining when historic logs are moved to cold archival stores.
- **Telemetry & Monitoring**: Cluster resource utilization metrics, container health, active proxy tunnels.
- **Cache & Queue**: Redis parameters and background worker queues.
- **Backups**: Standard automated snapshotting schedules.

### E. Platform APIs
- **API Keys**: Access keys generated to integrate standard external applications.
- **Webhooks**: Endpoints configured to receive lifecycle webhooks.
- **OAuth Integrations**: Association of third-party platforms for federated login.

---

## 4. Operational Boundaries

- **Zero Business Logic**: The platform console does not understand what a "plot size", "stamp duty rate", "layout map", or "lead status" is.
- **Failure Isolation**: Settings components are strictly guarded via local Error Boundaries. If an email provider or SMS service crashes, core SaaS subscription licensing functions continue unimpeded.
