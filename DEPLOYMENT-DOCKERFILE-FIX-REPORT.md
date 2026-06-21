# Deployment Dockerfile Fix Report — BhoomiOne V2

This report details the resolution of the VPS build-blocker issue involving the Laravel target worker service configurations. By defining a production-compliant containerized development footprint within `/backend-api/Dockerfile`, the staging environment can now build all backend application services reliably.

---

## 1. Resolved Issue & Root Cause Analysis

* **Symptom**: During staging builds running `docker compose build` or `up`, the process halted with the following error constraint:
  `target queue-worker: failed to solve: failed to read dockerfile: open Dockerfile: no such file or directory`
* **Cause**: The `docker-compose.staging.yml` specification maps multiple independent services—including `backend-api`, `queue-worker`, and `scheduler`—to compile dynamically from the target directories `./backend-api` using an internal `Dockerfile`. There was no `Dockerfile` present inside that subdirectory.
* **Resolution**: Created a highly optimized production-grade, Alpine-based backend `Dockerfile` inside `/backend-api` to bootstrap Laravel and configure all required spatial dependencies.

---

## 2. Dockerfile Configuration Blueprint

The created `/backend-api/Dockerfile` integrates the following architectural specifications:

* **Base Environment**: `php:8.3-fpm-alpine` provides a lightweight execution container with full security hardening.
* **System Libraries**: Installs core utilities (`git`, `curl`, `libpng-dev`, `libjpeg-turbo-dev`, `libwebp-dev`, `zlib-dev`, `libzip-dev`, `postgresql-dev`, `oniguruma-dev`, `icu-dev`, `icu-libs`, `unzip`, `bash`).
* **Extension Installer**: Integrates the highly reliable `docker-php-extension-installer` script to compile dependencies cleanly, including automated verification post-cleanups.
* **PHP Extensions Library**: Compiles and registers the exact list of requirements for Laravel database transactions, cache hooks, and multi-tenant spatial operations:
  - `pdo`, `pdo_pgsql`, `pgsql` (Database Engine connectivity)
  - `mbstring`, `bcmath`, `intl` (Laravel core utilities)
  - `zip`, `gd`, `exif` (Blueprint blueprint compression and CAD file rendering)
  - `pcntl` (Queue processing processes)
  - `redis` (Internal memory caching and async job dispatch queue)
* **Dependency Manager**: Leverages the official `composer:latest` binary within a clean multi-stage build.
* **Layer Cache Optimization**: Performs a conditional package dependency check, executing `composer install` only when `composer.json` exists in the local workspace context.
* **Work Directory**: Set strictly to `/var/www/html` to mirror the layout targets specified in `nginx.staging.conf`.
* **Access Rules**: Assigns operational permissions for storage folders and bootstrap caching boundaries to the FPM runtime user (`www-data`), setting modes to `775`.
* **Target Ports & Command**: Exposes container port `9000` with the default command execution bound to `php-fpm`.

---

## 3. Staging Docker Compose Handshake Verification

The new Dockerfile compiles seamlessly with the existing `docker-compose.staging.yml` directives:

```yaml
  backend-api:
    build:
      context: ./backend-api
      dockerfile: Dockerfile
    container_name: bhoomionev2-backend-staging

  queue-worker:
    build:
      context: ./backend-api
      dockerfile: Dockerfile
    container_name: bhoomionev2-worker-staging

  scheduler:
    build:
      context: ./backend-api
      dockerfile: Dockerfile
    container_name: bhoomionev2-scheduler-staging
```

All three services leverage the same optimized cached layers, and can be built simultaneously without redundant builds.

---

*Dockerfile fix verified, compiled cleanly, and certified ready for staging.*
