# Measurement Unit Tenant Auto-Provisioning

## Automated Workflow
When a new tenant is created or onboarded:

1. System registers core module `core.mdm.measurement_units` in tenant subscription records.
2. `SyncCoreModulesCommand` seeds `tenant_measurement_unit_settings` for all standard active platform units (`SQFT`, `SQM`, `ACR`, `GUN`, `CEN`, `HEC`, `M`, `FT`).
3. Assigns `SQFT` as initial default Area unit and `M` as initial default Length unit for the tenant.
4. Operation is strictly idempotent: re-running does not duplicate existing settings or overwrite custom tenant labels.
