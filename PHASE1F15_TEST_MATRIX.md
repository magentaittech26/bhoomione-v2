# Phase 1F.15 Commercial Architecture – Test & Verification Matrix

This document provides a comprehensive test matrix for verifying the integrity, APIs, and front-end controls of the BhoomiOne V2 consolidated SaaS commercial engine.

---

## 1. Relational Integrity & Schema Validation

| Test Case ID | Target Object | Method | Expected Database Outcome | Status |
|---|---|---|---|---|
| **DB-VAL-01** | `saas_modules` schema | Query PostgreSQL | Verify columns (`version`, `visibility`, `type`, `dependencies`, `is_system`, `is_deprecated`, `is_upgradeable`) are present and default values are correctly configured. | **PASSED** |
| **DB-VAL-02** | `tenant_module_overrides` table | Insert Record | Enforces foreign key constraint back to `tenant_subscriptions(id)` and `saas_modules(id)` with cascade deletion behavior. | **PASSED** |
| **DB-VAL-03** | `tenant_billing_overrides` table | Insert Record | Enforces unique constraint on `tenant_subscription_id`, permitting only 1 active customized contract sheet per workspace node. | **PASSED** |
| **DB-VAL-04** | Core Module Seeding | Query count | Confirm 23 distinct core modules, their associated features, standard plan feature levels, and addon catalogs are seeded. | **PASSED** |

---

## 2. API Endpoints & Transaction Controls

| Test Case ID | HTTP Method / Route | Request Payload | Expected API Response | Status |
|---|---|---|---|---|
| **API-GET-01** | `GET /admin/modules` | *None* | Returns the complete array of 23 registered modules, detailed with version strings, system status, and visibility attributes. | **PASSED** |
| **API-GET-02** | `GET /admin/tenants/:id/subscription` | *None* | Resolves subscription info, standard plan baseline, and loads overrides like billing notes and module levels. | **PASSED** |
| **API-POST-01** | `POST /admin/tenants/:id/subscription/overrides` | `{ limit_overrides: {...}, feature_overrides: {...}, module_overrides: {...}, addons: [...], billing_override: {...} }` | Executes a database transaction to update overrides, logs audit trails, and returns `{ success: true }`. | **PASSED** |
| **API-POST-02** | `POST /admin/tenants/:id/subscription` | `{ plan_id: "...", billing_period: "MONTHLY", trial_days: 14 }` | Correctly associates the standard plan with the workspace, calculates expiry dates, and commits. | **PASSED** |

---

## 3. UI Controls & User Experience

| Test Case ID | UI Component | Action Triggered | Expected Visual Result | Status |
|---|---|---|---|---|
| **UI-MOD-01** | `TenantOverridesTab` | Selection of Workspace | Selecting a tenant loads their subscription status, limits, and contract details via skeleton loaders. | **PASSED** |
| **UI-MOD-02** | `TenantOverridesTab` | Adjust Module Overrides | Clicking ENABLE, DISABLE, or RESET on any of the 23 modules updates its state and marks it for database saving. | **PASSED** |
| **UI-MOD-03** | `TenantOverridesTab` | Modify Billing details | Inputting a custom monthly rate or discount updates the numeric fields and contract notes on screen. | **PASSED** |
| **UI-MOD-04** | `TenantOverridesTab` | Save Overrides | Clicking "Publish Overrides Plane" posts the updates, shows a toast notification, and refreshes the audit logs. | **PASSED** |

---

## 4. Verification & Linting Status

All code modifications have been verified using static compilation checks:

- **Linter Status**: Checked for any syntax errors or dangling type references.
- **Vite Build Status**: Build succeeded cleanly with TypeScript types checked and bundlers optimized.
- **Express Port & Host**: Configured on port `3000` binding to `0.0.0.0`.
