# BhoomiOne V3 - Unified Navigation & Workspace Menu Standards

This document establishes the official user interface layout, sidebar menus, and navigation rules for BhoomiOne V3.

---

## 1. Universal Layout Foundations

To ensure visual consistency across the entire BhoomiOne ecosystem, all main layout windows MUST adhere to the following template rules:

- **Desktop Layout**: Fixed-width vertical sidebar (width: `64rem` / `w-64`) pinned to the left edge of the viewport. The rest of the screen is occupied by a flexible vertical content container with a sticky header and scrollable body.
- **Mobile Layout**: Collapsible vertical sidebar drawer. On mobile screens, the navigation collapses into an action menu triggered by a global menu button.
- **Typography Pairing**: Inter (sans-serif) for general system interfaces, paired with Space Grotesk/Outfit for Display Headings, and JetBrains Mono for alphanumeric indicators (e.g., tax IDs, invoice codes, numeric amounts).

---

## 2. Navigation Hierarchy Spec

### Domain 1: SaaS Platform Administration Menu
*Audience: Platform Super-Administrators*

| Menu Tab | Selected Sub-views | Icon Association | Functional Focus |
| :--- | :--- | :--- | :--- |
| **Dashboard** | Revenue Analytics, Active Nodes, MRR Graphs | `LayoutDashboard` | Platform-wide operational indicators |
| **Workspace Tenants**| Active Tenant List, Database Cluster Status | `Users` | Tenant database provisioning & lifecycle |
| **Subscription Center**| Plan Master, Add-on Slabs, Licenses, Invoices| `CreditCard` | SaaS licensing and packages billing |
| **Module Registry** | Modules Directory, Feature Gate Catalog | `Box` | Platform feature controls |
| **Tenant Overrides** | Individual pricing slabs, bespoke quotas | `Sliders` | Enterprise contracts and custom billing |
| **Audit Logs** | Telemetry logs, Administrative audit trail | `Terminal` | Core platform activity monitoring |
| **Settings** | Configuration subtabs (Company, SMTP, DNS, etc)| `Settings` | Platform core parameters & properties |

### Domain 2: Tenant Workspace Menu
*Audience: Builder / Developer Teams*

The Tenant Sidebar consists of unified functional segments to structure accounting, CRM, and land inventory operations clearly:

| Module Group | Sidebar Tabs | Icon Association | Functional Focus |
| :--- | :--- | :--- | :--- |
| **CORE OUTCOMES** | • Dashboard | `LayoutDashboard` | Visualized sales stats, ledger totals |
| **SALES & WORKFORCE**| • CRM (Leads, Customers, Agents) | `Users` | Contacts tracker & booking funnels |
| **LAND & PROPERTY** | • Projects<br>• Layouts<br>• Plots | `Building2`<br>• `Layers`<br>• `Compass` | Engineering inventories, maps, coordinates |
| **TRANSACTIONS** | • Bookings<br>• Collections<br>• Payments | `ShoppingBag`<br>• `Banknote`<br>• `CreditCard` | Buyer agreements, receipts, bank feeds |
| **ACCOUNTS & TAX** | • Commercial (Tax Rules, Invoices)<br>• Accounting (Expenses, Ledgers) | `Percent`<br>• `BookOpen` | Regional builder taxes, project finance logs |
| **ENGINEERING** | • CAD Imports<br>• Interactive Maps | `FileCode2`<br>• `Eye` | Vector floorplan parsing, layout GIS viewer |
| **ADMIN & SETUPS** | • HR & Payroll<br>• Support Tickets<br>• Settings | `Briefcase`<br>• `HelpCircle`<br>• `Settings` | Workspace roster, local office configuration |

---

## 3. Transition & State Animations

All layout panel switches and view transitions MUST utilize smooth, modern micro-animations to improve usability:

- **Fade-In Entry**: Apply a subtle, purposeful horizontal slide and fade-in to tab switches.
- **Interactive State**: Active menu buttons are highlighted with a distinct background (e.g., `bg-indigo-600` on the Platform, `bg-white shadow-xs text-indigo-700` on the Tenant tab list). Hover states must incorporate smooth background color transitions (`transition-all duration-200 hover:bg-slate-800/50`).
- **Access Restrictions**: Disabled, locked, or unlicensed feature tabs must render with an `opacity-40` overlay and a lock icon (`Lock`), with pointer interactions disabled.
- **Micro-interactions**: Action buttons like "Refresh" or "Save" must display loading indicators (e.g., `animate-spin` on the `RefreshCw` icon) when active.
