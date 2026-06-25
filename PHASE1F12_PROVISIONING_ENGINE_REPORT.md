# BhoomiOne SaaS - Phase 1F.12 Zero-Touch Provisioning Engine Report

This report summarizes the design, architecture, and integration of the **Zero-Touch Tenant Provisioning Engine** implemented across the React SPA, Laravel API, and PostgreSQL layers.

---

## 1. Architectural Overview

The engine automates the entire workspace lifecycle from plan purchase/initialization to deployment of isolated spaces.

```
React Admin Portal/Registration
           │
           ▼
Laravel TenantProvisioningService (Database-Driven Pipeline)
           │
           ├─► Validate Tenant Parameters & DNS availability
           ├─► Create Tenant Record & Subordinated Databases
           ├─► Initialize Tenant Roles & Permission Matrices
           ├─► Apply Subscription Plan Features & Runtime Limits
           ├─► Seed Default Modules, Layout Templates, & Demo Data
           │
           ▼
SubscriptionEnforcementEngine (Enforcement Checks)
```

---

## 2. Dynamic Workflow Pipeline Steps

Each provisioning pipeline runs sequentially and updates its live `current_step` and `progress_percent` in the `tenant_provisioning_jobs` database ledger:

1. **Pending**: Enqueued in pipeline, awaiting resources.
2. **Validating**: Strict alphanumeric code validation, DNS host checking, template presence verification.
3. **Creating Workspace**: Allocating space namespaces, setting up isolated schema tracking descriptors.
4. **Creating Database Records**: Writing Postgres records for tenants and linked sub-systems.
5. **Creating Default Roles**: Creating tenant roles (Super Admin, Project Manager, Field Surveyor, Back Office, Customer Tenant).
6. **Creating Permissions**: Generating complete security scopes tailored to the tenant tier.
7. **Creating Plan**: Generating subscription logs and setting billing rates.
8. **Applying Features**: Creating active feature lists matching the subscriber tier.
9. **Applying Limits**: Establishing precise system thresholds (Maximum active users, maximum layout sheets, maximum surveyor devices).
10. **Installing Default Modules**: Deploying modules (GIS Maps, Land Ledger, Payments, Expense Book, Surveying Sync).
11. **Creating Administrator**: Instantiating the primary tenant administrator account with encrypted credentials.
12. **Generating Demo Data** (Optional): Deploying dummy projects, layouts, sample plot listings, and simulated booking receipts.
13. **Completed**: Final health verify checklist complete, workspace fully operational.

---

## 3. Rollback & Consistency Engine

If any step in the pipeline throws an exception, the system enters the **Rollback Engine**:
- Executes cleanup in the reverse order of allocation to avoid foreign key violations.
- Deletes created users, subscription logs, feature matrices, limits records, layouts, and workspace mappings.
- Maintains database consistency; no orphaned records remain.
- Writes a detailed, unalterable error status to the `tenant_provisioning_jobs` ledger, along with the stack trace for admin diagnosis.

---

## 4. Admin Live Dashboard Controls

Administrative users can manage active jobs from the Admin Console:
- **Live Progress**: Dynamic progress bars showing current step name and progress percentage.
- **Retry**: Re-runs a failed job from the beginning, clearing previous fail states.
- **Resume**: Restarts a stalled/failed pipeline directly from its last successful step, reducing overhead on high-density environments.
- **Cancel**: Terminates any pending or active job safely and starts a clean rollback.
