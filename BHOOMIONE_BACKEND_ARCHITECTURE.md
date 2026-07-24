# BhoomiOne V3 Backend Architecture

This document outlines the official production backend architecture for the BhoomiOne platform, centering on **Laravel 12, PHP, PostgreSQL**, and token-based multi-tenant isolation.

---

## 1. Modular Layout & Domain Boundaries

The Laravel backend is located in `/backend-api` and follows a robust modular and service-oriented layout:
- **Models (`app/Models/`)**: Standard Eloquent models defining relationships and casts (e.g., `User`, `Tenant`, `Project`, `Layout`, `Plot`, `MeasurementUnit`).
- **Controllers (`app/Http/Controllers/Api/v1/`)**: Handles request/response mapping, invokes services, and maintains API boundaries.
- **Form Requests (`app/Http/Requests/`)**: Encapsulates incoming payload validation and error handling format (returning a standard 422 standard on validation failure).
- **Services (`app/Services/`)**: Authoritative business logic engines, database transaction handlers, and audit logging orchestrators.
- **Business Rules Engine (`app/Core/BusinessRules/`)**: Decoupled rules engine executing deterministic eligibility, state transitions, and audit logging (`BusinessRuleEngine`).

---

## 2. Security & Middleware Stack

BhoomiOne implements stateless JWT authentication combined with dynamic database-driven RBAC (Role-Based Access Control) and Tenant isolation.

```
Incoming Request
       │
       ▼
TenantResolverMiddleware (Parses X-Tenant-ID / Subdomains)
       │
       ▼
PermissionRequirementMiddleware (Verifies Bearer JWT token & checks granular permission code)
       │
       ▼
Eloquent Controller / Service (Orchestrates transactions & performs Audit logging)
```

### A. Tenant Boundary Resolver (`TenantResolverMiddleware`)
- **Location**: `/backend-api/app/Http/Middleware/TenantResolverMiddleware.php`
- Resolves active tenant context using the `X-Tenant-ID` header or domain host fallback (matching staging/production subdomains).
- Attaches the `resolvedTenant` directly to request attributes for simple controller access.

### B. Authentication & RBAC Middleware (`PermissionRequirementMiddleware`)
- **Location**: `/backend-api/app/Http/Middleware/PermissionRequirementMiddleware.php`
- Verifies cryptographically signed Bearer JWT tokens via `JwtTokenService`.
- Reconciles active permissions dynamically from `tenant_users` or platform `user_roles` against DB privileges.
- Prevents unauthorized actions before hitting the Eloquent Controllers, throwing clean JSON 401/403 payloads.

### C. Stateless Access Token Engine (`JwtTokenService`)
- Generates 15-minute cryptographically signed JWT access tokens using standard HS256.
- Saves revocable refresh tokens in the `refresh_tokens` database to enable long-running client sessions.

---

## 3. Database Schema Timeline

BhoomiOne's schema timeline in `/backend-api/database/migrations` registers the core entities in sequential migrations:
1. `2026_06_19_000001_create_tenants_table`
2. `2026_06_19_000002_create_users_table`
3. `2026_06_19_000003_create_rbac_tables` (Roles, Permissions, and assignments)
4. `2026_06_19_000004_create_audit_logs_table`
5. `2026_06_19_000005_create_refresh_tokens_table`
6. `2026_06_19_000006_create_measurement_units_table`
7. `2026_06_19_000007_create_projects_table`
8. `2026_06_19_000008_create_layouts_table`
9. `2026_06_19_000009_create_plots_table`
10. `2026_06_19_000015_alter_plots_table_for_traceability`
11. `2026_07_05_000001_create_location_master_tables` (Location hierarchy engine)
