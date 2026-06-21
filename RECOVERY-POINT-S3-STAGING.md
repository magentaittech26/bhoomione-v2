# BhoomiOne V2 Staging Environment — Recovery Point Status & Blueprint
**Timestamp**: UTC 2026-06-21 (02:34:08 AM)
**Status**: 🟢 ALL SYSTEMS GREEN & OPERATIONAL
**Verified Subdomains**:
- Marketplace Portal: `http://bhoomione.in/` / `http://127.0.0.1:8097/`
- Admin Dashboard: `http://admin.bhoomione.in/`
- Alpha Portal: `http://bhoomi-alpha.bhoomione.in/`

---

## 1. System Diagnosis & Resolving Architecture
This recovery point captures the exact changes made to restore full functionality and eliminate the HTTP 404 error on `/api/v1/*` routes and HTTP 500 error on `/api/v1/system/health`.

### A. The Nginx API Routing Fix (Solved 404s)
- **Problem**: The raw proxy configuration directly passed FastCGI details but didn't support URL rewrites for deep route paths handled dynamically by Laravel inside `/api/v1/...`.
- **Solution**: Reconfigured `/nginx.staging.conf` so the `/api/` routing block cleanly uses `try_files` with fallbacks passing the query query string directly to Laravel's entry-point.
```nginx
location ^~ /api/ {
    root /var/www/html/public;
    try_files $uri $uri/ /index.php?$query_string;
}
```

### B. Health API Diagnostic Fix (Solved 500s)
- **Problem**: The database driver connection wasn't catching modern PDO throwables cleanly, crashing on a silent database connectivity check, and triggering `database-pgsql` driver lookups which were obsolete.
- **Solution**:
  - Updated the health API handler inside `backend-api/routes/api.php` to use `\Throwable` instead of a restricted `\Exception`, catching connection errors elegantly.
  - Aligned database driver checks to report the server as `DEGRADED` (rather than a hard 500 breakdown) when waiting for seed databases.
  - Updated `backend-api/config/queue.php` configuration driver to fallback precisely to `'database'` instead of `'database-pgsql'` for the failed jobs registry.

### C. Frontend Compilation Delivery
- Created `/Dockerfile.nginx` containing the multi-stage build instructions to cleanly bundle Node.js compilation and transfer React static assets directly to Alpine Nginx `/usr/share/nginx/html`.

---

## 2. Inlined Configuration Backups (Safe Storage)

### `nginx.staging.conf`
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip settings compression for optimal frontend performance
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Maximum file upload limit for heavy CAD/DXF files (Minimum 100MB)
    client_max_body_size 100M;

    upstream laravel_api {
        server backend-api:9000; # Proxying php-fpm inside Docker
    }

    server {
        listen 80;
        server_name localhost;

        # Static assets folder (vite react compilation)
        root /usr/share/nginx/html;
        index index.html;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-Content-Type-Options "nosniff";
        add_header X-XSS-Protection "1; mode=block";

        # API requests proxying
        location ^~ /api/ {
            root /var/www/html/public;
            try_files $uri $uri/ /index.php?$query_string;
        }

        # Handle PHP scripts via FastCGI (Laravel routing)
        location ~ \.php$ {
            root /var/www/html/public;
            fastcgi_pass laravel_api;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            fastcgi_buffering off;
        }

        # Public uploaded file storage paths mapping
        location /storage/ {
            alias /var/www/html/storage/app/public/;
            try_files $uri =404;
        }

        # React Frontend Single Page Application index routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
```

---

## 3. Disasaster Recovery & Deployment Runbook

To recreate, redeploy, or hot-swap staging back to this exact validated snapshot, use the following sequence in `/opt/bhoomione-v2`:

### Step 1: Sync Workspace Configurations
Ensure `nginx.staging.conf` is loaded onto the staging host. You can instantly restore it from the local backup:
```bash
cp nginx.staging.conf.bak nginx.staging.conf
```

### Step 2: Trigger Stage-Based Docker Build
Rebuild backend components and deploy clean container systems:
```bash
sudo docker compose -f docker-compose.staging.yml -p bhoomionev2 build --no-cache
```

### Step 3: Launch Containers
Re-initialize the staging orchestration services in background mode:
```bash
sudo docker compose -f docker-compose.staging.yml -p bhoomionev2 up -d
```

### Step 4: Run Post-Deployment Optimizations
```bash
# 1. Spin up optimized vendors list without dev files
sudo docker compose -f docker-compose.staging.yml -p bhoomionev2 exec backend-api \
composer install --no-interaction --no-dev --optimize-autoloader

# 2. Flush cached bootstrap profiles
sudo docker compose -f docker-compose.staging.yml -p bhoomionev2 exec backend-api \
php artisan optimize:clear

# 3. Soft restart server layers to flush PHP-FPM and Nginx handles
sudo docker compose -f docker-compose.staging.yml -p bhoomionev2 restart backend-api nginx
```

---
**Verify Token Authority Endpoint**:
```bash
curl -i -X POST http://127.0.0.1:8097/api/v1/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bhoomione.in","password":"AdminPassword123!"}'
```
*Expected Result:* HTTP 200 OK with fully populated Platform Super Admin structure and signed Access Token.
