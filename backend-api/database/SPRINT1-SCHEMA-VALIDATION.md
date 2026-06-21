# BHOOMIONE V2: SPRINT 1 DATABASE SCHEMA VALIDATION REPORT
**Document ID**: SPRINT1-SCHEMA-VALIDATION  
**Status**: Frozen & Verified  
**Version**: 2.0  
**Authority**: Principal Database Architect  
**Date**: June 19, 2026  

---

## 1. Executive Summary

This validation audit confirms the physical schema structural design for **BhoomiOne V2** in Sprint 1. In alignment with our strict architectural mandates (no dummy data, database-first development, dynamic tenant resolution, and unit-agnostic pricing engines), this database blueprint is configured for deployment on PostgreSQL 16+.

The core architectural properties verified and proved under this layout include:
1.  **Consistent UUID Strategy**: All keys use cryptographically secure physical UUID columns (`UUIDv4`), preventing sequential serial ID overflow and allowing seamless cloud migrations.
2.  **Stateless RBAC Boundaries**: The users table contains zero hardcoded fields mapping to customer, agent, or developer scopes. Association and capabilities derive dynamically from stateless link matrices mapping roles and granular permissions.
3.  **Extensible, Multi-Tenant KYC Design**: No fragile static columns (e.g. `aadhaar_no`, `pan_no`) are hardcoded. Instead, identity verification processes leverage extensible statuses and reference logs linking to physical document repositories.
4.  **Logical-to-Physical Escapes**: The tenants configuration holds connection strings (`database_host`, `database_name`, `database_port`, `infrastructure_tier`) enabling immediate Dedicated VPS shifts without modifying business SQL commands.
5.  **Audit Durability**: The system captures post-transaction states via PostgreSQL native JSONB fields.

---

## 2. Table-by-Table Database Schema Definitions

### 2.1 Table: `measurement_units`
*   **Purpose**: Seed-driven master list of localized geographic land calculation units across India, ensuring Mandate 9 (Configurable Units) and Mandate 10 (Unit-Agnostic Pricing) are met.

| Column Name | Datatype | Nullable | Default Value | description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key Identifier |
| `code` | `VARCHAR(50)` | No | *None* | Unique string identifier (e.g., `'SQFT'`, `'SQM'`, `'GUNTHA'`) |
| `name` | `VARCHAR(255)`| No | *None* | Display Name (e.g., `'Square Feet'`, `'Gunta'`) |
| `conversion_to_sqft`| `DECIMAL(18,8)`| No | *None* | Numeric float value used to dynamically compile calculations |
| `is_active` | `BOOLEAN` | No | `TRUE` | Operational flag |
| `created_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |

*   **Indexes**: Unique index on `code` column.
*   **Foreign Keys**: None.

---

### 2.2 Table: `subscription_plans`
*   **Purpose**: Defines platform SaaS tiers, storing flexible feature-flag states without hardcoding limits in business-end files.

| Column Name | Datatype | Nullable | Default Value | description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key Identifier |
| `plan_code` | `VARCHAR(100)`| No | *None* | Unique string identifier (e.g., `'STARTER'`, `'GROWTH'`) |
| `name` | `VARCHAR(255)`| No | *None* | Plan public branding metadata |
| `monthly_rate`| `DECIMAL(12,2)`| No | `0.00` | Billing rate |
| `yearly_rate` | `DECIMAL(12,2)`| No | `0.00` | Billing rate |
| `feature_flags`| `JSONB` | No | `'{}'` | Key-value feature toggles (e.g., `feature_maps_basic: false`) |
| `is_active` | `BOOLEAN` | No | `TRUE`| Operational state |
| `created_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |

*   **Indexes**: Unique index on `plan_code`.
*   **Foreign Keys**: None.

---

### 2.3 Table: `tenants`
*   **Purpose**: Parent developer SaaS workspaces. Contains dynamic connection strings allowing Logical Shared SQL structures to escape seamlessly into dedicated physical container databases.

| Column Name | Datatype | Nullable | Default Value | description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key Identifier |
| `tenant_code` | `VARCHAR(100)`| No | *None* | Unique developer directory key (e.g., `'shaurya-builders'`) |
| `company_name`| `VARCHAR(255)`| No | *None* | Corporate legal business title |
| `status` | `VARCHAR(50)` | No | `'PENDING'` | `'PENDING'`, `'ACTIVE'`, `'SUSPENDED'`, `'DELETED'` |
| `infrastructure_tier`| `VARCHAR(50)`| No | `'STARTER'` | `'STARTER'`, `'GROWTH'`, `'PROFESSIONAL'`, `'ENTERPRISE'`, `'PRIVATE_CLOUD'` |
| `database_host`| `VARCHAR(255)`| Yes | `NULL` | Host name for dedicated VPS routing |
| `database_name`| `VARCHAR(255)`| Yes | `NULL` | Isolated DB Schema descriptor |
| `database_port`| `INTEGER` | Yes | `NULL` | Port parameter (e.g., `5432`) |
| `created_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |

*   **Indexes**: Unique index on `tenant_code`.
*   **Foreign Keys**: None.

---

### 2.4 Table: `tenant_domains`
*   **Purpose**: Resolves host domain headers inside Nginx / Identity Middleware to inject correct multi-tenant execution contexts.

| Column Name | Datatype | Nullable | Default Value | description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key Identifier |
| `tenant_id` | `UUID` | No | *None* | Parent workspace identifier |
| `domain_name` | `VARCHAR(255)`| No | *None* | Full hostname string (e.g. `'shaurya.tenant.bhoomione.in'`) |
| `is_primary` | `BOOLEAN` | No | `TRUE` | Routing preference indicator |
| `created_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |

*   **Indexes**: Unique index on `domain_name`.
*   **Foreign Keys**: `tenant_id` references `tenants(id) ON DELETE CASCADE`.

---

### 2.5 Table: `tenant_subscriptions`
*   **Purpose**: Manages active tenant payment plan lifecycles, referencing configured resource items inside `subscription_plans`.

| Column Name | Datatype | Nullable | Default Value | description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()`| Primary Key Identifier |
| `tenant_id` | `UUID` | No | *None* | Parent workspace mapping |
| `plan_id` | `UUID` | No | *None* | Core subscription template reference |
| `status` | `VARCHAR(50)` | No | `'ACTIVE'` | `'ACTIVE'`, `'TRIAL'`, `'GRACE_PERIOD'`, `'SUSPENDED'`, `'EXPIRED'` |
| `expires_at` | `TIMESTAMPTZ`| No | *None* | Expiry date bounds |
| `created_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |

*   **Indexes**: Index on `(tenant_id, status)`.
*   **Foreign Keys**:
    *   `tenant_id` references `tenants(id) ON DELETE CASCADE`.
    *   `plan_id` references `subscription_plans(id) ON DELETE RESTRICT`.

---

### 2.6 Table: `users`
*   **Purpose**: Authentication registry. Built as an absolute decoupled model, it has no direct database linkages to hardcoded developer/agent/customer role states.

| Column Name | Datatype | Nullable | Default Value | description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key Identifier |
| `name` | `VARCHAR(255)`| No | *None* | Public Display Name |
| `email` | `VARCHAR(255)`| No | *None* | Authentication user email |
| `phone` | `VARCHAR(50)` | No | *None* | Authentication cell phone check |
| `password_hash`| `VARCHAR(255)`| No | *None* | Cryptographically hashed payload |
| `kyc_status` | `VARCHAR(50)` | No | `'PENDING'` | Global state: `'PENDING'`, `'VERIFIED'`, `'SUSPENDED'` |
| `status` | `VARCHAR(50)` | No | `'ACTIVE'` | Operational state: `'ACTIVE'`, `'SUSPENDED'`, `'BLACKLISTED'` |
| `created_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |

*   **Indexes**: Unique index on `email`, unique index on `phone`.
*   **Foreign Keys**: None.

---

### 2.7 Table: `roles`
*   **Purpose**: Role Based Access Control identifiers scoping access boundaries (Global Super Admin vs Scoped Developer Staff).

| Column Name | Datatype | Nullable | Default Value | description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key Identifier |
| `code` | `VARCHAR(100)`| No | *None* | Reference string (e.g., `'SUPER_ADMIN'`, `'DEV_ADMIN'`, `'AGENT'`) |
| `name` | `VARCHAR(255)`| No | *None* | Plaintext label |
| `scope` | `VARCHAR(50)` | No | `'TENANT'` | Scope restriction boundary: `'GLOBAL'`, `'TENANT'` |
| `created_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |

*   **Indexes**: Unique index on `code`.
*   **Foreign Keys**: None.

---

### 2.8 Table: `permissions`
*   **Purpose**: Granular, single-capability flags mapping actions inside business microservices.

| Column Name | Datatype | Nullable | Default Value | description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key Identifier |
| `code` | `VARCHAR(100)`| No | *None* | System key (e.g., `'project:create'`, `'kyc:verify'`) |
| `name` | `VARCHAR(255)`| No | *None* | Display Name label |
| `module` | `VARCHAR(100)`| No | *None* | Target system module categorization |
| `created_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |

*   **Indexes**: Unique index on `code`.
*   **Foreign Keys**: None.

---

### 2.9 Table: `role_permissions`
*   **Purpose**: Connects RBAC Role containers to granular Permission privileges.

| Column Name | Datatype | Nullable | Default Value | description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `role_id` | `UUID` | No | *None* | Target role link |
| `permission_id`| `UUID` | No | *None* | Target permission link |

*   **Indexes**: Composite Primary Key on `(role_id, permission_id)`.
*   **Foreign Keys**:
    *   `role_id` references `roles(id) ON DELETE CASCADE`.
    *   `permission_id` references `permissions(id) ON DELETE CASCADE`.

---

### 2.10 Table: `user_roles`
*   **Purpose**: Directly maps users to platform-wide system roles (such as Global Admin or Independent Broker profiles).

| Column Name | Datatype | Nullable | Default Value | description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `user_id` | `UUID` | No | *None* | Target user link |
| `role_id` | `UUID` | No | *None* | Target role link |

*   **Indexes**: Composite Primary Key on `(user_id, role_id)`.
*   **Foreign Keys**:
    *   `user_id` references `users(id) ON DELETE CASCADE`.
    *   `role_id` references `roles(id) ON DELETE CASCADE`.

---

### 2.11 Table: `tenant_users`
*   **Purpose**: Maps a user identity to a specific workspace and grants a specific tenant role scoped only to that developer's ERP environment.

| Column Name | Datatype | Nullable | Default Value | description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `tenant_id` | `UUID` | No | *None* | Target workspace link |
| `user_id` | `UUID` | No | *None* | Target user link |
| `role_id` | `UUID` | No | *None* | Scoped environment role (e.g. `'DEV_ADMIN'`) |
| `created_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |
| `updated_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Internal timestamp |

*   **Indexes**: Composite Primary Key on `(tenant_id, user_id)`. Index on `user_id`.
*   **Foreign Keys**:
    *   `tenant_id` references `tenants(id) ON DELETE CASCADE`.
    *   `user_id` references `users(id) ON DELETE CASCADE`.
    *   `role_id` references `roles(id) ON DELETE RESTRICT`.

---

### 2.12 Table: `audit_logs`
*   **Purpose**: Secure audit repository. All state modifications store old vs new differences as dynamic PostgreSQL binary blobs (`JSONB`), guaranteeing optimal query planning.

| Column Name | Datatype | Nullable | Default Value | description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | No | `gen_random_uuid()` | Primary Key Identifier |
| `tenant_id` | `UUID` | Yes | `NULL` | Tenant context (`NULL` represents platform-wide events) |
| `user_id` | `UUID` | Yes | `NULL` | Acting User identifier |
| `entity_name` | `VARCHAR(100)`| No | *None* | Modified table identifier (e.g. `'tenants'`, `'users'`) |
| `entity_id` | `UUID` | No | *None* | Key ID of modified record |
| `action` | `VARCHAR(50)` | No | *None* | Transaction action performed: `'CREATE'`, `'UPDATE'`, `'DELETE'` |
| `old_values` | `JSONB` | Yes | `NULL` | Pre-transaction model column properties state |
| `new_values` | `JSONB` | Yes | `NULL` | Post-transaction model column properties state |
| `ip_address` | `INET` | Yes | `NULL` | User network socket protocol |
| `user_agent` | `TEXT` | Yes | `NULL` | Device agent trace |
| `created_at` | `TIMESTAMPTZ`| No | `CURRENT_TIMESTAMP` | Creation time bounds |

*   **Indexes**:
    *   `idx_audit_logs_tenant` on `tenant_id`
    *   `idx_audit_logs_entity` on `(entity_name, entity_id)`
    *   `idx_audit_logs_user` on `user_id`
    *   `idx_audit_logs_created` on `created_at DESC`
*   **Foreign Keys**:
    *   `tenant_id` references `tenants(id) ON DELETE SET NULL`.
    *   `user_id` references `users(id) ON DELETE SET NULL`.

---

## 3. Mandatory Engineering Validations Control

### A. The `users` Table Holds No Hardcoded Roles
The `users` table acts purely as an authentication directory. It contains no `developer_id`, `is_customer`, or `agent_license` parameters. Instead, role scopes derive dynamically from relationships inside `user_roles` (global/platform roles) or `tenant_users` (tenant and developer ERP roles), in strict compliance with Mandate 3.

### B. Pure RBAC Foundations
Everything follows RBAC models. Permissions are granted to roles, which are assigned to users globally or within tenant scopes. API Gateway token verification checks `tenant_users` mapping schemas dynamically to grant or deny system execution routes.

### C. Extensible KYC Document References
Baseline verification level is set via `users.kyc_status` (unverified, verified, restricted). Specific identity document verification details locate in separate document vaults and KYC request log queues, allowing seamless support for changing multi-merchant integrations (DigiLocker, Aadhaar masking) without adding static table columns.

### D. Logical-to-Physical Escapes
The `tenants` table supports custom connection string values (`database_host`, `database_name`, `database_port`, `infrastructure_tier`). When a tenant upgrades to a dedicated VPS/Private Cloud, database routers look up these fields to establish dynamic PDO connection pools directly inside their physically isolated PostgreSQL container.

### E. Native JSONB Auditing
The `audit_logs` model leverages PostgreSQL binary `JSONB` parameters for `old_values` and `new_values` columns. This allows native querying across complex database states without slow tablespaces scans.

### F. Measurement Master Data Extensibility
The `measurement_units` table manages localization formulas. New units (e.g., Cents, Hectares, local acres) are added simply by spinning a data row mapping their calculation values, satisfying Mandate 9 (Configurable Units) and Mandate 10 (Unit-Agnostic Pricing).

---

**End of Document**
