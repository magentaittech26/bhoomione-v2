# BhoomiOne V3 - Sprint 6B Plot Module Deployment & Verification Runbook

This document details the release, schema verification, build compilation, post-deployment validation, and disaster recovery rollback guidelines for deploying the Plot Module Production Security update.

---

## 1. PRE-DEPLOYMENT PHASE

Before any changes are pushed to staging or production, the following checks must be completed.

### A. Environment Configuration Review
Ensure the `.env` configuration file on the target server defines the following production security overrides:

```env
# Disable dynamic QA and role-simulation bypass panels in production
VITE_ENABLE_QA_SIMULATION=false

# Keep debug off to prevent leaking database exception trace logs to client
APP_DEBUG=false
```

### B. Dependency Check
Run a dependency audit and linter check to ensure the build compiles without syntax or type errors:

```bash
# Run typescript type audits
npm run lint

# Compile production-ready client bundle and server bundle
npm run build
```

---

## 2. DATABASE PRE-FLIGHT VERIFICATION

Run the following SQL queries directly on the target PostgreSQL server to assert that all schema tables, subscriptions, features, and relations are correctly set up and populated before the code goes live.

### Query 1: Verify Subscription Status and Plan Features
Assert that active subscriptions are correctly linked to features and that the `PLOTS` feature exists:

```sql
SELECT ts.tenant_id, ts.status, sp.name AS plan_name, spf.access_level
FROM tenant_subscriptions ts
JOIN subscription_plans sp ON ts.plan_id = sp.id
LEFT JOIN subscription_plan_features spf ON spf.plan_id = sp.id AND spf.feature_id = (
  SELECT id FROM saas_features WHERE code = 'PLOTS' LIMIT 1
);
```
*   **Verification**: Ensure all live tenants display `status = 'ACTIVE'` or `'TRIAL'`. Confirm that standard/premium tiers show `access_level = 'ENABLED'` and basic tiers show `access_level = 'DISABLED'`.

### Query 2: Verify RBAC Role Permissions Configuration
Assert that fine-grained plot permissions are loaded into the system:

```sql
SELECT r.code AS role_code, p.code AS permission_code
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.code LIKE 'plots.%'
ORDER BY r.code, p.code;
```
*   **Verification**: Ensure developer roles and admin roles are mapped to `plots.view`, `plots.create`, `plots.edit`, `plots.delete`, `plots.split`, `plots.merge`, `plots.renumber`, and `plots.generate`. Standard users must only have `plots.view`.

---

## 3. COMPILATION & RELEASE DEPLOYMENT STEP

1. **Lock API Routes**: Enable maintenance mode or queue workers pause if executing during high-traffic intervals.
2. **Execute Schema Migration**:
   Run Drizzle or standard migration runners to apply changes if any database schema definitions have drifted.
3. **Build the Application**:
   Compile the bundled ESBuild server and Vite frontend bundles:
   ```bash
   npm run build
   ```
4. **Deploy Container**:
   Deploy the updated container to Google Cloud Run, Kubernetes, or the VPS cluster.
   Ensure that the ingress routes map port `3000` as the external endpoint.

---

## 4. POST-DEPLOYMENT SMOKE TESTS

Execute the following post-deployment checks immediately after the release is completed to verify live operations.

### Smoke Test A: Auth Token and Tenant Subscription Check
Send an authenticated fetch request to view layouts.
```bash
curl -X GET https://bhoomione-staging.api.studio/api/v1/layouts \
  -H "Authorization: Bearer <JWT_ACCESS_TOKEN>" \
  -H "Content-Type: application/json"
```
*   **Expected Response**: `200 OK` with layout records array. If subscription was inactive, `403 Forbidden` is returned.

### Smoke Test B: Cross-Tenant Parameters Validation (Penetration Test)
Attempt to view layout details belonging to another tenant:
```bash
curl -X GET https://bhoomione-staging.api.studio/api/v1/layouts/foreign-layout-id-here \
  -H "Authorization: Bearer <JWT_ACCESS_TOKEN>" \
  -H "Content-Type: application/json"
```
*   **Expected Response**: `404 Not Found` (Fail Closed, protecting the privacy and isolation boundaries of Tenant B).

### Smoke Test C: Commercial Lifecycle Validation
Attempt to update a commercial plot status to "PRE_BOOKED" using an API PUT request:
```bash
curl -X PUT https://bhoomione-staging.api.studio/api/v1/plots/commercial-plot-id \
  -H "Authorization: Bearer <JWT_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "PRE_BOOKED"}'
```
*   **Expected Response**: `400 Bad Request` with message containing: `Commercial plots are restricted to Draft, Validated, or Approved states only.`.

---

## 5. RECOVERY & ROLLBACK PLAN

If any smoke test fails, or if tenants report unexpected `403 Forbidden` access blocks on legitimate operations, initiate the rollback runbook immediately.

### Rollback Process:
1. **Container Rollback**:
   Revert the active container image to the previous tagged stable release (e.g., `v3.0.4-stable`).
2. **Database State Verification**:
   If a migration was run, verify if it is destructive. Since the Sprint 6B changes are purely code-level filters and authorization policies without breaking database schema modifications, **no database rollback is required**. The database state remains completely intact.
3. **Clear Sessions & Cache**:
   Flush Redis cache keys associated with role/permission caching to guarantee stale authorization claims are cleared:
   ```bash
   redis-cli -h redis flushall
   ```
4. **Verify Rollback Success**:
   Re-run Smoke Test A to confirm previous endpoints are responsive.
