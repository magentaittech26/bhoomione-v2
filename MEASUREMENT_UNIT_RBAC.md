# Measurement Units RBAC & Permission Separation

## Role & Permission Matrix

### Platform SaaS Control Panel Permissions
- `platform.masters.measurement_units.view`: View global master unit definitions.
- `platform.masters.measurement_units.create`: Create global platform standard units.
- `platform.masters.measurement_units.edit`: Edit global conversion factors and system flags.
- `platform.masters.measurement_units.activate`: Toggle platform-wide active status.
- `platform.masters.measurement_units.delete`: Soft delete platform standard units.

### Tenant Workspace Permissions
- `tenant.masters.measurement_units.view`: View workspace measurement unit configuration.
- `tenant.masters.measurement_units.configure`: Toggle enabled status, update display precision/labels.
- `tenant.masters.measurement_units.set_default`: Change tenant default unit.
- `tenant.masters.measurement_units.create_custom`: Create tenant custom units.

## Role Assignments
- **Platform Super Admin / Platform Admin**: Full `platform.masters.*` permissions.
- **Tenant Administrator / Workspace Owner**: Full `tenant.masters.*` permissions.
- **Operational Users (Project Manager, Architect)**: Lookup and view permissions only.
