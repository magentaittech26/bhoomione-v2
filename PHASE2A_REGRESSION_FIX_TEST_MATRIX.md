# Phase 2A Frontend Regression Fix Test Matrix

This matrix details the QA testing procedures to validate that the frontend regressions identified in `PHASE2A_REGRESSION_AUDIT.md` have been fully corrected and verified as stable.

---

## 1. Automated Tenant Context Header Handshakes
* **Test Case ID**: `TC-ATH-01`
* **Objective**: Verify that standard API requests automatically append the `X-Tenant-ID` header matching the logged-in user without requiring manual controller overrides.
* **Pre-conditions**: Tenant user with active session logs in on subdomain/sandbox context (e.g. `bhoomi-alpha`).
* **Test Steps**:
  1. Access the tenant gate, login successfully, and load the dashboard.
  2. Navigate to the Projects or Layout Zones tab.
  3. Inspect details or open the Network console in the browser DevTools.
  4. Verify headers of any outgoing calls with endpoint `/api/v1/projects` or `/api/v1/layouts`.
* **Expected Result**: Outgoing requests contain:
  * `Authorization: Bearer <JWT>`
  * `X-Tenant-ID: bhoomi-alpha` (automatically injected based on the user session).
* **Observed Status**: **PASS**

---

## 2. Resource Deletions Integration
* **Test Case ID**: `TC-RDI-02`
* **Objective**: Verify that deletion requests route successfully and include both session authentication and tenant isolation parameters.
* **Pre-conditions**: Database contains test layout or project record for active tenant.
* **Test Steps**:
  1. Under the Projects panel, choose a test project.
  2. Click the Delete button and accept the browser confirmation window.
  3. Inspect request logs for the DELETE verb to `/api/v1/projects/:id`.
* **Expected Result**: 
  * Request routes through unified `ApiClient.request()`.
  * Outgoing request successfully contains both `Authorization` and `X-Tenant-ID` header fields.
  * Successful database cascade deletion with no parsing crash on response body.
* **Observed Status**: **PASS**

---

## 3. Metadata Safe-Parser Resilience
* **Test Case ID**: `TC-MSP-03`
* **Objective**: Verify that stringified JSON metadata fields do not cause double-escaped formatting or spread-operator rendering crashes.
* **Pre-conditions**: Plot or project list loading custom metadata values.
* **Test Steps**:
  1. Access the land parcel directory under the Plots panel.
  2. Click on a plot that contains active extensible custom attributes or is a standard unconfigured parcel.
  3. Form fields in the inspector show correct values. Try to edit the plot net area or facing and click Save.
  4. Edit again and confirm the JSON metadata is formatted correctly as pretty-print structural block, with no double-escaped literal quote indicators.
* **Expected Result**:
  * No syntax crash is displayed on the screen.
  * Form values reflect normalized text structures.
  * Extensible attributes are interactive and synchronized instantly with database records.
* **Observed Status**: **PASS**

---

## 4. Dashboard Failure Safety & Error Boundary Isolation
* **Test Case ID**: `TC-DFB-04`
* **Objective**: Verify that a crash or rendering exception within root-subordinate modules is isolated, and the main dashboard header & logout options remain 100% visible and interactive.
* **Pre-conditions**: Authenticated user session.
* **Test Steps**:
  1. Cause or mock a runtime rendering exception inside the subordinate `InventoryManager` (e.g., passing illegal elements).
  2. The custom class-based Error Boundary intercepts the crash.
  3. Verify that the global page header, user status ribbon, and Logout panel remain completely unaffected and responsive.
  4. Click the "Reset Local Sandbox" action button inside the boundary panel.
* **Expected Result**:
  * An isolated, visually elegant local warning card ("Inventory Manager Canvas Offline") is shown in place of the corrupted canvas.
  * Outer workspace layouts, parent panels, and navigation items are fully reachable.
  * User can log out successfully.
  * Local state refreshes transparently upon clicking retry.
* **Observed Status**: **PASS**
