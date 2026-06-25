# Phase 2A – Professional GIS & Satellite Workspace Test Matrix

## 1. Automated Verification Checks
Always ensure the following automated commands run and succeed prior to release:
- **Linter compilation**: `npm run lint` (Passed successfully).
- **Production bundle**: `npm run build` (Passed successfully).

---

## 2. Interactive Testing & Quality Assurance SOP

### TC-2A.1: GIS Workspace Gating Check
- **Context**: Accessing workspace without the `gis_maps` feature.
- **Action**: Load the application with starter subscription settings.
- **Expected Outcome**:
  - The "Interactive Map" tab is hidden from the main menu.
  - If a user directly accesses the route/view, an elegant lock screen is rendered stating: "Professional Tier GIS & Satellite Workspace - Module Locked", displaying the list of premium benefits and the required `gis_maps` claim code.

### TC-2A.2: Interactive Map Navigation & Controls
- **Context**: Loaded on Professional/Enterprise plan with `gis_maps` active.
- **Action**: Choose a project and click "Compile DXF" or load a compiled layout. Use the mouse to drag-pan, the mouse wheel to zoom, or click on-screen `+`/`-` controls.
- **Expected Outcome**:
  - Map elements translate smoothly across the screen on drag.
  - Scale adjusts dynamically on mouse wheel or zoom clicks.
  - Scale indicator (e.g. `ZOOM: X.XXx`) updates in the top-left spatial calibration panel.
  - Clicking "Center view" returns zoom to 1.0x and resets pan translation coordinates.

### TC-2A.3: Google Maps Base Layer Switcher (`google_maps_layer` gated)
- **Action**: Switch between map mode buttons in the left sidebar: "Road Map", "Terrain", "Satellite", "Hybrid".
- **Expected Outcome**:
  - Grid background pattern changes instantly (e.g. gray roads in Roadmap, contours in Terrain, dark-textured coordinates grid in Satellite/Hybrid).
  - If `google_maps_layer` feature is absent, base layer buttons display lock icons, and clicking them generates a non-blocking professional notification warning of missing premium features.

### TC-2A.4: Satellite Overlay & Boundary modes (`satellite_view` gated)
- **Action**: Activate "Satellite" mode, and select "Satellite Imagery (Pure Backdrop)", "Plot Overlay Mode (Boundaries + Status)", and "Layout Boundary Mode (Perimeter Highlight)".
- **Expected Outcome**:
  - Under "Pure Backdrop", plot colored polygons are hidden, exposing only the raw landscape backdrop.
  - Under "Plot Overlay", plot colored polygons are displayed with semi-transparent status colors.
  - Under "Layout Boundary Mode", plot polygons hide, and a thick outline highlight demarcates the layout perimeter.
  - If `satellite_view` feature is absent, selecting satellite-related base maps generates a premium feature alert.

### TC-2A.5: Layer Manager Checks
- **Action**: Toggle visibility checkboxes in the "GIS Layer Manager" panel.
- **Expected Outcome**:
  - Toggling "Plots Overlay" hides/shows all plot parcels on the active map.
  - Toggling "Roads Overlay" hides/shows street geometry lines.
  - Toggling "Labels Overlay" hides/shows plot numbers text annotations.

### TC-2A.6: Plot Inspector & Attribute Queries
- **Action**: Click an active Plot parcel polygon on the interactive GIS map.
- **Expected Outcome**:
  - Selected plot element is highlighted on the map with a glowing gold borders focus.
  - "Plot Inspector" sidebar pops open with exact values: Plot Number, total Area (formatted with SQFT/SQYD unit code), Facing orientation, Dimensions (e.g., length x width), calculated Price ($125/sqft default), status badge, owner name (fallback based on status if unassigned), and the active workflow status.

### TC-2A.7: Live Multi-Index Search
- **Action**: Input a query in the GIS Search Box (e.g. plot number like "1", status like "AVAILABLE", orientation like "EAST", or owner name like "Patel").
- **Expected Outcome**:
  - Auto-suggest list displays matching plot records instantly.
  - Clicking on a search suggestion auto-selects the plot, highlights it, **pans and centers** the entire GIS map smoothly to center on the selected polygon coordinates!
