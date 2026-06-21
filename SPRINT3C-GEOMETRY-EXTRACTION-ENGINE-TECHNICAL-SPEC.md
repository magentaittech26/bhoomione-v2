# Sprint 3C — Geometry Extraction Engine Technical Specification

This document presents the detailed architectural and algorithmic specification for the **Geometry Extraction Engine** (Sprint 3C) of the BhoomiOne CAD/GIS parsing pipeline.

---

## 1. Architectural Objective & Boundaries

The objective of Sprint 3C is to parse raw vector geometries from uploaded DXF files, evaluate topological rules, compute geographic bounding boxes/areas, and persist them in a structured table called `geometry_entities`.

### 🚫 Explicit Scope Boundaries
To maintain absolute compliance, the following items are **STRICTLY EXCLUDED** from Sprint 3C:
* **No Plot/Road/Amenity Row Generation**: No inventory record inserts (`plots`, `layouts` update status, land sectors block allocations) are performed during parsing.
* **No SVG/GIS Layout Generation**: Absolutely no rendering of coordinates to SVGs, canvas viewports, or JSON charts is permitted.
* **No Map Integrations**: There is no map rendering, GIS layers, or Google Maps Platform integration at this stage.

---

## 2. Database Schema: `geometry_entities`

A dedicated relational table is introduced to persist the raw structural metadata of the extracted vectors. This table establishes an internal reference scheme pointing to the active import job trace.

### A. SQL Schema Definition
```sql
CREATE TABLE IF NOT EXISTS geometry_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
    layer_name VARCHAR(150) NOT NULL,
    geometry_type VARCHAR(50) NOT NULL, -- 'LINE', 'POLYLINE', 'LWPOLYLINE'
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    vertex_count INTEGER NOT NULL DEFAULT 0,
    vertex_points JSONB NOT NULL, -- Array of coordinate tuples: [[x1, y1], [x2, y2], ...]
    area_value DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    bounding_box JSONB NOT NULL, -- Min/Max envelope bounding container: { minX, minY, maxX, maxY }
    validation_status VARCHAR(50) NOT NULL DEFAULT 'VALID', -- 'VALID', 'WARNING_OPEN', 'ERROR_SELF_INTERSECTING', 'ERROR_TINY_AREA', 'ERROR_DUPLICATE'
    validation_messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimization & Isolation Indexes
CREATE INDEX IF NOT EXISTS idx_geometry_entities_job ON geometry_entities(import_job_id);
CREATE INDEX IF NOT EXISTS idx_geometry_entities_layer ON geometry_entities(layer_name);
```

---

## 3. Extraction Algorithms & Mathematics

The extraction system translates DXF ASCII data groups into discrete mathematical arrays.

### A. Polyline Discovery & Vertex Accumulation
DXF files outline drawing coordinate sequences inside sections:
* **`LINE` (Group Code 10, 11, 20, 21, 30, 31)**: Formed by joining start coordinates ($X_s, Y_s$) to end coordinates ($X_e, Y_e$). Vertex count is fixed at $2$.
* **`LWPOLYLINE` / `POLYLINE`**: Initiated by Group Code `0` header. The software sweeps internal group tags sequentially:
  * **Group `90`**: Defines the total Vertices count.
  * **Group `70`**: Bitmask flag where a value of `1` (or bit wise operation mask `& 1`) explicitly instructs that the Polyline is **closed** (automatically joining the termination vertex to the source origin).
  * **Group `10` ($X$) & `20` ($Y$)**: Successive coordinates are compiled directly into a point index array.

### B. Closed Polygon Detection
A shape is flagged as `is_closed = TRUE` if:
1. The DXF group bitmask flag `70` is set to `1`.
2. OR, the euclidean distance between the first vertex $P_0(X_0, Y_0)$ and final vertex $P_n(X_n, Y_n)$ is less than a tolerance margin:
   $$\text{Distance} = \sqrt{(X_n - X_0)^2 + (Y_n - Y_0)^2} \le 10^{-6}$$

### C. Bounding Box Calculation
The bounding box represents the axial-aligned bounding box (AABB) of the geometric element:
$$\text{BoundingEnvelope} = \{ X_{\min}, Y_{\min}, X_{\max}, Y_{\max} \}$$
Where:
* $X_{\min} = \min(X_0, X_1, \ldots, X_n)$
* $Y_{\min} = \min(Y_0, Y_1, \ldots, Y_n)$
* $X_{\max} = \max(X_0, X_1, \ldots, X_n)$
* $Y_{\max} = \max(Y_0, Y_1, \ldots, Y_n)$

### D. Area Calculation (Shoelace Formula)
For closed polylines, area is computed utilizing the Shoelace (Gauss's Area) formula:
$$\text{Area} = \frac{1}{2} \left| \sum_{i=0}^{n-1} (X_i Y_{i+1} - X_{i+1} Y_i) \right|$$
*(Note: If the index wraps around to close the polygon, $P_n = P_0$ is evaluated).*

---

## 4. Geometry Validation Rules

Each parsed geometry entity undergoes standard structural verification routines prior to database storage:

1. **Self-Intersecting Boundary Check**:
   * Evaluates lines bounding segments. For all segments $(P_i, P_{i+1})$ and $(P_j, P_{j+1})$, we execute orientation and intersection checks:
     $$\text{Orientation}(A, B, C) = (B_y - A_y)(C_x - B_x) - (B_x - A_x)(C_y - B_y)$$
   * If orientation shifts denote vertex overlaps inside a non-consecutive edge index, the status is flagged: `ERROR_SELF_INTERSECTING`.
2. **Duplicate Geometry Check**:
   * Evaluates if any existing entity inside the active job shares identical vertex bounds (within coordinate tolerance offsets), marking duplicates as: `ERROR_DUPLICATE`.
3. **Invalid/Open Polygons**:
   * If a layer is mapped to `PLOT` but is not closed geometrically, it triggers a warning status: `WARNING_OPEN`.
4. **Tiny Polygons**:
   * If the computed area is smaller than a customizable threshold (e.g., $1.0\text{ m}^2$), it is logged as: `ERROR_TINY_AREA`.
5. **Unsupported Geometry**:
   * Geometries that contain circular arcs or complex ellipses (splines) that cannot be accurately reduced to Cartesian polylines are set to: `ERROR_UNSUPPORTED`.

---

## 5. Queue Processing & Asynchronous Architecture

To handle drawing imports without blocking the client thread, extraction runs cleanly as a background Laravel queue job.

```
       [ DXF File Uploaded ] 
                 │
                 ▼
       ( Laravel Queue Trigger )
                 │
                 ├──────────────────────────────┐
                 ▼                              ▼
      [ Step A: Parser Service ]      [ Step B: Audit Logs ]
    - Reads line-by-line streaming    - Logs extraction initialization
    - Compiles vertex lists           - Progress status = 'processing'
                 │
                 ▼
     [ Step C: Engine Execution ]
    - Evaluates closed status
    - Computes area (Shoelace)
    - Generates AABB bounds
                 │
                 ▼
     [ Step D: Validation Check ]
    - Self-intersection checks
    - Duplicate entity filter
                 │
                 ├──────────────────────────────┐
                 ▼                              ▼
    [ Step E: Persistent Write ]      [ Step F: Audit Logs ]
    - Inserts geometry_entities       - Records final stats
    - Commits PostgreSQL txn          - Job status = 'completed'
```

---

## 6. Audit Logging Scheme

Throughout parsing execution, sequential event tracking logs are written to the `import_job_logs` table:

* **Extraction Started**:
  * Log Entry: `Step 8 — Geometry Extraction Initiated`
  * Message: `'Triggering asynchronous Cartesian vector extraction on file: {file_name}. Checking LINE and POLYLINE components.'`
* **Extraction Completed**:
  * Log Entry: `Step 9 — Geometry Extraction Finalized`
  * Message: `'Extracted {total_vectors} vectors: {count_valid} validated successfully, {count_skipped} skipped/unsupported.'`
* **Extraction Failed**:
  * Log Entry: `Step 9 — Geometry Extraction Aborted`
  * Message: `'Parsing aborted. Invalid DXF matrix or coordinate overflow encountered at line {line_number_index}: {error_message}'`

---
*Report successfully published. Ready for implementation guidelines.*
