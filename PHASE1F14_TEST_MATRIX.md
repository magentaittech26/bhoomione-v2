# Phase 1F.14: Commercial Engine End-to-End Test Matrix

This test matrix outlines standard testing scenarios, step-by-step inputs, and expected outcomes to verify all parts of the commercial engine.

---

## Test Scenario 1: Consolidated Advanced Plan Editor Editing & Save

### Objectives
Verify that the administrator can edit details, pricing, limits, and feature toggles of a subscription plan from a single modal, and that all fields persist.

### Step-by-Step Inputs & Interactions
1. Navigate to **Subscription Center** -> **Plans**.
2. Click **Edit Full Plan** on any plan card (e.g., *Growth Plan*).
3. Under the **General Tab**, append internal documentation text in the **Internal Notes (Administrative)** field.
4. Switch to the **Pricing Tab**. Change the **Renewal Behaviour** to `SUSPEND` and change the **Overdue Grace Period (Days)** to `10`.
5. Move to the **Limits Tab**. Increase the **Plots Limit** to `5000` and **User Limit** to `25`.
6. Go to the **Features Tab**. Expand the *GIS Engine* module and toggle the *Vector Spatial Layering* switch to **ON**.
7. Click **Save Plan Configuration**.

### Expected Outcomes
- A success toast notification is displayed: `"SaaS subscription plan saved successfully!"`.
- The modal window closes smoothly.
- The corresponding plan card on the dashboard immediately updates to display the modified pricing and limits.
- The plan payload is successfully sent to `/api/v1/admin/plans` and stored in PostgreSQL.

---

## Test Scenario 2: Tenant Licenses Table & Auto-Renew Toggle

### Objectives
Verify that tenant licenses list start dates, expiry dates, renewal schedules, and auto-renew states can be toggled.

### Step-by-Step Inputs & Interactions
1. Navigate to **Subscription Center** -> **Tenant Licenses**.
2. Locate any tenant in the directory (e.g., *Indiana Municipal Infra Corp*).
3. Observe the **Lifespan Dates** column (Start, End, and Next Renewal dates).
4. Identify the **Auto Renew** button badge. Click on the button (e.g., transitioning it from `ON` to `OFF`).
5. Observe the UI and immediate feedback notifications.

### Expected Outcomes
- Clicking the toggle button changes the badge immediately from green `ON` (Available) to gray `OFF` (Disabled).
- A success toast notification is triggered: `"Auto-renewal DISABLED for Indiana Municipal Infra Corp"`.
- The subscription state update is successfully synchronized.

---

## Test Scenario 3: Refined Add-ons Catalog Visualization

### Objectives
Verify that Add-ons are segmented by category and that all custom attributes (price, increments, categories) are displayed.

### Step-by-Step Inputs & Interactions
1. Navigate to **Subscription Center** -> **Add-ons**.
2. Scroll to the **Feature Add-ons** section and verify the `🏷️ Category: Feature Add-on` label.
3. Scroll to the **Capacity Add-ons** section and check that `📈 Limit Boost: +50 projects` is shown.
4. Verify the `⚡ Purchase: Available for checkout` status badge is green for active add-ons.

### Expected Outcomes
- Each add-on is sorted into its correct category block (Feature, Capacity, Service).
- Cards display detailed metadata, and status toggling triggers instant visual feedback.

---

## Test Scenario 4: Presentational Ecosystem Resource Usage

### Objectives
Verify that the Usage tab renders resource utilization percentages, metrics, and consumption counts.

### Step-by-Step Inputs & Interactions
1. Navigate to **Subscription Center** -> **Usage**.
2. Inspect the **Ecosystem Resource Usage Ledger** table.

### Expected Outcomes
- The table displays Name, Code, Metric Type, Monthly consumption, Yearly consumption, Lifetime usage, and percentage utilization bars.
- High-utilization resources (e.g., over 90%) display an accent color (e.g., rose) to warn administrators of impending limit caps.

---

## Test Scenario 5: Audit Logs Filter, Inspect, and Export

### Objectives
Verify that administrators can search, filter, inspect, and export system audit events.

### Step-by-Step Inputs & Interactions
1. Navigate to **Subscription Center** -> **Audit**.
2. Select `Subscription` in the **Category** dropdown filter.
3. Select `CRITICAL` in the **Severity** dropdown filter.
4. Click **Apply Search**.
5. Select a resulting log entry from the table.
6. Click the **Export CSV** button in the header toolbar.

### Expected Outcomes
- The list updates in less than 50ms to display only critical subscription events.
- Clicking an entry displays a sidebar drawer detailing operator, IP address, user agent, and payload changes.
- Clicking **Export CSV** initiates an automated download of a standard `.csv` spreadsheet containing the filtered dataset.
