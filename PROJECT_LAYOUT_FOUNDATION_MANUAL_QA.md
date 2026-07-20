# BhoomiOne V3 - Project and Layout Foundation Manual QA Playbook

This document provides step-by-step instructions for performing manual quality assurance testing on the stabilized Projects and Layouts lifecycle foundation.

---

## Test Scenario 1: Creating a Project with Dynamic Geographic Lookups

### Prerequisites
- Logged into any tenant workspace (e.g., `bhoomi-alpha`) with a role of `DEVELOPER_OWNER` or `DEVELOPER_ADMIN`.

### Steps
1. Navigate to the **ERP Dashboard** tab.
2. Select the **Projects** tab.
3. Click the **"New Project"** button to trigger the creation modal.
4. Fill in the required general fields:
   - **Project Name**: `Bhoomi Heritage`
   - **Project Code**: `BHM-HRTG`
   - **Developer Name**: `Bhoomi Realty Developers`
5. Locate the Geographic Setup section:
   - Select a **State** from the dropdown (e.g., *Karnataka*). Observe that the **District** dropdown becomes populated with districts.
   - Select a **District** (e.g., *Bengaluru*). Observe that **Taluks** become populated.
   - Select a **Taluk** and a **Village**.
6. Select **Status**: `PLANNING`.
7. Click **"Save Project"**.

### Expected Result
- Modal closes.
- Success toast notification is displayed: `New Project [BHM-HRTG] created successfully!`.
- The new project appears in the Projects list grid.

---

## Test Scenario 2: Layout Area and Name Validation

### Steps
1. Navigate to the **Layouts** tab on the ERP Dashboard.
2. Click **"New Layout Phase"**.
3. Attempt to submit the form without selecting a parent project.
   - *Expected Result*: Error message banner is displayed: `Validation Error: Parent Project Context is required...`.
4. Select the parent project `Bhoomi Heritage`.
5. Enter a Layout name: `Phase 1`.
6. Set **Total Area Value** to `-100` or `abc`.
   - *Expected Result*: Error message banner is displayed: `Validation Error: Invalid Area... value must be a positive numeric value higher than 0.`.
7. Set **Total Area Value** to `250000`, and select **Measurement Unit**: `Square Feet (SQFT)`.
8. Click **"Save Layout"**.
   - *Expected Result*: Layout is saved successfully.
9. Click **"New Layout Phase"** again. Select parent project `Bhoomi Heritage` and enter Layout name `Phase 1`. Attempt to save.
   - *Expected Result*: Validation error banner is displayed: `Validation Error: A layout phase named 'Phase 1' already exists within the selected parent project context...`.

---

## Test Scenario 3: Archiving and Restoring Lifecycles

### Steps
1. In the **Projects** list, locate project `BHM-HRTG`.
2. Click the **"Archive"** button (or icon). Confirm the warning dialog.
   - *Expected Result*: Status changes to `ARCHIVED`. Success notification appears.
3. Observe that archived projects have their action options updated to include a **"Restore"** button (curved back arrow).
4. Click the **"Restore"** button.
   - *Expected Result*: The project is successfully restored to its original status (e.g., `PLANNING`).
5. Repeat the exact flow for a **Layout** phase on the Layouts screen to verify layout-level archiving and restoration.

---

## Test Scenario 4: Cascading Deletion Verification

### Steps
1. Navigate to the **Projects** tab.
2. Locate the project you created and click the **Delete** icon.
3. Confirm the browser warning dialog.
   - *Expected Result*: The project is removed from the grid.
4. Navigate to the **Layouts** tab.
5. Search for any layout associated with that project (e.g., `Phase 1` under `BHM-HRTG`).
   - *Expected Result*: All layout phases previously linked to the deleted project have been recursively and automatically cascade-purged.
