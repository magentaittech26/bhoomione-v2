# BhoomiOne V3 - Administrative Surface Regression QA Playbook

This document details step-by-step manual test scripts to verify the correctness, placement, and security partition boundaries of the relocated Master Data Management (MDM) console.

---

## Regression Test Scenario 1: Verification of MDM Relocation

### Steps
1. Log into a tenant workspace (e.g., `bhoomi-alpha`).
2. Observe the top-level horizontal navigation tab bar.
   - *Expected Result*: The tab "Measurement Units Master" must NOT be visible. Only **"ERP Dashboard"** and **"Settings & Billing"** are visible.
3. Click the **"Settings & Billing"** tab.
4. Observe the sub-navigation tabs within the Settings workspace:
   - **"General Administration & Billing"** (Active by default)
   - **"Master Data Management"**
5. Click **"Master Data Management"**.
6. Observe the layout:
   - A left sidebar displays available Master Datasets: **"Measurement Units"** (Selected), **"Countries"** (Disabled/Soon), and **"States & Provinces"** (Disabled/Soon).
   - The right workspace pane displays the **Measurement Units Master** panel containing the complete `MeasurementUnitsConsole` layout.

---

## Regression Test Scenario 2: Administrative RBAC Boundary Testing

### Steps
1. Log out of the current active session.
2. Log back in using a user credential with **GUEST** or **SALES_EXECUTIVE** permissions.
3. Navigate to **Settings & Billing** → **Master Data Management**.
4. Observe the Measurement Units list:
   - You can search, filter, and view the units of measure.
   - The **"New Unit"** button must NOT be visible.
   - Edit, delete, and toggle controls must NOT be rendered.
5. Log out and log back in as a **TENANT_OWNER** or **DEVELOPER_OWNER**.
6. Navigate back to **Settings & Billing** → **Master Data Management**.
   - *Expected Result*: The **"New Unit"** button is fully visible. Edit and delete icons are rendered next to unit entries. Overrides and state modifications can be submitted and saved.

---

## Regression Test Scenario 3: Decoupling Verification

### Steps
1. Navigate to **Settings & Billing** → **Master Data Management**.
2. Create or verify a specific active measurement unit (e.g., `unit-acres` - Acres).
3. Navigate back to the **ERP Dashboard** → **Layouts** tab.
4. Click **"New Layout Phase"**.
5. Click the **"Measurement Unit"** selection dropdown.
   - *Expected Result*: The dropdown is fully populated and displays `Acres (ACRE)` or other seeded units.
   - *Verification Principle*: Standard operational forms consume unit registries smoothly from background hooks/services without requiring the Administration console to be currently mounted or active.
