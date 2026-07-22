# Laravel API Migration Matrix

This matrix maps temporary Express endpoints to their authoritative, production-grade Laravel 12 equivalents, specifying the required validation rules, database persistence constraints, and response shapes.

---

## 1. Route Mapping and Permission Matrix

| Express Endpoint | Laravel Endpoint | HTTP Method | Required Permission | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/measurement-units` | `GET /api/v1/measurement-units` | GET | `masters.measurement_units.view` | Retrieves paginated list of measurement units with search and sort params. |
| `GET /api/v1/measurement-units/lookup` | `GET /api/v1/measurement-units/lookup` | GET | *Authenticated* (No explicit permission) | Active permitted units lookup for project dropdowns. |
| `GET /api/v1/measurement-units/:id` | `GET /api/v1/measurement-units/{id}` | GET | `masters.measurement_units.view` | Retrieves details of a specific measurement unit. |
| `POST /api/v1/measurement-units` | `POST /api/v1/measurement-units` | POST | `masters.measurement_units.create` | Creates a new measurement unit. Norms code to uppercase. |
| `PUT /api/v1/measurement-units/:id` | `PUT /api/v1/measurement-units/{id}` | PUT | `masters.measurement_units.edit` | Modifies an existing measurement unit. |
| `N/A` | `PATCH /api/v1/measurement-units/{id}/toggle` | PATCH | `masters.measurement_units.activate` | Toggles active status of a measurement unit. |
| `DELETE /api/v1/measurement-units/:id` | `DELETE /api/v1/measurement-units/{id}` | DELETE | `masters.measurement_units.delete` | Soft deletes measurement unit (sets `deleted_at`). |

---

## 2. Validation & Parameter Contract

Laravel handles payload validation via standard Form Requests (`StoreMeasurementUnitRequest` and `UpdateMeasurementUnitRequest`). On failure, a `422 Unprocessable Entity` is returned with field-level error messages in a standard JSON format.

### Validation Rules
1. **`code`**: Required (on Store), unique, normalization to uppercase, maximum 50 characters.
2. **`name`**: Required, maximum 255 characters.
3. **`measurement_type`**: Required, must match `Area` or other valid system types, maximum 100 characters.
4. **`conversion_factor`**: Required, numeric, greater than zero. Automatically synchronized to `conversion_to_sqft`.
5. **`precision`**: Optional, integer, must be between 0 and 6 (inclusive).
6. **`decimal_places`**: Optional, integer, must be between 0 and 6 (inclusive).
7. **`display_order`**: Optional, integer format.
8. **`country_code` / `state_code`**: Optional strings, maximum 10 characters.
9. **`is_system` / `is_default`**: Optional booleans. Platform-wide flags are protected. Non-platform roles receive a `403 Forbidden` response if they attempt to modify these flags.

---

## 3. SQL Engine and Eloquent Mapping Comparison

### A. Raw PostgreSQL Query (Temporary Node Express)
```sql
-- Create unit
INSERT INTO measurement_units (
    id, uuid, code, name, display_name, symbol, short_code, measurement_type,
    conversion_factor, conversion_to_sqft, base_unit, precision, decimal_places,
    display_order, is_metric, is_default, is_system, is_active,
    country_code, state_code, tenant_override_allowed, description
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
RETURNING *;
```

### B. Authoritative Eloquent Code (Production Laravel)
```php
// In MeasurementUnitService.php inside DB::transaction:
if ($isDefault) {
    MeasurementUnit::where('measurement_type', $measurementType)
        ->update(['is_default' => false]);
}

$unit = MeasurementUnit::create([
    'id' => $id,
    'uuid' => $id,
    'code' => strtoupper(trim($data['code'])),
    'name' => trim($data['name']),
    'display_name' => trim($data['display_name'] ?? $data['name']),
    'symbol' => $data['symbol'] ?? null,
    'short_code' => $data['short_code'] ?? strtoupper(trim($data['code'])),
    'measurement_type' => $data['measurement_type'],
    'conversion_factor' => $data['conversion_factor'],
    'conversion_to_sqft' => $data['conversion_factor'],
    'precision' => $data['precision'] ?? 2,
    'decimal_places' => $data['decimal_places'] ?? 2,
    'display_order' => $data['display_order'] ?? 0,
    ...
]);
```
---

## 4. Response Structures Comparison

### Success Response Format
Both Express and Laravel return consistent top-level `success` and wrapped `data` structures to ensure seamless frontend compatibility.

```json
{
  "success": true,
  "data": {
    "id": "76498bf5-f1bf-4b95-a46c-e6cf049e6f3b",
    "code": "SQFT",
    "name": "Square Feet",
    "conversion_factor": "1.00000000",
    "is_active": true,
    "is_default": true,
    ...
  }
}
```
