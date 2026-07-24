# BhoomiOne V3 — Transaction Boundary Guide

## Executive Summary
This document establishes strict transactional boundaries, ACID isolation rules, and multi-resource commit patterns across all business domains in BhoomiOne V3.

---

## 1. Core Transaction Boundaries

### A. Plot Booking Transaction (`BookingService::createBooking`)
* **Transaction Scope**:
  1. Acquire Row Lock on Target Plot (`SELECT FOR UPDATE`).
  2. Verify Plot Status == `AVAILABLE`.
  3. Create `bookings` record with auto-generated booking code.
  4. Create initial `booking_payment_schedules` installment rows.
  5. Update `plots.status` to `BOOKED`.
  6. Create `audit_logs` record.
* **Commit Guarantee**: Atomic all-or-nothing rollback. If payment schedule fails or plot lock fails, booking creation rolls back entirely and plot remains `AVAILABLE`.

---

### B. Plot Split / Subdivision Transaction (`PlotService::subdividePlot`)
* **Transaction Scope**:
  1. Verify Parent Plot has NO active bookings or claims.
  2. Update Parent Plot status to `SUBDIVIDED` (In-Active).
  3. Create $N$ Child `plots` rows with calculated areas & dimensions.
  4. Create `plot_status_history` linkages.
  5. Commit Transaction.

---

### C. Collection Receipting Transaction (`FinancialService::recordPayment`)
* **Transaction Scope**:
  1. Validate Invoice / Payment Schedule item exists.
  2. Create `payment_logs` record with transaction reference.
  3. Create `receipt_vouchers` record.
  4. Update `saas_invoices.status` to `PAID` / `PARTIALLY_PAID`.
  5. Update `booking_payment_schedules.paid_amount` and status.
  6. Commit Transaction.

---

### D. Tenant Core Module Provisioning Transaction (`CoreModuleRegistry::provisionTenant`)
* **Transaction Scope**:
  1. Insert/Verify Tenant record.
  2. Assign Core Modules in `saas_subscription_addons`.
  3. Seed default rows in `tenant_measurement_unit_settings`.
  4. Seed tenant default roles & permissions.
  5. Commit Transaction.

---

## 2. Lock & Concurrency Control Rules
1. **Pessimistic Row Locking (`lockForUpdate()`)**: Required for plot status transitions, inventory reservation, and payment allocation to prevent double-booking race conditions.
2. **Deadlock Prevention**: Always lock resources in alphabetical or fixed hierarchy order (Project -> Layout -> Plot -> Booking).
3. **Short Transaction Lifespans**: External API calls (payment gateway authorization, SMS delivery, S3 uploads) MUST execute OUTSIDE the database transaction block.
