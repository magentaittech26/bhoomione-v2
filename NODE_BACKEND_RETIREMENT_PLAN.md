# Node.js Express Backend Retirement Plan

This document establishes the strategic, multi-step retirement and decommissioning plan for the temporary Node.js/Express server (`server.ts`, `server/routes/*`, `dist/server.cjs`). 

---

## 1. Node.js Endpoint Classifications

We categorize all existing Express-based routes into three distinct operational states to manage the transition to Laravel 12.

### A. MIGRATED_AND_VERIFIED (Route Ownership Transferred to Laravel)
These endpoints have full feature parity, validation coverage, and multi-tenant security implemented in Laravel 12 and are active in production.

- **Measurement Units Master Module**:
  - `GET /api/v1/measurement-units` (Migrated to `MeasurementUnitController@index`)
  - `GET /api/v1/measurement-units/lookup` (Migrated to `MeasurementUnitController@lookup`)
  - `GET /api/v1/measurement-units/:id` (Migrated to `MeasurementUnitController@show`)
  - `POST /api/v1/measurement-units` (Migrated to `MeasurementUnitController@store`)
  - `PUT /api/v1/measurement-units/:id` (Migrated to `MeasurementUnitController@update`)
  - `DELETE /api/v1/measurement-units/:id` (Migrated to `MeasurementUnitController@destroy`)
- **Projects/Layouts Engine**:
  - `GET /api/v1/projects` (Migrated to `ProjectController@index`)
  - `POST /api/v1/projects` (Migrated to `ProjectController@store`)
  - `GET /api/v1/layouts` (Migrated to `LayoutController@index`)
  - `POST /api/v1/layouts` (Migrated to `LayoutController@store`)

### B. TEMPORARY_STUB_ONLY (Temporary / Development Stubs)
These represent non-authoritative developer stubs or simulation tools that must be retired as Laravel's native queues and event schedulers expand.

- **Mock Billing / Simulation Engine**:
  - `POST /api/v1/billing-simulation` (Scheduled for direct decommission; native billing logic is handled by Laravel SaaS modules and invoices)
- **Local CAD Parser Mock**:
  - `POST /api/v1/cad-parse-mock` (To be retired; real DXF parsing is managed by `DxfController` in Laravel via database CAD geometry tables)

### C. DEPRECATED (Obsolete Endpoints)
These endpoints are obsolete, no longer called by any client interface, and can be disabled immediately.

- **Inline Mock Measurement Unit Route in Inventory**:
  - `GET /api/v1/inventory/measurement-units` (Superceded by `/api/v1/measurement-units/lookup`)
- **Inline Memory Cache Flushers**:
  - `POST /api/v1/cache/clear-stubs` (Unused; Laravel cache/redis handles clean cache flushes natively)

---

## 2. Risk Mitigation & Decommissioning Playbook

To ensure zero downtime, data leakage, or service disruption during the realignment, the following phased playbook is enacted:

```
Phase 1: Dual-Write Audit & Verification (Current)
Phase 2: Traffic Routing Switch (Nginx Proxy Update)
Phase 3: Silent Deprecation (Monitor for residual Node.js traffic)
Phase 4: Filesystem Purge (Delete Node files and retire packages)
```

### Phase 1: Dual-Write Audit & Verification
- Both backend servers are running, but Nginx is configured to point `/api/` traffic exclusively to the Laravel backend.
- Any new features are written purely in Laravel. Node files are left intact as reference only, labeled with deprecation headers.

### Phase 2: Traffic Routing Switch
- The staging and production Nginx servers route all `/api/` matching patterns strictly to the PHP-FPM FastCGI upstream (`backend-api:9000`).
- Validate that the frontend client (`src/lib/api.ts`) correctly points to the central gateway `/api/v1` without hostname conflicts.

### Phase 3: Silent Deprecation
- Observe the server environment logs on the Node server.
- If there is zero traffic hitting the Express container for 7 consecutive days, proceed to Phase 4.

### Phase 4: Filesystem Purge
- Remove `server.ts` and the `server/` directory.
- Update `package.json` scripts to remove `esbuild` server bundling and clean up unused dependencies (`express`, `bcryptjs`, `jsonwebtoken`, `pg`).
