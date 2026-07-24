# BhoomiOne V3 — Tenant Provisioning Engine Specification

## Automated Onboarding Workflow

When a new tenant is created via the SaaS Control Panel or Tenant Self-Service API:

```
[ New Tenant Registration Request ]
               │
               ▼
   1. Create Tenant Record (`tenants`)
               │
               ▼
   2. CoreModuleRegistry::provisionTenant($tenant)
               │
               ├─► Discover all registered Core Module Providers
               │
               ├─► For each provider:
               │      ├─► Assign core module subscription row
               │      ├─► Seed tenant-specific settings table
               │      ├─► Set system default selections (e.g. Area=SQFT, Length=M)
               │      └─► Write audit log entry
               │
               ▼
   3. Seed Default Role & Permission Bindings
               │
               ▼
   4. Finalize Onboarding & Fire Event
```

## Transactional Isolation
- All provisioning steps execute within a database transaction.
- Failures roll back completely without leaving partial tenant states.
- Idempotent re-execution (`provisionTenant`) checks existing setting IDs before inserting.
