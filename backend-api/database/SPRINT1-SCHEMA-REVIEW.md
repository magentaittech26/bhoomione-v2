# SPRINT 1 SCHEMA REVIEW & DATABASE SPECIFICATION
**Document ID**: SPRINT1-SCHEMA-REVIEW  
**Status**: Pending Editorial Sign-off  
**Version**: 2.0  
**Project**: BhoomiOne Digital Land Operating System  
**Date**: June 19, 2026  

---

This document represents the enterprise-grade schema review, verification, and database auditing architecture for **BhoomiOne V2** Sprint 1 database tables. It models are structured in raw, production-ready DDL (PostgreSQL 16+) and configured to run on atomic migration systems.

---

## 1. Table-by-Table Architectural Specification

### 1.1 `tenants` Table
*   **Purpose**: The central register for all developer workspaces (tenants) operating on the SaaS system. Each registered company receives a row in this table, representing the top-level parent node of the physical/logical boundary.
*   **Columns**:
    *   `id`: `UUID` (Primary Key - generated using standard pg cryptographically secure algorithm `gen_random_uuid()`).
    *   `tenant_code`: `VARCHAR(100) UNIQUE NOT NULL` (A clean, human-readable string key, e.g., `'shaurya-builders'`, used inside query paths and resource directories).
    *   `company_name`: `VARCHAR(255) NOT NULL` (Legal business name registration).
    *   `status`: `VARCHAR(50) NOT NULL DEFAULT 'PENDING'` (Lifecycle states: `'PENDING'`, `'ACTIVE'`, `'SUSPENDED'`, `'DELETED'`).
    *   `created_at`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`.
    *   `updated_at`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`.
*   **Indexes**: Unique index on `tenant_code` is created automatically backended by PostgreSQL unique constraints.
*   **Foreign Keys**: None (this is the absolute root metadata record of the tenancy hierarchy).
*   **Tenancy Considerations**: This is the top-level entity. Every transactional table, project, layout, and client ledger downstream in Starter & Growth tiers will hold a foreign key `tenant_id` referring to this key.
*   **Future Scalability Considerations**: To scale to the target **5,000+ developers**, we utilize a `UUID` instead of serial integers. This prevents database column overflow, allows instant multi-master merges, and permits a tenant to migrate to Dedicated VPS nodes by simply backup/dumping their matching UUID rows without id collisions.

---

### 1.2 `tenant_domains` Table
*   **Purpose**: Maps domains and subdomains directly to their respective `tenant_id`. Used by the Nginx reverse proxy and the application-level **Tenancy Resolver Middleware** to identify the runtime tenant scope of an incoming HTTP request.
*   **Columns**:
    *   `id`: `UUID` (Primary Key).
    *   `tenant_id`: `UUID NOT NULL` (Reference link to the parent tenant).
    *   `domain_name`: `VARCHAR(255) UNIQUE NOT NULL` (Subdomain or custom domain name, e.g., `'shaurya.tenant.bhoomione.in'` or `'plots.shauryabuilders.com'`).
    *   `is_primary`: `BOOLEAN NOT NULL DEFAULT TRUE` (Indicates primary domain targeting routing).
    *   `created_at`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`.
    *   `updated_at`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`.
*   **Indexes**: Index `idx_tenant_domains_domain` on `domain_name` (Crucial for sub-second database lookups inside the routing middleware).
*   **Foreign Keys**: `tenant_id` references `tenants(id) ON DELETE CASCADE`.
*   **Tenancy Considerations**: Decouples the physical server host routing layout from application models. Multiple domains can resolve to the exact same `tenant_id`, simplifying multi-brand scenarios under a single tenant.
*   **Future Scalability Considerations**: If a developer purchases a custom Domain white-label PWA upgrade, we simply add their custom domain route into this table. Nginx immediately passes the custom header, which is parsed by our Tenancy Resolver dynamically.

---

### 1.3 `users` Table
*   **Purpose**: Central user identity ledger. Since users can simultaneously act as Platform Admins, Tenant Staff, Agents, or Customers across different environments, their baseline authentication credentials (password hashes, phone, email) locate in this single multi-tenant master registry.
*   **Columns**:
    *   `id`: `UUID` (Primary Key).
    *   `name`: `VARCHAR(255) NOT NULL` (Display name of user).
    *   `email`: `VARCHAR(255) UNIQUE NOT NULL` (Unique sign-in email).
    *   `phone`: `VARCHAR(50) UNIQUE NOT NULL` (Unique mobile phone index).
    *   `password_hash`: `VARCHAR(255) NOT NULL` (Secure Bcrypt / Argon2 payload).
    *   `kyc_status`: `VARCHAR` (Current KYC verification level: `PENDING`, `VERIFIED`, `REJECTED`).
    *   `status`: `VARCHAR` (User operational state: `ACTIVE`, `SUSPENDED`).
*   **Indexes**: Unique indexes exist on `email` and `phone` columns.
*   **Tenancy & Build Isolation**: Notice that **there is no `tenant_id` column in the `users` table**. A User is a global entity that exists across the platform. Their association with specific developer tenants is governed dynamically by separate link matrices, avoiding compile-time coupling and directory leakages.

---

## 4. Roles & Permissions Topology

```
                  ┌─────────────────────────────────────────┐
                  │                 PERMISSIONS             │
                  │   e.g. plot_view, plot_create, book_plot│
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
┌──────────────────┐      ┌────────────┴────────────┐      ┌─────────────────────┐
│      ROLES       │ ───> │     ROLE_PERMISSIONS    │ <──  │        USERS        │
│ (Platform-Super, │      └─────────────────────────┘      │(Central-Auth Identity│
│  Dev-Admin, etc) │                                       │      Token State)   │
└──────────────────┘                                       └─────────────────────┘
```

The RBAC system relies on three interconnected tables:

### 1. `roles` Table
*   **Fields**: `id UUID`, `name VARCHAR` (Human-readable name, e.g., "Developer Admin"), `code VARCHAR` (System reference, e.g., `DEV_ADMIN`), `scope VARCHAR` (Indicates if the role operates at the `PLATFORM` level, `TENANT` level, `AGENT` level, or `CUSTOMER` level).

### 2. `permissions` Table
*   **Fields**: `id`, `name` (e.g., "Create Plots"), `code` (e.g., `PLOT_CREATE`), `module` (e.g., `"Plots"`). Defines granular behavioral privileges across the 15 system core packages.

### 3. `role_permissions` Table
*   **Fields**: `role_id UUID`, `permission_id UUID`. Connects roles to specific scopes, verified transparently at the API Gateway layer using JWT claim decorators.

---

## 5. Tenancy Architecture Recommendations & Strategy Decisions

To ensure maximum performance and structural stability for the **5,000+ developer scale target**, BhoomiOne V2 enforces the following decisions:

### 5.1 Starter/Growth Developers (Scale SaaS Layer)
*   **Architecture**: Shared Database with logical `tenant_id` partitioning on all business tables.
*   **Why**: Running 5,000 separate database connection pools would immediately choke hardware kernel memory and crash the server on a standard 16GB RAM VPS. A shared model with composite query indexes (`tenant_id`, `project_id`, `layout_id`) guarantees sub-millisecond execution times.

### 5.2 Enterprise Developers / Dedicated VPS (Hybrid Escape Strategy)
*   For enterprise clients wanting isolated physical nodes, BhoomiOne supports **Physical Schema Isolation** (Database-per-Tenant).
*   The API database resolver dynamically picks connection configs at run-time:
    *   If `X-Tenant-ID` is a default subscriber ──> routes to the master cluster.
    *   If `X-Tenant-ID` is an enterprise client ──> routes connection pool to their dedicated PostgreSQL/PostGIS server.
    *   **NO CODE REWRITES ARE REQUIRED**: The underlying code references the exact same models; only the driver-level socket configuration is altered at request start.

---

## 6. Marketplace Data Architecture Recommendation

### Centralized Marketplace Index & Active Cache Invalidation
To serve millions of public visitors looking for land listings on `bhoomione.in` without overloading the master database write pools, we enforce **Centralized Aggregated Search-Indexes with Real-time Transaction Locks**:

1.  **Read Path**: When visitors search by facing, state, or price range, the queries hit highly optimized read indexes or **Read Replica Shards** (database replication). These layout coordinates are saved in cached static JSON structures inside Redis for lightning-fast loads (`<2.0s`).
2.  **Transaction Path (Double-Booking Elimination)**: The moment a customer clicks on a specific plot bounding box and hits "Proceed to Booking", the request bypasses all read indexes and issues a strict, atomic database-level lock directly on the master table row:
    ```sql
    SELECT status, area_value, base_price 
    FROM plots 
    WHERE id = :plot_id 
    FOR UPDATE;
    ```
    This lock is held within active database Transactions, guaranteeing that no two customer checkouts can execute on the exact same land inventory simultaneously.
3.  **Active Cache-aside update**: Once a booking status shifts, the server fires a database event updating the public cache indices and pushes lightweight WebSocket updates via Redis/Laravel Reverb to update color states instantly in all active customer browsers.

---

## 7. Operational Integrity Verification Matrix

Here is how the Sprint 1 database structure natively supports all future development modules, locking down the 10 core mandates:

### A. Central Admin Onboarding Support For Developers, Agents, and Customers
*   A new tenant creates a row inside `tenants` and a matching route mapping inside `tenant_domains`.
*   An onboarded **Agent** or **Customer** is registered as a global identity in `users`.
*   They are mapped to their respective developer workspace inside the link master tables:
    *   **Developers**: Mapped via `tenant_users` table linking their parent `user_id` to a Role with code `TENANT_DEVELOPER_ADMIN` or `TENANT_DEVELOPER_OWNER`.
    *   **Agents**: Linked to tenants via `tenant_users`. Their role resolves to `AGENT`. Their custom access limits (which projects or layout directories they are authorized to manage) will locate in the subsequent `agent_inventory` allocation tables.
    *   **Customers**: Linked via `tenant_users` with role `CUSTOMER`. This preserves absolute isolation, meaning Customer A can log in to Shaurya Builders' customer portal but is blocked from logging into competing workspaces.

### B. KYC-Ready Architecture
*   Our global `users` table holds a baseline `kyc_status` (e.g. `'PENDING'`, `'VERIFIED'`, `'REJECTED'`).
*   Documents are tracked inside the central database with unique categories (e.g., `'PAN'`, `'AADHAAR'`, `'GST_CERT'`, `'RERA_LICENSE_CERT'`) referencing standard system IDs. No transaction or plot booking can be initialized unless the associated identity references a valid passport/voter/PAN checksum within `users`.

### C. Future Subscription Plans Configuration
*   A plans table (`plans`) will map to a standard tenant subscription metadata descriptor inside `tenants` (`subscription_id UUID NULL`). 
*   We attach billable feature flags (such as `feature_maps_basic`, `feature_maps_advanced`, and `feature_cad_import`) directly to subscription objects, allowing API gateways to dynamically grant or limit access.

### D. Dedicated VPS Settings Assignment
*   Our tenancy resolver evaluates the `tenant_domains` record.
*   We can easily assign custom database hosts (`db_host`), ports (`db_port`), and storage routes directly to tenant records, enabling immediate White-label VPS routing without modifying central business codes.

### E. Long-Term Marketplace Index Linking
*   Since all tables downstream reference `tenant_id` and all plots use globally unique UUIDs, the central marketplace search indexes can comfortably scrape layout directories and render real-time plot states via highly performant, single-table index joins.

### F. Measurement Unit Master Table Recommendation
To satisfy Mandate 9 (Configurable Units) and Mandate 10 (Unit-Agnostic Pricing), we recommend establishing a master Geographic Unit table to manage regional divisions:

```sql
CREATE TABLE IF NOT EXISTS geographic_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'SQFT', 'SQM', 'ACRE', 'GUNTHA', 'BIGHA'
    name VARCHAR(255) NOT NULL, -- e.g., 'Square Feet', 'Square Meter', 'Guntha'
    conversion_factor_to_sqft DECIMAL(18, 8) NOT NULL, -- e.g., '1.00000000', '10.76391042', '43560.0000'
    is_active BOOLEAN DEFAULT TRUE
);
```
Every layout record holds a `measurement_unit_id` pointing to this table. The dynamic calculated price of any plot maps dynamically based on the associated conversion factors, completely eliminating hardcoded calculations.

---

**End of Document**
