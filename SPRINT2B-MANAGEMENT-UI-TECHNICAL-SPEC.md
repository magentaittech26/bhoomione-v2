# SPRINT 2B: MULTI-TENANT INVENTORY MANAGEMENT UI TECHNICAL SPECIFICATION

This specification outlines the React-based multi-tenant user interface design, state architecture, and client-side integration models for **Project**, **Layout**, and **Plot** management. This UI interacts exclusively with the production-intended **Laravel Backend API V1** endpoints under strict Role-Based Access Control (RBAC) validations.

---

## 1. Architectural Scope & Exclusions

In alignment with core security constraints, Sprint 2B is restricted to administrative and operational inventory CRUD workflows. The following vectors are **explicitly excluded**:
*   **No GIS / Spatial Viewer Integration** (no Leaflet, Mapbox, or OpenLayers setups).
*   **No Interactive DXF or CAD Layout Import Engines**.
*   **No SVG Map Layout Hotspot Renderers**.
*   **No Marketplace Listings, Booking Engines, or External Consumer Inquiries**.
*   **No Customer Payment Collections or Financial Installment Planners**.

---

## 2. API Endpoint Mapping Contract

The frontend React client communicates with the Laravel backend through standard JSON-REST request headers. All inventory requests must transmit:
1.  `Authorization: Bearer <JWT_TOKEN>` for session identification.
2.  `X-Tenant-ID: <UUID>` for strict tenant database partitioning.

| Interface Component | HTTP Verb | Target Endpoint | Enforced Permission |
| :--- | :--- | :--- | :--- |
| **Project Ledger** | `GET` | `/api/v1/projects` | `projects.view` |
| **Project Details** | `GET` | `/api/v1/projects/{id}` | `projects.view` |
| **Project Creation** | `POST` | `/api/v1/projects` | `projects.manage` |
| **Project Editing** | `PUT` | `/api/v1/projects/{id}`| `projects.manage` |
| **Project Deletion** | `DELETE` | `/api/v1/projects/{id}`| `projects.manage` |
| **Layout Ledger** | `GET` | `/api/v1/layouts` | `layouts.view` |
| **Layout Details** | `GET` | `/api/v1/layouts/{id}` | `layouts.view` |
| **Layout Creation** | `POST` | `/api/v1/layouts` | `layouts.manage` |
| **Layout Editing** | `PUT` | `/api/v1/layouts/{id}`| `layouts.manage` |
| **Layout Deletion** | `DELETE` | `/api/v1/layouts/{id}`| `layouts.manage` |
| **Plot Ledger** | `GET` | `/api/v1/plots` | `plots.view` |
| **Plot Details** | `GET` | `/api/v1/plots/{id}` | `plots.view` |
| **Plot Creation** | `POST` | `/api/v1/plots` | `plots.manage` |
| **Plot Editing** | `PUT` | `/api/v1/plots/{id}` | `plots.manage` |
| **Plot Deletion** | `DELETE` | `/api/v1/plots/{id}` | `plots.manage` |

---

## 3. Visual Components & Layout Structures

The unified management interface is structured as a responsive, desktop-first workspace with clean tabbed navigation containing three distinct dashboards:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BhoomiOne V2 ERP Core - Inventory Workspace                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ Projects Panel ]         [ Layouts Panel ]         [ Plots Panel ]       │
├─────────────────────────────────────────────────────────────────────────────┤
│  🔍 Search by code or title...             [ Status Filter: ALL ▾ ]  [+ Add]│
├─────────────────────────────────────────────────────────────────────────────┤
│  ID    | Name             | Code  | Location          | Status    | Actions │
│  ──────┼──────────────────┼───────┼───────────────────┼───────────┼──────── │
│  #8801 | Greenfield       | GM    | Gurgaon Sector 15 | ACTIVE  ● | [✎] [🗑]│
│  #8802 | Royal Serenity   | RSE   | Dehradun Road     | PLANNING● | [✎] [🗑]│
├─────────────────────────────────────────────────────────────────────────────┤
│  显示 1-2 / 共 2 条记录                                   ◀ 前页  [1]  后页 ▶│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. UI Module Specifications

### 4.1 Project Management View (`ProjectManagerView`)

Provides full life-cycle tracking of real estate infrastructure sites.

*   **List Views & Data Grids**:
    *   Columns: Developer Name, Project Title, Code, Location, RERA ID, Approval Authority, Possession Date, and Multi-color Status Badge (e.g., `PLANNING` [Amber], `ACTIVE` [Emerald], `COMPLETED` [Slate]).
    *   Inline click expansion to view connected Layouts and general metadata.
*   **Search & Multi-Filter Hooks**:
    *   Match text inputs against name, developer, and RERA strings.
    *   Dropdown filters for project status or regulatory approval state (`APPROVED`, `PENDING`, `REJECTED`).
*   **Administrative Actions**:
    *   **Create Project Modal**: Single-column structured form collecting validated names, codes, locations, dates, and dynamic approval JSON hashes.
    *   **Edit Project Modal**: Performs incremental updating mapped back to `PUT /api/v1/projects/{id}`.
    *   **Safety Lock Delete Dialog**: Requires manual entry of the project's abbreviated code (e.g., `GM`) to execute irreversible cascade-deletion.

---

### 4.2 Layout Management View (`LayoutManagerView`)

Coordinates the categorization of physical zoning structures, mapping nested subdivisions.

*   **List Views & Data Grids**:
    *   Columns: Layout Name, Project Attachment, Unique Code, Design Type (e.g., `RESIDENTIAL` [Indigo], `COMMERCIAL` [Fuchsia]), Approval Reference Code, Dynamic Sizing with Area Multiplier, and Status Badge (`DRAFT`, `APPROVED`, `LAUNCHED`, `ARCHIVED`).
*   **Operational Filters**:
    *   Dropdown selection targeting a parent Project ID.
    *   Toggle selectors for layout design classifications.
*   **Administrative Actions**:
    *   **Create/Edit Layout Modal**: Fits entry parameters together with validation requirements. Generates automatic unit conversions based on a relational dropdown populating fields from `measurement_units` (e.g. `SQFT`, `SQM`, `ACRE`).
    *   **Cascading Deletion Warnings**: Warns active users regarding how many connected individual plots will be affected upon layout liquidation.

---

### 4.3 Plot Management View (`PlotManagerView`)

Implements granular tracking parameters across land parcel metrics.

*   **List Views & Data Grids**:
    *   Columns: Plot Number, Parent Layout, Length × Width (dimensions banner), Total Net Value in Units, Corner Plot Flag, Road Width, Facing direction (North, Northeast etc.), Status Badge (`AVAILABLE` [Emerald], `RESERVED` [Cyan], `SOLD` [Slate]).
*   **Operational Filters**:
    *   Cascade-selection filtering: Select Project ➔ Filter Layouts dropdown ➔ Query matching plot lists.
    *   Toggle fields to quickly locate corner plots or filter by specific face coordinates (e.g., East-facing).
*   **Administrative Actions**:
    *   **Plot Builder Forms**: Evaluates dimension metrics. Integrates checking rules ensuring the dynamic calculations match (length × width) standard square footage entries.
    *   Allows manual entry of Custom Fields through JSON string dictionaries to log unique land parameters (such as irregular shapes or trees over site).

---

## 5. Standard UI Interactions & State Management

Each dashboard panel implements robust React state architectures:

1.  **Strict Status Badges & Colors**: Map status arrays directly to theme classifications preventing hardcoded color discrepancies.
2.  **Optimistic UI Updates with Error Fallbacks**: Performs local array insertions on addition, falling back safely to re-fetching queries if server validation throws errors.
3.  **Permissions Verification Hooks (`hasPermission('permission')`)**:
    *   Gracefully disables create/edit/delete buttons if user roles omit logical access levels (e.g. rendering a read-only icon or locking input states).
4.  **Backend Pagination Controls**:
    *   Stores `page`, `per_page`, sorting criteria and search strings directly in React context models to coordinate seamless server-side paginations during navigation.
5.  **Audit Event Triggers**:
    *   Any backend mutation executes a persistent activity logger, reporting details transparently to administrators inside system-wide audit pages, guaranteeing security visibility.
