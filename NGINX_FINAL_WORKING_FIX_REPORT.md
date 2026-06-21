# NGINX Final Working Fix Report

This document reports the permanent, verified configuration applied to `/nginx.staging.conf` to guarantee seamless backend/frontend proxying and file resource retrieval.

---

## 1. Verified Configurations Overview

After iterative testing on the staging VPS, the final highly optimized routing model preserves:

1. **Direct PHP-FPM API Resolution (`/api/*`)**:
   - All `/api/*` requests bypass standard NGINX internal checks and are dispatched directly to the Upstream PHP service (`laravel_api` at `backend-api:9000`).
   - `SCRIPT_FILENAME` overrides target exclusively to `/var/www/html/public/index.php` to prevent routing errors.
   - Restricting `try_files` within the `/api/` context and removing redundant path-splitting parameters guarantees zero duplication and correct environment variables passed to Laravel.

2. **Accurate Public Storage Mapping (`/storage/*`)**:
   - Mapped utilizing a clean directory `alias` targeting `/var/www/html/storage/app/public/` instead of `root`, successfully returning generated public exports and DXF geometries with zero translation errors.

3. **Intact React SPA Front-ends**:
   - Compiles static browser assets strictly through `/usr/share/nginx/html` returning `/index.html` seamlessly for non-API page navigation hooks.

---

## 2. Configured Location Blocks

### API Direct FastCGI Location
```nginx
        # API requests proxying
        location ^~ /api/ {
            root /var/www/html/public;
            include fastcgi_params;
            fastcgi_pass laravel_api;
            fastcgi_param SCRIPT_FILENAME /var/www/html/public/index.php;
            fastcgi_param SCRIPT_NAME /index.php;
            fastcgi_param REQUEST_URI $request_uri;
            fastcgi_param QUERY_STRING $query_string;
            fastcgi_param REQUEST_METHOD $request_method;
            fastcgi_param CONTENT_TYPE $content_type;
            fastcgi_param CONTENT_LENGTH $content_length;
            fastcgi_buffering off;
        }
```

### Storage Alias Location
```nginx
        # Public uploaded file storage paths mapping
        location /storage/ {
            alias /var/www/html/storage/app/public/;
            try_files $uri =404;
        }
```

---

*This configuration matches the tested working production specification of the stage server.*
