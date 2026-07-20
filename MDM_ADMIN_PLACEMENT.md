# BhoomiOne V3 - Master Data Management (MDM) Administration Placement

This document details the architectural positioning, navigation flows, and security boundary protections established for the **Measurement Units Master Module** as the reference implementation of BhoomiOne's Master Data Management (MDM) platform.

---

## 1. Relocation Summary

The `MeasurementUnitsConsole` has been relocated from its original, inappropriate position as a primary operational tab of the **Tenant Workspace** to its correct location within the **Tenant Administration** panel under **Master Data Management**.

- **Source Location**: `TenantWorkspaceApp.tsx` → `tab-measurement-units` (Operational Tab)
- **Destination Location**: `TenantWorkspaceApp.tsx` → `Settings & Billing` (`SettingsBilling.tsx`) → `Master Data Management` Tab → `Measurement Units` Sub-panel
- **Impact on Operational Modules**: Zero. The underlying `MeasurementUnitService` and the `useMeasurementUnits()` React hook remain completely available to operational components (`LayoutWorkspace`, `InteractiveLayoutViewer`, and plot forms) regardless of whether the administration screen is mounted.

---

## 2. Navigational Pathway

```
Tenant Workspace (TenantWorkspaceApp.tsx)
 └── Settings & Billing (SettingsBilling.tsx)  <-- Tenant Administration Screen
      ├── General Administration & Billing     <-- Profile, Health, Subscription Store, Audit
      └── Master Data Management (MDM)         <-- Unified MDM Tab
           ├── Measurement Units (Active)      <-- Mounts MeasurementUnitsConsole
           ├── Countries (Planned/Disabled)
           └── States & Provinces (Planned/Disabled)
```

---

## 3. Administrative Surface Protection Guidelines

To protect the SaaS Control Panel, Tenant Administration, and SaaS pricing architectures from corruption during MDM integration, the following strict architectural rules have been enforced:

1. **No Operational Tab Bloat**: Master registries must not occupy real estate on the primary workspace dashboard. The workspace tab list is reserved strictly for operational and transactional flows (Dashboard, Layouts, Plots, CAD).
2. **Dynamic Decoupling**: Disabling the visual `MeasurementUnitsConsole` UI must not break or disable reference access to measurement units data. Standard reference data must remain fully accessible as background read-only lookup records.
3. **RBAC Isolation**:
   - Platform admins manage system-level masters at `admin.bhoomione.in`.
   - Tenants can query master units and perform local overrides if authorized by roles containing `masters.measurement_units.*` privileges (e.g., `TENANT_OWNER`, `TENANT_ADMIN`, `DEVELOPER_OWNER`, `DEVELOPER_ADMIN`).
   - Guest roles and standard operational roles (`SALES_EXECUTIVE`) are restricted to read-only access within operational forms.
4. **Data Isolation (Multi-Tenancy)**: No tenant may access, view, or modify measurement unit overrides belonging to another tenant schema partition.
