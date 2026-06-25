# Current Phase: Phase 2A.2 — Georeference Laravel Migration

BhoomiOne has successfully completed the migration of the core georeferencing coordinate systems out of Express.js into the Laravel API backend, satisfying the target multi-tier architecture.

---

## 🚦 Phase Task Board

### ✅ Completed
* **Database Relocation**: Created Laravel schema migrations for high-precision decimal `layout_geo_references` table.
* **Algebraic Translation Port**: Ported 2D Conformal Similarity Transformation algorithms to `App\Services\GeoReferenceService` in PHP.
* **Tenant-Scoped API Controllers**: Implemented `LayoutGeoController` for status tracking, calibration configuration, and GeoJSON compiles.
* **SaaS Billing Alignment**: Gated all three georeferencing Laravel API endpoints under the `gis_maps` feature check with the `SubscriptionFeatureGate` middleware.
* **React API Client Adaption**: Configured `/src/lib/api.ts` to route map requests to the secure Laravel engine.
* **Express Clean Code**: Deprecated the Node.js legacy endpoints in comments to prevent server bloat.

### 🔄 In Progress
* **Professional Documentation Refactoring**: Restructuring the complete repository markdown files into a unified Enterprise Software Documentation System.
* **Documentation Health Analysis**: Performing logical validations to eliminate conflicting instructions or overlapping architectures.

### ⏳ Pending & Upcoming
* **Interactive Google Maps Layer UI**: Building the frontend maps panel using `@googlemaps/js-api-loader` inside React.
* **Multi-Provider UI Selector**: Adding Leaflet and MapLibre switching interfaces on the client side.
* **Satellite Overlay Layer**: Integrating high-definition aerial satellite imagery layers dynamically mapped to the georeferenced CAD grid.

### 🚫 Blocked
* *No current tasks are blocked.*

---

## ⚠️ Known Issues & Technical Debts
1. **Unused Table Cleanliness**: The legacy `layout_geo_references` table created by Node bootstrap (`server/db/bootstrap.ts`) still resides in the active database. Once the migration has been validated in the staging environment, the Node bootstrap table generation should be safely removed.
2. **CAD Extraction Fallbacks**: While the GeoJSON endpoint compiles real database vectors, it returns a message warning if there are no CAD elements found, instead of crashing. This is a resilient behavior, but layout surveyors must verify they map their CAD layers properly.

---

## 🗓️ Next Sprint Objectives (Sprint 4B/4C)
* **Buyer Portal Downpayment Engine**: Implementing transactional Stripe flows for plot reservation holds.
* **Public Inventory Share**: Setting up public sharing tokens allowing anonymous users to browse active layout availabilities.
