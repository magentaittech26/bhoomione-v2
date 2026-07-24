# BhoomiOne V3 — Workflow Architecture

## Executive Summary
This specification outlines state transitions, approval authorities, automated triggers, and governance rules across core business workflows in BhoomiOne V3.

---

## 1. Primary Commercial Workflow: Lead to Handover

```
[ New Lead Captured ]
         │
         ▼
[ Lead Qualification & Agent Assignment ]
         │
         ▼
[ Site Visit Scheduled & Conducted ]
         │
         ▼
[ Plot Reservation & Cost Sheet Approval ]
         │
         ▼
[ Booking Creation & Deposit Payment ]
         │
         ▼
[ Sale Agreement Execution ]
         │
         ▼
[ Milestone Payment Collection Cycle ]
         │
         ▼
[ Project Construction Completion & Compliance ]
         │
         ▼
[ Deed Registration & Physical Plot Handover ]
```

---

## 2. Detailed State Transition Specifications

### A. Lead Lifecycle
* **States**: `NEW` -> `CONTACTED` -> `QUALIFIED` -> `SITE_VISIT_SCHEDULED` -> `NEGOTIATING` -> `CONVERTED` / `LOST`.
* **Transition Guard Rules**:
  - `QUALIFIED` requires valid customer contact details.
  - `CONVERTED` automatically creates or updates the `Customer` record and attaches the `Booking`.

### B. Plot Inventory Lifecycle
* **States**: `AVAILABLE` -> `ON_HOLD` -> `BOOKED` -> `SOLD` / `BLOCKED`.
* **Transition Guard Rules**:
  - `ON_HOLD` expires automatically after tenant-configured TTL (e.g. 48 hours) unless extended by Manager approval.
  - `BOOKED` requires an active `Booking` record with verified initial deposit payment.
  - `SOLD` requires 100% collection completion or execute agreement.
  - Reset from `BOOKED` to `AVAILABLE` can ONLY occur via an approved `BookingCancelled` workflow.

### C. Booking Approval Workflow
* **States**: `DRAFT` -> `PENDING_APPROVAL` -> `APPROVED` -> `CANCELLED` -> `COMPLETED`.
* **Approval Escalation**:
  - Discount <= 5%: Auto-approved by Sales Agent.
  - Discount 5% - 15%: Requires Project Sales Manager Approval.
  - Discount > 15%: Requires Tenant Director / Owner Approval.

---

## 3. Workflow Audit & Notification Hooks
* Every state transition writes a snapshot into `audit_logs` capturing `old_state`, `new_state`, `actor_id`, and `reason`.
* Every state transition dispatches a domain event to trigger SMS/Email notifications to customers and managers.
