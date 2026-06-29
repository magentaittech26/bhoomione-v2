# BhoomiOne V2 – Enterprise Tenant Lifecycle & Purge Policy

This policy outlines the strict security rules, compliance mandates, and automated workflows governing tenant lifecycles within the BhoomiOne SaaS platform.

---

## 1. Tenant Lifecycle Status States

A workspace tenant transitions through the following discrete operational states:

| Lifecycle Status | Operational State | User Panel Access | Data Retention | DNS Routing |
| :--- | :--- | :--- | :--- | :--- |
| **ACTIVE** | Subscription is active and billed. | **Unlocked** (Full Access) | Preserved | Enabled |
| **SUSPENDED** | Delinquent invoices or manual hold. | **Locked** (Login Disabled) | Preserved | Disabled (Domain routing is disabled) |
| **ARCHIVED** | Contract expired or client left. | **Locked** (Login Disabled) | Preserved (Cold Storage) | Disabled |
| **PENDING_DELETION** | Explicit teardown requested by admin. | **Locked** | Preserved (Retention Hold) | Disabled |
| **DELETED** | Permanently purged from core systems. | **None** (Erased) | Erased (Except Audit Log) | Erased |

---

## 2. Mandatory Security Rules & Constraints

### A. Strict Real Customer Protection
*   **Production customer tenants must NEVER be deleted by standard demo purge actions.**
*   The `DELETE_TENANT` action is strictly reserved for demo/trial workspaces (`DEMO`, `DEVELOPER`, or `TRIAL` tiers).
*   Any attempt to run demo deletion commands against active commercial production tenants is rejected with an **Access Denied** exception.

### B. Two-Factor Authentication & Verification
*   **Double Verification Text Confirmation:** All destructive deletions (`DELETE_TENANT` and `DELETE_REAL`) require typing the exact workspace `tenant_code` as confirmation.
*   **Secure Backup Reference Required:** A production client database cannot be purged without specifying a valid cloud backup location hash (e.g., S3/GCS URL) containing the verified pre-destruction snapshot.

### C. Cool-off Retention Hold
*   When marking a real tenant as `PENDING_DELETION`, a safe retention grace period (7, 14, 30, or 90 days) must be chosen.
*   The system schedules a hard purge date (`deletion_scheduled_at`).
*   The workspace remains in a reversible frozen state until that date has passed.

---

## 3. Audit Logging Requirement
Every action taken against a tenant workspace — whether triggered manually by a Super Admin or automatically by cron schedulers — **MUST write a persistent, immutable audit log entry** with:
1.  **Actor:** The administrator ID who authorized the override.
2.  **Action:** The specific lifecycle verb (e.g., `SUSPEND`, `ARCHIVE`, `PENDING_DELETION`, `PURGE`).
3.  **Tenant:** Target workspace tenant identifier.
4.  **Justification:** The mandatory explanation input by the admin.
5.  **Timestamp:** Precise UTC execution time.

---

## 4. Automated Task Scheduling & Schedulers
The automated `SyncTenantLifecycle` command runs daily to process:
*   **Grace Period Suspensions:** Automatically suspends tenants 3 days after payment failure or expiration.
*   **Retention Hard Purges:** Permanently drops database schemas and associated CAD files once a tenant's scheduled deletion date has passed.
