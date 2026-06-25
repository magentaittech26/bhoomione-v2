# Platform API Routes Specification

This document maps the standard endpoints, allowed HTTP methods, parameter keys, and RBAC requirements of the BhoomiOne REST system.

---

## 🏗️ Core API Endpoints Directory

### 📂 Projects Register
* **`GET /projects`** | Permission: `projects.view`
  * Lists tenant projects. Supports pagination (`?page=1&per_page=15`).
* **`GET /projects/{id}`** | Permission: `projects.view`
  * Retrieve detailed specifications for a single project.
* **`POST /projects`** | Permission: `projects.manage`
  * Create a new project registry.
* **`PUT /projects/{id}`** | Permission: `projects.manage`
  * Modify existing project metadata attributes.
* **`DELETE /projects/{id}`** | Permission: `projects.manage`
  * Soft delete or Cascade remove project entities.

### 📂 Layouts drawings
* **`GET /layouts`** | Permission: `layouts.view`
  * List CAD drawings linked to active projects.
* **`GET /layouts/{id}`** | Permission: `layouts.view`
  * Retrieve layout specific parameters and raw SVGs data.
* **`POST /layouts`** | Permission: `layouts.manage`
  * Register layout entities under projects.

### 📂 GIS Map Transformations
* **`GET /layouts/{id}/geo-status`** | Permission: `layouts.view` | Feature Gate: `gis_maps`
  * Check if layout coordinate reference anchors are configured.
* **`POST /layouts/{id}/geo-reference`** | Permission: `layouts.manage` | Feature Gate: `gis_maps`
  * Save surveyor coordinates anchor points and compute transformation matrix.
* **`GET /layouts/{id}/geojson`** | Permission: `layouts.view` | Feature Gate: `gis_maps`
  * Export layout CAD geometry elements transformed to standard WGS84 coordinates.
