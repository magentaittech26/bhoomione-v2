# BhoomiOne V3 — Module Boundary Specification

## Executive Summary
This document defines explicit responsibilities, data boundaries, event contracts, and internal/external integration rules for every business module in BhoomiOne V3. No module may execute queries against another module's database tables or duplicate functional boundaries.

---

## 1. Projects Module (`App\Modules\Project`)
* **Purpose**: Single source of truth for real estate development projects, land parcels, RERA registrations, and top-level governance.
* **Responsibilities**: Project registration, phase planning, boundary specifications, total site area calculation, RERA compliance tracking.
* **Data Owned**: `projects`, `project_phases`, `project_approvals`.
* **Data Consumed**: Location Masters, Measurement Units, Tenant Context.
* **Events Published**: `ProjectCreated`, `ProjectUpdated`, `ProjectStatusChanged`, `ProjectArchived`.
* **Events Consumed**: None.
* **Internal Dependencies**: Core MDM.
* **External Dependencies**: Google Maps Platform (Geocoding/Bounds).

---

## 2. Layouts Module (`App\Modules\Layout`)
* **Purpose**: Sector, block, and layout plan management within real estate projects.
* **Responsibilities**: Layout boundaries, master plan attachment, sector partitioning, land area conversion calculations.
* **Data Owned**: `layouts`, `layout_sectors`, `layout_documents`.
* **Data Consumed**: Projects, Measurement Units.
* **Events Published**: `LayoutCreated`, `LayoutApproved`, `LayoutLocked`.
* **Events Consumed**: `ProjectStatusChanged`.
* **Internal Dependencies**: Projects Module.
* **External Dependencies**: GIS DXF Parser Engine.

---

## 3. Plots Module (`App\Modules\Plot`)
* **Purpose**: Land plot unit inventory management.
* **Responsibilities**: Plot geometry definition, area calculations, dimension tracking, status lifecycle (Available, On Hold, Booked, Sold, Blocked), plot pricing slabs.
* **Data Owned**: `plots`, `plot_dimensions`, `plot_status_history`.
* **Data Consumed**: Layouts, Measurement Units.
* **Events Published**: `PlotCreated`, `PlotStatusChanged`, `PlotPriceUpdated`, `PlotDimensionUpdated`.
* **Events Consumed**: `BookingCreated`, `BookingCancelled`, `LayoutLocked`.
* **Internal Dependencies**: Layouts, Projects, Measurement Units.
* **External Dependencies**: None.

---

## 4. CRM Module (`App\Modules\Crm`)
* **Purpose**: End-to-end customer lifecycle, lead capturing, pipeline tracking, and customer profiles.
* **Responsibilities**: Lead intake, lead qualification, agent assignment, site visit scheduling, customer contact profiles, interaction timeline.
* **Data Owned**: `customers`, `leads`, `site_visits`, `customer_notes`.
* **Data Consumed**: Projects, Users/Agents.
* **Events Published**: `LeadCreated`, `LeadAssigned`, `SiteVisitCompleted`, `CustomerCreated`.
* **Events Consumed**: `BookingCreated`.
* **Internal Dependencies**: Tenant Users.
* **External Dependencies**: SMS/Email Gateways.

---

## 5. Bookings Module (`App\Modules\Booking`)
* **Purpose**: Commercial reservation and plot sale contract management.
* **Responsibilities**: Plot reservation, cost sheet generation, payment schedule generation, booking agreement drafting, booking cancellation and transfer.
* **Data Owned**: `bookings`, `booking_payment_schedules`, `booking_cancellations`.
* **Data Consumed**: Plots, Customers, Projects, Promo Coupons.
* **Events Published**: `BookingCreated`, `BookingApproved`, `BookingCancelled`, `BookingTransferred`.
* **Events Consumed**: `PaymentReceived`, `PlotPriceUpdated`.
* **Internal Dependencies**: Plots, CRM, Tax Engine.
* **External Dependencies**: PDF Generation Engine.

---

## 6. Collections & Invoicing Module (`App\Modules\Financials`)
* **Purpose**: Accounts receivable, invoice dispatch, payment receipting, and gateway reconciliation.
* **Responsibilities**: Demand note generation, tax invoice creation, online & offline payment recording, receipt voucher generation, aging analysis.
* **Data Owned**: `saas_invoices`, `payment_logs`, `receipt_vouchers`, `tenant_billing_overrides`.
* **Data Consumed**: Bookings, Customers, Payment Gateways.
* **Events Published**: `InvoiceGenerated`, `PaymentReceived`, `PaymentFailed`, `ReceiptIssued`.
* **Events Consumed**: `BookingCreated`, `BookingCancelled`.
* **Internal Dependencies**: Bookings, CRM.
* **External Dependencies**: Razorpay, Stripe, Bank Gateway APIs.

---

## 7. Construction & Site Operations (`App\Modules\Construction`)
* **Purpose**: Infrastructure development tracking, road layout progress, utility laying, and amenity installation.
* **Responsibilities**: Work breakdown structure (WBS), milestone tracking, contractor assignments, physical progress logging.
* **Data Owned**: `roads`, `amenities`, `construction_milestones`, `contractor_logs`.
* **Data Consumed**: Projects, Layouts, Measurement Units.
* **Events Published**: `ConstructionStarted`, `MilestoneCompleted`, `AmenityDelivered`.
* **Events Consumed**: `LayoutApproved`.
* **Internal Dependencies**: Projects, Layouts.
* **External Dependencies**: Mobile Inspection Apps.
