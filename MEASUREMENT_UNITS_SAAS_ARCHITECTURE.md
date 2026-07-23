# BhoomiOne V3 — Measurement Units Core SaaS Architecture

## Overview
Measurement Units in BhoomiOne V3 represent a mandatory core Master Data Management (MDM) module (`core.mdm.measurement_units`). It provides standardized land area and length measurement unit conversions across multi-tenant real estate projects, layouts, maps, and plots.

## Structural Boundaries & Multi-Tenancy Architecture
1. **Central Platform Master Registry (`measurement_units`)**:
   - Stores immutable platform standard units (e.g., Square Feet, Square Meters, Acres, Guntas, Cents, Hectares, Meters, Feet).
   - Maintained exclusively by Platform Administrators via `/api/v1/platform/measurement-units`.
   - Contains global conversion factors relative to standard base units (SQFT for Area, Meters for Length).

2. **Tenant Configuration Layer (`tenant_measurement_unit_settings`)**:
   - Stores tenant-isolated display preferences, custom labels, custom symbols, display precision, display order, and default preferences per measurement type.
   - Maintained by Tenant Administrators via `/api/v1/tenant/measurement-units`.
   - Prevents tenant administrators from mutating global conversion factors or revoking standard units for other tenants.

3. **Core Module Characteristics**:
   - **Code**: `core.mdm.measurement_units`
   - **is_core**: `true`
   - **is_billable**: `false`
   - **tenant_can_disable**: `false`
   - **subscription_required**: `false`
