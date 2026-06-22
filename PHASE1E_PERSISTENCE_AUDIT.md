# Phase 1E Persistence Validation & Architecture Audit

## Executive Summary
This document outlines the findings of a strict architectural and database persistence audit performed on the **BhoomiOne SaaS Control Panel (Phase 1E)**. The audit evaluates the current integration depth between the client React state machine and the Laravel REST API backend container (`/backend-api`).

---

## 1. Compliance Questionnaire & Audit Findings

### Q1: Are Module Registry records persisted in PostgreSQL?
**No.** All module records (name, code, group, description, status, type properties) are managed strictly in the UI client. Their master storage mechanism is the browser's `localStorage` (key: `bhoomi_modules`).
* **Verdict:** `NOT PRODUCTION READY`

### Q2: Are Feature Catalog records persisted in PostgreSQL?
**No.** Feature registry definitions reside fully in the client browser, relying on `localStorage` (key: `bhoomi_features`) for survival across session reloads.
* **Verdict:** `NOT PRODUCTION READY`

### Q3: Are Plan Master records persisted in PostgreSQL?
**No.** Displayed pricing packages—such as Starter, Growth, Professional, and Enterprise—are client-authoritative and cached locally in `localStorage` (key: `bhoomi_plans`).
* **Verdict:** `NOT PRODUCTION READY`

### Q4: Are Plan Feature Matrix settings persisted in PostgreSQL?
**No.** The mapping matrix establishing which features are enabled, disabled, or treated as add-ons per pricing package is saved directly in client `localStorage` (key: `bhoomi_matrix`).
* **Verdict:** `NOT PRODUCTION READY`

### Q5: Are Usage Limits persisted in PostgreSQL?
**No.** baseline numerical quotas (e.g., maximum projects, layouts, plots, storage limits, custom API requests) assigned to plan packages are cached on the client via `localStorage` (key: `bhoomi_plan_limits`).
* **Verdict:** `NOT PRODUCTION READY`

### Q6: Are Plot Billing Slabs persisted in PostgreSQL?
**No.** The capacity-bound pricing slabs mapping plot parcel count thresholds to dynamic tier charges are stored only inside `localStorage` (key: `bhoomi_slabs`).
* **Verdict:** `NOT PRODUCTION READY`

### Q7: Are Add-on Catalog records persisted in PostgreSQL?
**No.** Mini auxiliary features (e.g., WhatsApp integration triggers, Heavy CAD Parser, Interactive Mapper) with billing values are held locally inside `localStorage` (key: `bhoomi_addons`).
* **Verdict:** `NOT PRODUCTION READY`

### Q8: Are Tenant Subscription assignments persisted in PostgreSQL?
**No.** Linking individual tenants to active subscription packages is simulated using a client-side registry stored in `localStorage` (key: `bhoomi_tenant_subs`).
* **Verdict:** `NOT PRODUCTION READY`

### Q9: Are Tenant Feature Overrides persisted in PostgreSQL?
**No.** Granular company-level custom feature flags (restricting/granting individual modular toolkits) are written to the `featureOverrides` JSON property inside the local subscription cache (`bhoomi_tenant_subs`).
* **Verdict:** `NOT PRODUCTION READY`

### Q10: Are Tenant Lifecycle actions persisted in PostgreSQL?
**No.** Suspend, Reactivate, and Archive actions mutate the state within client memory and write changes back to `localStorage` (key: `bhoomi_tenant_subs`). The actual database record mapping the tenant is not locked down or restricted on the backend.
* **Verdict:** `NOT PRODUCTION READY`

### Q11: Which database tables currently store this data?
**None.** There are zero database tables structured to store any Phase 1E licensing modules, feature matrices, billing limits, addons, or subscription overrides inside the current staging schema. 

### Q12: Which REST APIs currently persist this data?
**None.** There are no endpoints matching these resources inside the Laravel router (`/backend-api/routes/api.php`). The frontend does call `/api/v1/admin/tenants` and `/api/v1/admin/audit-logs`, but these only exchange basic tenant master metadata (`id`, `name`, `code`, `plan`, `status`) and system gateway history trails.

### Q13: Which backend controllers process this data?
**None.** The current set of controllers (`AuthController`, `LayoutController`, `PlotController`, `ProjectController`, `DxfController`) do not contain any subroutines, validations, or routing handlers for these dynamic SaaS configurations.

### Q14: Which migrations create these tables?
**None.** The file tree in `/backend-api/database/migrations` contains zero migrators for SaaS cataloging structures. The tables exist only up to basic system layers:
* `2026_06_19_000001_create_tenants_table.php` (Only contains simple `id`, `name`, `code`, `plan`, `status` columns)
* No subscription, feature matrix, module, slab, override, or addon tables are structured on disk.

### Q15: Which seeders populate default plans/modules/features?
**None.** Default setups are self-bootstrapped within the client initialization state array in `/src/components/apps/SaaSAdminApp.tsx`. No backend seed file is configured to run or register these entities.

---

## 2. Component Categorization

```
+-----------------------------------------------------------------------------------+
|                                 SaaS CONTROL PANEL                                |
|                                                                                   |
|  [ BACKEND-POWERED ]                  [ UI-ONLY / NOT PRODUCTION READY ]          |
|  - Tenant Cluster Provisioning        - Module Registry Cataloging (localStorage) |
|  - System Ingress Network Logs        - Feature Permission Cataloging             |
|                                       - Multi-Dimensional Plan Feature Matrix     |
|                                       - Numerical Metric Allocation Sliders       |
|                                       - Capacity Plot Slab Limits Ledger          |
|                                       - Tenant-Specific Core Pricing Overrides    |
+-----------------------------------------------------------------------------------+
```

### A. UI-Only Components (UNPERSISTED — NOT PRODUCTION READY)
These modules are fully operational as mock-up interactive prototypes. However, because they rely on ephemeral `localStorage` cache bounds, they are classified as **NOT PRODUCTION READY** for permanent hosting:
* **`ModuleRegistryTab.tsx`**: System module registering list and feature correlation forms.
* **`PlanFeatureMatrixTab.tsx`**: Grid representation of package pricing and feature gates.
* **`AddonsBillingTab.tsx`**: Dynamic pricing catalog and slot scale thresholds interface.
* **`MrrDashboardTab.tsx`**: Analytical visual charts and aggregate projections.
* **`TenantLifecycleDrawer.tsx`**: Custom subscriber overrides side drawer allowing real-time package adjustment.

### B. Backend-Powered Components (PERSISTED)
These are successfully connected directly to the stable relational PostgreSQL database via Laravel's endpoint nodes:
* **Tenant Cluster Provisioning and Listing**: Handled inside `SaaSAdminApp.tsx` via the `/api/v1/admin/tenants` REST requests. Matches the master `tenants` DB table.
* **Audit Trail Terminal Streams**: Handled inside `SaaSAdminApp.tsx` via `/api/v1/admin/audit-logs` requests. Extracts live trace feeds.

### C. Components Missing Persistence (NOT PRODUCTION READY)
All modules dealing with the subscription plan matrix, custom capacities, feature toggling matrices, and override sliders lack PostgreSQL table linkages and REST endpoints. They are entirely dependent on client-side state hooks.

---

## 3. Recommended Remediation Roadmap
To upgrade the SaaS Control Panel from client-simulate status to formal production standard, the following gap actions must be completed in next phase sprints:
1. **Apply Eloquent Model Migrations**: Construct SQL templates for `saas_modules`, `saas_features`, `saas_plans`, `saas_plan_limits`, `saas_plan_feature_matrix`, `saas_plot_slabs`, and `tenant_subscriptions` (Reference schema mapped in `/PHASE1E_BACKEND_GAP_REPORT.md`).
2. **Develop REST API Gateways**: Author Laravel controllers and endpoint bindings to handle CRUD transactions for plan limits, matrix rows, and tenant-level configurations.
3. **Refactor Client-Side API Connectors**: Replace the local state initializer callbacks in `/src/components/apps/SaaSAdminApp.tsx` to pull and push payloads directly from backend controllers instead of utilizing the `localStorage` state wrappers.
