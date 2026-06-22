# Phase 1EB.5 — SaaS Admin UI Test Matrix

This matrix outlines the manual and automated validation sweeps for verification of the reorganized BhoomiOne SaaS Admin hierarchy.

## 1. Information Architecture and Sidebar Layout

| Test ID | Scenario | Expected Outcome | Status |
| --- | --- | --- | --- |
| TS-01 | left-sidebar load | Left panel expands with brand header ("BhoomiOne SAAS CONTROL PANEL"). Displays 7 items with clean matching Lucide icons. | Passed |
| TS-02 | Responsive layout | Sidebar shifts to top navigation or vertical collapsible menu for smaller display viewports, ensuring content main layout uses flexible fluid margins. | Passed |
| TS-03 | Subdomain breadcrumbs | Breadcrumbs at top of right section update automatically as client switches category selections (e.g. "SaaS Control Panel / Subscription Center"). | Passed |

---

## 2. Subscription Center Inner Sub-tabs

| Test ID | Scenario | Expected Outcome | Status |
| --- | --- | --- | --- |
| TS-04 | sub-tabs routing | Selecting "Subscription Center" defaults view to "Plan Master" sub-tab; client is presented with horizontal pill navigation options to toggle sub-components without page reloads. | Passed |
| TS-05 | Feature Grid lookup | Grid pulls actual access-levels from API, parsing case-insensitive values (e.g. "TRUE", "ENABLED", "ADDON") and displays correct selectors matching database states. | Passed |
| TS-06 | Matrix Cell modification | Altering any plan cell status successfully triggers `onUpdateMatrixCell` and syncs correct option colors safely. | Passed |

---

## 3. Dynamic Tenant Overrides View

| Test ID | Scenario | Expected Outcome | Status |
| --- | --- | --- | --- |
| TS-07 | Selector workspace | Choosing a tenant (e.g. `sobha.bhoomione.in`) synchronized matching subscriptions from DB, populating form states for limits, custom checkboxes and extra add-ons. | Passed |
| TS-08 | Commit settings to backend | clicking "Save Overrides Plan" issues a `POST` query to `/api/v1/admin/tenants/{id}/subscription/overrides` with JSON payload, displaying confirmation toast. | Passed |
| TS-09 | Form inherit values | When no overrides are input, placeholders display baseline package boundaries from the primary plan master configurations. | Passed |

---

## 4. Compilation Integrity

| Test ID | Verification Command | Expected Output | Status |
| --- | --- | --- | --- |
| TS-10 | `tsc --noEmit` and linter | `Linting completed successfully` with clean type-checking and zero syntax problems. | Passed |
| TS-11 | production bundle | `npm run build` succeeds and produces clean assets in the static dist directories. | Passed |
