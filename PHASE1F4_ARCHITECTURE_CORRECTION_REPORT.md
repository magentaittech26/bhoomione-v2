# Phase 1F.4 – SaaS Settings & Commercial Pricing Architecture Correction Report

## 1. Files Removed / Modified in Express (Node Gateway)
To eliminate redundant business and database persistence logic from the Express proxy, all plot slabs and platform settings operations have been completely purged:
*   **`server/routes/saas.ts`**: Deleted endpoints `GET /admin/slabs`, `POST /admin/slabs`, `DELETE /admin/slabs/:id`, `POST /admin/slabs/reorder`, `GET /admin/settings`, and `POST /admin/settings` along with their corresponding PostgreSQL queries and validation blocks.
*   **`server/db/bootstrap.ts`**: Purged the creation statement for table `saas_platform_settings`, dropped column-level schema alterations for `subscription_plot_slabs` (`one_time_license_price`, `amc_price`, and `sort_order`), and completely removed the seed scripts for `saas_platform_settings` as well as the extended attributes in `subscription_plot_slabs` seeding.

---

## 2. Files Changed & Maintained in Laravel (Business Domain Core)
SaaS business operations are centralized exclusively in the Laravel API domain, aligning with high-cohesion design patterns:
*   **`backend-api/routes/api.php`**: Declares API routers mapped under `/api/v1` namespace for settings and slabs:
    *   `GET /api/v1/admin/settings` -> `SaasController@getPlatformSettings`
    *   `POST /api/v1/admin/settings` -> `SaasController@savePlatformSettings`
    *   `GET /api/v1/admin/slabs` -> `SaasController@getPlotSlabs`
    *   `POST /api/v1/admin/slabs` -> `SaasController@savePlotSlab`
    *   `DELETE /api/v1/admin/slabs/{id}` -> `SaasController@deletePlotSlab`
    *   `POST /api/v1/admin/slabs/reorder` -> `SaasController@reorderPlotSlabs`
*   **`backend-api/app/Http/Controllers/Api/v1/SaasController.php`**: Orchestrates requests and delegates validation/transaction lifecycle down to the application service layers.
*   **`backend-api/app/Services/SaasSubscriptionService.php`**: Implements durable PostgreSQL transactions, active usage checks on deletion, bulk configurations saving, and structural audit logging utilizing `AuditLogService`.
*   **`backend-api/database/migrations/2026_06_23_000003_create_saas_platform_settings_and_slabs_update_table.php`**: Declares native DB schemas for `saas_platform_settings` table and modern `subscription_plot_slabs` attributes.

---

## 3. Consolidated Route List (Laravel Native)

| HTTP Verb | Endpoint | Handler | Action Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/admin/settings` | `SaasController@getPlatformSettings` | Fetches granular rows from `saas_platform_settings` table. |
| **POST** | `/api/v1/admin/settings` | `SaasController@savePlatformSettings` | Accepts array inputs, bulk saving or updating rows inside transactions. |
| **GET** | `/api/v1/admin/slabs` | `SaasController@getPlotSlabs` | Retrieves all plot billing slabs ordered by `sort_order` and `min_plots`. |
| **POST** | `/api/v1/admin/slabs` | `SaasController@savePlotSlab` | Inserts or updates individual slabs using UUIDs or auto-generations. |
| **DELETE** | `/api/v1/admin/slabs/{id}` | `SaasController@deletePlotSlab` | Deletes a slab only after checking that no tenant falls in that range. |
| **POST** | `/api/v1/admin/slabs/reorder` | `SaasController@reorderPlotSlabs` | Updates the sequence and `sort_order` ranking of list coordinates. |

---

## 4. Runtime Verification Commands
The following commands can be executed in development/production environments to verify alignment:
*   **Verify Laravel Route Configurations**:
    ```bash
    php artisan route:list --path=api/v1/admin
    ```
*   **Verify Laravel Database Migrations**:
    ```bash
    php artisan migrate:status
    ```
*   **Verify Node Dev Server & Frontend Compilation**:
    ```bash
    npm run lint
    npm run build
    ```

---

## 5. Protected Files Untouched Confirmation
The following files and components were strictly preserved with **zero structural modifications**:
1.  `nginx.staging.conf`
2.  `docker-compose.staging.yml`
3.  `Dockerfile*`
4.  `backend-api/.env*`
5.  `backend-api/config/*`
6.  `TenantResolverMiddleware`
7.  `PermissionRequirementMiddleware`
8.  `AuthController`
9.  Existing Project/Layout/Plot/DXF/Maps APIs
10. Existing Tenant Provisioning APIs
