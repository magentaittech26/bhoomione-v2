# BhoomiOne V3 — RBAC Deployment Procedures

## 1. Automated Deployment Sequence
When deploying updates to production or staging environments:

```bash
# 1. Run database migrations
php artisan migrate --force

# 2. Synchronize canonical permissions & role templates (Idempotent)
php artisan rbac:sync-permissions

# 3. Audit database integrity
php artisan rbac:audit --fix

# 4. Clear application cache
php artisan cache:clear
```

## 2. Zero-Downtime Guarantee
- `rbac:sync-permissions` performs upserts based on unique permission codes.
- It does **not** truncate tables or delete custom tenant roles.
- Permission caches are safely flushed upon execution.
