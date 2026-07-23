# Measurement Unit Default Resolution Hierarchy

## Resolution Cascade
When resolving the active measurement unit for land calculations (Projects, Layouts, Plots):

1. **Project Override**: If `Project.measurement_unit_id` is explicitly assigned, use this unit.
2. **Tenant Default**: Check `tenant_measurement_unit_settings` where `is_default = true` for the requested measurement type (`Area` or `Length`).
3. **Platform Regional Default**: Check `measurement_units` where `is_system = true` and `is_default = true` for the measurement type.
4. **System Fallback**: Standard system unit code `SQFT` (for Area) or `M` (for Length).

## Implementation Reference
Implemented in `App\Services\MeasurementUnitService::resolveDefaultUnit($projectId, $tenantId, $measurementType)`.
