# Staging & Production Smoke Tests

Smoke tests are executed immediately following any container deployment or server maintenance window to verify the basic health and reachability of the system.

---

## 💨 Standard Smoke Tests Suite

### 1. System Health Checks
Verify general connectivity and server reachability.
* **Command**:
  ```bash
  curl -i https://ais-dev-24iag5ldjbjxtvmxpms3mg-850554405742.asia-southeast1.run.app/api/v1/system/health
  ```
* **Expected Outcome**: HTTP `200 OK` with a JSON payload indicating `{"status": "ok"}`.

### 2. Static Web Assets Reachability
Verify that built React SPA distribution bundles load properly on the user's browser.
* **Check**: Access root URL and verify the login landing page renders successfully with zero console script failures.

### 3. Database Connectivity
Verify that the Laravel server can communicate with PostgreSQL.
* **Check**: Trigger a profile fetching request on `/api/v1/auth/my-profile`. Assert that user metadata and tenant configurations resolve correctly.
