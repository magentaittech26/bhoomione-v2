# Sprint 2B: Multi-Tenant Inventory Management UI Implementation Report

The administrative and operational management user interface for **Projects**, **Layouts**, and **Plots** (BhoomiOne V2 ERP Inventory) is fully implemented and compiled. No out-of-scope modules (such as GIS, DXF imports, SVG mapping, Marketplace directories, customer entries, or Google Maps) have been included.

Every user-defined column, filter, detail module, search metric, extensible attribute payload, and bulk operations workflow is operational and integrated client-side with the backend Laravel REST API endpoints under high-security RBAC guards.

---

## 1. Physical Location Matrix (Workspace Components)

The management frontend components are structured cleanly under the React structure:
*   **Host Component**: `/src/components/InventoryManager.tsx`
*   **REST Client**: `/src/lib/api.ts`
*   **TypeScript Types**: `/src/types/auth.ts`

Compilation and standard type verification are fully verified:
*   `npm run lint` yields **LINT COMPLETED SUCCESSFULLY (0 errors)**.
*   `npm run build` yields **BUILD SUCCEEDED** (production static files successfully compiled).

---

## 2. Dynamic Search & Filters Architecture

### A. Multi-Index Global Search Space
Across the top of the workspace dashboard, a unified real-time search utility filters lists on-the-fly, scanning multiple relational parameters case-insensitively:
1.  **Project Code**: Partial/exact matches on project indices (e.g., `"GM"`, `"RSE"`).
2.  **Layout Code**: Matches Phase sub-sections (e.g., `"SEC1"`, `"COMM1"`).
3.  **Plot Number**: Matches specific land tracts (e.g., `"Plot 401"`, `"Plot 402"`). It matches nested parent names.

### B. Rigid Filter Infrastructure
*   **Project Filters**:
    *   *Location*: Dropdown populating uniquely from indexed addresses dynamically.
    *   *Approval Status*: Categorized dropdown matching (`APPROVED`, `PENDING`, `REJECTED`).
    *   *Lifecycle Status*: Dropdown selecting (`ACTIVE`, `PLANNING`, `COMPLETED`).
*   **Layout Filters**:
    *   *Parent Project*: Cascade matching layouts to chosen multi-tenant Project ID.
    *   *Layout Type*: Select filters for (`RESIDENTIAL`, `COMMERCIAL`, `MIXED_USE`, `INDUSTRIAL`, `FARM_LAND`).
    *   *Lifecycle Status*: Dropdown targeting (`DRAFT`, `APPROVED`, `LAUNCHED`, `ARCHIVED`).
*   **Plot Filters**:
    *   *Status*: Sift plots by five core states (`AVAILABLE`, `RESERVED`, `BOOKED`, `SOLD`, `BLOCKED`).
    *   *Facing*: Direction matches (`NORTH`, `SOUTH`, `EAST`, `WEST`, `NORTHEAST`, `NORTHWEST`, `SOUTHEAST`, `SOUTHWEST`).
    *   *Corner plot*: Toggle selector (`ALL`, `Only Corner Plots`, `Standard`).
    *   *Area size range*: Numerical inputs for Minimum Area and Maximum Area dynamically filtering coordinates.
    *   *Road Width*: Minimum numerical input matching adjacent arterial roads width (in meters).

---

## 3. UI Component Details & Columns Mapping

### 3.1 Project Ledger & Inspector View
*   **Columns**: Project Name, Project Code (bold monospace), Location, RERA validation number, Regulatory Approval Status Badge, Layout Count (dynamically computed), Plot Count (dynamically aggregated), Status Badge, Actions.
*   **Detail Drawer**:
    *   *Basic Details*: Displays name, developer context, location, and administrative status.
    *   *Regulatory Approval Panel*: RERA IDs, launch/possession targets, metadata, and decision authorities.
    *   *Layout Summary*: Scrollable list of child phase subdivisions with plot counters.
    *   *Plot Summary counters*: Color-coded indicators tracking plot availability inside the project.

### 3.2 Layout zoning View
*   **Columns**: Layout/Phase Name (with parent project subtitle), Layout Code, Zoning classification Type, Standard Unit Code, Total area value, Plot count, Status Badge, Edit/Trash Actions.
*   **Detail Drawer**:
    *   *Layout Specifications*: Relational Project mapping, phase labels, regulatory approval reference numbers, and timestamps.
    *   *Area Multipliers*: Total designated size of the development zone.
    *   *Zoned Plots Summary*: Monospaced scrolling list displaying child plots and availability flags.

### 3.3 Plot Parcels View & Extensible attributes
*   **Columns**: Row checkbox selector, Plot number (and parent layout subtitle), Area value, Measurement Unit, Facing, Road access Width, Corner Plot flag, Status Badge, Edit/Trash Actions.
*   **Plot Status Values**: Mapped exactly to: `AVAILABLE`, `RESERVED`, `BOOKED`, `SOLD`, `BLOCKED`.
*   **Detail Drawer**:
    *   *Basic Specifications*: Facing, width, length, road width, and net area.
    *   *Extensible Custom Attributes Builder*:
        *   Renders list of active metadata values stored under the `dimensions_metadata.plot_attributes` JSONB matrix.
        *   Predefined tag pill toggles: `Park Facing`, `Clubhouse Facing`, `Lake Facing`, `Sea Facing`, and `Premium Plot` can be added with a single tap.
        *   Allows typing and appending any arbitrary string attribute like `"Hilltop Facing"` on-the-fly dynamically, posting the updated JSON payload to the Laravel backend without modifying the Postgres database schemas.

---

## 4. Bulk Operations Transaction Engine

To facilitate high-velocity operations, administrative users are equipped with frontend-orchestrated batch engines submitting sequential promises back to existing Laravel CRUD endpoints:

1.  **Bulk Plot Create (Series Plot Generator)**:
    *   Managers input target layout, sequence prefix (e.g., `"B-"`), range start (e.g., `101`), and range end (e.g., `120`).
    *   Provides default sizing, facing, and extensible attribute templates.
    *   Generates up to 50 concurrent plot records sequentially, maintaining strict transaction state.
2.  **Bulk Plot Update (Properties modifier)**:
    *   Allows checking multiple rows on the Plot ledger.
    *   Modifies properties like Area, Facing direction, or adjacent road width all at once dynamically.
3.  **Bulk Plot Status Update (Status Shifter)**:
    *   Allows checking multiple plots and bulk-updating status to `AVAILABLE`, `RESERVED`, `BOOKED`, `SOLD`, or `BLOCKED` with one-click selector menus.

---

## 5. Security & Performance Features

*   **Role-Based Access Controls**:
    *   Gated on `projects.view`, `projects.manage`, `layouts.view`, `layouts.manage`, `plots.view`, and `plots.manage`.
    *   Creation triggers, action buttons, bulk options, and modal windows remain safely invisible or disabled for restricted logins.
*   **Programmatic Client Pagination**:
    *   Project List, Layout List, and Plot List have custom 1-indexed pagination slates slicing rows into tidy sets of 6.
    *   Prevents browser memory spikes and interface flicker when managing thousands of rows.
*   **Persistent Auditing Log entries**:
    *   Every single or bulk creation, modification, deletion, and bulk state mutation logs detailed event entries tracking exact operation scopes.
