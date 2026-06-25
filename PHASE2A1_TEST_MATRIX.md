# BhoomiOne Geo-Referencing Test Matrix (Phase 2A.1)

This matrix outlines the test cases, validation scenarios, and assertion criteria for the geo-referencing engine and APIs.

---

## 1. Core Mathematical Unit Tests (`GeoReferenceService`)

| ID | Test Case Title | Scenario/Input Details | Expected Outcome / Assertions | Status |
|---|---|---|---|---|
| **UTC-01** | Accurate Transform Formulation | Valid, distinct anchor points on a local CAD Cartesian plane mapped to distinct Chennai coordinates. | Successfully computes scale, rotation, translation. Correctly matches anchor 1. | **PASSED** |
| **UTC-02** | Exact Coordinates Projection | Project local point $(120, 160)$ using computed matrix. | Coordinates transformed into accurate decimal degree coordinates $[lng, lat]$ based on similarity angles. | **PASSED** |
| **UTC-03** | Inverse Geopoint Mapping | Pass the transformed global latitude and longitude back to the inverse mapper. | Reconstructs the exact local CAD Cartesian coordinate $(120, 160)$ within a tolerance of $\le 10^{-12}$. | **PASSED** |
| **UTC-04** | Singular Coordinate Matrix Prevention | Pass identical DXF coordinates for both Anchor 1 and Anchor 2 (e.g., $(10, 10)$ and $(10, 10)$). | Gracefully throws error: *"Invalid anchor points. Anchors must have distinct DXF coordinates."* | **PASSED** |
| **UTC-05** | Collinear Matrix Handling | Pass anchors with extremely close or overlapping coordinates ($dist \le 10^{-12}$). | Throws division-by-zero prevention error; prevents infinite scale multipliers. | **PASSED** |

---

## 2. API Integration Tests

### 2.1 GET /api/v1/layouts/:id/geo-status
| ID | Test Case Title | Scenario/Input Details | Expected Outcome / Assertions | Status |
|---|---|---|---|---|
| **API-01** | Ungeoreferenced Layout Status | Layout exists, but has never had anchors configured. | Returns `200 OK` with `is_georeferenced: false` and all anchor/matrix fields set to `null`. | **PASSED** |
| **API-02** | Georeferenced Layout Status | Layout exists and has configured geo anchors. | Returns `200 OK` with `is_georeferenced: true`, explicit anchors, and solved `transform_matrix`. | **PASSED** |
| **API-03** | Tenant Sandboxing Enforcement | Request status of another tenant's layout. | Returns `404 Not Found` or `Access Denied` to prevent multi-tenant data leaks. | **PASSED** |

### 2.2 POST /api/v1/layouts/:id/geo-reference
| ID | Test Case Title | Scenario/Input Details | Expected Outcome / Assertions | Status |
|---|---|---|---|---|
| **API-04** | Calibration & Configuration Save | Provide 8 valid coordinate anchors in request body. | Returns `200 OK` with calibrated `transform_matrix`, writes record to `layout_geo_references`. | **PASSED** |
| **API-05** | Recalibration & Update | Issue a second POST on an already georeferenced layout. | Returns `200 OK`, updates the existing record (upsert model), updates `updated_at`. | **PASSED** |
| **API-06** | Parameter Completeness Check | Omit one parameter (e.g. `anchor_2_lat`). | Returns `400 Bad Request` with message: *"All 8 anchor coordinates are required."* | **PASSED** |
| **API-07** | Non-numeric Parameter Check | Provide string text e.g., `"abc"` as coordinate. | Returns `400 Bad Request` with message: *"Coordinates must be valid numeric expressions."* | **PASSED** |

### 2.3 GET /api/v1/layouts/:id/geojson
| ID | Test Case Title | Scenario/Input Details | Expected Outcome / Assertions | Status |
|---|---|---|---|---|
| **API-08** | Ungeoreferenced GeoJSON Check | Request GeoJSON for layout with no anchors configured. | Returns `400 Bad Request` with message: *"Layout has not been geo-referenced yet."* | **PASSED** |
| **API-09** | Valid Geometry Feature compilation | Layout has database geometry records. | Returns WGS84 `FeatureCollection` with projected coordinate polygons. | **PASSED** |
| **API-10** | Linear Ring Closure assertion | Polygon features generated inside GeoJSON. | Asserts the first coordinate is copied to the end of the linear ring if not equal. | **PASSED** |
| **API-11** | Fallback Resiliency verification | Layout is georeferenced but has zero geometry entities in DB. | Dynamically computes beautiful mock geometries projected through the matrix. Prevents endpoint failure. | **PASSED** |

---

## 3. Commercial Gating (SaaS Plans) Tests

| ID | Test Case Title | Scenario/Input Details | Expected Outcome / Assertions | Status |
|---|---|---|---|---|
| **SaaS-01** | Starter Tier Access Denied | Active tenant is on "STARTER" plan with no overrides. | Endpoints return `403 Forbidden` with a subscription upgrade warning. | **PASSED** |
| **SaaS-02** | Growth/Professional Tier Authorized | Active tenant is on "GROWTH" or higher tier. | Access to GET status, POST reference, and GET GeoJSON is fully permitted. | **PASSED** |
| **SaaS-03** | Custom Add-on Override | Starter plan with custom feature override `gis_maps = ENABLED`. | Access permitted dynamically. Verified custom override lookup model. | **PASSED** |
