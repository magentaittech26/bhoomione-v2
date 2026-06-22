# PHASE 1EC: SUBSCRIPTION ENFORCEMENT ENGINE - TEST MATRIX

This document outlines standard testing operations to execute in order to verify system gating, limits, metrics retrieval, and UI consistency.

---

## 1. Feature Enforcement Scenarios

### Test Scenario 1.1: Gated Feature Access (DXF Authorized)
*   **Initial State:** Tenant has `DXF` code listed in active baseline plan features or assigned add-ons list.
*   **Action:** Call `GET /api/v1/dxf/files` specifying the tenant ID in headers or payload context.
*   **Expected Outcome:** Request routes smoothly, returns files list (HTTP 200).

### Test Scenario 1.2: Un-authorized Feature Blocking (DXF Blocked)
*   **Initial State:** Tenant does NOT have `DXF` or is on a STARTER/basic plan without add-ons or overrides.
*   **Action:** Call `GET /api/v1/dxf/files` or attempt file upload `POST /api/v1/dxf/upload`.
*   **Expected Outcome:** Middleware returns HTTP 403 Forbidden with payload:
    `{"error": "FEATURE_NOT_AVAILABLE", "feature": "DXF", ...}` with the upgrade guidance instructions.

---

## 2. Resource Enforcements (Limits Caps) Scenarios

### Test Scenario 2.1: Project Creation Threshold Breach
*   **Initial State:** Tenant limit is set to 2 projects. Currently has 2 projects.
*   **Action:** Try to create a third project: `POST /api/v1/projects`.
*   **Expected Outcome:** Transaction rolls back, returns HTTP 403 Forbidden with payload:
    `{"error": "LIMIT_EXCEEDED", "message": "Your subscription project limit has been exceeded. Please upgrade your plan."}`

### Test Scenario 2.2: CAD File Storage Cap Breach
*   **Initial State:** Tenant file database has 1.95 GB consumed out of a 2 GB storage limit.
*   **Action:** Upload a 100 MB DXF drawing: `POST /api/v1/dxf/upload`.
*   **Expected Outcome:** Check identifies addition (1.95 + 0.1 > 2.0), rolls back upload, returns HTTP 403 Forbidden with payload:
    `{"error": "LIMIT_EXCEEDED", "message": "Your workspace file storage limit has been exceeded. Please upgrade your active subscription package."}`

### Test Scenario 2.3: Member Seat Limit Enforcement
*   **Initial State:** Tenant has 3 seat slots assigned. Currently has 3 members.
*   **Action:** Trigger role assignment for a new member ID `POST /api/v1/admin/assign-role`.
*   **Expected Outcome:** Service throws LIMIT_EXCEEDED, blocks user attachment.

---

## 3. Override Priority Chain verification

### Test Scenario 3.1: Force-Revoke Override Precedence
*   **Initial State:** Plan has DXF feature enabled, but custom Feature Override is set to `DISABLED`.
*   **Action:** Try retrieving DXF files catalog list.
*   **Expected Outcome:** Force-revoke takes absolute precedence, blocks access with `FEATURE_NOT_AVAILABLE` status.

---

## 4. UI Rendering Verifications

### Test Scenario 4.1: Live Tenant Custom Sidebar Metrics
*   **Action:** Open SaaS Admin Dashboard, select a tenant, click "Custom Sub".
*   **Expected UI State:**
    - Live Resource Usage section renders immediately.
    - Status bars display actual utilization matching tables count.
    - Accurate pricing slab is resolved depending on plots quantity (e.g. `1-50` or `101-250` slab range).
