# Database Naming Standards

BhoomiOne maintains standard SQL naming conventions to ensure consistency, clean schema updates, and auto-discoverable Eloquent models.

---

## 📏 Naming Conventions Registry

### 1. Database Tables
* **Standard**: Plural, lowercase, underscore separated (`snake_case`).
* **Examples**: `projects`, `layouts`, `layout_geo_references`, `plots`.

### 2. Table Columns
* **Standard**: Singular, lowercase, underscore separated (`snake_case`).
* **Examples**: `tenant_id`, `layout_id`, `anchor_1_dxf_x`, `svg_document`.
* **Primary Key**: Always named `id` as a UUID primary key.

### 3. Indexes
* **Standard**: Prefixed with `idx_` followed by the table name and the target columns separated by underscores.
* **Examples**: `idx_projects_tenant_id`, `idx_layouts_project_id`.

### 4. Foreign Keys
* **Standard**: Table singular name suffixed with `_id`.
* **Examples**: `project_id` reference on `layouts` table pointing to `projects(id)`.

### 5. Eloquent Models
* **Standard**: Singular PascalCase, matching the plural database table.
* **Examples**: Model `Layout` relates to table `layouts`. Model `LayoutGeoReference` relates to table `layout_geo_references`.
