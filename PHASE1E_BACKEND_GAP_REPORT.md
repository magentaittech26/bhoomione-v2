# Phase 1E Backend Gap & Architecture Report

## 1. Architectural Gap Analysis
The existing backend APIs in `/src/lib/api.ts` focus on a simple schema structure:
* `api.fetchAdminTenants()` &rightarrow; Retrieves basic subdomain names and plans.
* `api.createAdminTenant()` &rightarrow; Simple name / subdomain / standard plan.

To bridge the gap between our high-fidelity dynamic subscription control panel and the server, we implemented an offline-first state engine synchronized through secure, session-isolated client `localStorage` buffers. No backend routes, controllers, or database migrations were altered on the staging servers, fully respecting BhoomiOne staging constraints.

---

## 2. Proposed Backend REST API Gap-Map

To persist these dynamic configurations permanently in the microservices, the following database and endpoints are required on future backend iterations:

### A. New API Endpoints Schema
```text
GET    /api/v1/admin/modules          - Extract list of dynamic SaaS modules
POST   /api/v1/admin/modules          - Register new global module
PUT    /api/v1/admin/modules/:code    - Modify module metadata, core state, or status

GET    /api/v1/admin/features         - Retrieve system catalog of feature toggles
POST   /api/v1/admin/features         - Add dynamic functional permission block

GET    /api/v1/admin/plans            - Fetch baseline tier specifications & pricing
PUT    /api/v1/admin/plans/:code      - Adjust tier prices or display sort orders

GET    /api/v1/admin/plans/:code/limits - Retrieve general plan baseline numeric parameters
PUT    /api/v1/admin/plans/:code/limits - Adjust numeric parameters (e.g. storage GB, project limits)

GET    /api/v1/admin/matrix           - Fetch entire feature-plan relational matrix
PUT    /api/v1/admin/matrix           - Update feature matrix permissions cells

GET    /api/v1/admin/tenants/:code/subscription - Extract tenant overrides, addons and billing active states
PUT    /api/v1/admin/tenants/:code/subscription - Update overrides, assign addons or mutate plan level
```

---

## 3. Database Migration Blueprint Schema
The following PostgreSQL tables must be provisioned to structure these relational records dynamically:

```sql
-- 1. SAAS MODULE REGISTRY
CREATE TABLE saas_modules (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    module_group VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    is_core BOOLEAN DEFAULT FALSE,
    is_billable BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DYNAMIC SYSTEM FEATURES
CREATE TABLE saas_features (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    module_code VARCHAR(50) REFERENCES saas_modules(code) ON DELETE CASCADE,
    feature_group VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    default_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. PLAN MASTER
CREATE TABLE saas_plans (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    monthly_price NUMERIC(10, 2) NOT NULL,
    yearly_price NUMERIC(10, 2) NOT NULL,
    trial_days INT DEFAULT 14,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    sort_order INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. BASELINE PLAN LIMITS
CREATE TABLE saas_plan_limits (
    plan_code VARCHAR(50) REFERENCES saas_plans(code) ON DELETE CASCADE,
    limit_key VARCHAR(100) NOT NULL,
    limit_value INT NOT NULL,
    PRIMARY KEY (plan_code, limit_key)
);

-- 5. PLAN FEATURE MATRIX CORRELATIONS
CREATE TABLE saas_plan_feature_matrix (
    plan_code VARCHAR(50) REFERENCES saas_plans(code) ON DELETE CASCADE,
    feature_code VARCHAR(50) REFERENCES saas_features(code) ON DELETE CASCADE,
    gate_status VARCHAR(50) DEFAULT 'ENABLED', -- 'ENABLED', 'DISABLED', 'ADDON', 'ENTERPRISE'
    PRIMARY KEY (plan_code, feature_code)
);

-- 6. CAPACITY BILLING SLABS
CREATE TABLE saas_plot_slabs (
    id VARCHAR(50) PRIMARY KEY,
    min_plots INT NOT NULL,
    max_plots INT NOT NULL,
    monthly_price NUMERIC(10,2) NOT NULL,
    yearly_price NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- 7. TENANT SUBSCRIPTIONS & OVERRIDES
CREATE TABLE tenant_subscriptions (
    tenant_code VARCHAR(50) PRIMARY KEY,
    current_plan_code VARCHAR(50) REFERENCES saas_plans(code),
    status VARCHAR(50) DEFAULT 'ACTIVE', -- 'TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED'
    addon_codes TEXT[], -- Array of assigned addons
    trial_expiry_date DATE,
    subscription_expiry_date DATE,
    feature_overrides JSONB DEFAULT '{}', -- Tenant-specific Enabled/Disabled overrides
    limit_overrides JSONB DEFAULT '{}',   -- Specific custom limits
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
