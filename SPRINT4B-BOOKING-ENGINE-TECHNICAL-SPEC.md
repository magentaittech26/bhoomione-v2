# Sprint 4B — Plot Booking Engine Technical Specification

This specification outlines the business logic, database architectures, state transitions, validation rules, and user role limitations for the **Subdivision Plot Booking and Lifecycle Management Engine** (Sprint 4B).

---

## 1. Architectural Objectives & Core Life Cycle

The Booking Engine controls land inventory availability using formal state transition models.

```
                  ┌───────────────────────────┐
                  │                           │
                  │        AVAILABLE          │◄───────────────────────┐
                  │                           │                        │
                  └─────────────┬─────────────┘                        │
                                │                                      │
                                │ (Reserve Action /                    │ (Cancel / Expire after
                                │  Max 72 Hours)                       │  Configured Period)
                                ▼                                      │
                  ┌───────────────────────────┐                        │
                  │                           │                        │
                  │        RESERVED           ├────────────────────────┘
                  │                           │
                  └─────────────┬─────────────┘
                                │
                                │ (Convert to Booking)
                                ▼
                  ┌───────────────────────────┐
                  │                           │
                  │         BOOKED            ├────────────────────────┐
                  │                           │                        │
                  └─────────────┬─────────────┘                        │
                                │                                      │ (Cancel Booking /
                                │ (Mark as Sold /                      │  Forfeit Allocation)
                                │  Full Ledger Settled)                │
                                ▼                                      │
                  ┌───────────────────────────┐                        │
                  │                           │                        │
                  │          SOLD             │◄───────────────────────┘
                  │                           │
                  └───────────────────────────┘
```

### 🚫 Strict Limits & Excluded Scopes (Anti-Overengineering Rule)
* **No Payments Integration**: No cash-gate integrations (Stripe, Razorpay, or banks API) shall be built or designed. Mapped allocations rely entirely on administrative approvals and manual verification entries.
* **No CRM or External Portals**: No client-facing registration dashboards, external buyer profiles, or active email alerts are implemented. All operations occur in the internal BhoomiOne back-office workspace.
* **No WhatsApp or SMS Messaging**: Zero automatic notification triggers or SMS alerts shall be modeled.
* **No Loan or Financing Systems**: Refrains from designing interest calculator schedules, amortizations, legal escrow agreements, or financial loan applications.

---

## 2. Database Schema & Models Declarations

Three normalized relational models govern the booking workflow: `reservations`, `bookings`, and `booking_audit_logs`.

```
  ┌─────────────────────────────────┐           ┌─────────────────────────────────┐
  │          reservations           │           │            bookings             │
  ├─────────────────────────────────┤           ├─────────────────────────────────┤
  │ id: uuid (PK)                   │           │ id: uuid (PK)                   │
  │ tenant_id: index (FK)           │           │ tenant_id: index (FK)           │
  │ plot_id: uuid (FK, Unique)      │           │ plot_id: uuid (FK, Unique)      │
  │ reserved_by_id: uuid (FK)       │           │ reservation_id: uuid (FK)       │
  │ customer_name: varchar          │           │ booked_by_id: uuid (FK)         │
  │ customer_phone: varchar         │           │ booking_unit_code: varchar      │
  │ expires_at: timestamp           │           │ customer_details: jsonb         │
  │ status: enum (ACTIVE, EXPIRED)  │           │ allocation_date: timestamp      │
  └────────────────┬────────────────┘           └────────────────┬────────────────┘
                   │                                             │
                   └──────────────────────┬──────────────────────┘
                                          │
                                          ▼
                        ┌──────────────────────────────────┐
                        │        booking_audit_logs        │
                        ├──────────────────────────────────┤
                        │ id: uuid (PK)                    │
                        │ tenant_id: index (FK)            │
                        │ plot_id: uuid (FK)               │
                        │ action: enum (RESERVE, CANCEL...)│
                        │ user_id: uuid (FK)               │
                        │ metadata: jsonb                  │
                        └──────────────────────────────────┘
```

### A. Model: `Reservation` (`reservations` table)
* **`id`** (`uuid`, Primary Key)
* **`tenant_id`** (`integer`, Foreign Key with strict multi-tenant index)
* **`plot_id`** (`uuid`, Foreign Key, unique constraint when state is active)
* **`reserved_by_id`** (`uuid`, Foreign Key linking back to `users`)
* **`customer_name`** (`string`, Mandatory input)
* **`customer_phone`** (`string`, Required validation)
* **`expires_at`** (`timestamp`, Scheduled expiration limit)
* **`status`** (`enum`: `ACTIVE`, `EXPIRED`, `RELEASED`, `CONVERTED`)

### B. Model: `Booking` (`bookings` table)
* **`id`** (`uuid`, Primary key)
* **`tenant_id`** (`integer`, Foreign Key with strict multi-tenant index)
* **`plot_id`** (`uuid`, Foreign Key, unique constraint)
* **`reservation_id`** (`uuid`, Nullable Foreign Key linking to source reservation)
* **`booked_by_id`** (`uuid`, Foreign Key linking back to `users`)
* **`booking_unit_code`** (`string`, Alphanumeric sequence pattern)
* **`customer_details`** (`jsonb`, Holds name, phone, documentation records metadata)
* **`allocation_date`** (`timestamp`)

### C. Model: `BookingAuditLog` (`booking_audit_logs` table)
An immutable, append-only log ledger tracing state mutations.
* **`id`** (`uuid`, Primary key)
* **`tenant_id`** (`integer`, Space isolator)
* **`plot_id`** (`uuid`, Foreign Key scope)
* **`action`** (`enum`: `RESERVE`, `CANCEL_RESERVATION`, `BOOK`, `CANCEL_BOOKING`, `MARK_SOLD`)
* **`user_id`** (`uuid`, System user triggering event)
* **`metadata`** (`jsonb`, Saves old state, new state, client payloads)
* **`created_at`** (`timestamp`)

---

## 3. Strict Transition Rules & Validation Logic

### Rule 1: Placement of Reservation
* **Pre-condition**: The target plot's inventory status column must equal exactly `AVAILABLE`.
* **Validation**:
  * Check that no other active, non-expired reservations point to this `plot_id`.
  * Multi-column unique indices ensure only one non-expired reservation can bind to a specific `plot_id` in a single tenant block.
* **Post-action**:
  - Update `plots.status` to `RESERVED`.
  - Set expiration date to $CurrentTime + T_{cfg}$ (where default $T_{cfg} = 72 \text{ Hours}$).
  - Log an audit event with action `RESERVE`.

### Rule 2: Automatic Reservation Expiration
* **Verification Loop**: Running a cron command or an on-demand viewport query checks for reservations where `expires_at < CURRENT_TIMESTAMP` and `status = 'ACTIVE'`.
* **Action**:
  - Update `reservations.status = 'EXPIRED'`.
  - Re-set target `plots.status = 'AVAILABLE'`.
  - Commit audit record `CANCEL_RESERVATION` with system-triggered notes.

### Rule 3: Allocation Conversion (Booking)
* **Pre-condition**: The source plot's inventory status column must equal exactly `RESERVED`.
* **Validation**:
  - Requires a valid active `reservation_id` lookup.
  - The performing user must provide core consumer details (customer metadata).
* **Post-action**:
  - Set reservation status to `CONVERTED`.
  - Create standard entry under `bookings` mapping the allocation context.
  - Set `plots.status = 'BOOKED'`.
  - Commit audit record `BOOK`.

---

## 4. Role-Based Access Control (RBAC) Entitlements

The following matrix restricts actions based on the authenticated employee role context:

| System Operation | SALES_EXECUTIVE | SALES_MANAGER | DEVELOPER_ADMIN |
| :--- | :---: | :---: | :---: |
| **Place Reservation (72h)** | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Cancel Reservation** | ❌ Forbidden | ✅ Allowed | ✅ Allowed |
| **Convert to Booking** | ⚠️ Only assigned | ✅ Allowed | ✅ Allowed |
| **Cancel Active Booking** | ❌ Forbidden | ❌ Forbidden | ✅ Allowed |
| **Mark Plot as SOLD** | ❌ Forbidden | ✅ Allowed | ✅ Allowed |

* **Enforcement Guard**: Backend controllers validate requested operations against the token's active roles scope before committing transaction queries to the database.

---

## 5. Viewer Integration Spec: Plot Drawer Interactive Panel

The Plot Details Drawer (built under Sprint 4A) is dynamically extended to show context-specific workflow actions:

```
┌────────────────────────────────────────────────────────┐
│ [Drawer Title]: Plot Specifications Panel              │
├────────────────────────────────────────────────────────┤
│ Plot Identifier: Plot 402-A                            │
│ Size / Dimensions: 2,450.00 Sq.Ft. (40' x 60')         │
│ State Status: [AVAILABLE / RESERVED / BOOKED / SOLD]   │
├────────────────────────────────────────────────────────┤
│                       ACTIONS                          │
│                                                        │
│  [IF: AVAILABLE]                                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ⚡ Reserve Plot (72h Hold)                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  [IF: RESERVED]                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 💼 Convert to Formal Booking                     │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ ❌ Release/Cancel Hold Reservation (Mgr Only)     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  [IF: BOOKED]                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 👁️ View Booking Details (Read-only)              │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 💳 Complete Sale / Mark as SOLD (Mgr Only)       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  [IF: SOLD]                                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🔒 Sealed Record (Audit Log Traceable)           │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Action Form Interactions (Modals inside Drawer tab):
- **"Reserve" Trigger**: Displays a simple configuration prompt capturing *Customer Name* and *Consumer Phone*, validating numeric inputs. Clicking confirms the 72h reserving threshold.
- **"Convert to Booking" Form**: Captures basic documentation tags such as *Address*, *Allotted Premium Rate*, and *Downpayment Voucher Receipt Number* (metadata tags under `customer_details`), converting state to `BOOKED`.
- **"Mark Sold" Trigger**: Triggers a dual-factor safety clearance warning modal: *"This locks the subdivision parcel permanently down, converting files to read-only. Proceed?"*. Action mutates inventory state to final `SOLD`.

---

## 6. Real-time Audit Trace Matrix

Every state mutation logs granular records to the immutable audit database ledger:

| Action Code | Logged Values (Metadata) | Target Entity |
| :--- | :--- | :--- |
| `RESERVE` | `plot_id`, `customer_name`, `expires_at`, `operator_id` | `reservations` |
| `CANCEL_RESERVATION` | `plot_id`, `reason` (Expired / Manager Release), `operator_id` | `reservations` |
| `BOOK` | `plot_id`, `reservation_id`, `allocation_code`, `operator_id` | `bookings` |
| `CANCEL_BOOKING`| `plot_id`, `booking_id`, `forfeit_fee_notes`, `deleted_by` | `bookings` |
| `MARK_SOLD` | `plot_id`, `final_selling_value`, `authorized_by` | `plots` |

---
*End of technical specifications for Sprint 4B.*
