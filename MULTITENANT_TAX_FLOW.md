# Multi-Tenant Tax Separation Flow Spec

This document describes the request-response lifecycles, data paths, and runtime execution sequences validating the separation of platform-level billing taxation from tenant operational billing.

---

## 1. Sequence A: BhoomiOne SaaS Invoicing Flow
*Scope: Occurs when BhoomiOne charges a Builder/Tenant for SaaS subscriptions or add-on upgrades.*

```
[ Tenant Admin ]        [ Platform App ]       [ saas_settings DB ]     [ Payment Gateway ]
       |                       |                        |                       |
       |-- Upgrade Request --->|                        |                       |
       |                       |-- Query platform- -----|                       |
       |                       |   tax coefficients     |                       |
       |                       |<- Return (cgst, sgst) -|                       |
       |                       |                                                |
       |                       |-- Compute total bill ------------------------->|
       |                       |   Base + GST (destination-based)               |
       |                       |                                                |
       |<-- Invoice Document --|------------------------------------------------|
       |    With SAC 997331    |
```

---

## 2. Sequence B: Real Estate Sales Booking Flow
*Scope: Occurs when a Builder registers a plot purchase/booking for an end-customer.*

```
[ End Customer ]        [ Tenant Admin ]       [ tax_rules DB ]       [ tax_transactions DB ]
       |                       |                        |                       |
       |-- Book Plot --------->|                        |                       |
       |   (State: KA)         |-- Fetch state rules ---|                       |
       |                       |   filtered by TenantID |                       |
       |                       |<- Return rule rate ----|                       |
       |                       |                                                |
       |                       |-- Compute sales tax -------------------------->|
       |                       |   Write liability ledger record                |
       |                       |<-- Save Confirmation --------------------------|
       |                       |
       |<-- Booking Invoice ---|
       |    & TDS calculation  |
```

---

## 3. Strict Database Segregation Guards

Every query targeting the multi-tenant tax tables (`tax_rules`, `tax_transactions`) **MUST** include a parameterized `tenant_id` constraint to prevent tenant crossover:

```typescript
// Good Pattern: Always bind queries using active context's tenant_id
const fetchTaxRules = async (tenantId: string) => {
  return db.query(
    "SELECT * FROM tax_rules WHERE tenant_id = $1 AND is_active = true",
    [tenantId]
  );
};

// Bad Pattern (Exposes system to global leakages):
const fetchAllTaxRules = async () => {
  return db.query("SELECT * FROM tax_rules"); // WRONG - DO NOT DO
};
```

By enforcing these separate entry points and isolation guards, BhoomiOne guarantees complete security and high scalability across its entire multi-tenant real estate catalog ecosystem.
