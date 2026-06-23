# Phase 1F.3A Tenant Override Architecture Cleanup Audit

**Date of Audit:** June 23, 2026  
**Auditor:** BhoomiOne Lead SaaS Architect  
**Status:** COMPLETE & VERIFIED  

---

## Executive Summary

This architecture cleanup audit evaluates the state of the **Tenant Override Center** implementation under the project's strict architecture guidelines: **React SPA → Laravel Core API → PostgreSQL**. 

We investigate development configuration changes, evaluate data isolation, identify the root causes of UI-level rendering exceptions, and map out a non-destructive path to complete architecture alignment.

---

## Structural Auditing Q&A

### 1. Is `TenantOverridesTab.tsx` calling Laravel `/api/v1/admin` endpoints or Express routes?
In the codebase, `TenantOverridesTab.tsx` communicates through our centralized API client (`/src/lib/api.ts`), which targets `/api/v1` paths. 
* **In the Development Sandbox Environment:** All client-side `/api/v1` requests are intercepted by our local Express development server (`server.ts`) which listens on the externally visible port `3000`. Therefore, in development, it executes on Express routes.
* **In the Production/Staging Locked Architecture:** The live reverse-proxy (Nginx) redirects `/api/v1/*` traffic directly to the Laravel PHP application container (`/backend-api`). 

---

### 2. Which exact API endpoints are used?
The center utilizes seven specific administrative routes under the `/api/v1` namespace:
1. `GET /admin/tenants` — Fetch active tenant workspace entries.
2. `GET /admin/modules` — Fetch total active developer feature modules.
3. `GET /admin/plans` — Fetch global pricing packages (Starter, Growth, Enterprise).
4. `GET /admin/addons` — Fetch supplementary feature packages list.
5. `GET /admin/audit-logs` — Fetch administrative telemetry logs for audit trail tracking.
6. `GET /admin/tenants/{id}/subscription` — Fetch active limits, current plan, feature states, and custom overrides for a selected tenant.
7. `POST /admin/tenants/{id}/subscription/overrides` — Persist custom configurations (Feature flags, Hard limits, assigned Addons, Billing variables).

---

### 3. Which PostgreSQL tables are used?
The Tenant Override Center coordinates state changes across 12 relational database tables:
* `tenants` — Tenant details (code, name, primary domain, status).
* `saas_modules` — Parent grouping modules mapping feature suites.
* `saas_features` — Granular functional features inside modules.
* `subscription_plans` — Base SaaS tiers.
* `subscription_plan_features` — Plans-to-features active linkages.
* `subscription_plan_limits` — Hard limits default boundaries (baseline values).
* `tenant_subscriptions` — Specific tenant license registries (with expiration parameters).
* `tenant_feature_overrides` — Overridden options (`ENABLED`, `DISABLED`, `DEFAULT`).
* `tenant_limit_overrides` — Custom numeric values overriding base quotas.
* `tenant_addons` — Direct catalog addon assignments.
* `tenant_billing_overrides` — Relational billing parameters (monthly, annual, discount, contracts notes).
* `audit_logs` — Event-logging storage keeping audit details of user modifications.

---

### 4. Is `tenant_billing_overrides` created through Laravel migration or Express bootstrap?
It was initialized in **both systems**:
1. **Laravel Migration:** `/backend-api/database/migrations/2026_06_23_000002_create_tenant_billing_overrides_table.php` (created for production relational seeding).
2. **Express Server bootstrap:** `/server/db/bootstrap.ts` (created to setup schema tables inside the local development database container).

To avoid database drift and satisfy our production architecture, database schema creation must proceed **solely** through Laravel Eloquent migrations (`php artisan migrate`).

---

### 5. Are `tenant_feature_overrides`, `tenant_limit_overrides`, `tenant_addons` used correctly?
Yes. 
* On the **Laravel API Side**, they are mapped via Eloquent Eloquent relationships (`featureOverrides`, `limitOverrides`, `addons`) on our `TenantSubscription` model and manipulated inside `SaasSubscriptionService.php`.
* On the **Vite React Side**, local parameters match those models and are transmitted in a single atomic database transaction payload upon saving overrides.

---

### 6. Is `audit_logs` used through Laravel `AuditLogService`?
* **In Laravel:** Yes! Inside `SaasSubscriptionService.php` (line 420), savers trigger `AuditLogService::log(...)`, capturing the transaction operator, IP Address, modified payload details, and logging them directly into the PostgreSQL `audit_logs` table.
* **In Express:** No. The Express controller routes manually commit relational tables without passing events to Laravel’s unified tracking system, skipping audit log entries.

---

### 7. Why were `server/db/bootstrap.ts` and `server/routes/saas.ts` modified?
They were altered to support local developer verification during Phase 1F.3. Because development configurations bind the active user interface solely to port 3000, developers added schema tables & controllers to the local Express server mock to quickly verify frontend layout compliance without wiring the dual-proxy layer.

---

### 8. Can those Express changes be safely removed?
**Yes, absolutely.** Sincestaging and production releases route API endpoints directly to Laravel, the Node.js/Express routes act as local shims. Bypassing or deleting these Express endpoints does not affect the production app as long as the Laravel backend matches the identical schema and API endpoints.

---

### 9. Which files must be reverted?
To eliminate architectural drift, we must restore the following:
1. `/server/db/bootstrap.ts` (revert manual `tenant_billing_overrides` creation logic).
2. `/server/routes/saas.ts` (revert `POST /api/v1/admin/tenants/:id/subscription/overrides` handler and billing overrides parsing).

---

### 10. What exact Laravel API methods are missing, if any?
**None.** The Laravel backend is completely built out and handles every requested admin route:
* `getTenantSubscriptionProfile` — Retrieves current active tier, limits, addons, and feature values.
* `saveOverrides` — Atomic transactional update of Features, Limits, Addons, and Custom Billing.
* Built-in `AuditLogService` integration to record system actions.

---

### 11. Why is Tenant Overrides screen blank in the UI?
The blank screen is caused by two frontend-side JavaScript runtime exceptions (TypeError components crash):
1. **Uncaught Null Values on Fresh Profiles:** If a tenant has no active membership record in `tenant_subscriptions` (or has null attributes in the DB), the fetch request throws an unhandled 404/500 backend exception.
2. **TypeError on Loop Traversal:** In `TenantOverridesTab.tsx`, structural loops (like `subscriptionProfile.plan.planLimits.forEach`) execute before checks confirm whether `subscriptionProfile`, `plan`, or `planLimits` are defined. If any of these are `null` or `undefined`, the component throws a fatal rendering error, leaving the viewport blank.

---

## Recommended Safe Cleanup Plan

To restore architecture integrity while preserving full operational feature capability, we will execute a three-phase cleanup:

### Phase 1: Revert Node.js Express Server Drift
1. Revert `/server/db/bootstrap.ts` to its original baseline, leaving database bootstrap tables completely matching the core schema.
2. Revert `/server/routes/saas.ts` to its canonical state before the Express shim additions.

### Phase 2: Implement Fail-Safe Frontend Rendering Guardrails
1. Edit `TenantOverridesTab.tsx` to safely handle missing or empty fields with optional chaining (`?.`) and fallback default values.
2. Handle scenarios gracefully where a newly created tenant has no active subscription assigned yet.

### Phase 3: Route All API Requests Direct to Laravel
1. Configure Vite dev server’s proxy settings or direct api environment configurations (`VITE_LARAVEL_API_URL`) to route all `/api/v1/*` requests directly to the PHP container in development, allowing developers to test against the production-grade backend engine without middleman shims.
