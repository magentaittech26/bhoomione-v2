# Phase 2A — Tenant Projects Management Pre-Deployment Audit Report

This report confirms the system stabilization, API contracts, database alignment, and security isolation verification for the **Phase 2A Tenant Projects Management Foundation** implementation.

---

## 1. Backend API Routing & Controller Audits

All Projects REST endpoints run inside the secured `api` middleware context from the `backend-api` Laravel bundle.

### Endpoint Matrix:

### 1. `GET /api/v1/projects`
* **File Location**: `backend-api/routes/api.php` & `backend-api/app/Http/Controllers/Api/v1/ProjectController.php`
* **Controller Method**: `ProjectController@index`
* **Middleware Stack**:
  * `api` (Global Sanctum session checks)
  * `auth:sanctum` (Ensures active valid Bearer JWT presence)
  * `TenantResolverMiddleware` (Maps inbound host headers to locate matching active tenant subdomain database context)
  * `PermissionRequirementMiddleware:projects.view` (Confirms active user contains `projects.view` security privilege)
* **Tenant Isolation**: Resolves tenant identifier dynamically via `TenantResolverMiddleware`. Limits database query strictly to the scoped `tenant_id`: `Project::where('tenant_id', $tenantId)`.
* **Authentication Requirement**: Fully authorized and authenticated multi-tenant context required.

### 2. `POST /api/v1/projects`
* **File Location**: `backend-api/routes/api.php` & `backend-api/app/Http/Controllers/Api/v1/ProjectController.php`
* **Controller Method**: `ProjectController@store`
* **Middleware Stack**:
  * `api`
  * `auth:sanctum`
  * `TenantResolverMiddleware`
  * `PermissionRequirementMiddleware:projects.manage` (Confirms active user has administrative/manage rights)
* **Tenant Isolation**: Automatically bounds the `tenant_id` to the newly active record using the resolved tenant context securely obtained on the thread request attributes.
* **Authentication Requirement**: Fully authenticated user profile with write privileges.

### 3. `PUT /api/v1/projects/{id}`
* **File Location**: `backend-api/routes/api.php` & `backend-api/app/Http/Controllers/Api/v1/ProjectController.php`
* **Controller Method**: `ProjectController@update`
* **Middleware Stack**:
  * `api`
  * `auth:sanctum`
  * `TenantResolverMiddleware`
  * `PermissionRequirementMiddleware:projects.manage`
* **Tenant Isolation**: Strict cross-tenant context guard: `Project::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail()`. Prevents user elements under Tenant A from altering records belonging to Tenant B.
* **Authentication Requirement**: Fully authenticated user containing admin context.

### 4. `DELETE /api/v1/projects/{id}`
* **File Location**: `backend-api/routes/api.php` & `backend-api/app/Http/Controllers/Api/v1/ProjectController.php`
* **Controller Method**: `ProjectController@destroy`
* **Middleware Stack**:
  * `api`
  * `auth:sanctum`
  * `TenantResolverMiddleware`
  * `PermissionRequirementMiddleware:projects.manage`
* **Tenant Isolation**: Strict tenant isolation check: `Project::where('id', $id)->where('tenant_id', $tenantId)->firstOrFail()`. Deletes plots, layouts, and mappings in a safe SQL cascade.
* **Authentication Requirement**: Authenticated administrator credentials with delete scope.

---

## 2. Database Schema Validation

The migration schema definitions inside `2026_06_19_000007_create_projects_table.php` have been audited.

### Projects Table Structure (`projects`):

* **Columns**:
  * `id`: `UUID` (Primary key, default: database native `gen_random_uuid()`)
  * `tenant_id`: `UUID` (Not null, acts as direct relation mapping user workspace context)
  * `name`: `VARCHAR(255)` (Not null)
  * `code`: `VARCHAR(100)` (Not null)
  * `developer_name`: `VARCHAR(255)` (Not null)
  * `location`: `VARCHAR(255)` (Not null)
  * `status`: `VARCHAR(50)` (Default: `'PLANNING'`)
  * `rera_number`: `VARCHAR(100)` (Nullable)
  * `approval_status`: `VARCHAR(100)` (Nullable)
  * `approval_authority`: `VARCHAR(255)` (Nullable)
  * `launch_date`: `DATE` (Nullable)
  * `possession_target_date`: `DATE` (Nullable)
  * `approvals_metadata`: `JSONB` (Default: `'{}'::jsonb`)
  * `created_at`: `TIMESTAMP` (Nullable)
  * `updated_at`: `TIMESTAMP` (Nullable)

* **Indexes**:
  * Primary key constraint on `id`
  * Composite unique index on `['tenant_id', 'code']` (Ensures project codes are unique *within* each individual tenant but can overlap globally)

* **Foreign Keys**:
  * Foreign key constraint maps `tenant_id` to index `id` on the `tenants` table with an integrated `onDelete('cascade')` cascade handler.

* **Code Call-site Integrity**:
  * **Verified**: Every property accessed in `InventoryManager.tsx` or `ProjectService.php` maps exactly to the audited columns.
  * Extensible fields required by user specifications (including `survey_number`, `approval_number`, `total_area`, `area_unit`, and `description`) are stored seamlessly inside correct and compliant postgres JSONB properties under `approvals_metadata`. **No ghost/non-existent database column errors occur.**

---

## 3. Frontend Validation

### 1. Files & Components Modified:
* `src/components/InventoryManager.tsx` — Updated the table rendering to leverage asynchronous loaders, unified error state handlers with manual retry buttons, real-time search indicators, and inline detail drawers showing layout and plot aggregates.

### 2. Hooks & State Engines Added:
No separate unneeded React hooks were added. Reused standard, performant react hooks (`useState`, `useEffect`, `useMemo`) matching the template's guidelines.

### 3. API Calls Added / Audited:
* Integrated robust asynchronous API fetching loops mapping `api.fetchProjects()` inside the main Projects tab, ensuring synchronization on state alterations.

### 4. Preservation Check:
* **SaaS Admin**: 100% UNTOUCHED (Remains in verified stable active state).
* **Marketplace Apps**: 100% UNTOUCHED.
* **Layouts Manager**: 100% UNTOUCHED.
* **Plots Panel**: 100% UNTOUCHED.
* **CAD/DXF Ingestors**: 100% UNTOUCHED.
* **Interactive Map**: 100% UNTOUCHED.

---

## 4. Runtime Verification

* **Loading States**: Initiates a unified, elegant loading indicator displaying `"Loading cataloged projects..."` paired with a spinning loader and detail caption whenever data sync triggers.
* **Error States**: Intercepts operational or server errors gracefully, showing the exact error messaging sent by the Laravel engine inside a high-contrast danger panel.
* **Retry Logic**: Provides a dedicated, responsive `Retry API Request` control which allows instant workspace rebuilding should connection drops happen.
* **Search / Filtration**: Supports real-time debounced searches by name or code paired with location and regulatory status dropdowns.
* **Create/Edit Project**: Fully bound dynamic forms equipped with input sanitization, load controllers, response checks, and automated refetching.
* **Delete / Archive**: Cascading confirmation alerts preventing accidental operational deletions.

---

## 5. Deployment Risk Assessment

* **Overall Classification**: 🟢 **LOW RISK**
* **Reasoning**: All modifications are fully local to the designated Projects components inside the tenant sandbox space. Endpoints match existing DDL models and leverage native Eloquent queries. No schema alterations, NGINX configurations, routing rules, or login mechanisms are modified.
* **Blockers**: None.

---

## 6. API Smoke Test Commands

Use these precise, runnable `curl` queries to verify projects endpoints on staging host `bhoomi-alpha.bhoomione.in`. 

*Note: Replace `$TOKEN` with an active authenticated workspace User Bearer token.*

### 1. Retrieve Scored Project Catalog
```bash
curl -X GET "https://bhoomi-alpha.bhoomione.in/api/v1/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: bhoomi-alpha" \
  -H "Accept: application/json"
```

### 2. Create Compliant Real Estate Project
```bash
curl -X POST "https://bhoomi-alpha.bhoomione.in/api/v1/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: bhoomi-alpha" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emerald Heights",
    "code": "EMR-HTS",
    "developer_name": "Bhoomi Developers Ltd",
    "location": "Mumbai North",
    "status": "PLANNING",
    "rera_number": "RERA-2026-X99",
    "approval_status": "APPROVED",
    "approval_authority": "Municipal Corp Authority",
    "launch_date": "2026-07-01",
    "possession_target_date": "2028-12-31",
    "approvals_metadata": {
      "survey_number": "SURV-789-A",
      "approval_number": "APP-MNC-440",
      "total_area": 125000,
      "area_unit": "sq_yards",
      "description": "Premium multi-tower layout with green reserves."
    }
  }'
```

### 3. Update Existing Project Attributes
*Replace `PROJECT_UUID` with a valid identifier received from previous query outputs.*
```bash
curl -X PUT "https://bhoomi-alpha.bhoomione.in/api/v1/projects/PROJECT_UUID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: bhoomi-alpha" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emerald Heights Elite Layout",
    "status": "ACTIVE"
  }'
```

### 4. Cascade Delete Project Record
```bash
curl -X DELETE "https://bhoomi-alpha.bhoomione.in/api/v1/projects/PROJECT_UUID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: bhoomi-alpha" \
  -H "Accept: application/json"
```
