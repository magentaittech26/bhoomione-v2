# BhoomiOne V2 – Tenant Reset & Fresh Provision Verification Guide

This guide describes how to safely reset/clean up stale or demo tenant records and verify a fresh tenant provisioning flow.

---

## 1. Safety Best Practices & Safeguards
Before performing any database resets, adhere to the following safety precautions:

- **Backup First**: Always capture a fresh database backup before running any destructive command on staging or production environments.
  ```bash
  # Example pg_dump command
  pg_dump -h <db_host> -U <db_user> -d <db_name> -F c -b -v -f bhoomione_backup_$(date +%F).dump
  ```
- **Dry-Run Option**: Always run the reset command with `--dry-run` first to preview exactly what records will be deleted.
- **Do NOT blind-wipe production**: The reset command refuses to run on production/active tenants unless the tenant code contains demo/test keywords, or the `--force-demo` flag is explicitly supplied.
- **Do NOT run full `db:seed` on staging**: Wiping the whole database and running a full seeder will destroy live tenant mappings. Use the target reset command instead of a full database seed.

---

## 2. Demolition and Reset of Demo/Stale Tenant
To completely purge a demo or stale tenant and all its associated data (domains, users, projects, layouts, plots, DXFs, SVGs, subscriptions, limit overrides, and logs) in an FK-safe order:

### A. Preview Deletions (Dry-Run Mode)
```bash
php artisan tenant:reset-demo {tenant_code} --dry-run
```
*Example:*
```bash
php artisan tenant:reset-demo demo-bhoomi --dry-run
```

### B. Execute Clean-Up (Destructive Reset)
```bash
php artisan tenant:reset-demo {tenant_code}
```
*Example (for demo-coded tenants):*
```bash
php artisan tenant:reset-demo demo-bhoomi
```

### C. Reset Non-Demo Name Tenant (Requires Force Flag)
If the tenant does not have `demo`, `test`, `alpha`, `beta`, or `preview` in its code/tier, but is stale and safe to reset:
```bash
php artisan tenant:reset-demo active-client --force-demo
```

---

## 3. Fresh Provisioning Flow (Step-by-Step)
To provision a brand new tenant after reset:

1. **Log in to the Admin UI**: Access the main Platform Admin Console.
2. **Navigate to Tenant Management**: Click on **Provision New Tenant**.
3. **Fill in Tenant Metadata**:
   - **Tenant Code**: e.g., `client-alpha` (this will define the workspace subdomain).
   - **Company Name**: e.g., `Alpha Lands Developers`.
   - **Infrastructure Tier**: `SHARED` or `DEDICATED`.
   - **Domain Mapping**: `client-alpha.bhoomione.in`.
4. **Assign Subscription Plan**: Choose the appropriate plan (e.g. Starter, Growth, Professional).
5. **DNS Wildcard Requirement**:
   To ensure the resolved workspace resolves dynamically without manual DNS entries, wildcard DNS must be configured at the root domain provider level:
   ```dns
   *.bhoomione.in.        IN  A      <LB_OR_GATEWAY_IP>
   *.staging.bhoomione.in. IN  A      <LB_OR_GATEWAY_IP>
   ```
6. **Submit Provisioning**: The Tenant Provisioning Service will initialize the tenant records, primary domain mapping, subscription limits, and initial trial contracts.

---

## 4. Fresh Provisioning Verification Engine
To verify that the new tenant has been provisioned correctly, is fully functional, and maps correctly through the routing domain resolution middleware, run the verification command:

```bash
php artisan tenant:verify-provisioning {tenant_code}
```

### What this command verifies:
- **Tenant Registry**: Asserts the parent tenant record is registered with correct status and tier.
- **Primary Domain**: Asserts that a valid primary domain is registered.
- **Contract & Subscription**: Asserts that active SaaS subscription limits and features exist.
- **Active Workspace Users**: Asserts that at least one user is mapped to the workspace.
- **Dynamic Resolution**: Simulates requests to verify that the domain name correctly resolves to the tenant context in `TenantResolverMiddleware` logic.
- **X-Tenant-ID Exemption**: Asserts that no `X-Tenant-ID` header is required for login or API access when accessing the tenant through its workspace domain (e.g. `client-alpha.bhoomione.in`).

---
