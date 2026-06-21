# BHOOMIONE V2: SPRINT 1 TECHNICAL SPECIFICATION
**Document ID**: SPRINT-1-TECHNICAL-SPEC  
**Status**: Pending Approval  
**Version**: 1.0  
**Scope**: Platform Foundation (Auth, Tenancy, Auditing)  
**Security Constraint**: Real PostgreSQL only. Zero mock/demo state tables. 

---

## 1. Objectives & Scope Boundaries

The primary objective of Sprint 1 is to establish a secure, performant, and resilient **Platform Foundation** for BhoomiOne V2. This foundational layer guarantees data security, tenant isolation, and audit compliance before any real estate properties, GIS layouts, or financial balances are committed to the system.

### Explicitly IN SCOPE:
1.  **Identity & Access Control (RBAC)**: Secure user sign-ons, logins, and permission hierarchies.
2.  **Multi-Tenancy Resolution**: Dynamic database-level tenant routing based on domain hostname headers.
3.  **Auditing**: Immutable write-aside ledger recording every administrative, financial, and security modification.
4.  **Database Shell Schema**: Standard SQL schema blueprints targeting PostgreSQL.
5.  **Clean Micro-Frontend Shells**: Clean separate entry interfaces for Platform Administration, Developer ERP, and Public portals.

### Explicitly OUT OF SCOPE (Strictly Forbidden in Sprint 1):
*   No GIS / CAD / SVG processing.
*   No Marketplace listing directories.
*   No Projects or Phases.
*   No Layouts or Land Parcels.
*   No Plots or Plot Pricing matrices.
*   No Agents or Commission structures.
*   No Bookings, Reservations, or Ownership Registrations.
*   No Financial Ledgers, Instalments, or Payment collections.

---

## 2. Core Modules & Component Architecture

To maintain our modular domain-driven monolithic design rules on the backend, Sprint 1 establishes three clean backend domains under `backend-api/app/Modules/`:

### 2.1 Identity & Authorization Module (`Modules/Identity/`)
Manages authentication lifecycles and controls granular roles matching platform hierarchies:
*   **Platform Roles**: `SUPER_ADMIN`, `PLATFORM_ADMIN`, `SUPPORT_REPRESENTATIVE`
*   **Tenant (Developer) Roles**: `TENANT_DEVELOPER_OWNER`, `TENANT_DEVELOPER_ADMIN`, `TENANT_DEVELOPER_STAFF`
*   **Permissions Engine**: Core gates validating actions like `developer:create`, `kyc:approve`, or `user:suspend`.

### 2.2 Tenancy Master Module (`Modules/Tenancy/`)
Acts as the central router resolving tenant workspaces at compile and execution runs:
*   **Tenant Resolution Middleware**: Intercepts HTTP commands, parses headers, looks up the corresponding `tenant_id` from the SQL register, and scopes active connection loops dynamically.

### 2.3 System Audit Module (`Modules/Audit/`)
Write-aside audit repository capturing database transactions instantly:
*   **State Logger**: Executes during database model events (`creating`, `updating`, `deleting`) to write old vs. new column states alongside user IP and metadata to immutable audit records.

---

## 3. Database Schema Blueprint (PostgreSQL 17)

All table IDs run as globally unique `UUID` formats to allow future sharding, offline syncing, and partition tasks.

```sql
-- ────────────────────────────────────────────────────────
-- 1. Identity & Role Schema
-- ────────────────────────────────────────────────────────
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, BLACKLISTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'SUPER_ADMIN', 'TENANT_DEVELOPER_OWNER'
    name VARCHAR(255) NOT NULL,
    scope VARCHAR(50) NOT NULL -- 'GLOBAL', 'TENANT'
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'developer:onboard', 'kyc:approve'
    name VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL
);

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ────────────────────────────────────────────────────────
-- 2. Multi-Tenancy Core Schema
-- ────────────────────────────────────────────────────────
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_code VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'shaurya-builders'
    company_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, ACTIVE, SUSPENDED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tenant_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    domain_name VARCHAR(255) UNIQUE NOT NULL, -- e.g., 'shaurya.tenant.bhoomione.in'
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Maps users to their respective tenant workspace and role
CREATE TABLE tenant_users (
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE RESTRICT,
    PRIMARY KEY (tenant_id, user_id)
);

-- ────────────────────────────────────────────────────────
-- 3. System Auditing Master Schema
-- ────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL, -- NULL indicates global action
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_name VARCHAR(100) NOT NULL, -- e.g., 'tenants', 'users'
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- e.g., 'CREATE', 'UPDATE', 'DELETE'
    old_values JSONB, -- stores pre-transaction columns state
    new_values JSONB, -- stores post-transaction columns state
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create critical lookups indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_tenant_domains ON tenant_domains(domain_name);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_name, entity_id);
```

---

## 4. API Endpoints Specification

All API communication maps to the base routes `/api/v1/auth/*` or `/api/v1/platform/*` passing through strict CORS, rate-limiting, and tenancy headers.

### 4.1 Platform Auth Endpoints (JWT / Sanctum Core)
*   `POST /api/v1/auth/login`: Real validation of user email/password matches. Responds with access token, refresh token, and tenant/role scopes.
*   `POST /api/v1/auth/refresh`: Swaps a valid refresh token for a newly generated access token.
*   `POST /api/v1/auth/logout`: Revokes and invalidates active session tokens within Redis/Database.
*   `GET /api/v1/auth/me`: Decodes JWT payload and queries database directory to return active user profiles, permissions, and configurations.

### 4.2 Platform Boarding Endpoints (Admin Shell Context)
*   `POST /api/v1/platform/tenants`: Platform Admin onboards a new Developer Tenant (creates records inside `tenants` and maps primary `tenant_domains`).
*   `POST /api/v1/platform/users`: Instantiates platform users, linking them to global static roles.
*   `GET /api/v1/platform/audit-logs`: Streams paginated, filterable transactional actions with strict user context.

---

## 5. Tenancy Resolver Execution Logic

The backend tenancy resolution operates inside a custom global Laravel HTTP Middleware:

```
                            [ Incoming HTTP Request ]
                                        │
                      Parse Request Host Header ($request->getHost())
                                        │
           Query cached tenant_domains in Redis (or Fallback sql SELECT)
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
            Resolved Result: NULL                   Resolved Result: tenant_id
                    ▼                                       ▼
       [ Route aborts with 404 ]                 [ Bind to local Service container ]
    Domain mapping does not exist           - app()->instance('active_tenant', $tenant_id)
                                            - Enforce connection schemas / RLS
```

*   **Transactional query protection**: Every Model Query inheriting `TenantScoped` scope automatically appends `where('tenant_id', '=', app('active_tenant'))` to protect boundaries.

---

## 6. Frontend Authentication Shell (React - TS)

Frontend builds remain completely isolated. During Sprint 1, we build the core shell layout for the login routes:

```
┌────────────────────────────────────────────────────────┐
│               BhoomiOne Portal Single Sign-on          │
├────────────────────────────────────────────────────────┤
│                                                        │
│   Email: [_______________________________]            │
│   Password: [****************]                         │
│                                                        │
│   [ LOGIN BUTTON ]                                     │
│                                                        │
├────────────────────────────────────────────────────────┤
│ Resolved Environment Domain: tenant-erp.bhoomione.in   │
│ Client Context Identifier: [ Active Tenant Resolved ]  │
└────────────────────────────────────────────────────────┘
```

1.  **Domain Handshake Lookup**: On initial FCP render, the frontend parses current `window.location.host`. It makes a pre-auth handshake call `GET /api/v1/system/domain-mapping` passing current hostname.
2.  **Visual branding injection**: If the tenant matches a designated developer profile (e.g. `shaurya-builders.tenant.bhoomione.in`), the login shell updates visual metrics based on server declarations (custom logo pointers).
3.  **State conservation**: Decoded JWT tokens are held in securely protected variables, using `sessionStorage` for fallback session persistence. Access keys are strictly forbidden inside plain `localStorage`.

---

## 7. Approval & Sprint 1 Acceptance Criteria

Sprint 1 is considered successful once the following integration standards are verified on local Docker environments testing real PostgreSQL database pipelines.

- [ ] **Acceptance Constraint 1**: Database tables are successfully compiled inside dry PostgreSQL containers.
- [ ] **Acceptance Constraint 2**: User is able to authenticate via Plat Admin console, returning authorized JWT vectors holding `SUPER_ADMIN` code parameters.
- [ ] **Acceptance Constraint 3**: Direct API requests to resolve an unmapped domain host throw immediate database 404 responses.
- [ ] **Acceptance Constraint 4**: Any mock credential login attempts fail with exact 401 exceptions. No dummy entries of properties bypass checking metrics.
- [ ] **Acceptance Constraint 5**: Creating any platform user generates a precise database trace inside `audit_logs` capturing old/new json states and user IP.
- [ ] **Acceptance Constraint 6**: Global linters pass successfully without throwing ts-ignore or build warnings.

---
**End of Document**
