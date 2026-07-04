# BhoomiOne V1.0 – Production Deployment Verification Playbook

This document outlines the step-by-step procedure required to verify, execute, and validate a production deployment of BhoomiOne V1.0.

---

## Part 1: Infrastructure Deployment Sequence

### 1.1 Source Synchronization
- [ ] **Fetch Latest Commits:** Execute git sync to pull the locked v1.0 tag.
  ```bash
  git fetch --all && git pull origin main
  ```
- [ ] **Verify Head Hash:** Confirm local commit hash matches the remote master branch.
  ```bash
  git rev-parse HEAD
  ```

### 1.2 Container Build Phase
- [ ] **Rebuild Docker Images:** Execute clean builds of both backend API and Nginx reverse proxy containers without using cached layers to ensure dependency integrity.
  ```bash
  docker compose -f docker-compose.staging.yml build --no-cache
  ```
- [ ] **Inspect Build Logs:** Ensure zero errors are thrown during PHP Composer install, Node build, or entrypoint packaging.

### 1.3 Service Orchestration
- [ ] **Restart Containers:** Bring down the old containers cleanly and start the newly compiled services in detached mode.
  ```bash
  docker compose -f docker-compose.staging.yml down
  docker compose -f docker-compose.staging.yml up -d
  ```
- [ ] **Verify Service Health:** Query Docker status to check if container runtimes are in stable `Up` states.
  ```bash
  docker compose -f docker-compose.staging.yml ps
  ```

---

## Part 2: Database and App State Alignment

### 2.1 Database Migrations
- [ ] **Execute Laravel Migrations:** Run pending database migrations on the production Postgres database instance.
  ```bash
  docker compose -f docker-compose.staging.yml exec -T backend-api php artisan migrate --force
  ```
- [ ] **Confirm Table Schema:** Confirm the newly created invoice tables (`saas_invoices`, `invoice_payments`, `invoice_credits_refunds`, `invoice_audits`) are listed in the database.

### 2.2 Database Seeders
- [ ] **Run Core Seeders:** Apply default admin settings, base plans, and reference data.
  ```bash
  docker compose -f docker-compose.staging.yml exec -T backend-api php artisan db:seed --force
  ```

### 2.3 Optimization & Caching
- [ ] **Flush Laravel Caches:** Clear out outdated application cache, config, route, and view caches to avoid runtime configuration drift.
  ```bash
  docker compose -f docker-compose.staging.yml exec -T backend-api php artisan optimize:clear
  ```
- [ ] **Regenerate Route Cache:** Compile fresh configurations for rapid routing performance.
  ```bash
  docker compose -f docker-compose.staging.yml exec -T backend-api php artisan config:cache
  docker compose -f docker-compose.staging.yml exec -T backend-api php artisan route:cache
  ```

---

## Part 3: Routing and Gateway Ingress Verification

### 3.1 Nginx Verification
- [ ] **Test Nginx Syntax:** Validate configuration parameters inside the ingress proxy.
  ```bash
  docker compose -f docker-compose.staging.yml exec -T nginx nginx -t
  ```
- [ ] **Reload Configuration:** Trigger safe configuration reload without dropping active client connections.
  ```bash
  docker compose -f docker-compose.staging.yml exec -T nginx nginx -s reload
  ```

---

## Part 4: API Endpoint and Runtime Verification

### 4.1 System Health check
- [ ] **Query Main Health Endpoint:** Ensure the backend API reports system status `OK` with database and cache connectivity.
  ```bash
  curl -s http://localhost:3000/api/v1/health
  ```

### 4.2 Invoice and Accounts Receivable
- [ ] **Validate Invoice Retrieval:** Verify the accounts receivable data service fetches all current records without errors.
  ```bash
  curl -H "Authorization: Bearer <TOKEN>" -s http://localhost:3000/api/v1/admin/invoices
  ```

### 4.3 Notification Engine
- [ ] **Verify Notifications configurations:** Confirm template settings and routing profiles resolve.
  ```bash
  curl -H "Authorization: Bearer <TOKEN>" -s http://localhost:3000/api/v1/admin/notifications/configurations
  ```

### 4.4 Subscription Center
- [ ] **Verify Platform Pricing Slabs:** Confirm standard modules and pricing structures fetch accurately.
  ```bash
  curl -H "Authorization: Bearer <TOKEN>" -s http://localhost:3000/api/v1/admin/tax-rules
  ```

---

## Part 5: Browser and UI Functional Certification

Log in as `super_admin` in the staging preview env and perform the following checks:

### 5.1 Subscription Center ➔ Invoices
- [ ] Navigate to **Subscription Center** from the sidebar and click on **Invoices**.
- [ ] Ensure the Invoice List loads correctly.

### 5.2 Compile SaaS Invoice
- [ ] Click on the **Compile Custom Invoice** button.
- [ ] Select a tenant, fill in an unique invoice code, base billing amount, select state, and compile.
- [ ] Verify that the invoice is created instantly and reflected in the list with state-based tax calculated (9% CGST + 9% SGST for Karnataka, or 18% IGST for interstate).

### 5.3 Tenant Ledger Dropdown
- [ ] In the invoices view, toggle the **Tenant Ledger** dropdown.
- [ ] Select a specific Tenant Workspace and ensure that only their respective financial transactions, ledger credits, and balance logs load correctly.

### 5.4 Invoice Details Inspector
- [ ] Click on any invoice card to launch the **Invoice Details Inspector**.
- [ ] Ensure that metadata (billing period, plan code, calculated taxes, payment logs, audit trail) displays.

### 5.5 Record Payment
- [ ] Inside the Invoice Inspector, click **Record Payment**.
- [ ] Record a full or partial payment with a specific payment method (e.g., UPI) and reference ID.
- [ ] Verify that the **outstanding balance** and invoice status (`PAID` or `PARTIALLY_PAID`) update immediately.

### 5.6 Send Invoice Dispatch
- [ ] Inside the Inspector, click the **Send Invoice** button.
- [ ] Verify that the notification dispatcher enqueues the email to the mail relay queue and logs it under the active audit trail.

### 5.7 PDF Generation & Print
- [ ] Click the **Download/Print PDF** button.
- [ ] Confirm a dedicated browser printing layout of the invoice is generated with GST breakdowns.
