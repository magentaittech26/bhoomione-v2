# Measurement Unit Data Migration Specification

## Migration Architecture
- **Phase 1**: Run database schema migration (`2026_07_22_000001_ensure_measurement_units_columns` and `2026_07_22_000002_create_tenant_measurement_unit_settings_table`).
- **Phase 2**: Classify global system standards vs tenant custom units via `php artisan measurement-units:migrate-tenancy`.
- **Phase 3**: Backfill tenant settings across all existing tenants via `php artisan modules:sync-core` or `php artisan tenants:backfill-core-modules`.
- **Phase 4**: Perform data integrity audit via `php artisan measurement-units:audit`.
