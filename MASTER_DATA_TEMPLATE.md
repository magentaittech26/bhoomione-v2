# BhoomiOne V3 — Master Data Management (MDM) Standard Template

## Canonical MDM Pattern

Every Master Data module in BhoomiOne V3 follows the identical dual-table architecture, API pattern, and UI layout.

### 1. Database Schema Design

#### Platform Master Table (`{module_plural}`)
- `id` (UUID, Primary Key)
- `code` (string, unique global identifier e.g. `SQFT`, `INR`, `IND`)
- `name` / `display_name` (string)
- `is_system` (boolean, default true for platform standards)
- `is_active` (boolean, default true)
- `sort_order` / `display_order` (integer)
- Global domain properties (e.g. `conversion_factor`, `iso_code`, `tax_rate`)

#### Tenant Settings Table (`tenant_{module_singular}_settings`)
- `id` (UUID, Primary Key)
- `tenant_id` (UUID, Foreign Key to `tenants`)
- `{module_singular}_id` (UUID, Foreign Key to `{module_plural}`)
- `is_enabled` (boolean, default true)
- `is_default` (boolean, default false)
- `display_precision` / `decimal_places_override` (integer)
- `custom_label` (string, nullable)
- `custom_symbol` (string, nullable)
- Unique constraint on (`tenant_id`, `{module_singular}_id`)

---

### 2. Standardized API Routes

#### Platform Management (SaaS Control Panel)
- `GET    /api/v1/platform/{module}`
- `POST   /api/v1/platform/{module}`
- `GET    /api/v1/platform/{module}/{id}`
- `PUT    /api/v1/platform/{module}/{id}`
- `PATCH  /api/v1/platform/{module}/{id}/toggle`
- `DELETE /api/v1/platform/{module}/{id}`

#### Tenant Workspace Configuration
- `GET    /api/v1/tenant/{module}`
- `GET    /api/v1/tenant/{module}/lookup` (Only active & enabled items)
- `PUT    /api/v1/tenant/{module}/{id}/setting`
- `POST   /api/v1/tenant/{module}/{id}/set-default`
- `POST   /api/v1/tenant/{module}/custom`

---

### 3. Standardized RBAC Permissions

#### Platform Admin Permissions
- `platform.masters.{module}.view`
- `platform.masters.{module}.create`
- `platform.masters.{module}.edit`
- `platform.masters.{module}.activate`
- `platform.masters.{module}.delete`

#### Tenant Admin Permissions
- `tenant.masters.{module}.view`
- `tenant.masters.{module}.configure`
- `tenant.masters.{module}.set_default`
- `tenant.masters.{module}.create_custom`
