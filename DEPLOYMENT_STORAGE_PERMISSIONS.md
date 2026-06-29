# BhoomiOne V2 – Laravel Storage Permission Hardening Policy

## 1. Overview
In a multi-tenant enterprise system like BhoomiOne V2, the Laravel application relies on write access to its storage and bootstrap caching subdirectories. These directories are:
*   `storage/logs` (application tracing, fallbacks, auditing)
*   `storage/framework/cache/data` (fast queries, session states)
*   `storage/framework/sessions` (active administrator sessions)
*   `storage/framework/views` (compiled Blade layouts)
*   `bootstrap/cache` (compiled routing tables and config files)

During deployments using Docker volumes or bind mounts (e.g., `- ./backend-api:/var/www/html`), host user permission masks can overwrite permissions set during Docker image build time (`RUN chown -R www-data:www-data`). This document describes the automated solution implemented to solve permission issues repeatable across all container environments.

---

## 2. Dynamic Initialization & Startup Entrypoint
Rather than relying on manual shell operations (like `chmod` or `chown`) on the target server, we implemented a self-healing startup entrypoint script:

**File Path:** `/backend-api/docker-entrypoint.sh`

This script executes automatically as the container boot-wrapper prior to starting the PHP-FPM daemon:
1.  **Dynamically creates** all critical folders if missing.
2.  **Applies owners and groups** to `www-data:www-data` recursively.
3.  **Applies read/write/execute flags (`775`)** to verify PHP-FPM can append to log outputs.
4.  **Bypasses root-execution constraints** by using standard user escalation.

---

## 3. Storage Error Handlers for Deliveries
To keep provisioning robust, the workspace creation flow has been hardened against directory failure.

### Fail-Safe Fallbacks:
If the storage directories are temporarily read-only or locks are present, the provisioning service:
1.  **Attempts Laravel Logging:** Normal `Log::info()` logs administrative emails to the database.
2.  **Native PHP Logging Escalation:** If Laravel logging raises `Permission denied` or `RuntimeException`, the error-handling block catches the exception and logs to `error_log` (standard error stream / PHP system log).
3.  **Non-Blocking Deliveries:** It **never** throws an exception back to the client. The administrative console displays URL, Email, and Temporary Password regardless of log file state.

---

## 4. Manual / Standalone Repair (Emergency Procedures)
Should an administrator need to reset permissions on a bare-metal VPS without Docker:
```bash
# Set base workspace paths
cd /path/to/bhoomione-v2/backend-api

# Create missing framework caches
mkdir -p storage/framework/{cache/data,sessions,views} storage/logs bootstrap/cache

# Repair ownership and read/write layers
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```
