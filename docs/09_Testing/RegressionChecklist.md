# Regression Avoidance Checklist

This document details the critical regression-testing areas that must be validated during system merges, framework upgrades, or module refactorings.

---

## 🛡️ Critical Regression Prevention Areas

### 1. Multi-Tenant Workspace Sandboxing
* **Risk**: Merging a routing change or base controller update might bypass the tenant scope injection middleware, exposing cross-tenant data.
* **Regression Check**: Attempt to execute authenticated requests using cross-tenant parameters. Verify that the server returns HTTP `404 Not Found` or `403 Forbidden` for all attempts.

### 2. Gating of Premium Features
* **Risk**: Updates to routing hierarchies might accidentally disable the subscription gate.
* **Regression Check**: Temporarily configure a test tenant workspace with the "Starter" plan (no premium features enabled). Attempt to request the `/layouts/{id}/geojson` endpoint. Verify that the response returns HTTP `403 FEATURE_NOT_AVAILABLE`.

### 3. Coordinate Transformation Accuracy
* **Risk**: Updates to coordinate transformation matrices calculation engines might break scaling parameters, causing layout misalignment.
* **Regression Check**: Execute calculations with a set of known collinear points and verify that the engine catches the error, returning `GEOREFERENCE_ERROR` instead of crashing.
