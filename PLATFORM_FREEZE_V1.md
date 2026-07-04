# BhoomiOne V1.0 Platform Freeze Directive

**Date:** July 4, 2026  
**Status:** ARCHITECTURE LOCKED  
**Scope:** BhoomiOne V1.0 Core Release  

---

## 1. Executive Directive

This document establishes the official **Platform Freeze** for BhoomiOne V1.0. The core architecture, database boundaries, module directories, and functional scopes defined herein are officially locked. No structural refactoring, module relocation, visual restructuring, or multi-tenant paradigm shifts are permitted without explicit formal review and constitution amendment.

---

## 2. Frozen Functional Modules & Boundaries

### 2.1 SaaS Platform Management (`saas_`)
- **Status:** **FROZEN**
- **Boundary:** All global plans, platform settings, module registries, features, and platform-wide configurations.
- **Rules:** The separation between the SaaS administrative tier (controlling tenant entitlements, limits, and plan configurations) and the customer tenant databases remains absolute. 

### 2.2 Tenant Architecture Boundaries (`tenants`)
- **Status:** **FROZEN**
- **Boundary:** Isolates individual builder/developer workspaces. 
- **Rules:** 
  - Cross-tenant database leakage is strictly forbidden.
  - All tenant routing, domain resolution, feature flags, and custom limits are encapsulated within the tenant context.
  - Direct database mixing or shared record updates without tenant resolution checks are strictly disallowed.

### 2.3 Inventory Management Core (`projects`, `layouts`, `plots`)
- **Status:** **FROZEN**
- **Boundary:** The layout, plot, road, amenity, and geometric entities schema.
- **Rules:** The three-tier inventory structure (**Projects ➔ Layouts ➔ Plots**) remains the bedrock of BhoomiOne's inventory representation. No changes to the standard properties or relations of these core inventory models.

### 2.4 Map-First Principle
- **Status:** **FROZEN**
- **Boundary:** Interactive vector map visualization utilizing generated SVG components.
- **Rules:** BhoomiOne is a Map-First product. Visualizing spatial data, real-time availability colors, select handlers, and SVG overlay configurations directly on layouts cannot be bypassed in premium tiers.

### 2.5 Subscription Center & Addon Store
- **Status:** **FROZEN**
- **Boundary:** Plan configuration, limits (e.g., plot capacities, user accounts), billing periods, and active tenant subscriptions.
- **Rules:** All active subscription evaluations, status checks, and gatekeep checks are frozen.

### 2.6 Promo Engine & Campaigns (`promo_`)
- **Status:** **FROZEN**
- **Boundary:** Discount codes, multi-currency campaign rules, and coupon parameters.
- **Rules:** Discount and promotional calculations are frozen.

### 2.7 Platform Tax Engine (`tax_`)
- **Status:** **FROZEN**
- **Boundary:** Indian Standard GST (CGST, SGST, IGST) state-based tax evaluation rules and audit ledger.
- **Rules:** Automated calculation of taxes based on billing state of the builder is locked.

### 2.8 Communications Engine (`email_logs`, `notification_logs`)
- **Status:** **FROZEN**
- **Boundary:** SMTP relays, custom email templates, system alert logs, WhatsApp template registers, and retry mechanisms.
- **Rules:** Multi-channel alerting channels and background retry queues are frozen.

### 2.9 Invoice & Accounts Receivable (`saas_invoices`)
- **Status:** **FROZEN**
- **Boundary:** Invoicing ledger, multi-currency base calculations, payment registration (`invoice_payments`), credit-note/refund auditing (`invoice_credits_refunds`), and audit histories (`invoice_audits`).
- **Rules:** Accounts Receivable flow, balancing, and state transitions are locked.

---

## 3. Allowed and Forbidden Future Changes

### 3.1 Allowed Changes
The following modifications are permitted under the freeze rules:
*   **Critical Bug Fixes:** Resolving crash-causing backend errors, rendering defects, or functional logic failures.
*   **Security Patches:** Repairing vulnerabilities, cross-site scripting (XSS), SQL injection, or unauthenticated route leakages.
*   **Performance Improvements:** Optimizing database indexes, refactoring slow SQL queries, caching slow endpoints, or reducing browser memory usage.
*   **Minor UX Polish:** Tweaking borders, spacing, padding, micro-interactions, animations, and typos.

### 3.2 Strictly Forbidden Changes
The following modifications are **STRICTLY FORBIDDEN** unless formally amended:
*   **Navigation & Workspace Redesign:** Altering the persistent main sidebar layout, drawer menus, top navigation bars, or view structures.
*   **Module Relocation:** Moving backend controllers, database migrations, types, or front-end modules out of their defined directories.
*   **Database Schema Alterations:** Altering, dropping, or bypassing existing database schemas, foreign keys, or uuid constraints.
*   **Platform & Tenant Mixing:** Combining platform settings or schemas into the tenant workspace data, or vice versa.
*   **Subscription Engine Redesign:** Rewriting how limits, addons, or plan-feature gates are verified at runtime.
*   **Inventory Core Redesign:** Changing relationships between projects, layouts, and plots, or introducing an intermediate level.
*   **Removing Map-First Principles:** Allowing Layouts or Plots to drop interactive vector representation in favor of generic static sheets on premium plans.

---

## 4. Certification and Attestation

By establishing this freeze, BhoomiOne V1.0 achieves operational stability, enabling high-performance production runtime testing without regression risk. All future feature proposals must be logged in the roadmap tracker for subsequent major version planning.
