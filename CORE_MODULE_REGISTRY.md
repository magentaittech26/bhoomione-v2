# BhoomiOne V3 — Core SaaS Module Registry

## Registered Core Modules

| Module Code | Module Name | Group | Core Status | Billable | Can Tenant Disable | Description |
|---|---|---|---|---|---|---|
| `core.mdm.measurement_units` | Measurement Units | Master Data Management | Core | No | No | Mandatory MDM module for land measurement units and conversion standards |
| `PROJECTS` | Projects Module | Core Development | Core | Yes | No | Real estate development project registration & RERA tracking |
| `LAYOUTS` | Layouts Module | Core Development | Core | Yes | No | Layout mapping, plotting, sector configuration and geographic planning |
| `PLOTS` | Plots Parser | Core Development | Core | Yes | No | Plot bounds modeling, dimensions scaling and status assignment |

## Automated Auto-Provisioning & Backfill
- **New Tenant Auto-Assignment**: Automatically linked during tenant provisioning pipeline.
- **Existing Tenant Backfill Command**: `php artisan modules:sync-core` or `php artisan tenants:backfill-core-modules`.
