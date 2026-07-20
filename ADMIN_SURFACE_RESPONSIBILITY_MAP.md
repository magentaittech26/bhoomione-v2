# BhoomiOne V3 - Administration Surface Responsibility Map

This document establishes the precise boundary lines, route/hostname configurations, parent navigation components, and authorized user types for all administration and operational panels within the BhoomiOne V3 ecosystem.

---

## 1. Surface Responsibility Directory

| Administration Surface | Primary Navigation Entry point | Routing Strategy | Target User Personas | Core Administrative Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **SaaS Control Panel** | `SaaSAdminApp.tsx` | Hostname: `admin.bhoomione.in` | Platform Owner, SaaS Billing Admin | Global tenant registration, plan definitions, billing lifecycle control, license status tracking. |
| **Platform Administration** | `CoreMastersConsole.tsx` | Sub-panel inside `SaaSAdminApp.tsx` | Platform Super Admin, System Engineer | Seed global masters (countries, states, currencies, base types), manage system-level registries. |
| **Tenant Administration** | `SettingsBilling.tsx` | Tab: `settings` inside `TenantWorkspaceApp.tsx` | Tenant Owner, Tenant Admin | Workspace configuration, subscription/add-on store, local security audit trails, tenant-level Master Data Management. |
| **Tenant Operational Workspace** | `InventoryManager.tsx` | Tab: `dashboard` inside `TenantWorkspaceApp.tsx` | Real Estate Developer, Project Mgr, Sales Executive | Land project setup, layout Phase configurations, plot inventory logs, CAD blueprint viewer, customer registry. |

---

## 2. Structural & Architectural Isolation Policies

### A. SaaS Control Panel Isolation
- **Component Entry**: `SaaSAdminApp.tsx`
- **Isolation Level**: Multi-tenant database schema bypass. Connects directly to global administrative state. No tenant-level user may traverse this panel.
- **Access Rule**: Restricts views dynamically to roles matching `SYSTEM_ADMIN` or `PLATFORM_OWNER`.

### B. Platform Administration (Masters Governance)
- **Component Entry**: `CoreMastersConsole.tsx` (nested under SaaSAdminApp)
- **Isolation Level**: Seed master database layers. Data here flows down as read-only reference rows to all tenant namespaces.
- **Access Rule**: Requires explicit `masters.global.manage` authority.

### C. Tenant Administration
- **Component Entry**: `SettingsBilling.tsx` (within `TenantWorkspaceApp.tsx`)
- **Isolation Level**: Restricted to rows belonging to the active tenant schema. No cross-tenant metadata exposure.
- **Access Rule**: Restricted to `TENANT_OWNER` or `TENANT_ADMIN` roles. Handles subscription tier checks and local audit trail emission.

### D. Tenant Operational Workspace
- **Component Entry**: `InventoryManager.tsx` (within `TenantWorkspaceApp.tsx`)
- **Isolation Level**: Encapsulated within the selected tenant schema scope. Completely segregated from other tenant workspaces.
- **Access Rule**: Operates using tenant roles (`DEVELOPER_OWNER`, `DEVELOPER_ADMIN`, `SALES_EXECUTIVE`). Handles transactional processes like layout designs and plot inventories.
