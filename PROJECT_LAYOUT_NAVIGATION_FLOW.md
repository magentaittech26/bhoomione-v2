# BhoomiOne V3 - Project and Layout Navigation Flow

This document outlines the visual structure, layout configurations, and user navigation paths for managing Projects and Layouts in the BhoomiOne V3 Tenant Workspace.

---

## 1. High-Level Tenant Workspace Navigation

When a user logs into a Tenant Workspace (e.g., `https://bhoomi-alpha.bhoomione.in`), they are presented with a unified, dual-tab layout governed by `TenantWorkspaceApp.tsx`.

```
                        Tenant Workspace App
                        (TenantWorkspaceApp)
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
   ERP Dashboard                               Settings & Billing
   (activeTab: "dashboard")                    (activeTab: "settings")
         │                                               │
   InventoryManager                                SettingsBilling
         │                                               │
   ┌─────┴────────────────────┐                  ┌───────┴──────┐
   ▼                          ▼                  ▼              ▼
Dashboard Overview      Primary ERP Tabs      General Admin    MDM Panel
(recharts charts)       - Projects            - Profile        - Units Console
                        - Layouts             - Postgres health
                        - Plots               - Billing Plans
                        - CAD/Viewer          - Audit Trails
```

---

## 2. Navigating Project and Layout Lifecycles

### A. The Projects Interface
1. **View/Search**: Under **ERP Dashboard** → **Projects** tab, users view a grid or spreadsheet containing active and archived projects.
2. **Setup**: Click **"New Project"** to open the modal form. Form inputs are dynamically verified (including auto-resolved state/district dropdowns).
3. **Actions Menu**:
   - **Edit**: Opens the setup form pre-filled.
   - **Archive**: Confirms and marks status as `ARCHIVED`.
   - **Restore**: Restores an archived project to its original active status.
   - **Duplicate**: Duplicates the project registry under a custom suffix.
   - **Delete**: Prompts warning and triggers cascading delete.

### B. The Layouts Interface
1. **View/Search**: Under **ERP Dashboard** → **Layouts** tab, users manage layout subdivisions.
2. **Setup**: Click **"New Layout Phase"**. The form requires:
   - **Parent Project**: Selection dropdown.
   - **Measurement Unit**: Clean standard units fetched directly from MDM.
   - **Total Area**: Numeric validator.
   - **Approval Details**: Mandated if status is set to `APPROVED`.
3. **Lifecycle Actions**: Identical to Projects (Edit, Archive, Restore, Duplicate, Delete).

---

## 3. Placement of Reference Masters (MDM)
To prevent operational clutter, the **Measurement Units Master** UI has been relocated:
- **How to access**: Click **Settings & Billing** tab → Click **Master Data Management** tab → Manage units via the consolidated console.
- **Why this design is superior**: Operational forms can use the data layer immediately, while the setup/configuration is segregated to Tenant Administration, matching Enterprise SaaS standards.
