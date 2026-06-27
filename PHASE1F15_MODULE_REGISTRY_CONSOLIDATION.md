# Phase 1F.15 – Module Registry & Commercial Architecture Consolidation

This document details the architecture, relational schemas, and unified design of the BhoomiOne V2 Commercial Engine as of the Phase 1F.15 consolidation sprint.

---

## 1. Executive Summary

BhoomiOne V2's Commercial Engine transitions from independent modules, plans, and override systems into a **single, unified, Postgres-driven source of truth**. Hardcoded lists, manual flag arrays, and mock-driven profiles are eliminated in favor of a relational, strict, cascading metadata schema.

### The Unified Hierarchy

All configurations flow from the platform down to the tenant workspace:

```
Platform Ecosystem Registry
  ↓
  ├── Modules (saas_modules)
  │     ↓
  │     └── Features (saas_features)
  │
  └── Subscription Plans (subscription_plans)
        ↓
        ├── Assigned Features (subscription_plan_features)
        ├── Plan Quotas & Limits (subscription_plan_limits)
        ├── Add-on Extensions (saas_addons / subscription_addons)
        └── Custom Contract Overrides
              ├── Feature Flags (tenant_feature_overrides)
              ├── Hard Quotas (tenant_limit_overrides)
              ├── Module Toggles (tenant_module_overrides)
              └── Custom Contracts & Billing (tenant_billing_overrides)
                    ↓
                    Tenant Workspace Authority
```

---

## 2. PostgreSQL Relational Schemas

The consolidated architecture utilizes the following 10 unified database tables within PostgreSQL:

### A. Core Registries

#### 1. `saas_modules`
Stores the high-level functional system boundaries.
```sql
CREATE TABLE saas_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(50) DEFAULT '1.0.0',
  visibility VARCHAR(50) DEFAULT 'EXTERNAL', -- INTERNAL, EXTERNAL, PRIVATE
  type VARCHAR(50) DEFAULT 'CORE',            -- CORE, COMPANION, SERVICE
  dependencies JSONB DEFAULT '[]',            -- Array of code strings
  is_system BOOLEAN DEFAULT FALSE,            -- Critical system modules
  is_deprecated BOOLEAN DEFAULT FALSE,
  is_upgradeable BOOLEAN DEFAULT TRUE,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. `saas_features`
Specifies individual granular operational actions or attributes tied to modules.
```sql
CREATE TABLE saas_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES saas_modules(id) ON DELETE CASCADE,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'UI_FEATURE',      -- UI_FEATURE, API_ENDPOINT, SYSTEM_LIMIT
  is_upgradeable BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE,
  is_deprecated BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### B. Standard Catalog Products

#### 3. `subscription_plans`
Stores the base tiers of licensing (Starter, Growth, Professional, Enterprise).
```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  monthly_rate NUMERIC(15,2) DEFAULT 0.00,
  yearly_rate NUMERIC(15,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. `subscription_plan_features`
The many-to-many relationship mapping default features to subscription base tiers.
```sql
CREATE TABLE subscription_plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES saas_features(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plan_id, feature_id)
);
```

#### 5. `subscription_plan_limits`
Stores baseline numerical quotas per plan tier (e.g., maximum project counts, files size limitations).
```sql
CREATE TABLE subscription_plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  limit_key VARCHAR(150) NOT NULL,
  limit_value INTEGER NOT NULL, -- -1 represents "Unlimited"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plan_id, limit_key)
);
```

#### 6. `subscription_addons` / `saas_addons`
Optional modular additions purchasable on top of any active subscription.
```sql
CREATE TABLE subscription_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  monthly_price NUMERIC(15,2) DEFAULT 0.00,
  yearly_price NUMERIC(15,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### C. Tenant Subscriptions & Override Mappings

#### 7. `tenant_subscriptions`
Stores the active license tier allocated to specific tenant workspaces.
```sql
CREATE TABLE tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  subscription_start_date DATE NOT NULL,
  subscription_expiry_date DATE NOT NULL,
  trial_expiry_date DATE,
  renewal_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 8. `tenant_feature_overrides`
Explicitly forces enable or disable on custom actions, superseding plan-level configurations.
```sql
CREATE TABLE tenant_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_subscription_id UUID REFERENCES tenant_subscriptions(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES saas_features(id) ON DELETE CASCADE,
  override_status VARCHAR(50) NOT NULL, -- 'ENABLED', 'DISABLED'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_subscription_id, feature_id)
);
```

#### 9. `tenant_limit_overrides`
Raises or lowers hard entity limits on specific tenant nodes.
```sql
CREATE TABLE tenant_limit_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_subscription_id UUID REFERENCES tenant_subscriptions(id) ON DELETE CASCADE,
  limit_key VARCHAR(150) NOT NULL,
  override_value INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_subscription_id, limit_key)
);
```

#### 10. `tenant_module_overrides`
Explicitly disables or enables entire platform modules for unique enterprise nodes.
```sql
CREATE TABLE tenant_module_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_subscription_id UUID REFERENCES tenant_subscriptions(id) ON DELETE CASCADE,
  module_id UUID REFERENCES saas_modules(id) ON DELETE CASCADE,
  override_status VARCHAR(50) NOT NULL, -- 'ENABLED', 'DISABLED'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_subscription_id, module_id)
);
```

#### 11. `tenant_billing_overrides`
Overrides base catalogs to persist custom contract parameters, customized SLA agreements, and unique pricing details.
```sql
CREATE TABLE tenant_billing_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_subscription_id UUID REFERENCES tenant_subscriptions(id) ON DELETE CASCADE UNIQUE,
  custom_monthly_fee NUMERIC(15,2),
  custom_annual_fee NUMERIC(15,2),
  custom_discount_percentage NUMERIC(5,2) DEFAULT 0.00,
  special_contract_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Benefits of Database-Driven Consolidation

1. **Transactional Integrity**: All pricing, overrides, and flag activations are queried in runtime dynamically from the database.
2. **Single Source of Truth**: Modules and Features are explicitly registered, meaning changes propagate seamlessly across both standard plans and individual workspace configurations.
3. **No Hardcoding**: Commercial tiers are defined entirely through relational tables, permitting administrators to create and adjust offerings on the fly without system redeployment.
