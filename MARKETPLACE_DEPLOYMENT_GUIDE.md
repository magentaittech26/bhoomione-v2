# Marketplace Production Deployment Guide

Follow these sequential steps to safely deploy the Marketplace module onto production.

## 1. Database Schema Migrations

Run database migrations to alter tables and configure performance indexes.
```bash
# Preview what sql statements will execute (safe dry-run)
php artisan migrate --pretend

# Apply the migrations
php artisan migrate
```

## 2. Queue Configuration

Ensure that high-throughput async workloads are directed to your background worker service:
```bash
# Start queue workers on production container nodes
php artisan queue:work --queue=default,notifications --tries=3 --timeout=60
```

## 3. Caching Optimization

Pre-compile route, config, and view buffers for maximum optimization:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

## 4. Frontend Assets Compile

Build static production SPA files using Vite:
```bash
npm run build
```
Ensure static files are correctly targeted inside your Nginx or reverse proxy layer.
