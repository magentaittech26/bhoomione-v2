# BhoomiOne V2 ERP — Staging VPS Deployment & Infrastructure Guide

This Staging Deployment Guide outlines the engineering manual for commissioning, hosting, configuring, maintaining, and recovering the **BhoomiOne V2 CAD-GIS Subdivision Land ERP** on a crowded VPS already hosting other live systems.

This guide ensures absolute visual and functional parity with local containerized nodes while preventing port and naming conflicts with pre-existing stacks—such as the old BhoomiOne (listening on port 8095) or BuildVault (bound on port 5432).

---

## 1. System Topology Overview

```
                      [ Client Web Browsers ]
                                 │
                                 ▼ (Port 80/443 SSL)
                ┌─────────────────────────────────┐
                │        Host Nginx Router        │
                │     (Port 80/443 SSL Broker)    │
                └────────────────┬────────────────┘
                                 │
                                 ▼ (Proxies to loopback port 8097)
                ┌─────────────────────────────────┐
                │     Docker Nginx Router        │
                │    (Bound to 127.0.0.1:8097)    │
                └────────────────┬────────────────┘
                                 │
       ┌─────────────────────────┴─────────────────────────┐
       ▼ (Requests to /api/*)                              ▼ (Requests to /storage/*)
┌─────────────────────────────────────┐             ┌─────────────────────────────────────┐
│      Laravel PHP-FPM Service        │             │   Nginx Static Asset Storage Link   │
│     (backend-api container @ 9000)  │             │     (Symlinked public volumes)      │
└──────────┬───────────────────────┬──┘             └─────────────────────────────────────┘
           │                       │
           ▼                       ▼
┌───────────────────────┐ ┌───────────────────────┐
│     Postgres DB       │ │      Redis Cache      │
│ (Private to Network)  │ │ (Private to Network)  │
└───────────────────────┘ └───────────┬───────────┘
                                      │
                                      ▼
                          ┌───────────────────────┐
                          │  Laravel Queue Worker │
                          │  (Processes CAD Jobs) │
                          └───────────────────────┘
```

---

## 2. Container Port & Naming Safeguards

To prevent crashes on a VPS that already hosts another environment, our staging deployment operates on these isolated metrics:

* **No Public Port Exposures**: Postgres (`5432`) and Redis (`6379`) are strictly bound **internally** within the Docker private bridge network. Do NOT expose them to the host.
* **Isolated Web Port**: The Docker Nginx instance maps exclusively to `127.0.0.1:8097:80`. Only the Host Nginx reverse proxy can access it.
* **Non-Conflicting Container Names**: All containers use the unique suffix `-staging` backed by the container namespace identifier `bhoomionev2` to avoid namespaces conflicts with the old BhoomiOne instance.

---

## 3. Fresh Staging Setup & Deployment Steps

Follow these steps precisely:

### Step 3.1: Repository Ingestion & Staging Code Placement
Clone or place the codebase into your work directory on the staging host:
```bash
cd /var/www/bhoomionev2
```

### Step 3.2: Configuration Configuration & Setup Files (Staging)
Copy the pre-configured example file into the staging environment file:
```bash
cp .env.example .env.staging
```
Open `.env.staging` and verify configuration:
```bash
nano .env.staging
```
Ensure the variables reflect staging credentials:
* `APP_ENV=staging`
* `APP_DEBUG=false`
* `APP_URL=http://127.0.0.1:8097`
* `DB_DATABASE=bhoomione_v2_staging`
* `DB_USERNAME=bhoomione_v2`
* `DB_PASSWORD=ChangeThisStrongDbPassword2026`
* `REDIS_PASSWORD=ChangeThisStrongRedisPassword2026`
* `VITE_LARAVEL_API_URL=/api/v1`
* `SEED_DEMO_DATA=false`

Now generate a cryptographically secure key within Docker or generate one beforehand:
```bash
# This key is required for hashing sessions and auth payload integrity
openssl rand -base64 32
# Copy and assign this generated key to the APP_KEY field inside .env.staging
```

### Step 3.3: Compile React SPA Production Build
Compile high-performance visual interface assets inside `./dist` before raising Docker containers:
```bash
npm install
npm run build
```

---

## 4. Run Services with Docker Compose

To prevent workspace conflicts, always supply the custom `.env.staging` environment file and assign a dedicated project namespace (`-p bhoomionev2`):

```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging -p bhoomionev2 up -d --build
```

Verify service execution states:
```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging -p bhoomionev2 ps
```

---

## 5. Storage Directory Permissions & Symlinks

To allow massive DXF uploads and SVG compilations without permission bottlenecks:

### A. Assign Active Process Permissions
Standardize host permissions to match Laravel FPM container runtime users:
```bash
sudo chown -R 1000:1000 backend-api/storage backend-api/bootstrap/cache
sudo chmod -R 775 backend-api/storage backend-api/bootstrap/cache
```

### B. Storage Symlinking (Essential Link)
Establish the public symlink inside the core Laravel directories:
```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging -p bhoomionev2 exec backend-api php artisan storage:link
```

---

## 6. DB Migration and Schema Seeding

Initialize multi-tenant spatial tables and seed baseline permissions:

### A. Run Schemas Migration
```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging -p bhoomionev2 exec backend-api php artisan migrate --force
```

### B. Seed Administration Baseline Roles
```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging -p bhoomionev2 exec backend-api php artisan db:seed --force
```

---

## 7. Redis Cache and Queue Worker Management

Asynchronous spatial parsing jobs (vector projection, layer grouping, geometry parsing) rely on background queue processes:

### A. Monitor Worker Logs
```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging -p bhoomionev2 logs queue-worker -f
```

### B. Process Reset & Cache Flush Command
```bash
# Clean cached routing elements
docker compose -f docker-compose.staging.yml --env-file .env.staging -p bhoomionev2 exec backend-api php artisan cache:clear

# Flush staging Redis memory cache safely
docker compose -f docker-compose.staging.yml --env-file .env.staging -p bhoomionev2 exec redis redis-cli -a ChangeThisStrongRedisPassword2026 flushall
```

---

## 8. Staging Verification & Pre-Routing Validation

### ⚠️ CRITICAL WARNING: DNS & Ingress Protection
> **DO NOT** switch the active production URL `bhoomione.in` from port `8095` to `8097` inside your host Nginx configuration until the new system passes all verification routines. 

Keep old traffic routing safely isolated on `8095` during validation.

### Verification Routines on Staging Port 8097:
Directly query the staging web loops via your secure local channel (`curl http://127.0.0.1:8097`) or SSH tunnel to confirm the following metrics operate gracefully:

1. **Admin Login Suite**: Connect and log in with seeded credentials.
2. **Tenant/Sales Login separation**: Confirm strict routing isolates.
3. **Project & Layout Creation**: Verify layout and blueprint database inserts function.
4. **DXF Blueprint Upload**: Ingest a heavy geometry map (verified for uploads over 100MB).
5. **Geometry Extraction & Mapping**: Confirm the queue worker processes polygons correctly.
6. **SVG Map Rendering**: Confirm the SVG interactive viewport layers toggle on and off.

---

## 9. Final Routing Switch (Host Nginx - Optional)

Once you have verified the staging build thoroughly, perform the routing switch on the Host Nginx configuration:

### Step 9.1: Edit Host Nginx Configuration
Open your host-level router settings (typically `/etc/nginx/sites-available/bhoomione.in`):
```nginx
# Locate your proxy_pass line and change upstream target from 8095 to 8097:
location / {
    proxy_pass http://127.0.0.1:8097;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Step 9.2: Validate and Restart Host Nginx
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 10. Fallback Plan & Rollback Playbook

If staging encounters blocking errors mid-migration:

### Playbook 1: Soft Ingress Reversion
If the final switch fails, simply edit the host Nginx config file, change the proxy redirect port back to `8095`, test configurations, and restart Nginx.

### Playbook 2: Soft Database Reset
To undo the last batch of migrations on the staging layout:
```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging -p bhoomionev2 exec backend-api php artisan migrate:rollback
```

To purge staging entirely and return to a fresh database:
```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging -p bhoomionev2 down -v
```
This removes the Postgres volume, paving the way for a fresh deployment loop.
