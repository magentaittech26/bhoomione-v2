# Phase 1E-A — SaaS Subscription Deployment & Reliability Audit

This document presents a deployment safety review, risk catalog, and concrete rollback instructions for transitioning the **SaaS Subscription Persistence Engine (Phase 1E-A)** staging release.

---

## 1. Compliance Vow Checklist

*   **nginx.staging.conf**: untouched (Confirmed: NOT altered)
*   **docker-compose.yml / Dockerfiles**: untouched (Confirmed: No infrastructure alterations)
*   **backend-api/.env**: untouched (Confirmed: Local Secrets untouched)
*   **AuthController**: untouched (Confirmed)
*   **TenantResolverMiddleware**: untouched (Confirmed)
*   **Existing Login Flows**: untouched (Confirmed)
*   **Existing Projects/Layouts/Plots Routing**: untouched (Confirmed)

## 2. Deployment Log Matrix

### A. Completed Migrations
- `/backend-api/database/migrations/2026_06_22_000001_create_saas_subscription_tables.php`

### B. Completed Models
- `/backend-api/app/Models/SaasModule.php`
- `/backend-api/app/Models/SaasFeature.php`
- `/backend-api/app/Models/SubscriptionPlan.php`
- `/backend-api/app/Models/SubscriptionPlanFeature.php`
- `/backend-api/app/Models/SubscriptionPlanLimit.php`
- `/backend-api/app/Models/SubscriptionAddon.php`
- `/backend-api/app/Models/SubscriptionPlotSlab.php`
- `/backend-api/app/Models/TenantSubscription.php`
- `/backend-api/app/Models/TenantAddon.php`
- `/backend-api/app/Models/TenantFeatureOverride.php`
- `/backend-api/app/Models/TenantLimitOverride.php`

### C. Completed Seeders
- `/backend-api/database/seeders/SaasSubscriptionSeeder.php`
- Mounted inside `/backend-api/database/seeders/DatabaseSeeder.php`

### D. Completed APIs
- `/api/v1/admin/modules` (GET)
- `/api/v1/admin/plans` (GET/POST)
- `/api/v1/admin/addons` (GET/POST)
- `/api/v1/admin/slabs` (GET/POST)
- `/api/v1/admin/tenants/{id}/subscription` (GET/POST)
- `/api/v1/admin/tenants/{id}/subscription/lifecycle` (POST)
- `/api/v1/admin/tenants/{id}/subscription/overrides` (POST)

---

## 3. Potential Downstream Regression Risks & Mitigation

| Hazard Risk | Severity | Trigger | Mitigation Pathway |
| :--- | :---: | :--- | :--- |
| **UUID Format Clashes** | Low | Downstream model calls passing invalid string values. | Enforce strict UUID validation regex on incoming REST payload blocks. |
| **Missing Subscription Seed** | Low | Admin displays empty state list when calling index. | Enforce bootstrap seeder checks that auto-runs missing records inside runtime checks. |
| **Audit Log Bottleneck** | Low | High traffic overrides updates stalling DB pools. | Run audit records inside fast database transaction logs that scale asynchronously. |

---

## 4. Rollback Plan

If staging releases trigger unanticipated anomalies, execute the following commands to safely reverse state updates.

### Step 1: Database Migration Rollback
Run standard migrations rollback command inside the backend runtime shell:
```bash
php artisan migrate:rollback --step=1
```
This drops the 11 subscription tables in reverse order, cleaning up PostgreSQL tables:
- `tenant_limit_overrides`
- `tenant_feature_overrides`
- `tenant_addons`
- `tenant_subscriptions`
- `subscription_plot_slabs`
- `subscription_addons`
- `subscription_plan_limits`
- `subscription_plan_features`
- `subscription_plans`
- `saas_features`
- `saas_modules`

### Step 2: Remove Seeder Registration
Revert `/backend-api/database/seeders/DatabaseSeeder.php` using standard git checkout:
```bash
git checkout -- database/seeders/DatabaseSeeder.php
```

### Step 3: Delete Added Files
Remove created models, services, and controller classes:
```bash
rm -rf app/Models/Saas* app/Models/Subscription* app/Models/Tenant* app/Services/SaasSubscriptionService.php app/Http/Controllers/Api/v1/SaasController.php database/seeders/SaasSubscriptionSeeder.php
```

### Step 4: Revert Routes
Revert the api.php modification:
```bash
git checkout -- routes/api.php
```
Verify routing endpoints are restored without any residual traces.
