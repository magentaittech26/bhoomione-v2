# BhoomiOne V3 — Tenant Business Policy Configuration

## Executive Summary
This specification defines how individual tenants configure policy parameters without modifying core executable PHP code.

---

## 1. Parameterization vs Code
Code logic is globally standard, while parameters are tenant-specific:
* **Booking Minimum Percentage**: Configurable per tenant (e.g. 10% vs 20%).
* **Advance Payments Allowed**: Configurable boolean flag in tenant policy (`allow_advance_payments`).
* **Hold Expiry TTL**: Configurable hours (e.g., 24h, 48h, 72h).

---

## 2. Storage Table: `tenant_business_rule_policies`
```sql
CREATE TABLE tenant_business_rule_policies (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    rule_code VARCHAR(100) NOT NULL,
    parameters JSONB,
    is_enabled BOOLEAN DEFAULT TRUE,
    version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```
