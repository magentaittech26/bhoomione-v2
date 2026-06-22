# Phase 1E Subscription & Tenant Lifecycle Test Matrix

This matrix outlines all functional, edge-case, and dynamic scaling validation tests for the integrated SaaS Administration Suite.

---

## 1. Dynamic Plan & Feature Matrix Grid Cases

| Scenario ID | Test Scope / Validation | Inputs | Expected Output | Status |
|---|---|---|---|---|
| **TC-MX-001** | Register custom global module | Name: `CAD Viewer Pro`, Code: `CAD_VIEWER`, group: `Integrations`. | Custom module displays instantly across catalogs. | **PASSED** |
| **TC-MX-002**| Prevent duplicate module codes | Code: `SAAS_ADMIN`. | Block entry, trigger form-validation alert. | **PASSED** |
| **TC-MX-003** | Auto-populate Feature Catalog parent select options | Select dropdown on Feature Configuration modal.| Includes all previously registered modular codes. | **PASSED** |
| **TC-MX-004** | Toggle feature permission in Multi-dimensional grid | Modify cell inside `Plan Feature Matrix Grid`. | Adapts dropdown state; persists dynamically on refresh. | **PASSED** |
| **TC-MX-005** | Clone Subscription Package | Target: `Starter Package`, Click "Clone Template Structure". | Creates duplicate template with modified price and code. | **PASSED** |

---

## 2. Dynamic Limits & Capacity Billing Cases

| Scenario ID | Test Scope / Validation | Inputs | Expected Output | Status |
|---|---|---|---|---|
| **TC-LM-001** | Global baseline limits configuration | Adjust "Max physical plots ledger" for `Growth Engine` to `1200`. | All tenants associated with the Growth plan inherit new limits. | **PASSED** |
| **TC-LM-002** | Plot Capacity Slab expansion | Click "Add Slab Template", set bounds `500` to `2000`, Price `$200`. | Dynamic threshold is added to plot-based capacity lists. | **PASSED** |
| **TC-LM-003** | Delete Capacity Slabs | Delete newly created slab `slab_Y`. | Slab range is purged instantly from table records. | **PASSED** |

---

## 3. Tenant Subscription & Lifecycle Core Actions

| Scenario ID | Test Scope / Validation | Inputs | Expected Output | Status |
|---|---|---|---|---|
| **TC-LF-001** | Toggle Micro Add-on Assignment | Click "Custom Sub" -> Add-ons tab -> Click "+ Add" on interactive mapping addon. | Addon assigned successfully. MRR contribution updates live. | **PASSED** |
| **TC-LF-002** | Adjust Tenant Specific Limit slider | Adjust "Assigned storage quota (GB)" for unique tenant to `140GB`. | Slider inherits override state; shows reset triggers. | **PASSED** |
| **TC-LF-003** | Direct Feature Access Override | Set specific feature CAD to "Force Access" under overrides. | Direct override is stored; will override default starter gate. | **PASSED** |
| **TC-LF-004** | Extend Eval/Trial Timeframe | Input `14` days on "Extend Trial Timeframe", click extend. | Appends 14 extra calendar days to Trial Expiry info. | **PASSED** |
| **TC-LF-005** | Suspend Tenancy Connection | Click Suspend active subdomain cluster. | Modal prompt triggers; status updates to suspended of account. | **PASSED** |
| **TC-LF-006** | Reactivate Tenant routes | Click Reactivate for a suspended subdomain. | Restore access tunnels instantly; status shifts to active.| **PASSED** |

---

## 4. Aggregate Revenue Dashboard Projections

| Scenario ID | Test Scope / Validation | Inputs | Expected Output | Status |
|---|---|---|---|---|
| **TC-RV-001** | Dynamic MRR Calculation | Change a tenant plan or assign an extra addon. | Refreshes general platform MRR block mathematically. | **PASSED** |
| **TC-RV-002** | Estimated ARR contribution | Multiplies dynamic MRR by 12.0. | Correctly represents estimated yearly contract yields. | **PASSED** |
| **TC-RV-003** | Cloud storage consumption ratio | Aggregates all global storage limits vs estimated CAD assets size. | Displays beautiful percent meter and progress trends. | **PASSED** |
