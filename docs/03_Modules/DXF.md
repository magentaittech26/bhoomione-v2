# Module: DXF Ingestion Engine

## 1. Purpose
The DXF Ingestion Engine parses surveyor Autodesk CAD drawings (DXF format) into geometric databases. This replaces manual vector digitization, generating clean visual SVGs and database entities.

---

## 🗄️ Database Tables
* `dxf_files`: Stores temporary CAD file uploads.
* `geometry_entities`: Extracted raw geometric vertices, lines, polylines, and circles.
* `dxf_layer_mappings`: Mapping structures associating CAD layers with platform registers (e.g. `ROAD` or `PLOT`).

---

## 🛣️ API Endpoints
* `POST /api/v1/dxf/upload`: Accept raw CAD DXF uploads and initialize parsing jobs.
* `GET /api/v1/dxf/jobs`: Track extraction logs and job statuses.
* `POST /api/v1/dxf/layer-map`: Configure CAD layer association boundaries.
* `POST /api/v1/dxf/auto-generate`: Run automatic plot generation algorithms from mapped layer shapes.

---

## 🔐 Permissions
* `layouts.manage`: Upload files and configure CAD parsers.

---

## 🔌 Dependencies
* **Commercial Gating**: DXF Ingest is restricted to `Growth` and higher subscription tiers.

---

## 🚦 Current Status
* **Status**: **Production Ready**
* **Completion %**: 100%

---

## 🛣️ Future Roadmap
* Support parsing of curved Bezier vectors into straight segment approximation vertices.
