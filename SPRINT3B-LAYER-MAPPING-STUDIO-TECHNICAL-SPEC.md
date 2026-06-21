# Technical Specification: Sprint 3B — Layer Mapping Studio
**BhoomiOne V2 ERP Inventory Engine**

This document details the architectural and functional specification for the **Layer Mapping Studio**. This studio serves as the interactive translation workspace between raw CAD Drawings Exchange Format (DXF) files and the standardized BhoomiOne GIS taxonomy structure.

Consistent with our rigorous **Scope Discipline**, all geometry extraction, polyline parsing, visual polygon generation, automated plot creation, road creation, SVG rendering, and visual GIS map elements are explicitly **out of scope** for this phase.

---

## 1. High-Level Architectural Context

The Layer Mapping Studio operates purely on discovered layer catalog registries and taxonomy records. It serves as highly modular, validation-driven configuration metadata management software.

```
       [ Discovered DXF Layers Registry ]
                       │
                       ▼
       [ Workspace: Layer Mapping Studio ] ◄──► [ Tenant Template Store ]
                       │
         (Validation Rules Audit Loop)
                       ├─────────────────┐
                       ▼ (If Warns)      ▼ (If Cleared)
               [ Warning Flags ]   [ Safe Approval Preview ]
                       │                 │
                       ▼                 ▼
          (Manual Config Review)    (Ready for dry-run commit)
```

---

## 2. Core Functional Modules

The Layer Mapping Studio is built around five premium core capabilities:

### A. Layer Review Screen
A dense, high-contrast dashboard displaying discovered layer lists extracted during the Sprint 3A import analysis phase:
* **`layer_name`**: The literal string token discovered inside the DXF tables section (e.g. `SURVEY_PLOT_BOUNDS`).
* **`color`**: The native CAD Color index (ACI) mapped to high-contrast visual status tags.
* **`object_count`**: Number of raw entities associated with this layer metadata category.
* **`detected_type`**: The system's adaptive heuristic guess based on CAD layer common nomenclature (e.g. layer containing `PLT` defaults to `PLOT`).
* **`status`**: Current configuration state: `MAPPED` or `UNMAPPED`.

### B. Layer Classification Panel
An interactive form letting operators pair CAD layers to standard BhoomiOne taxonomy classifications.
* **Support taxomony types**:
  1. **`PLOT`**: Designated cadastral parcel boundaries.
  2. **`ROAD`**: Circulation network, streets, and avenues.
  3. **`AMENITY`**: Parks, civic centers, buffers, and open areas.
  4. **`UTILITY`**: Electrical, drainage, and water distribution lines.
  5. **`BOUNDARY`**: Total external layout subdivision perimeter.
  6. **`IGNORE`**: Decorative elements, notes, cross-hatching, or elevation coordinates.

### C. Reusable Template Management
Enables development teams to store layer-to-type pairs as reusable survey profiles.
1. **Create Template**: Saves active mapping configurations under a custom, user-provided profile name (e.g. `'Standard Survey Map Type-A'`).
2. **Save Template**: Commits configurations to database table `import_templates` associated strictly with active tenant boundaries.
3. **Reuse Template**: Automatically auto-fills select-fields for newly uploaded drawings if CAD layer strings match the presaved mappings.
4. **Clone Template**: Copies templates configurations to a new profile to allow fast variations.
5. **Delete Template**: Safely de-registers profiles from active tenant records.

### D. Rules-Based Validation Engine
The studio includes a live client-side validation compiler that runs audit rules pre-commit. The system generates notices/warnings on these criteria:
* **`NO_PLOT_LAYER`**: Triggers a warning if no discovered layer has been mapped to taxonomy `PLOT`.
* **`NO_ROAD_LAYER`**: Warns if circulation elements are completely omitted (no layer mapped to `ROAD`).
* **`DUPLICATE_MAPPINGS`**: Flags warning if multiple layers are mapped to the layout perimeter `BOUNDARY` (which must be a singular, closed envelope).
* **`UNMAPPED_LAYERS_MISSING`**: Recommends confirming that remaining drawing layers have been explicitly assigned to either a class or set to `IGNORE`.

### E. Import Preview Summary
A final overview block that displays the proposed metadata state before locking approval:
* Lists all assigned target counts.
* Computes totals (e.g. `12 layers mapped, 450 total elements, 2 ignored layers`).
* Displays any active, non-blocking Validation Warnings.
* Demonstrates mapped taxonomy categories.

---

## 3. Storage and Database Alignment

The Layer Mapping Studio leverages entities registered under Sprint 3A:
* **`dxf_layer_mappings`**: Stores active file configurations.
* **`import_templates`**: Holds templates profiles.
* **`import_job_logs`**: Logs mapping audit trails and validations steps.

---

## 4. Scope Discipline & Out of Scope Boundary Mandates

To prevent feature creep, developers are strictly forbidden from implementing the following capabilities:
1. **No Geometry Extractions**: Do not write geometry calculations, coordinate normalizations, scaling, or transformation algorithms.
2. **No Polyline Parsing**: Do not translate `POLYLINE` coordinate arrays into GIS variables.
3. **No Polygon Creation**: Do not generate database polygon structures or bounds spatial indices.
4. **No Inventory Plot Generation**: Do not write or commit new plots, streets, or roads to their respective inventory tables.
5. **No SVG Generation**: Do not compile or output server or client-side SVG files.
6. **No GIS Viewers**: Do not integrate map canvases, Leaflet interfaces, or location-centric overlays.

---

This completes the **Sprint 3B Project Blueprint Specification**.
