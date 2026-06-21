# Sprint 3C — Geometry Extraction Engine Final Technical Specification

This document presents the finalized, production-ready architectural and schema specification for the **Geometry Extraction Engine** (Sprint 3C), incorporating advanced validation hashing, unit normalization tracking, and legacy CAD entity diagnostics.

---

## 1. Architectural Objective & Strict Boundaries

The objective of Sprint 3C is to scan raw vector coordinates from uploaded DXF files, map them against designated layer mappings, evaluate structural topology validations, compute geometric outputs (bounding boxes, areas, and segment lengths), and store them in the `geometry_entities` database table.

### 🚫 Complete Scope Boundaries
Consistent with previous sprints, the following elements are **STRICTLY EXCLUDED** from the scope of Sprint 3C:
* **No Real Estate Inventory Entries**: No real `plots`, public/private roads, or green open-space amenities are created in the inventories. No database updates are applied to active project layout dimensions.
* **No SVG/GIS Layout Compilation**: Absolutely no dynamic vector generation, styling canvases, or inline drawing serialization is performed.
* **No Interactive Visualizer Viewers**: No UI maps, drawing dashboards, or Google Maps Platform integrations are added.

---

## 2. Relational Database Schema: `geometry_entities`

A dedicated, tenant-isolated relational table is designed to capture and index every parsed geometry entity. It maps directly to active layer designations and supports fast overlap verification via cryptographic content hashing.

### A. SQL Schema Definition
```sql
CREATE TABLE IF NOT EXISTS geometry_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
    source_layer_mapping_id UUID NOT NULL REFERENCES dxf_layer_mappings(id) ON DELETE RESTRICT,
    layer_name VARCHAR(150) NOT NULL,
    geometry_type VARCHAR(50) NOT NULL, -- e.g. 'LINE', 'POLYLINE', 'LWPOLYLINE'
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    vertex_count INTEGER NOT NULL DEFAULT 0,
    
    -- Coordinate Storage
    vertices_json JSONB NOT NULL, -- Array of coordinate pairs: [[x1, y1], [x2, y2], ...]
    
    -- Mathematical Metrics
    area_value DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    bounding_box JSONB NOT NULL, -- { "minX": d, "minY": d, "maxX": d, "maxY": d }
    
    -- Unit Normalization Data
    source_unit VARCHAR(50) NOT NULL DEFAULT 'METERS', -- Drawing native units (METERS, FEET, INCHES)
    normalized_unit VARCHAR(50) NOT NULL DEFAULT 'METERS', -- Database target unit
    
    -- Validation and Deduplication Hashing
    geometry_hash VARCHAR(64) NOT NULL, -- SHA-256 fingerprint of the vertex layout sequence
    validation_status VARCHAR(50) NOT NULL DEFAULT 'VALID', -- 'VALID', 'WARNING_OPEN', 'ERROR_SELF_INTERSECTING'
    validation_messages JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimization & Isolation Indexes
CREATE INDEX IF NOT EXISTS idx_geometry_entities_job ON geometry_entities(import_job_id);
CREATE INDEX IF NOT EXISTS idx_geometry_entities_mapping ON geometry_entities(source_layer_mapping_id);
CREATE INDEX IF NOT EXISTS idx_geometry_entities_hash ON geometry_entities(geometry_hash);
CREATE INDEX IF NOT EXISTS idx_geometry_entities_layer ON geometry_entities(layer_name);
```

---

## 3. Extraction Algorithms & Mathematics

The parsing pipeline handles sequential Group Code evaluations to populate the model layout structure:

### A. Vertex Data Mapping
Coordinates are pulled during the entity scan sequence:
* **`LINE`** (Vertices = $2$): Extracted from Group Codes `10`, `20` (Start Coordinate X, Y) and `11`, `21` (End Coordinate X, Y).
* **`LWPOLYLINE` / `POLYLINE`**: Accumulates multiple sequence positions across Group Code `10` (X value) and `20` (Y value) until a termination tag is hit.

### B. Geometry Deduplication Hashing (`geometry_hash`)
To prevent duplicate coordinate shapes from creating duplicate parsing entries, we generate a deterministic SHA-256 string for the vertices:
1. Sort the vertex points sequence from the lowest coordinates up (`x` ascending, then `y` ascending) to ignore line drawing direction variations.
2. Stringify the coordinates: `"[(x1,y1),(x2,y2),...]"` utilizing a standard precision multiplier (e.g., rounded to 4 decimal places).
3. Compute SHA-256 over this string.
4. Flag matches in the batch as `ERROR_DUPLICATE` if the `geometry_hash` exists inside the active `import_job_id` context.

### C. Unit Tracking & Scaling
* **`source_unit`**: Collected from CAD `$MEASUREMENT` or `$INSUNITS` metadata.
* **`normalized_unit`**: Standardized to `METERS` by default.
* Scale Multiplier application:
  $$X_{\text{norm}} = X_{\text{raw}} \times \text{Factor}, \quad Y_{\text{norm}} = Y_{\text{raw}} \times \text{Factor}$$

---

## 4. Unsupported Entity Diagnostics Tracking

Standard CAD files frequently contain rich notation, block assemblies, and curvature models that are unsupported for raw polygon extrusion (zoning parcels mapping). The extraction pipeline does not crash on these; instead, it processes them via a **Diagnostics Module** to alert engineering teams of drawing density:

| DXF Entity Type | Diagnostic Action | Logging & Storage Outcome |
| :--- | :--- | :--- |
| **`CIRCLE`** | Tracks occurrence count, coordinates, and calculated radii. | Skipped as physical parcel; logged in job metadata stats. |
| **`ARC`** | Captures center, start angle, end angle, and radius. | Path-skipped; recorded in parser telemetry warnings. |
| **`SPLINE`** | Notes fit control points array and degree characteristics. | Flagged as complex curves; logged to database step tags. |
| **`INSERT`** | Identifies external block reference point allocations. | Block skipped; count incremented to verify blueprint references. |
| **`TEXT`** | Records string value, placement point, and text layers. | Stashed in transient annotations array; excluded from geometries. |
| **`MTEXT`** | Parses multi-line annotations, content strings, and sizes. | Stashed in transient annotations array; excluded from geometries. |

### Diagnostic Verification Output Format
When extraction concludes, an unsupported entity summary is tracked in the database:
```json
{
  "unsupported_counts": {
    "CIRCLE": 14,
    "ARC": 32,
    "SPLINE": 3,
    "INSERT": 45,
    "TEXT": 128,
    "MTEXT": 54
  },
  "warnings": [
    "Detected 35 curves (ARC/SPLINE) on utility layers. Curves were approximated as bounding zones or ignored for parcel boundaries."
  ]
}
```

---

## 5. Algorithmic Validation Steps

Every geometry record goes through four cascading validation states:
1. **Deduplication Check**: If `geometry_hash` conflicts with a previously stored node inside the current import run $\rightarrow$ State: `ERROR_DUPLICATE`.
2. **Self-Intersection Check**: Checks segment vectors for intersecting vectors $\rightarrow$ State: `ERROR_SELF_INTERSECTING`.
3. **Closure Check**: If the layer is mapped to `PLOT` or `BOUNDARY`, verify that the path is fully closed $\rightarrow$ State: `WARNING_OPEN`.
4. **Dimension Check**: If the calculated closed area using the Shoelace formula is less than target bounds $\rightarrow$ State: `ERROR_TINY_AREA`.

---

## 6. Audit Logging Flow

Database steps write transactional histories to `import_job_logs`:

* **Log Step A — Ingress Verification**:
  * Action: `Step 8 — Extraction Context Initialized`
  * Payload: `'Validating layer mappings for job {id}. Found {count} layers active.'`
* **Log Step B — Structural Extraction**:
  * Action: `Step 9_1 — Sequential Line Sweep`
  * Payload: `'Processed vector lines. Found {valid_polylines} valid LINE/LWPOLYLINE elements. Recorded {diagnostic_circles} circles and {diagnostic_text} text annotations as legacy diagnostics.'`
* **Log Step C — Finalization**:
  * Action: `Step 9_2 — Geometry Extraction Finalized`
  * Payload: `'Cartesian normalization finished. Saved {count} rows in geometry_entities table. Normalized unit: {normalized_unit}. {duplicates_count} duplicates skipped.'`

---
*Report successfully published. Ready for implementation.*
