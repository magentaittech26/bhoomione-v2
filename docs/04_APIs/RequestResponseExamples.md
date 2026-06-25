# API Payload Code Examples

This document houses complete, copy-pasteable JSON payload models for integration testing, backend mocking, and frontend developments.

---

## 📡 Georeferencing Endpoints Payload Examples

### 1. POST `/layouts/{id}/geo-reference`

Configure surveyor anchor points and calculate the similarity matrix:

* **Request Headers**:
  ```http
  Authorization: Bearer <jwt_token>
  X-Tenant-ID: 9a38f38d-0aef-4b47-862c-80ee0e8f8fe3
  Content-Type: application/json
  ```
* **Request JSON Payload**:
  ```json
  {
    "anchor_1_dxf_x": 0.0,
    "anchor_1_dxf_y": 0.0,
    "anchor_1_lat": 1.352083,
    "anchor_1_lng": 103.819836,
    "anchor_2_dxf_x": 1000.0,
    "anchor_2_dxf_y": 1000.0,
    "anchor_2_lat": 1.352981,
    "anchor_2_lng": 103.820734
  }
  ```
* **Success Response JSON (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Matrix computed and saved.",
    "is_georeferenced": true,
    "layout_id": "99ea7b4e-8fae-4f75-8bfb-4f9e160f8df4",
    "transform_matrix": {
      "A": 0.000000898,
      "B": 0.000000001,
      "C_x": 103.819836,
      "C_y": 1.352083
    }
  }
  ```

---

## 📡 Layout Status Check Example

### 2. GET `/layouts/{id}/geo-status`

Querying status of a previously georeferenced layout drawing:

* **Request Headers**:
  ```http
  Authorization: Bearer <jwt_token>
  X-Tenant-ID: 9a38f38d-0aef-4b47-862c-80ee0e8f8fe3
  ```
* **Success Response JSON (`200 OK`)**:
  ```json
  {
    "is_georeferenced": true,
    "layout_id": "99ea7b4e-8fae-4f75-8bfb-4f9e160f8df4",
    "anchor_1_dxf_x": 0.0,
    "anchor_1_dxf_y": 0.0,
    "anchor_1_lat": 1.352083,
    "anchor_1_lng": 103.819836,
    "anchor_2_dxf_x": 1000.0,
    "anchor_2_dxf_y": 1000.0,
    "anchor_2_lat": 1.352981,
    "anchor_2_lng": 103.820734,
    "transform_matrix": {
      "A": 0.000000898,
      "B": 0.000000001,
      "C_x": 103.819836,
      "C_y": 1.352083
    }
  }
  ```
* **Ungeoreferenced Response JSON (`200 OK`)**:
  ```json
  {
    "is_georeferenced": false,
    "layout_id": "99ea7b4e-8fae-4f75-8bfb-4f9e160f8df4",
    "anchor_1_dxf_x": null,
    "anchor_1_dxf_y": null,
    "anchor_1_lat": null,
    "anchor_1_lng": null,
    "anchor_2_dxf_x": null,
    "anchor_2_dxf_y": null,
    "anchor_2_lat": null,
    "anchor_2_lng": null,
    "transform_matrix": null
  }
  ```
