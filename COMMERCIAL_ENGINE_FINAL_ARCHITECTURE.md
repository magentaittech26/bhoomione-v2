# BhoomiOne v2: Commercial Engine Final Architecture

This document locks the architectural design and operations of BhoomiOne's unified enterprise-grade commercial model.

## 1. Architectural Philosophy
BhoomiOne operates strictly under a three-tier architecture:
- **Frontend**: React 18 SPA (Vite)
- **Backend API**: Laravel 10/11 Rest APIs
- **Database**: PostgreSQL with GIS Extensions

No custom server-side business logic or local hardcoded plans exist. The system is entirely dynamic, relying on schema definitions inside PostgreSQL and routed exclusively via secure, stateless Laravel controllers.

```
       [ React SPA (SaaS Admin & Client Portal) ]
                           │
                 (Stateless HTTP REST)
                           ▼
                  [ Laravel REST APIs ]
                           │
                (Drizzle ORM / Eloquent)
                           ▼
                     [ PostgreSQL ]
```

## 2. Customer-Facing Commercial Focus
The single customer-facing entry point is the **Subscription Plan**.
- All legacy customer-facing "Plot Billing" and dynamic pricing tables are removed from client-facing flows.
- Pricing, feature matrices, and resource constraints are bounded directly to subscription tiers (e.g., *Starter*, *Growth*, *Professional*, *Enterprise*).
- Customer-facing Add-ons are categorized into **Feature**, **Capacity**, and **Service** classes, allowing precise, database-driven modular expansion of tenant capabilities.

## 3. Internal Pricing Rules Engine
The legacy plot slab pricing system is retained exclusively as an **Internal Pricing Rules** engine for administrative operations.
- Administered privately from the platform **Settings Center** under the *Internal Pricing Rules* panel.
- Allows system administrators to model standard development cost metrics and reference slabs without exposing structural complexity to the client portal.

## 4. Database Integrity & Non-Regression
- **No Table Drops**: Core subscription tables must never be dropped or structurally redefined.
- **Retroactive Compatibility**: Existing active subscriptions, custom client overrides, and transaction histories are preserved via backward-compatible migrations and the `updateOrCreate()` pattern.
- **Normalized Data Contracts**: Property name mismatches between snake_case backend parameters and camelCase React states are resolved dynamically inside data mapping layers.
