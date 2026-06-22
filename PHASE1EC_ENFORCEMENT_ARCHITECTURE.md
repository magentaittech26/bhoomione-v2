# PHASE 1EC: SUBSCRIPTION ENFORCEMENT ENGINE - ARCHITECTURAL DESIGN

This document specifies the technical and design blueprints for subscription validation and resource cap enforcement within BhoomiOne V2.

---

## 1. Scope & Objective

Convert general SaaS tenancy profiles and persisted subscription plans into hard operational validation barriers. The platform must safeguard the multi-tenant system by checking effective product availability and resource volumes before handling CRUD execution streams.

---

## 2. Core Service Architecture: `SubscriptionEnforcementEngine`

The central core consists of `SubscriptionEnforcementEngine.php` which executes live queries inside the PostgreSQL transaction database wrapper, ensuring **zero reliance on localStorage, browser state buffers, or mock variables**.

### 2.1 Dynamic Effective Feature Composition Engine
We calculate tenant access-rights in real-time according to mathematical precedence:
```
Effective Features = [Plan Baseline Features] 
                     + [Assigned Workspace Add-on Features] 
                     + [Direct Force-Enable Feature Overrides]
                     - [Direct Force-Revoke Feature Overrides]
```

### 2.2 Dynamic Capacity Limits Engine
Volume thresholds are compiled using a structured override evaluation:
```
Effective Limit Value = IF (Tenant Limit Override is defined) 
                            THEN [Tenant Limit Override Value] 
                            ELSE [Baseline Subscription Plan Limit Value]
```

### 2.3 Resource Usage Accumulation Queries
Unlike mock dashboards, the utilization tracker aggregates live counts:
*   **Projects Count:** `SELECT COUNT(*) FROM projects WHERE tenant_id = :tenantId`
*   **Layouts Count & Plots Count:** Joined queries validating recursive sub-branches.
*   **Seat Users:** Tracked in the `tenant_users` bridge mappings repository.
*   **Storage Consumed:** Formulated in Gigabytes after summing byte counts of all CAD DXF files: `(SUM(file_size) / (1024^3))`.

---

## 3. Subscription Feature Gate Middleware

The framework registers the `/backend-api/app/Http/Middleware/SubscriptionFeatureGate.php` middleware. It intercepts requested routes by doing the following:
1.  Resolves the current workspace tenant ID context safely.
2.  Inspects feature authorization (e.g. `hasFeature($tenantId, 'DXF')`).
3.  If checked features do not match authorized tokens, the gate stops execution immediately and returns a **403 Forbidden Response** with custom structure:
    ```json
    {
      "error": "FEATURE_NOT_AVAILABLE",
      "feature": "DXF",
      "message": "The 'DXF' feature is not included in your active subscription package.",
      "upgrade_guidance": "To unlock access to DXF, please visit the Subscriptions Center in the administration console, or contact your BhoomiOne Platform Support agent..."
    }
    ```

---

## 4. Limit Caps Enforcement Boundaries

Validations are injected sequentially before any persistence operation inside service layers:
*   **Projects Limit:** Validated inside `ProjectService::create`.
*   **Layouts Limit:** Validated inside `LayoutService::create`.
*   **Plots Limit:** Validated inside `PlotService::create`.
*   **Storage Limit (CAD Upload):** Bytes of uploaded file validated inside `DxfController::upload`.
*   **Seats Limit:** Checked when inserting into the `tenant_users` roster inside `RoleService::assignTenantRole`.

If any limit is breached, the engine throws a `LIMIT_EXCEEDED` exception, prompting the Controller to rollback any active transactions and return a **403 Forbidden payload** containing the explicit error token.
