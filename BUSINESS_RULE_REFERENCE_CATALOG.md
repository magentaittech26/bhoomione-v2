# BhoomiOne V3 — Business Rule Reference Catalog

## Executive Summary
Complete reference catalog of the initial 5 reference rules implemented in this foundation sprint.

---

## Catalog

### 1. `project.activation.mandatory_approvals_complete`
* **Module**: Projects
* **Severity**: BLOCKING
* **Overridable**: YES
* **Description**: Project cannot be activated until all mandatory approvals are completed and valid.
* **Error Code**: `PROJECT_MISSING_APPROVALS` / `PROJECT_UNFULFILLED_APPROVALS`

---

### 2. `layout.approval.boundary_polygon_required`
* **Module**: Layouts
* **Severity**: BLOCKING
* **Overridable**: NO
* **Description**: Layout cannot be approved without a closed, valid boundary polygon geometry.
* **Error Code**: `LAYOUT_MISSING_BOUNDARY` / `LAYOUT_INVALID_POLYGON_VERTICES`

---

### 3. `plot.booking.status_available`
* **Module**: Plots
* **Severity**: BLOCKING
* **Overridable**: NO
* **Description**: Plot cannot be booked unless current status is AVAILABLE.
* **Error Code**: `PLOT_NOT_AVAILABLE`

---

### 4. `booking.confirmation.minimum_amount_received`
* **Module**: Bookings
* **Severity**: BLOCKING
* **Overridable**: YES
* **Description**: Booking cannot be confirmed until minimum deposit amount is received.
* **Error Code**: `BOOKING_INSUFFICIENT_CONFIRMED_DEPOSIT`

---

### 5. `collection.amount.not_above_outstanding`
* **Module**: Collections
* **Severity**: BLOCKING
* **Overridable**: YES
* **Description**: Payment collection cannot exceed outstanding balance unless tenant advance policy allows it.
* **Error Code**: `COLLECTION_EXCEEDS_OUTSTANDING`
