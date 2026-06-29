# BhoomiOne V2 – Platform Metadata Stabilization Sprint Report

## Objective
The goal of this sprint was to stabilize the platform metadata architecture by resolving foreign key violations and preventing the regeneration/modification of immutable records (especially UUIDs) in the Master Data seeders.

---

## 1. Audited Master Tables
The following Master tables were audited to verify that no ID regeneration or foreign key orphaning occurs:
*   `saas_modules` (Business Key: `code`, Primary Key: `id` [UUID])
*   `saas_features` (Business Key: `code`, Primary Key: `id` [UUID], Foreign Key: `module_id`)
*   `subscription_plans` (Business Key: `plan_code`, Primary Key: `id` [UUID])
*   `subscription_plan_features` (Composite Keys: `plan_id` + `feature_id`, Primary Key: `id` [UUID])
*   `subscription_plan_limits` (Composite Keys: `plan_id` + `limit_key`, Primary Key: `id` [UUID])
*   `subscription_addons` (Business Key: `code`, Primary Key: `id` [UUID])
*   `subscription_plot_slabs` (Composite Keys: `min_plots` + `max_plots`, Primary Key: `id` [UUID])
*   `saas_platform_settings` (Business Key: `setting_key`, Primary Key: `id` [UUID])

---

## 2. Seeders Fixed & Audited
We modified and optimized the core seeders responsible for master metadata setup:
1.  **`SaasSubscriptionSeeder.php`**: Replaced all unsafe `updateOrCreate` calls with a clean, idempotent `safeSeedComposite` helper. This stops updating primary key columns or regenerations.
2.  **`SaasPlatformSettingsSeeder.php`**: Introduced the `safeSeedComposite` helper to prevent regeneration of setting UUIDs and avoid mutating the immutable `id` column.

---

## 3. Resolved FK & ID Regeneration Issues
### The Root Cause
Previously, seeders utilized `updateOrCreate` by specifying `'id' => Model::where(...)->value('id') ?? Str::uuid()` in the update parameters array. In Laravel Eloquent, passing primary keys inside the update parameters results in SQL queries that update the primary key column (e.g. `UPDATE saas_modules SET id = '...' ...`).
In PostgreSQL, updating primary key columns (even to the same value) evaluates referenced rows and can throw foreign key violation exceptions (such as `saas_features.module_id_foreign`) when those primary keys are already referenced.

### The Fix
The new pattern employs `safeSeedComposite` which:
1.  First searches for an existing record matching the natural business lookup keys (e.g., `code` or `plan_code`).
2.  If the record **already exists**, it fills and updates **only the mutable attributes** (e.g., names, descriptions, pricing, limits). It **never** sends the primary key `id` or the business key inside the update payload, nor does it generate new UUIDs.
3.  If the record **does not exist**, it assigns a fresh UUID and performs a clean insert.

---

## 4. Validation Results & Build Status
*   **Database Migrations & Safety**: All operations are entirely non-destructive. No tables, constraints, or schemas were dropped or recreated.
*   **React App Build**: Compiled successfully.
*   **TypeScript / React Linter**: Passed with 0 errors.
