# Phase 2A — Tenant Projects Management Foundation
## Implementation Report

## 1. Architectural Overview
This phase successfully converts the **Projects** tab within the Tenant Workspace (from a static layout structure) into a fully active, tenant-isolated real estate Projects management application.

By integrating the frontend with the active Laravel backend APIs, BhoomiOne v2 now supports multi-tenant secure cataloging, full CRUD operations, advanced filters, dynamic status monitoring, real-time audit event syncing, and robust inline UI handles (loading skeletons, dynamic error overlays, and query refetching).

No structural alterations to NGINX, Docker configurations, or foreign database schemas were introduced.

---

## 2. API Contract Verification
The React frontend links directly to standard tenant-resolved RESTful endpoints protected by active JWT-session controls and system DB checks.

### Active Endpoints Integrated:
| HTTP Verb | Path | Middleware Pipeline | Purpose |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/projects` | `auth:sanctum`, `tenant.resolver`, `permission:projects.view` | Paginated search, sorting, and filtration of tenant-owned projects with submodel counts. |
| **POST** | `/api/v1/projects` | `auth:sanctum`, `tenant.resolver`, `permission:projects.manage` | Registers and validates new project parameters. |
| **GET** | `/api/v1/projects/{id}` | `auth:sanctum`, `tenant.resolver`, `permission:projects.view` | Retrieves precise metadata, status, layouts, and plot collections for a single project. |
| **PUT** | `/api/v1/projects/{id}` | `auth:sanctum`, `tenant.resolver`, `permission:projects.manage` | Modifies active specifications for a selected project record. |
| **DELETE**| `/api/v1/projects/{id}` | `auth:sanctum`, `tenant.resolver`, `permission:projects.manage` | Safe cascading deletion of the project and nested subdivisions. |

---

## 3. Database Schema Mapping
All operations mapping to the SQL database target the central `projects` engine table, fully respecting multi-tenant segmentation:

- **Source Migration File**: `2026_06_19_000007_create_projects_table.php`
- **Primary Model**: `App\Models\Project`
- **Table Name**: `projects`

### Column Structure & Schema Adaptation:
| Column Name | Database Data Type | Frontend Field Binding | Description / Constraints |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` / `CHAR(36)` | `p.id` | Table primary key. |
| `tenant_id` | `UUID` / `CHAR(36)` | Attached server-side | Isolation context for secure tenant filtering. |
| `name` | `VARCHAR(255)` | `formProj.name` | Descriptive name of the project. |
| `code` | `VARCHAR(100)` | `formProj.code` | Unique token identifier (e.g. `PRJ-ALPHA`). |
| `developer_name` | `VARCHAR(255)` | `formProj.developer_name` | Entity/organization managing construction. |
| `location` | `VARCHAR(255)` | `formProj.location` | Standardized geographical string. |
| `status` | `VARCHAR(50)` | `formProj.status` | `PLANNING` \| `ACTIVE` \| `COMPLETED` (default: `PLANNING`). |
| `rera_number` | `VARCHAR(100)` | `formProj.rera_number` | RERA/Government structural approvals validation. |
| `approval_status` | `VARCHAR(50)` | `formProj.approval_status`| `PENDING` \| `APPROVED` \| `REJECTED` (default: `PENDING`). |
| `approval_authority` | `VARCHAR(150)` | `formProj.approval_authority`| Entity issuing structure clearance (e.g., `DTCP`, `RERA`).|
| `launch_date` | `DATE` | `formProj.launch_date` | Date of public or commercial release. |
| `possession_target_date`| `DATE` | `formProj.possession_target_date`| Target completion date of the project. |
| `approvals_metadata` | `JSON` | `formProj.approvals_metadata` | Flexible document/structural approvals metadata. |
| `created_at` | `TIMESTAMP` | Calculated server-side | Registry creation log time. |
| `updated_at` | `TIMESTAMP` | Calculated server-side | Last modified log time. |

*Crucial Adaptation Note*: For fields not explicitly columns inside the active migration (e.g., `survey_number`, `approval_number`, `total_area`, `area_unit`, and `description`), the frontend cleanly binds them under the flexible `approvals_metadata` column inside the database, maintaining perfect API compatibility with zero destructive migration overrides!

---

## 4. Frontend UI Controls & State Engine
The state engine operates inside `src/components/InventoryManager.tsx` and handles:

1. **State Persistence & Re-fetching (`fetchProjectsPage`)**:
   - Updates on input search text, location selection, regulatory validation filters, status updates, or pagination.
2. **Dynamic Loaders**:
   - Integrates stateful spinner skeletons directly inside table body views during asynchronous operations.
3. **Graceful Error Banners & In-Line Retry Actions**:
   - Generates responsive toast controls, high-contrast banner logs, and inline table retries when network or database failures arise.
4. **Active Selection Inspector Drawer**:
   - Selected rows instantly parse backend aggregates (`selectedProject.layouts_count`, `available_plots_count`, `reserved_plots_count`), ensuring accurate summary calculations.
5. **Session Logs (`onAuditLogged`)**:
   - Dispatches custom events (`PROJECT_CREATE`, `PROJECT_UPDATE`, `PROJECT_DELETE`) to log activity across workspace widgets.

---

## 5. Security & Safety Auditing
- **No tenant isolation leaks**: All network requests contain authorized session Bearer JWT chips parsed dynamic tenant mapping inside tenant resolvers.
- **Role-Based Access Control**:
  - `projects.view` gating: Restricts projects rendering from unauthorized players.
  - `projects.manage` gating: Restricts Create, Edit, and Cascade Delete controllers strictly to approved administrative roles.
- **Code Preservation**: All alternative tabs (Plots, Layouts, CAD Workspace, Interactive Map, SaaS Admin, and marketplace) were fully preserved and untouched.
