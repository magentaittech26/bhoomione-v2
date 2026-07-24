# BhoomiOne V3 — API Route Ownership Specification

## Executive Summary
This document specifies API namespace ownership across BhoomiOne V3. Routes are strictly partitioned into Platform Control Panel (`/api/v1/platform/*`) and Tenant Workspace (`/api/v1/tenant/*`).

---

## 1. Platform Master APIs (SaaS Control Panel)
*All Platform APIs require Super Admin authentication.*

| Route Prefix | Owner Module | Description |
|---|---|---|
| `/api/v1/platform/measurement-units` | Measurement Units | Governance of global standard unit registry |
| `/api/v1/platform/location-masters` | Location Masters | Managing country, state, district, and village codes |
| `/api/v1/platform/saas-modules` | Core Module Framework | Module registry & subscription catalog |
| `/api/v1/platform/tenants` | Multi-Tenancy Engine | Tenant provisioning, lifecycle & domain binding |
| `/api/v1/platform/rbac` | Security & RBAC | Master roles & system permission assignment |

---

## 2. Tenant Workspace APIs (Tenant Application)
*All Tenant APIs require Tenant Authentication and Tenant Permission Middleware.*

| Route Prefix | Owner Module | Description |
|---|---|---|
| `/api/v1/tenant/measurement-units` | Measurement Units | Workspace unit visibility, precision & default selection |
| `/api/v1/tenant/projects` | Projects Module | Real estate project CRUD & RERA management |
| `/api/v1/tenant/layouts` | Layouts Module | Layout sector plans & DXF imports |
| `/api/v1/tenant/plots` | Plots Module | Plot unit inventory, dimensions & pricing |
| `/api/v1/tenant/crm/leads` | CRM Module | Lead capturing, pipeline stages & follow-ups |
| `/api/v1/tenant/crm/customers` | CRM Module | Customer account profiles & interaction history |
| `/api/v1/tenant/bookings` | Bookings Module | Plot booking reservations, cost sheets & contracts |
| `/api/v1/tenant/financials/invoices` | Financials Module | Tax invoices, demand notes & aging reports |
| `/api/v1/tenant/financials/payments` | Financials Module | Payment receipts & online gateway webhooks |
| `/api/v1/tenant/construction` | Construction Module | Road, amenity & milestone site tracking |

---

## 3. Strict API Rules
1. **No Mixed Endpoint Ownership**: A single route controller handles endpoints belonging ONLY to its owning module.
2. **Standardized Responses**: All APIs return consistent JSON envelopes containing `success`, `data`, `meta`, and `errors`.
3. **Tenant Resolution Invariance**: Tenant routes resolve tenant context strictly via HTTP Headers or authenticated subdomains, never via user-supplied request parameters.
