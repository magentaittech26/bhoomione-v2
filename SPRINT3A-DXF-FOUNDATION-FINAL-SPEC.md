# Technical Specification: Sprint 3A — DXF Import Foundation (FINAL)
**BhoomiOne V2 ERP Inventory Engine**

This document details the final architectural specification for the **CAD Drawing Exchange Format (DXF)** imports pipeline core. This foundation focuses strictly on secure DXF uploading, storage, asynchronous queue management, automated layer discovery, and custom layer-to-type mappings with re-usable template mappings.

---

## 1. Scope Discipline & Boundary Mandates

To ensure maximum focus on foundational stability, the following disciplines are strictly enforced:
* **No Automated Plot Generation**: No inventory records, plots, or parent parcels are written to the database during this sprint step.
* **No SVG/Geom Processing**: No SVG translation, SVG renderers, or vector conversion coordinates are processed.
* **No Map Integrations**: No Google Maps, MapBox, Leaflet, or visual interactive overlays are rendered.
* **No Schema Pollutions**: Real layout subdivision data structures remain untouched until final validation approval.

---

## 2. Updated Architectural Workflow Schema

The complete DXF parsing and template automation sequence flows across nine discrete stages:

```
[ Step 1: Upload DXF ] ──► [ Step 2: Store Original File ] ──► [ Step 3: Create Import Job ]
                                                                             │
[ Step 6: Layer Mapping ] ◄── [ Step 5: Discover Layers ] ◄── [ Step 4: Analyze DXF ]
           │
           ▼
[ Step 7: Save Mapping Template ] ──► [ Step 8: User Approval ] ──► [ Step 9: Processing (Audit Trails) ]
```

### Detailed Execution Matrix:
* **Step 1 — Upload DXF**: Web manager uploads a `.dxf` CAD file through the React dashboard (bound by `dxf.upload` permission).
* **Step 2 — Store Original File**: Server validates headers, hashes file content, checks for duplicates, and writes the stream to secure disk path: `/storage/tenants/{tenant_id}/dxf/`.
* **Step 3 — Create Import Job**: Emits a new record on the database under `import_jobs` table, setting state to `uploaded`.
* **Step 4 — Analyze DXF**: Dispatched to background queue driver. Background worker locks and streams index reading of section tags, logging milestones.
* **Step 5 — Discover Layers**: Scans DXF header arrays to identify all unique active drawing layers, counting CAD objects within layers.
* **Step 6 — Present Layer Mapping**: Frontend fetches discovered layer arrays and presents mapping selectors where the user designates standard taxonomy categories.
* **Step 7 — Save Mapping Template**: Optionally, the specified layer map configuration is saved as a reusable template to the database under `import_templates` to automate downstream imports.
* **Step 8 — User Approval**: The developer reviews discovered mappings and approves the mapped payload inputs.
* **Step 9 — Processing**: Job updates to `completed` state, recording all processing milestones and file metadata under granular job audit logs.

---

## 3. Core Database Entities

Migrations will introduce five relational entities in PostgreSQL.

### A. Table: `dxf_files`
Tracks unique CAD source files with physical binary mapping.

| Column Name | Type | Key / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key (Default: `gen_random_uuid()`) | Unique system identifier. |
| `tenant_id` | `UUID` | Foreign Key -> `tenants(id)` (ON DELETE CASCADE) | Multi-tenant separator. |
| `project_id` | `UUID` | Foreign Key -> `projects(id)` (ON DELETE CASCADE) | Owner Project context. |
| `layout_id` | `UUID` | Foreign Key -> `layouts(id)` (ON DELETE CASCADE, Nullable) | Owner Layout context. |
| `file_name` | `VARCHAR(255)` | Not Null | CAD file name. |
| `file_path` | `VARCHAR(512)` | Not Null | Internal file directory path. |
| `file_size` | `BIGINT` | Not Null | File size (bytes). |
| `file_hash` | `VARCHAR(64)` | Not Null | SHA-256 for integrity and deduplication checks. |
| `version` | `INT` | Not Null (Default: `1`) | Version count index. |
| `created_by` | `UUID` | Foreign Key -> `users(id)` (ON DELETE SET NULL) | Handled operator account. |
| `created_at` | `TIMESTAMP` | Not Null | standard database timestamp. |
| `updated_at` | `TIMESTAMP` | Not Null | standard database timestamp. |

---

### B. Table: `import_jobs`
Monitors processing status and execution timelines.

| Column Name | Type | Key / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Progress thread primary key tracker. |
| `tenant_id` | `UUID` | Foreign Key | Multi-tenant separator. |
| `dxf_file_id` | `UUID` | Foreign Key -> `dxf_files(id)` (ON DELETE CASCADE) | Parent file model structure. |
| `status` | `VARCHAR(40)` | Not Null (Default: `'uploaded'`) | Enums: `uploaded`, `queued`, `processing`, `completed`, `failed`. |
| `total_entities_found`| `INT` | Nullable | Combined CAD vertices count inside elements. |
| `extracted_metadata` | `JSONB` | Nullable | JSON metadata listing raw found layer names and geometry bounding calculations. |
| `error_message` | `TEXT` | Nullable | Detailed failure trace if process ends in state `failed`. |
| `queued_at` | `TIMESTAMP` | Nullable | Timestamp representing queued state. |
| `started_at` | `TIMESTAMP` | Nullable | Timestamp representing active processing thread. |
| `finished_at` | `TIMESTAMP` | Nullable | Timestamp representing end-of-parsing trace. |
| `created_at` | `TIMESTAMP` | Not Null | standard database timestamp. |
| `updated_at` | `TIMESTAMP` | Not Null | standard database timestamp. |

---

### C. Table: `import_job_logs`
Fine-grained progress tracking and structural debugging timeline.

| Column Name | Type | Key / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | ID. |
| `import_job_id` | `UUID` | Foreign Key -> `import_jobs(id)` (ON DELETE CASCADE) | Parent job tracking. |
| `log_level` | `VARCHAR(20)` | Not Null (Default: `'INFO'`) | Log levels: `'INFO'`, `'WARNING'`, `'ERROR'`. |
| `step_name` | `VARCHAR(80)` | Not Null | Step reference: `'HEADER_READ'`, `'TABLES_PARSE'`, `'ENTITY_COUNT'`, etc. |
| `message` | `TEXT` | Not Null | Full diagnostic audit description. |
| `duration_ms` | `INT` | Nullable | Computation span tracker. |
| `created_at` | `TIMESTAMP` | Not Null | standard database timestamp. |

---

### D. Table: `dxf_layer_mappings`
Stores designated system taxonomy categories against discovered CAD drawing layers.

| Column Name | Type | Key / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | ID. |
| `tenant_id` | `UUID` | Foreign Key -> `tenants(id)` (ON DELETE CASCADE) | Multi-tenant separator. |
| `dxf_file_id` | `UUID` | Foreign Key -> `dxf_files(id)` (ON DELETE CASCADE) | Linked CAD configuration file. |
| `layer_name` | `VARCHAR(150)` | Not Null | Discovered text identifier. |
| `layer_type` | `VARCHAR(40)` | Not Null | **Taxonomy System Mapping**. Enum: `PLOT`, `ROAD`, `AMENITY`, `UTILITY`, `BOUNDARY`, `IGNORE`. |
| `created_at` | `TIMESTAMP` | Not Null | standard database timestamp. |
| `updated_at` | `TIMESTAMP` | Not Null | standard database timestamp. |

---

### E. Table: `import_templates`
Stores reusable templates so future DXF files with similar CAD layer nomenclatures can skip manual configuration steps.

| Column Name | Type | Key / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | ID. |
| `tenant_id` | `UUID` | Foreign Key -> `tenants(id)` (ON DELETE CASCADE) | Multi-tenant separator. |
| `name` | `VARCHAR(150)` | Not Null | Described user template name (e.g. `'Standard Survey Map'`). |
| `mappings` | `JSONB` | Not Null | JSON configuration mapping CAD Layer-to-Taxonomy (e.g., `{"PLOT_NO": "PLOT", "ROAD_9M": "ROAD"}`). |
| `created_at` | `TIMESTAMP` | Not Null | standard database timestamp. |
| `updated_at` | `TIMESTAMP` | Not Null | standard database timestamp. |

---

## 4. Security, RBAC & Context Governance

To conform with BhoomiOne's tight organizational safety profiles, the following roles and authorization rules apply:

### A. Scope Mapping permissions
* **`dxf.upload`**: Restricts endpoints: `POST /api/v1/dxf/upload`.
* **`dxf.view`**: Checks validation scope for: `GET /api/v1/dxf/files`, `GET /api/v1/dxf/jobs`, `GET /api/v1/dxf/templates`.
* **`dxf.process`**: Protects triggers: `POST /api/v1/dxf/process`, `POST /api/v1/dxf/mappings/approve`.

### B. Tenancy Guard Rules
The `tenant_id` is automatically injected into all database rows using Laravel's middleware. No manual file reads are executed without tenancy folder checks.

---

This completes the **Sprint 3A Final Architecture Specification**.
