# Phase 2A — Tenant Projects Management Foundation
## Automated & Manual QA Test Matrix

This matrix details the QA scenarios used to verify the Tenant Projects management module, matching all structural requirements, edge-cases, validation limits, and robust state engines.

---

## 1. System Integration Test Matrix

| Case ID | Feature Sub-module | Scenario Description | Input Vectors / Trigger Action | Expected Outcome / Assertions | State / Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-PROJ-01** | **Read / List Projects** | Load real server projects under resolved tenant context. | Enter active Projects workspace panel on a valid logged-in tenant. | - HTTP trigger GET `v1/projects` is initiated.<br>- Populates the exact listing matching DB rows.<br>- Active counts shown on screen. | **PASSED** |
| **TC-PROJ-02** | **Loading State** | Beautiful visual indicator of high latency or database checks processing. | artifically high latency or custom DB wait loop (toggle `loading = true`). | - Loading spinner with `Querying database engine records` renders inside the table body.<br>- Prevents misclicks or rendering empty arrays incorrectly. | **PASSED** |
| **TC-PROJ-03** | **Empty State** | Clean visual empty panel during filter mismatches. | Input search text parameter `NON_EXISTENT_PROJECT_CODE_ABCD`. | - Table displays `No projects cataloged matching the selected parameters` with a `Building2` custom icon. | **PASSED** |
| **TC-PROJ-04** | **Error state & Retry**| DB offline gracefully handled with in-line rebuild actions. | Terminate local database server or query with a faulty authorization token. | - Beautiful rose alert bar is rendered above.<br>- Table body displays `Failed to query project database` with a custom retry button. | **PASSED** |
| **TC-PROJ-05** | **Create Project** | Creation of a new compliant enterprise real-estate registry. | Fill name=`Grand Meadows`, code=`GM-01`, developer=`Bhoomi Devs`, location=`Pune`. Click Save. | - HTTP POST `v1/projects` delivers valid JSON.<br>- Success banner triggers: `New Project [GM-01] created successfully!`. | **PASSED** |
| **TC-PROJ-06** | **Create Validations** | Prevent submissions with missing mandatory fields. | Leave Name or Code parameter blank in overlay form. Click submit. | - Native browser fields validation halts the request.<br>- Server returns 422 if bypassed; frontend shows beautiful error banner. | **PASSED** |
| **TC-PROJ-07** | **Edit Project** | Modify active structural parameters for an existing cataloged item. | Select Edit on standard row, update RERA No. to `RERA-901`, status to `ACTIVE`. Click Save. | - PUT `v1/projects/{id}` triggers update.<br>- Code column remains disabled/read-only.<br>- Success notification confirms specification update. | **PASSED** |
| **TC-PROJ-08** | **Cascade Deletion** | Safe de-registration with structural warning protections. | Click delete trash icon on selected project row `GM-01`. | - Renders confirmation challenge: `Delete project 'GM-01'? This will recursively cascade all active sub layouts...`<br>- Approving fires DELETE request; list updates. | **PASSED** |
| **TC-PROJ-09** | **Complex Filter suite**| Combine multiple dropdown filters concurrently. | Select location=`Pune`, approval=`APPROVED`, status=`ACTIVE`. | - Grid issues refined database search params.<br>- Showing record counter updates to match exact server feedback limit. | **PASSED** |
| **TC-PROJ-10** | **Search Debouncing** | Input optimization to prevent API query slamming. | Type `MEAD` quickly into global Search. | - Search triggers only after a `400ms` debounce cooldown.<br>- Sends GET query containing `search=MEAD` parameter safely. | **PASSED** |

---

## 2. Dynamic RBAC Security Boundaries

| Test ID | Role Profile | Attempted Action | Pipeline Resolver | Expected Secure Reaction | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-RBAC-SL1** | Tenant Admin | View Projects grid | `projects.view` | Access granted, projects listing matches resolved tenant context. | **PASSED** |
| **TC-RBAC-SL2** | Tenant Admin | Save/Delete Project | `projects.manage` | Operation confirmed. Success message shown. | **PASSED** |
| **TC-RBAC-SL3** | Guest User / Viewer | Change catalog specifications | Missing `projects.manage` | Actions icons hidden or request rejected with `403 Access Forbidden` error. | **PASSED** |
