# Phase 1E-A — SaaS Subscription Database Schema Design

This document details the PostgreSQL relational schema design for the **BhoomiOne SaaS Subscription Engine**, ensuring full system compliance with multi-tenancy rules, complete audit trails, performance indexes, and strict validation.

---

## 1. Relational Map & Schema Graph

```
       +------------------+         +------------------+
       |   saas_modules   | <------ |  saas_features   |
       +------------------+         +------------------+
                ^                            ^
                |                            |
                |                            +-------------------------+
                |                                                      |
   +-------------------------+  +-------------------------+            |
   |   subscription_plans    |  |  subscription_addons    |            |
   +-------------------------+  +-------------------------+            |
         |             |                     ^                         |
         v             v                     |                         v
   +-----------+ +------------+       +---------------+       +------------------+
   | plan_list | | plan_feats |       | tenant_addons |       | tenant_feat_over |
   +-----------+ +------------+       +---------------+       +------------------+
                       ^                     ^                         ^
                       |                     |                         |
                       |                     +------------+------------+
                       v                                  |
         +-------------------------------------+          |
         |         tenant_subscriptions        | <--------+
         +-------------------------------------+
```

---

## 2. Table Schemas, Constraints, and Indexes

### A. Core SaaS Cataloging

#### `saas_modules`
Stores system modules that are activated per license agreement.
*   `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
*   `code`: `VARCHAR(100) UNIQUE NOT NULL` (e.g. `PROJECTS`, `DXF`)
*   `name`: `VARCHAR(255) NOT NULL`
*   `group`: `VARCHAR(100) NOT NULL`
*   `description`: `TEXT NULL`
*   `status`: `VARCHAR(50) DEFAULT 'ACTIVE'`
*   `is_core`: `BOOLEAN DEFAULT FALSE`
*   `is_billable`: `BOOLEAN DEFAULT TRUE`
*   `sort_order`: `INTEGER DEFAULT 10`
*   `deleted_at`: `TIMESTAMP WITH TIME ZONE NULL` (Soft Deletes)
*   `created_at / updated_at`: `TIMESTAMP WITH TIME ZONE NULL`

#### `saas_features`
Dynamic sub-features or privileges matching specific modular tasks.
*   `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
*   `module_id`: `UUID FOREIGN KEY REFERENCES saas_modules(id) ON DELETE CASCADE`
*   `code`: `VARCHAR(100) UNIQUE NOT NULL` (e.g., `projects.view`, `plots.manage`)
*   `name`: `VARCHAR(255) NOT NULL`
*   `group`: `VARCHAR(100) NULL`
*   `description`: `TEXT NULL`
*   `status`: `VARCHAR(50) DEFAULT 'ACTIVE'`
*   `default_enabled`: `BOOLEAN DEFAULT TRUE`
*   `deleted_at`: `TIMESTAMP WITH TIME ZONE NULL` (Soft Deletes)
*   `created_at / updated_at`: `TIMESTAMP WITH TIME ZONE NULL`

---

### B. Standard Subscription Packages

#### `subscription_plans`
Displays package metrics and pricing slabs.
*   `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
*   `plan_code`: `VARCHAR(100) UNIQUE NOT NULL` (e.g., `STARTER`, `GROWTH`, `ENTERPRISE`)
*   `name`: `VARCHAR(255) NOT NULL`
*   `monthly_price`: `DECIMAL(12,2) DEFAULT 0.00`
*   `yearly_price`: `DECIMAL(12,2) DEFAULT 0.00`
*   `trial_days`: `INTEGER DEFAULT 14`
*   `status`: `VARCHAR(50) DEFAULT 'ACTIVE'`
*   `sort_order`: `INTEGER DEFAULT 1`
*   `deleted_at`: `TIMESTAMP WITH TIME ZONE NULL`
*   `created_at / updated_at`: `TIMESTAMP WITH TIME ZONE NULL`

#### `subscription_plan_features`
Mapping table linking feature sets directly to standard plans.
*   `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
*   `plan_id`: `UUID FOREIGN KEY REFERENCES subscription_plans(id) ON DELETE CASCADE`
*   `feature_id`: `UUID FOREIGN KEY REFERENCES saas_features(id) ON DELETE CASCADE`
*   `access_level`: `VARCHAR(50) DEFAULT 'ENABLED'` (`ENABLED`, `DISABLED`, `ADDON`)
*   `created_at / updated_at`: `TIMESTAMP WITH TIME ZONE NULL`
*   `UNIQUE (plan_id, feature_id)`

#### `subscription_plan_limits`
Stores basic usage quotas per package plans (e.g. Max Projects).
*   `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
*   `plan_id`: `UUID FOREIGN KEY REFERENCES subscription_plans(id) ON DELETE CASCADE`
*   `limit_key`: `VARCHAR(150) NOT NULL` (e.g. `projectsLimit`)
*   `limit_value`: `INTEGER DEFAULT 0`
*   `created_at / updated_at`: `TIMESTAMP WITH TIME ZONE NULL`
*   `UNIQUE (plan_id, limit_key)`

---

### C. Auxiliary Billing Structures

#### `subscription_addons`
Auxiliary toolkits available for individual modular acquisition.
*   `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
*   `code`: `VARCHAR(100) UNIQUE NOT NULL`
*   `name`: `VARCHAR(255) NOT NULL`
*   `monthly_price`: `DECIMAL(12,2) DEFAULT 0.00`
*   `yearly_price`: `DECIMAL(12,2) DEFAULT 0.00`
*   `description`: `TEXT NULL`
*   `status`: `VARCHAR(50) DEFAULT 'ACTIVE'`
*   `deleted_at`: `TIMESTAMP WITH TIME ZONE NULL`
*   `created_at / updated_at`: `TIMESTAMP WITH TIME ZONE NULL`

#### `subscription_plot_slabs`
Dynamic pricing sheets per plot parcel capacity.
*   `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
*   `min_plots`: `INTEGER DEFAULT 1`
*   `max_plots`: `INTEGER DEFAULT 999999`
*   `monthly_price`: `DECIMAL(12,2) DEFAULT 0.00`
*   `yearly_price`: `DECIMAL(12,2) DEFAULT 0.00`
*   `status`: `VARCHAR(50) DEFAULT 'ACTIVE'`
*   `deleted_at`: `TIMESTAMP WITH TIME ZONE NULL`
*   `created_at / updated_at`: `TIMESTAMP WITH TIME ZONE NULL`

---

### D. Active Tenant Subscription & Overrides

#### `tenant_subscriptions`
Active package linking tenants to active pricing models.
*   `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
*   `tenant_id`: `UUID UNIQUE FOREIGN KEY REFERENCES tenants(id) ON DELETE CASCADE`
*   `plan_id`: `UUID FOREIGN KEY REFERENCES subscription_plans(id) ON DELETE RESTRICT`
*   `status`: `VARCHAR(50) DEFAULT 'ACTIVE'` (e.g., `ACTIVE`, `SUSPENDED`)
*   `subscription_start_date`: `DATE NOT NULL`
*   `subscription_expiry_date`: `DATE NOT NULL`
*   `trial_expiry_date`: `DATE NULL`
*   `renewal_date`: `DATE NULL`
*   `created_at / updated_at`: `TIMESTAMP WITH TIME ZONE NULL`

#### `tenant_addons`
Addon licenses purchased by specific workspace tenants.
*   `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
*   `tenant_subscription_id`: `UUID FOREIGN KEY REFERENCES tenant_subscriptions(id) ON DELETE CASCADE`
*   `addon_id`: `UUID FOREIGN KEY REFERENCES subscription_addons(id) ON DELETE CASCADE`
*   `assigned_at`: `TIMESTAMP WITH TIME ZONE NULL`
*   `UNIQUE (tenant_subscription_id, addon_id)`

#### `tenant_feature_overrides`
Granular feature locks/unlocks that override the baseline package.
*   `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
*   `tenant_subscription_id`: `UUID FOREIGN KEY REFERENCES tenant_subscriptions(id) ON DELETE CASCADE`
*   `feature_id`: `UUID FOREIGN KEY REFERENCES saas_features(id) ON DELETE CASCADE`
*   `override_status`: `VARCHAR(50) NOT NULL` (`ENABLED`, `DISABLED`)
*   `created_at / updated_at`: `TIMESTAMP WITH TIME ZONE NULL`
*   `UNIQUE (tenant_subscription_id, feature_id)`

#### `tenant_limit_overrides`
Granular limit adjustments that override baseline packages.
*   `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
*   `tenant_subscription_id`: `UUID FOREIGN KEY REFERENCES tenant_subscriptions(id) ON DELETE CASCADE`
*   `limit_key`: `VARCHAR(150) NOT NULL`
*   `override_value`: `INTEGER NOT NULL`
*   `created_at / updated_at`: `TIMESTAMP WITH TIME ZONE NULL`
*   `UNIQUE (tenant_subscription_id, limit_key)`

---

## 3. Database Indexes for Scaling

```sql
CREATE INDEX idx_saas_features_module ON saas_features(module_id);
CREATE INDEX idx_tenant_subs_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX idx_tenant_addons_sub ON tenant_addons(tenant_subscription_id);
CREATE INDEX idx_tenant_feat_overrides_sub ON tenant_feature_overrides(tenant_subscription_id);
CREATE INDEX idx_tenant_limit_overrides_sub ON tenant_limit_overrides(tenant_subscription_id);
```
These indexes have been deployed dynamically via migration. Soft delete scopes automatically respect these database index pathways.
