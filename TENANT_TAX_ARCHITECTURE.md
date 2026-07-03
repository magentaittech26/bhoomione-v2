# Tenant Business Tax Architecture

This document outlines the architectural specifications of the **Tenant Business Tax Engine**, which handles builder operations, plot booking levies, and construction taxation profiles.

---

## 1. Core Objectives

Builders and real estate developers operate across various state jurisdictions, requiring highly granular and flexible commercial tax logic:
- **Project Tax Profiles**: Specific taxation rules mapped on a project-by-project basis (e.g., standard GST, special affordable housing rates, or luxury surcharges).
- **State Tax Rules**: Automated assessment matching the location of the land or real estate plot.
- **TDS Compliance**: Automated withholding computations for heavy real estate booking advances.
- **Plot Booking Taxes**: Real-time tax evaluation when a customer books a layout plot.

---

## 2. Database Schema & Tables

All tenant-specific transactional tax logic is saved in partitioned databases using strict multi-tenancy safeguards.

### Table: `tax_rules`
Declares specific taxation coefficients. Each record is scoped via a `tenant_id`:
```sql
CREATE TABLE tax_rules (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    tax_type VARCHAR(50) NOT NULL, -- 'GST', 'TDS', 'STAMP_DUTY', etc.
    rate DECIMAL(5,2) NOT NULL,
    state_code VARCHAR(10) DEFAULT NULL,
    project_id INTEGER DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `tax_transactions`
The commercial ledger recording actual tax liabilities computed on client transactions:
```sql
CREATE TABLE tax_transactions (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    base_amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) NOT NULL,
    tax_details TEXT NOT NULL, -- JSON payload mapping CGST, SGST, etc.
    booking_id INTEGER DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Dynamic Calculation Engine

When a booking transaction occurs in the workspace, the engine resolves the tax liability by executing the following rule hierarchy:

1. **Project Specific Override**: Search for an active tax rule matching the specific `project_id`.
2. **State Specific Rule**: If no project rule matches, fall back to matching the `state_code` of the property's location.
3. **Global Tenant Default**: Fall back to the baseline tenant rule (e.g., standard flat 18% GST).

---

## 4. Isolation Guarantee

Tenant tax profiles and records are fully isolated. Slabs established in Tenant A's workspace are invisible to Tenant B, preventing data leaks or operational crossover.
