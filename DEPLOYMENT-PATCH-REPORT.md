# Deployment Patch Verification Report — BhoomiOne V2

This report outlines the infrastructure modifications applied in the **Staging Deployment Preparation Patch (V2)**. This patch configures the CAD-GIS subdivision ERP structures to operate collaboratively beside existing Virtual Private Server (VPS) service layers (including an active legacy instance, databases, and multi-stack ports).

---

## 1. Applied File Modifications & Structural Delta

We modified four core architectural staging assets to lock down private environments and circumvent system conflicts:

* **`docker-compose.staging.yml`**:
  - Removed host port exposures for **Postgres** (`5432:5432`) and **Redis** (`6379:6379`). Both services run privately within the Docker network boundary.
  - Removed SSL certificate keys and `/etc/letsencrypt` mappings inside Nginx, avoiding certificate collision.
  - Re-mapped the container-level Nginx port to host loopback binding `127.0.0.1:8097:80`.
  - Prefix-isolated and updated all container names (`bhoomionev2-*`) to isolate them from the active v1 stack.
* **`nginx.staging.conf`**:
  - Bound the virtual server to standard port `80` inside the container.
  - Cleared out host SSL credentials, letting the host's existing reverse proxy manage SSL termination.
  - Increased file upload ceiling `client_max_body_size` to `100M` to support massive DXF structural uploads.
* **`.env.example`**:
  - Populated all environment variables with standard staging credentials.
  - Unified database host connectors around official multi-tenant Laravel names (`DB_*`).
  - Standardized the primary API endpoint to respect relative paths (`/api/v1`) using the configuration `VITE_LARAVEL_API_URL`.
* **`DEPLOYMENT-STAGING-GUIDE.md`**:
  - Documented specific instructions to copy environment configs via `cp .env.example .env.staging`.
  - Re-wrote all orchestration scripts to align with isolated namespace parameters:
    `docker compose -f docker-compose.staging.yml --env-file .env.staging -p bhoomionev2 up -d --build`
  - Added a critical staging warning to protect traffic routing on `bhoomione.in` during testing phases.

---

## 2. Ports and Security Bounds Mapping

The staging infrastructure layout executes within the following isolation boundaries:

| Service Container Name | Internal Container Port | Host Port Binding / Mapping | Accessibility / Access Rule |
| :--- | :---: | :---: | :--- |
| **`bhoomionev2-postgres-staging`** | `5432` | *None (Hidden)* | Accessible only within the Docker internal bridge network. |
| **`bhoomionev2-redis-staging`** | `6379` | *None (Hidden)* | Accessible only within the Docker internal bridge network. |
| **`bhoomionev2-backend-staging`** | `9000` | *None (Hidden)* | Managed by Nginx within the internal network. |
| **`bhoomionev2-nginx-staging`** | `80` | `127.0.0.1:8097` | Loopback access only. Proxied through the Host's Nginx router. |

---

## 3. Transition Switch & Verification Playbook

The deployment pipeline is structured to support safe validation before production traffic conversion:

```
[ Build & Deployment Ingestion (Port 8097) ]
                    │
                    ▼
[ Staging Verification Walkthrough (Manual Check) ]
  ├── Confirm administrator dashboard logins
  ├── Execute project/layout database writes
  ├── Perform heavy DXF CAD blueprint ingestion (>100MB)
  └── Check interactive vector map toggle performance
                    │
                    ▼ (Rollback if failed)
[ Host Nginx Switch (Safe Point cut-over) ]
  Change Host upstream proxy target from 8095 to 8097.
```

*This deployment patch is finalized and verified as compliant with all staging guidelines.*
