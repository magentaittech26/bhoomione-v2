# BhoomiOne V3 - Project and Layout API Contract Specification

This document defines the formal request and response JSON schemas, HTTP headers, and route contracts for **Projects** and **Layouts** within the BhoomiOne v3 enterprise platform.

---

## 1. Global Request Headers
Every request directed to the API gateway must contain authentication and tenant isolation parameters:

```http
Content-Type: application/json
Authorization: Bearer <JWT_ACCESS_TOKEN>
x-tenant-id: <TENANT_CODE_OR_ID>
```

---

## 2. Project API Routes

### A. Create Project
- **Route**: `POST /api/v1/projects`
- **Request Payload**:
```json
{
  "name": "Bhoomi Heights",
  "code": "BHM-HGTS",
  "developer_name": "Bhoomi Realty Developers",
  "location": "Sector 5, HSR Layout, Bengaluru",
  "status": "PLANNING",
  "approval_status": "PENDING",
  "approval_authority": "BDA",
  "approvals_metadata": {
    "project_type": "RESIDENTIAL",
    "state": "KARNATAKA",
    "district": "BENGALURU",
    "taluk": "BENGALURU_SOUTH",
    "village": "HSR_VILLAGE",
    "country": "INDIA",
    "pincode": "560102"
  },
  "rera_number": "PRM/KA/RERA/1251/310/PR/200520/003412",
  "launch_date": "2026-08-01",
  "possession_target_date": "2029-12-31"
}
```
- **Response (201 Created)**:
```json
{
  "id": "proj-9012-uuid-v4",
  "name": "Bhoomi Heights",
  "code": "BHM-HGTS",
  "developer_name": "Bhoomi Realty Developers",
  "location": "Sector 5, HSR Layout, Bengaluru",
  "status": "PLANNING",
  "approval_status": "PENDING",
  "approval_authority": "BDA",
  "approvals_metadata": { ... },
  "rera_number": "PRM/KA/RERA/1251/310/PR/200520/003412",
  "launch_date": "2026-08-01T00:00:00.000Z",
  "possession_target_date": "2029-12-31T00:00:00.000Z",
  "created_at": "2026-07-20T10:00:00.000Z"
}
```

### B. Update/Archive/Restore Project
- **Route**: `PUT /api/v1/projects/:id`
- **Request Payload** (for Archiving: set `"status": "ARCHIVED"`):
```json
{
  "name": "Bhoomi Heights (Archived)",
  "code": "BHM-HGTS",
  "developer_name": "Bhoomi Realty Developers",
  "location": "Sector 5, HSR Layout, Bengaluru",
  "status": "ARCHIVED",
  "approval_status": "PENDING",
  "approval_authority": "BDA",
  "approvals_metadata": {
    "original_status": "PLANNING"
  }
}
```

### C. Delete Project (Cascading)
- **Route**: `DELETE /api/v1/projects/:id`
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Project de-registered and all sub-entities cascade-purged."
}
```

---

## 3. Layout API Routes

### A. Create Layout
- **Route**: `POST /api/v1/layouts`
- **Request Payload**:
```json
{
  "project_id": "proj-9012-uuid-v4",
  "name": "Emerald Phase 1",
  "code": "EMD-P1",
  "layout_type": "GATED_COMMUNITY",
  "approval_number": "Ap:BDA-9012-APP | Ph:Phase 1 | Sy:Survey 12/A, 12/B | De:Zoned residential",
  "approval_date": "2026-07-15",
  "total_area_value": 500000.00,
  "measurement_unit_id": "unit-sqft-uuid-v4",
  "status": "APPROVED"
}
```
- **Response (210 Created / 200 OK)**:
```json
{
  "id": "lay-3456-uuid-v4",
  "project_id": "proj-9012-uuid-v4",
  "name": "Emerald Phase 1",
  "code": "EMD-P1",
  "layout_type": "GATED_COMMUNITY",
  "approval_number": "Ap:BDA-9012-APP | Ph:Phase 1 | Sy:Survey 12/A, 12/B | De:Zoned residential",
  "approval_date": "2026-07-15T00:00:00.000Z",
  "total_area_value": 500000.00,
  "measurement_unit_id": "unit-sqft-uuid-v4",
  "status": "APPROVED",
  "created_at": "2026-07-20T10:05:00.000Z"
}
```

### B. Update/Archive/Restore Layout
- **Route**: `PUT /api/v1/layouts/:id`
- **Request Payload** (for Restoring, parse original status and write back):
```json
{
  "project_id": "proj-9012-uuid-v4",
  "name": "Emerald Phase 1",
  "code": "EMD-P1",
  "layout_type": "GATED_COMMUNITY",
  "approval_number": "Ap:BDA-9012-APP | Ph:Phase 1 | Sy:Survey 12/A, 12/B",
  "status": "DRAFT"
}
```

### C. Delete Layout
- **Route**: `DELETE /api/v1/layouts/:id`
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Layout de-registered and child plots cascade-purged."
}
```
