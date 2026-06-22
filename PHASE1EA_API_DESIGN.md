# Phase 1E-A — SaaS Subscription API Design

This document describes the administrative REST API specs for managing the multi-dimensional SaaS subscription configurations dynamically.

---

## 1. Request Context & Authorization

*   **Prefix**: `/api/v1`
*   **Response Format**: `application/json`
*   **Authentication Requirements**: Requires active JWT token passing through the `Authorization: Bearer <token>` header, verified against active super-admin or SaaS operator roles (`tenants.view`, `tenants.manage` permissions).

---

## 2. API Reference & Payloads

### A. Core Dynamic Cataloging

#### `GET /api/v1/admin/modules`
Retrieve the full global catalog of systems modules and child feature tags.
*   **Required Permissions**: `tenants.view`
*   **Sample Response**:
    ```json
    [
      {
        "id": "e6f8df7c-5bb5-4bd4-9a00-349f7e6f6631",
        "code": "PROJECTS",
        "name": "Projects Module",
        "group": "Core Development",
        "is_core": true,
        "is_billable": true,
        "features": [
          {
            "id": "a29bd7bd-6872-4d00-afab-cfd0cf4876b2",
            "name": "View Projects Module",
            "code": "projects.view",
            "status": "ACTIVE",
            "default_enabled": true
          }
        ]
      }
    ]
    ```

---

### B. Standard Subscription Packages

#### `GET /api/v1/admin/plans`
Query standard license packages, with bundled resource quotas and mapped features.
*   **Required Permissions**: `tenants.view`

#### `POST /api/v1/admin/plans`
Create a new pricing plan tier or update an existing model.
*   **Required Permissions**: `tenants.manage`
*   **Request Body**:
    ```json
    {
      "id": "8fa537b0-8041-4cb4-bfff-12fbd659b8be",
      "plan_code": "PROFESSIONAL",
      "name": "Professional Plus",
      "monthly_price": 499.00,
      "yearly_price": 4990.00,
      "trial_days": 30,
      "status": "ACTIVE",
      "limits": {
        "projectsLimit": 10,
        "layoutsLimit": 50,
        "plotsLimit": 5000,
        "usersLimit": 50
      },
      "features": [
        "a29bd7bd-6872-4d00-afab-cfd0cf4876b2"
      ]
    }
    ```

---

### C. Tenant Subscription Lifecycle Assignments

#### `GET /api/v1/admin/tenants/{id}/subscription`
Retrieve subscription, overrides, and assigned addons profile for a specific tenant.
*   **Required Permissions**: `tenants.view`
*   **Response Payload**:
    ```json
    {
      "has_subscription": true,
      "id": "99330ab4-1a50-4fc7-b80c-cc2bd1d0f501",
      "tenant_id": "f83db544-aa0f-4886-9ac7-393bfbf2417a",
      "plan_id": "8fa537b0-8041-4cb4-bfff-12fbd659b8be",
      "status": "ACTIVE",
      "subscription_start_date": "2026-06-22",
      "subscription_expiry_date": "2027-06-22",
      "plan": {
        "id": "8fa537b0-8041-4cb4-bfff-12fbd659b8be",
        "plan_code": "PROFESSIONAL",
        "name": "Professional Plus"
      },
      "addons": [],
      "feature_overrides": [],
      "limit_overrides": []
    }
    ```

#### `POST /api/v1/admin/tenants/{id}/subscription`
Assign / transition a tenant workspace onto a new pricing structure.
*   **Required Permissions**: `tenants.manage`
*   **Request Body**:
    ```json
    {
      "plan_id": "8fa537b0-8041-4cb4-bfff-12fbd659b8be",
      "start_date": "2026-06-22",
      "billing_period": "YEARLY",
      "trial_days": 14
    }
    ```

#### `POST /api/v1/admin/tenants/{id}/subscription/lifecycle`
Perform manual lifecycle administrative overrides (e.g. suspension).
*   **Required Permissions**: `tenants.manage`
*   **Request Body**:
    ```json
    {
      "status": "SUSPENDED"
    }
    ```

#### `POST /api/v1/admin/tenants/{id}/subscription/overrides`
Save fine-grained custom limit increases and special feature exceptions for a specific tenant.
*   **Required Permissions**: `tenants.manage`
*   **Request Body**:
    ```json
    {
      "limit_overrides": {
        "plotsLimit": 10000
      },
      "feature_overrides": {
        "a29bd7bd-6872-4d00-afab-cfd0cf4876b2": "ENABLED"
      },
      "addons": [
        "cca6bc93-79d1-419b-abff-aa0bfb85cbd1"
      ]
    }
    ```

---

## 3. Standard Server Error Handlers

| Error Code | HTTP Status | Explanation |
| :--- | :--- | :--- |
| `ValidationException` | `422 Unprocessable` | Input parameters violated constraints (e.g., plan price < 0) |
| `ModelNotFoundException`| `404 Not Found` | Entity ID could not be matched inside safe parameters |
| `AuthorizationException`| `403 Forbidden` | Mismatch of security token or lacking `tenants` permissions |
| `Exception` | `500 Server Error` | Unexpected downstream failure; parsed securely with detailed logger |
