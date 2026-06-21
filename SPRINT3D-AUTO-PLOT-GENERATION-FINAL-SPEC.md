# Sprint 3D — Auto Plot Generation Final Technical Specification

This specification outlines the architecture, data models, business rules, and integration endpoints for the **Auto Plot Generation Engine** (Sprint 3D). It converts Cartesian geometries parsed from DXF coordinates files (`geometry_entities`) into transactable real-world assets (`plots`, `roads`, `amenities`) under a strict dual-gate administrative approval workflow.

---

## 1. Objectives & Compliance Guardrails

The goal of this engine is to automate subdivision layout creation by translating geographic polygon coordinates into inventory entities.

### 🚫 Strict Exclusions
* **No SVG/Vector Graphics Rendering**: No conversion of coordinate sequences into `<svg>` paths, SVG canvases, or static images.
* **No Map Rendering & GIS Viewers**: No embedding of Google Maps, Leaflet, Mapbox, satellite layers, or spatial project overlays.

---

## 2. Updated Database Specifications

Traceability, auditing, and multi-run generation controls are added via the introduction of generation runs tracking and specific link tags.

### A. Generation Batches Schema (`generation_batches`)
Tracks every individual administrative execution to revert or audit layout conversions:
* **`id`** (`UUID`, PK): Unique batch execution identifier.
* **`tenant_id`** (`UUID`, FK): Identifies root tenant context.
* **`import_job_id`** (`UUID`, FK): Back-link identifier to the source import job.
* **`generated_plots`** (`JSONB`): Indexed sequence list of created plot UUIDs.
* **`generated_roads`** (`JSONB`): Indexed sequence list of created road UUIDs.
* **`generated_amenities`** (`JSONB`): Indexed sequence list of created amenity UUIDs.
* **`status`** (`VARCHAR(50)`): Conversion status (`PENDING`, `APPROVED`, `FAILED`).
* **`created_by`** (`UUID`): User who initiated the parsing run.
* **`approved_by`** (`UUID`): Administrative approver who triggered the conversion.

```sql
CREATE TABLE IF NOT EXISTS generation_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    import_job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
    generated_plots JSONB DEFAULT '[]'::jsonb,
    generated_roads JSONB DEFAULT '[]'::jsonb,
    generated_amenities JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### B. Mapped Traceability Fields
The database schema includes explicit pointers to ensure direct mathematical back-tracing:
1. **`plots` Table Updates**:
   * **`source_geometry_entity_id`** (`UUID`, FK `geometry_entities.id`): Back-trace coordinate pointer.
   * **`generation_batch_id`** (`UUID`, FK `generation_batches.id`): Tracks the execution block.
   * **`detected_label`** (`VARCHAR(100)`, Nullable): Labels extracted from CAD drawings notes layers.
   * **`generated_label`** (`VARCHAR(100)`): System fallback unique reference code.
2. **`roads` Table Updates**:
   * **`source_geometry_entity_id`** (`UUID`, FK `geometry_entities.id`)
   * **`generation_batch_id`** (`UUID`, FK `generation_batches.id`)
3. **`amenities` Table Updates**:
   * **`source_geometry_entity_id`** (`UUID`, FK `geometry_entities.id`)
   * **`generation_batch_id`** (`UUID`, FK `generation_batches.id`)

---

## 3. High-Fidelity Pre-Flight Review Workflow

Inventory conversion is **never triggered automatically** during coordinates parsing. Instead, the administrative dashboard fetches a pre-flight view, checks compliance states, and requires explicit user action.

```
       [ DXF Geometry Extracted ]
                   │
                   ▼
       [ High-Fidelity Review ]  ◄──── GET /api/v1/dxf/jobs/{id}/review
    ┌──────────────────────────────┐
    │  - Count of total geometries │
    │  - Segmented candidates      │
    │  - Total warnings count      │
    │  - Detailed warning details  │
    └──────────────┬───────────────┘
                   │
                   ▼
         [ User Action: APPROVE ] ◄─── POST /api/v1/dxf/jobs/{id}/dispatch
                   │
                   ▼
     [ Transactional Generation ]
```

### A. Pre-flight Endpoint Specs (`GET /api/v1/dxf/jobs/{id}/review`)
Exposes verification tables and potential problems:
* **Geometry Count**: Aggregated count of parsed coordinates sequences.
* **Plot Candidates**: Number of plots mapped by layer mappings.
* **Road Candidates**: Number of road paths mapped.
* **Amenity Candidates**: Communal areas/parks parsed.
* **Validation Warnings**: Open loops, self-intersections, or size issues.

---

## 4. Extraction Conversion & Business Rules

### A. Strict Geometry Filters
Any model flagged with the following items is bypassed and skipped during generation loops:
* `validation_status` !== `'VALID'`
* `validation_status` standard error flags (such as `ERROR_SELF_INTERSECTING`, `ERROR_TINY_AREA`, `ERROR_DUPLICATE`, and `WARNING_OPEN`).

### B. Plot Numbering Hierarchy Rules
* **Heuristics**:
  * If a CAD drawing text note or label was detected representing property attributes (e.g. "P-104"), **use the CAD label** as the primary `plot_number`.
  * If the CAD label is missing or undetected, **generate a system label** formatted as `PLOT-XXX`.
* **Database Values**:
  * Both fields (`detected_label`, `generated_label`) are recorded in the row to maintain audit traceability.

### C. Road Classifications Rules
The converter maps road layers into one of three standard categories to support future traffic routing profiles:
* **`MAIN_ROAD`**: Triggered when the source layer contains strings matching `'main'`, `'primary'`, or `'arterial'`.
* **`ACCESS_ROAD`**: Triggered when the source layer matches `'access'`, `'entry'`, or `'service'`.
* **`INTERNAL_ROAD`**: Default fallback classification (e.g., small interior streets).

### D. Amenity Classification Rules
* **`GREEN_BELT`**: Triggered when the layer description covers parks, open lawns, gardens, or plant zones.
* **`INFRASTRUCTURE`**: Triggered when the layer holds utility rooms, transformer sites, water tanks, or technical assets.
* **`PARK`**: Default categorization for generic civic spaces.

---

## 5. Audit Logging Architecture

Logs are saved immediately to `import_job_logs` during the pipeline steps:
1. **`GENERATION_APPROVED`**: Logged immediately when the post-back is received.
2. **`GENERATION_STARTED`**: Transitioning structures and pre-allocating ID rows.
3. **`GENERATION_PROGRESS_COMMITS`**: Stashing trace counts of committed plots, roads, and landscape corridors.
4. **`GENERATION_COMPLETED`**: Transitioning layout and project statuses from `PENDING` to `ACTIVE`.
5. **`GENERATION_FAILED`**: Logging rollback traces if coordinates overlaps or DB locks are hit.

---
*Specification successfully updated and finalized.*
