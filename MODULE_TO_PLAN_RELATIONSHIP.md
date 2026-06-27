# Module-to-Plan Relationship & Baseline License Limits

This document details how modules and features map to standard subscription plan tiers, and defines the system's baseline quotas.

---

## 1. Plan License Tier Definitions

BhoomiOne V2 establishes 4 standard commercial tiers configured inside PostgreSQL via the `subscription_plans`, `subscription_plan_features`, and `subscription_plan_limits` tables.

### A. STARTER PLAN
* **Target Audience**: Individual surveyors, small local property brokers, and basic evaluators.
* **Monthly Fee**: ₹10,000 / mo
* **Baseline Quotas**:
  * Authorized Users: **5**
  * Active Projects: **10**
  * Visual Layouts: **20**
  * Plots Managed: **50**
  * Max File Storage: **10 GB**
* **Included Modules**:
  * Tenant Portal (`TEN_ADM`) - Basic setup.
  * Land Ownership Registry (`OWN_REG`) - Base view.
  * Ground Surveying (`SURVEY`) - Basic logs.

---

### B. GROWTH PLAN
* **Target Audience**: Small-to-mid engineering consultant firms, survey developers, and legal groups.
* **Monthly Fee**: ₹25,000 / mo
* **Baseline Quotas**:
  * Authorized Users: **25**
  * Active Projects: **50**
  * Visual Layouts: **100**
  * Plots Managed: **250**
  * Max File Storage: **100 GB**
* **Included Modules**:
  * *All Starter Modules* +
  * GIS Core and Contours (`GIS`).
  * Property Valuation (`VAL_EST`).
  * Municipal Taxation (`TAX_BIL`).

---

### C. PROFESSIONAL PLAN
* **Target Audience**: Regional developers, industrial park authorities, and larger construction firms.
* **Monthly Fee**: ₹75,000 / mo
* **Baseline Quotas**:
  * Authorized Users: **100**
  * Active Projects: **500**
  * Visual Layouts: **1000**
  * Plots Managed: **5000**
  * Max File Storage: **1 TB (1000 GB)**
* **Included Modules**:
  * *All Growth Modules* +
  * CAD DXF Translators (`CAD_DXF`).
  * Land Acquisition Tracker (`LA_ACQ`).
  * Land Use Zoning (`LUR_PLAN`).
  * Coastal Regulation Zones (`COA_ZON`).
  * Utility & Infrastructure mapping (`UTL_MAP`).

---

### D. ENTERPRISE PLAN
* **Target Audience**: State governments, large infrastructure conglomerates, mining companies, and municipal corporations.
* **Monthly Fee**: ₹250,000 / mo (Negotiable contract pricing)
* **Baseline Quotas**:
  * Authorized Users: **Unlimited (-1)**
  * Active Projects: **Unlimited (-1)**
  * Visual Layouts: **Unlimited (-1)**
  * Plots Managed: **Unlimited (-1)**
  * Max File Storage: **Unlimited (-1)**
* **Included Modules**:
  * **All 23 Platform Modules enabled by default**, including Encroachment Detection (`ENC_DET`), Forestry land registration (`FRT_REG`), Mining royalties (`MIN_ROY`), and Enterprise SSO AD Integration (`OAU_INT`).

---

## 2. Dynamic Relational Querying Model

When a tenant workspace requests feature flag authorization or limit checking, the API does **not** reference static files or configuration files. Instead, it queries the database through a single unified view or query structure:

### The Authorization Resolve Path:
1. Fetch the tenant's current subscription from `tenant_subscriptions`.
2. Retrieve baseline features enabled under `subscription_plan_features` for the assigned plan.
3. Retrieve baseline limits under `subscription_plan_limits`.
4. Apply standard **Tenant Overrides**:
   - Merge `tenant_feature_overrides` (superseding standard plan features with explicit `ENABLED` or `DISABLED` states).
   - Merge `tenant_module_overrides` (entire module level overrides).
   - Merge `tenant_limit_overrides` (which raise limits like user counts or storage space).
5. Load assigned optional addons from `tenant_addons` to grant further module permissions.
6. Compile the final runtime workspace authority matrix dynamically.

This architecture ensures zero latency in runtime changes, zero build updates on modification, and bulletproof relational constraints.
