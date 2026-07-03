# BhoomiOne V3 - Module Ownership & Domain Boundary Matrix

This document defines the strict ownership rules, functional restrictions, and modular boundaries established to keep the **SaaS Platform (BhoomiOne)** separated from the **Tenant Business (Builder)**.

---

## 1. Modular Matrix Grid

| Platform/Tenant Module | Owned By | Affects | Access Group | Location in Repository | Database Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SaaS Subscription Plans** | SaaS Platform | All Tenants | Super-Admin | `src/components/saas/` | `saas_settings` |
| **Global SMTP Relay** | SaaS Platform | All Tenants | Super-Admin | `src/components/saas/` | `saas_settings` |
| **Platform Wildcard DNS** | SaaS Platform | All Tenants | Super-Admin | `src/components/saas/` | `saas_settings` |
| **Tenant Registry** | SaaS Platform | All Tenants | Super-Admin | `src/components/saas/` | `tenant_registry` |
| **Platform Taxation** | SaaS Platform | All Tenants | Super-Admin | `src/components/saas/` | `saas_settings` |
| **Plot Sales Slabs** | Tenant Workspace| Single Tenant| Builder Accountant | `src/components/InventoryManager.tsx` | `tax_rules` |
| **Stamp Duty Overrides** | Tenant Workspace| Single Tenant| Builder Accountant | `src/components/InventoryManager.tsx` | `tax_rules` |
| **Lead Funnel (CRM)** | Tenant Workspace| Single Tenant| Sales Agent | `src/components/InventoryManager.tsx` | `customers` |
| **CAD Vectors & Maps** | Tenant Workspace| Single Tenant| Civil Engineer | `src/components/CADImportManager.tsx`| `documents` |
| **Booking Agreements** | Tenant Workspace| Single Tenant| Builder Legal | `src/components/InventoryManager.tsx` | `bookings` |

---

## 2. Absolute Ownership Rules

### Rule A: The Platform Supervision Principle
- The SaaS Control Panel owns and controls **Subscription limits, Feature Gates, and Billing gateways**.
- The SaaS Panel does NOT own and CANNOT declare individual land plot pricing, customer lead records, developer project layouts, or regional stamp duties.
- *Rationale*: A change in a builder's plot price is a micro-business transaction; it must never bubble up or write to the global SaaS platform settings.

### Rule B: The Tenant Autonomy Principle
- The Builder's Workspace owns **Projects, Layouts, Plots, CRM pipelines, and Sales Transactions**.
- The Workspace does NOT configure platform SMTP servers, base subscription values, custom domains, or database backups.
- *Rationale*: No tenant should be able to alter their own subscription invoice values, change global routing keys, or impact another builder's operations.

---

## 3. Prohibited Intersections (Hard Locks)

To prevent security risks and feature bloat, the following designs are permanently forbidden:

1. **NO Cross-Domain State Imports**: React components in `/src/components/saas/` must never import state or data helpers from `/src/components/InventoryManager.tsx` or vice-versa.
2. **NO Shared Database Writes**: Under no circumstances can a client action in the Tenant Workspace execute a raw write statement on the `saas_settings` database, or can a Platform admin modify rows in a tenant's isolated `bookings` table.
3. **NO Tenant-managed Platform Gateways**: Payment settings configured in the SaaS Settings define how BhoomiOne collects subscription money from builders. Settings configured in the Tenant Workspace define how the builder collects booking fees from property buyers. These are separate gateways operating on distinct merchant credentials.
