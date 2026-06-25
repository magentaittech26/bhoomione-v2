# BhoomiOne SaaS - Phase 1F.12 Test Matrix

This matrix details the QA testing procedures for the Zero-Touch Tenant Provisioning Engine and its real-time monitoring interface.

---

## Test Scenario Group 1: Happy Path Workspace Provisioning

| Test ID | Test Case Title | Input Parameters | Expected Behavior | Verification Metrics |
| :--- | :--- | :--- | :--- | :--- |
| **TC-1.1** | Standard Shared-DB Provisioning | `tenant_code: "infraone"`, `company_name: "InfraOne Ltd"`, `plan_id: [Standard ID]`, `template_code: "starter"`, `enable_demo_data: true` | Fully registers the workspace, creates default roles (Surveyor, Admin), applies Standard limits, and seeds sample plots/bookings. | Job status: `SUCCESS`, Progress: `100%`, workspace active and resolves. |
| **TC-1.2** | Clean Production Workspace Setup | Same as TC-1.1, but `enable_demo_data: false` | Provisions workspace and administrative keys with zero placeholder database records (ready for real client project data). | Job status: `SUCCESS`, database has 0 plots/bookings, fully clean workspace. |
| **TC-1.3** | Dedicated Schema Isolation Provisioning | Same as TC-1.1, but `infrastructure_tier: "DEDICATED"` | Creates workspace with independent dedicated database vault schema mappings. | Schema isolation validates, job log registers dedicated tier. |

---

## Test Scenario Group 2: Error Handlers & Failures (Rollback Engine)

| Test ID | Test Case Title | Input Parameters | Simulated Error | Expected Behavior | Verification Metrics |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-2.1** | Duplicate Subdomain Code | `tenant_code: "infraone"` (already exists) | Code validation checks | Immediately fails with validation error. No database pipeline changes enqueued. | Error Toast displayed in UI, no logs created. |
| **TC-2.2** | Middle-of-Pipeline Failure (Database Error) | Standard input | Inject DB timeout during Step 8 (Applying Features) | The pipeline halts, executes the Rollback Engine in reverse, and deletes all records created in Steps 1-7. | Job status: `FAILED`, database clean, no orphaned records. |
| **TC-2.3** | Unauthorized Domain Mapping | `domain_type: "CUSTOM"`, unverified domain | DNS resolution mock | Pipeline holds at "Validating" or fails with detailed DNS map exception. | Job status: `FAILED`, rollback executes successfully. |

---

## Test Scenario Group 3: Job Queue Admin Actions

| Test ID | Test Case Title | Trigger Action | Expected Behavior | Verification Metrics |
| :--- | :--- | :--- | :--- | :--- |
| **TC-3.1** | Cancel Active Provisioning Job | Click "Cancel" on a job with status `RUNNING` | Safe pipeline interruption. Rolls back created entities and updates status to `CANCELLED`. | Job status: `CANCELLED`, progress halts, workspace resources cleaned. |
| **TC-3.2** | Retry Failed Job | Click "Retry" on a job with status `FAILED` | Re-runs the entire pipeline pipeline starting from Step 1, utilizing identical configuration. | Job status changes to `PROCESSING` -> progresses to `SUCCESS`. |
| **TC-3.3** | Resume Failed Job | Click "Resume" on a job with status `FAILED` | Resumes progress starting exactly from the step that threw the exception, skipping previous success stages. | Job status resets to `PROCESSING` and finishes, bypassing redundant steps. |
