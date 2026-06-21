# Sprint 3E — SVG Generation Engine Final Technical Specification

This final specification defines the updated, comprehensive architecture of the **AutoCAD Plot SVG Compilation Engine** (Sprint 3E). Key upgrades include centralized stylesheet profiles, expanded SVG vector elements indexing, automated plot label centroid mapping, and multi-viewport responsive render profiles.

---

## 1. Objectives & Architectural Limits

The objective of Sprint 3E is compiling raw Cartesian drawing coordinates (`geometry_entities`) into standardized, responsive, and versioned SVG files stored natively in the relational database.

### 🚫 Core Scope Guardrails (Anti-AI-Slop & Scope Constraints)
* **No UI Rendering / Canvas**: The engine strictly stores vectorized structures to the database without injecting HTML frames, frontend canvas overlays, or preview components in the UI yet.
* **No Maps or Navigation Frameworks**: Under no circumstances shall Leaflet, Mapbox, Google Maps, Openlayers, or client-side zoom/pan controls be imported or configured.
* **Transactional Reliability only**: Complete focus on clean database tables mapping, version isolation, and deterministic mathematical projection conversions.

---

## 2. Updated Relational Database Schema Model

The compiled SVG ecosystem is divided across four key relational tables mapping parents to multi-viewport elements:

```
                      [ layouts ]
                           │
                           ▼
                    [ svg_documents ] ◄────► [ svg_style_profiles ]
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   [ svg_elements ]  [ svg_labels ]    [ import_job_logs ] (Audit Trace)
```

### A. SVG Documents Table (`svg_documents`)
Holds top-level resolution parameters mapping layout version variations:
* **`id`** (`UUID`, PK): Unique document identifier.
* **`tenant_id`** (`UUID`, FK): Scoped under active validated standard tenant.
* **`layout_id`** (`UUID`, FK): Pointing back to compiled layout properties.
* **`generation_batch_id`** (`UUID`, FK): Matches parent job runs.
* **`width`** (`DECIMAL`): Pixels width representing native view size.
* **`height`** (`DECIMAL`): Pixels height representing native view size.
* **`viewbox`** (`VARCHAR(100)`): Normalised bounds representing scale bounds (e.g., `'0 0 1200 800'`).
* **`version`** (`INT`): Incrementing version digits supporting multiple iterations.
* **`render_profile`** (`VARCHAR(50)`): Viewport targeted standard layout resolution bounds:
  - `DESKTOP`: Coordinates mapped to fit `1200 x 800`.
  - `TABLET`: Coordinates mapped to fit `800 x 600`.
  - `MOBILE`: Coordinates mapped to fit `450 x 650`.

---

### B. SVG Elements Table (`svg_elements`)
Stores individual projected vectorized nodes with clear traceability links:
* **`id`** (`UUID`, PK)
* **`svg_document_id`** (`UUID`, FK): Parent document.
* **`source_geometry_entity_id`** (`UUID`, FK, Nullable): Connects back to the raw CAD parser coordinates.
* **`element_type`** (`VARCHAR(50)`): Standard type mapping:
  - `PATH`: Vector curve and sequence nodes.
  - `POLYGON`: Closed parcel shapes.
  - `POLYLINE`: Unclosed segment path coordinates.
  - `TEXT`: Embedded alphanumeric strings.
  - `GROUP`: Visual set elements.
* **`svg_data`** (`TEXT`): Direct, fully-parsed, ready-to-render XML vector string snippet (ex. `<polygon points="..." fill="..." />`).
* **`metadata`** (`JSONB`): Diagnostics parameters containing CAD layers tags, original area values, and boundary envelopes.

---

### C. Centrallised Styles Table (`svg_style_profiles`)
Acts as a centralized styling ledger representing brand palettes:
* **`id`** (`UUID`, PK)
* **`tenant_id`** (`UUID`, FK)
* **`profile_key`** (`VARCHAR`): Unique identifier mapped across elements classes:
  - `PLOT_AVAILABLE`: Soft slate clean layout fill colors.
  - `PLOT_RESERVED`: Muted warm amber reservation states.
  - `PLOT_BOOKED`: Royal blue structural status fills.
  - `PLOT_SOLD`: Safe green emerald completed bounds.
  - `ROAD_MAIN`: Large asphalt grey lines representing corridors.
  - `ROAD_INTERNAL`: Light grey streets paths.
  - `PARK`: Green parkland landscape.
  - `AMENITY`: Muted violet collective recreation spaces area.
* **`fill_color`** (`VARCHAR(50)`)
* **`stroke_color`** (`VARCHAR(50)`)
* **`stroke_width`** (`DECIMAL(8,2)`)
* **`opacity`** (`DECIMAL(4,2)`)
* **`additional_styles`** (`JSONB`)

---

### D. Plot Labels Table (`svg_labels`)
Stores text placements calculated via mathematical element centroids:
* **`id`** (`UUID`, PK)
* **`svg_document_id`** (`UUID`, FK): Backing viewport coordinate bounds document.
* **`source_plot_id`** (`UUID`, FK, Nullable): Points to corresponding inventory plots.
* **`text`** (`VARCHAR`): Standard label text (e.g., `'PLOT-104'`).
* **`x`** (`DECIMAL(12,4)`): Mapped viewport center coordinate `x`.
* **`y`** (`DECIMAL(12,4)`): Mapped viewport center coordinate `y`.
* **`rotation`** (`DECIMAL`): Rotation angle degrees.

---

## 3. High-Precision Math Projection & Centroid Metrics

### A. Viewport Scale & Offset Calculations
To center and map raw CAD coordinates $(X, Y)$ ranging from state plane grids to small vectors cleanly inside the viewport size:
1. **Raw Envelopes calculation**:
   $$W_{raw} = \max X - \min X$$
   $$H_{raw} = \max Y - \min Y$$
2. **Apply scaling factor $S$ (using a standard 5% boundary padding)**:
   $$W_{avail} = W_{viewport} \times 0.95, \quad H_{avail} = H_{viewport} \times 0.95$$
   $$S = \min\left(\frac{W_{avail}}{W_{raw}}, \frac{H_{avail}}{H_{raw}}\right)$$
3. **Compute alignment offsets**:
   $$O_x = \frac{W_{viewport} - (W_{raw} \times S)}{2}$$
   $$O_y = \frac{H_{viewport} - (H_{raw} \times S)}{2}$$
4. **Project with inverted dynamic Y-axis**:
   $$X_{svg} = (X - \min X) \times S + O_x$$
   $$Y_{svg} = (\max Y - Y) \times S + O_y$$

### B. Label Centroid Projection
For polygon labels, we compute the centroid coordinate $(\bar{x}_{svg}, \bar{y}_{svg})$ over the $N$ projected vertices of the closed loop:
$$\bar{x}_{svg} = \frac{1}{N}\sum_{i=1}^{N} x_i, \quad \bar{y}_{svg} = \frac{1}{N}\sum_{i=1}^{N} y_i$$
This is stored directly in the `svg_labels` table to keep text aligned to the polygon center.

---

## 4. Operational Pipeline Logs Logging Rules

All steps during execution are appended to the `import_job_logs` tracking list:
1. **`SVG_GENERATION_STARTED`**: `'Initiating CAD vector to SVG compilation run for Layout {id} [Profile: {profile}]'`
2. **`SVG_GENERATION_LAYERS_COMPREHENSION`**: `'Successfully defined SVG Document v{nextVersion} for batch {batchId}. Generated standard elements.'`
3. **`SVG_GENERATION_PATHS_COMMITTED`**: `'Successfully compiled and committed {elementCount} geometric shapes and {labelCount} plot label coordinates.'`
4. **`SVG_GENERATION_COMPLETED`**: `'SVG vector documentation compiled successfully. Mapped geometries stashed inside document ID {docId}.'`
5. **`SVG_GENERATION_FAILED`**: `'SVG generation aborted. Error details: {errorMessage}. All database operations rolled back.'`

---
*End of final spec. Proceeding to audit report execution certification.*
