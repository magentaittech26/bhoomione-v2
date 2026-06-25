# Laravel PHP Production Deployments

This document specifies the server-side tuning, folder permissions, and caching routines executed when deploying the Laravel 12 REST API backend to production Cloud Run environments.

---

## ⚡ Artisan Cache Optimization Scripts

To minimize cold start latencies and database parameters parsing times, the production container entrypoint script triggers standard Laravel configuration caches:

```bash
# Optimize Configuration and Routes Loading
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Secure database schema migrations
php artisan migrate --force
```

---

## 📁 System Folder Permissions

Laravel requires write-access to logs and cache storage elements. The container build mandates:

```bash
# Set secure permissions structures
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
```

---

## ⚙️ PHP FastCGI & FPM Pool Tuning

To process rapid concurrent surveyor uploads and database coordinates parses without timeouts, the PHP-FPM configuration pool is tuned:
* `pm.max_children`: Managed dynamically based on container CPU core availability.
* `pm.max_requests`: Set to `500` to prevent memory leaks in continuous operational loops.
