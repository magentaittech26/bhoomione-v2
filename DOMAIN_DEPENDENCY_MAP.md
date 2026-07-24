# BhoomiOne V3 — Domain Dependency Map Specification

## Executive Summary
The Domain Dependency Map defines the functional hierarchy and structural relationships across all business modules in BhoomiOne V3. It establishes strict parent-child ownership, lookup consumption models, and acyclic module dependencies.

---

## 1. Production Domain Hierarchy

```
Organization (SaaS Platform Context)
│
├── System & SaaS Foundation (Core Infrastructure)
│     ├── Identity & Auth
│     ├── Multi-Tenancy Engine
│     ├── RBAC & Security
│     └── Core Module Registry & Provisioning
│
├── Master Data Management (Core MDM)
│     ├── Measurement Units (core.mdm.measurement_units)
│     ├── Location Masters (Country, State, District, Taluk, Village, Pincode)
│     ├── Financial Masters (Currencies, Tax Rules, Payment Gateways)
│     └── Real Estate Taxonomy (Road Types, Amenity Types, Plot Types, Approval Authorities)
│
├── Core Real Estate Asset Hierarchy
│     ├── Projects
│     │      ├── Layouts
│     │      │      ├── Maps (GIS / DXF Spatial Maps)
│     │      │      └── Plots (Inventory & Unit Registry)
│     │      ├── Approvals & Compliance (RERA, Local Authorities)
│     │      └── Project Infrastructure (Roads, Utilities, Amenities)
│
├── Customer Relationship Management (CRM)
│     ├── Leads & Prospects
│     ├── Site Visits
│     ├── Customer Accounts
│     └── Interactions & Communication History
│
├── Commercial & Financial Transactions
│     ├── Bookings & Reservations
│     ├── Quotations & Cost Sheets
│     ├── Accounts Receivable & Invoicing
│     ├── Collections & Payment Receipts
│     └── Promo Campaigns & Discount Coupons
│
├── Operations & Execution
│     ├── Construction & Development Tracking
│     ├── Vendor & Purchase Management
│     └── Inventory & Materials Management
│
├── Enterprise Governance & Support Services
│     ├── Document Management System (DMS)
│     ├── Approval & Escalation Workflows
│     ├── Notification Engine (SMS, Email, Push)
│     ├── Audit Logging & Regulatory Traceability
│     ├── Media & Asset Vault
│     ├── Analytics & Business Intelligence
│     └── Marketplace & Add-on Integrations
```

---

## 2. Parent-Child Relationship Matrix

| Parent Domain | Child Module | Relationship Type | Cascade Policy |
|---|---|---|---|
| Tenant | Projects | 1 : N | Strict Hard Block on Active Projects |
| Tenant | Users / Roles | 1 : N | Soft Delete with Revocation |
| Project | Layouts | 1 : N | Block Deletion if Layouts Exist |
| Layout | Maps (DXF) | 1 : N | Cascade Soft Delete |
| Layout | Plots | 1 : N | Block Deletion if Plots Exist |
| Plot | Bookings | 1 : N | Block Deletion if Booking/Hold Exists |
| Customer | Leads | 1 : N | Preserve Audit History |
| Customer | Bookings | 1 : N | Block Deletion if Active Booking Exists |
| Booking | Invoices | 1 : N | Block Deletion if Invoices Exist |
| Booking | Collections / Payments | 1 : N | Block Deletion if Receipts Exist |
| Project | Construction Milestones | 1 : N | Block Deletion if Work In Progress |

---

## 3. Dependency Matrix & Directed Acyclic Graph (DAG)

```
[System Foundation / RBAC]
         │
         ▼
[Core MDM (Units, Locations, Currencies)]
         │
         ▼
[Projects]
   │    │
   │    └───────────────────────┐
   ▼                            ▼
[Layouts]               [Construction & Vendors]
   │                            │
   ▼                            │
[Plots] ◄───────────────────────┘
   │
   ▼
[CRM (Leads, Customers)]
   │
   ▼
[Commercial (Bookings, Invoices, Collections)]
   │
   ▼
[Reporting & Analytics Engine]
```

### Dependency Rules:
1. **Core MDM Modules** have ZERO dependencies on business domains.
2. **Projects** depend only on Tenant Context and Core MDM.
3. **Layouts** depend strictly on Projects.
4. **Plots** depend strictly on Layouts and Core Measurement Units.
5. **Bookings** depend on Plots, Customers, and Financial Masters.
6. **Collections** depend on Bookings and Payment Gateways.
7. **Audit & Notifications** are global decoupled observers.
