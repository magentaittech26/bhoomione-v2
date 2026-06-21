# Sprint 4A — Interactive Layout Viewer Technical Specification

This document presents the detailed architectural and visual user interface specifications for the **Interactive CAD Layout Viewer** (Sprint 4A). It designs a read-only, fully responsive vector rendering block using database-compiled SVG files, unified style sheets, dynamic search querying, and structural layer toggles.

---

## 1. Architectural Guidelines & Visual Boundaries

The objective of Sprint 4A is translating raw static database-stored SVG components into a polished, responsive, and interactive frontend spatial representation.

### 🚫 Strict Architectural Boundaries (Anti-AI-Slop & Scope Constraints)
* **Read-Only Context**: The system is exclusively focused on layout inspection, asset searches, and details retrieval. Under no circumstances shall property reservation systems, CRM, client booking portals, payment gateways, or cart checkouts be designed.
* **No External Cartographic Engines**: Zero integrations with Leaflet, Mapbox, Google Maps, Openlayers, or other geographic visual layers are permitted. Visual grids must be projected natively from the in-database calculated SVG schemas.
* **No Telemetry or Clutter**: All typography and status messages must use humbler, standard human labels. No debug terminal rows, container logs, port notes, or simulated network pings shall be scattered in the interface margins.

---

## 2. Component Layout & Visual Composition

The Layout Viewer interface will be structured as a balanced, high-contrast, desktop-optimized dashboard featuring a fluid visual layout stage, a collapsible operations sidebar, and layout details drawers.

```
┌────────────────────────────────────────────────────────────────────────┐
│  [Header]: Layout Version Controls & Render Profile Selectors          │
├──────────────────────────────────────┬─────────────────────────────────┤
│                                      │                                 │
│                                      │  [Right Operations Sidebar]:    │
│                                      │  ┌───────────────────────────┐  │
│                                      │  │ 🔍 Global Plot Search     │  │
│                                      │  ├───────────────────────────┤  │
│                                      │  │ ⚡ Layer Toggle Controls   │  │
│          [Main Workspace Stage]      │  │   [x] Plots               │  │
│                                      │  │   [x] Roads               │  │
│             Vector Canvas            │  │   [ ] Utilities           │  │
│                                      │  └───────────────────────────┘  │
│                                      │                                 │
│                                      │  ┌───────────────────────────┐  │
│                                      │  │ 📐 Interactive Controls   │  │
│                                      │  │   [Fit to Screen]         │  │
│                                      │  └───────────────────────────┘  │
└──────────────────────────────────────┴─────────────────────────────────┘
 [Interactive Details Drawer (Slices from bottom or side upon Click)]
```

---

## 3. Core Functional Specification

### A. Responsive Vector Canvas (SVG Viewer)
* **Mechanism**: Leverages standard React inline SVG mounting, retrieving the active document viewport context dynamically based on the current responsive profile constraint:
  - **DESKTOP Viewer**: Pulls document where `render_profile = 'DESKTOP'` ($1200 \times 800$ canvas).
  - **TABLET Viewer**: Pulls document where `render_profile = 'TABLET'` ($800 \times 600$ canvas).
  - **MOBILE Viewer**: Pulls document where `render_profile = 'MOBILE'` ($450 \times 650$ canvas).
* **Fit To Screen**: A manual refresh function utilizing SVG container coordinate resets to recalculate element size and center the view instantly inside the active responsive wrapper container.

---

### B. Structural Layer Controls
Users can dynamically hide/reveal drawing layout structures via boolean checkbox selectors toggling CSS/SVG class visibilities:
* **PLOTS**: Master parcel layout polygons and boundaries.
* **ROADS**: Inner access corridors and main arterial lanes.
* **AMENITIES**: Recreation spaces, gardens, green belts, and open plazas.
* **BOUNDARIES**: Exterior property outlines.
* **UTILITIES**: Technical service grid layouts.

To implement this, the viewer binds a reactive state list mapping visible layer names and adjusts inline elements' opacity/display states dynamically:
```javascript
// Logical layer hide/reveal binding
const style = isLayerVisible[layerType] ? "opacity: 1;" : "display: none;";
```

---

### C. Live Plot Searching & Highlighting
An indexing interface allows users to discover parcels quickly:
* **Query Parameters**: Mapped to scan `plots.plot_number`, CAD-detected text elements, and generated database label tags.
* **Highlighting Interaction Rules**:
  - Typing a search query highlights corresponding polygon layers on the map in real-time.
  - Selecting a search result focuses the canvas on the matching vector centroid and flashes the element boundaries with a distinct glowing highlight styled via centralized styles (e.g., solid amber stroke transitions).
  - Hovering over a plot polygon displays a micro-tooltip showing title information and current status indicators.

---

### D. Plot Details Inspector (Drawer Panel)
Replaces modal dialog overlays with an elegant, drawer-type structural dashboard sliding out from the viewport borders. Selecting an interactive parcel polygon or search result displays rich, read-only metadata:

| Attribute | Display Typography/Style | Data Source Relation |
| :--- | :--- | :--- |
| **Plot Identifier** | Large Sans display headings | `plots.plot_number` |
| **Physical Area** | Mono digits paired with units | `plots.area` + `measurement_unit` |
| **Inventory Status** | Bold badge styled with high-contrast state tints | `plots.status` (`AVAILABLE`, `SOLD`, etc.) |
| **Orientation & Facing** | Standard neutral literal text | `plots.facing` (e.g., `North-West`) |
| **Road Width** | Normalized dimension metrics | `plots.road_width` (e.g., `12.00 Meters`) |
| **Dimensional Metrics** | Linear bounding data listings | `plots.dimensions` |
| **Project Context** | Linked structural project name | `projects.name` |
| **Layout Reference**| Layout naming context | `layouts.name` |

---

## 4. Visual Stylesheet Binding (SVG Style Profiles)

Centralized class names mapped from the `svg_style_profiles` table govern dynamic state transitions:

1. **Available Plots**:
   - `fill`: Class maps to profile `PLOT_AVAILABLE` (soft, light gray/indigo transition `#F1F5F9`).
   - `stroke`: Deep grey borders with micro transitions upon mouse hover.
2. **Reserved Plots**:
   - `fill`: Class maps to profile `PLOT_RESERVED` (`#FEF3C7`).
3. **Booked Plots**:
   - `fill`: Class maps to profile `PLOT_BOOKED` (`#DBEAFE`).
4. **Sold Plots**:
   - `fill`: Class maps to profile `PLOT_SOLD` (`#D1FAE5`).
5. **Selection Stroke Indicator**:
   - Dynamic interactive paths will apply an highlighted high-contrast border selector (`stroke-width: 3px; stroke: #2563EB`) to clearly guide the user's attention.

---

## 5. Prototype Wireframe Sequence & Inspection Logic

```
   [User opens Dashboard]
              │
              ▼
  [Fetch SVG Doc metadata based on Screen Width]
              │
              ▼
  [Load Elements, Labels, & Style Profiles]
              │
              ├───────► User toggles layer checkboxes ───► Hide/Reveal paths instantly
              │
              ├───────► User types plot query ───────────► Highlight & flash match elements
              │
              └───────► User clicks a plot polygon ───────► Slide up Details Drawer
```

---
*End of technical specification. Ready for Sprint 4A core development scheduling.*
