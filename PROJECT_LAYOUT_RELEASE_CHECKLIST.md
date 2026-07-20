# BhoomiOne V3 - Project and Layout Release Checklist

This checklist defines the high-priority engineering, security, and usability gates required for releasing the stabilized Projects and Layouts foundation into production staging.

---

## 1. Relational Database Integrity Gates
- [x] **Cascade Purging Verified**: Deleting a project cascade-deletes layouts and plots, verified via local transactional tests.
- [x] **Unique Constraints Enforced**: Name uniqueness is validated inside parent contexts to prevent duplicate layout phase creation.
- [x] **State and District Seeding**: Geographic tables are fully seeded and available as select dropdowns.

---

## 2. API & Contract Gates
- [x] **Schema Alignment**: Model endpoints in `src/lib/api.ts` mirror backend structures.
- [x] **HTTP Method Matching**: Create uses `POST`, Update/Archive/Restore uses `PUT`, and Delete uses `DELETE`.
- [x] **Header Decoupling**: Global headers (`Authorization`, `x-tenant-id`) are automatically injected by the api client.

---

## 3. MDM Realignment Gates
- [x] **Operational Workspace Decoupled**: The `MeasurementUnitsConsole` is removed from top-level workspace tabs.
- [x] **Tenant Admin Integration**: The console is integrated under `Settings & Billing` -> `Master Data Management`.
- [x] **Hook Availability**: `useMeasurementUnits()` continues providing reactive state data to operational forms independently of console mounting.

---

## 4. RBAC & Security Gates
- [x] **Write Privileges restricted**: Only `OWNER` or `ADMIN` roles can delete or modify MDM configurations.
- [x] **Read Privileges open**: Sales and guest roles can view details but cannot access editing modals.
- [x] **Tenancy Sandboxed**: Every request handshakes correct tenant headers to prevent cross-tenant leakage.

---

## 5. UI & Performance Gates
- [x] **Zero Infinite Re-renders**: Hook dependency arrays are stabilized with primitives.
- [x] **Lucide Icon Standard**: All icons are imported directly from `lucide-react`.
- [x] **Motion Animation**: Animate presence and motion layouts are applied to modal entries.
