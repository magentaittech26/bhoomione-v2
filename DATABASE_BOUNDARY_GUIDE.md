# BhoomiOne V3 - Multi-Tenant Database Boundary & Security Guide

This document defines the physical schema isolation structures, partition rules, and database query guardrails designed to prevent multi-tenant data leaks.

---

## 1. Physical Table Classifications

BhoomiOne splits its databases into two strict zones. All tables must fit into exactly one zone:

### Zone 1: Platform Administration Tables (`platform_*`, `saas_*`, `subscriptions_*`)
These tables store global platform state, system telemetry, subscription master plans, and the routing directory.

- `saas_settings`: Single global key-value store containing platform configuration (e.g., global SMTP, platform tax rates, domain patterns).
- `tenant_registry`: Central index of all active builder subdomains, assigned databases, and server containers.
- `subscriptions_plans`: Master catalog containing BhoomiOne's standard billing pricing plans.
- `subscriptions_addons`: Standard price rates for upgrading optional workspace features.

### Zone 2: Tenant Workspace Tables (`tenant_*`, business operations tables)
These tables store isolated transactional records belonging to individual builder businesses. Every record inside Zone 2 is partitioned by a `tenant_id` or `tenant_code`.

- `projects`: Real estate project titles, addresses, coordinates, and development specs.
- `layouts`: Site layouts, physical parcel distribution files, and development milestones.
- `plots`: Parallelograms, status values (Available, Booked, Blocked), and unit base price tags.
- `customers`: Sales leads, buyer details, and CRM logs.
- `bookings`: Installment details, buying agreements, and parcel allocations.
- `tax_rules`: Builder-specific GST, TDS, and stamp duty parameters.
- `tax_transactions`: Ledger entries tracking buyer tax liability.
- `documents`: CAD designs, sales deeds, and layout blueprint files.

---

## 2. Multi-Tenancy Query Safeguards

To prevent cross-tenant data leaks, all data-access methods targeting Zone 2 (Tenant Operations) must enforce strict parameterized isolation guards.

### The `tenant_id` Filter Constraint

When executing queries against Tenant Tables, you must ALWAYS include the active user context's verified `tenant_id` or `tenant_code`.

#### ❌ Secure Failure (DO NOT WRITE):
```typescript
// Exposes the query to data leakages if the parameter list is empty
const loadAllPlotsInDatabase = async () => {
  return await db.query("SELECT * FROM plots WHERE status = 'AVAILABLE'");
};
```

#### ✅ Secure Pattern (MANDATORY):
```typescript
// Binds the active tenant_id context as a strict parameter
const loadAllPlotsInDatabase = async (tenantId: string) => {
  return await db.query(
    "SELECT * FROM plots WHERE tenant_id = $1 AND status = 'AVAILABLE'",
    [tenantId]
  );
};
```

---

## 3. Storage & API Isolation

1. **API Routing Guards**: Backend endpoint controllers (e.g., `/api/plots`, `/api/bookings`) must read the `tenant_id` directly from the authenticated session context, rather than relying on a query parameter submitted by the browser.
2. **Dynamic Schema Partitioning**: In heavy enterprise deployments, the system reads the `tenant_registry` to dynamically route a subdomain request to a completely separate PostgreSQL database cluster.
3. **No Cross-Zone Joins**: Standard server queries must never perform SQL `JOIN` operations across Zone 1 (`saas_settings`) and Zone 2 (`plots`, `bookings`). This preserves the absolute separation of the platform administration and business operations tables.
