# BhoomiOne V2 – GST & Tax Configuration Console

This document outlines the architecture, relational database structure, and API specifications for the **Enterprise GST & Tax Configuration Console** integrated into BhoomiOne V2.

This module replaces the legacy static "GST Taxes Schema" with a dynamic, state-wise, and builder-customizable tax compliance registry.

---

## 1. Architectural Highlights

The Tax Engine is designed around a normalized, relational, non-hardcoded data-structure:
- **Centralized Rules Database:** Directs central taxes (GST, CGST, SGST, IGST), state stamp duties, land transfers (TDS under Sec 194IA), and local body cess/surcharges dynamically from PostgreSQL.
- **Dynamic State Splitting:** Detects transaction zoning boundaries in real-time. If the customer state is equal to the developer's registered state, the system automatically performs dual state-splitting (**CGST + SGST**). If it resides outside, it levies an integrated tax (**IGST**).
- **Builder-Specific Overrides:** Allows land developers to negotiate and apply concessional stamp duty structures or lower registration rates. The engine automatically overlays tenant overrides onto default platform-wide baselines.
- **Audited Ledgers:** Generates, registers, and tracks full tax breakdowns on real estate transactions and purchase invoice integrations.
- **Interactive Reports:** Powers analytical compliance dashboards by aggregating transactional levies chronologically and geographically.

---

## 2. Database Schema

### `tax_rules` Table
Stores statutory levy parameters, region limits, and custom tenant discounts.

```sql
CREATE TABLE tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tax_type VARCHAR(50) NOT NULL, -- 'CGST', 'SGST', 'IGST', 'TDS', 'STAMP_DUTY', 'REGISTRATION', 'OTHER'
    name VARCHAR(100) NOT NULL,
    rate_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    state_code VARCHAR(10) NOT NULL DEFAULT 'ALL', -- 'KA', 'MH', 'DL', 'HR', 'ALL'
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX idx_tax_rules_tenant ON tax_rules(tenant_id);
CREATE INDEX idx_tax_rules_state ON tax_rules(state_code);
```

### `tax_transactions` Table
Stores tax ledger logs resulting from integrated real estate invoice runs.

```sql
CREATE TABLE tax_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    state_code VARCHAR(10) NOT NULL,
    base_amount DECIMAL(15,2) NOT NULL,
    cgst_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    sgst_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    igst_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tds_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    stamp_duty_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    registration_charges DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    other_charges DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_invoice_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX idx_tax_transactions_tenant ON tax_transactions(tenant_id);
CREATE INDEX idx_tax_transactions_invoice ON tax_transactions(invoice_number);
```

---

## 3. Backend REST APIs

The backend REST layer is exposed via Express underneath the secure gateway (`/api/v1` routes):

1. **`GET /api/v1/admin/tax-rules`**
   - Retrieves all active and archived rules with company labels for tenant overrides.
2. **`POST /api/v1/admin/tax-rules`**
   - Creates or updates a statutory rule profile (handles rate changes, date rules, and tenant associations).
3. **`DELETE /api/v1/admin/tax-rules/:id`**
   - Soft or hard deletes a rule.
4. **`POST /api/v1/admin/tax-rules/calculate`**
   - **Request Payload:** `{ baseAmount, customerState, builderState, tenantId }`
   - Dynamically checks state zoning laws, determines dual-split (CGST/SGST) vs IGST interstate levies, searches for active overrides matching the builder profile, and returns an itemized compliance breakdown.
5. **`POST /api/v1/admin/tax-rules/invoice`**
   - Records an integrated invoice run directly to the dynamic transactions ledger.
6. **`GET /api/v1/admin/tax-rules/reports`**
   - Aggregates compliance statistics grouped by state boundaries and monthly intervals, returned in analytical graphs.

---

## 4. UI Layout Overview (Enterprise Tax Console)

The front-end is mounted within the centralized SaaS settings framework as the **GST & Tax Configuration** panel, divided into four modules:

1. **GST Rules Engine:**
   - Displays registered rules in an administrative table.
   - Flags custom "Builder Overrides" distinctly with custom badge labels.
   - Supports creating, editing, and deleting rules using a modal editor.
2. **Real-time Tax Calculator:**
   - Lets operators enter land base values, state boundaries, and select developer override profiles.
   - Provides an itemized card mapping actual central, state, local cess, TDS (1%), and stamp charges dynamically.
   - Includes a **"Generate & Record Invoice"** form to instantly log the calculations to the ledger.
3. **Compliance Ledger Logs:**
   - Displays a transaction-level log of every generated invoice, containing precise customer names, regional state codes, base land pricing, and itemized dual-tax allocations.
4. **Compliance Reports:**
   - Visualizes collected statutory liabilities across operational geographies using rich, multi-series React charts (`recharts`).
   - Displays real-time summary indicators (total sales, total GST collected, total IGST collected, etc.).
