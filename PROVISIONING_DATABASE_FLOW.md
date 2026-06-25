# BhoomiOne Provisioning Database Flow

This document charts the data flow and relational models created, modified, or verified by the Zero-Touch Tenant Provisioning Engine inside our PostgreSQL database instance.

---

## 1. Relational Entity Relationship Flow

When a new workspace provisioning job begins execution, the following tables are populated sequentially or referenced for limits mapping:

```
                  ┌───────────────────────────────┐
                  │    workspace_templates        │ (Reads template schema)
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │    tenant_provisioning_jobs   │ (Tracks active progress)
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │            tenants            │ (Registers isolated tenant)
                  └───────────────┬───────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ tenant_domains  │      │  subscriptions  │      │   tenant_users  │
└─────────────────┘      └────────┬────────┘      └─────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   sub_limits    │ (Enforces runtime limits)
                         └─────────────────┘
```

---

## 2. Table Schemas involved in Provisioning

### A. `tenant_provisioning_jobs` (Pipeline Jobs Ledger)
Tracks active pipeline operations and logs failures/durations:
- `id` (UUID, Primary Key)
- `tenant_code` (VARCHAR, Unique, alphanumeric subdomain)
- `tenant_name` (VARCHAR, Workspace descriptive name)
- `job_type` (VARCHAR, e.g. `"PROVISION_WORKSPACE"`)
- `status` (VARCHAR, e.g. `"PENDING"`, `"PROCESSING"`, `"SUCCESS"`, `"FAILED"`, `"CANCELLED"`)
- `current_step` (VARCHAR, Active step descriptor, e.g. `"Creating Permissions"`)
- `progress_percent` (INTEGER, current progress meter)
- `duration_seconds` (INTEGER, total runtime tracking)
- `retry_count` (INTEGER, increments on retry, max 3)
- `error_message` (TEXT, stores stack trace or rollback notes)

### B. `workspace_templates` (Workspace Pre-configurations)
Contains profiles for automated setups:
- `id` (UUID, Primary Key)
- `code` (VARCHAR, Unique code e.g. `"starter"`, `"growth"`, `"professional"`)
- `name` (VARCHAR, e.g. `"Smart Growth Pack"`)
- `description` (TEXT)
- `default_modules` (JSON, array of enabled modules)
- `default_limits` (JSON, threshold specifications)

### C. `subscription_limits` (Runtime Threshold Matrix)
Populated automatically by `SubscriptionEnforcementEngine` upon plan assigning:
- `id` (UUID, Primary key)
- `tenant_id` (UUID, foreign key linked to `tenants`)
- `max_projects` (INTEGER, e.g. `5` for Starter, `50` for Professional)
- `max_layout_sheets` (INTEGER, maximum geo-referenced DXF bounds)
- `max_users` (INTEGER, maximum employee seating capacity)
- `max_surveyor_devices` (INTEGER, active mobile logins)
- `features_json` (JSONB, active permissions toggles)

---

## 3. Post-Provisioning Enforcement

Immediately after provisioning, any operation in the tenant's workspace is audited using the `SubscriptionEnforcementEngine`:
- **Member Invitations**: Audits `tenant_users` row count against `sub_limits.max_users`.
- **DXF Parsing**: Audits layouts count in the database schema against `sub_limits.max_layout_sheets`.
- **Project Initializations**: Checks `projects` tables against `sub_limits.max_projects`.
- **Feature Restrictions**: Checks active controllers against `sub_limits.features_json` toggles before enabling operational routes.
