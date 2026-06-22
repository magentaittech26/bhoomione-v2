# BhoomiOne V2: PHASE 1EB Frontend Deployment Test Matrix

This matrix outlines the test cases and verifications applied to guarantee that the freshly built React Bundle contains the correct components and is rendered appropriately by Nginx on the staging server.

---

## 1. Static Asset Build Audits & Target Elements

We verified that the newly built static bundle accurately compiles and exposes the requested SaaS administrative workflows.

| Test ID | Element / Search Term | Target Component File | Expected Presence in Bundled JS | Validation Status |
| :--- | :--- | :--- | :--- | :--- |
| **BND-01** | `"Module Registry"` | `ModuleRegistryTab.tsx` | **Mandatory** — Must compile to assets. | **PASSED** |
| **BND-02** | `"Plan Feature Matrix"` | `PlanFeatureMatrixTab.tsx` | **Mandatory** — Must compile to assets. | **PASSED** |
| **BND-03** | `"Plot Billing"` | `AddonsBillingTab.tsx` | **Mandatory** — Must compile to assets.| **PASSED** |
| **BND-04** | `"MRR Dashboard"` | `MrrDashboardTab.tsx` | **Mandatory** — Must compile to assets. | **PASSED** |
| **BND-05** | `"Global Parameters"` | `SaaSAdminApp.tsx` | **Mandatory** — Must compile to assets. | **PASSED** |

---

## 2. Docker & Container Ingress Verification Matrix

| Step ID | Target Service | Operations Triggered | Expected Container State | Validation Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DKR-01** | `nginx` (Frontend) | `docker-compose build nginx` | Executes multi-stage build cleanly on top of `Dockerfile.nginx`. | Verifies Node.js compiler exits with code `0`. | **PASSED** |
| **DKR-02** | `nginx` (Frontend) | `docker-compose up -d nginx` | Starts service on port `8097` pointing internal routes to `/usr/share/nginx/html`. | Request index file; check document contains root hash nodes. | **PASSED** |
| **DKR-03** | `nginx` (Assets) | Mount volume check | Does not mount `./dist` from host filesystem anymore. | Overwrite file on host; verify browser does NOT change state. | **PASSED** |

---

## 3. User Interface Rendering & Functional Verification

| Tab ID | UI Heading | Dynamic State Source | Interactive Elements Checked | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TAB-01** | **Tenant Registry** | `GET /api/v1/admin/tenants` | Real-time workspace stats cards and sub-domain networks. | **PASSED** |
| **TAB-02** | **Module Registry** | `GET /api/v1/admin/modules` | Add-New module fields, Core/Billable indicators, and ordering. | **PASSED** |
| **TAB-03** | **Feature Catalog** | `GET /api/v1/admin/modules` (Joined) | Nested features mapping cards linked to parent modules. | **PASSED** |
| **TAB-04** | **Plan Master** | `GET /api/v1/admin/plans` | Active standard tiers (Starter, Growth, Pro, Enterprise) edit tables. | **PASSED** |
| **TAB-05** | **Plan Feature Matrix**| `GET /api/v1/admin/plans` & Matrix | Dynamic checkboxes to instantly lock features to selected tiers. | **PASSED** |
| **TAB-06** | **Usage Limits** | `GET /api/v1/admin/plans` limits | Numerical limit fields (Max plots, layouts, projects) per plan. | **PASSED** |
| **TAB-07** | **Plot Billing** | `GET /api/v1/admin/slabs` | Custom capacity tiers with min/max values and monthly pricing. | **PASSED** |
| **TAB-08** | **Add-ons** | `GET /api/v1/admin/addons` | Micro auxiliary catalog values and independent feature switches. | **PASSED** |
| **TAB-09** | **MRR Dashboard** | Live metrics computations | MRR forecasts, billing distributions, and analytics. | **PASSED** |
| **TAB-10** | **Audit Logs** | Express simulation routes | System access logs, severity alerts, and admin actions ledger. | **PASSED** |
| **TAB-11** | **Global Parameters** | Standard parameters state | Plot size definitions boundaries, fallback parameters fields. | **PASSED** |

---

## 4. Final Security & Decoupling Affirmations
* **Self-Contained assets**: All JS, CSS and layout nodes are bundled cleanly under `/app/dist` within the isolated image context. Zero references to browser `localStorage` or `saas_config` exist in the client assets.
