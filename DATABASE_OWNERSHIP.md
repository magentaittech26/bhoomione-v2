# BhoomiOne V3 — Database Ownership Specification

## Executive Summary
This specification defines table-level ownership across all database tables in BhoomiOne V3. Every database table belongs strictly to ONE module. No foreign module may perform direct SQL writes or mutations against tables it does not own.

---

## 1. Core Platform & SaaS Infrastructure Tables

| Table Name | Owner Module | Description |
|---|---|---|
| `tenants` | Multi-Tenancy Engine | Primary tenant identity, domain, lifecycle state |
| `users` | Identity & Auth | Workspace users, authentication credentials |
| `rbac_roles` | RBAC & Security | Custom and system roles |
| `rbac_permissions` | RBAC & Security | Atomic system permissions |
| `rbac_role_permissions` | RBAC & Security | Role-permission pivot table |
| `rbac_user_roles` | RBAC & Security | User-role mapping pivot table |
| `sessions` | Identity & Auth | HTTP session state storage |
| `refresh_tokens` | Identity & Auth | OAuth / JWT refresh token store |
| `audit_logs` | Governance & Audit | Immutable system and user audit trail |

---

## 2. Core MDM Tables

| Table Name | Owner Module | Description |
|---|---|---|
| `measurement_units` | Measurement Units (`core.mdm.measurement_units`) | Platform standard unit registry & conversion standards |
| `tenant_measurement_unit_settings` | Measurement Units (`core.mdm.measurement_units`) | Tenant-isolated unit settings & display overrides |
| `location_countries` | Location Master | Country code standards |
| `location_states` | Location Master | State jurisdiction records |
| `location_districts` | Location Master | District division records |
| `location_taluks` | Location Master | Sub-district / Taluk division records |
| `location_villages` | Location Master | Village & revenue locality records |
| `location_pincodes` | Location Master | Postal index code mappings |

---

## 3. Real Estate Asset Domain Tables

| Table Name | Owner Module | Description |
|---|---|---|
| `projects` | Projects Module | Real estate development project master |
| `project_phases` | Projects Module | Sub-phase divisions within projects |
| `layouts` | Layouts Module | Layout plan sector and block structures |
| `plots` | Plots Module | Individual land unit inventory |
| `geometry_entities` | GIS & Spatial Module | Spatial vector boundaries and GIS geometries |
| `dxf_layers` | GIS & Spatial Module | DXF CAD drawing layer definitions |
| `dxf_parsing_jobs` | GIS & Spatial Module | Asynchronous DXF CAD file parsing jobs |
| `roads` | Construction Module | Layout road network specifications |
| `amenities` | Construction Module | Park, clubhouse, and utility infrastructure |

---

## 4. CRM, Commercial & Financial Tables

| Table Name | Owner Module | Description |
|---|---|---|
| `customers` | CRM Module | Customer profiles and contact info |
| `leads` | CRM Module | Prospective sales leads |
| `site_visits` | CRM Module | Site visit scheduling & logs |
| `bookings` | Bookings Module | Land unit sales agreements and reservations |
| `booking_payment_schedules` | Bookings Module | Milestone-based payment schedules |
| `saas_invoices` | Financials Module | Tax invoices and billing demand notes |
| `payment_logs` | Financials Module | Raw payment gateway transactions & receipts |
| `promo_campaigns` | Marketing Module | Promotional discount campaigns |
| `promo_coupons` | Marketing Module | Discount voucher codes |
