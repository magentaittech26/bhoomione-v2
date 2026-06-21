# Technical Specification: Sprint 3A — DXF Import Foundation
**BhoomiOne V2 ERP Inventory Engine**

This document details the architectural specification for the core foundational layers required to handle **CAD Drawing Exchange Format (DXF)** imports. This foundation focuses strictly on file management, secure sandboxed storage, asynchronous state queuing, and structural parsing/layer discovery. 

Consistent with our rigorous **Scope Discipline**, all interactive GIS viewers, Google Maps embeds, dynamic SVG renderers, and database-level plot parcel generation routines are explicitly **out of scope** for this phase.

---

## 1. High-Level Architecture Block Diagram

All CAD operations are split into synchronous request handling and isolated backend execution layers to ensure high reliability when processing files up to 100MB+ in size.

```
[ Frontend: BhoomiOne UI ] 
        │
        ▼ (Rest API with JWT & tenant headers under dxf.upload permission)
[ Laravel Web Server ] 
        │
        ├──► [ Writes to secure storage path: /storage/tenants/{id}/dxf/ ]
        └──► [ Database: Records entry in dxf_files & creates import_jobs (status: "uploaded") ]
                 │
                 ▼ (Dispatches Async Job to Laravel Queue under dxf.process permission)
           [ Worker: DXF Structural Queue ]
                 │
                 ├──► [ Transitions status to "processing" ]
                 ├──► [ Reads low-level DXF ASCII chunks via memory-managed stream parser ]
                 ├──► [ Extracts CAD layers names, bounds, & spatial entity counts ]
                 ├──► [ Populates import_job_logs showing timeline audits ]
                 └──► [ Writes parsed JSON structures directly to import_jobs.extracted_metadata ]
```

---

## 2. Database Schema Deliverables

Database migrations will introduce three dedicated entities optimized with standard Postgres indexes, foreign keys matching existing architectural structures, and cascading delete guards where appropriate.

### A. The `dxf_files` Table
This tracks physical CAD files associated with specific hierarchical nodes (Tenant, Project, can optionally link to Layout).

| Column Name | Type | Key / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key (Default: `uuid_generate_v4()`) | Unique system identifier. |
| `tenant_id` | `UUID` | Foreign Key -> `tenants(id)` (ON DELETE CASCADE) | Multi-tenant context boundary. |
| `project_id` | `UUID` | Foreign Key -> `projects(id)` (ON DELETE CASCADE) | Relational Project boundary. |
| `layout_id` | `UUID` | Foreign Key -> `layouts(id)` (ON DELETE CASCADE, Nullable) | Target Subdivision Layout/Phase boundary. |
| `file_name` | `VARCHAR(255)` | Not Null | User-submitted CAD file name. |
| `file_path` | `VARCHAR(512)` | Not Null | Relative path in the secure storage disk. |
| `file_size` | `BIGINT` | Not Null | File sizing in bytes for quota monitoring. |
| `file_hash` | `VARCHAR(64)` | Not Null | SHA-256 integrity hash for deduplication/identity check. |
| `version` | `INT` | Not Null (Default: `1`) | Version index tracker. |
| `created_by` | `UUID` | Foreign Key -> `users(id)` (ON DELETE SET NULL) | Identifying uploading manager user. |
| `created_at` | `TIMESTAMP` | Not Null | standard database timestamp. |
| `updated_at` | `TIMESTAMP` | Not Null | standard database timestamp. |

---

### B. The `import_jobs` Table
Maintains transaction progress records of the cad document parsing runs.

| Column Name | Type | Key / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique pipeline transaction identifier. |
| `tenant_id` | `UUID` | Foreign Key -> `tenants(id)` (ON DELETE CASCADE) | Multi-tenant context boundary. |
| `dxf_file_id` | `UUID` | Foreign Key -> `dxf_files(id)` (ON DELETE CASCADE) | Pointer to active CAD binary. |
| `status` | `VARCHAR(40)` | Not Null (Default: `'uploaded'`) | Current state. Enums: `uploaded`, `queued`, `processing`, `completed`, `failed`. |
| `total_entities_found`| `INT` | Nullable | Combined count of lines, lwpolylines, texts, circles found. |
| `extracted_metadata` | `JSONB` | Nullable | Extracted raw JSON arrays holding found layer names, coordinates bounding box, and block counts. |
| `error_message` | `TEXT` | Nullable | Detailed failure trace if status transitions to `'failed'`. |
| `queued_at` | `TIMESTAMP` | Nullable | Timestamp when job in queued state. |
| `started_at` | `TIMESTAMP` | Nullable | Timestamp when worker thread locked and processed the job. |
| `finished_at` | `TIMESTAMP` | Nullable | Timestamp when compilation completed or errored out. |
| `created_at` | `TIMESTAMP` | Not Null | standard database timestamp. |
| `updated_at` | `TIMESTAMP` | Not Null | standard database timestamp. |

---

### C. The `import_job_logs` Table
A highly-granular developer audit ledger tracking parsing milestones within complex multi-layer cad documents.

| Column Name | Type | Key / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Standard primary index. |
| `import_job_id` | `UUID` | Foreign Key -> `import_jobs(id)` (ON DELETE CASCADE) | Parent job transaction locator. |
| `log_level` | `VARCHAR(20)` | Not Null (Default: `'INFO'`) | Diagnostic level: `INFO`, `WARNING`, `ERROR`. |
| `step_name` | `VARCHAR(80)` | Not Null | Segment: e.g. `'HEADER_READ'`, `'TABLES_PARSE'`, `'ENTITY_COUNT'`, `'FINALIZE'`. |
| `message` | `TEXT` | Not Null | Narrative log detailing exact milestone context. |
| `duration_ms` | `INT` | Nullable | Time taken to execute specific parsing block. |
| `created_at` | `TIMESTAMP` | Not Null | standard database timestamp. |

---

## 3. Security Framework & Multi-Tenant Boundaries

Data isolation is built deep within the structural architecture to enforce compliance under multi-tenant enterprise agreements.

### A. Dynamic RBAC Scope Actions
We introduce three highly granular permissions associated with DXF operations:
1. **`dxf.upload`**: Unlocks permission to submit CAD binaries to API routes. UI elements (file dropzones) are locked if this flag is missing.
2. **`dxf.view`**: Grants permission to browse list arrays returned from `dxf_files` and metadata trees within `import_jobs`.
3. **`dxf.process`**: Authorizes users to manually trigger new processing passes on existing files or manipulate queue priorities.

### B. Tenant Isolation Guards (Laravel Web Tiers)
No file actions are resolved via direct filesystem inputs. Every route maps through the workspace `TenantResolverMiddleware` which:
1. Translates authorization headers into active `$tenantId`.
2. Validates that selected `project_id` and `layout_id` records actually exist under that specific tenant context.
3. Automatically namespaces the physical binary write-path matching: `/storage/tenants/{tenant_id}/dxf/{project_id}/`.
4. Employs Eloquent Global Scopes on the models to ensure database queries implicitly inject the matching tenant constraints:
   ```php
   static::addGlobalScope('tenant', function (Builder $builder) {
       $builder->where('tenant_id', TenantContext::getTenantId());
   });
   ```

---

## 4. Solid Storage & CAD Versioning Protocols

### A. Version Identity Mapping
To ensure traceability and audit logs integrity:
* Original source files must **never be deleted or overridden** on key updates.
* When a newer model revision is pushed to an address, system lookup directories check database hashes against the specific Project/Layout tracking path.
* If duplicate hashes exist, upload is aborted to protect database integrity.
* If newer content is parsed, version increments dynamically (`version = version + 1`), preserving history in `/storage/tenants/{id}/dxf/` directories formatted as:
  `{relative_dir}/dxf_{file_hash}_v{version}.dxf`

---

## 5. Async Queue Pipelines & Processing State Machine

Strict UI-safe operations dictate that NO synchronous parsing of CAD files happens within client web threads.

```
       [ Client Upload ]
               │
               ▼
      (Job State: uploaded)
               │
               ▼
    [ Dispatch to Queue: `dxf-parser` ]
               │
               ▼
       (Job State: queued)
               │
               ▼  ◄── Worker thread locks job
     (Job State: processing)
               │
               ├─────────────────────────┐
               ▼ (On Success)            ▼ (On Parse Exception / Format Fail)
     (Job State: completed)     (Job State: failed)
```

### Queue Engine Execution Protocol:
1. Upon successful upload, file paths are scheduled as a background processing message inside the Laravel redis/database driven queue driver (Queue Name: `dxf-parser`).
2. Workers parse the ASCII format sequentially, extracting only the header information (`$EXTMIN`, `$EXTMAX`) and spatial layer metadata entries stored under the tables block: `SECTION` -> `TABLES` -> `TABLE` (Layer Table).
3. System tracks memory footprints dynamically, raising warning flags in `import_job_logs` if parsing surpasses pre-allocated memory pools.

---

## 6. Functional Layer Discovery Specifications

The core engine reads valid DXF representations without rendering visual nodes, extracting layers and checking them against a standard structure:

1. **Extraction Boundaries**:
   * Scans the system mapping file until it matches block tag indicators: `0 / SECTION`, `2 / TABLES`, `0 / TABLE`, `2 / LAYER`.
   * Loops through distinct CAD layers identifying unique string identifiers.
2. **Aesthetic/Attribute Mapping**:
   * Extracts layer details such as Layer Names, Color Index variables (`62`), and Line Type signatures (`6`).
   * Computes initial spatial counts: combined vertices count, boundaries, lines, or labels inside each specific layer context.
3. **Storage Container**:
   * Saves the parsed metadata structural array down to the index value inside `import_jobs.extracted_metadata`.
   * Sample expected structure:
     ```json
     {
       "layers": [
         { "name": "PLOT_BOUNDARIES", "color": 1, "entity_count": 850, "line_type": "CONTINUOUS" },
         { "name": "ROADS", "color": 3, "entity_count": 120, "line_type": "DASHED" },
         { "name": "STREET_LIGHTS", "color": 5, "entity_count": 92, "line_type": "CONTINUOUS" }
       ],
       "extents": {
         "min": { "x": 0.0, "y": 0.0, "z": 0.0 },
         "max": { "x": 1000.0, "y": 800.0, "z": 0.0 }
       }
     }
     ```

---

## 7. Audit & Validation Logs

Continuous logging hooks are embedded within the database services:
* **Infrastructure Auditing**: Transitions in importing files, deletion queries, and manual configuration overrides instigate record logs inside the master `audit_logs` service framework.
* **Granular Task Diagnostic Progress**: Detailed timeline exceptions, row-level format parsing delays, and coordinate scale failures are logged instantly in the separate `import_job_logs` table structure to grant developer-level oversight.
* **Tenant IP Tracking**: Every request captures Client Header metrics (such as User Agent, Source IP bounds) directly to ensure complete security tracing.
