# BhoomiOne V3 — Domain Event Catalog

## Executive Summary
This document cataloging every domain event emitted across BhoomiOne V3 modules, including event attributes, publishers, subscribers, and downstream side effects.

---

## 1. Project Domain Events

### `ProjectCreated`
* **Publisher**: `App\Modules\Project\Services\ProjectService`
* **Payload**: `project_id`, `tenant_id`, `name`, `total_area`, `created_by`
* **Subscribers**: `AuditLogSubscriber`, `NotificationSubscriber`

### `ProjectStatusChanged`
* **Publisher**: `App\Modules\Project\Services\ProjectService`
* **Payload**: `project_id`, `tenant_id`, `old_status`, `new_status`, `updated_by`
* **Subscribers**: `LayoutSubscriber`, `AnalyticsSubscriber`

---

## 2. Layout Domain Events

### `LayoutCreated`
* **Publisher**: `App\Modules\Layout\Services\LayoutService`
* **Payload**: `layout_id`, `project_id`, `tenant_id`, `name`, `code`
* **Subscribers**: `AuditLogSubscriber`

### `LayoutApproved`
* **Publisher**: `App\Modules\Layout\Services\LayoutService`
* **Payload**: `layout_id`, `project_id`, `tenant_id`, `approved_by`, `approval_number`
* **Subscribers**: `ConstructionSubscriber`, `PlotSubscriber`, `NotificationSubscriber`

---

## 3. Plot Domain Events

### `PlotCreated`
* **Publisher**: `App\Modules\Plot\Services\PlotService`
* **Payload**: `plot_id`, `layout_id`, `tenant_id`, `plot_number`, `area`, `unit_id`
* **Subscribers**: `AuditLogSubscriber`, `GisSubscriber`

### `PlotStatusChanged`
* **Publisher**: `App\Modules\Plot\Services\PlotService`
* **Payload**: `plot_id`, `tenant_id`, `old_status`, `new_status`, `reason`
* **Subscribers**: `CrmSubscriber`, `AiPricingSubscriber`, `AnalyticsSubscriber`

---

## 4. CRM & Sales Events

### `CustomerCreated`
* **Publisher**: `App\Modules\Crm\Services\CustomerService`
* **Payload**: `customer_id`, `tenant_id`, `name`, `email`, `phone`
* **Subscribers**: `AuditLogSubscriber`, `NotificationSubscriber`

### `SiteVisitCompleted`
* **Publisher**: `App\Modules\Crm\Services\SiteVisitService`
* **Payload**: `site_visit_id`, `tenant_id`, `customer_id`, `project_id`, `feedback`
* **Subscribers**: `LeadScoringAiSubscriber`, `NotificationSubscriber`

---

## 5. Commercial & Financial Events

### `BookingCreated`
* **Publisher**: `App\Modules\Booking\Services\BookingService`
* **Payload**: `booking_id`, `plot_id`, `customer_id`, `tenant_id`, `agreed_price`, `booking_amount`
* **Subscribers**: `PlotSubscriber`, `FinancialSubscriber`, `DocumentSubscriber`, `NotificationSubscriber`

### `BookingCancelled`
* **Publisher**: `App\Modules\Booking\Services\BookingService`
* **Payload**: `booking_id`, `plot_id`, `tenant_id`, `refund_amount`, `cancellation_reason`
* **Subscribers**: `PlotSubscriber` (resets plot to `AVAILABLE`), `FinancialSubscriber`

### `PaymentReceived`
* **Publisher**: `App\Modules\Financials\Services\FinancialService`
* **Payload**: `payment_id`, `booking_id`, `tenant_id`, `amount`, `payment_mode`, `receipt_number`
* **Subscribers**: `BookingSubscriber`, `InvoiceSubscriber`, `NotificationSubscriber`, `AuditLogSubscriber`
