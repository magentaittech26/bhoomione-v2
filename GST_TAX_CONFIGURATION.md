# BhoomiOne V3 – GST & Tax Configuration System

The **BhoomiOne V3 GST & Tax Configuration Module** provides an enterprise-grade, highly customizable tax calculation and compliance ledger system designed specifically for Indian Real Estate Developer SaaS. 

It handles complex statutory structures including GST (CGST, SGST, IGST), TDS (under Section 194IA of the Income Tax Act 1961), Stamp Duty, Registration Charges, and other custom configurable builder-level or state-level surcharges.

---

## 1. Core Architectural Overview

Tax calculations in BhoomiOne are entirely database-driven. There are **zero hardcoded tax rates or static rules in the codebase**. 

```
               [ React Frontend - Enterprise Tax Console ]
                                   │
                                   ▼
                       [ Laravel REST API Gateway ]
                                   │
                ┌──────────────────┴──────────────────┐
                ▼                                     ▼
        [ RBAC & Tenant Isolation ]            [ Tax Rules Engine ]
        (TaxRulePolicy / Tenant Resolver)       (Intra vs. Inter State)
                │                                     │
                ▼                                     ▼
     [ PostgreSQL Database ] <────────────────────────┘
     - tax_rules (SoftDeletes)
     - tax_transactions (Ledger)
```

### Key Principles:
* **Strict Tenant Isolation**: All rules and transactions are strictly scoped via `tenant_id` to prevent cross-tenant leakage.
* **No Hardcoding**: Standard rates (e.g., 1% GST for affordable housing, 5% for non-affordable, 1% TDS on values > ₹50 Lakhs) are stored as dynamic rows matching states and date ranges.
* **Intra-State vs. Inter-State Logic**: Automating the resolution of CGST + SGST vs. IGST based on the builder's state and customer's state region.
* **Builder-Level Scope Overrides**: Allows applying customized concession rates or specific builder policies while falling back safely to platform default rules.

---

## 2. Tax Rule Hierarchy & Evaluation Order

When calculating the final transaction cost for a property, the tax engine resolves applicable rules in a cascading hierarchy based on specificity:

1. **Active Rule Filter**: The engine only considers rules where `is_active = true` and the transaction date falls within `[effective_from, effective_to]` (if specified).
2. **State Match**: Specific state rules (e.g., `state_code = 'KA'`) take precedence over global rules (`state_code = 'ALL'`).
3. **Builder Override**: Rules with `tenant_id` matching the builder's tenant identifier are evaluated first. If no tenant-specific match is found, it falls back to global default rules (`tenant_id IS NULL`).
4. **Builder Name Matching**: Within global or tenant levels, the engine prioritizes rules matching a specific `builder_name` (if configured) to support micro-level overrides.

### Overlap Prevention Guarantee
To maintain strict mathematical correctness and audit compliance, the API blocks the registration of overlapping active rules for the same:
* `state_code`
* `tax_type`
* `tenant_id`
* `builder_name`
* `effective_from` / `effective_to` date boundaries.

---

## 3. Supported Tax Categories & Standard Presets

The system manages several pre-configured statutory categories:

| Tax Category | Default Rate | Applicability / Business Rule |
| :--- | :--- | :--- |
| **CGST** | 0.5% - 9.0% | Central Goods & Services Tax (applied with SGST for Intra-State deals). |
| **SGST** | 0.5% - 9.0% | State Goods & Services Tax (applied with CGST for Intra-State deals). |
| **IGST** | 1.0% - 18.0% | Integrated Goods & Services Tax (applied for Inter-State deals). |
| **TDS** | 1.00% | Section 194IA applied on transaction values exceeding ₹50,00,000. |
| **STAMP_DUTY** | 5.0% - 8.0% | State-level levy calculated on the total property guidance value. |
| **REGISTRATION** | 1.0% | Custom registration surcharges charged dynamically based on state regulations. |
| **OTHER** | Configurable | Fixed or percentage-based local municipality or amenities levies. |

---

## 4. Administrative Console Guide

Authorized personnel (Super-Admins and Tenant-Admins) manage configuration live through the **Enterprise Tax Console**:

### Adding a New Tax Rule
1. Navigate to the **Compliance Rules Console**.
2. Click **New Tax Rule**.
3. Choose the **Tax bands category** and **Zoning state region**.
4. Set the **Calculation Type** (`Percentage-based` or `Fixed Levy Amount`).
5. Enter the **Rate percentage (%)** or **Fixed Amount (₹)**.
6. Specify the **Effective start date** and optional **expiry date**.
7. (Optional) Provide a **Builder Name** or associate with a specific **Tenant ID** to establish an override.
8. Toggle **Enable and enforce this tax rate immediately** and click **Save Config**.

### Soft Deleting Rules
Rules are never hard-deleted from the database to preserve historical ledger integrity. Deleting a rule through the UI marks it as archived using `deleted_at`, ensuring all past calculated invoices remain intact and auditable.
