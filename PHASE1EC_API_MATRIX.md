# PHASE 1EC: SUBSCRIPTION ENFORCEMENT ENGINE - API MATRIX

This document specifies the complete mapping of endpoints, their associated middleware protection, limit enforcement checks, and status attributes.

---

## 1. REST Endpoint Authorization and Middleware

All requests are authenticated and have access resolved via tenant wrappers before subscription gates compute access states.

| HTTP Method | Route Endpoint | Middleware Stack | Enforcement / Action Performed |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/dxf/files` | `TenantResolver`, `SubscriptionFeatureGate:DXF` | Blocks retrieval if DXF Module is unauthorized |
| **GET** | `/api/v1/dxf/jobs` | `TenantResolver`, `SubscriptionFeatureGate:DXF` | Blocks retrieval if DXF Module is unauthorized |
| **POST** | `/api/v1/dxf/upload` | `TenantResolver`, `SubscriptionFeatureGate:DXF` | Blocks upload if DXF unauthorized, validates Storage Quota |
| **POST** | `/api/v1/dxf/process` | `TenantResolver`, `SubscriptionFeatureGate:DXF` | Blocks CAD compilation if DXF unauthorized |
| **GET** | `/api/v1/tenant/subscription-summary` | `TenantResolver` | Returns live tenant limit, usage, slab and utilization matrix |
| **GET** | `/api/v1/admin/tenants/{id}/subscription-summary` | `RbacPermission:tenants.view` | Retrieves supervisor metrics/slabs for the target tenant |

---

## 2. Resource Validation Gateways (Pre-Create Intercepts)

The following transactional endpoints invoke the `SubscriptionEnforcementEngine::checkLimit` layer immediately inside their respective Service handlers before any row insertion:

### 2.1 POST `/api/v1/projects`
*   **Serviced By:** `ProjectService::create`
*   **Gate Checked Keys:** `projectsLimit` (Project Counts)
*   **Failure Status:** `403 Forbidden`
*   **Payload returning on breach:**
    ```json
    {
      "error": "LIMIT_EXCEEDED",
      "message": "Your subscription project limit has been exceeded. Please upgrade your plan."
    }
    ```

### 2.2 POST `/api/v1/layouts`
*   **Serviced By:** `LayoutService::create`
*   **Gate Checked Keys:** `layoutsLimit` (Layout Counts)
*   **Failure Status:** `403 Forbidden`
*   **Payload returning on breach:**
    ```json
    {
      "error": "LIMIT_EXCEEDED",
      "message": "Your subscription layout limit has been exceeded. Please upgrade your plan."
    }
    ```

### 2.3 POST `/api/v1/plots`
*   **Serviced By:** `PlotService::create`
*   **Gate Checked Keys:** `plotsLimit` (Plot Subdivision Density)
*   **Failure Status:** `403 Forbidden`
*   **Payload returning on breach:**
    ```json
    {
      "error": "LIMIT_EXCEEDED",
      "message": "Your subscription plot density limit has been exceeded. Please upgrade your plan."
    }
    ```

### 2.4 POST `/api/v1/dxf/upload`
*   **Serviced By:** `DxfController::upload`
*   **Gate Checked Keys:** `fileStorageGb` (Workspace Disk Space)
*   **Units Measured:** Bytes calculated from file stream normalized to Gigabytes against the limit parameter.
*   **Failure Status:** `403 Forbidden`
*   **Payload returning on breach:**
    ```json
    {
      "error": "LIMIT_EXCEEDED",
      "message": "Your workspace file storage limit has been exceeded. Please upgrade your active subscription package."
    }
    ```

### 2.5 Role Assignment Endpoint (Inserting Members)
*   **Serviced By:** `RoleService::assignTenantRole`
*   **Gate Checked Keys:** `usersLimit` (Authorized Members Seat Quota)
*   **Handled Exception:** Prevents role assignment for **new** member connections, allows role adjustments for existing members.
*   **Failure Status:** `403 Forbidden`
