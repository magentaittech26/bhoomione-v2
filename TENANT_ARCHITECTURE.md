# BhoomiOne V3 - Tenant Workspace Architecture Specification

This document details the system design, modular boundaries, and operational characteristics of the **Tenant Workspace** (Domain 2).

---

## 1. System Vision & Audience

The Tenant Workspace is owned and operated by individual real estate builders, land developers, accounting teams, CRM users, and legal advisors. All tools, databases, and visual modules inside this domain are partitioned strictly to manage the builder's real estate business operations (e.g., selling plots, managing leads, tracking construction progress). Under no circumstances can a tenant modify SaaS subscription prices, change global SMTP servers, or access other tenants' database records.

---

## 2. Structural Module Breakdown

The Tenant Workspace includes the following functional areas, completely isolated by tenant ID:

```
+-----------------------------------------------------------------------------------------------------------------+
|                                               Tenant Workspace Modules                                          |
+-----------------------------------------------------------------------------------------------------------------+
|  [Dashboard]          -> Tenant-specific analytics (e.g., sales velocity, active leads, payment collections).    |
|  [CRM]                -> Leads pipeline, customer profiles, active agents, booking history, contact logs.       |
|  [Projects]           -> Real estate projects, site parameters, coordinates, and development specifications.    |
|  [Layouts]            -> Master physical site layouts, layout maps, phases, and total plot distributions.        |
|  [Plots]              -> Plot-by-plot specifications, facing direction, dimensions, pricing, and availability.  |
|  [Bookings]           -> Sales transactions, booking agreements, installment schemes, buyer allocation status.  |
|  [Collections]        -> Cash, check, card, or bank receipt tracking and matching against active bookings.      |
|  [Payments]           -> Builder payment gateway parameters used for taking end-buyer booking deposits.         |
|  [Commercial]         -> Dynamic tax rules (GST, TDS, stamp duties), regional overrides, and builder tax logs.  |
|  [Accounting]         -> Expenses ledger, dynamic tax records, journal entries, and income statements.         |
|  [Inventory]          -> Building materials inventory, stock cards, supplier records, and purchase approvals.   |
|  [Documents]          -> Sale deeds, NOC layouts, blueprints, CAD plans, and buyer-specific agreements.         |
|  [Approvals]          -> Internal workflow gates (e.g., approving discounts, stock dispatch, booking cancel).   |
|  [HR & Payroll]       -> Staff rosters, payroll settings, and agent commission disbursement trackers.          |
|  [Support]            -> Internal helpdesk tickets submitted to BhoomiOne platform support desk.                |
|  [Reports & Analytics]-> Land-acquisition analytics, sales tax reports, plot velocity summaries.                |
|  [Settings]           -> Local tenant profile, office address, team user invitations, local access rules.       |
+-----------------------------------------------------------------------------------------------------------------+
```

---

## 3. Commercial & Taxation Engine Detail

The builder's taxation engine (located under `Commercial -> Tax & Charges`) is highly customized for local real estate compliance:
- **Rule Declarations**: Enables declarations of GST rates, local developmental levies, and state-specific stamp duty ratios.
- **TDS Computations**: Auto-withholding percentages calculated directly during major buyer booking payments.
- **Regional Overrides**: Ability to set distinct rules matching the specific state in which a real estate project is physically located (e.g., Karnataka-specific rules applied to HSR Layout Project).
- **Separation Guarantee**: Changes made to tax rates here do not impact BhoomiOne's SaaS billing coefficients.

---

## 4. Multi-Tenant Architectural Isolation

### A. Subdomain Routing
Tenants access their workspaces via dedicated subdomain nodes:
`https://{tenant_subdomain}.bhoomione.in`
A middleware router intercepts all inbound traffic, parses the sub-domain, and matches it against the active `tenant_registry` to lock down context credentials.

### B. State Context Guard
The client app maintains state securely, binding the active `user.tenant_id` context to every single server API call. If a request is made without a valid tenant context, the server's workspace gate aborts the action immediately with an `Unauthorized Access (401)` response code.
