# REST API Reference Manual

Welcome to the BhoomiOne API Reference guide. This document outlines general protocols, URL parameters, required headers, and standard response layouts.

---

## 📡 Base Endpoint URL Configurations

* **Staging Environment**: `https://ais-dev-24iag5ldjbjxtvmxpms3mg-850554405742.asia-southeast1.run.app/api/v1`
* **Local Development**: `http://localhost:3000/api/v1`

---

## 🔑 Custom Integration Headers

Every API request targeting protected tenant workspaces must supply correct authorization credentials and workspace scopes:

| Header Name | Type | Value / Purpose |
| :--- | :--- | :--- |
| **`Authorization`** | String | Standard bearer token format: `Bearer <jwt_token>` |
| **`X-Tenant-ID`** | UUID | Target developer workspace identifier (Mandatory for non-admin API routes) |
| **`Content-Type`** | String | Always set to `application/json` |

---

## 📤 Standard Server Response Layout

All server responses adhere to standardized schemas to facilitate ease of integration on the React front-end.

### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response (`400 Bad Request` or `403 Forbidden`)
```json
{
  "error": "BAD_REQUEST",
  "message": "The provided coordinates are collinear and cannot resolve a singular similarity matrix."
}
```
