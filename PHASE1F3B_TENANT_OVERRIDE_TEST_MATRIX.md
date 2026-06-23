# PHASE 1F.3B - TENANT OVERRIDE CENTER TEST MATRIX

This document outlines the testing matrix and verification cases for the BhoomiOne SaaS Operations Tenant Override Center. It ensures robust multi-tenant security, zero data loss on database rollbacks, absolute API containment, and a bulletproof frontend UI with clean fallback screens.

---

## 1. Multi-Tenant Segregation & Security Tests

| Test Case ID | Feature / Component | Scenario Description | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Tenant Isolation | Load tenant subscription details for `tenant-a`. | Feature overrides and limits reflect ONLY `tenant-a` settings in the PostgreSQL database. | Verified |
| **SEC-02** | Header Injection | Trigger operations API queries. | Outgoing HTTP requests carry the correct authorization headers (`Authorization: Bearer <token>`) and tenant context. | Verified |
| **SEC-03** | Unauthorized Guard | Attempt to access tenant subscription endpoints without authorization. | Endpoint rejects request with `401 Unauthorized` or `403 Forbidden` status. | Verified |

---

## 2. API Containment & Architecture Compliance Tests

| Test Case ID | Target File / Layer | Scenario Description | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **API-01** | `server/routes/saas.ts` | Search file for Tenant Override POST handlers. | The manual Express routing file contains zero `/subscription/overrides` persistence logic. | Verified |
| **API-02** | `server/db/bootstrap.ts` | Verify table bootstrapping. | No `tenant_billing_overrides` table is initialized or created inside the Express Node.js environment bootstrap. | Verified |
| **API-03** | React Client API | Trace `saveTenantOverrides()` in `api.ts`. | Outgoing requests from the React client target `/admin/tenants/${id}/subscription/overrides` on the locked Laravel endpoint. | Verified |

---

## 3. Database Migration & Rollback Integrity Tests

| Test Case ID | Target Migration | Scenario Description | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **DB-01** | `2026_06_23_000001` Migration | Run migration on pre-existing system with existing `tenant_domains` columns. | Pre-existing columns are dynamically detected; only missing columns are added without altering existing columns or data. | Verified |
| **DB-02** | Migration Rollback | Perform rollback of the lifecycle migration. | Standard `tenant_domains` columns (`domain_name`, etc.) remain fully functional and undamaged. Pre-existing system columns are untouched. | Verified |

---

## 4. Frontend UI Validation & Fallback Handling

| Test Case ID | UI Component | Scenario Description | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UI-01** | `TenantOverridesTab` | Render list of tenants in the selector panel. | Correctly parses `tenant_code` properties; filters and searches operate seamlessly with zero blank screen crashes. | Verified |
| **UI-02** | `TenantOverridesTab` | Select a tenant possessing no active subscription profile. | Displays elegant alert banner reading: `"No active subscription assigned"` alongside interactive primary actions. | Verified |
| **UI-03** | UI Actions | Click `"Apply 14-Day Trial"` button for unlicensed tenant. | Requests the Laravel backend to provision standard Starter plan credentials and automatically reloads the profile. | Verified |
| **UI-04** | UI Actions | Select Standard Plan and click `"Assign Active Plan"`. | Successfully creates an active subscription linkage for the tenant node and resets local input fields cleanly. | Verified |
| **UI-05** | UI Actions | Click `"Close Panel"`. | Resets selection state to `null` and guides the operator back to the clean cluster directory page. | Verified |

---

## 5. End-to-End Operational Validation Script

### Step 1: Pre-requisites Verification
- Ensure linter runs successfully with `npm run lint`.
- Ensure application build is green with `npm run build`.

### Step 2: Tenant Node Operations
1. Open the **SaaS Operations Center** inside the main administrative workspace.
2. Select **Tenant Overrides** tab.
3. Search for an un-provisioned tenant (e.g. `BhoomiTrial`).
4. Verify the screen shows **"No active subscription assigned"** instead of loading endless blank states.
5. Click **"Apply 14-Day Trial"** or choose standard Starter plan and assign.
6. Verify profile reloads, rendering fully active **Feature Flag Overrides**, **Usage Limit Overrides**, **Addon Packages**, and **Custom Contract Billing** parameters.
