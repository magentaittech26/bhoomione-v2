# Manual Quality Assurance Playbook

This document defines the structured user-interaction flows and click checklists used by manual QA engineers to verify layout view rendering, CRM updates, and subscription upgrades.

---

## 🖱️ CAD Ingestion & Visual Rendering Checks

### User Journey: Surveyor uploads a drawing and maps layers
1. Navigate to **CAD Import Manager**.
2. Click **Upload CAD (.dxf)** and select a test drawing document.
3. Assert that a progress loading bar is displayed, resolving to "CAD Parsed Successfully".
4. Navigate to **Layer Mapping Studio**.
5. Map layers: Assoc `LAYER_ROAD` with `ROAD_WAYS` and `LAYER_PARCEL` with `PLOT_BOUNDS`.
6. Click **Save Layers Mapping Configuration**.
7. Navigate to the **Interactive Layout Canvas** and assert that roads are styled as gray corridors and plots are styled as emerald green polygons.

---

## 🗺️ Georeferencing & Map Alignment Checks

### User Journey: Surveyor aligns CAD layout to world satellite view
1. Navigate to **Layouts List** and click on a layout.
2. Under **GIS Calibration Options**, assert that status reads: "Not Georeferenced".
3. Enter values for **Anchor Point 1**:
   * Local CAD coordinates: `0, 0`
   * Geodetic Coordinates (Lat/Lng): `1.352083, 103.819836`
4. Enter values for **Anchor Point 2**:
   * Local CAD coordinates: `1000, 1000`
   * Geodetic Coordinates (Lat/Lng): `1.352981, 103.820734`
5. Click **Compute & Calibrate Georeference Transformation**.
6. Assert that success toast reads: "Matrix computed and saved." and status changes to "Georeferenced".
7. Click **View Map Overlay**. Assert that the layout polygons overlap onto the Google Maps satellite view at the correct global coordinates location.
