# BhoomiOne V3 — Manual QA & Verification Checklist

## 1. Authentication & Permission Baseline
- [x] Login as `owner@dev01.com` (`DEVELOPER_OWNER`). Navigate to Tenant Administration -> Measurement Units. Confirm Create button is visible and active.
- [x] Create a Measurement Unit (`SQFT` / `Square Feet`). Confirm HTTP 201 success response from Laravel.
- [x] Login as a Read-Only user (`READ_ONLY_USER`). Navigate to Measurement Units. Confirm Create button displays Read-Only state or is disabled. Attempting direct API call returns HTTP 403 Forbidden.

## 2. Artisan Commands Verification
- [x] Execute `php artisan rbac:sync-permissions` — Confirm 0 errors and summary report output.
- [x] Execute `php artisan rbac:audit` — Confirm database integrity checks pass.

## 3. Real-time Invalidation
- [x] Change user role in tenant. Confirm updated permissions take effect immediately on subsequent API calls without requiring server restart.
