# SPRINT 4A: INTERACTIVE LAYOUT VIEWER IMPLEMENTATION REPORT

This document outlines the engineering implementation of the high-accuracy Interactive Layout Viewer under SPRINT 4A. It details the component architecture, state management loops, responsive viewer viewports, layout styling constraints, and visual interactions.

---

## 1. Architectural Blueprint & Component Flow

The Layout Viewer exists as a modular React module integrated into the `BhoomiOne ERP` workspace.

```
+---------------------------------------------------------------------------------+
|                               InventoryManager                                  |
|  (Tabs: Projects Master, Layout Plans, Land Plots, CAD Imports, Interactive Map) |
+---------------------------------------------------------------------------------+
                                        |
         +------------------------------+------------------------------+
         | (Visual Compass Click)                                      | (Tab Select)
         v                                                             v
+---------------------------------------------------------------------------------+
|                            InteractiveLayoutViewer                              |
|                                                                                 |
|  +------------------------+  +-----------------------------------------------+  |
|  | Layer & Search Panel   |  |   Responsive Simulation Viewport (SVG Stage)  |  |
|  | * Plot Search Input   |  |   * Interactive Path Polygons                 |  |
|  | * Render Profile Selector|  |   * Dynamic text labels (Centroid Anchored)   |  |
|  | * Layer Visibility     |  |   * GOLD Highlight Stroke glow                |  |
|  | * Style Profile Dictionary|  +-----------------------------------------------+  |
|  +------------------------+                          |                          |
|                                                      | (Click / Double-click)   |
|                                                      v                          |
|                                      +-------------------------------+          |
|                                      |    Details Drawer Container   |          |
|                                      | * Desktop: Right side Panel   |          |
|                                      | * Tablet: Sliding Drawer      |          |
|                                      | * Mobile: Bottom sheet panel  |          |
|                                      | * Future Actions Placeholder  |          |
|                                      +-------------------------------+          |
+---------------------------------------------------------------------------------+
```

### Core Code Artifacts

1. `/src/components/InteractiveLayoutViewer.tsx`: Contains the core visual vector stage, coordinate extracts, search indexing, centroid label plots, and responsive sliding drawers.
2. `/src/components/InventoryManager.tsx`: Toggles the visual viewer sub-tab, links row selections, and mounts the active workspace canvas.
3. `/src/lib/api.ts`: Extends asynchronous endpoints to include backend vector generation compile and style database profiles.

---

## 2. Implemented Features & Compliance Metrics

### A. High-fidelity SVG Viewer
- Renders elements retrieved dynamically via the `dxf/svg-documents/{id}` query.
- Extracts polygon coordinate points and path vector paths mathematically mapped from raw source geometry boundaries.
- Adheres to the strict rule: **No Mapbox, No Leaflet, No Google Maps, No external GIS map rendering dependencies.**

### B. Layers toggle visibility Panel
- Subdivides CAD vectors based on layer classification:
  - `PLOTS` toggles `PLOT` layer classifications.
  - `ROADS` toggles `ROAD` layer classifications.
  - `AMENITIES` toggles park / amenity layers.
  - `BOUNDARIES` toggles partition rings.
  - `UTILITIES` toggles grid structures.
- **Performance Rule**: Hidden layers are completely omitted from the React DOM tree rather than visually hidden, reducing browser rendering and recalculation weight.

### C. Multi-Index Plot Search
- Scans plots concurrently under three lookup indexes:
  - `plot_number`
  - `detected_label` (CAD layers text labels)
  - `generated_label` (Attributes metadata labels)
- **Behavior**: Entering a plot term highlights the specific land tract on the map, centers the visual marker overlay, and slides open the specifications drawer.

### D. Plot Highlight Accent
- **Single Click**: Draws a warm golden aura (`fill: #FCD34D`, `stroke: #D97706`, with supplementary stroke width) representing high-contrast visual focus.
- **Double Click / Search trigger**: Opens the structural specs sidebar details drawer.

### E. Details Drawer responsive Strategy
Adapts dynamically based on the selected **Simulation Render Profile**:
- **DESKTOP (Viewer + Right Drawer)**: Extends a stationary sidebar panel within the right screen boundary (96 width).
- **TABLET (Viewer + Slide Drawer)**: Slides out an overlapping right-hand slate details drawer (80 width).
- **MOBILE (Viewer + Bottom Sheet)**: Emerges a modular bottom actions sheet overlay from the base of the viewport window boundaries.

### F. Fit to Screen
- Resets viewport scale, focuses highlight constraints, and centres the SVG canvas dimensions perfectly matching the stage canvas size.

---

## 3. Styling Constraints Compliance

- **Rule: No hardcoded colors**.
- **Implementation**: The viewer maps elements dynamically to `svg_style_profiles` definitions retrieved from the database (or default standard definitions seeded securely on the backend):
  - `PLOT_AVAILABLE` -> Neutral Slate `#F1F5F9` / `#64748B`
  - `PLOT_RESERVED` -> Warm Amber `#FEF3C7` / `#D97706`
  - `PLOT_BOOKED` -> Deep Blue `#DBEAFE` / `#2563EB`
  - `PLOT_SOLD` -> Emerald Jade `#D1FAE5` / `#059669`
  - Other styling categories mapped to theme color coordinates.

---

## 4. Technical Specifications Stencil

| Aspect | Specification | Status |
| :--- | :--- | :--- |
| **Routing Context** | InventoryManager Viewer Sub-Tab | Core Integrated |
| **API Endpoints** | `/api/v1/dxf/svg-documents/{id}`<br>`/api/v1/dxf/generation-batches/{id}/compile-svg`<br>`/api/v1/dxf/style-profiles` | Fully Connected |
| **Canvas Sizing** | Responsive, bound to simulation render dimensions | Built & Verified |
| **Animation framework** | CSS Transitions and dynamic SVG transforms | Pure Performance |
| **Audit Log Triggers** | `LAY_VIEW_LOADED`, `LAY_COMPILE`, `PLOT_HIGHLIGHT` | Active Logged |
