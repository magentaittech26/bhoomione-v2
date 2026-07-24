# BhoomiOne V3 — Generalized Core Module Framework Specification

## Executive Summary
The **Core Module Framework** in BhoomiOne V3 establishes a standardized, contract-driven architecture for all mandatory Master Data Management (MDM) and core functional modules across the multi-tenant SaaS platform.

Measurement Units (`core.mdm.measurement_units`) serves as the foundational reference provider implementation. Every future core module (e.g. Countries, States, Districts, Taluks, Villages, Currencies, Tax Types, Amenity Types, Road Types, Plot Types, Document Types, Approval Authorities) automatically reuses this exact framework without special-case architectural hacks.

---

## Architecture Stack

```
┌─────────────────────────────────────────────────────────┐
│                  CoreModuleRegistry                     │
│    (Central Discovery, Registration & RBAC Manager)     │
└────────────────────────────┬────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌────────────────────────┐       ┌────────────────────────┐
│MeasurementUnitProvider │       │ LocationMasterProvider │
│ (Ref Implementation)   │       │   (Future MDM Module)  │
└───────────┬────────────┘       └───────────┬────────────┘
            │                                 │
            ▼                                 ▼
┌────────────────────────┐       ┌────────────────────────┐
│ Platform Master Table  │       │ Platform Master Table  │
│  (`measurement_units`) │       │      (`locations`)     │
└───────────┬────────────┘       └───────────┬────────────┘
            │                                 │
            ▼                                 ▼
┌────────────────────────┐       ┌────────────────────────┐
│ Tenant Settings Table  │       │ Tenant Settings Table  │
│(`tenant_unit_settings`)│       │ (`tenant_loc_settings`)│
└────────────────────────┘       └────────────────────────┘
```

---

## Architectural Principles

1. **Non-Billable & Non-Disableable**: Core modules are mandatory for real estate operations (`is_core = true`, `tenant_can_disable = false`, `billing_required = false`).
2. **Platform & Tenant Isolation**: Global master definitions (conversion factors, geographic codes, system standard rules) are stored in platform master tables and edited only by Platform Admins. Tenant configuration (display preferences, custom labels, local visibility, default choices) is stored in tenant-isolated settings tables.
3. **Provider Contract Compliance**: Every core module implements `App\Contracts\CoreModuleProviderInterface`.
4. **Automated Tenant Provisioning**: Tenant creation automatically discovers all registered core providers and invokes `provisionTenant()`.
5. **Idempotent Backfill & Sync**: Artisan commands (`php artisan modules:sync-core`, `php artisan tenants:backfill-core-modules`) run safely in production and CI/CD pipelines with dry-run support.
