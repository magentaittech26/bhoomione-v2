# BhoomiOne SaaS Commercial Engine Consolidation Audit Report
**Phase 1F.7 Comprehensive Architectural Review**
*Author: Principal Enterprise SaaS Architect*
*Status: Approved for Design Phase (Audit Only)*

---

## 1. Executive Summary

This audit establishes the definitive unified blueprint for BhoomiOne's commercial and subscription routing systems. Currently, BhoomiOne supports multiple, overlapping pricing calculations (subscription plans, localized limits, external billing overrides, and localized plot slab billing matrices) that introduce logical complexity.

Our core objective is to **consolidate and internalize BhoomiOne's commercial engine**, making database-backed **Subscription Plans** the primary commercial driver, transitioning **Plot Slabs** to an auxiliary backend cost calculator, and defining a strict priority matrix for dynamic feature-gating, quota limits, and addon entitlements.

---

## 2. Current State Architectural Review

An exhaustive audit of the Laravel database migrations, seeding records, and frontend React controllers reveals a highly normalized schema structure with minor operational bottlenecks and hardcoded assumptions that need systematic resolution.

### A. Persistent PostgreSQL Schemas Audited
*   `subscription_plans`: Stores name, prices (monthly/annual), sorting rank, and trial parameters. (Active & Robust)
*   `saas_modules` / `saas_features`: Stores modules (e.g., PLOTS, INTERACTIVE_MAP) and child features (e.g., `gis_maps`, `satellite_view`). (Active & Highly Clean)
*   `subscription_plan_features`: Pivot connecting plan IDs to feature IDs. (Active)
*   `subscription_plan_limits`: Multi-row mapping of plans to custom numeric limits (e.g., `plotsLimit`, `usersLimit`). (Active)
*   `subscription_addons`: Individual auxiliary paid packages (e.g., WhatsApp, DXF upload engine). (Active)
*   `subscription_plot_slabs`: Tiered plot quantity pricing ranges (e.g., 1-50, 51-200 plots). Currently exposed as a public tier, which conflicts with standard plans.
*   `tenant_subscriptions`: The central active subscription link mapped to a singular tenant workspace. (Active)
*   `tenant_addons`: Associates tenant subscriptions to activated addon packages. (Active)
*   `tenant_feature_overrides`: Custom boolean permission overrides mapped directly to features. (Active)
*   `tenant_limit_overrides`: Custom numeric quota overrides mapped to limit keys. (Active)
*   `tenant_billing_overrides`: Special contract monthly/annual fees and discount rates. (Active)

### B. Identified Duplications, Overlaps & Conflicting Responsibilities
1.  **Plot Slab vs. Plan Plot Limit Overlap**: The database supports both a `subscription_plot_slabs` table and a `plotsLimit` key inside `subscription_plan_limits`. This creates dual-authority when checking if a tenant can add more plots: Does the plan restrict them, or does the slab dynamically charge them?
2.  **Addon Pricing vs. Feature Matrix**: Several feature-flags overlap with available subscription addons. For example, the `WHATSAPP_ADDON` has a database row, while WhatsApp configuration options are governed by standard feature gates. This requires a unified entitlement resolution process.
3.  **Hardcoded UI Assumption**: Current React views implicitly couple plans to specific UX tabs. For instance, the GIS Map and CAD visualizer renderers are toggled by comparing static string lists (e.g., matching the exact text `"STARTER"` or `"GROWTH"`) rather than querying the compiled `/subscription-summary` feature flags.

---

## 3. Target Commercial Model Hierarchy

To eliminate duplicate authorities, we establish a strict structural hierarchy where the Plan is the master commercially exposed blueprint, and all tenant instances are resolved dynamically at runtime:

```
[PLAN MATRIX TEMPLATE]
┌───────────────────────────────────────────────┐
│ Subscription Plan (e.g., Starter/Growth/Pro)  │
├───────────────────────────────────────────────┤
│  ├─ Features (Boolean permission flags)       │
│  ├─ Limits (Numeric limits - users, storage)  │
│  ├─ Plot Capacity Limit (Unified ceiling value)│
│  ├─ Included Add-ons (Base bundled modules)   │
│  └─ Base Pricing Ledger (Monthly/Yearly INR)  │
└───────────────────────────────────────────────┘

[TENANT LIVE RESOLVER]
┌───────────────────────────────────────────────┐
│ Tenant Subscription Instance                  │
├───────────────────────────────────────────────┤
│  ├─ Assigned Plan (Reference ID)              │
│  ├─ Purchased Add-ons (Enabled via ledger)     │
│  ├─ Overrides (Custom feature/limit exceptions)│
│  └─ Billing State (Trial, Active, Suspended)  │
└───────────────────────────────────────────────┘
```

### Table Classifications (KEEP, MERGE, DEPRECATE, REMOVE)

| Table Name | Target Status | Architectural Reasoning |
|---|---|---|
| `saas_modules` | **KEEP** | Essential for grouping logical features into clean subscription scopes. |
| `saas_features` | **KEEP** | Core directory of all system capabilities (e.g., `gis_maps`, `dxf_import`). |
| `subscription_plans` | **KEEP** | The singular commercially exposed platform package. |
| `subscription_plan_features`| **KEEP** | Direct pivot map managing standard features bundled with each plan. |
| `subscription_plan_limits` | **KEEP** | The primary database source for base numeric quotas. |
| `subscription_plot_slabs` | **DEPRECATE / MERGE** | **Deprecate** as a customer-facing product. **Merge** logically as a background administrative lookup utility to calculate dynamic billing tiers for enterprise workspaces overage fees. |
| `subscription_addons` | **KEEP** | Handles distinct, transactional, paid-on-demand platform capabilities. |
| `tenant_subscriptions` | **KEEP** | Crucial operational binding containing lifecycle states. |
| `tenant_addons` | **KEEP** | Stores transactional purchased features outside the base plan. |
| `tenant_feature_overrides` | **KEEP** | Enables granular custom client enablement (e.g., custom pilot features). |
| `tenant_limit_overrides` | **KEEP** | Standardized mechanism to scale individual capacities (e.g., +50 plots). |
| `tenant_billing_overrides` | **KEEP** | Holds manual custom contract values and discount rules safely. |

---

## 4. Feature and Limit Resolution Engines

### A. Feature Resolution Engine (Boolean Permissions)
To determine if a user has access to a functional capability (e.g., opening the `agent_portal` or running a `dxf_import` parse), the system executes a top-down waterfall check. The first match terminates the evaluation:

```
[System Feature Check: 'gis_maps']
                 │
                 ▼
 ┌──────────────────────────────┐
 ├─ 1. Tenant Feature Override? ├─► YES (ENABLED)  ──► ALLOW ACCESS
 └──────────────┬───────────────┘  └─► YES (DISABLED) ──► REFUSE ACCESS
                │
                ▼ (No Override Found)
 ┌──────────────────────────────┐
 ├─ 2. Purchased as Add-on?     ├─► YES (ACTIVE)   ──► ALLOW ACCESS
 └──────────────┬───────────────┘
                │
                ▼ (Not Purchased as Add-on)
 ┌──────────────────────────────┐
 ├─ 3. Bundled with Base Plan?  ├─► YES (ENABLED)  ──► ALLOW ACCESS
 └──────────────┬───────────────┘
                │
                ▼ (Not in Plan Features)
 ┌──────────────────────────────┐
 ├─ 4. Global Platform Default? ├─► Read `default_enabled` in `saas_features`
 └──────────────────────────────┘
```

---

### B. Limit Resolution Engine (Numeric Quotas)
To calculate a tenant's effective capacity (e.g., total allowed users or maximum layouts), the resolver applies an absolute override logic:

```
[Resolve Quota: 'plotsLimit']
                 │
                 ▼
 ┌──────────────────────────────┐
 ├─ 1. Tenant Limit Override?   ├─► FOUND ──► Return override value (Absolute ceiling)
 └──────────────┬───────────────┘
                │
                ▼ (No Custom Limit Override)
 ┌──────────────────────────────┐
 ├─ 2. Base Plan Quota Value?   ├─► FOUND ──► Return base plan limit value
 └──────────────┬───────────────┘
                │
                ▼ (No Plan Value Found)
 ┌──────────────────────────────┐
 ├─ 3. Platform Fail-Safe?      ├─► FALLBACK ──► Return system baseline (e.g., 0 or 10)
 └──────────────────────────────┘
```

---

## 5. Unified Plot Capacity Model

We strongly recommend **Option B: Transition Plot Capacity to a Standardized Plan Limit**.

### A. Architectural Recommendation
*   **The Model**: The number of plots a tenant can manage is governed primarily by a **numeric quota limit** (`plotsLimit`) assigned directly to their active Subscription Plan.
    *   *Starter Plan*: 150 plots limit.
    *   *Growth Plan*: 1,000 plots limit.
    *   *Professional Plan*: 5,000 plots limit.
    *   *Enterprise Plan*: Custom / Unlimited plots (governed by custom `tenant_limit_overrides`).
*   **The Internal Calculator Engine**: The `subscription_plot_slabs` table remains inside the backend database as an **internal cost calculator** for overage calculations.
    *   *Scenario*: An enterprise client wants to exceed their plan's `plotsLimit` by 350 plots.
    *   *The System*: An administrator enters a `tenant_limit_override` of +350 plots. The backend uses the internal `subscription_plot_slabs` billing matrix to automatically determine the incremental monthly fee to add to the invoice ledger.

---

## 6. Add-on Classification Model

To simplify licensing packages, we classify all platform add-ons into three logical categories, each behaving differently in the resolution engines:

### 1. Feature Add-ons (Functional Gates)
These add-ons toggle binary access to advanced layout editors, portals, or connectors:
*   **`WHATSAPP_ADDON`**: Unlocks automated templates notifying buyers.
*   **`INTERACTIVE_MAP_ADDON`**: Enables customized map canvas overlays.
*   **`DXF_ENGINE_ADDON`**: Unlocks AutoCAD dxf file upload parsing.
*   **`MARKETPLACE_PUBLISH`**: Authorizes syndication to the public listings portal.
*   **`AGENT_PORTAL`**: Activates broker workspace areas.

### 2. Capacity Add-ons (Numeric Boosters)
These add-ons increment numerical plan limits directly, appending extra resources to the tenant's ceiling:
*   **`EXTRA_USERS_ADDON`**: Adds +5 user seat quotas to the tenant's limits.
*   **`EXTRA_STORAGE_ADDON`**: Adds +50 GB cloud storage allocation.
*   **`EXTRA_PLOTS_ADDON`**: Adds +500 plot capacity units.

### 3. Service Add-ons (Administrative Tasks)
These add-ons are flat-rate recurring services managed outside standard feature gates:
*   **`CUSTOM_DOMAIN_ADDON`**: Provides proxy routing configurations and managed SSL certificate renewal.
*   **`WHITE_LABEL_ADDON`**: Allows customized white-label logo overlays, branding, and color schemas.

---

## 7. Tenant Overrides Governance & Lifetime Rules

To maintain pricing integrity and prevent chaotic configurations across workspace deployments, we establish strict rules governing the lifecycle and purpose of overrides:

### A. Override Lifetimes & Scopes
1.  **Emergency Overrides (Short-Term)**:
    *   *Purpose*: Client hit their plot limit during a launch weekend and needs immediate capacity before processing official PO approvals.
    *   *Rule*: Temporary expiration flag (`expires_at` column added to `tenant_limit_overrides`) defaulting to 7 or 14 days. The system automatically rolls back the limit if no plan upgrade is registered.
2.  **Special Enterprise Contracts (Permanent)**:
    *   *Purpose*: Signed multi-year corporate accounts requiring customized packaging outside standard Starter/Growth bounds.
    *   *Rule*: Authorized only through the `tenant_billing_overrides` and custom limits, flagged with a signed contract PDF metadata reference.

### B. Compliance Governance & Auditing
*   Every change to `tenant_feature_overrides` or `tenant_limit_overrides` **MUST** generate a corresponding `AuditLog` entry (e.g., `SUBSCRIPTION_OVERRIDES_UPDATE`).
*   Audit records must document the `old_values` and `new_values` of the override limit, tracking the specific administrator's email.

---

## 8. Subscription Lifecycle States & Validations

The SaaS platform manages tenant workspaces using five operational lifecycle states:

```
                  ┌───────────────┐
                  │   1. TRIAL    │
                  └───────┬───────┘
                          │ (Expires or Upgrades)
                          ▼
                  ┌───────────────┐
                  │   2. ACTIVE   │◄──────────────┐
                  └───────┬───────┘               │
                          │                       │
         (In arrears)     ▼                       │ (Pays invoice)
                  ┌───────────────┐               │
                  │ 3. SUSPENDED  │───────────────┘
                  └───────┬───────┘
                          │ (Grace period expires)
                          ▼
                  ┌───────────────┐
                  │  4. EXPIRED   │
                  └───────┬───────┘
                          │ (Manual clean or Terminated)
                          ▼
                  ┌───────────────┐
                  │ 5. CANCELLED  │
                  └───────────────┘
```

### Transition Verification Matrix

| From State | To State | Trigger Condition | System Side-Effects |
|---|---|---|---|
| **TRIAL** | **ACTIVE** | Successful invoice payment. | Resets trial parameters; configures regular billing interval. |
| **TRIAL** | **SUSPENDED**| Trial window closes without payment. | Disables interface access; retains tenant data for a 30-day recovery window. |
| **ACTIVE** | **SUSPENDED**| Monthly subscription invoice payment fails. | Revokes interactive layout maps, locks write access to data pipelines. |
| **SUSPENDED**| **ACTIVE** | Invoice paid during the grace period. | Restores all baseline plan limits immediately. |
| **SUSPENDED**| **EXPIRED** | 30-day suspension grace window expires. | Revokes subdomains, flags tenant records for archival. |
| **ACTIVE** | **CANCELLED**| Owner requests immediate closure. | Terminates access instantly, schedules layout databases for safe truncation. |

---

## 9. Dashboard Impact (Dynamic Widget Designs)

The tenant overview cards in the SaaS Administration Panel will transition from mock displays to active tracking metrics:

1.  **Current Plan Status Indicator**:
    *   *Data Source*: `tenant_subscriptions` with active `subscription_plans` relation.
    *   *Display*: "Growth Scale Plan" with badge color indicating status (e.g., Emerald for ACTIVE, Indigo for TRIAL).
2.  **Usage Limits & Capacity Gauges**:
    *   *Data Source*: Dynamic count comparisons of actual table rows vs. the active limits.
    *   *Visuals*: Progress bars tracking:
        *   *Users Seats*: Counts active `users` in workspace.
        *   *Plots Volume*: Counts active rows in `plots` table.
        *   *Layouts Assigned*: Counts current layouts.
3.  **Active Feature Tags List**:
    *   *Data Source*: Compiled feature flags payload from `/subscription-summary`.
    *   *Display*: High-contrast capsule tags representing unlocked capabilities (e.g., `● GIS Mapping`, `● CAD Parsing`).
4.  **Renewal & Contract Status**:
    *   *Data Source*: `subscription_expiry_date` and `tenant_billing_overrides`.
    *   *Display*: Exact next billing date formatted cleanly, displaying custom discounts if active.

---

## 10. Downstream Roadmap Alignment

To ensure zero regressions, we verified that the proposed commercial consolidation aligns perfectly with all existing system modules:

*   **Marketplace Integration**: Gated entirely by `marketplace_publish`. Only plans or addons with this key can synchronize plots to the public consumer catalog.
*   **GIS Maps Engine**: Gated by `gis_maps`. If disabled, the client seamlessly renders the unified **Starter Plot Grid Mode**, protecting layout geometries from missing Google Maps credentials or rendering crashes.
*   **AutoCAD DXF Engine**: Gated by `dxf_import` and `dxf_engine`. Handles the file ingestion boundaries securely on the backend server, returning HTTP 403 on upload attempts if unauthorized.
*   **Customer & Agent Portals**: Governed by `customer_portal` and `agent_portal`. Controls routing middleware on both the frontend React app and backend Laravel route files.

---

## 11. Entity Relationship Diagram (ERD) Recommendation

To implement the unified commercial engine, we recommend maintaining the normalized tables with minor schema extensions:

```
 saas_modules [1] <─── [N] saas_features
                           │
                           ├─── [N] subscription_plan_features [N] <─── [1] subscription_plans
                           │                                                   │
                           └─── [N] tenant_feature_overrides [N]               ├─── [1] tenant_subscriptions
                                         │                                     │         │
                                         └─── [1] tenant_subscriptions <───────┘         ├─── [N] tenant_limit_overrides
                                                                                         │
                                                                                         └─── [N] tenant_billing_overrides
```

### Core Schema Addition:
1.  **`saas_features.expires_at` (Timestamp, Nullable)**: Enables automated teardown of short-term pilot feature overrides.
2.  **`tenant_limit_overrides.expires_at` (Timestamp, Nullable)**: Powers emergency resource extensions for launch weekends.

---

## 12. Migration Impact & Risk Mitigation

*   **Risk**: Existing production workspaces losing access to critical CAD layouts or maps during seeder updates.
    *   *Mitigation*: The database migration script will automatically map the current active plans of all workspaces to the equivalent new registry feature records.
*   **Risk**: Dual billing conflict if a customer is billed on both an active plan and an older plot slab tier.
    *   *Mitigation*: Update subscription pricing controllers to ignore plot slabs if the customer is on a standard Plan package, relying on slabs exclusively for calculated custom enterprise overrides.

---
*Audit Completed Successfully. Recommended for deployment during Phase 1F.6 execution.*
