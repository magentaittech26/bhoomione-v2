# Phase 1EB.7 — Subscription Center Test Matrix

This document provides structured test scenarios to verify layout consistency, navigation flow, and database updates following the Subscription Center cleanup.

---

## 1. Single-Layer Navigation Verifications

### Test Scenario 1.1: Single-Layer Tab Transition
*   **Target Objective:** Confirm that only one navigation tab bar is visible, with no duplicate nested tabs or overlapping headers.
*   **Action Steps:**
    1.  Log in as Administrator and navigate to the **Subscription Center** sidebar.
    2.  Click on the **Plans** tab.
    3.  Click sequentially on **Feature Matrix**, **Usage Limits**, **Plot Billing**, and **Add-ons**.
*   **Expected UI State:**
    - Only a single top navigation layer is visible.
    - No sub-navigation bars exist within any underlying panels.
    - Each content container loads instantly without jumping or horizontal layout issues.

---

## 2. Plans & Features Grid Verifications

### Test Scenario 2.1: Plan Tier Updates
*   **Target Objective:** Verify editing, deactivating, and cloning plan packages using the new clean tab layout.
*   **Action Steps:**
    1.  Select the **Plans** tab.
    2.  Locate the "Starter Package" card. Edit its Monthly Price to `$119` and Yearly Price to `$1190`.
    3.  Select the **Clone** action.
*   **Expected UI State:**
    - Updated price inputs reflect new values accurately.
    - The cloned plan is created correctly as a template and shown automatically without page-level resets.

### Test Scenario 2.2: Matrix Settings Interception
*   **Target Objective:** Verify toggling permissions in the coordinate grid.
*   **Action Steps:**
    1.  Select the **Feature Matrix** tab.
    2.  Select a specific feature's cell (e.g. DXF CAD Drawing Upload under the Starter column) and toggle its state (Enabled, Disabled, Add-on Only).
*   **Expected UI State:**
    - Status modifications are processed cleanly.
    - Changes update the React state and are sent to the backend without breaking cell parameters or triggering row shift regressions.

---

## 3. Dynamic Thresholds & Billing Slabs Verifications

### Test Scenario 3.1: Usage Limits In-place Edits
*   **Target Objective:** Check that per-plan usage limits (Projects, Layouts, etc.) can be modified.
*   **Action Steps:**
    1.  Select the **Usage Limits** tab.
    2.  Locate the Growth Engine plan column. Change "Seat Users" value from `15` to `20`.
    3.  Observe response logs and state indicators.
*   **Expected UI State:**
    - Inline numeric updates are saved instantly.
    - The dynamic limits state is synchronized correctly.

### Test Scenario 3.2: Plot Billing Slabs Management
*   **Target Objective:** Verify adding, updating, and deactivating capacity billing slabs.
*   **Action Steps:**
    1.  Select the **Plot Billing** tab.
    2.  Validate the configured ranges (`1-50`, `51-100`, `101-250`, etc.).
    3.  Click "Add Slab Template", configure min/max margins, and click save.
*   **Expected UI State:**
    - The new slot appears immediately in the table.
    - Dynamic calculations update accurately with zero horizontal panel displacement.

---

## 4. Add-on Catalog Verifications

### Test Scenario 4.1: Add-ons Update Flow
*   **Target Objective:** Verify that custom components in the Add-ons catalog can be edited or deactivated.
*   **Action Steps:**
    1.  Select the **Add-ons** tab.
    2.  Select "WhatsApp checkout triggers" add-on. Adjust the Monthly premium to `$25` and click update.
*   **Expected UI State:**
    - Updated prices display correctly.
    - The structural layout remains aligned with absolute layout containment.
