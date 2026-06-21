# BhoomiOne V2: Sprint 2A - Project, Layout, and Plot Coordination Technical Specification

**Document Identification**: SPRINT2A-PROJECT-LAYOUT-PLOT-TECHNICAL-SPEC  
**Authoritative Scope**: Laravel-Native Multi-Tenant Inventory Control Engine (Projects, Layouts, Plots)  
**Version**: 1.1  
**Target Framework**: Laravel 12.x + PostgreSQL 16+  
**Status**: Approved (Updates for Extended Property Attributes Included)

---

## 1. Core Engineering Directive & Scope Boundaries

This architectural specification details the multi-tenant real estate physical inventory representation (Projects, Layouts, Plots) within the BhoomiOne V2 platform. To prevent engineering over-reach and maintain high compliance with security standards, the implementation is strictly constrained to standard CRUD operations.

### 🛑 Strict Negative Constraints (Prohibited Features):
* **No GIS/Mapping Engine**: No geo-spatial extensions, coordinate mapping, shapefile uploads, or postgis dependencies.
* **No CAD/Vector Decoders**: No DXF, SVG, or vector ingestion parsers.
* **No Map Viewer / Interactive Canvas**: No visual plot selection grids, interactive floor plans, or responsive canvas stages.
* **No Marketplace Publishing**: No external public portal publishing controllers.
* **No Booking or Ledger Integrations**: No financial checkout gates, token drafts, reservation holds, or billing logs (to be introduced in downstream modules).

---

## 2. Multi-Tenant Relational Database Schema

Inventory assets are tightly coupled with the active **Tenant Context** (`tenant_id`) ensuring strict data isolation across separate developers.

```
       +---------------------------------------------+
       |                  tenants                    |
       +----------------------+----------------------+
                              | (1)
                              |
                              v (N)
       +----------------------+----------------------+
       |                  projects                   |
       +----------------------+----------------------+
                              | (1)
                              |
                              v (N)
       +----------------------+----------------------+
       |                  layouts                    |
       +----------------------+----------------------+
                              | (1)
                              |
                              v (N)
       +----------------------+----------------------+
       |                   plots                     |
       +---------------------------------------------+
```

### 2.1 Table Schema Blueprint

#### A. Table: `measurement_units` (Reference Dimension Contexts)
Represents the system-supported standards for dimensional land quantification.
```sql
CREATE TABLE measurement_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'SQ_METERS', 'SQ_FEET', 'ACRES', 'GUNTHA'
    name VARCHAR(100) NOT NULL,       -- e.g. 'Square Meters', 'Square Feet'
    conversion_to_sqft DECIMAL(18, 8) NOT NULL, -- Standard relative scaling factor to SQFT for calculation references
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### B. Table: `projects` (Parent Strategic Development Container)
Tied directly to the tenant's security workspace.
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL, -- Short unique key suffix used in document prefixes
    developer_name VARCHAR(255) NOT NULL, -- Developer company name under this project scope
    location VARCHAR(255) NOT NULL, -- Textual geographical position description
    status VARCHAR(50) NOT NULL DEFAULT 'PLANNING', -- 'PLANNING', 'ACTIVE', 'COMPLETED', 'ON_HOLD'
    rera_number VARCHAR(100) NULL, -- RERA Registration identifier number
    approval_status VARCHAR(100) NULL, -- Legislative/regulatory zoning status (e.g., APPROVED, PENDING, NONE)
    approval_authority VARCHAR(255) NULL, -- Public planning authority body name
    launch_date DATE NULL, -- Date the development represents public launching
    possession_target_date DATE NULL, -- Target hand-over buffer schedule line
    approvals_metadata JSONB DEFAULT '{}'::jsonb, -- Store list of building/safety approvals & codes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (tenant_id, code)
);
```

#### C. Table: `layouts` (Sectoral and Planning Phase sub-folders)
Tied directly to projects, using specialized unit standards.
```sql
CREATE TABLE layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL, -- Suffix code representing the sector/layout partition
    layout_type VARCHAR(50) NOT NULL DEFAULT 'RESIDENTIAL', -- 'RESIDENTIAL', 'COMMERCIAL', 'MIXED_USE', 'INDUSTRIAL', 'FARM_LAND'
    approval_number VARCHAR(150) NULL, -- Layout plan physical clearance index
    approval_date DATE NULL, -- Official authorization seal timestamp date
    total_area_value DECIMAL(16, 4) NULL, -- Aggregate cumulative surface layout dimension size
    total_area_unit_id UUID NULL REFERENCES measurement_units(id) ON DELETE RESTRICT,
    measurement_unit_id UUID NOT NULL REFERENCES measurement_units(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'APPROVED', 'LAUNCHED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (project_id, code)
);
```

#### D. Table: `plots` (Physical Transactional Units)
```sql
CREATE TABLE plots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id UUID NOT NULL REFERENCES layouts(id) ON DELETE CASCADE,
    plot_number VARCHAR(100) NOT NULL,
    area_value DECIMAL(12, 4) NOT NULL, -- Numerical quantity representing dimension size
    measurement_unit_id UUID NOT NULL REFERENCES measurement_units(id) ON DELETE RESTRICT,
    length DECIMAL(10, 2) NULL, -- Single boundary segment dimensions (e.g. 40ft)
    width DECIMAL(10, 2) NULL, -- Opposite perpendicular offset segment dimensions (e.g. 60ft)
    road_width DECIMAL(6, 2) NOT NULL DEFAULT 0.00, -- Width of front road in meters or feet
    corner_plot BOOLEAN NOT NULL DEFAULT FALSE, -- Indicator if the plot is positioned at block intersections
    facing VARCHAR(50) NOT NULL DEFAULT 'NORTH', -- 'NORTH', 'SOUTH', 'EAST', 'WEST', 'NORTHEAST', 'NORTHWEST', 'SOUTHEAST', 'SOUTHWEST'
    dimensions VARCHAR(100) NOT NULL, -- Raw dimensions text e.g. "40 x 60", "30 x 50"
    dimensions_metadata JSONB DEFAULT '{}'::jsonb, -- Complex shape segmentation maps/details dictionary
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE', -- MUST BE: 'AVAILABLE', 'RESERVED', 'BOOKED', 'SOLD', 'BLOCKED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (layout_id, plot_number)
);
```

---

## 3. Unit-Agnostic Dimensional Calculations

The BhoomiOne platform does not enforce or assume **SQFT** as the singular global standard. Area measurements and aggregates are mathematically resolved using relative factor values linked to the `measurement_units` registry.

### 3.1 Standard Mathematical Reference Conversions
To verify normalization across distinct inventory records, the default seed registers SQFT reference multipliers (`conversion_to_sqft` column):

* **`SQFT`**: `conversion_to_sqft` = `1.00000000`
* **`SQM`**: `conversion_to_sqft` = `10.76391042`
* **`ACRE`**: `conversion_to_sqft` = `43560.00000000`
* **`GUNTHA`**: `conversion_to_sqft` = `1089.00000000`
* **`BIGHA`**: `conversion_to_sqft` = `27000.00000000`

### 3.2 Dynamic Calculation Formula Implementation
Any plot dimension area can be dynamically normalized or aggregated across disparate sibling records or nested layouts by converting input values into standard SQFT index first, then converting outward to any target unit representation:

$$Sqft\_Equivalent = Input\_Area \times Source\_Conversion\_Factor$$
$$Target\_Unit\_Value = \frac{Sqft\_Equivalent}{Target\_Conversion\_Factor}$$

---

## 4. Laravel HTTP Endpoints & Validation Rules

All endpoints reside under the `/api/v1` namespace and are protected by multi-tenant RBAC permissions. They expect request payloads to match standard schema JSON forms and validate key attributes.

### 4.1 Project Coordination API

#### GET `/api/v1/projects`
* **Requirement**: `projects.view`
* **Payload**: Query params search/filters (e.g., `?status=ACTIVE`).
* **Output**: `200 OK` structure containing list of project records.

#### POST `/api/v1/projects`
* **Requirement**: `projects.manage`
* **Validate Rules**:
  ```php
  [
      'name' => 'required|string|max:255',
      'code' => 'required|string|max:100',
      'developer_name' => 'required|string|max:255',
      'location' => 'required|string|max:255',
      'status' => 'nullable|string|in:PLANNING,ACTIVE,COMPLETED,ON_HOLD',
      'rera_number' => 'nullable|string|max:100',
      'approval_status' => 'nullable|string|max:100',
      'approval_authority' => 'nullable|string|max:255',
      'launch_date' => 'nullable|date',
      'possession_target_date' => 'nullable|date',
      'approvals_metadata' => 'nullable|array',
  ]
  ```
* **Output**: `201 CREATED` with full resource payload.

#### GET `/api/v1/projects/{id}`
* **Requirement**: `projects.view`
* **Output**: `200 OK` or `404 NotFound` details.

#### PUT `/api/v1/projects/{id}`
* **Requirement**: `projects.manage`
* **Validate Rules**: Similar to create, but with ID exclusions.
* **Output**: `200 OK` updated instance.

#### DELETE `/api/v1/projects/{id}`
* **Requirement**: `projects.manage`
* **Output**: `204 No Content` (Strict constraint cascade checks apply).

---

### 4.2 Layout Planning API

#### GET `/api/v1/layouts`
* **Requirement**: `layouts.view`
* **Output**: `200 OK` list index nested under project parameter scope boundaries.

#### POST `/api/v1/layouts`
* **Requirement**: `layouts.manage`
* **Validate Rules**:
  ```php
  [
      'project_id' => 'required|uuid|exists:projects,id',
      'name' => 'required|string|max:255',
      'code' => 'required|string|max:100',
      'layout_type' => 'required|string|in:RESIDENTIAL,COMMERCIAL,MIXED_USE,INDUSTRIAL,FARM_LAND',
      'approval_number' => 'nullable|string|max:150',
      'approval_date' => 'nullable|date',
      'total_area_value' => 'nullable|numeric|min:0.0',
      'total_area_unit_id' => 'nullable|uuid|exists:measurement_units,id',
      'measurement_unit_id' => 'required|uuid|exists:measurement_units,id',
      'status' => 'nullable|string|in:DRAFT,APPROVED,LAUNCHED',
  ]
  ```
* **Output**: `201 Created`.

#### PUT `/api/v1/layouts/{id}`
* **Requirement**: `layouts.manage`
* **Validate Rules**: Update-safe verification checklist.
* **Output**: `200 OK`.

#### DELETE `/api/v1/layouts/{id}`
* **Requirement**: `layouts.manage`
* **Output**: `204 No Content`.

---

### 4.3 Plot Roster Management API

#### GET `/api/v1/plots`
* **Requirement**: `plots.view`
* **Output**: `200 OK` with search index filters (e.g., filtering `?status=AVAILABLE`).

#### POST `/api/v1/plots`
* **Requirement**: `plots.manage`
* **Validate Rules**:
  ```php
  [
      'layout_id' => 'required|uuid|exists:layouts,id',
      'plot_number' => 'required|string|max:100',
      'area_value' => 'required|numeric|min:0.0001',
      'measurement_unit_id' => 'required|uuid|exists:measurement_units,id',
      'length' => 'nullable|numeric|min:0.0',
      'width' => 'nullable|numeric|min:0.0',
      'road_width' => 'required|numeric|min:0.00',
      'corner_plot' => 'required|boolean',
      'facing' => 'required|string|in:NORTH,SOUTH,EAST,WEST,NORTHEAST,NORTHWEST,SOUTHEAST,SOUTHWEST',
      'dimensions' => 'required|string|max:100',
      'dimensions_metadata' => 'nullable|array',
      'status' => 'nullable|string|in:AVAILABLE,RESERVED,BOOKED,SOLD,BLOCKED',
  ]
  ```
* **Output**: `201 Created`.

#### PUT `/api/v1/plots/{id}`
* **Requirement**: `plots.manage`
* **Validate Rules**: Supports modifying status transitions or basic formatting attributes safely.
* **Output**: `200 OK`.

#### DELETE `/api/v1/plots/{id}`
* **Requirement**: `plots.manage`
* **Output**: `204 No Content`.

---

## 5. Security & Role Assignment Profile

Access is fully database-driven, resolving dynamic assignments in real-time from relations without hardcoded checks.

| Role Code | `projects.view` | `projects.manage` | `layouts.view` | `layouts.manage` | `plots.view` | `plots.manage` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`PLATFORM_ADMIN`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| **`PLATFORM_SUPPORT`**| ✔ | ❌ | ✔ | ❌ | ✔ | ❌ |
| **`DEVELOPER_OWNER`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| **`DEVELOPER_ADMIN`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| **`PROJECT_MANAGER`** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| **`SALES_MANAGER`**   | ✔ | ❌ | ✔ | ❌ | ✔ | ❌ |
| **`SALES_EXECUTIVE`** | ✔ | ❌ | ✔ | ❌ | ✔ | ❌ |
| **`AGENT`**           | ✔ | ❌ | ✔ | ❌ | ✔ | ❌ |
| **`CUSTOMER`**        | ✔ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 6. Audit Logs Logging Strategy

All structural changes to inventory records emit immutable transactions saved under the `audit_logs` record structure:

* **Event Type**: `PROJECT_CREATE`  
  *Context parameters captured*: Raw project model payload.
* **Event Type**: `LAYOUT_DELETE`  
  *Context parameters captured*: Full layout profile with cascade dependencies logged as soft JSON details.
* **Event Type**: `PLOT_STATUS_UPDATE`  
  *Context parameters captured*: Log previous status versus new status transition details (e.g., `AVAILABLE` $\rightarrow$ `RESERVED`).

---

## 7. Next Steps & Implementation Pipeline

At the conclusion of the review phase, once the specification receives approval:
1. Initialize the physical tables using isolated migration files.
2. Formulate model relationships (`Project.php`, `Layout.php`, `Plot.php` and `MeasurementUnit.php`).
3. Deploy API Route rules and dynamic Validation payloads.
4. Construct the physical CRUD simulators in dashboard views.
