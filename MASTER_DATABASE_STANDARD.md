# BhoomiOne V3 – Master Database Standard

To ensure structural consistency and support automated operations (such as multi-tenant isolation, synchronization, soft deletes, and auditing), every master table in BhoomiOne must implement the **Common Database Contract**.

Developers are strictly forbidden from creating custom column sets for core administrative properties. Instead, they must reuse the abstract schema fields outlined here.

---

## 1. Schema Definition (SQL)

The following represents the boilerplate SQL blueprint that every master table must inherit:

```sql
CREATE TABLE IF NOT EXISTS <plural_master_name> (
    -- Primary Identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid UUID UNIQUE DEFAULT gen_random_uuid(),
    
    -- Core Functional Attributes
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NULL,
    short_code VARCHAR(50) NULL,
    description TEXT NULL,
    
    -- Layout & Organization Attributes
    display_order INTEGER DEFAULT 0 NOT NULL,
    parent_id UUID NULL REFERENCES <plural_master_name>(id) ON DELETE SET NULL,
    category VARCHAR(100) NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    
    -- Multilingual & Future Localization Support
    localized_name JSONB DEFAULT '{}'::jsonb NOT NULL,         -- Stores language keys e.g. {"hi": "...", "kn": "..."}
    localized_description JSONB DEFAULT '{}'::jsonb NOT NULL,  -- Stores translations for descriptions
    
    -- Governance & Tenancy Rules
    is_system BOOLEAN DEFAULT FALSE NOT NULL,                  -- Protects core bootstrap data
    tenant_override_allowed BOOLEAN DEFAULT TRUE NOT NULL,    -- Allows individual tenants to modify properties
    tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE, -- NULL represents system-wide records
    
    -- Geographic/Scope Scoping
    country_code VARCHAR(10) NULL,
    state_code VARCHAR(10) NULL,
    
    -- Operational Status
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Soft Delete Standard
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Audit Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NULL,
    updated_by UUID NULL,
    
    -- Optimistic Concurrency Control
    version INTEGER DEFAULT 1 NOT NULL,
    
    -- Constraints
    CONSTRAINT uq_<master_name>_code_tenant UNIQUE(code, tenant_id) WHERE deleted_at IS NULL
);
```

---

## 2. Structural Column Guidelines

### A. Core Master Identification (`id` & `uuid`)
*   `id` is the primary internal surrogate key (UUID), used for fast indexing and foreign key references.
*   `uuid` is a secondary public identifier exposed over public APIs, preventing ID enumeration attacks.

### B. Logical Deletes (`deleted_at`)
*   **No hard deletes** are permitted on master data.
*   When a record is deleted, `deleted_at` is set to the current timestamp.
*   All search and retrieval queries must append `WHERE deleted_at IS NULL` to exclude deleted records.
*   Unique indexes on `code` must be partial (e.g. `WHERE deleted_at IS NULL`) to allow reuse of codes from deleted entries.

### C. Tenant Overrides & Scoping (`tenant_id` & `tenant_override_allowed`)
*   System-wide default records have `tenant_id = NULL`.
*   If `tenant_override_allowed = TRUE`, tenants can override or copy the master records locally, linking them to their specific `tenant_id`.

### D. Optimistic Concurrency Control (`version`)
Every write operation (PUT) must check the current `version`. Upon save, the version is incremented by 1. If the database version doesn't match the client's submitted version, the transaction is rejected, preventing race conditions or dirty writes in collaborative environments.

---

## 3. Database Indexing Rules
To maintain high query performance, every master table must implement these indexing strategies:
1.  **Search Index**: A B-tree index on the `code` and `name` columns.
2.  **Filter Index**: A composite index on `(tenant_id, is_active, deleted_at)`.
3.  **Order Index**: A B-tree index on `display_order` to optimize default sorting routines.
