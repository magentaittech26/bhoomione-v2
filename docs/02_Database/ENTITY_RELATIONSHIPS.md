# Entity Relationships Schema

This document maps the primary relational models, foreign relationships, and core table definitions within the BhoomiOne system.

---

## 🔗 Logical ER Diagram

```
       +-----------------------+
       |        tenants        |
       +-----------------------+
                  || 1
                  ||
                  || M
       +-----------------------+
       |       projects        |
       +-----------------------+
                  || 1
                  ||
                  || M
       +-----------------------+
       |        layouts        |
       +-----------------------+
                  || 1
                  || 
                  || 1
       +-----------------------+
       | layout_geo_references |
       +-----------------------+
                  || 1
                  ||
                  || M
       +-----------------------+
       |         plots         |
       +-----------------------+
```

---

## 📝 Core Schema Definitions

### 1. `tenants` Table
* **`id`** (UUID, Primary Key): Tenant Unique Identifier.
* **`name`** (VARCHAR): Developer Organization Name.
* **`domain`** (VARCHAR, Unique): Configured sub-domain mapping.
* **`status`** (VARCHAR): Workspace Status (`ACTIVE`, `SUSPENDED`).

### 2. `projects` Table
* **`id`** (UUID, Primary Key): Project Unique Identifier.
* **`tenant_id`** (UUID, Foreign Key): Linked to `tenants.id`.
* **`name`** (VARCHAR): Project name.
* **`description`** (TEXT): Project parameters details.

### 3. `layouts` Table
* **`id`** (UUID, Primary Key): Layout Unique Identifier.
* **`project_id`** (UUID, Foreign Key): Linked to `projects.id` with Cascade Delete.
* **`name`** (VARCHAR): Layout drawing identifier.
* **`svg_document`** (TEXT): Programmatically generated raw SVG elements.

### 4. `layout_geo_references` Table
* **`id`** (UUID, Primary Key): Georeference configuration identifier.
* **`tenant_id`** (UUID): Tenant scope identifier.
* **`layout_id`** (UUID, Unique, Foreign Key): Linked to `layouts.id` with Cascade Delete.
* **`anchor_1_dxf_x`, `anchor_1_dxf_y`** (DECIMAL): First local Cartesian point.
* **`anchor_1_lat`, `anchor_1_lng`** (DECIMAL): First geodetic mapping.
* **`anchor_2_dxf_x`, `anchor_2_dxf_y`** (DECIMAL): Second local Cartesian point.
* **`anchor_2_lat`, `anchor_2_lng`** (DECIMAL): Second geodetic mapping.
* **`transform_matrix`** (JSONB): Solved Similarity Transformation parameters ($A, B, C_x, C_y$).

### 5. `plots` Table
* **`id`** (UUID, Primary Key): Individual plot identifier.
* **`layout_id`** (UUID, Foreign Key): Linked to `layouts.id` with Cascade Delete.
* **`plot_no`** (VARCHAR): Cadastral plot reference code.
* **`area`** (DECIMAL): Surface area measurement.
* **`status`** (VARCHAR): Availability status (`AVAILABLE`, `RESERVED`, `SOLD`).
* **`base_price`** (DECIMAL): Numeric starting base price.
