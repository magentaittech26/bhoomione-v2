# Module: Plots

## 1. Purpose
The Plots module manages the individual real estate parcel lots (plots) that constitute a subdivision layout. It tracks acreage, pricing, premium indicators, and transactional availability.

---

## 🗄️ Database Tables
* `plots`: Stores plot numbers, dimensions, base price, specific premiums, coordinates geometries, and transactional status (`AVAILABLE`, `RESERVED`, `SOLD`).

---

## 🛣️ API Endpoints
* `GET /api/v1/plots`: Query and list Plots (Supports searching by layout_id, status, or plot number).
* `GET /api/v1/plots/{id}`: View singular Plot parameters.
* `POST /api/v1/plots`: Define manual Plot entry.
* `PUT /api/v1/plots/{id}`: Modify Availability or Pricing constraints.
* `DELETE /api/v1/plots/{id}`: Delete Plot boundaries.

---

## 🔐 Permissions
* `plots.view`: Authorized to browse plot catalogs.
* `plots.manage`: Full administrative access to alter pricing or lock availability states.

---

## 🔌 Dependencies
* **Layouts module**: Individual plots must reference a parent Layout drawing record.

---

## 🚦 Current Status
* **Status**: **Production Ready**
* **Completion %**: 100%

---

## 🛣️ Future Roadmap
* Implement automated pricing modifiers based on geographic proximity to roads or premium corners parsed from CAD layer attributes.
