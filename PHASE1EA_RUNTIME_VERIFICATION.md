# Phase 1E-A — SaaS Subscription Runtime Deployment Verification

## RUNTIME VERIFICATION REQUIRED ON VPS

The AI Studio coding container is a sandboxed environment that restricts raw shell execution (permitting only `grep`, `npx` and `gradle`). Direct database operations or PHP compilation tasks cannot be run natively here. 

Therefore, **RUNTIME VERIFICATION REQUIRED ON VPS** is necessary. Below is the complete, high-fidelity verification script, exact commands, database queries, and raw HTTP payloads to run on your staging/production server.

---

## 1. Environment Verification & Bootstrap Commands

Execute these shell commands from the root of your Laravel backend container or VPS directory:

```bash
# Exec into your Laravel CLI environment (if containerized)
docker-compose exec backend-api bash

# --- 1. Step: Force-clear compile cache & optimize namespaces ---
php artisan clear-compiled
php artisan config:clear
php artisan route:clear

# --- 2. Step: Run the structural PostgreSQL migrations ---
php artisan migrate --force

# --- 3. Step: Run the SaaS Subscription and plans Seeder ---
php artisan db:seed --class=SaasSubscriptionSeeder --force
```

---

## 2. Production Database Verification SQL Queries

Run these standard SQL commands using PostgreSQL shell (`psql`) or your database management tool to verify complete table layout, foreign keys, and seeded configurations:

### A. List Created Tables Coverage
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'saas_%' 
OR tablename LIKE 'subscription_%' 
OR tablename LIKE 'tenant_%';
```
**Expected Output Table Names (11 Tables):**
- `saas_modules`
- `saas_features`
- `subscription_plans`
- `subscription_plan_features`
- `subscription_plan_limits`
- `subscription_addons`
- `subscription_plot_slabs`
- `tenant_subscriptions`
- `tenant_addons`
- `tenant_feature_overrides`
- `tenant_limit_overrides`

### B. Verify Seeded Subscription Plans
```sql
SELECT id, plan_code, name, monthly_price, yearly_price, trial_days, status 
FROM subscription_plans 
ORDER BY sort_order;
```
**Expected Seeded Rows (4 Tiers):**
- `STARTER` - $99.00 / mo | $990.00 / yr | 14 trial days | `ACTIVE`
- `GROWTH` - $249.00 / mo | $2490.00 / yr | 14 trial days | `ACTIVE`
- `PROFESSIONAL` - $499.00 / mo | $4990.00 / yr | 30 trial days | `ACTIVE`
- `ENTERPRISE` - $999.00 / mo | $9990.00 / yr | 30 trial days | `ACTIVE`

### C. Verify Seeded SaaS Modules
```sql
SELECT code, name, "group", is_core, is_billable 
FROM saas_modules 
ORDER BY sort_order;
```
**Expected Seeded Rows (13 Core Modules):**
- `PROJECTS`, `LAYOUTS`, `PLOTS` (marked as `is_core = true`)
- `CUSTOMERS`, `AGENTS`, `LEADS`, `BOOKINGS`, `COLLECTIONS`, `DXF`, `INTERACTIVE_MAP`, `MARKETPLACE`, `CUSTOMER_PORTAL`, `AGENT_PORTAL` (marked as `is_core = false`)

### D. Verify Seeded SaaS Sub-Features
```sql
SELECT sf.code, sf.name, sm.code as module_code, sf.status, sf.default_enabled 
FROM saas_features sf
JOIN saas_modules sm ON sf.module_id = sm.id
ORDER BY sm.code, sf.code;
```
**Expected Seeded Rows (26 Sub-Features):**
- Pair of `.view` and `.manage` variants for all 13 modules.

### E. Verify Dynamic Plot Billing Slabs & Add-ons
```sql
-- Query Slabs
SELECT min_plots, max_plots, monthly_price, status FROM subscription_plot_slabs ORDER BY min_plots;

-- Query Add-ons
SELECT code, name, monthly_price, status FROM subscription_addons;
```

---

## 3. SaaS API Endpoint Validation Procedures

Use the following `curl` calls or an API agent (with an active administrative authorization token) to test standard endpoints:

### GET /api/v1/admin/modules
*   **Purpose**: Get the entire catalog of system modules and their respective features.
*   **Request**:
    ```bash
    curl -X GET "https://<your-vps-url>/api/v1/admin/modules" \
      -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
      -H "Accept: application/json"
    ```
*   **Expected Status**: `200 OK`
*   **Expected Response Metadata**:
    ```json
    [
      {
        "id": "e6f8df7c-5bb5-4bd4-9a00-349f7e6f6631",
        "code": "PROJECTS",
        "name": "Projects Module",
        "group": "Core Development",
        "is_core": true,
        "is_billable": true,
        "features": [
          {
            "id": "a29bd7bd-6872-4d00-afab-cfd0cf4876b2",
            "module_id": "e6f8df7c-5bb5-4bd4-9a00-349f7e6f6631",
            "code": "projects.view",
            "name": "View Projects Module",
            "default_enabled": true
          }
        ]
      }
    ]
    ```

### POST /api/v1/admin/plans (Validation Error Demonstration)
*   **Purpose**: Verify server-side validation checks operate cleanly for invalid payload models.
*   **Request**:
    ```bash
    curl -X POST "https://<your-vps-url>/api/v1/admin/plans" \
      -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d '{
        "plan_code": "",
        "name": "Invalid Plan Test",
        "monthly_price": -20.00
      }'
    ```
*   **Expected Status**: `422 Unprocessable Content`
*   **Expected Response**:
    ```json
    {
      "message": "The plan code field is required. (and 1 more error)",
      "errors": {
        "plan_code": [
          "The plan code field is required."
        ],
        "monthly_price": [
          "The monthly price must be at least 0."
        ]
      }
    }
    ```

### POST /api/v1/admin/plans (Plan Creation)
*   **Purpose**: Save/update standard tier plans details.
*   **Request**:
    ```bash
    curl -X POST "https://<your-vps-url>/api/v1/admin/plans" \
      -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d '{
        "plan_code": "ENTERPRISE_CUSTOM",
        "name": "Enterprise Custom Pack",
        "monthly_price": 1499.00,
        "yearly_price": 14990.00,
        "trial_days": 30,
        "status": "ACTIVE",
        "limits": {
          "projectsLimit": 999,
          "layoutsLimit": 999,
          "plotsLimit": 99999,
          "usersLimit": 999
        },
        "features": []
      }'
    ```
*   **Expected Status**: `200 OK`

### POST /api/v1/admin/tenants/{id}/subscription (Tenant Assignment)
*   **Purpose**: Establish a workspace tenant's base subscription.
*   **Request**:
    ```bash
    curl -X POST "https://<your-vps-url>/api/v1/admin/tenants/f83db544-aa0f-4886-9ac7-393bfbf2417a/subscription" \
      -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d '{
        "plan_id": "8fa537b0-8041-4cb4-bfff-12fbd659b8be",
        "start_date": "2026-06-22",
        "billing_period": "MONTHLY",
        "status": "ACTIVE"
      }'
    ```
*   **Expected Status**: `200 OK`

### POST /api/v1/admin/tenants/{id}/subscription/lifecycle (Lifecycle Action)
*   **Purpose**: Handle administrative lifecycle events (e.g., status suspension).
*   **Request**:
    ```bash
    curl -X POST "https://<your-vps-url>/api/v1/admin/tenants/f83db544-aa0f-4886-9ac7-393bfbf2417a/subscription/lifecycle" \
      -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d '{
        "status": "SUSPENDED"
      }'
    ```
*   **Expected Status**: `200 OK`

### POST /api/v1/admin/tenants/{id}/subscription/overrides (Feature/Limit Overrides and Add-ons)
*   **Purpose**: Apply client-side custom settings changes to underlying Postgres tables.
*   **Request**:
    ```bash
    curl -X POST "https://<your-vps-url>/api/v1/admin/tenants/f83db544-aa0f-4886-9ac7-393bfbf2417a/subscription/overrides" \
      -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d '{
        "limit_overrides": {
          "plotsLimit": 10000
        },
        "feature_overrides": {
          "a29bd7bd-6872-4d00-afab-cfd0cf4876b2": "DISABLED"
        },
        "addons": []
      }'
    ```
*   **Expected Status**: `200 OK`
