# Module: Projects

## 1. Purpose
The Projects module manages the high-level grouping of subdivisions, housing sectors, or masterplanned assets belonging to a real estate developer (tenant). 

---

## 🗄️ Database Tables
* `projects`: Stores high-level metadata (project name, description, region, acreage, configuration) tied to a `tenant_id` UUID column.

---

## 🛣️ API Endpoints
* `GET /api/v1/projects`: List tenant's active Projects (Supports pagination and query params).
* `GET /api/v1/projects/{id}`: Detailed view of a single Project.
* `POST /api/v1/projects`: Create a new Project registry.
* `PUT /api/v1/projects/{id}`: Edit Project parameters.
* `DELETE /api/v1/projects/{id}`: Soft delete/cascade remove project elements.

---

## 🔐 Permissions
* `projects.view`: Browsing project details and listing.
* `projects.manage`: Create, edit, and delete actions.

---

## 🔌 Dependencies
* **Tenant Isolation**: Handled by the tenant routing context middleware.

---

## 🚦 Current Status
* **Status**: **Production Ready**
* **Completion %**: 100%

---

## 🛣️ Future Roadmap
* Integrate GIS boundary summary on the Projects index page to show acreage progress dynamically.
