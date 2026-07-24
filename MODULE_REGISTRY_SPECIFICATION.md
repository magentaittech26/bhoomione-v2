# BhoomiOne V3 — Core Module Registry Specification

## Specification Matrix
The `SaasModule` database registry table (`saas_modules`) and `CoreModuleRegistry` discovery engine maintain metadata for all system modules.

### Registry Fields & Attributes

| Field Name | Type | Description |
|---|---|---|
| `code` | string | Unique module identifier (e.g. `core.mdm.measurement_units`). |
| `name` | string | Human-readable title (e.g. `Measurement Units`). |
| `category` | string | Functional category (e.g. `Master Data Management`). |
| `is_core` | boolean | `true` for mandatory platform infrastructure; `false` for optional add-ons. |
| `is_required` | boolean | `true` if every tenant must be provisioned with this module. |
| `default_enabled` | boolean | `true` if enabled by default upon tenant creation. |
| `billing_required` | boolean | `false` for free core MDM modules; `true` for paid commercial modules. |
| `subscription_required` | boolean | `false` for core MDM modules. |
| `tenant_can_disable` | boolean | `false` for core MDM modules (tenant admin cannot opt out). |
| `version` | string | Semantic module version (e.g. `3.0.0`). |
| `minimum_platform_version` | string | Minimum required core SaaS platform version. |
| `current_schema_version` | string | Associated DB migration schema timestamp. |
| `is_active` | boolean | Administrative active state. |
| `display_order` | integer | UI sorting order in Master Data menus. |
| `dependencies` | array | Array of prerequisite module codes. |
