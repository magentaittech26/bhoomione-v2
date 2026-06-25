# Platform Changelog

This document logs significant architectural changes, security hardeners, and module ports.

---

## 🚀 [v2.2.0] — 2026-06-25
### Added
* Fully functional high-precision coordinate transformation model (`App\Services\GeoReferenceService`) inside Laravel.
* Created tenant-scoped endpoints in Laravel:
  * `GET /api/v1/layouts/{id}/geo-status`
  * `POST /api/v1/layouts/{id}/geo-reference`
  * `GET /api/v1/layouts/{id}/geojson`
* Integrated `layout_geo_references` migration schemas in Laravel with Cascade delete parameters.
* Commercial billing gate middleware restriction (`SubscriptionFeatureGate:gis_maps`) for georeferencing controllers.

### Changed
* Updated the React API client `/src/lib/api.ts` to consume the newly added Laravel routes, removing legacy node calls.
* Marked legacy Express georeferencing endpoints as `@deprecated` inside `/server/routes/inventory.ts`.

---

## 🚀 [v2.1.0] — 2026-06-18
### Added
* Developed three-stage CAD parsing pipeline (DXF parsing, Geometry extraction, Layer mapping).
* Dynamic SVG builders on the server, serializing geometry entities to clean vector paths.
* Developed client-side `InteractiveLayoutViewer` canvas supporting click and zoom matrix translations.

---

## 🚀 [v1.5.0] — 2026-06-02
### Added
* Implemented multi-tenant workspace routing, mapping standard domains and headers parameters.
* Dynamic subscriptions plan modifiers and plan-tiers (`Starter`, `Growth`, `Enterprise`).
* Built fine-grained RBAC trees validating permissions across Laravel controllers.
