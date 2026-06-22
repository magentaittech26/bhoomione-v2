# Phase 1E Frontend Visibility Test Matrix

This matrix describes the structured verification steps to prove the seamless navigation, layout fidelity, and interactivity of the 11 unified SaaS Admin dashboards.

---

| Tab ID | Tab Name / Label | Target Rendering Component | Primary Verified Controls | Status |
|---|---|---|---|---|
| `tenant-registry` | **Tenant Registry** | Integrated raw interactive table | Real stats row synced with persistent data calculations, sub-domain routes map | **VERIFIED** |
| `module-registry` | **Module Registry** | `ModuleRegistryTab` (`defaultTab="modules"`) | Module registry list drawer, register new plugin components forms | **VERIFIED** |
| `feature-catalog` | **Feature Catalog** | `ModuleRegistryTab` (`defaultTab="features"`) | Add capabilities trigger list, billing-category flags triggers | **VERIFIED** |
| `plan-master` | **Plan Master** | `PlanFeatureMatrixTab` (`defaultTab="tiers"`) | Subscription packages cards, Starter / Growth / Professional / Enterprise plan editor | **VERIFIED** |
| `plan-feature-matrix` | **Plan Feature Matrix** | `PlanFeatureMatrixTab` (`defaultTab="matrix"`) | Visual checkbox grids linking features to active plan codes toggler | **VERIFIED** |
| `usage-limits` | **Usage Limits** | `PlanFeatureMatrixTab` (`defaultTab="limits"`) | Numeric input fields configuring maximum plot capacity thresholds | **VERIFIED** |
| `plot-billing` | **Plot Billing**| `AddonsBillingTab` (`defaultTab="slabs"`) | Cumulative slabs rate editor, add/edit/delete billing thresholds | **VERIFIED** |
| `addons` | **Add-ons** | `AddonsBillingTab` (`defaultTab="addons"`) | Micro-service capability list, base addon price and flat multiplier parameters | **VERIFIED** |
| `mrr-dashboard` | **MRR Dashboard** | `MrrDashboardTab` | Real-time aggregated active subscribers MRR metrics, workspace counters | **VERIFIED** |
| `audit-logs` | **Audit Logs** | Embedded console log trail | Telemetry Audit Log stream browser, real-time live refresh logging button | **VERIFIED** |
| `global-parameters` | **Global Parameters** | Gateway network configuration nodes card | Workspace DNS routing protocols card, single-source proxy proxy indicator | **VERIFIED** |

---

## Interactive Validation Procedures

### 1. Unified Tab Transition Test
- **Action:** Click through tabs alphabetically.
- **Expected Outcome:** The focus state shifts immediately to the selected item; active views slide in with a subtle fade-in transition (`animate-fadeIn`), keeping other views isolated.

### 2. Prop-Injection Coherence Check
- **Action:** Click "Feature Catalog" and verify that the screen reflects the Dynamic Feature Catalog panel. Then, click "Module Registry" and verify it changes back immediately.
- **Expected Outcome:** State transitions down correctly with absolute precision, matching the intended default tab view state.

### 3. Cumulative Slabs CRUD Verification
- **Action:** Select "Plot Billing", write custom parameters, click submit, then edit.
- **Expected Outcome:** Database changes synchronize correctly with local state models securely.
