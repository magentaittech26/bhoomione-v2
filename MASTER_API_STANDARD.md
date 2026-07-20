# BhoomiOne V3 – Master API Standard

All BhoomiOne Master Data Management (MDM) REST endpoints must conform to the unified HTTP interface described in this document. Standardizing the API contract allows the frontend application and future developer API integrations to interact with all masters in an identical manner.

---

## 1. REST Endpoint Summary

Every master module exposes endpoints under the base path `/api/v1/<plural-master-name>`:

| Method | Endpoint | Description | RBAC Permission Guard |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/<masters>` | Paginated, filtered, and sorted list of records. | `masters.<module>.view` |
| **GET** | `/api/v1/<masters>/:id` | Retrieve a single record by UUID or ID. | `masters.<module>.view` |
| **POST** | `/api/v1/<masters>` | Create a new master record. | `masters.<module>.create` |
| **PUT** | `/api/v1/<masters>/:id` | Update an existing master record. | `masters.<module>.edit` |
| **DELETE**| `/api/v1/<masters>/:id` | Soft delete a record (setting `deleted_at`). | `masters.<module>.delete` |
| **PATCH** | `/api/v1/<masters>/:id/toggle` | Toggle `is_active` state. | `masters.<module>.activate` |
| **GET** | `/api/v1/<masters>/lookup` | Lightweight list of `id`, `code`, `name` (no pagination). | `masters.<module>.view` |
| **POST** | `/api/v1/<masters>/import` | Import batch records via CSV or JSON. | `masters.<module>.import` |
| **GET** | `/api/v1/<masters>/export` | Stream full list filtered as CSV/JSON. | `masters.<module>.export` |

---

## 2. Standardized Request Parameters

### List & Filtering Parameters (GET `/api/v1/<masters>`)
All list requests support the following standardized query parameters:

```json
{
  "page": "number (default: 1) - The target page of results",
  "per_page": "number (default: 50) - Records per page (max limit: 100)",
  "search": "string - Case-insensitive partial matches against code, name, and symbols",
  "is_active": "boolean - Filter explicitly by true/false status",
  "active_only": "boolean - Shortcut helper to retrieve only active records",
  "sort_by": "string - Database column name (default: display_order)",
  "sort_order": "string (ASC | DESC, default: ASC)",
  "country_code": "string - Filter by geographic country bounds",
  "state_code": "string - Filter by regional state bounds"
}
```

---

## 3. Standardized Response Formats

### Paginated List Envelope
```json
{
  "data": [
    {
      "id": "e2f1db56-2b47-4952-ba4a-ef7108922129",
      "code": "SQFT",
      "name": "Square Feet",
      "display_name": "Sq. Ft.",
      "symbol": "sqft",
      "conversion_factor": 1.0,
      "is_active": true,
      "display_order": 1,
      "created_at": "2026-07-20T09:00:00Z",
      "updated_at": "2026-07-20T09:00:00Z"
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "per_page": 50,
    "last_page": 1
  }
}
```

### Single Entity Envelope
```json
{
  "data": {
    "id": "e2f1db56-2b47-4952-ba4a-ef7108922129",
    "code": "SQFT",
    "name": "Square Feet",
    "display_name": "Sq. Ft.",
    "symbol": "sqft",
    "conversion_factor": 1.0,
    "is_active": true,
    "display_order": 1,
    "created_at": "2026-07-20T09:00:00Z",
    "updated_at": "2026-07-20T09:00:00Z"
  }
}
```

### Error Response Envelope
```json
{
  "error": "Validation Error: Unique code SQFT is already registered.",
  "code": "DUPLICATE_CODE",
  "details": {
    "field": "code",
    "value": "SQFT"
  }
}
```

---

## 4. API Core Coding Rules
1.  **Strict Transaction Management**: Write operations (POST, PUT, DELETE) must run inside database transactions to ensure that audit logging, state updates, and dependency validations succeed or fail as a single unit.
2.  **No Exposed Internal Queries**: Controllers must utilize the query sanitizers in the validation engine to verify sort columns against a hardcoded whitelist, completely eliminating SQL injection vectors.
3.  **Audit Integration**: Every write operation must asynchronously dispatch a structured event log to the central `AuditLogService` before completing the response.
