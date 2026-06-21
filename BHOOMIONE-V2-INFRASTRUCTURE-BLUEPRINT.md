# BHOOMIONE V2 INFRASTRUCTURE & DEPLOYMENT BLUEPRINT
**Author**: Lead DevSecOps Architect  
**Status**: Release Candidate  
**Project**: Production Deployment Blueprint & Orchestration Plan  
**Date**: June 19, 2026

---

## 1. Introduction

This blueprint outlines the production hosting structure, virtualized environments, network partitions, domain routes, and deploy pipelines for **BhoomiOne V2**. The core mission of this blueprint is to build an environment that enforces absolute build isolation between the customer portal, developer ERP, platform admin, and consumer marketplace, preventing local compiler leakage and ensuring high operational availability.

---

## 2. Multi-Container Orchestration Architecture

The production platform runs on isolated Docker containers configured within a multi-tiered virtual system. This prevents local process crashes in the Marketplace from affecting the backend transaction system.

```yaml
# deploy/docker-compose.prod.yml
version: '3.8'

services:
  # ────────────────────────────────────────────────────────
  # reverse proxy - central routing gateway
  # ────────────────────────────────────────────────────────
  nginx-proxy:
    image: nginx:1.25-alpine
    container_name: bhoomione-nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/certs:/etc/nginx/certs:ro
      - web-assets-volume:/usr/share/nginx/html:ro
    networks:
      - bhoomione-public-ingress
      - bhoomione-api-internal
    restart: always

  # ────────────────────────────────────────────────────────
  # static single-page-application servers
  # ────────────────────────────────────────────────────────
  web-marketplace:
    image: node:20-alpine
    container_name: bhoomione-web-marketplace
    expose:
      - "3000"
    volumes:
      - ../web-marketplace:/app
    working_dir: /app
    command: sh -c "npm run preview -- --port 3000 --host 0.0.0.0"
    networks:
      - bhoomione-public-ingress
    restart: always

  web-tenant:
    image: node:20-alpine
    container_name: bhoomione-web-tenant
    expose:
      - "3000"
    volumes:
      - ../web-tenant:/app
    working_dir: /app
    command: sh -c "npm run preview -- --port 3000 --host 0.0.0.0"
    networks:
      - bhoomione-public-ingress
    restart: always

  web-admin:
    image: node:20-alpine
    container_name: bhoomione-web-admin
    expose:
      - "3000"
    volumes:
      - ../web-admin:/app
    working_dir: /app
    command: sh -c "npm run preview -- --port 3000 --host 0.0.0.0"
    networks:
      - bhoomione-public-ingress
    restart: always

  # ────────────────────────────────────────────────────────
  # core backend application engine
  # ────────────────────────────────────────────────────────
  backend-api:
    image: php:8.4-fpm-alpine
    container_name: bhoomione-backend-api
    expose:
      - "9000"
    volumes:
      - ../backend-api:/var/www/html:cached
    environment:
      - APP_ENV=production
      - DB_CONNECTION=pgsql
      - DB_HOST=postgresql-db
      - DB_PORT=5432
      - CACHE_STORE=redis
      - QUEUE_CONNECTION=redis
    networks:
      - bhoomione-api-internal
      - bhoomione-database-isolated
    restart: always

  # ────────────────────────────────────────────────────────
  # data stores & auxiliary caching layers
  # ────────────────────────────────────────────────────────
  postgresql-db:
    image: postgres:17-alpine
    container_name: bhoomione-postgresql-db
    expose:
      - "5432"
    volumes:
      - postgres-data-prod:/var/lib/postgresql/data
      - ./postgres/init:/docker-entrypoint-initdb.d:ro
    environment:
      - POSTGRES_DB=bhoomione_master
      - POSTGRES_USER=bhoomione_admin
      - POSTGRES_PASSWORD=BhoomiSecProd2026!!
    command: ["postgres", "-c", "shared_buffers=4GB", "-c", "work_mem=64MB", "-c", "max_connections=500"]
    networks:
      - bhoomione-database-isolated
    restart: always

  redis-cache:
    image: redis:7.2-alpine
    container_name: bhoomione-redis-cache
    expose:
      - "6379"
    volumes:
      - redis-data-prod:/data
    command: redis-server --appendonly yes --maxmemory 1gb --maxmemory-policy allkeys-lru
    networks:
      - bhoomione-api-internal
      - bhoomione-database-isolated
    restart: always

# ────────────────────────────────────────────────────────
# networks & persistence storage topologies
# ────────────────────────────────────────────────────────
networks:
  bhoomione-public-ingress:
    name: bhoomione-public-ingress
    driver: bridge
  bhoomione-api-internal:
    name: bhoomione-api-internal
    driver: bridge
    internal: true
  bhoomione-database-isolated:
    name: bhoomione-database-isolated
    driver: bridge
    internal: true

volumes:
  postgres-data-prod:
    name: postgres-data-prod
  redis-data-prod:
    name: redis-data-prod
  web-assets-volume:
    name: web-assets-volume
```

---

## 3. Physical & Logical Domain Mapping (Nginx Proxies)

Our enterprise reverse proxy handles wildcard subdomain resolutions, automatically injects secure transport layers, and shields underlying ports from physical leakage.

```nginx
# deploy/nginx/conf.d/bhoomione.conf

# ────────────────────────────────────────────────────────
# 1. public marketplace - bhoomione.in / www.bhoomione.in
# ────────────────────────────────────────────────────────
server {
    listen 443 ssl http2;
    server_name bhoomione.in www.bhoomione.in;

    ssl_certificate /etc/nginx/certs/bhoomione_live.crt;
    ssl_certificate_key /etc/nginx/certs/bhoomione_live.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://web-marketplace:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# ────────────────────────────────────────────────────────
# 2. developer portals (dynamic resolved - *.tenant.bhoomione.in)
# ────────────────────────────────────────────────────────
server {
    listen 443 ssl http2;
    server_name ~^(?<tenant>.+)\.tenant\.bhoomione\.in$ tenant.bhoomione.in;

    ssl_certificate /etc/nginx/certs/bhoomione_live.crt;
    ssl_certificate_key /etc/nginx/certs/bhoomione_live.key;

    location / {
        proxy_pass http://web-tenant:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Tenant-Context $tenant;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# ────────────────────────────────────────────────────────
# 3. super admin dashboard - admin.bhoomione.in
# ────────────────────────────────────────────────────────
server {
    listen 443 ssl http2;
    server_name admin.bhoomione.in;

    ssl_certificate /etc/nginx/certs/bhoomione_live.crt;
    ssl_certificate_key /etc/nginx/certs/bhoomione_live.key;

    location / {
        proxy_pass http://web-admin:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# ────────────────────────────────────────────────────────
# 4. backend unified core gateway - api.bhoomione.in
# ────────────────────────────────────────────────────────
server {
    listen 443 ssl http2;
    server_name api.bhoomione.in;

    ssl_certificate /etc/nginx/certs/bhoomione_live.crt;
    ssl_certificate_key /etc/nginx/certs/bhoomione_live.key;

    # restrict asset uploads or massive cad models (maximum 100mb limit)
    client_max_body_size 100M;

    location / {
        fastcgi_pass backend-api:9000;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME /var/www/html/public/index.php;
        fastcgi_param HTTP_X_TENANT_RESOLVE $http_host;
        fastcgi_read_timeout 300;
    }
}
```

---

## 4. CI/CD Orchestration Release Pipeline

To protect the production VPS from accidental build regressions, code updates are processed through an isolated compile pipeline on GitHub Actions. It is strictly forbidden to build local UI assets on the production server.

```yaml
# .github/workflows/bhoomione-pipeline.prod.yml
name: BhoomiOne V2 Production Release Pipeline

on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+' # triggers strictly on version tags (e.g. v2.0.1)

jobs:
  # ────────────────────────────────────────────────────────
  # STAGE 1: quality checks & validation
  # ────────────────────────────────────────────────────────
  lint-and-validate:
    runs-on: ubuntu-latest
    steps:
      - name: Project Checkout
        uses: actions/checkout@v4

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-node: '20'

      - name: Verify Workspace and Run Linter
        run: |
          npm ci
          npm run lint --workspaces --if-present

  # ────────────────────────────────────────────────────────
  # STAGE 2: decoupled frontend construction
  # ────────────────────────────────────────────────────────
  build-frontend-packages:
    needs: lint-and-validate
    runs-on: ubuntu-latest
    steps:
      - name: Project Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Registry (GHCR)
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # build each portal into independent isolated images
      - name: Build Web Marketplace Container
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./deploy/dockerfiles/Dockerfile.marketplace
          push: true
          tags: |
            ghcr.io/bhoomione/web-marketplace:latest
            ghcr.io/bhoomione/web-marketplace:${{ github.ref_name }}

      - name: Build Web Tenant Container
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./deploy/dockerfiles/Dockerfile.tenant
          push: true
          tags: |
            ghcr.io/bhoomione/web-tenant:latest
            ghcr.io/bhoomione/web-tenant:${{ github.ref_name }}

  # ────────────────────────────────────────────────────────
  # STAGE 3: zero-downtime automated deployment
  # ────────────────────────────────────────────────────────
  push-to-infrastructure:
    needs: build-frontend-packages
    runs-on: ubuntu-latest
    steps:
      - name: Fetch Deploy Configs
        uses: actions/checkout@v4

      - name: Authenticate Production Cloud SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PROD_SERVER_IP }}
          username: bhoomi_deploy
          key: ${{ secrets.PROD_SSH_PRIVATE_KEY }}
          passphrase: ${{ secrets.PROD_DECRYPT_PHRASE }}
          script: |
            cd /opt/bhoomione-v2/deploy
            # pull updated standard images
            docker compose -f docker-compose.prod.yml pull
            # run dynamic backward-compatible migrations inside core backend container
            docker compose -f docker-compose.prod.yml run --rm backend-api php artisan migrate --force
            # refresh and restart isolated containers sequentially
            docker compose -f docker-compose.prod.yml up -d --remove-orphans
            # confirm system states are functional
            curl -f https://api.bhoomione.in/api/v1/system/health || exit 1
```

---

## 5. Production Database Tuning Model (PostgreSQL 17)

To ensure smooth operation of heavy GIS coordinate systems alongside transactional financial registers, the PostgreSQL daemon must be tuned beyond standard defaults:

```ini
# deploy/postgres/conf.d/tuning.conf

# ────────────────────────────────────────────────────────
# memory consumption parameters - targeted for 16gb node instance
# ────────────────────────────────────────────────────────
max_connections = 500
shared_buffers = 4GB                    # 25% of total ram
effective_cache_size = 12GB             # 75% of total ram
maintenance_work_mem = 1GB              # speeds up index constructions
work_mem = 64MB                         # prevents disk sweeps for sorting

# ────────────────────────────────────────────────────────
# transaction writing and storage parameters
# ────────────────────────────────────────────────────────
wal_buffers = 64MB
checkpoint_completion_target = 0.9      # balances check pressure
checkpoint_timeout = 15min              # reduces checkpoint overhead
random_page_cost = 1.1                  # configured specifically for ssd/nvme storage arrays

# ────────────────────────────────────────────────────────
# query planner & spatial indices (postgis engine)
# ────────────────────────────────────────────────────────
max_worker_processes = 8                # matches system physical cores
max_parallel_workers_per_gather = 4     # lets postgres use multicore indexing
max_parallel_workers = 8
```

---

## 6. S3 Media Sourcing and Access Architecture

To prevent static storage pools from overflowing the production server's root disk partition, **every media file, CAD extraction, and KYC upload must locate strictly inside S3 Object Storage.**

1.  **Strict Bucket Isolation**: Three distinct AWS S3 buckets are configured inside the AWS workspace:
    *   `bhoomione-public-marketplace` (public cache, image galleries, brochure PDFs, layout base maps)
    *   `bhoomione-private-tenant` (confidential developer bank accounts, agreement copies, survey blueprints)
    *   `bhoomione-private-kyc-vault` (Aadhaar matrices, PAN documents, broker licenses)
2.  **Transient Presigned Access**: All files stored inside private spaces are blocked from direct URI resolution. The backend gateway provides temporary URLs valid for exactly **15 minutes** using safe AWS SDK signatures (`GetPresignedObjectUrl`).
3.  **Cross-Origin Policy (CORS)**: Public and private bucket access models restrict origins strictly to BhoomiOne domain namespaces (`*.bhoomione.in`). Unauthorized request bounds (such as scraping assets on external portals) are discarded at the edge layer.

---

**End of Document**
