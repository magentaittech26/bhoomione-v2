# BhoomiOne V3 — Entity Delete Rules & Integrity Constraints

## Executive Summary
This document specifies the deletion policy, integrity constraints, foreign key cascades, and blocking conditions across all entity types in BhoomiOne V3.

---

## 1. Global Deletion Policies
* **Hard Deletes**: Restricted strictly to temporary operational scratchpads or uncommitted drafts.
* **Soft Deletes (`deleted_at`)**: Standard for operational business entities (Projects, Layouts, Plots, Customers, Invoices) to maintain historical audit compliance.
* **Referential Block**: An entity referenced by active business transactions CANNOT be deleted (hard or soft) without resolving dependent records.

---

## 2. Entity Integrity Matrix

| Entity | Can Delete? | Delete Type | Blocked When Referenced By | Cascade Action |
|---|---|---|---|---|
| **Tenant** | Platform Admin Only | Soft Delete | Active Subscriptions, Invoices | Disable tenant access immediately |
| **Project** | Yes | Soft Delete | Active Layouts, Active Plots, Bookings | Hard blocked if active layouts or bookings exist |
| **Layout** | Yes | Soft Delete | Active Plots | Hard blocked if plots exist |
| **Plot** | Yes | Soft Delete | Active Bookings, Payments, Invoices | Hard blocked if booked, reserved, or sold |
| **Customer** | Yes | Soft Delete | Active Bookings, Collections, Agreements | Hard blocked if active financial records exist |
| **Lead** | Yes | Soft Delete | Converted Customer | Preserved as archived history |
| **Booking** | No (Cancel Only) | Soft Delete (Cancelled) | Payment Receipts, Tax Invoices | Status updated to `CANCELLED`; history preserved |
| **Invoice** | No (Void Only) | Status Transition | Payment Logs | Status updated to `VOID` |
| **Payment Receipt** | No | Immutable | Financial Audit Trail | Deletion strictly forbidden |
| **Measurement Unit** | System: No / Tenant Custom: Yes | Soft Delete | Active Projects, Active Plots | Blocked if referenced by active plot/project |
| **User** | Yes | Soft Delete | Activity Logs, Assigned Leads | Revoke permissions; preserve audit logs |

---

## 3. Orphan Prevention Rules
1. **Plots**: Cannot be orphaned without a parent Layout.
2. **Layouts**: Cannot be orphaned without a parent Project.
3. **Invoices**: Cannot be orphaned without a parent Tenant and Booking/Account.
4. **Audit Trail**: Audit logs (`audit_logs`) CANNOT be soft or hard deleted by any role, including Tenant Admin or Super Admin.
