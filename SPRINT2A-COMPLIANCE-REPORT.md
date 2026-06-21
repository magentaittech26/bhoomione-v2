# SPRINT 2A COMPLIANCE & ARCHITECTural REVIEW REPORT

This document outlines the result of our Sprint 2A audit, analyzing the layer partitions between our operational **Node.js Preview Container** and the production-intended **Laravel Backend API**, identifying exact route/controller/model footprints, verifying SQL-level persistence integrity, and analyzing seed data decoupling.

---

## 1. Structural File Classification & Runtime Partitions

Every key file introduced or referenced during Sprints 1 and 2 is segmented below by its runtime target execution space:

| File Name / Path | Environment Classification | Primary Purpose / Role |
| :--- | :--- | :--- |
| `server.ts` | **Node Preview Only** | Bootstraps the Express gateway, coordinates local PostgreSQL schema initialization, and integrates Vite middleware. |
| `server/db/bootstrap.ts` | **Node Preview Only** | Executes database DDL table setups, generates performance indexes, and coordinates default database records injection. |
| `server/routes/inventory.ts` | **Node Preview Only** | Hosts REST API controllers for projects, layouts, and plots utilizing SQL connection pools under RBAC protection. |
| `server/routes/auth.ts` | **Node Preview Only** | Handles authentication, password resets, session refreshment, and token management in the Node preview container. |
| `src/components/InventoryManager.tsx` | **React Frontend** | Unified client portal showing physical real estate land parameters, offering secure forms, and managing math calculations. |
| `src/lib/api.ts` | **React Frontend** | Client-side API networking client mapping JSON requests for CRUD interfaces of land parcels. |
| `backend-api/routes/api.php` | **Laravel Production** | Defines standard Laravel framework endpoints and middlewares for production execution. |
| `backend-api/app/Http/Controllers/Api/v1/AuthController.php` | **Laravel Production** | Handles identity operations, tenant context, and session authentication for the production backend. |
| `backend-api/app/Models/*` | **Laravel Production** | Persistent Eloquent models representing tenants, users, RBAC, and system audit trails. |
| `backend-api/database/migrations/*` | **Laravel Production** | Base migrations preparing initial database system tables in production. |

---

## 2. Platform Layer Alignment Matrix (Laravel vs. Node.js)

### Q1. Were Projects, Layouts, and Plots implemented in the Laravel backend-api?
**No.** The `/backend-api` directory remains configured with baseline Sprint 1 structure (Tenants, Users, RBAC permission vectors, Audit logs, and Refresh tokens). The physical land inventory structures have not yet been ported to the Laravel repository.

### Q2. Or only in the Node.js preview layer?
**Yes, exclusively in the Node.js preview layer.** The Express-based REST controller (`server/routes/inventory.ts`), matching database bootstrap (`server/db/bootstrap.ts`), and standard React UI are executing directly within the Active Node.js Preview container to enable fast, rich interactions in the live workspace.

### Q3. List all Laravel migrations created for Sprint 2A.
**None.** No migrations exists inside `/backend-api/database/migrations` for Projects, Layouts, or Plots. Only the five Sprint 1 migrations are present:
1. `2026_06_19_000001_create_tenants_table.php`
2. `2026_06_19_000002_create_users_table.php`
3. `2026_06_19_000003_create_rbac_tables.php`
4. `2026_06_19_000004_create_audit_logs_table.php`
5. `2026_06_19_000005_create_refresh_tokens_table.php`

### Q4. List all Laravel models created for Sprint 2A.
**None.** Only Sprint 1 models exist in `/backend-api/app/Models/`:
- `Tenant.php`
- `TenantDomain.php`
- `User.php`
- `Role.php`
- `Permission.php`
- `AuditLog.php`
- `RefreshToken.php`

### Q5. List all Laravel controllers created for Sprint 2A.
**None.** Only `AuthController.php` exists inside `/backend-api/app/Http/Controllers/Api/v1/`.

### Q6. List all Laravel API routes created for Sprint 2A.
**None.** Only the authentication endpoints and basic test routes (such as `/admin/audit-logs`, `/admin/tenants`, `/tenant/users`, and `/system/health`) are registered inside `/backend-api/routes/api.php`.

---

## 3. Data Integrity & Persistence Verification

### Q7. Seeded Demo Data Identification
The following records are injected into the real PostgreSQL database instance during initial server boot by `server/db/bootstrap.ts`:
- **Measurement Units**:
  - `SQFT` (Square Feet - Ratio: 1.00000000)
  - `SQM` (Square Meter - Ratio: 10.76391042)
  - `ACRE` (Acre - Ratio: 43560.00000000)
  - `GUNTHA` (Guntha - Ratio: 1089.00000000)
  - `BIGHA` (Bigha - Ratio: 27000.00000000)
- **Projects**:
  - `Greenfield Meadows` (`GM`, Status: `ACTIVE`)
  - `Royal Serenity Estate` (`RSE`, Status: `PLANNING`)
- **Layouts**:
  - `Meadows Phase A Sector 1` (`SEC1`, Status: `LAUNCHED`)
  - `Meadows Commercial Plaza` (`COMM1`, Status: `APPROVED`)
- **Plots**:
  - `Plot 401` (2,400 SQFT, Standard, Facing: East)
  - `Plot 402` (1,200 SQFT, Reserved, Facing: North)
  - `Plot 403-C` (300 SQM, Corner plot, Facing: Northeast)
  - `Plot 404` (1.5 ACRE, Sold, Facing: South)

### Q8. Verification of Persistence Compliance
We have verified that **No Mock Data** or client-side temporary state shortcuts are utilized:
- **No JSON Mock Failovers**: All frontend API calls bind to real Node.js SQL queries executing against PostgreSQL. Adding, editing, or deleting a record performs true DML database transactions on physical tables (`projects`, `layouts`, `plots`, `measurement_units`).
- **Standard-Agnostic Mathematical Engine**: The physical unit-conversion calculator on the frontend utilizes dynamic, database-driven parameters stored inside the PostgreSQL table `measurement_units`. It dynamically queries conversion quotients relative to SQFT rather than using hardcoded values.

---

## 4. Decoupling Demo Seeders (Optional Strategy)

To comply with clean production setup mandates, demo records should be isolated into separate seeding modules instead of populating automatically on server boot:

### Proposed Isolation Plan:
1. **Differentiate Production Tables from Demo Data**: Keep vital foundational entries (zoning measurement standards, base RBAC permissions, default plans) inside `bootstrap.ts` as structural necessities.
2. **Abstract Inventory Seeds**: Export projects, layouts, and plots seeds out of `bootstrap.ts`.
3. **Control via Environment Variable**: Add a flag in the settings console to toggle sample data injection:
   ```env
   # .env.example
   SEED_DEMO_DATA=false
   ```
4. **Conditional Ingress Setup**:
   ```ts
   // inside server/db/bootstrap.ts
   if (process.env.SEED_DEMO_DATA === "true") {
      await seedDemoInventory(client);
   }
   ```
This prevents test records from polluting clean production environments while allowing developers to easily seed datasets in preview containers when needed.
