# Module: GIS (Geographic Information Systems)

## 1. Purpose
The GIS module georeferences surveyor drawings to real-world coordinates, allowing layouts to overlay onto standard mapping systems (Google Maps, Leaflet) using 2D Conformal Similarity Transformations.

---

## 🗄️ Database Tables
* `layout_geo_references`: Stores coordinate anchor pairs and the solved transformation matrix parameters.

---

## 🛣️ API Endpoints
* `GET /api/v1/layouts/{id}/geo-status`: Retrieve Georeference configuration status.
* `POST /api/v1/layouts/{id}/geo-reference`: Configure anchor point pairs and solve the transformation matrix.
* `GET /api/v1/layouts/{id}/geojson`: Compile calibrated geometry elements and return valid WGS84 GeoJSON data.

---

## 🔐 Permissions
* `layouts.view`: Browse layout georeferencing status and pull GeoJSON models.
* `layouts.manage`: Execute anchor point coordinate saves and matrix recalibrations.

---

## 🔌 Dependencies
* **Commercial Gating**: Endpoints are gated under the premium `gis_maps` feature check.
* **Layouts module**: Relies on a valid Layout structure.

---

## 🚦 Current Status
* **Status**: **Testing & Verification**
* **Completion %**: 90%

---

## 🛣️ Future Roadmap
* Integrate dynamic satellite image overlays directly within the React layout designer view.
