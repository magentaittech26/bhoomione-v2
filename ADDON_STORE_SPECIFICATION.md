# BhoomiOne v2: Add-on Store Specification

This specification governs the database-driven Add-on taxonomy and catalog.

## 1. Categorization Scheme
To ensure a structured upsell mechanism, all platform add-ons are partitioned into three mutually exclusive categories:

### A. Feature Add-ons (`feature`)
- **Description**: Grants access to specialized modules or integrations not present in the tenant's base subscription.
- **Examples**: DXF CAD Exporter Module, Automated WhatsApp Alerts Webhook.

### B. Capacity Add-ons (`capacity`)
- **Description**: Expands numeric resource limits without changing the core subscription plan.
- **Examples**: Extra 50 GB Cloud Storage, Additional 5 Team Members.

### C. Service Add-ons (`service`)
- **Description**: Connects human-assisted specialized services directly through the digital platform.
- **Examples**: Premium GIS Mapping Setup, Custom CNAME SSL Integration Support.

## 2. Catalog Database Contract
Add-ons are retrieved dynamically via `GET /api/saas/addons` and stored within the `subscription_addons` table:

```sql
CREATE TABLE subscription_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    addon_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('feature', 'capacity', 'service')),
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    billing_period VARCHAR(20) NOT NULL DEFAULT 'monthly',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 3. UI Presentation Guidelines
- **Responsive Grid**: Render add-ons using a responsive grid layout highlighting pricing and category badges.
- **Zero Hardcoding**: Add-on list view must populate dynamically from the database. No static arrays should represent current catalog items in React.
