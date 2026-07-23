# Tenant Measurement Units Configuration Guide

## Schema & Isolation Model
Tenant-specific configuration settings for measurement units are decoupled from global system standard definitions using the `tenant_measurement_unit_settings` table.

### Key Configurable Parameters
- `is_enabled`: Controls unit visibility in tenant dropdowns and forms.
- `is_default`: Designates tenant default unit for a measurement type (e.g., Area or Length).
- `display_precision`: Integer precision decimal places for calculation displays.
- `custom_label`: Custom display name localized for tenant workspace.
- `custom_symbol`: Custom localized symbol override.

## API Endpoint Reference
- `GET /api/v1/tenant/measurement-units`: List all available units with merged tenant settings.
- `GET /api/v1/tenant/measurement-units/lookup`: Active & enabled lookup for form dropdowns.
- `PUT /api/v1/tenant/measurement-units/{id}/setting`: Update tenant visibility and display precision.
- `POST /api/v1/tenant/measurement-units/{id}/set-default`: Set tenant default unit for Area/Length.
- `POST /api/v1/tenant/measurement-units/custom`: Create tenant-custom measurement unit.
