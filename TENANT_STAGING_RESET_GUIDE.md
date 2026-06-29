# BhoomiOne V2 – Complete Tenant Data Reset Tool for Staging

This guide provides operational documentation for completely and safely purging tenant-related information from the Staging database to perform fresh end-to-end tenant provisioning checks.

---

## ⚠️ CRITICAL SAFETY RULES & GUARDRAILS

* **Environment Gating**: The reset command **only** executes if `APP_ENV` is set to `staging`, `local`, or `testing`. It will immediately refuse to run in any other environment (e.g., `production`).
* **Double Confirmation Requirement**: A destructive reset cannot be triggered interactively. You must explicitly supply the `--confirm=RESET-STAGING-TENANTS` argument.
* **Preservation of Core Configurations**:
  * Does **NOT** delete Platform Super Admins.
  * Does **NOT** delete global parameters or SaaS platform settings.
  * Does **NOT** delete SaaS subscription plans, features, modules, or plot slabs.
  * Does **NOT** delete platform-level audit logs (where `tenant_id` is null).
* **Database Transactions**: All deletions run in a single atomic database transaction. If any foreign-key or reference failure occurs, the entire operation is rolled back with zero side effects.

---

## 1. BACKUP COMMAND (PRIOR TO RESET)

Before performing any destructive DB resets, it is best practice to take a backup of your PostgreSQL schema and data.

Run the following command in your server environment:

```bash
pg_dump -h localhost -U bhoomione_db_user -d bhoomione_staging_db -F c -b -v -f /tmp/bhoomione_staging_backup_$(date +%F).dump
```

---

## 2. DRY-RUN COMMAND

This command safely performs a read-only count of the database records that will be deleted, group-by-group and table-by-table. No database changes are written.

```bash
php artisan tenant:reset-all-staging-tenants --dry-run
```

---

## 3. CONFIRMED DESTRUCTIVE RESET

To wipe all staging tenants, their spatial maps, CAD drawings, leads, domains, and tenant-scoped users, execute:

```bash
php artisan tenant:reset-all-staging-tenants --confirm=RESET-STAGING-TENANTS
```

---

## 4. FRESH TENANT PROVISIONING STEPS FROM SAAS ADMIN

After running the reset command, follow these steps to provision a fresh, clean tenant workspace:

1. **Log in to SaaS Admin**: Connect to the centralized SaaS Admin dashboard using a Platform Super Admin account.
2. **Navigate to Tenants Tab**: Open the SaaS tenant management directory.
3. **Trigger Provisioning Wizard**: Click **Create Tenant** or **Provision New Tenant**.
4. **Enter Tenant Metadata**:
   * **Tenant Code**: E.g., `omega` (this will serve as the subdomain, `omega.localhost` or `omega.bhoomione.in`).
   * **Company Name**: E.g., `Omega Infrastructures`.
   * **Email Address**: Enter the tenant administrator's email.
   * **Infrastructure Tier**: Select `DEVELOPER`, `TRIAL`, or `ENTERPRISE`.
5. **Select Subscription Plan**: Select the SaaS module plan and pricing options.
6. **Submit Provisioning Request**: The background job maps subdomains, allocates default layouts/modules, registers subscription limits, and invites the tenant admin.

---

## 5. DNS WILDCARD REQUIREMENT

For multiple subdomains to resolve dynamically to your staging container/ingress controller, you must configure a DNS Wildcard record:

* **DNS Record**: `*.bhoomione.in` (pointing to the ingress/load-balancer IP).
* **Local Development Alternative**: Configure `/etc/hosts` or use a wildcard resolver like `dnsmasq` mapping `*.localhost` to `127.0.0.1`.

---

## 6. VERIFICATION COMMANDS

To ensure provisioning is successful, resolve subdomains correctly, and verify middleware is functional, run:

```bash
# Replace 'omega' with your newly created tenant code
php artisan tenant:verify-provisioning omega
```

To list available commands:

```bash
php artisan list | grep tenant
```

---

## 7. WARNING: NEVER RUN FULL DB:SEED ON STAGING

Do **NOT** run standard or production seeds on an active staging database after resetting, as this will recreate static dummy entries or overwrite production-aligned plans and module profiles.

Always rely on the **SaaS Admin Panel UI** or individual migrations/commands to add fresh production-grade metadata.

---

## 8. ROLLBACK GUIDANCE

If the reset command was executed but you need to restore the state back to the previous backup snapshot:

1. **Drop and Recreate DB**:
   ```bash
   dropdb -h localhost -U bhoomione_db_user bhoomione_staging_db
   createdb -h localhost -U bhoomione_db_user bhoomione_staging_db
   ```
2. **Restore PostgreSQL Dump File**:
   ```bash
   pg_restore -v -h localhost -U bhoomione_db_user -d bhoomione_staging_db /tmp/bhoomione_staging_backup_<date>.dump
   ```
