# SPRINT 2B: MULTI-TENANT INVENTORY MANAGEMENT UI TECHNICAL SPECIFICATION (FINAL)

This document establishes the final technical specification for the React-based Multi-Tenant Real Estate Inventory Management UI (Sprint 2B) of the BhoomiOne V2 platform.

This specification maps the frontend React client to the production-grade **Laravel API v1** endpoints. In strict compliance with security and architectural constraints, this module is confined entirely to logical catalog management, filtering, searching, bulk actions, and RBAC-controlled records modification.

---

## 1. Architectural Scope & Hard Exclusions

To avoid engineering bloat and meet strict compliance goals, the following features are **strictly out-of-scope** and must not be implemented:
*   **No Geographic Information Systems (GIS)** or interactive map layers (e.g. Leaflet, Mapbox).
*   **No CAD/DXF/DWG** document readers or layout parsing engines.
*   **No SVG Map Layout Hotspot Renderers** (or visual grid highlights).
*   **No Public Marketplace Listings** or public portals.
*   **No Agent Catalog Management** or third-party broker rosters.
*   **No Customer Booking Screens**, transaction ledgers, or payment installment matrices.
*   **No Google Maps Platform APIs** or geo-autocompleters.

---

## 2. Global Search Architecture

The unified management interface implements a **Global Multi-Index Search** across the top of all dashboard panels, matching input queries against secondary nested matrices:
*   **Project Code** (exact or partial, e.g. `GM`, `RSE`).
*   **Layout Code** (exact or partial, e.g. `SEC1`, `COMM1`).
*   **Plot Number** (exact string, e.g. `Plot 401`, `Plot 402`).

---

## 3. UI Modules Design & Field Specs

### 3.1 Project Management UI

Provides active real-time administration of real estate development sites within the selected workspace.

#### A. Data Grid Columns (Project List)
*   **Project Name** (string display, e.g., `Greenfield Meadows`)
*   **Project Code** (string uppercase monospace, e.g., `GM`)
*   **Location** (string title text, e.g., `Sector 15, Gurgaon, HR`)
*   **RERA Number** (string format, e.g., `RERA/PR/10001/HR` or `N/A`)
*   **Approval Status** (Badge component: `APPROVED` [Emerald], `PENDING` [Amber], `REJECTED` [Red])
*   **Layout Count** (integer computation: computed count of layouts belonging to this project)
*   **Plot Count** (integer computation: computed count of plots linked to layouts of this project)
*   **Status** (Badge component: `ACTIVE` [Emerald], `PLANNING` [Blue], `COMPLETED` [Slate])
*   **Created Date** (date formatted `YYYY-MM-DD`)

#### B. Filter Inputs
*   **Location**: Select option matching unique locations in active records or dynamic search filter.
*   **Approval Status**: Dropdown select with values (`ALL`, `APPROVED`, `PENDING`, `REJECTED`).
*   **Status**: Dropdown select with values (`ALL`, `ACTIVE`, `PLANNING`, `COMPLETED`).

#### C. Detail View Layout
A side-by-side or sliding drawer inspector displaying:
*   **Basic Information**: Name, Code, Developer name, Location, and Status.
*   **Approval Information**: Approval Status, Authority, RERA validation, Launch date, and target Possession date.
*   **Layout Summary**: A concise tabular list of nested layouts containing layout name, code, type, total area, and plot count.
*   **Plot Summary**: Aggregate counters (e.g. Total Plots, Available, Reserved, Sold, Blocked) in compact visual widgets.

---

### 3.2 Layout Management UI

Coordinates structural zoning plans, subdivision phases, and zoning parameters.

#### A. Data Grid Columns (Layout List)
*   **Layout Name** (string text, e.g., `Meadows Phase A Sector 1`)
*   **Layout Code** (string uppercase, e.g., `SEC1`)
*   **Layout Type** (Badge component: `RESIDENTIAL` [Indigo], `COMMERCIAL` [Fuchsia], `MIXED_USE` [Orange], `INDUSTRIAL` [Cyan], `FARM_LAND` [Emerald])
*   **Measurement Unit** (string representation, e.g., `SQFT` or `SQM`)
*   **Total Area** (float value, e.g., `450,000.00` with the matching measurement unit code)
*   **Plot Count** (integer: number of plots assigned to this layout)
*   **Status** (Badge component: `DRAFT` [Slate], `APPROVED` [Blue], `LAUNCHED` [Emerald], `ARCHIVED` [Red])

#### B. Filter Inputs
*   **Project**: Dropdown select targeting the parent Project ID (`ALL` or option list).
*   **Layout Type**: Dropdown select targeting standard classifications (`ALL`, `RESIDENTIAL`, `COMMERCIAL`, `MIXED_USE`, `INDUSTRIAL`, `FARM_LAND`).
*   **Status**: Dropdown select targeting standard layout states (`ALL`, `DRAFT`, `APPROVED`, `LAUNCHED`, `ARCHIVED`).

#### C. Detail View Layout
*   **Layout Information**: Linked parent Project, layout name, code, phase parameters, and regulatory approval codes with timestamps.
*   **Area Information**: Total layout area, matching conversion metric multipliers, and normalization indicators relative to global SQFT.
*   **Plot Summary**: List of nested plots displaying plot numbers, area values, and real-time availability states.

---

### 3.3 Plot Management UI

Allows operational cataloging and state tracking of individual land parcel assets.

#### A. Data Grid Columns (Plot List)
*   **Plot Number** (string monospace, e.g., `Plot 401`)
*   **Area** (decimal formatting, e.g., `2,400.00`)
*   **Measurement Unit** (string representational badge, e.g., `SQFT`)
*   **Facing** (string face orientation direction, e.g., `NORTH`, `EAST`, `SOUTH`, `WEST`, `NORTHEAST`, `NORTHWEST`, `SOUTHEAST`, `SOUTHWEST`)
*   **Road Width** (decimal numeric formatting representing adjacent access roads, e.g., `40.00` m)
*   **Corner Plot** (indicative flag badge: `🎯 Corner` [Cyan] or `Standard`)
*   **Status** (solid badge component matching exactly one of the five required states):
    *   `AVAILABLE` (green badge)
    *   `RESERVED` (amber badge)
    *   `BOOKED` (blue badge)
    *   `SOLD` (dark slate badge)
    *   `BLOCKED` (red badge)

#### B. Filter Inputs
*   **Status**: Multi-value selector support or dropdown targeting the five core plot states (`AVAILABLE`, `RESERVED`, `BOOKED`, `SOLD`, `BLOCKED`).
*   **Facing**: Select menu matching primary orientation lines.
*   **Corner Plot**: Toggle/select choices (`ALL`, `YES`, `NO`).
*   **Area Range**: Range slider or numerical inputs (Minimum Area and Maximum Area).
*   **Road Width**: Range/numeric filter looking up minimum road widths.

#### C. Detail View Layout
*   **Plot Information**: Basic metrics (number, area, coordinates, dimensions `40 x 60` or equivalent).
*   **Facing, Dimensions, Road Width**: Core measurements and physical parameters.
*   **Extensible Custom Attributes**: Renders the complete, list-based parsing of the `plot_attributes` JSON key-value map.
    *   Custom attributes such as: `Park Facing`, `Clubhouse Facing`, `Lake Facing`, `Sea Facing`, `Premium Plot`, etc.
    *   Allows adding dynamic tag qualifiers to the attributes list without altering core DB structures.

---

## 4. Extensible Plot Attributes Schema

In order to meet requirements for arbitrary metadata support:
*   The system uses the `plot_attributes` JSONB representation (embedded structurally under `dimensions_metadata` or stored as a generic dynamic payload).
*   The UI displays these tags as customizable pills. Managers with write permissions can add custom tags directly in the editor (e.g. typing `"Lake Facing"` and pressing '+' to store `{ "type": "Lake Facing", "value": true }` in JSON).
*   These attributes are not hardcoded. The application queries the json-map keys dynamically and lists them.

---

## 5. Bulk Operations Engine

Administrators are equipped with high-throughput batch operations executed via the existing Laravel CRUD endpoints sequentially or concurrently:

1.  **Bulk Plot Create**:
    *   An interface matching a sequence pattern generator where users input:
        *   Target Layout ID.
        *   Scribing template: Plot Number Prefix (e.g., `B-`), Range Start (e.g., `101`), Range End (e.g., `110`).
        *   Unit Area value & Measurement Unit.
        *   Facing & Corner Flag.
    *   The frontend executes concurrent creations ensuring rapid population.
2.  **Bulk Plot Update**:
    *   Allows checking multiple rows on the Plot ledger.
    *   Updates properties like Area, Facing, or Road Width simultaneously.
3.  **Bulk Plot Status Update**:
    *   Allows checking multiple plots on the ledger and updating their statuses simultaneously to: `AVAILABLE`, `RESERVED`, `BOOKED`, `SOLD`, `BLOCKED`.

---

## 6. Route-Based Authorization (RBAC) Enforcers

The UI leverages standard client-side auth checks mapping directly to backend authorization layers:
*   `projects.view` / `projects.manage`
*   `layouts.view` / `layouts.manage`
*   `plots.view` / `plots.manage`

If permission is omitted, edit/creation modals are disabled, and list actions are hidden or made read-only.

---

## 7. Audit Logs Integration

Every lifecycle action is registered to ensure comprehensive auditing:
*   Emits Audit entries on: `CREATE`, `UPDATE`, `DELETE`, and `BULK_UPDATE`.
*   Includes exact payload parameters (`oldValues`, `newValues`) and operator IDs.

---

## 8. Pagination System

To prevent memory leaks and maintain clean rendering:
*   React client-side sorting and page-splicing are configured across Project, Layout, and Plot lists.
*   Adjustable page limits (e.g., 5, 10, or 25 records per page) with interactive Next/Prev pagination numbers.
