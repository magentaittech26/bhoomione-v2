# BhoomiOne V3 — Core Module Lifecycle Engine

## Lifecycle Stages

Every core SaaS module undergoes a controlled 5-stage lifecycle:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  1. REGISTER │────►│2. PROVISION  │────►│ 3. CONFIGURE │────►│  4. CONSUME  │────►│   5. AUDIT   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

1. **Register**: Registered in `saas_modules` and provider registry via `CoreModuleRegistry::syncDatabaseRegistry()`.
2. **Provision**: Linked to new and existing tenants via `CoreModuleRegistry::provisionTenant()`.
3. **Configure**: Tenant Admins customize local display labels, symbols, precision, and default records without altering platform master conversion factors.
4. **Consume**: Downstream domain entities (Projects, Layouts, Maps, Plots, Invoices) query the Operational Lookup engine (`GET /api/v1/tenant/{module}/lookup`).
5. **Audit**: Continuous health checks and data integrity validation via `php artisan measurement-units:audit` and `CoreModuleRegistry::auditAll()`.
