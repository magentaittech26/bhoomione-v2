# System API Error Codes Guide

This document defines the standardized error payloads, numeric HTTP status codes, and recovery suggestions for external developers integrating with BhoomiOne.

---

## ⚠️ Standard Error Body structure

BhoomiOne API returns structured JSON error bodies during execution failures:

```json
{
  "error": "ERROR_CODE_REFERENCE",
  "message": "Human-readable explanation of what failed.",
  "errors": {
    "field_name": [
      "Validation description details..."
    ]
  }
}
```

---

## 📋 API Error Codes Directory

| Error Code | HTTP Status | Root Cause | Client Action / Resolution |
| :--- | :--- | :--- | :--- |
| **`BAD_REQUEST`** | 400 | Invalid payload parameters or non-numeric expressions. | Correct coordinate parameters. |
| **`UNAUTHORIZED`** | 401 | Missing, malformed, or expired JWT session token. | Re-authenticate user via `/auth/login`. |
| **`FORBIDDEN`** | 403 | RBAC permission claim validation failed on server. | Request access role upgrade from Tenant Admin. |
| **`FEATURE_NOT_AVAILABLE`**| 403 | Target features are not part of tenant's subscription. | Upgrade tenant subscription plan. |
| **`NOT_FOUND`** | 404 | Target entity missing or belonging to another tenant. | Verify UUID parameter and active tenant context. |
| **`GEOREFERENCE_ERROR`** | 400 | Transformation singular matrix or collinear bounds check failed.| Re-provide non-collinear anchor points. |
| **`INTERNAL_SERVER_ERROR`**| 500 | Unhandled server exception during execution. | Capture tracking code and contact platform support. |
