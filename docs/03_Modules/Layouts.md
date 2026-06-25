# Module: Layouts

## 1. Purpose
The Layouts module registers layout drawings, maps, and drawings entities linked to developer projects. It stores programmatically computed SVG vector layouts generated from CAD.

---

## 🗄️ Database Tables
* `layouts`: Stores drawing metadata, active state, and the serialized `svg_document` text.

---

## 🛣️ API Endpoints
* `GET /api/v1/layouts`: List Layouts matching search queries.
* `GET /api/v1/layouts/{id}`: Detailed view of a Layout.
* `POST /api/v1/layouts`: Create Layout registry.
* `PUT /api/v1/layouts/{id}`: Edit Layout name.
* `DELETE /api/v1/layouts/{id}`: Remove Layout.

---

## 🔐 Permissions
* `layouts.view`: Browsing layout details.
* `layouts.manage`: Modify, upload, and delete layouts drawing schemas.

---

## 🔌 Dependencies
* **Projects module**: A layout must reside inside a valid, tenant-owned Project entity.

---

## 🚦 Current Status
* **Status**: **Production Ready**
* **Completion %**: 100%

---

## 🛣️ Future Roadmap
* Implement automated version control archiving previous CAD drawing SVG representations.
