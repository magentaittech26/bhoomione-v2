# BHOOMIONE V3 — MANUAL QA CHECKLIST
## COMPREHENSIVE ROAD, PARK, & AMENITY SPATIAL ENGINES VERIFICATION

This document outlines the complete step-by-step Manual QA Checklist to verify the layout design studio spatial engines. It is designed to be fully executable by non-developers (operators, draftsmen, or QA analysts).

---

### TEST 1: CREATE BOUNDARY
*   **Purpose**: Verify the Layout Studio's capability to set, close, and render the master layout boundary.
*   **Preconditions**: Open Layout Studio, select an empty layout version, and activate **Step 1: Layout Boundary**.
*   **Steps**:
    1. Click on the canvas to set the first boundary point.
    2. Click three more times in a clockwise direction to form a large quadrilateral.
    3. Double-click on the canvas or click back on the first point to close the boundary polygon.
*   **Expected Result**: The boundary polygon closes, renders a semi-transparent slate-blue fill with a bold outline, and calculates layout area and perimeter metrics dynamically.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 2: DRAW PRIMARY ROAD
*   **Purpose**: Verify the creation of standard Primary Roads (30-foot / 15-meter wide) on the canvas.
*   **Preconditions**: Layout Boundary is successfully created. Select **Step 2: Roads & Lanes**.
*   **Steps**:
    1. Look at the top center of the canvas; confirm the road type defaults to or is set to **Primary Road**.
    2. Click once inside the boundary to start the road centerline path.
    3. Drag the cursor across the canvas and double-click to finish drawing a straight segment.
*   **Expected Result**: A primary centerline segment is created. A 15-meter wide polygon representing the road carriageway is generated automatically and rendered with a bold slate outline and dotted centerline.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 3: DRAW SECONDARY ROAD
*   **Purpose**: Verify the creation of standard Secondary Roads (24-foot / 12-meter wide).
*   **Preconditions**: Step 2 (Roads) is active.
*   **Steps**:
    1. Select the road class dropdown in the road settings panel and choose **Secondary Road**.
    2. Click once on the canvas to start, click to create a bend point, and double-click to end.
*   **Expected Result**: A secondary road segment is rendered with a 12-meter width and distinct coloring.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 4: DRAW INTERNAL ROAD
*   **Purpose**: Verify the creation of standard Internal Roads (18-foot / 9-meter wide).
*   **Preconditions**: Step 2 (Roads) is active.
*   **Steps**:
    1. Select the road class dropdown in the road settings panel and choose **Internal Road**.
    2. Click once on the canvas and double-click to place a short internal connection.
*   **Expected Result**: An internal road segment is created, rendered with a 9-meter width.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 5: CHANGE WIDTH
*   **Purpose**: Verify that changing a road's width automatically regenerates the carriageway polygon.
*   **Preconditions**: A road exists on the canvas.
*   **Steps**:
    1. Click on the drawn road to select it.
    2. Look at the properties inspector on the right side.
    3. Modify the **Road Width** field from its default value (e.g., change `15` to `20` meters).
*   **Expected Result**: The road on the canvas instantly expands in width, recalculates its area, and displays the wider footprint on the map.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 6: RENAME ROAD
*   **Purpose**: Verify renaming a road syncs its name on the map label and inspector.
*   **Preconditions**: A road is drawn and selected.
*   **Steps**:
    1. Select the road object.
    2. In the Properties Inspector, find the **Road Name** input field.
    3. Type "Main Boulevard East" and press Enter or click outside.
*   **Expected Result**: The label on the road centerline overlay updates instantly to "Main Boulevard East".
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 7: MOVE ROAD
*   **Purpose**: Verify that dragging a road's body repositions it smoothly.
*   **Preconditions**: A road is drawn. Select Tool is active.
*   **Steps**:
    1. Click and hold down the left mouse button directly on the body of the road centerline.
    2. Drag the mouse in any direction, then release.
*   **Expected Result**: The entire road (including centerline vertices and carriageway polygon) translates to the new position smoothly.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 8: EDIT VERTICES
*   **Purpose**: Verify the editing of individual vertices and insertion of new midpoints.
*   **Preconditions**: A road is drawn and selected.
*   **Steps**:
    1. Hover over one of the circular blue vertices at the start or end of the road centerline.
    2. Click and drag the vertex to a new point. Release.
    3. Hover over the faint circular handle at the center of a road segment.
    4. Click and drag it to insert a new vertex (bend) in the road.
*   **Expected Result**: The road geometry shifts, the centerline updates, and the carriageway is instantly recalculated around the new vertex chain.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 9: UNDO
*   **Purpose**: Verify that pressing Ctrl+Z or clicking the Undo button rolls back the last command.
*   **Preconditions**: Draw a new road segment or modify a vertex.
*   **Steps**:
    1. Click the **Undo** button in the secondary toolbar (or press `Ctrl + Z`).
*   **Expected Result**: The last action (creation, vertex move, or property change) is undone, restoring the canvas to its previous state.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 10: REDO
*   **Purpose**: Verify that pressing Ctrl+Y or clicking the Redo button re-applies an undone action.
*   **Preconditions**: Perform an Undo action.
*   **Steps**:
    1. Click the **Redo** button in the secondary toolbar (or press `Ctrl + Y`).
*   **Expected Result**: The undone action is reapplied, returning the canvas to its undone state.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 11: DELETE
*   **Purpose**: Verify deleting an object removes it from the canvas and database layer.
*   **Preconditions**: Draw a road or park, then select it.
*   **Steps**:
    1. With the object selected, click the red **Delete** button in the Inspector or press the `Delete` key on your keyboard.
*   **Expected Result**: The selected object is immediately removed from the canvas. The Inspector panel empties.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 12: HIDE LAYER
*   **Purpose**: Verify that toggling off layer visibility hides the layer objects.
*   **Preconditions**: At least one road is drawn.
*   **Steps**:
    1. Open the **Layers Manager** panel (usually on the left side, or under the layers legend).
    2. Click the eye icon next to the **ROADS** layer.
*   **Expected Result**: All roads on the canvas immediately disappear from view, but remain in the project database. Toggling the eye icon again restores them.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 13: LOCK LAYER
*   **Purpose**: Verify that locking a layer prevents selection and modification of its objects.
*   **Preconditions**: Roads exist on the canvas.
*   **Steps**:
    1. In the **Layers Manager** panel, click the lock icon next to the **ROADS** layer.
    2. Attempt to click on a road to select or drag it.
*   **Expected Result**: The road cannot be clicked, highlighted, selected, or dragged. It remains securely in place.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 14: VALIDATION WARNINGS
*   **Purpose**: Verify that the real-time layout validation engine detects issues and prints warnings.
*   **Preconditions**: A boundary exists. Set **Step 2 (Roads)** active.
*   **Steps**:
    1. Draw a road that exits or crosses outside the layout boundary.
    2. Open or look at the **Validation Center** dashboard (usually visible in the layout sidebar).
*   **Expected Result**: A clear warnings message appears stating: "Road is located outside or intersecting layout boundary."
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 15: SAVE DRAFT
*   **Purpose**: Verify that clicking "Save Draft" triggers an explicit layout sync.
*   **Preconditions**: Draw multiple elements (boundaries, roads, parks).
*   **Steps**:
    1. Click the **Save Draft** button in the bottom wizard toolbar.
*   **Expected Result**: A success notification/log prints: "Layout saved successfully to database."
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 16: RELOAD BROWSER
*   **Purpose**: Verify that drafting data is preserved across full page reloads.
*   **Preconditions**: Perform Test 15 (Save Draft).
*   **Steps**:
    1. Refresh/reload your browser page (`F5` or `Ctrl + R`).
*   **Expected Result**: The application reloads, re-renders the canvas, and displays the exact layout and elements as they were before the reload.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 17: RESTORE SESSION
*   **Purpose**: Verify automatic session restoration if the browser tab is closed unexpectedly.
*   **Preconditions**: Draw some draft items without manually saving.
*   **Steps**:
    1. Close the browser tab.
    2. Re-open the application.
*   **Expected Result**: The local database or browser state-sync auto-restores your draft session, returning you to the same coordinates and workspace.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 18: INSPECTOR UPDATES
*   **Purpose**: Verify that editing properties in the Inspector automatically updates the spatial coordinates.
*   **Preconditions**: Draw an object and select it.
*   **Steps**:
    1. Look at the coordinates readout in the Inspector.
    2. Change the object description or custom attribute value.
*   **Expected Result**: The attribute updates instantly, and the change is safely persisted in the object properties array.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 19: PERFORMANCE
*   **Purpose**: Verify that adding large numbers of spatial objects does not degrade canvas performance.
*   **Preconditions**: Draw or import 100+ roads, parks, and plots.
*   **Steps**:
    1. Use the mouse wheel to zoom in and out rapidly.
    2. Click and hold the Middle Mouse Button (or Spacebar + Left Mouse Button) to pan across the workspace.
*   **Expected Result**: The viewport rendering remains highly responsive (smooth, flicker-free drawing) with zero noticeable lag.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 20: REGRESSION WITH BOUNDARY
*   **Purpose**: Verify that modifying boundary coordinates updates dependent validation states.
*   **Preconditions**: Draw a boundary, a road inside, and a road outside.
*   **Steps**:
    1. Switch to **Step 1: Layout Boundary**.
    2. Drag a boundary corner to enclose the road that was previously outside.
*   **Expected Result**: The validation warning for "Road outside boundary" automatically disappears, showing that the real-time engine handles relative coordinates dynamically.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

## SPRINT 3 & 4 SPATIAL EXTENSIONS (PARKS & AMENITIES)

### TEST 21: DRAW SECTOR PARK
*   **Purpose**: Verify the creation of Parks as first-class GIS entities.
*   **Preconditions**: Switch to **Step 3: Parks & Open Spaces**.
*   **Steps**:
    1. Select the **Park Tool** from the toolbar.
    2. Click on the canvas to draw a polygon representing a green park.
    3. Double-click to close.
*   **Expected Result**: The park is rendered as a beautiful green-shaded polygon with grass hatch patterns, and is assigned to the "PARK" layer.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 22: PLACE POINT AMENITY (E.G. WATER TANK)
*   **Purpose**: Verify placing point-based Civic Infrastructure Amenities.
*   **Preconditions**: Switch to **Step 4: Amenities & Public Infrastructure**.
*   **Steps**:
    1. Note the floating **Amenity Settings** dashboard at the top of the canvas.
    2. Select **Point** geometry mode.
    3. In the Amenity Class dropdown, choose **Water Tank**.
    4. Click once on the canvas near a road.
*   **Expected Result**: A point-based Amenity is placed on the canvas. It renders a beautiful designated water tower symbol and label, with coordinates displayed in the Inspector.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 23: DRAW RECTANGLE AMENITY (E.G. SCHOOL BLOCK)
*   **Purpose**: Verify drawing precise rectangular buildings/facilities.
*   **Preconditions**: Step 4 is active.
*   **Steps**:
    1. In the floating Amenity settings dashboard, select **Rectangle** geometry mode.
    2. Select **School** from the Amenity Class dropdown.
    3. Click and drag diagonally on the canvas, then release.
*   **Expected Result**: A perfectly square/rectangular school parcel is drawn. It renders with custom pink outlines, a beautiful book/cap symbol in the center, and a label.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 24: SEARCH & INSPECT AMENITY
*   **Purpose**: Verify searching for an amenity zooms, centers, and highlights it.
*   **Preconditions**: Place an amenity named "Sector-4 Hospital" on the canvas. Deselect it.
*   **Steps**:
    1. Click on the Search box in the workspace navigation or toolbar.
    2. Type "Hospital" and press Enter.
*   **Expected Result**: The canvas immediately zooms closer, centers the view precisely over the hospital building, opens the properties Inspector on the right, and highlights its borders in high-contrast red.
*   **Status**:
    *   [ ] **PASS**
    *   [ ] **FAIL**
    *   *Comments*: __________________________________________________

---

### TEST 25: AMENITY VALIDATION (INSIDE BOUNDARY & ROAD ACCESS)
*   **Purpose**: Verify that amenities respect boundaries and require road frontage.
*   **Preconditions**: Switch to Step 4. Draw a road and a boundary.
*   **Steps**:
    1. Draw a Point Amenity outside the master layout boundary. Look at the Validation Center.
    2. Draw an Amenity block completely isolated from any road frontage (more than 100 meters away).
*   **Expected Result**:
    - Warning 1: "Amenity [Name]: Located outside of layout boundary."
    - Warning 2: "Amenity [Name]: No road frontage or entrance access nearby."
*   **Status**:
    - [ ] **PASS**
    - [ ] **FAIL**
    - *Comments*: __________________________________________________
