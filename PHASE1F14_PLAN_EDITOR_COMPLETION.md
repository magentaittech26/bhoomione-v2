# BhoomiOne V2 — Phase 1F.14: Plan Editor & Commercial Engine Completion

This document outlines the final completion specifications, functional accomplishments, and architecture details for the consolidated Commercial Engine and advanced Plan Editor in BhoomiOne V2.

## 1. Project Goal & Executive Overview

The goal of Phase 1F.14 is to deliver a fully database-driven, complete SaaS Plan Editor and Subscription Center, ensuring the **Subscription Plan** is the single commercial product and administrative source of truth for features, limits, and pricing. 

Unnecessary, confusing consumer-facing tabs (such as Plot Billing, Billing Settings, Coupons, and Promotions) have been removed, and the administration tabs are unified into 6 key workspaces:
1. **Plans** (Single catalog and Advanced Plan Editor)
2. **Add-ons** (Supplemental capabilities catalog grouped by Type)
3. **Tenant Licenses** (Ecosystem workspace active directories)
4. **Usage** (Live presentational cluster resource telemetry)
5. **Invoices** (Platform financial ledger)
6. **Audit** (Security & administrative telemetry stream)

---

## 2. Completed Implementations & Achievements

### A. Advanced Consolidated Plan Editor (Plan Landing Page)
- **Unified Controls**: Admins manage everything about a subscription plan (Details, Pricing, Core resource limits, and Feature enablement matrices) from a single modal window.
- **Plan Landing Grid**: Displays active plans with details including Name, Description, Pricing, Users, Projects, Storage, and Custom badges.

### B. Dynamic Metadata Fields & Parameters
- **Internal Notes (Administrative)**: Integrated in the General tab to store internal notes safely.
- **Renewal Behaviour**: Multi-choice parameter (`ROLL_OVER` / `SUSPEND` / `CANCEL`) in the Pricing tab.
- **Overdue Grace Period (Days)**: Numerical input to set automated suspension thresholds.

### C. Advanced Feature Enablement Matrix
- **Module Grouping**: SaaS features are dynamically categorized by module (e.g., GIS Engine, CAD Tools, Tenant Workspace).
- **Expand/Collapse Toggles**: Feature group collapsible states prevent scroll fatigue when managing comprehensive feature matrices.
- **State Inheritance**: Feature toggles are saved as precise key-value bindings through the Laravel API and persisted in PostgreSQL.

### D. Refined Add-ons Catalog Workspace
- **Category Segmentation**: Segments add-ons into Feature, Capacity, and Support Service Add-ons.
- **Metadata Badges**: Renders Category, Feature code, Capacity increments, Status, and **Purchase Availability** labels.

### E. Supercharged Tenant Licenses Directory
- **Extended Directory Table**: Displays Tenant Name, Subdomain, Active Plan, Lifespan Dates (Start, End, Next Renewal), Interactive Auto-Renew Toggle badges, Active Resource Usage (Active Users & Plots), and Status.
- **Transparent State Toggles**: Interactive auto-renewal badges trigger immediate visual indicators and clear user toast messages.

### F. Presentational Resource Usage Ledger
- **Telemetry Indicators**: Displays a detailed presentational resources list containing Name, Code, Type, Monthly, Yearly, Lifetime consumption, and limit percentage indicators.

### G. Readability & Telemetry Audit Streams
- **Advanced Telemetry Search Filters**: Filters log records by action code type, category, severity, operator, target, and dates.
- **Interactive Inspector Drawers**: Clicking an audit log opens a sidebar drawer to inspect deep payload differentials.
- **Export Utility**: One-click download of the complete filtered dataset as a standard CSV spreadsheet.

---

## 3. Architecture Blueprint

The system strictly follows a clean decoupled tiering architecture:
```
[React SPA Client View] ---> [JSON/REST Laravel API Layer] ---> [PostgreSQL SaaS Database]
```
- **Zero Express Hardcoding**: No business logic is run in Node processes. The Node server acts solely as a static file server and assets proxy.
- **Database Driven**: Feature catalogs, limits, plan states, tenant metadata, and logs are requested, mutated, and saved directly from PostgreSQL.
