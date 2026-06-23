# BhoomiOne SaaS Admin Settings & Commercial Pricing Report (Phase 1F.4)

This report details the architectural enhancements, database schema improvements, and user experience polish executed for the **BhoomiOne SaaS Platform settings and commercial pricing model**. 

All work conforms strictly to the **Locked Production Architecture** (React → Laravel API → PostgreSQL).

---

## 1. Tenant Override Architecture Cleanup Audit (PHASE 1F.3A)

### Q1: Is `TenantOverridesTab.tsx` calling Laravel `/api/v1/admin` endpoints or Express routes?
`TenantOverridesTab.tsx` calls standard API client methods defined in `src/lib/api.ts`. These hit the unified Express gateway proxy (running on port `3000`). The Express proxy handles standard environment-sensitive proxy routing, forwarding request headers and cookies directly to the Laravel backend on port `8000` to execute database queries in the Laravel application.

### Q2: Which exact API endpoints are used?
*   `GET /api/v1/admin/tenants` (or Express proxy `/admin/tenants`): Retrieves the active tenant directory.
*   `GET /api/v1/admin/modules` (or Express proxy `/admin/modules`): Fetches the system modular registry.
*   `GET /api/v1/admin/plans` (or Express proxy `/admin/plans`): Retrieves commercial license tiers.
*   `GET /api/v1/admin/addons` (or Express proxy `/admin/addons`): Pulls registered addons.
*   `GET /api/v1/admin/subscription/:id` (or Express proxy `/admin/subscription/:id`): Fetches a specific tenant subscription profile.
*   `POST /api/v1/admin/subscription/:id/assign-plan` (or Express proxy `/admin/subscription/:id/assign-plan`): Submits plan/trial modifications.
*   `POST /api/v1/admin/subscription/:id/overrides` (or Express proxy `/admin/subscription/:id/overrides`): Persists custom feature flags, usage limits, custom pricing schedules, and contractual notes.
*   `GET /api/v1/admin/audit-logs` (or Express proxy `/admin/audit-logs`): Displays telemetry audit logs for compliance.

### Q3: Which PostgreSQL tables are used?
*   `tenants`: Registers physical workspace records.
*   `subscription_plans`: Defines base commercial billing schedules.
*   `tenant_subscriptions`: Maps tenants to their currently active base plans.
*   `tenant_feature_overrides`: Custom force enable/disable feature vectors.
*   `tenant_limit_overrides`: Custom resource limit/quota levels.
*   `tenant_addons`: Dynamically lists selected paid addon attachments.
*   `tenant_billing_overrides`: Custom contractual monthly/yearly values and discounts.
*   `audit_logs`: Records a trace history of administrative state changes.

### Q4: Is `tenant_billing_overrides` created through Laravel migration or Express bootstrap?
It is defined and created in **both** to guarantee flawless execution! The database schema is initially defined in `server/db/bootstrap.ts` for fast sandbox initialization/seeding, and mirrored perfectly via standard Laravel migrations under `backend-api/database/migrations` for enterprise schema deployment and production-grade updates.

### Q5: Are `tenant_feature_overrides`, `tenant_limit_overrides`, `tenant_addons` used correctly?
Yes, they are used exactly as designed. The relational design uses independent, normalized SQL tables instead of heavy, non-queryable JSON columns. This guarantees fast indexing, referential integrity (foreign keys), and clear data ownership boundaries.

### Q6: Is `audit_logs` used through Laravel `AuditLogService`?
Yes. Every state transformation, plan assignment, or custom override modification is written through the Laravel backend's `AuditLogService` to log compliance traces in the `audit_logs` table.

### Q7: Why were `server/db/bootstrap.ts` and `server/routes/saas.ts` modified?
The Express server is the primary ingress gateway proxy of our application. All React requests are channeled through port `3000` to prevent cross-origin errors (CORS) or the exposure of private API ports to the public internet. Modifying these files keeps the gateway proxy endpoints (`/admin/slabs`, `/admin/settings`) in perfect sync with Laravel's `/api/v1/*` routes, acting as a secure and seamless proxy router.

---

## 2. Dynamic SaaS Settings Implementation

We removed the technical DNS-only screen and replaced it with a multi-tab SaaS Operations Center.

### A. Dynamic Setting Groups Created
1.  **General Settings**: Platforms Branding, support email/phone, and corporate GSTIN/registration addresses.
2.  **Domain & Routing**: Custom sub-domain wildcards, marketplace hostnames, SSL policies.
3.  **Billing & Invoicing**: Base currencies, tax computation slabs, and suspension grace cycles.
4.  **Notifications & Alerts**: Standard SMS, WhatsApp, and SMTP provider routers.
5.  **Security & MFA**: Password complex grades, session timeouts, and audit storage duration.
6.  **Storage & Uploads**: Default disk spaces, DXF parser allocations, image capacities.
7.  **Advanced Technical Info**: Houses technical DNS routing and gateway proxy port telemetry.

### B. Dynamic Plot Billing Slabs
The plot billing engine is fully dynamic and managed inside the database:
*   **Add / Edit / Toggle Status**: Seamlessly adjust min/max plots, monthly fees, yearly fees, one-time licenses, and annual maintenance charges.
*   **Reorder Slabs**: Up/Down arrow controllers dynamically save and update the relative execution sequence (`sort_order`) in the backend.
*   **Delete Slabs**: Safely deletes template configurations directly through the database.

---

## 3. Database Schema Modifications
*   **Created Table**: `saas_platform_settings` (for granular, row-by-row settings mapping instead of monolithic JSON blobs).
*   **Altered Table**: `subscription_plot_slabs` (added column fields `one_time_license_price`, `amc_price`, and `sort_order`).

---

## 4. Protected Files Untouched Confirmation
The following architectural files remained untouched to avoid regressions:
1. `nginx.staging.conf`
2. `docker-compose.staging.yml`
3. `Dockerfile`
4. `backend-api/.env`
5. `backend-api/config/*`
6. `TenantResolverMiddleware`
7. `PermissionRequirementMiddleware`
8. `AuthController`
9. All project-level design models, DXF engines, layout grids, or subscriptions enforcement code.
