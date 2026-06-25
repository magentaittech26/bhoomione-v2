# PHASE 1F.10 – Plan-Specific Tenant Experience Test Matrix

## 1. Test Overview
This matrix serves as the standard operating procedure for verifying the plan-specific client-side experiences on BhoomiOne. All tests assess both the user interface and the backend resolution layer.

---

## 2. Test Cases by Subscription Tier

### TC-1.1: Starter Experience Verification
- **Target Role/Plan**: Tenant registered on STARTER subscription baseline (No `gis_maps`, no `dxf_import` features).
- **Core Checks**:
  - [ ] **Tab Defaulting**: Workspace loads and defaults to the "Plots" grid tab automatically. "Maps" and "Layouts" tabs are completely hidden from the menu.
  - [ ] **Plot Grid Workspace**: Both Spreadsheet and Card views render flawlessly.
  - [ ] **Plot Grid View Switching**: Switching between views maintains selected item state and filter criteria.
  - [ ] **Bulk CSV Export**: Clicking "Export to CSV" triggers browser file generation containing active plot details.
  - [ ] **Dashboard Widgets**: Shows Revenue target progress, Collections Bar Chart, Bookings Distribution Pie Chart, and Plots Capacity Utilization gauge.
  - [ ] **Growth/Professional Blocks**: Layout Subdivision Statistics and GIS/Maps analytics panels are completely hidden.

### TC-1.2: Growth Experience Verification
- **Target Role/Plan**: Tenant registered on GROWTH subscription baseline (Contains `dxf_import`/`layouts.view`, but no `gis_maps`).
- **Core Checks**:
  - [ ] **Tab Defaulting**: Workspace loads and defaults to the "Layouts" tab automatically. "Maps" tab is completely hidden.
  - [ ] **Layout Viewer & DXF Upload**: Fully visible, interactive, and rendering canvas controls.
  - [ ] **Dashboard Widgets**: Shows Starter widgets plus the **Layout Subdivision & Land Zoning Statistics** section.
  - [ ] **Professional Block**: GIS Map Engine statistics and Satellite overlay gauges are completely hidden.

### TC-1.3: Professional Experience Verification
- **Target Role/Plan**: Tenant registered on PROFESSIONAL subscription baseline (Contains `gis_maps`, `maps.view`, and `dxf_import`).
- **Core Checks**:
  - [ ] **Tab Defaulting**: Workspace loads and defaults to the "Maps" tab automatically (the interactive layout/map synchronized view).
  - [ ] **All Tabs Visible**: Maps, Layouts, and Plots tabs are all fully visible and selectable.
  - [ ] **Dashboard Widgets**: Shows Starter widgets, Growth subdivision metrics, plus the **GIS Map Engine & Satellite Calibration Analytics** block.

### TC-1.4: Enterprise Experience Verification
- **Target Role/Plan**: Tenant registered on ENTERPRISE subscription baseline (All core features and all portals enabled).
- **Core Checks**:
  - [ ] **All Features & Portals Visible**: All tabs, maps, layouts, portals (Agent Portal, Customer Portal, Marketplace) are accessible.
  - [ ] **Dashboard Experience**: All sections (Starter, Growth, and Professional panels) are fully displayed with the Resolved Experience badge displaying the Enterprise plan status.

---

## 3. Core Functional & UI Component Checks

| ID | Test Category | Target Element | Action / Trigger | Expected Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **FN-01** | UI View Switching | Spreadsheet/Card Toolbar | Click "Card View" button | Table hides and 3-column plot cards load with high-contrast layout. |
| **FN-02** | UI View Switching | Spreadsheet/Card Toolbar | Click "Spreadsheet View" button | Cards hide and standard paginated data table loads. |
| **FN-03** | Data Export | Export to CSV Button | Click "Export to CSV" | Browser triggers dynamic CSV download matching plot headers. |
| **FN-04** | Dynamic Defaulting | Inventory Tab Bar | Load page on Growth plan | Active tab is initialized to `"layouts"`. |
| **FN-05** | Dynamic Defaulting | Inventory Tab Bar | Load page on Professional plan | Active tab is initialized to `"viewer"`. |
| **FN-06** | Dynamic Defaulting | Inventory Tab Bar | Load page on Starter plan | Active tab is initialized to `"plots"`. |
| **FN-07** | Dashboard Adapt | Stats Dashboard Panel | Load page on Starter plan | Layout and GIS telemetry sections are completely hidden from DOM. |

---

## 4. Automation and Compilation Verification
- **TypeScript Compilation**: Run `npm run build` (Executed successfully).
- **ESLint/Type-checks**: Run `npm run lint` (Executed successfully).
- **Error Boundaries**: If backend fails to serve subSummary, the frontend displays standard fallback values and remains fully operational.
