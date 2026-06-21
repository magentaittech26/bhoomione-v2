# Phase 2A — Tenant Projects Management Deployment Playbook

This playbook outlines instructions for deploying, verifying, and rollback configurations for the **Phase 2A Tenant Projects Management Foundation** rollout.

---

## 1. Rollout Procedure (Step-by-Step)

### Step 1: Pre-Deployment Verification
Before commencing git merge, check current build stability on local development environments:
```bash
# Run lint check
npm run lint

# Compile production bundles
npm run build
```
Verify that the output reports **zero compilation or syntax errors**.

### Step 2: Code Deploy
Merge verified branch into master or target staging/production environment branch.
Upload the compiled static React bundles and updated server PHP codes to the runner containers.

### Step 3: Database & Cache Warming (On Server Instance)
Since no migration updates are introduced, no table modifications are processed. Log into the web runner container shell and refresh Laravel route catalogs:
```bash
# Clear all cached configs to match updated routes
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# Warmup router catalogs
php artisan route:cache
```

---

## 2. Post-Deployment Smoke Test Procedures

Complete these manual steps to confirm zero-downtime, fully operational status:

### Test Scenario A: Authentication & Environment Verification
1. Open the BhoomiOne platform login panel.
2. Sign in using administrative Tenant credentials.
3. Confirm that the application redirects smoothly to the Dashboard without interface flickers.

### Test Scenario B: Project List Verification
1. Click on the **Inventory Management** sidebar or active tab.
2. Switch to the **Projects** sub-header.
3. Verify that the table emits an active `GET` request on `/api/v1/projects` which resolves within `< 300ms`.
4. Confirm details: Name, Location, Status, and calculated Layouts/Plots count tags are displayed.

### Test Scenario C: Project Creation Validation
1. Click the **Create Project** CTA.
2. Input placeholder values:
   * Name: `Phoenix Gateway`
   * Code: `PHX-GT`
   * Developer Name: `Phoenix Builders`
   * Location: `East Bangalore`
   * Total Area: `45` (stored safely inside JSONB meta-dictionary)
3. Click **Save Project**.
4. Confirm that:
   * The modal closes instantly.
   * A success notification appears in the dashboard panel.
   * The new project row represents immediate integration into the active datagrid list.

### Test Scenario D: Multi-Tenant Data Isolation Audit
1. Open an independent private browsing session.
2. Sign in as user belonging to **Tenant B** (different workspace context).
3. Open the **Projects** tab.
4. Confirm that `Phoenix Gateway` (cataloged under Tenant A) is completely hidden, verifying active multi-tenant SQL segmentation rules.

---

## 3. Rollback Playbook (Recovery Steps)

Should unforeseen critical anomalies or memory leaks occur during live database executions, follow these recovery strategies:

### Step 1: Frontend Restoration
Roll back the active React layout by checking out the previous pre-Phase 2A recovery identifier (e.g. `RECOVERY_POINT_S4` tag):
```bash
# Force fallback to the stable recovery tag
git checkout RECOVERY_POINT_S4 -- src/components/InventoryManager.tsx

# Re-compile applet build properties
npm run build
```

### Step 2: Laravel Core Restorations
Since no schema rewrites occurred during table configurations, standard PHP router code updates can be restored immediately:
```bash
# Revert routing properties inside routes/api
git checkout RECOVERY_POINT_S4 -- backend-api/routes/api.php

# Clear and rebuild cache to drop updated endpoints
php artisan cache:clear
php artisan route:cache
```

No database table drop operations are triggered or required during rollbacks. Security privileges remain fully intact.
