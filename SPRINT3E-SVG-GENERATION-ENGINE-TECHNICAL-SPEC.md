# Sprint 3E — SVG Generation Engine Technical Specification

This document presents the detailed architectural, schema, and conversion specifications for the **SVG Generation Engine** (Sprint 3E). It defines the database schemas, mathematical normalization algorithms, and system audit trail for converting raw vector coordinate sets (`geometry_entities`) into standardized, scale-independent, versioned SVG assets.

---

## 1. Architectural Objectives & Constraints

The primary objective of Sprint 3E is to establish a non-visual, server-side geometry compilation pipeline. It translates raw double-precision Cartesian vertices into standard W3C-compliant SVG markup stored directory in the database for downstream use.

### 🚫 Strict Boundary Reinforcement (Scope Limitations)
* **No UI Rendering**: The system is strictly forbidden from outputting HTML elements, React canvases, or inline visual visualizers in this phase.
* **No Client Interactivity Controls**: Complete exclusion of zoom, pan, map layers, clicking behaviors, or visual feedback.
* **No External GIS Engine Links**: No integration with Leaflet, Mapbox, Google Maps, Openlayers, or other mapping packages.
* **Engine Only**: The task is limited to background database storage and representation models.

---

## 2. Relational Database Schema Layout

To store, bundle, and track these compiled representations, three new relational database tables are introduced under full tenant isolation constraints.

```
  [ Layout / Job ] ────► [ svg_documents ] (Multiple Versions permitted)
                                 │
                                 ├───► [ svg_layers ] (PLOTS, ROADS, etc.)
                                 │            │
                                 │            └───► [ svg_paths ]
                                 ▼
                         (Back-traces to coordinate rows)
```

### A. SVG Documents Table (`svg_documents`)
Tracks parent vector documents grouped per layout version block:
* **`id`** (`UUID`, PK): Unique document identifier.
* **`tenant_id`** (`UUID`, FK): Establishes logical tenant scope limits.
* **`layout_id`** (`UUID`, FK): References standard `layouts(id)`.
* **`generation_batch_id`** (`UUID`, FK): Identifies the parent `generation_batches(id)` pipeline run.
* **`width`** (`DECIMAL(12, 4)`): Output document pixel envelope width context.
* **`height`** (`DECIMAL(12, 4)`): Output document pixel envelope height context.
* **`viewbox`** (`VARCHAR(100)`): Represents the standard view bounding box string (e.g. `'0 0 1200 800'`).
* **`version`** (`INTEGER`): Sequential identifier numbers supporting multiple SVG revision variations over time per layout (e.g. `1`, `2`, `3`).

```sql
CREATE TABLE IF NOT EXISTS svg_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    layout_id UUID NOT NULL REFERENCES layouts(id) ON DELETE CASCADE,
    generation_batch_id UUID NOT NULL REFERENCES generation_batches(id) ON DELETE CASCADE,
    width DECIMAL(12, 4) NOT NULL DEFAULT 1000.0000,
    height DECIMAL(12, 4) NOT NULL DEFAULT 1000.0000,
    viewbox VARCHAR(100) NOT NULL DEFAULT '0 0 1000 1000',
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_svg_documents_layout ON svg_documents(layout_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_svg_documents_version ON svg_documents(layout_id, version);
```

### B. SVG Layers Table (`svg_layers`)
Splits the vector geometries into administrative drawing layers:
* **`id`** (`UUID`, PK)
* **`svg_document_id`** (`UUID`, FK): Link to the parent SVG document.
* **`layer_name`** (`VARCHAR(50)`): Standard types support:
  - `PLOTS`: Property parcellation polygons.
  - `ROADS`: Physical paths and streets corridors.
  - `AMENITIES`: Collective gardens and public spaces.
  - `BOUNDARIES`: Subdivision outline and limits bounds.
  - `UTILITIES`: Infrastructure grids, transformers, and pipes notes.

```sql
CREATE TABLE IF NOT EXISTS svg_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    svg_document_id UUID NOT NULL REFERENCES svg_documents(id) ON DELETE CASCADE,
    layer_name VARCHAR(50) NOT NULL, -- PLOTS, ROADS, AMENITIES, BOUNDARIES, UTILITIES
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_svg_layers_document ON svg_layers(svg_document_id);
```

### C. SVG Paths Table (`svg_paths`)
Captures actual individual geometry elements mapped back to source geometries:
* **`id`** (`UUID`, PK)
* **`svg_layer_id`** (`UUID`, FK): Links path to the containing layer.
* **`source_geometry_entity_id`** (`UUID`, FK, Nullable): Points to raw `geometry_entities(id)` coordinates for direct trace queries.
* **`svg_path_data`** (`TEXT`): Standard XML `d` attribute sequence (e.g., `'M 10 20 L 30 40 Z'`).
* **`layer_type`** (`VARCHAR(50)`): Repeating classification context of the element.
* **`style_metadata`** (`JSONB`): Configuration properties detailing strokes, color patterns, and line dimensions.

```sql
CREATE TABLE IF NOT EXISTS svg_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    svg_layer_id UUID NOT NULL REFERENCES svg_layers(id) ON DELETE CASCADE,
    source_geometry_entity_id UUID REFERENCES geometry_entities(id) ON DELETE SET NULL,
    svg_path_data TEXT NOT NULL,
    layer_type VARCHAR(50) NOT NULL,
    style_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_svg_paths_layer ON svg_paths(svg_layer_id);
CREATE INDEX IF NOT EXISTS idx_svg_paths_geometry ON svg_paths(source_geometry_entity_id);
```

---

## 3. High-Precision Coordinate Normalization Rules

CAD drawing files often use massive grid values (UTM, State Plane) or negative vectors. The converter normalizes all vertices to fit perfectly within a clean, positive viewport space (e.g. `1000` x `1000`) without losing physical scale relationships.

```
Raw Coordinates: [ minX, minY, maxX, maxY ]
                   │
                   ▼
  Scale Delta: dy = maxY - minY, dx = maxX - minX
  Scale Constant: s = target_viewport / max(dx, dy)
                   │
                   ▼
Normalized Coord: X' = (X - minX) * s,  Y' = (maxY - Y) * s  (Flip Y for Screen Space)
```

1. **Calculate Bounding Matrix**: Find global coordinates limits across all geometry nodes in the set: `minX, minY, maxX, maxY`.
2. **Derive Scale Factors**: Calculate width/height range spans of the raw layout bounds. Divide the target viewport resolution (e.g., `1000`) by the largest range factor to secure a uniform scale ratio `S`.
3. **Cartesian-to-SVG Projection**: To convert any node $(X, Y)$ into normalized screen position $(X_{svg}, Y_{svg})$:
   $$X_{svg} = (X - \min X) \times S$$
   $$Y_{svg} = (\max Y - Y) \times S$$
   *(Reversing the Y axis converts AutoCAD standard Cartesian space to SVG screen space where the point $(0,0)$ rests at the top-left corner).*
4. **Compile Path String**: Formulate coordinate nodes sequences into an optimized `d` path string:
   * First node: `M {x_0} {y_0}`
   * Subsequent nodes: `L {x_i} {y_i}`
   * Close loop (if closed polygon): `Z`

---

## 4. Operational Pipeline Logic

The compilation workflow coordinates calculations inside strict database transaction loops:

```
[ POST /api/v1/dxf/jobs/{id}/compile-svg ]
                  │
                  ▼
         [ Lock Job Record ]
                  │
                  ▼
     [ Compute Overall Bounds ]
                  │
                  ▼
   [ Create Versioned svg_documents ]
                  │
                  ▼
        [ Bulk Map Layers ]
  (PLOTS, ROADS, AMENITIES, BOUNDARIES)
                  │
                  ▼
       [ Bulk Convert Paths ]
   (Format data strings inside loop)
                  │
                  ▼
        [ Commit Transaction ]
```

---

## 5. Audit Logging Specifications

Throughout compile procedures, progress traces are written directly to `import_job_logs`:

### A. Start Pipeline Logging
* **Step Name**: `SVG_GENERATION_STARTED`
* **Message**: `'Initiating CAD vector to SVG conversion pipeline. Scanning geometry nodes, establishing viewports, and generating next document version.'`

### B. Progression Logging
* **Step Name**: `SVG_GENERATION_LAYERS_COMPREHENSION`
* **Message**: `'Successfully generated standard SVG Document version {v} (ViewBox: {viewbox}). Created {layers_count} administrative layers.'`
* **Step Name**: `SVG_GENERATION_PATHS_COMMITTED`
* **Message**: `'Compiled and committed {paths_count} normalized geometry paths with full trace attributes.'`

### C. Success Transition Logging
* **Step Name**: `SVG_GENERATION_COMPLETED`
* **Message**: `'SVG vector documentation compiled successfully. Mapped geometries packed and frozen inside document ID {doc_id} with full trace integrity.'`

### D. Disaster Interception Logging
* **Step Name**: `SVG_GENERATION_FAILED`
* **Message**: `'SVG pipeline compilation aborted. Found duplicate IDs, non-numeric vertices arrays, or zero layouts area values. Database records rolled back safely.'`

---
*Specification completed. Ready for review and subsequent development steps.*
