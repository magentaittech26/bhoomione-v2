# NGINX API Routing Fix Report

This document outlines the final, robust resolution to the `/api/*` routing blockages by reverting to NGINX's standard, high-performance `try_files` internal redirection mechanism.

---

## 1. Problem Identification

In SPRINT 1D/2A, direct FastCGI proxying of `/api/*` endpoints (using manual parameter overrides in a single location block) was implemented to troubleshoot routing issues. However, this caused secondary complications on the VPS:
- **Duplicate FastCGI Parameters**: Appending `include fastcgi_params;` alongside manual `fastcgi_param SCRIPT_NAME /index.php;` overloads sent **duplicate parameters** to PHP-FPM / Laravel.
- **Base URL Resolution Failure**: Depending on the PHP-FPM parser precedence, the Laravel/Symfony request builder detected the request context as having a Base URL of `/api/v1/auth/admin/login`, subtracting it and causing route mismatch (**404 Not Found**) errors.

---

## 2. Definitive Solution

We restored the industry-standard, clean NGINX prefix routing configuration. Instead of manual headers and direct passing, we match the prefix `/api/` with high-preference (`^~`) and delegate formatting cleanly to the PHP handler through an internal redirect:

1. **Prefix Match with `^~`**: All `/api/` incoming traffic triggers the API block.
2. **Standard Internal Fallback**: The NGINX server tests the request against physical files, falling back to `/index.php?$query_string` when no file matches.
3. **Dedicated PHP Block Intersection**: NGINX triggers a new request cycle for `/index.php` which hits the regular expression `location ~ \.php$` block. This natural flow passes exactly **one** clean set of FastCGI headers:
   - **`SCRIPT_FILENAME`**: `/var/www/html/public/index.php`
   - **`SCRIPT_NAME`**: `/index.php`
   - **`REQUEST_URI`**: `/api/v1/auth/admin/login`

This combination forces Laravel/Symfony to correctly resolve the resource path as `/api/v1/auth/admin/login` without base URL conflicts, rendering the routing fully operational.

### Corrected NGINX Configurations (`/nginx.staging.conf`)

```nginx
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
```

---

## 3. Strict Scope Compliance

- **No controllers modified**: All business functions are unaltered.
- **No frontend resources modified**: The React application retains its exact layout and styling.
- **No migrations modified**: Relational databases remain untouched.

All staging API services are now completely operational!
