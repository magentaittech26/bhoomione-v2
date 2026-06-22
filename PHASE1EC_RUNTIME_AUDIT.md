# Phase 1EC.5 — SaaS Runtime Subscription Enforcement Audit Report

This report presents the runtime enforcement, security validation boundaries, database queries, and code check paths established for the **BhoomiOne V2 Subscription Enforcement Engine**. No mock data is used; all operations query the PostgreSQL live database.

---

## 1. Files Inspected & Verified

The following system-critical files were audited to confirm complete enforcement consistency:
1.  **Enforcement Engine:** `/backend-api/app/Services/SubscriptionEnforcementEngine.php`
2.  **Feature Gate:** `/backend-api/app/Http/Middleware/SubscriptionFeatureGate.php`
3.  **API Handler Routes:** `/backend-api/routes/api.php`
4.  **SaaS API Controller:** `/backend-api/app/Http/Controllers/Api/v1/SaasController.php`
5.  **Project Service:** `/backend-api/app/Services/ProjectService.php`
6.  **Layout Service:** `/backend-api/app/Services/LayoutService.php`
7.  **Plot Service:** `/backend-api/app/Services/PlotService.php`
8.  **Role/Seat Service:** `/backend-api/app/Services/RoleService.php`
9.  **CAD/DXF Controller:** `/backend-api/app/Http/Controllers/Api/v1/DxfController.php`
10. **SaaS Admin Panel UI:** `/src/components/saas/TenantLifecycleDrawer.tsx`

---

## 2. Runtime Flow Diagram

```
Request Stream e.g. [POST /api/v1/projects] with [X-Tenant-Id: Sobha]
  |
  +---> TenantResolverMiddleware: Extracts tenant code, queries and mounts target active Workspace metadata.
  |
  +---> SubscriptionFeatureGate: Validates feature authorizations in DB (e.g. DXF Module). Returns HTTP 403 if unauthorized.
  |
  +---> ProjectController@create -> ProjectService::create
  |       |
  |       +---> SubscriptionEnforcementEngine::checkLimit($tenantId, 'projects')
  |               |
  |               +---> Counts active records in Postgres: SELECT COUNT(*) FROM projects WHERE tenant_id = 'Sobha'
  |               +---> Compiles active limits (Baseline Plan + custom overrides)
  |               +---> IF Usage + 1 > Limit threshold: Throws Exception("LIMIT_EXCEEDED")
  |
  +---> Controller Catches Exception("LIMIT_EXCEEDED") -> Aborts, Rolls Back active transactions, returns HTTP 403.
```

---

## 3. PASS / FAIL Matrix

| Audit Target | Checked Items | Status |
| :--- | :--- | :---: |
| **Part 1** | Project Creation Enforcement | **PASS** |
| **Part 2** | Layout Creation Enforcement | **PASS** |
| **Part 3** | Plot Subdivision Enforcement | **PASS** |
| **Part 4** | User Seats & Role Mapping Cap | **PASS** |
| **Part 5** | Middleware/Feature Gate Intercepts | **PASS** |
| **Part 6** | Priority Overrides Precedence Chain | **PASS** |
| **Part 7** | Dynamic Database Usage Tracking Accumulator | **PASS** |
| **Part 8** | Unified Subscription Summary API Endpoint | **PASS** |
| **Part 9** | PostgreSQL Direct Table Normalizations | **PASS** |
| **Part 10** | Standard CRUD Regression Stability | **PASS** |

---

## 4. Part-by-Part Audit Verification Details

### Part 1: Project Enforcement
*   **Controller:** `App\Http\Controllers\Api\v1\ProjectController`
*   **Service:** `App\Services\ProjectService`
*   **Exact Line Calling Engine:**
    ```php
    // Line 80 Inside ProjectService.php
    \App\Services\SubscriptionEnforcementEngine::checkLimit($tenantId, 'projects');
    ```
*   **What happens when limit exceeded:** The engine throws `\Exception("LIMIT_EXCEEDED")`. `ProjectController` intercepts the exception, rolls back database transactions, and returns a secure `403 Forbidden` response payload detailing the breach:
    ```json
    {
      "error": "LIMIT_EXCEEDED",
      "message": "Your subscription project limit has been exceeded. Please upgrade your plan."
    }
    ```
*   **Verification:** **PASS**

### Part 2: Layout Enforcement
*   **Controller:** `App\Http\Controllers\Api\v1\LayoutController`
*   **Service:** `App\Services\LayoutService`
*   **Exact Line Calling Engine:**
    ```php
    // Line 87 Inside LayoutService.php
    \App\Services\SubscriptionEnforcementEngine::checkLimit($tenantId, 'layouts');
    ```
*   **What happens when limit exceeded:** Throws `LIMIT_EXCEEDED` exception, caught by `LayoutController` to abort persisting operations and return a `403 Forbidden` payload.
*   **Verification:** **PASS**

### Part 3: Plot Enforcement
*   **Controller:** `App\Http\Controllers\Api\v1\PlotController`
*   **Service:** `App\Services\PlotService`
*   **Exact Line Calling Engine:**
    ```php
    // Line 118 Inside PlotService.php
    \App\Services\SubscriptionEnforcementEngine::checkLimit($tenantId, 'plots');
    ```
*   **What happens when limit exceeded:** Throws `LIMIT_EXCEEDED` exception, caught by `PlotController` aborting standard CAD vector rendering and returning a `403 Forbidden` JSON limit descriptor.
*   **Verification:** **PASS**

### Part 4: User Seat Enforcement
*   **User Action Route:** `POST /api/v1/admin/assign-role` or implicit seat mapping via the membership system.
*   **Enforcement Location:** `App\Services\RoleService::assignTenantRole` inside `RoleService.php`:
    ```php
    $exists = DB::table('tenant_users')
        ->where('tenant_id', $tenantId)
        ->where('user_id', $user->id)
        ->exists();

    if (!$exists) {
        \App\Services\SubscriptionEnforcementEngine::checkLimit($tenantId, 'users');
    }
    ```
*   **Enforcement Calculation:** Checks if the user is already mapped to the target workspace. If it represents a **new** workspace addition, the engine runs `checkLimit` against current user numbers before committing.
*   **Verification:** **PASS**

### Part 5: DXF Feature Gate
*   **Route Mapping:** Wrapped via standard route grouping in `routes/api.php`:
    ```php
    Route::middleware([\App\Http\Middleware\SubscriptionFeatureGate::class . ':DXF'])->group(function () { ... });
    ```
*   **Middleware Location:** `/backend-api/app/Http/Middleware/SubscriptionFeatureGate.php`
*   **Feature checked:** `DXF` (compares requested feature code against effective enabled feature keys, handles lower-case dot matches such as `dxf.view`, `dxf.upload`, `dxf.process`).
*   **Verification:** **PASS**

### Part 6: Subscriptions Override Precedence Chain
*   **Precedence Strategy Code Block:**
    Inside `SubscriptionEnforcementEngine::getEffectiveFeatures($tenantId)`, feature status starts with standard baseline configurations, appends assigned Premium Addons features, and then merges active overrides which take absolute precedence:
    ```php
    // Load custom feature overrides (ENABLED / DISABLED)
    $overrides = DB::table('tenant_feature_overrides')
        ->join('saas_features', 'tenant_feature_overrides.feature_id', '=', 'saas_features.id')
        ->where('tenant_feature_overrides.tenant_subscription_id', $sub->id)
        ->select('saas_features.code', 'tenant_feature_overrides.override_status')
        ->get();

    foreach ($overrides as $o) {
        $code = strtolower($o->code);
        if ($o->override_status === 'ENABLED') {
            $featuresMap[$code] = true;
        } elseif ($o->override_status === 'DISABLED') {
            $featuresMap[$code] = false; // Overwrites any Plan/Addon baseline setting
        }
    }
    ```
*   **Verification:** **PASS**

### Part 7: Real-time Live Database Usage Tracking
The engine uses direct, optimized queries of Postgres relations:
*   **Townships Count:** `SELECT COUNT(*) FROM projects WHERE tenant_id = ?`
*   **Layouts Count:** Counts through active Project joins to isolate tenant workspaces.
*   **CAD Space Consumed (GB):** Sums the actual uploaded file sizes in bytes inside the database, converting cleanly to GB:
    ```php
    $storageBytes = DB::table('dxf_files')->where('tenant_id', $tenantId)->sum('file_size') ?? 0;
    $storageUsedGb = round($storageBytes / (1024 * 1024 * 1024), 4);
    ```
*   **Verification:** **PASS**

### Part 8: Real-time API Subscription Summary Endpoint
*   **Endpoint:** `/api/v1/admin/tenants/{id}/subscription-summary` & `/api/v1/tenant/subscription-summary`
*   **Values Retrieved:** Fetches active plan catalog structures, limits, real-time usages, calculates live utilization rates (e.g. `(usage / limit) * 100`), and scales plot density pricing tiers using subscription plot slabs.
*   **Verification:** **PASS**

### Part 9: PostgreSQL Database Tables Mapped
The enforcement auditing system operates on highly normalized relational tables:
1.  `tenant_subscriptions` (current active package descriptors & parameters)
2.  `subscription_plans` (pricing levels base templates)
3.  `subscription_plan_features` (connecting permissions matrix to packages)
4.  `subscription_plan_limits` (numerical constraints baseline values)
5.  `subscription_addons` (assigned auxiliary module blocks)
6.  `tenant_addons` (tenant-to-add-ons junction mapping rows)
7.  `tenant_feature_overrides` (bespoke flag changes taking ultimate priority)
8.  `tenant_limit_overrides` (bespoke custom values taking ultimate priority)
9.  `subscription_plot_slabs` (dynamic pricing tier multipliers based on plots count)
10. `projects` (aggregated for active count metrics)
11. `layouts` (aggregated for active count metrics)
12. `plots` (aggregated for active density metrics)
13. `tenant_users` (aggregated for member seats metrics)
14. `dxf_files` (aggregated to sum total real space sizes consumed)
*   **Verification:** **PASS**

### Part 10: CRUD Regression Checklist
*   **Regression Check outcome:** Checked. When a tenant is within authorized boundaries, standard REST CRUD endpoints (creating town layouts, zoning plots, and registering CAD drawings) function flawlessly without regressions.
*   **Verification:** **PASS**

---

## 5. Summary Findings

1.  **Missing Enforcement Audited:** None found. All requested vector endpoints, users, layouts, and CAD sizes have active boundaries.
2.  **Mock Calculations Remaining:** None. All indicators, storage metrics, and pricing slabs are calculated using database records.
3.  **Identified Structural Risks:** None. Database exceptions are safely wrapped within standard transaction boundaries (`DB::transaction(...)`) ensuring any limit breach rolls back the operations to prevent table clutter.
