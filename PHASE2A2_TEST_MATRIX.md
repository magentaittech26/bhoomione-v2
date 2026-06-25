# BhoomiOne Geo-Referencing Laravel Migration Test Matrix (Phase 2A.2)

This matrix details the QA validation test suite and assertions used to verify correct behavior of the Laravel Georeferencing endpoints, mathematical transform logic, and commercial SaaS plan gating.

---

## 1. Mathematical Unit Tests (`GeoReferenceService`)

| ID | Test Case Title | Scenario / Inputs | Expected Outcome & Assertions | Status |
| :--- | :--- | :--- | :--- | :--- |
| **MAT-01** | Mathematical Coefficient Verification | Input valid, non-collinear anchor points mapped from a local Cartesian plane to WGS84 coordinates. | Correctly resolves similarity coefficients $A, B, C_x, C_y$. Correctly projects Anchor 1 back to itself. | **PASSED** |
| **MAT-02** | Coordinate Projection Precision | Project local CAD Cartesian coordinate point $(150.0, 300.0)$ using resolved matrix. | Correctly outputs expected geodetic decimal degree point $[lng, lat]$ conforming to similitude scaling. | **PASSED** |
| **MAT-03** | Inverse Coordinate Reconstruction | Pass the output decimal degree coordinate $[lng, lat]$ back into the inverse geodetic-to-dxf mapper. | Successfully reconstructs original local CAD point $(150.0, 300.0)$ within a precision tolerance of $\le 10^{-12}$. | **PASSED** |
| **MAT-04** | Collinear Coordinate Failure Prevention | Provide identical local Cartesian coordinates for both Anchor 1 and Anchor 2 (singular layout matrix). | Throws `InvalidArgumentException` preventing division-by-zero or infinite scaling factor errors. | **PASSED** |
| **MAT-05** | Lat/Lng Bound Validation | Provide latitudes outside range $[-90, 90]$ or longitudes outside $[-180, 180]$. | Throws `InvalidArgumentException`: *"Latitude values must be between -90 and 90."* | **PASSED** |

---

## 2. API Integration Tests

### 2.1 GET `/api/v1/layouts/{id}/geo-status`
| ID | Test Case Title | Scenario / Inputs | Expected Outcome & Assertions | Status |
| :--- | :--- | :--- | :--- | :--- |
| **API-01** | Ungeoreferenced Layout Status | Layout exists, but has never had anchors configured. | Returns `200 OK` with `is_georeferenced: false` and all anchor/matrix fields set to `null`. | **PASSED** |
| **API-02** | Georeferenced Layout Status | Layout exists and has configured georeferencing calibration anchors. | Returns `200 OK` with `is_georeferenced: true`, explicit coordinates, and solved `transform_matrix`. | **PASSED** |
| **API-03** | Tenant Workspace Isolation | Request status of a layout belonging to another tenant's workspace. | Returns `404 Not Found` with mismatching tenant workspace error message. | **PASSED** |

### 2.2 POST `/api/v1/layouts/{id}/geo-reference`
| ID | Test Case Title | Scenario / Inputs | Expected Outcome & Assertions | Status |
| :--- | :--- | :--- | :--- | :--- |
| **API-04** | Save Georeference Configuration | Provide 8 valid, distinct coordinate points in body request. | Returns `200 OK` with `is_georeferenced: true`, solved matrix, and registers the database record. | **PASSED** |
| **API-05** | Recalibrate Existing Georeference | Issue a second POST update on an already calibrated layout. | Returns `200 OK` with updated matrix coefficients (upsert) and updates `updated_at`. | **PASSED** |
| **API-06** | Required Fields Validation | Omit required field in body payload (e.g. `anchor_2_lat`). | Returns `400 Bad Request` with structured validation messages. | **PASSED** |
| **API-07** | Non-numeric Expression check | Provide text string like `"abc"` inside numeric parameter. | Returns `400 Bad Request` indicating validation errors. | **PASSED** |

### 2.3 GET `/api/v1/layouts/{id}/geojson`
| ID | Test Case Title | Scenario / Inputs | Expected Outcome & Assertions | Status |
| :--- | :--- | :--- | :--- | :--- |
| **API-08** | Ungeoreferenced GeoJSON Check | Request GeoJSON for layout with no configured anchors. | Returns `400 Bad Request` indicating: *"Layout has not been geo-referenced yet."* | **PASSED** |
| **API-09** | Valid Geometry Feature Compilation | Layout has database geometry records. | Returns standard WGS84 `FeatureCollection` with projected polygon vectors. | **PASSED** |
| **API-10** | Linear Ring Closure Check | Compile polygon elements. | Ensures first coordinate point is copied to the end of the ring if they are not equal. | **PASSED** |
| **API-11** | Clean Empty Fallback Check | Layout is calibrated but has zero geometry entities in database. | Returns: `{"type": "FeatureCollection", "features": [], "message": "No geospatial geometry compiled..."}`. | **PASSED** |

---

## 3. Commercial Gating (SaaS Feature Flag) Tests

| ID | Test Case Title | Scenario / Inputs | Expected Outcome & Assertions | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SaaS-01** | Starter Tier Access Forbidden | Tenant on "STARTER" plan without overrides tries to access any of the georeferencing routes. | Returns `403 Forbidden` with error code `FEATURE_NOT_AVAILABLE` and subscription upgrade guidance. | **PASSED** |
| **SaaS-02** | Premium Tier Authorized Access | Tenant on "GROWTH" or higher plan tries to access routes. | Access is permitted; endpoints return `200 OK`. | **PASSED** |
| **SaaS-03** | Custom Feature Override Allowance | Starter tier tenant with active override `gis_maps = ENABLED` tries to access routes. | Access is dynamically permitted; returns `200 OK`. | **PASSED** |
