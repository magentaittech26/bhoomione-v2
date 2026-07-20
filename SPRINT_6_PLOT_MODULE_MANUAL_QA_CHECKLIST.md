# BhoomiOne V3 - Sprint 6B Plot Module Production Manual QA Checklist

This document outlines the step-by-step procedures to manually verify production security, tenant-level isolation, granular RBAC, dynamic action escalation, and environment security overrides in the BhoomiOne V3 Plot Module.

---

## SECTION 1: Tenant Subscription Lifecycle (Fail-Closed Enforcement)

These tests ensure that tenants with invalid subscription states are blocked from mutate and view operations.

### Case 1.1: Suspended Tenant Attempting Plot Mutations
*   **Pre-requisites**: Tenant ID `suspended-tenant` has status set to `SUSPENDED` in `tenant_subscriptions` table. An active user under this tenant is logged in.
*   **Execution Steps**:
    1. Log in to the portal as a user associated with the suspended tenant.
    2. Navigate to the Interactive Map Workspace.
    3. Attempt to add a new plot or modify any existing plot geometry details.
    4. Attempt to submit a plot split/merge operation.
*   **Expected Results**:
    *   The backend responds with `403 Forbidden` and message `Forbidden. Inactive tenant subscription.`.
    *   The frontend displays a clear, graceful subscription warning banner or error notice.
    *   No database mutations occur.

### Case 1.2: Expired Tenant Attempting Plot Mutations
*   **Pre-requisites**: Tenant ID `expired-tenant` has `expires_at` timestamp set to a date in the past.
*   **Execution Steps**:
    1. Log in as a user from the expired tenant.
    2. Attempt any plot or layout editing action.
*   **Expected Results**:
    *   The backend immediately terminates the call, returning `403 Forbidden` with message `Forbidden. Tenant subscription has expired.`.
    *   Operations are blocked.

---

## SECTION 2: Feature Entitlements (Tier-Based Access Controls)

Verify that plot-based features degrade gracefully or block access entirely when the tier feature is deactivated.

### Case 2.1: Tier Plan Lacking `maps.plots` Entitlement
*   **Pre-requisites**: User is logged in under a plan where the `PLOTS` feature is marked `DISABLED` or omitted from the features association list.
*   **Execution Steps**:
    1. Open the Map Workspace.
    2. Verify if plot editing panels, CAD file dropzones, and SVG map visualizer views are accessible.
    3. Trigger a direct POST request to `/api/v1/plots` or `/api/v1/dxf/upload`.
*   **Expected Results**:
    *   The backend rejects the request with `403 Forbidden` and the specific message: `Forbidden. maps.plots entitlement is disabled on your current plan tier.`.
    *   The frontend suppresses the interactive design controls immediately.

---

## SECTION 3: Granular RBAC Permissions & Dynamic Escalation

Assert that non-admin roles are restricted to their explicit permissions, and that dynamic operations (split, merge, renumber) are correctly escalated.

### Case 3.1: Read-Only User Attempting CAD Ingestion or Plot Edits
*   **Pre-requisites**: User has standard `plots.view` but NOT `plots.create` or `plots.edit`.
*   **Execution Steps**:
    1. Navigate to the CAD Import Workspace.
    2. Select a DXF layout file and click "Ingest CAD File".
    3. Attempt to drag-adjust any plot coordinates on the canvas.
*   **Expected Results**:
    *   The backend blocks the ingestion with `403 Forbidden` and message: `Forbidden. Insufficient permissions to execute action [plots.create].`.
    *   Plot drag adjustments are blocked on the client and rejected by `/api/v1/plots/:id` with `403 Forbidden` (Insufficient permissions).

### Case 3.2: Dynamic Permission Escalation - Plot Splitting
*   **Pre-requisites**: User has `plots.edit` permission, but lacks the specialized `plots.split` permission.
*   **Execution Steps**:
    1. Select a plot on the interactive map workspace.
    2. Click the "Split Plot" tool in the Map Workspace sidebar.
    3. Define split dimensions and click "Execute Plot Partition".
*   **Expected Results**:
    *   The backend resolves `dimensions_metadata` containing the split target, upgrading the required action check to `plots.split`.
    *   Since the user lacks `plots.split` (and does not have the master `plots.manage` override), the backend rejects the request with `403 Forbidden` (Insufficient permissions to execute action [plots.split]).
    *   The partition transaction is entirely rolled back.

### Case 3.3: Dynamic Permission Escalation - Plot Renumbering
*   **Pre-requisites**: User has standard `plots.edit` permission, but lacks `plots.renumber` permission.
*   **Execution Steps**:
    1. Open the Plot Inspector panel.
    2. Edit the plot number field (e.g., change `P-1` to `P-100`).
    3. Click "Save Status & Parameters".
*   **Expected Results**:
    *   The backend intercepts the plot number change, upgrading the required action check to `plots.renumber`.
    *   The backend rejects the PUT request with `403 Forbidden` and message `Forbidden. Insufficient permissions to execute action [plots.renumber].`.

---

## SECTION 4: Strict Relational Cross-Tenant Isolation

These tests assert that users can never query, edit, or delete resources belonging to other tenants by manipulating UUIDs or request parameters.

### Case 4.1: Cross-Tenant Plot Parameter Attack (ID Swapping)
*   **Pre-requisites**:
    *   User A belongs to `tenant-a`.
    *   Plot B belongs to `tenant-b` with UUID `b8888888-8888-8888-8888-888888888888`.
*   **Execution Steps**:
    1. Log in as User A.
    2. Construct and execute a manual `PUT` or `GET` API request using curl, Postman, or devtools to:
       `/api/v1/plots/b8888888-8888-8888-8888-888888888888`
    3. Attempt to send update parameters in the body.
*   **Expected Results**:
    *   The backend's `verifyPlotAccess` intercepts the query, queries the plot and checks the associated layout/project tenant ID.
    *   It discovers the plot belongs to `tenant-b`.
    *   The backend returns `404 Not Found` with message `Plot not found.` (Failing closed without leaking the existence of the foreign plot).

### Case 4.2: Cross-Tenant Layout Asset Upload Attack
*   **Pre-requisites**: User belongs to `tenant-a`. Layout belongs to `tenant-b` with UUID `l9999999-9999-9999-9999-999999999999`.
*   **Execution Steps**:
    1. Send a POST request to `/api/v1/layouts/l9999999-9999-9999-9999-999999999999/assets` with an image base64 string.
*   **Expected Results**:
    *   The request is immediately blocked by `verifyPlotAccess` with a `404 Not Found` status.
    *   No layout asset is written to the database.

---

## SECTION 5: Commercial Plot Lifecycle State Restrictions

Ensures that plot inspector status changes are governed by proper lifecycle guards.

### Case 5.1: Attempting Commercial Change to Restricted Status
*   **Pre-requisites**: Plot has use type classified as `COMMERCIAL` in its metadata.
*   **Execution Steps**:
    1. Open the Plot Inspector for the Commercial plot.
    2. Attempt to select status options like `PRE_BOOKED`, `BOOKED`, `SOLD`, or `CANCELLED`.
    3. Alternatively, send a PUT request to update status to `BOOKED`.
*   **Expected Results**:
    *   The Plot Inspector status dropdown is restricted solely to `DRAFT`, `VALIDATED`, and `APPROVED` options.
    *   Any backend update containing forbidden status codes for a commercial plot is intercepted and rejected with `400 Bad Request` and message: `Commercial plots are restricted to Draft, Validated, or Approved states only.`.

---

## SECTION 6: Production QA Simulation Hiding & Security

Ensures that testing utilities cannot be accessed or leveraged to bypass authentication.

### Case 6.1: Tab Absence under Production Flags
*   **Pre-requisites**: `VITE_ENABLE_QA_SIMULATION` is set to `false` or left undefined in the production build environment.
*   **Execution Steps**:
    1. Log in to the application.
    2. Open the Plot Control Center panel.
    3. Look for the "Verification" section and the "QA Simulation Panel" button.
*   **Expected Results**:
    *   The entire Verification header and the QA Simulation Panel button are completely absent from the sidebar.
    *   If a user tries to manually invoke `setActiveTab("qa")` via console, the panel content viewport is completely hidden and does not render.

### Case 6.2: Module Registry Simulation Bypass Prevention
*   **Pre-requisites**: A malicious actor attempts to bypass authorization by writing `BhoomiModuleRegistry.getInstance().setEntitlement("maps.plots", true)` in their browser console.
*   **Execution Steps**:
    1. Open browser devtools console.
    2. Execute registry bypass script.
    3. Attempt to perform an API-based plot mutation.
*   **Expected Results**:
    *   The frontend might locally unlock some buttons, but any triggered API request is caught and blocked at the backend with `403 Forbidden` status.
    *   Database mutations remain completely locked.
