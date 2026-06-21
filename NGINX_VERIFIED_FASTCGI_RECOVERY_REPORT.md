# NGINX FastCGI Recovery Report — Critical Infrastructure Patch

This recovery report outlines the technical remediation performed on the staging reverse proxy server configuration. All infrastructure fixes have been applied in strict isolation without altering any frontend interfaces, backend application scripts, docker settings, auth models, database migrations, or seeders.

---

## 1. Problem Definition & Root Cause Analysis

In previous staging configurations, the `/api/` routing block was declared with standard static file fallback rules:
```nginx
location ^~ /api/ {
    root /var/www/html/public;
    try_files $uri $uri/ /index.php?$query_string;
}
```

### The Defect:
While the generic `try_files` directive works for matching physical assets, standard NGINX routing under this approach is unable to communicate with PHP-FPM for virtual nested routes under `/api/` when matched directly in that location block. Without explicit parameters instructing NGINX to hand off requests inside `/api/` to the FastCGI process:
* Incoming requests for backend health (`GET /api/v1/system/health`) and authentication (`POST /api/v1/auth/admin/login`) matched the prefix location block but failed to execute the PHP processor under Laravel.
* The server would either drop incoming requests or return generic `404 Not Found` messages, completely blocking workspace initialization and dashboard data queries.

---

## 2. Technical Remediation & FastCGI Configuration

The `/api/` routing block block was replaced with the verified, performance-tuned production configuration. Rather than utilizing simple `try_files` fallback mechanics, NGINX now directly marshals upstream requests to the `laravel_api` PHP-FPM container socket:

```nginx
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

### Key Technical Parameters of the Recovery Block:

1. **`fastcgi_pass laravel_api`**: Connects directly to the `backend-api:9000` upstream layer inside the isolated docker subnet.
2. **`SCRIPT_FILENAME /var/www/html/public/index.php`**: Handshakes all matching `/api/` routes through the primary index execution target for proper Laravel framework booting.
3. **`SCRIPT_NAME /index.php`**: Registers standard internal script names for index mappings.
4. **Required Transmissions (`REQUEST_URI`, `QUERY_STRING`, `REQUEST_METHOD`)**: Transmits incoming metadata directly to the PHP-FPM container, enabling Laravel's router to parse subdomains, route namespaces, and query parameters dynamically.
5. **`fastcgi_buffering off`**: Disables downstream buffer delays, allowing instant streaming of real-time server responses.

---

## 3. Stability & Infrastructure Verification

* **Config Integrity**: The syntax mapping of `nginx.staging.conf` has been validated and complies with standard production configurations.
* **Component Compilation**: The React applet was rebuilt following the patch, logging **successful compilation** without any errors or regressions.
* **Scope Discipline**: Zero changes have been made to application files, preserving the stable, fully active frontend fixes developed in previous turns.
