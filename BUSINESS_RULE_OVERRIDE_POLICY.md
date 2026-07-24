# BhoomiOne V3 — Business Rule Override & Waiver Policy

## Executive Summary
Provides a secure, audited mechanism for authorized tenant managers to grant waivers for overridable business rules without compromising security.

---

## 1. Overridability Governance
* **Overridable Rules**:
  - `project.activation.mandatory_approvals_complete`
  - `booking.confirmation.minimum_amount_received`
  - `collection.amount.not_above_outstanding`
* **Non-Overridable Rules**:
  - `plot.booking.status_available` (Cannot book already sold/booked plot)
  - `layout.approval.boundary_polygon_required` (Cannot approve layout without geometry)
  - Cross-tenant access & security isolation rules.

---

## 2. Override Approval Lifecycle
1. Request submitted by Sales Agent -> Status `REQUESTED`.
2. Sales Manager / Tenant Owner approves -> Status `APPROVED`.
3. Business Rules Engine detects active override in `business_rule_overrides` and evaluates rule as PASSED.
4. Override status updated to `USED` or expires after TTL (`expires_at`).
