# BhoomiOne V3 – GST & Tax Database Design

Database schema configuration, table definitions, constraints, index structures, and migration pathways are strictly managed under Laravel Eloquent. No manual schema modifications are made on production; all changes utilize Schema migration scripts.

---

## 1. Table: `tax_rules`

Stores active, expired, and pending state-specific and builder-specific statutory rate structures.

### Physical Schema definition (PostgreSQL)

```sql
CREATE TABLE tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    tax_type VARCHAR(50) NOT NULL, -- 'CGST', 'SGST', 'IGST', 'TDS', 'STAMP_DUTY', etc.
    name VARCHAR(255) NOT NULL,
    rate_percentage NUMERIC(5, 2) DEFAULT 0.00,
    state_code VARCHAR(10) NOT NULL DEFAULT 'ALL', -- 'KA', 'MH', 'ALL'
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    builder_name VARCHAR(255),
    amount_type VARCHAR(50) NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
    fixed_amount NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE -- Supports safe soft-deleting
);
```

### Key Performance Indexes:
```sql
-- Fast lookup of active rules matching a specific state and builder scope
CREATE INDEX idx_tax_rules_lookup 
ON tax_rules (tenant_id, state_code, tax_type, is_active) 
WHERE deleted_at IS NULL;

-- Fast index for effective date range querying
CREATE INDEX idx_tax_rules_effective_dates 
ON tax_rules (effective_from, effective_to);
```

---

## 2. Table: `tax_transactions`

Acts as the immutable statutory audit ledger mapping every finalized property invoice, capturing the exact computed components for compliance reporting.

### Physical Schema definition (PostgreSQL)

```sql
CREATE TABLE tax_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    state_code VARCHAR(10) NOT NULL,
    base_amount NUMERIC(15, 2) NOT NULL,
    cgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tds_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    stamp_duty_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    registration_charges NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    other_charges NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_invoice_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Key Performance Indexes:
```sql
-- Fast analytics lookups for state-wise compliance reporting
CREATE INDEX idx_tax_transactions_analytics 
ON tax_transactions (tenant_id, state_code, created_at)
WHERE deleted_at IS NULL;
```

---

## 3. Database Integrity & Constraints

1. **Tenant Isolation Check**: Custom DB triggers or backend Global Scopes enforce that `tenant_id` matches the resolved tenant header on all select, update, and delete actions.
2. **Soft Deletion (`deleted_at`)**: Ensures that when compliance rules are deleted, historical invoice lookups do not crash. Foreign keys are preserved, and active calculation pipelines are isolated.
3. **Immutability of Ledger**: The `tax_transactions` table enforces a strict non-updatable constraint via application routing. All returns, modifications, or errors require issuing separate Credit Notes or reversal transactions, preserving the audit trail.
