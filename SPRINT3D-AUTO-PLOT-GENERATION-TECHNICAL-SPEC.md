# Sprint 3D — Auto Plot Generation Technical Specification

This document presents the detailed architectural, schema, and operational specifications for the **Auto Plot Generation Engine** (Sprint 3D). It converts parsed Cartesian vectors and closed polygons from `geometry_entities` into standard, transactable land inventory models.

---

## 1. Architectural Objective & System Flow

The primary objective of Sprint 3D is to map validated physical shapes into real-world asset items (`plots`, `roads`, `amenities`) linked to a Project's Subdivision Layout. This process operates under a **two-phase review and explicit approval workflow** to safeguard transaction records from structural anomalies.

### 🚫 Complete Scope Boundaries
To ensure strict compliance with project mandates, the following are **STRICTLY EXCLUDED** from Sprint 3D:
* **No SVG/Vector Visualizers**: Absolute exclusion of asset contour tracing, canvas previews, or line drawings.
* **No Map Views or GIS Dashboards**: No integration with Google Maps Platform, satellite views, or spatial maps interfaces.
* **No Marketplace / Consumer Actions**: No listings creation, buyer booking queues, or cart integrations.

---

## 2. Review Stage & Dual-Gate Approval Workflow

No inventory records may be generated automatically during the initial parsing stream. The engine enforces a **pre-flight review stage** requiring explicit administrative confirmation.

```
       [ DXF Geometry Extracted ]
                   │
                   ▼
       [ High-Fidelity Review ]  ◄──── UI Query GET /api/v1/dxf/jobs/{id}/review
    ┌──────────────────────────────┐
    │  - Total Geometry Count     │
    │  - Plot Candidates Count     │
    │  - Road Candidates Count     │
    │  - Amenity Candidates Count  │
    │  - Topological Alerts/Errors │
    └──────────────┬───────────────┘
                   │
                   ▼
         [ User Action: APPROVE ] ◄─── REST Dispatch POST /api/v1/dxf/jobs/{id}/dispatch
                   │
                   ▼
     [ Transactional Generation ]
    ┌──────────────────────────────┐
    │  - Filter Out Invalid shapes │
    │  - Auto-Number Plots         │
    │  - Write Inventory Records   │
    └──────────────────────────────┘
```

### A. Pre-flight Review Endpoint (`GET /api/v1/dxf/jobs/{id}/review`)
Returns calculated metrics and integrity warnings before writing records:
```json
{
  "import_job_id": "a4b6c8d0-1234-5678-abcd-ef1234567890",
  "total_geometries_found": 165,
  "candidates": {
    "PLOT": {
      "count": 142,
      "estimated_area_sqm": 28400.00
    },
    "ROAD": {
      "count": 15,
      "estimated_area_sqm": 4500.00
    },
    "AMENITY": {
      "count": 8,
      "estimated_area_sqm": 3200.00
    }
  },
  "validation_metrics": {
    "valid_count": 158,
    "warnings_count": 4,
    "errors_count": 3
  },
  "warnings": [
    {
      "entity_id": "c7b6d1e4-f3a2-4c91-b384-ad01e912f200",
      "layer_name": "PLOT_BOUNDARY",
      "status": "WARNING_OPEN",
      "message": "Parcel geometry has an open boundary. It will be rejected during automatic conversion."
    }
  ]
}
```

---

## 3. Persistent Database Schema Layout

To store the generated objects alongside existing `plots` records, two new inventory tables are introduced.

### A. Roads Table Schema (`roads`)
Handles physical roads mapped from the civil layouts.
```sql
CREATE TABLE IF NOT EXISTS roads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID NOT NULL REFERENCES layouts(id) ON DELETE CASCADE,
    source_geometry_id UUID NULL REFERENCES geometry_entities(id) ON DELETE SET NULL,
    road_name VARCHAR(100) NOT NULL, -- e.g. 'ROAD-01', '30FT WEST ROAD'
    width DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Deduced from geometric bounds
    length DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Computed segment distance
    area_value DECIMAL(12, 4) NOT NULL DEFAULT 0.00,
    measurement_unit_id UUID NOT NULL REFERENCES measurement_units(id) ON DELETE RESTRICT,
    bounding_box JSONB NOT NULL, -- Core axial aligned boundary box
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roads_layout ON roads(layout_id);
```

### B. Amenities Table Schema (`amenities`)
Stores communal utility items (gardens, power grid pockets, compound hubs).
```sql
CREATE TABLE IF NOT EXISTS amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID NOT NULL REFERENCES layouts(id) ON DELETE CASCADE,
    source_geometry_id UUID NULL REFERENCES geometry_entities(id) ON DELETE SET NULL,
    amenity_name VARCHAR(100) NOT NULL, -- e.g. 'PARK-01', 'UTILITY GROUND'
    amenity_type VARCHAR(50) NOT NULL DEFAULT 'PARK', -- PARK, INFRASTRUCTURE, GREEN_BELT
    area_value DECIMAL(12, 4) NOT NULL DEFAULT 0.00,
    measurement_unit_id UUID NOT NULL REFERENCES measurement_units(id) ON DELETE RESTRICT,
    bounding_box JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_amenities_layout ON amenities(layout_id);
```

---

## 4. Automatic Asset Generation Logic

When the client triggers the dispatch endpoint (`POST /api/v1/dxf/jobs/{id}/dispatch`), the engine processes the queue sequentially inside a database transaction block:

### A. Geometries Strict Rejections Filter
Shapes matching the following parameters are discarded during output loop processing:
* `validation_status` !== `'VALID'`.
* Flagged with `ERROR_SELF_INTERSECTING`, `ERROR_TINY_AREA`, `ERROR_DUPLICATE`, or `WARNING_OPEN`.

### B. Plot Item Construction (`PLOT` Layer Classifications)
1. **`plot_number`**: Dynamic code generation based on sequentially counting index formats per layout level:
   $$\text{PlotCode} = \text{"PLOT-"} \times \text{padLeft(sequenceNumber, 3)}$$
2. **`area_value`**: Translated directly from `geometry_entities.area_value`.
3. **`measurement_unit_id`**: Associated directly using the mapping of `normalized_unit` (referencing standard `measurement_units` UUIDs).
4. **`dimensions` Calculation**: Computed from bounding box envelope ranges:
   $$\text{Width} = (\text{maxX} - \text{minX}), \quad \text{Length} = (\text{maxY} - \text{minY})$$
   $$\text{DimensionString} = \text{round(Width)} \times \text{" x "} \times \text{round(Length)}$$
5. **`dimensions_metadata` & `bounding_box`**: Scaled coordinate bounds stashed securely inside JSON:
   ```json
   {
     "bounding_box": {
       "minX": 120.0,
       "minY": 80.0,
       "maxX": 145.0,
       "maxY": 100.0
     },
     "vertices": [[120.0, 80.0], [145.0, 80.0], [145.0, 100.0], [120.0, 100.0], [120.0, 80.0]]
   }
   ```

### C. Road Record Construction (`ROAD` Layer Classifications)
1. **`road_name`**: Sequence code prefixed by road indexes: `ROAD-001`, `ROAD-002`, etc.
2. **`width`**: Deduced as the minor bounds of the calculated bounding box dimensions:
   $$\text{Width} = \min(\text{maxX} - \text{minX}, \text{maxY} - \text{minY})$$
3. **`length`**: Deduced as the major bounds of the computed envelope:
   $$\text{Length} = \max(\text{maxX} - \text{minX}, \text{maxY} - \text{minY})$$

### D. Amenity Record Construction (`AMENITY` Layer Classifications)
1. **`amenity_name`**: Prefixed using sequence format: `AMENITY-001`.
2. **`amenity_type`**: Auto-categorized as `GREEN_BELT`, `PARK`, or `INFRASTRUCTURE` based on active DXF source sub-layer tags.

---

## 5. Audit Logging Scheme

Throughout generation, progress alerts are dispatched to `import_job_logs`:

* **Log Step A — Start Verification**:
  * Action: `Step 10 — Conversion Dispatched`
  * Message: `'Administrative user confirmed auto-generation. Dispatching conversion batch on {entities_count} valid vectors.'`
* **Log Step B — Progress Loop Logs**:
  * Action: `Step 11_1 — Assets Subdivision Commits`
  * Message: `'Successfully created {plots_written} Plot rows. Created {roads_written} Road paths. Created {amenities_written} Open Space structures.'`
* **Log Step C — Process Completed**:
  * Action: `Step 11_2 — Layout Asset Finalization`
  * Message: `'Plot auto-generation resolved successfully. Subdivision layout status transitioned to ACTIVE. Real estate inventories mapped successfully.'`
* **Log Step D — Verification Failed**:
  * Action: `Step 11_3 — Transaction Aborted`
  * Message: `'Generation abort. Found {unresolved_count} collinear duplicate coordinates or primary key clashes. All inventory inserts rolled back safely.'`

---
*Report successfully published. Ready for next phase.*
