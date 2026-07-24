# BhoomiOne V3 — Security & RBAC Boundaries

## Executive Summary
This document specifies multi-tenant isolation, Role-Based Access Control (RBAC), authentication scopes, and data access policies across BhoomiOne V3.

---

## 1. Multi-Tenant Data Isolation Rules

1. **Shared Database, Isolated Schema/Rows**: Every operational table contains a indexed `tenant_id` column.
2. **Global Query Scopes**: Every Eloquent model inherits `TenantScope` to automatically inject `WHERE tenant_id = current_tenant_id()` on all queries.
3. **Cross-Tenant Access Prevention**: Middleware checks verify that the authenticated user belongs to the target tenant context. Attempting to query cross-tenant primary keys returns an HTTP 404 (Not Found) to prevent resource enumeration.

---

## 2. Role-Based Access Control (RBAC) Hierarchy

```
[ Platform Super Admin ] (Full Platform SaaS Control Panel Control)
         │
         ├── [ Tenant Owner / Director ] (Full Workspace Authority)
         │          │
         │          ├── [ Tenant Admin ] (Masters Configuration & User Management)
         │          │          │
         │          │          ├── [ Project Manager ] (Projects, Layouts, Plots)
         │          │          ├── [ Sales Manager ] (Leads, Bookings, Approvals)
         │          │          ├── [ Sales Agent ] (Assigned Leads, Plot View)
         │          │          └── [ Accountant ] (Invoices, Collections, Receipts)
         │          │
         │          └── [ Read-Only Auditor ] (View Only Across Workspace)
```

---

## 3. Module Permission Matrix Specification

| Permission Code | Role Requirements | Description |
|---|---|---|
| `platform.masters.*` | Platform Super Admin | Governance of platform master registries |
| `tenant.masters.measurement_units.configure` | Tenant Owner, Tenant Admin | Configure unit visibility & display precision |
| `tenant.projects.manage` | Tenant Owner, Tenant Admin, Project Manager | Create and edit real estate projects |
| `tenant.plots.view` | All Authenticated Tenant Roles | View plot map and availability grid |
| `tenant.plots.manage` | Tenant Owner, Project Manager | Create, edit, and subdivide plot inventory |
| `tenant.bookings.create` | Tenant Owner, Sales Manager, Sales Agent | Initiate plot bookings |
| `tenant.bookings.approve` | Tenant Owner, Sales Manager | Approve cost sheet discounts & bookings |
| `tenant.financials.record_payment` | Tenant Owner, Accountant | Create payment receipts and update invoices |

---

## 4. API Authentication & Token Scopes
* **Stateless JWT / Bearer Tokens**: Auth tokens encode `user_id`, `tenant_id`, and `role_id`.
* **Token Invalidation**: User password resets or tenant suspension instantly invalidates token signatures via Redis blocklist.
