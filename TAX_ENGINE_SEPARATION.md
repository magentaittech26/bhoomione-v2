# BhoomiOne V3 - Tax Engine Separation Architecture

This document details the architectural boundaries established to separate the corporate taxation concerns of the BhoomiOne SaaS Operator (Platform Administration) from the commercial business operations of individual developers and builders (Tenants).

---

## 1. Architectural Mandate & Core Isolation

To preserve compliance, compliance tracking, and clean data segregation, BhoomiOne permanently decouples:
- **Platform SaaS Taxation**: The taxes BhoomiOne levies on builders for subscription licensing, add-on activations, and marketplace listings.
- **Tenant Business Taxation**: The taxes builders levy on customers buying real estate plots, booking amenities, or paying development surcharges.

```
                      +-----------------------------+
                      |    BhoomiOne Core System    |
                      +--------------+--------------+
                                     |
             +-----------------------+-----------------------+
             |                                               |
             v                                               v
+---------------------------+                 +-----------------------------+
|  Platform Tax & Invoice   |                 |  Tenant Business Tax Engine |
+---------------------------+                 +-----------------------------+
| - Admin-only control      |                 | - Tenant Workspace scope    |
| - SaaS licensing taxes    |                 | - Plot sales tax rules      |
| - SAC: 997331 (SaaS/IT)   |                 | - TDS, GST, stamp duties    |
| - Corporate invoice rules |                 | - Builder/Project level     |
| - Database: saas_settings |                 | - DB: tenant isolation      |
+---------------------------+                 +-----------------------------+
```

---

## 2. Key Differences at a Glance

| Architectural Dimension | Platform Tax & Invoice Configuration | Tenant Business Tax Engine |
| :--- | :--- | :--- |
| **User Role** | BhoomiOne System Super-Administrators | Builder Accounting Team / Workspace Owner |
| **Location in UI** | SaaS Settings $\rightarrow$ Platform Tax & Invoice Configuration | Workspace Dashboard $\rightarrow$ Commercial $\rightarrow$ Tax & Charges |
| **Underlying Storage** | Global `saas_settings` key-value repository | Multi-tenant isolated `tax_rules` & `tax_transactions` |
| **Applicable Codes** | SAC 997331 (Software / IT licensing) | Various construction HSN/SAC codes (e.g., land, construction) |
| **Isolation Unit** | Single global registry applied platform-wide | Strict `tenant_id` database partitioning |

---

## 3. UI Realignment

1. **Platform Configuration**:
   - Replaced the high-complexity transactional console in SaaS Admin Settings with a tailored, streamlined **Platform Tax & Invoice Configuration** screen.
   - Restructured to govern company details (CIN, PAN, GSTIN), invoice prefixes, billing tax enforcements (SaaS subscriptions, add-ons), and a real-time preview of simulated platform invoices.
2. **Tenant Operations**:
   - Integrated the high-power transaction-ledger console into the Tenant Workspace under the **Commercial** dashboard tab.
   - Enabled accounting personnel to declare local state-by-state tax policies, handle overrides, calculate ledger balances, and export commercial tax logs safely.

---

## 4. Verification & Safe Boundaries

- **State Independence**: Changing a parameter on the platform settings has zero side-effects on tenant-declared tax slabs.
- **Robust Failure Protection**: Wrapped the platform control panels with dedicated local React Error Boundaries to prevent runtime crashes from bubbling up to render blank screen settings.
