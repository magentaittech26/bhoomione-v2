# BhoomiOne v2: Commercial API Matrix

This document maps all backend HTTP REST endpoints managing the commercial subscription system.

## Endpoints Catalog

### 1. Subscription Plans (`/api/saas/plans`)
- **GET**: Fetches all available subscription plans, base pricing, and sort order parameters.
- **POST**: Creates or updates a plan and its pricing structure dynamically.
- **Validation Rules**: `plan_code` must be unique and alphanumeric; pricing values must be non-negative.

### 2. Plan Limits & Matrices (`/api/saas/plans/limits`)
- **GET**: Retreives standard bounds configured for each plan code.
- **POST**: Persists limits and toggled feature matrices.

### 3. Add-on Catalog (`/api/saas/addons`)
- **GET**: Lists all dynamic Feature, Capacity, and Service Add-ons.
- **POST**: Updates addon catalog parameters.

### 4. Internal Pricing Rules (`/api/saas/slabs`)
- **GET**: Fetches reference internal plot development cost slabs.
- **POST**: Updates slabs matrix.

### 5. Settings Configuration (`/api/saas/settings`)
- **GET**: Retrieves system-wide settings, auto-initializing empty parameters.
- **POST**: Replicates active parameters to the secure backend.

## Response Payload Structure (Standardized JSON)
```json
{
  "status": "success",
  "data": [],
  "meta": {
    "count": 0,
    "timestamp": "2026-06-27T15:23:00Z"
  }
}
```
All errors return a standardized HTTP `400/422` payload detailing specific validation failures.
