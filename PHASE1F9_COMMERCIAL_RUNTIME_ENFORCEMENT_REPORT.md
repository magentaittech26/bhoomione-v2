# PHASE 1F.9 – BHOOMIONE COMMERCIAL RUNTIME ENFORCEMENT ENGINE REPORT

## 1. Executive Summary
BhoomiOne's Commercial Runtime Enforcement Layer has been successfully implemented, fully decoupling feature and limit access from raw RBAC role permissions. 

The architecture guarantees:
- **Tenant Isolation & Context Resolution**: The gateway dynamically resolves active tenants and recalculates full entitlement status per-request.
- **Strict Decoupled Registry**: Active permissions (`projects.view`, etc.) are processed independently from commercial feature codes (`gis_maps`, `dxf_import`, etc.).
- **Rigid Enforcement Pipeline**: Requests undergo a dual-tier validation flow:
  1. **Commercial Feature Check**: Verified via `SubscriptionEnforcementEngine` (returns `403 FEATURE_NOT_AVAILABLE`).
  2. **RBAC Permission Check**: Handshaked via role-privilege assignments (returns `403 ACCESS_DENIED`).

---

## 2. Core Architectural Components

### A. Dynamic Subscription Enforcement Engine (`SubscriptionEnforcementEngine`)
The single, consolidated source of truth for commercial state resolution.

#### 1. Feature Resolution Pipeline
- **Method**: `SubscriptionEnforcementEngine::hasFeature(string $tenantId, string $featureCode): bool`
- **Official Resolution Priority Order**:
  1. **Tenant Feature Overrides** (explicit positive/negative tenant overrides inside `tenant_feature_overrides`).
  2. **Purchased Feature Add-ons** (active commercial add-ons purchased via the storefront).
  3. **Plan Features** (inherent features bound directly to the tenant's current baseline subscription tier).
  4. **Platform Default** (baseline default settings).

#### 2. Limit Resolution Pipeline
- **Method**: `SubscriptionEnforcementEngine::getEffectiveLimits(string $tenantId): array`
- **Official Resolution Priority Order**:
  1. **Tenant Limit Overrides** (custom capacity thresholds mapped in `tenant_limit_overrides`).
  2. **Purchased Capacity Add-ons** (cumulative capacity quotas acquired through storefront).
  3. **Plan Limits** (the maximum limits inherent to the baseline subscription plan).
  4. **Platform Default** (baseline default levels).

- **Supported Resource Keys**:
  - `projectsLimit` (maximum authorized projects)
  - `layoutsLimit` (maximum authorized layouts)
  - `plotsLimit` (maximum registered sub-plots)
  - `usersLimit` (authorized system user accounts)
  - `fileStorageGb` (cumulative CAD DXF document storage)

---

## 3. Gating & Enforcement Strategies

### A. API-Level Feature Gating (`SubscriptionFeatureGate`)
- Intercepts requests and enforces feature-specific endpoints.
- Denies requests with a standardized `403 FEATURE_NOT_AVAILABLE` status when un-entitled features are hit.

### B. Capacity Threshold Gating (`checkLimit`)
- Validates current usage counters plus requested quantity before resource creation.
- Logs a detailed security warning when thresholds are crossed.
- Throws a standard `LIMIT_EXCEEDED` exception, returning detailed usage parameters (`limit`, `current_usage`) to help the frontend prompt subscription upgrades.

### C. Frontend Menu Enforcement & Tab Gating
- Gated dynamically on mount by fetching active features directly from the backend subscription engine:
  - **CAD Imports Tab**: Hidden if the tenant lacks `dxf_import`.
  - **Interactive Map Tab**: Hidden if the tenant lacks `gis_maps`.
  - **Plots Tab**: Disabled and locked (`🔒`) if the tenant lacks `plot_grid_view`.
  - **Marketplace, Customer Portal, Agent Portal Buttons**: Conditionally shown in the sandbox switcher based on corresponding features.

---

## 4. Audit Logging Registry
State transformations and entitlement evaluations are recorded in real-time inside the database:
- `FEATURE_ACCESS_GRANTED`: Evaluation successful.
- `FEATURE_ACCESS_DENIED`: Blocked due to missing commercial entitlements.
- `LIMIT_EXCEEDED`: Capacity threshold breached.
- `ADDON_FEATURE_ENABLED` / `ADDON_FEATURE_DISABLED`: Dynamic add-on subscription toggled.
