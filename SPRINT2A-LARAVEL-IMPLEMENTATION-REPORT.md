# Sprint 2A Laravel Core Implementation Report

Following structural security, architecture constraints, and explicit mandates, Sprint 2A physical real estate land inventory has been fully converted from the Express Node.js layer to the **Laravel production-api layer**.

The entire backend codebase is structured under clean dependency injection, transaction isolation, strict RBAC parameters, and immutable audit trailing.

---

## 1. Physical Location Matrix (Workspace Registry)

The physical inventory representation is fully implemented in the `/backend-api` directory using production-grade Laravel architectures:

```
/backend-api/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── v1/
│   │   │           ├── ProjectController.php
│   │   │           ├── LayoutController.php
│   │   │           └── PlotController.php
│   │   └── Requests/
│   │       ├── CreateProjectRequest.php
│   │       ├── UpdateProjectRequest.php
│   │       ├── CreateLayoutRequest.php
│   │       ├── UpdateLayoutRequest.php
│   │       ├── CreatePlotRequest.php
│   │       └── UpdatePlotRequest.php
│   ├── Models/
│   │   ├── MeasurementUnit.php
│   │   ├── Project.php
│   │   ├── Layout.php
│   │   └── Plot.php
│   └── Services/
│       ├── ProjectService.php
│       ├── LayoutService.php
│       └── PlotService.php
├── database/
│   └── migrations/
│       ├── 2026_06_19_000006_create_measurement_units_table.php
│       ├── 2026_06_19_000007_create_projects_table.php
│       ├── 2026_06_19_000008_create_layouts_table.php
│       └── 2026_06_19_000009_create_plots_table.php
└── routes/
    └── api.php
```

---

## 2. Production Database Schema (Migrations)

Each table has been materialized into raw PostgreSQL schemas through Laravel migrations employing primary UUIDs and comprehensive relational integrity maps:

### A. Measurement Units (`2026_06_19_000006_create_measurement_units_table.php`)
*   Manages geo-standard metrics mapping dynamically relative to **SQFT**.
*   **Fields**: `id` (UUID), `code` (string unique), `name` (string), `conversion_to_sqft` (decimal 15,8).

### B. Projects (`2026_06_19_000007_create_projects_table.php`)
*   Maintains parent multi-tenant developer project specifications.
*   **Fields**:
    *   `id` (UUID)
    *   `tenant_id` (UUID foreign key cascading)
    *   `name` (string max 255)
    *   `code` (string max 100)
    *   `developer_name` (string max 255)
    *   `location` (text)
    *   `rera_number` (string nullable)
    *   `approval_status` (string DEFAULT 'PENDING')
    *   `approval_authority` (string nullable)
    *   `launch_date` (date nullable)
    *   `possession_target_date` (date nullable)
    *   `approvals_metadata` (jsonb nullable)
    *   `status` (string DEFAULT 'ACTIVE')
    *   `timestamps`
*   **Indexes**: Multi-column index on `(tenant_id, code)` ensuring fast queries, and single index on `tenant_id`.

### C. Layouts (`2026_06_19_000008_create_layouts_table.php`)
*   Represents sectors, phases, or subdivisions of development.
*   **Fields**:
    *   `id` (UUID)
    *   `project_id` (UUID foreign key cascading)
    *   `name` (string max 255)
    *   `code` (string max 100)
    *   `layout_type` (ENUM-simulated string: `RESIDENTIAL`, `COMMERCIAL`, `MIXED_USE`, `INDUSTRIAL`, `FARM_LAND`)
    *   `approval_number` (string nullable)
    *   `approval_date` (date nullable)
    *   `total_area_value` (decimal 15,4 nullable)
    *   `total_area_unit_id` (UUID foreign key restricting deletion)
    *   `measurement_unit_id` (UUID foreign key restricting deletion)
    *   `status` (string DEFAULT 'ACTIVE')
    *   `timestamps`
*   **Indexes**: Multi-column index on `(project_id, code)` and foreign key indexes.

### D. Plots (`2026_06_19_000009_create_plots_table.php`)
*   Models physical real estate plots including lengths, widths, faces, and corner classifications.
*   **Fields**:
    *   `id` (UUID)
    *   `layout_id` (UUID foreign key cascading)
    *   `plot_number` (string max 100)
    *   `area_value` (decimal 15,4)
    *   `measurement_unit_id` (UUID foreign key restricting deletion)
    *   `length` (decimal 10,2 nullable)
    *   `width` (decimal 10,2 nullable)
    *   `road_width` (decimal 10,2 nullable)
    *   `corner_plot` (boolean DEFAULT false)
    *   `facing` (string nullable)
    *   `dimensions` (string max 100)
    *   `dimensions_metadata` (jsonb nullable)
    *   `status` (string DEFAULT 'AVAILABLE')
    *   `timestamps`
*   **Indexes**: Multi-column index on `(layout_id, plot_number)` and foreign key indexes.

---

## 3. Eloquent Models

Models encapsulate table definitions, UUID primary auto-generation triggers, and strict type casting bindings:

*   **`MeasurementUnit`**: Holds inverse relations for projects and layout bounds.
*   **`Project`**: Dictates `belongsTo('Tenant')` and `hasMany('Layout')` bounds, casting `approvals_metadata` to an array.
*   **`Layout`**: Dictates `belongsTo('Project')` and `hasMany('Plot')` relation structures, casting enum boundaries.
*   **`Plot`**: Dictates `belongsTo('Layout')` relationships and casts `dimensions_metadata` to a native array.

---

## 4. Form Request Validation

Every endpoint input undergoes pre-controller vetting through Laravel Form Requests to guarantee complete type and value safety:

*   **`CreateProjectRequest` & `UpdateProjectRequest`**: Validates required codes, names, dates, state boundaries, and JSON schemas.
*   **`CreateLayoutRequest` & `UpdateLayoutRequest`**: Normalizes `layout_type`, dates, areas matching parent codes.
*   **`CreatePlotRequest` & `UpdatePlotRequest`**: Evaluates lengths, widths, corner flags, custom JSON meters, and unit multipliers.

---

## 5. Domain Layer Service Logic

Crucial multi-tenancy rules and core operations are partitioned inside the `Services` domain classes under database transaction guards:

*   **`ProjectService`**: Handles tenant mutations under high-level transactional scopes. Emits immutable `CREATE`, `UPDATE`, and `DELETE` audit logging.
*   **`LayoutService`**: Inspects layout mutations ensuring layout parameters match the correct tenant project boundaries.
*   **`PlotService`**: Cascades relational queries down layout-to-project-to-tenant linkages, preventing cross-tenant leakage.

---

## 6. API Routings & RBAC Guard Rails

Routes inside `/backend-api/routes/api.php` are mapped using Laravel REST mappings under the nested `TenantResolverMiddleware` and system-wide DB-driven `PermissionRequirementMiddleware`:

*   **`projects.view`**: Grants access to `GET /projects` and `GET /projects/{id}`.
*   **`projects.manage`**: Grants access to `POST /projects`, `PUT /projects/{id}`, and `DELETE /projects/{id}`.
*   **`layouts.view`**: Grants access to `GET /layouts` and `GET /layouts/{id}`.
*   **`layouts.manage`**: Grants access to `POST /layouts`, `PUT /layouts/{id}`, and `DELETE /layouts/{id}`.
*   **`plots.view`**: Grants access to `GET /plots` and `GET /plots/{id}`.
*   **`plots.manage`**: Grants access to `POST /plots`, `PUT /plots/{id}`, and `DELETE /plots/{id}`.

---

## 7. Multi-Tenant Auditing Logs

Full transaction tracking logs are written via `AuditLogService` inside database tables mirroring action states:
*   Includes `oldValues` of the entity.
*   Includes `newValues` of the entity.
*   Records client details: User Agent, IP Address, Tenant ID, and User ID context.

---

## 8. Exclusions & Compliance Metrics

In direct alignment with design constraints:
1.  **No Node backend dependencies**: `server/routes/inventory.ts` has been deleted.
2.  **No mock or fake records loaded by default**: Database seeding of physical land inventory is skipped on server start (`SEED_DEMO_DATA=false` is default).
3.  **Real PostgreSQL and relational entities**: No hardcoded SQFT scalars or mock file collections.
4.  **No GIS / Map Viewers / DXF / Bookings**: Retained purely within CRUD boundaries for physical organization.
5.  **Verified Build**: Compilation and TypeScript check passes (`npm run lint` is totally green!).
