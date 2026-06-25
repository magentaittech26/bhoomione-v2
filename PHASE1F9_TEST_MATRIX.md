# PHASE 1F.9 – BHOOMIONE COMMERCIAL RUNTIME ENFORCEMENT TEST MATRIX

| Test ID | Module / Component | Scenario Description | Inputs / Actions | Expected Result | Verification Mechanism |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-001** | `SubscriptionEnforcementEngine` | Feature Resolution Priority Verification | Resolve features for custom-overridden tenant. | Returns custom overrides over baseline features. | `getEffectiveFeatures` returns correct feature list |
| **TC-002** | `SubscriptionEnforcementEngine` | Limit Resolution Priority Verification | Resolve limits for capacity-add-on tenant. | Limits equal plan limit + active capacity increment. | `getEffectiveLimits` returns elevated threshold values |
| **TC-003** | `SubscriptionFeatureGate` | API Gating / Unauthorized Feature Check | Trigger un-entitled feature API route. | Returns `403 FEATURE_NOT_AVAILABLE` with detail string. | HTTP response code `403` with feature code payload |
| **TC-004** | `ProjectController` | Project Capacity Limit Enforcement | Attempt creating project exceeding plan limit. | Blocks request, throws `LIMIT_EXCEEDED`, returns limits. | Returns HTTP 403 with `limit` and `current_usage` keys |
| **TC-005** | `LayoutController` | Layout Capacity Limit Enforcement | Attempt creating layout exceeding plan limit. | Blocks request, throws `LIMIT_EXCEEDED`, returns limits. | Returns HTTP 403 with `limit` and `current_usage` keys |
| **TC-006** | `PlotController` | Plot Density Limit Enforcement | Attempt creating plot exceeding plan limit. | Blocks request, throws `LIMIT_EXCEEDED`, returns limits. | Returns HTTP 403 with `limit` and `current_usage` keys |
| **TC-007** | `DxfController` | CAD File Size Storage Limit Enforcement | Upload DXF file breaching available workspace disk limit. | Blocks file upload, returns `LIMIT_EXCEEDED` with sizes. | Returns HTTP 403 with `limit` and `current_usage` keys |
| **TC-008** | `AuditLogService` | Security Violation / Threshold Breaches Logs | Trigger a `LIMIT_EXCEEDED` or denied access state. | Correctly creates standard log entries in PostgreSQL. | Row created in `audit_logs` table with action payload |
| **TC-009** | `InventoryManager` | Interactive Map Gating | View tabs for tenant lacking `gis_maps`. | "Interactive Map" tab hidden from navigation header. | Dynamic DOM element check for `tab-viewer` |
| **TC-010** | `InventoryManager` | CAD Imports Gating | View tabs for tenant lacking `dxf_import`. | "CAD Imports" tab hidden from navigation header. | Dynamic DOM element check for `tab-cad` |
| **TC-011** | `InventoryManager` | Plots Gating | View tabs for tenant lacking `plot_grid_view`. | "Plots" tab disabled and displays a padlock (`🔒`). | Tab button receives `disabled` and displays `🔒` |
| **TC-012** | `Dashboard` | Real-time Bento Metrics Widgets | Mount workspace and load Dashboard tab. | Bento widgets display correct active plans, limits. | Renders correct active widgets under hero header |
| **TC-013** | `TenantSubscriptionStore` | Instant UI Synchronization | Upgrade baseline plan or purchase capacity add-on. | Recalculates limits, syncs progress bars instantly. | Dynamic state updates and trigger `onRefreshTriggered` |
